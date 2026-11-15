"""
validation_pure.py
-----------------

Pure-Python (standard library only) version of the Atlas district-level
statistical analysis. Computes Pearson r, MAE, RMSE, identifies top
discrepancies, and generates scatter-plot data — without needing
pandas/numpy/matplotlib.

This is provided so the user can verify the analysis logic and output format
even if the full pandas/numpy/matplotlib packages are not installed.
When those packages are available, switch to validation.py which has more
capable plotting and data handling.

Required: Python 3 standard library only.
"""

import json
import os
import glob
import math
import csv
from statistics import mean, median, stdev
from decimal import Decimal


# ---------------------------------------------------------
# 1. Load Atlas area data from series JSON files
# ---------------------------------------------------------

series_dir = "data/series"
atlas_rows = []

for fp in sorted(glob.glob(os.path.join(series_dir, "PK.KP.*.json"))):
    try:
        with open(fp) as f:
            data = json.load(f)
        district_id = data["district_id"]
        hectares = data.get("hectares", {})
        atlas_rows.append({
            "district_id": district_id,
            "atlas_crop_ha": hectares.get("crop_ha"),
            "atlas_wheat_ha": hectares.get("wheat_ha"),
            "atlas_maize_ha": hectares.get("maize_ha"),
            "atlas_irrigated_ha": hectares.get("irrigated_ha"),
        })
    except Exception as e:
        print(f"Warning: could not read {fp}: {e}")

atlas_df_rows = pd_rows = atlas_rows  # keep name consistent for pure version
print(f"Atlas districts loaded: {len(atlas_rows)}")


# ---------------------------------------------------------
# 2. Load census data from validation CSV (same format as validation.py)
# ---------------------------------------------------------

def safe_float(val):
    """Convert to float if possible; otherwise return None."""
    if val is None:
        return None
    v = val.strip()
    if v == "" or v.upper() == "TODO":
        return None
    try:
        return float(v)
    except ValueError:
        return None


def load_census_csv_pure(path="data/validation.csv"):
    """Read validation CSV; return list of dicts with census areas.
    Empty/non-numeric values (including 'TODO') become None."""
    rows = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "district_id": row.get("district_id", "").strip(),
                "census_cropped_area_ha": safe_float(row.get("census_cropped_area_ha")),
                "census_wheat_area_ha": safe_float(row.get("census_wheat_area_ha")),
            })
    return rows


census_rows = load_census_csv_pure()
print(f"Census districts loaded: {len(census_rows)}")
for r in census_rows[:3]:
    print(f"  {r['district_id']}: crop={r['census_cropped_area_ha']}, wheat={r['census_wheat_area_ha']}")


# ---------------------------------------------------------
# 3. Merge Atlas and Census on district_id
# ---------------------------------------------------------

# Build lookup from atlas
atlas_by_id = {r["district_id"]: r for r in atlas_rows}

# Collect all district IDs from both sources
all_ids = set()
all_ids.update(r["district_id"] for r in atlas_rows)
all_ids.update(r["district_id"] for r in census_rows)

merged = []
for d in sorted(all_ids):
    a = atlas_by_id.get(d)
    c = next((r for r in census_rows if r["district_id"] == d), None)
    merged.append({
        "district_id": d,
        "atlas_crop_ha": a["atlas_crop_ha"] if a else None,
        "atlas_wheat_ha": a["atlas_wheat_ha"] if a else None,
        "census_cropped_area_ha": c["census_cropped_area_ha"] if c else None,
        "census_wheat_area_ha": c["census_wheat_area_ha"] if c else None,
    })

print(f"\nMerged districts: {len(merged)}")


# ---------------------------------------------------------
# 4. Pure-Python statistics helpers
# ---------------------------------------------------------

def pearson_r(x_list, y_list):
    """Compute Pearson correlation coefficient r from two lists.
    Returns None if cannot compute (fewer than 2 valid pairs or zero variance)."""
    # Filter to pairs where both are not None
    pairs = [(x, y) for x, y in zip(x_list, y_list) if x is not None and y is not None]
    n = len(pairs)
    if n < 2:
        return None
    sum_x = sum(x for x, _ in pairs)
    sum_y = sum(y for _, y in pairs)
    sum_xy = sum(x * y for x, y in pairs)
    sum_x2 = sum(x * x for x, _ in pairs)
    sum_y2 = sum(y * y for _, y in pairs)

    denominator = math.sqrt((sum_x2 - sum_x**2 / n) * (sum_y2 - sum_y**2 / n))
    if denominator == 0:
        return None
    r = (sum_xy - sum_x * sum_y / n) / denominator
    return round(r, 6)


def compute_stats(x_vals, y_vals, label):
    """Return dict of summary statistics comparing two area vectors."""
    # valid pairs
    valid_x = [x for x in x_vals]
    valid_y = [y for y in y_vals]
    # Actually we need to pair them by district order; both lists same length from merged
    # Let's re-do: use the merged list's paired values
    pass  # placeholder - real implementation below


def compute_stats_from_merged(merged):
    """Compute statistics from the merged list of dicts (as built above)."""
    # Cropped area
    crop_pairs = [(m["census_cropped_area_ha"], m["atlas_crop_ha"]) for m in merged]
    # Wheat area
    wheat_pairs = [(m["census_wheat_area_ha"], m["atlas_wheat_ha"]) for m in merged]

    # Filter out pairs with None
    crop_valid = [(x, y) for x, y in crop_pairs if x is not None and y is not None]
    wheat_valid = [(x, y) for x, y in wheat_pairs if x is not None and y is not None]

    n_crop = len(crop_valid)
    n_wheat = len(wheat_valid)

    def pearson_from_pairs(pairs):
        n = len(pairs)
        if n < 2:
            return None, 0, 0, 0, 0  # r, mae, rmse, mean_x, mean_y
        sum_x = sum(x for x, _ in pairs)
        sum_y = sum(y for _, y in pairs)
        sum_xy = sum(x * y for x, y in pairs)
        sum_x2 = sum(x * x for x, _ in pairs)
        sum_y2 = sum(y * y for _, y in pairs)
        denom = math.sqrt((sum_x2 - sum_x**2 / n) * (sum_y2 - sum_y**2 / n))
        if denom == 0:
            return None, 0, 0, 0, 0
        r = (sum_xy - sum_x * sum_y / n) / denom
        mae = sum(abs(x - y) for x, y in pairs) / n
        rmse = math.sqrt(sum((x - y)**2 for x, y in pairs) / n)
        mean_x = sum_x / n
        mean_y = sum_y / n
        return round(r, 6), mae, rmse, mean_x, mean_y

    crop_r, crop_mae, crop_rmse, crop_mean_x, crop_mean_y = pearson_from_pairs(crop_valid)
    wheat_r, wheat_mae, wheat_rmse, wheat_mean_x, wheat_mean_y = pearson_from_pairs(wheat_valid)

    # Percentage error (mean absolute % error relative to atlas mean)
    if crop_mean_y != 0:
        crop_pct_err = (crop_mae / crop_mean_y) * 100
    else:
        crop_pct_err = None

    if wheat_mean_y != 0:
        wheat_pct_err = (wheat_mae / wheat_mean_y) * 100
    else:
        wheat_pct_err = None

    return {
        "n_crop_valid": n_crop,
        "r_crop": crop_r,
        "mae_crop": crop_mae,
        "rmse_crop": crop_rmse,
        "pct_err_crop": crop_pct_err,
        "mean_crop_x": crop_mean_x,
        "mean_crop_y": crop_mean_y,
        "n_wheat_valid": n_wheat,
        "r_wheat": wheat_r,
        "mae_wheat": wheat_mae,
        "rmse_wheat": wheat_rmse,
        "pct_err_wheat": wheat_pct_err,
        "mean_wheat_x": wheat_mean_x,
        "mean_wheat_y": wheat_mean_y,
    }


stats = compute_stats_from_merged(merged)
print("\n=== STATISTICS ===")
for k, v in stats.items():
    print(f"  {k}: {v}")


# ---------------------------------------------------------
# 5. Identify three largest discrepancies
# ---------------------------------------------------------

def largest_discrepancies_pure(merged, area_col_census, area_col_atlas, n=3):
    """Return the n districts with largest |atlas - census| / max(atlas, census, 1)."""
    df = []
    for m in merged:
        x = m[area_col_census]  # census
        y = m[area_col_atlas]   # atlas
        if x is None or y is None:
            continue
        diff = y - x
        abs_diff = abs(diff)
        max_val = max(x, y, 1)  # avoid divide-by-zero
        pct_diff = (abs_diff / max_val) * 100
        df.append({
            "district_id": m["district_id"],
            "census": x,
            "atlas": y,
            "diff": diff,
            "abs_diff": abs_diff,
            "pct_diff": pct_diff,
        })
    # sort by pct_diff descending
    df.sort(key=lambda r: r["pct_diff"], reverse=True)
    return df[:n]


if stats["n_crop_valid"] >= 2:
    crop_top3 = largest_discrepancies_pure(merged, "census_cropped_area_ha", "atlas_crop_ha", n=3)
    print("\n=== TOP 3 LARGEST CROPPED AREA DISCREPANCIES ===")
    for row in crop_top3:
        print(f"  {row['district_id']}: census={row['census']}, atlas={row['atlas']}, "
              f"diff={row['diff']:.1f}, pct={row['pct_diff']:.1f}%")

if stats["n_wheat_valid"] >= 2:
    wheat_top3 = largest_discrepancies_pure(merged, "census_wheat_area_ha", "atlas_wheat_ha", n=3)
    print("\n=== TOP 3 LARGEST WHEAT AREA DISCREPANCIES ===")
    for row in wheat_top3:
        print(f"  {row['district_id']}: census={row['census']}, atlas={row['atlas']}, "
              f"diff={row['diff']:.1f}, pct={row['pct_diff']:.1f}%")


# ---------------------------------------------------------
# 6. Generate scatter-plot data (CSV format for later plotting)
# ---------------------------------------------------------

def write_scatter_data_csv(merged, area_col_census, area_col_atlas, filename, label_x, label_y):
    """Write a CSV with columns: district_id, census_area, atlas_area.
    NaN/None values are omitted."""
    rows = []
    for m in merged:
        x = m[area_col_census]
        y = m[area_col_atlas]
        if x is not None and y is not None:
            rows.append({"district_id": m["district_id"], "census": x, "atlas": y})
    with open(filename, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["district_id", "census", "atlas"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    print(f"Wrote scatter data to {filename}")


write_scatter_data_csv(merged, "census_cropped_area_ha", "atlas_crop_ha",
                       "validation/crop_scatter_data.csv",
                       "Census cropped area (ha)", "Atlas cropped area (ha)")

write_scatter_data_csv(merged, "census_wheat_area_ha", "atlas_wheat_ha",
                       "validation/wheat_scatter_data.csv",
                       "Census wheat area (ha)", "Atlas winter-cereal area (ha)")

print("\nDone. Scatter CSV files written for later plotting with Excel/Plotly/.")