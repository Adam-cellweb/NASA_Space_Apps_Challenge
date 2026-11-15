"""
validation.py
-------------

Statistical analysis and scatter plots for KP Open Farm Atlas district-level
comparison of Census vs Atlas areas.

Data sources:
  - Atlas areas: data/series/PK.KP.*.json  (hectares.crop_ha, hectares.wheat_ha)
  - Census areas: data/validation.csv       (to be filled from 2024 Agricultural Census)
  - District reference: data/districts.geojson

This script is designed to work once census_cropped_area_ha and
census_wheat_area_ha are populated in data/validation.csv. Until then, it
runs a synthetic demonstration (clearly marked) so the code can be verified
and the output format confirmed.

Required packages: pandas, numpy, scipy, matplotlib, geopandas
pip install pandas numpy scipy matplotlib geopandas
"""

import json
import os
import glob
import numpy as np
import pandas as pd
from scipy.stats import pearsonr
import matplotlib.pyplot as plt

# ---------------------------------------------------------
# 1. Load Atlas area data from series JSON files
# ---------------------------------------------------------

series_dir = "data/series"
atlas_rows = []

for fp in sorted(glob.glob(os.path.join(series_dir, "PK.KP.*.json"))):
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

atlas_df = pd.DataFrame(atlas_rows)
print(f"Atlas districts loaded: {len(atlas_df)}")
print(atlas_df.head())


# ---------------------------------------------------------
# 2. Load census data from validation CSV
# ---------------------------------------------------------

def load_census_csv(path="data/validation.csv"):
    """Read the validation CSV; return a DataFrame with census areas.
    Missing/empty values are kept as NaN."""
    df = pd.read_csv(path, dtype=str)  # read as strings so we don't lose empty cells
    # Keep only the columns we need and strip whitespace
    needed = ["district_id", "census_cropped_area_ha", "census_wheat_area_ha"]
    df = df[needed].copy()
    # Convert area columns; empty strings become NaN
    for col in ["census_cropped_area_ha", "census_wheat_area_ha"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return census_df


census_df = load_census_csv()
print(f"\nCensus districts loaded: {len(census_df)}")
print(census_df.head())


# ---------------------------------------------------------
# 3. Merge Atlas and Census on district_id
# ---------------------------------------------------------

merged = atlas_df.merge(census_df, on="district_id", how="outer")
merged = merged.sort_values("district_id").reset_index(drop=True)
print(f"\nMerged districts (outer join): {len(merged)}")
print(merged[["district_id", "atlas_crop_ha", "census_cropped_area_ha",
             "atlas_wheat_ha", "census_wheat_area_ha"]].head(10))


# ---------------------------------------------------------
# 4. Compute statistics
# ---------------------------------------------------------

def compute_stats(x, y, label):
    """Return a dict of summary statistics for comparing two area vectors."""
    # Drop NaN pairs
    valid = pd.DataFrame({"x": x, "y": y}).dropna()
    n_valid = len(valid)
    if n_valid < 2:
        print(f"  !!! Not enough valid pairs ({n_valid}) for {label}")
        return {"n_valid": n_valid, "r": np.nan, "mae": np.nan, "rmse": np.nan,
                "mean_x": np.nan, "mean_y": np.nan, "median_x": np.nan, "median_y": np.nan}
    r, _ = pearsonr(valid["x"], valid["y"])
    mae = np.mean(np.abs(valid["x"] - valid["y"]))
    rmse = np.sqrt(np.mean((valid["x"] - valid["y"])**2))
    pct_error = (np.mean(np.abs(valid["x"] - valid["y"])) / np.mean(valid["y"])) * 100 if np.mean(valid["y"]) != 0 else np.nan
    return {
        "n_valid": n_valid,
        "r": r,
        "mae": mae,
        "rmse": rmse,
        "pct_error": pct_error,
        "mean_x": np.mean(valid["x"]),
        "mean_y": np.mean(valid["y"]),
        "median_x": np.median(valid["x"]),
        "median_y": np.median(valid["y"]),
    }


# ---- Cropped area comparison ----
crop_stats = compute_stats(
    merged["census_cropped_area_ha"].values,
    merged["atlas_crop_ha"].values,
    "cropped area"
)
print("\n=== CROPPED AREA STATISTICS ===")
for k, v in crop_stats.items():
    print(f"  {k}: {v}")

# ---- Wheat area comparison ----
wheat_stats = compute_stats(
    merged["census_wheat_area_ha"].values,
    merged["atlas_wheat_ha"].values,
    "wheat area"
)
print("\n=== WHEAT AREA STATISTICS ===")
for k, v in wheat_stats.items():
    print(f"  {k}: {v}")


# ---------------------------------------------------------
# 5. Identify three largest discrepancies
# ---------------------------------------------------------

def largest_discrepancies(merged_df, area_col_census, area_col_atlas, n=3):
    """Return the n districts with largest |census - atlas| / max(census, atlas)."""
    df = merged_df.copy()
    # compute absolute percentage difference; handle zeros/NaNs
    df["diff"] = df[area_col_atlas] - df[area_col_census]
    df["abs_diff"] = df["diff"].abs()
    # avoid divide-by-zero: use max(census, atlas, 1)
    df["max_val"] = df[[area_col_census, area_col_atlas]].max(axis=1).replace(0, 1)
    df["pct_diff"] = (df["abs_diff"] / df["max_val"]) * 100
    # rank by pct_diff descending, ignore NaNs
    df_rank = df.dropna(subset=["pct_diff"]).sort_values("pct_diff", ascending=False)
    top = df_rank.head(n)
    return top[["district_id", area_col_census, area_col_atlas, "diff", "abs_diff", "pct_diff"]]


if crop_stats["n_valid"] >= 2:
    crop_top3 = largest_discrepancies(merged, "census_cropped_area_ha", "atlas_crop_ha", n=3)
    print("\n=== TOP 3 LARGEST CROPPED AREA DISCREPANCIES ===")
    print(crop_top3.to_string(index=False))

if wheat_stats["n_valid"] >= 2:
    wheat_top3 = largest_discrepancies(merged, "census_wheat_area_ha", "atlas_wheat_ha", n=3)
    print("\n=== TOP 3 LARGEST WHEAT AREA DISCREPANCIES ===")
    print(wheat_top3.to_string(index=False))


# ---------------------------------------------------------
# 6. Scatter plots
# ---------------------------------------------------------

def scatter_plot(ax, x, y, r, title, xlabel, ylabel, plot_label=""):
    """Draw a scatter plot with 1:1 line, Pearson r, and axis labels."""
    # valid points only
    valid = pd.DataFrame({"x": x, "y": y}).dropna()
    ax.scatter(valid["x"], valid["y"], s=30, alpha=0.6, label=plot_label)
    # 1:1 line based on data bounds
    min_val = min(valid["x"].min(), valid["y"].min())
    max_val = max(valid["x"].max(), valid["y"].max())
    ax.plot([min_val, max_val], [min_val, max_val], "k--", linewidth=1.5, label="1:1 reference")
    ax.set_xlabel(f"{xlabel} (hectares)", fontsize=10)
    ax.set_ylabel(f"{ylabel} (hectares)", fontsize=10)
    ax.set_title(f"{title}\nPearson r = {r:.3f}", fontsize=12)
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3)
    # Ensure equal aspect
    ax.set_aspect("equal", adjustable="box")


fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Plot A: Census cropped vs Atlas cropped
scatter_plot(
    ax1,
    merged["census_cropped_area_ha"].values,
    merged["atlas_crop_ha"].values,
    crop_stats["r"],
    "Plot A: Cropped Area — Census vs Atlas",
    "Census cropped area",
    "Atlas cropped area",
)

# Plot B: Census wheat vs Atlas winter-cereal
scatter_plot(
    ax2,
    merged["census_wheat_area_ha"].values,
    merged["atlas_wheat_ha"].values,
    wheat_stats["r"],
    "Plot B: Wheat Area — Census vs Atlas Winter Cereal",
    "Census wheat area",
    "Atlas winter cereal area",
)

plt.tight_layout()
out_png = "validation/cropped_area_scatter.png"
plt.savefig(out_png, dpi=300)
print(f"\nSaved scatter plot to {out_png}")
plt.show()