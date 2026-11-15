#!/usr/bin/env python3
"""Build the 25-year climatological baseline used for "how unusual is this dekad".

For every unit (district and tehsil) and every calendar dekad of the year (36 slots),
this stores the water deficit (reference ET0 minus rain, mm) of each year 2001-2025,
computed with exactly the same method as build_series.py so a percentile is
comparing like with like.

    python3 build_baseline.py [--first 2001] [--last 2025] [--workers 4]

Reads   cache/boundaries/centroids.csv           (prepare_boundaries.py)
Caches  cache/power_baseline/<id>.json           (raw NASA POWER, not committed)
Writes  baseline/dekad_deficit.json              (compact, committed, ~1 MB)

The raw download is large and never changes, so only the compact result is committed.
CI therefore never refetches 25 years; it only reads baseline/dekad_deficit.json.

Slot index: (month - 1) * 3 + (0, 1, 2) for days 1-10, 11-20, 21-end. The third
dekad of a month has 8 to 11 days, so a deficit is a sum over a slightly different
number of days in different months; comparisons are only ever made within one slot.
A slot-year is stored as null when more than two of its days lack data.
"""
import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

from et0 import et0_daily
from fetch_power import PARAMS, fetch_point

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache", "power_baseline")
OUT = os.path.join(HERE, "baseline", "dekad_deficit.json")
MAX_MISSING = 2


def slot_of(d):
    return (d.month - 1) * 3 + (0 if d.day <= 10 else 1 if d.day <= 20 else 2)


def load_centroids(path):
    import csv
    with open(path, encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def fetch_cached(p, first, last):
    path = os.path.join(CACHE, f"{p['id']}.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            old = json.load(fh)
        if old.get("first") == first and old.get("last") == last and old.get("parameters") == PARAMS:
            return old["daily"]
    daily = fetch_point(float(p["lon"]), float(p["lat"]), date(first, 1, 1), date(last, 12, 31))
    os.makedirs(CACHE, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"id": p["id"], "first": first, "last": last, "parameters": PARAMS, "daily": daily}, fh)
    return daily


def slot_deficits(daily, lat, first, last):
    """{year: [36 values]} of ET0 - rain per calendar dekad, or None where data are missing."""
    out = {}
    for year in range(first, last + 1):
        sums = [[0.0, 0.0, 0, 0] for _ in range(36)]  # rain, et0, rain_missing, et_missing
        day, end = date(year, 1, 1), date(year, 12, 31)
        while day <= end:
            key = day.strftime("%Y%m%d")
            s = sums[slot_of(day)]
            r = daily["PRECTOTCORR"].get(key)
            if r is None:
                s[2] += 1
            else:
                s[0] += r
            e = et0_daily(daily["T2M_MAX"].get(key), daily["T2M_MIN"].get(key), daily["RH2M"].get(key),
                          daily["WS2M"].get(key), daily["ALLSKY_SFC_SW_DWN"].get(key), daily["PS"].get(key),
                          lat, int(day.strftime("%j")))
            if e is None:
                s[3] += 1
            else:
                s[1] += e
            day += timedelta(days=1)
        out[year] = [None if (s[2] > MAX_MISSING or s[3] > MAX_MISSING) else round(s[1] - s[0], 1)
                     for s in sums]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--centroids", default=os.path.join(HERE, "cache", "boundaries", "centroids.csv"))
    ap.add_argument("--first", type=int, default=2001)
    ap.add_argument("--last", type=int, default=2025)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    points = load_centroids(args.centroids)
    if args.limit:
        points = points[: args.limit]
    units, failed = {}, []

    def work(p):
        daily = fetch_cached(p, args.first, args.last)
        table = slot_deficits(daily, float(p["lat"]), args.first, args.last)
        years = list(range(args.first, args.last + 1))
        # slots[s] is the list of values for years first..last, aligned by index
        return p["id"], [[table[y][s] for y in years] for s in range(36)]

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futs = {ex.submit(work, p): p for p in points}
        for i, fut in enumerate(as_completed(futs), 1):
            p = futs[fut]
            try:
                uid, slots = fut.result()
                units[uid] = slots
            except Exception as exc:  # noqa: BLE001
                failed.append(p["id"])
                print(f"{p['id']} FAILED: {exc}", file=sys.stderr, flush=True)
            if i % 10 == 0 or i == len(points):
                print(f"[{i}/{len(points)}] ok {len(units)}, failed {len(failed)}", flush=True)

    if failed:
        sys.exit(f"{len(failed)} points failed; not writing a partial baseline: {failed[:5]}")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({
            "method": "fao56_power",
            "description": "Reference ET0 (FAO-56 Penman-Monteith) minus rain, mm per calendar dekad, from NASA POWER daily data",
            "first_year": args.first, "last_year": args.last,
            "slot": "(month-1)*3 + 0/1/2 for days 1-10 / 11-20 / 21-end",
            "units": units}, fh, separators=(",", ":"))
    print(f"wrote {OUT}: {len(units)} units, {args.first}-{args.last}, {os.path.getsize(OUT) // 1024} KiB")


if __name__ == "__main__":
    main()
