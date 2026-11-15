# Scientific Methodology

Document version: `v0.1.0` | Date: `2026-11-14` | Owner: Person 4
Status: **Proposed — pending data contract verification and team sign-off** (section 0 describes the data actually live today)

> Every dataset description below records what the project *specifies* as the intended source. Because the repository contains no actual data yet, all specifications are marked `project_specified_unverified` and must be verified against official documentation before publication. Do not use these descriptions as if they were validated.

---

## 0. What the live site uses today (read this first)

Section 3 (ESA WorldCereal) is **connected**: hectares come from an Earth Engine export (`pipeline/worldcereal_stats.csv`). Section 4 (FAO WaPOR actual ET) is **not connected** in the current public build because it needs Earth Engine credentials in the build. The live data (`data/meta.json`, shown in the page header above) uses:

| Input | In the live build today | Note |
|---|---|---|
| Water demand | FAO-56 Penman-Monteith **reference** ET0, from NASA POWER temperature, humidity, wind, radiation and pressure | Reference ET0 is the demand of a well-watered grass. It is an upper bound on what crops use, so it overstates deficit wherever crops are rainfed, fallow or water-stressed. |
| Rainfall | NASA POWER `PRECTOTCORR` (MERRA-2, 0.5° × 0.625°) | Coarse; may misrepresent mountain rainfall. |
| Land the signal applies to | ESA WorldCereal 2021 v100, **irrigated winter cereals** (active irrigation within the winter-cereal season) | One mapped season (2021), statistics at 100 m. Units with no irrigated winter-cereal area show no data, not a status. |
| Cropland area | ESA WorldCover 2021 class 40 | A different product from WorldCereal, so a cropland figure can be smaller than a winter-cereal figure in some union councils. Both are shown as published, not reconciled. |
| Wheat, maize, irrigated area | ESA WorldCereal 2021 v100 (`wintercereals`, `maize`, `irrigation` products), hectares per area | Map-based estimates for 2021, not census or survey figures and not farm-level. Not validated against ground data here. |

When Earth Engine credentials are present in the build, `build_series.py` also switches water demand to WaPOR actual ET, and records which method it used in `meta.json` and in every series file.

### 0.1 Comparison with history (context only)

Each dekad's deficit is also ranked against the same calendar dekad in 2001–2025:

- **Method.** For every unit and every calendar dekad, `pipeline/build_baseline.py` computes reference ET0 minus rain from NASA POWER daily data with the *same* equations as the live series, for each year 2001–2025. `build_series.py` then reports the percentile of the current deficit among those years (mid-rank for ties, the reported year excluded, at least 20 usable years, otherwise no value).
- **Reading it.** 100 means the largest deficit on record for that dekad at that point, 0 the smallest. "Typical" is the median of the baseline years.
- **What it is not.** It does not change the traffic light and is not a forecast or a drought declaration. It compares like with like only: it is hidden whenever the live method differs from the baseline method (for example WaPOR versus ET0).
- **Presentation setting.** The site words a dekad as "among the driest" at or above `baseline.notable_percentile` (currently 90, the driest decile), and says a red status is "not unusual for this time of year" below it. This is a wording convention, not a scientific classification, and is **pending science-owner sign-off**.
- **Known limits.** Percentiles come from a 25-year sample with coarse-grid weather, so they are approximate and should not be read to the last digit. The third dekad of a month has 8 to 11 days; comparisons are always within one calendar slot, so this does not bias them. Climate trends mean the older years may be less representative.

---

## 1. Project overview

The KP Open Farm Atlas is a public interactive agricultural map of Khyber Pakhtunkhwa, Pakistan, designed to show where crops grow, which areas are irrigated, and the water balance (evapotranspiration minus rainfall) over recent historical dekads. The system supports the intended users (Agriculture Extension Field Assistants, researchers, policymakers) by providing an geographic platform to explore available datasets and their patterns. The Atlas presents **administrative-area-level information** only; it must never claim individual farm-level accuracy or forecasting.

The water-deficit traffic-light classification (green/amber/red) is defined in `docs/thresholds.md` and applied per-dekad over the irrigated winter-cereal analysis mask. All methodological choices are documented here for reproducibility.

---

## 2. Study area: Khyber Pakhtunkhwa

- **Geography:** Province of Khyber Pakhtunkhwa, Pakistan, covering approximately 74,521 km².
- **Administrative levels (as specified):**
  - Province (35 districts).
  - District (approximately 1,000 union councils / UCs).
  - UC-level aggregation for all indicators.
- **Temporal scope:** Six historical dekads (10-day periods), with a focus on November (last ten days of the monsoon/intermonsoon transition). Exact period IDs must come from confirmed metadata, not assumed.
- **Data contract requirement:** Stable UC and district IDs that match across all datasets (WorldCereal, WaPOR, POWER, GADM, census). Boundary mismatch must be documented.

---

## 3. ESA WorldCereal 2021

| Attribute | Value (as specified) | Notes |
|---|---|---|
| **What it measures** | Global annual crop-type map (maize, wheat, other cereals, rice, cotton, vegetables, fallow, etc.) and irrigation status (irrigated vs rainfed) at 10 m resolution. | Crop classification is static (year 2021). Crop mix and irrigation may differ in later periods. |
| **Why it is used** | Provides the crop mask (winter cereals) and irrigated/rainfed label that defines the analysis surface for all water-balance calculations. Without a consistent mask, ET and rainfall cannot be compared over the same area. | The mask must be verified against the analysed period; crops may have rotated. |
| **Spatial resolution** | 10 m (pixel). | Aggregated to UC level via area-weighting. |
| **Temporal resolution** | Annual (single date/reference year 2021). | Not dekadal; the six-dekad water balance must be applied *on top of* this static mask. |
| **Data period** | Calendar year 2021 (or fiscal year as defined by the product). | Must be checked for overlap with the six dekads (likely November 2024 or another period). |
| **Processing requirements** | 1. Reproject to EPSG:4326 (WGS84). 2. Clip to KP boundary (GADM 4.1). 3. Select pixels where `crop_type` = winter cereals AND `irrigation` = irrigated. 4. Compute area-weighted aggregates of ET and rainfall over the selected pixels per UC/dekad. | No decompression or format conversion needed beyond standard GeoTIFF/Cloud-Optimized GeoTIFF. |
| **Advantages** | • Global coverage, consistent classification.<br>• Includes irrigation label (rare in other global products).<br>• 10 m matches modern satellite sensors. | • Crop types are generic; "winter cereals" may need local validation.<br>• Static map may not represent the analysis period.<br>• Irrigation classification may contain error. |
| **Limitations** | • 2021 mask may not match the six dekad period.<br>• "Winter cereals" class may include barley, oat, mixed grains not directly relevant.<br>• Irrigation label is binary; actual irrigation volume is unknown.<br>• No temporal dynamics. | • Must not be used as farm-level proof.<br>• May misclassify rainfed plots as irrigated (or vice versa). |
| **Official source** | European Space Agency, <https://www.esa-worldcereal.org>. | License and attribution must be recorded in `docs/sources.md`. |
| **Licence / attribution** | ESA Open Data licence (typically CC-BY-4.0 or similar; exact version to be confirmed). | Do not assume; verify before use. |

---

## 4. FAO WaPOR v3

| Attribute | Value (as specified) | Notes |
|---|---|---|
| **What it measures** | Actual evapotranspiration (AETI), among other land-surface variables, derived from remote sensing (FAO WaPOR portal). | AET is *actual* ET, not reference ET or crop water requirement. It includes water from rainfall, irrigation, and soil storage. |
| **Why it is used** | Provides dekadal actual ET at fine resolution, the primary input for the water-deficit formula `deficit = ET − rainfall`. | AET ≠ crop water requirement. The comparison with rainfall yields a *balance gap*, not a validated deficit. |
| **Spatial resolution** | 100 m (Level 2) or 250 m (Level 1) per FAO specification. Exact resolution per product version to be confirmed. | Must resample or area-weight to match UC polygons and the WorldCereal mask. |
| **Temporal resolution** | Dekadal (1–10, 11–20, 21–end of month) and monthly. | The Atlas uses six specific dekads; exact period IDs must be confirmed in metadata. |
| **Data period** | Historical (1984–present, depending on satellite sensor). The six dekads to be used must be specified per project period (e.g., November 2024). | Never assume dates; confirm with the data provider or backend. |
| **Processing requirements** | 1. Download dekadal AET tiles for KP extent.<br>2. Reproject to EPSG:4326.<br>3. Clip to UC polygons (GADM 4.1).<br>4. Mask to irrigated winter-cereal pixels from WorldCereal 2021.<br>5. Compute area-weighted mean AET per UC per dekad. | WaPOR provides Python tools (google earth engine or REST); exact code to be written by Person 1. |
| **Advantages** | • Physically based, satellite-derived ET.<br>• Dekadal resolution matches the Atlas design.<br>• Global coverage, free access. | • Actual ET, not reference ET or crop water requirement.<br>• Resolution (100–250 m) coarser than WorldCereal 10 m; aggregation needed.<br>• Cloud cover may affect optical inputs. |
| **Limitations** | • AET includes all water sources; comparing to rainfall alone does not isolate irrigation need.<br>• Resolution may miss small UC fields.<br>• Empirical algorithm; accuracy varies by surface type and climate.<br>• No official KP validation dataset at UC level. | • Do not present AET − rainfall as a confirmed crop water deficit.<br>• Must clearly disclose units, period, and resolution. |
| **Official source** | FAO WaPOR portal, <https://wapor.apps.fao.org>. | License and attribution to be recorded in `docs/sources.md`. |
| **Licence / attribution** | Free to use with FAO citation; exact wording to be confirmed. | Do not assume. |

---

## 5. NASA POWER

| Attribute | Value (as specified) | Notes |
|---|---|---|
| **What it measures** | Daily meteorological and solar parameters (precipitation, temperature, radiation, wind, humidity) on a 0.5° × 0.5° grid. | Precipitation is *daily*; must be aggregated to dekad to match WaPOR. |
| **Why it is used** | Provides the rainfall component for the water-deficit formula. NASA POWER is free, global, and has a stable API; it is the agreed rainfall source for the project. | Daily values must be summed over the exact dekad windows; grid cells do not align with UC boundaries. |
| **Spatial resolution** | 0.5° ≈ 55 km at the equator. | Much coarser than UC or field scale. Aggregation method must be documented and justified. |
| **Temporal resolution** | Daily. | Must be aggregated to the same dekad boundaries as WaPOR (1–10, 11–20, 21–end). |
| **Data period** | Historical (1984–present). The six dekads are project-specified; exact dates must be confirmed. | Never assume; confirm with the backend data service. |
| **Processing requirements** | 1. Query POWER API for daily precipitation over KP extent and the six dekad windows.<br>2. Sum daily values within each dekad.<br>3. Aggregate the summed dekad totals to UC level (area-weighting or grid-cell-union-council overlay).<br>4. Match dekad dates exactly to WaPOR dekad IDs. | POWER API keys are not placed in the static frontend; data must be precomputed or proxied by the backend. |
| **Advantages** | • Free, global, no authentication in the frontend.<br>• Consistent time series, documented methodology.<br>• Includes other parameters (temperature, radiation) if needed later. | • 0.5° resolution is very coarse; a UC may span many grid cells or only a fraction.<br>• Precipitation gauges (PMD) may differ; cross-check required. |
| **Limitations** | • Coarse grid cannot capture orographic variation in KP mountains.<br>• Daily-to-dekad aggregation assumes stationarity within each 10-day window.<br>• May under- or over-catch rainfall in mountainous terrain. | • Must disclose resolution and aggregation method in UI and docs.<br>• Never present as ground-truth; compare with PMD where possible. |
| **Official source** | NASA POWER, <https://power.larc.nasa.gov>. | License/attribution to be recorded in `docs/sources.md`. |
| **Licence / attribution** | NASA POWER data are free for unrestricted use with proper attribution ("NASA POWER). | Do not alter attribution text. |

---

## 6. GADM 4.1 administrative boundaries

| Attribute | Value (as specified) | Notes |
|---|---|---|
| **What it measures** | Polygonal boundaries for countries, first-order (states/provinces), second-order (districts), and third-order (districts or equivalent) administrative units. | Provides the geographic framework onto which all point/raster data are overlayed. |
| **Why it is used** | KP district and UC boundaries are required to: (a) clip ET and rainfall rasters, (b) define the analysis unit for the Atlas, (c) match district names with the 2024 Agricultural Census. | GADM boundaries are public domain but must be checked for alignment with KP government boundaries and census naming. |
| **Spatial resolution** | Vector polygons; resolution depends on the original source (typically 1:250k or finer). | Not a raster resolution; "fineness" of coastlines and borders varies. |
| **Temporal resolution** | Boundaries are as of the GADM release date (4.1, November 2022). | Must record release date; boundaries may not match 2024 census or 2021 crop map exactly. |
| **Data period** | Release November 2022. | Must note that boundary changes after 2022 are not captured. |
| **Processing requirements** | 1. Download GADM 4.1 KP-level geojson.<br>2. Verify that district names match Person 1's district IDs (to be confirmed).<br>3. Extract UC polygons per district.<br>4. Use UC polygons as the clipping/masking geometry for all raster data (WorldCereal, WaPOR, POWER). | Must check for topological errors (slivers, gaps). |
| **Advantages** | • Comprehensive, global, free.<br>• Provides consistent admin level 1–3 structure.<br>• Widely used in GIS pipelines. | • Boundaries may not align with census or other datasets.<br>• May need simplification for map rendering. |
| **Limitations** | • Boundary mismatch with census or WorldCereal can produce "no-data" UCs that are artefacts, not real missing data.<br>• Third-order (UC) boundaries in some countries are less precise. | • Must document any unmatched districts or UCs. |
| **Official source** | GADM, <https://gadm.org>. | Licence: Creative Commons Attribution 4.0 (verify). |
| **Licence / attribution** | GADM CC-BY 4.0 (confirm). | Record exactly. |

---

## 7. Data preprocessing

General pipeline steps (to be implemented by Person 1 in the data-service layer):

1. **Download** all raw files (WorldCereal TIFF/CSV, WaPOR AET tiles, POWER daily precipitation, GADM GeoJSON, census CSVs).
2. **Reproject** all rasters to EPSG:4326 (WGS84). All vector data are already in EPSG:4326 or must be reprojected.
3. **Clip** each raster to the KP boundary (GADM level 1).
4. **Mask** each raster to the irrigated winter-cereal analysis mask (WorldCereal 2021: `crop_type` = winter cereals AND `irrigation` = irrigated).
5. **Aggregate** ET and rainfall to UC level:
   - For each UC polygon, compute the area-weighted mean of the raster values that fall inside the UC *and* inside the analysis mask.
   - Formula: `UC_value = sum(pixel_value * pixel_area_inside_uc) / sum(pixel_area_inside_uc)`.
   - This ensures ET and rainfall describe the same surface.
6. **Align dekads**: Match WaPOR dekad IDs (1–10, 11–20, 21–end) with POWER daily sums. If a WaPOR dekad is `11–20 November`, sum POWER days 11 through 20 of November. Exact mapping must be confirmed from metadata.
7. **Compute deficit**: `deficit_mm = et_mm - rainfall_mm` per UC per dekad.
8. **Apply traffic-light classification** using the rule in `docs/thresholds.md` (section 5).
9. **Flag quality issues**: missing mask area, small pixel count, date misalignment, negative inputs.
10. **Output** series JSON files (one per UC) and a master table for validation.

All steps must be reproducible, versioned, and free of hidden API keys. The data-service layer must own this pipeline; the frontend must never contain raw API URLs or logic that depends on external response formats.

---

## 8. Crop-area calculation

| Step | Description |
|---|---|
| **8.1** | Start from the ESA WorldCereal 2021 global raster. Reproject to EPSG:4326, clip to KP boundary (GADM 4.1 level 1). |
| **8.2** | Select pixels where the WorldCereal `crop_type` attribute equals "winter cereals". The exact attribute value (e.g., "winter_wheat", "winter_barley", "mixed_cereals") must be confirmed against the product legend. |
| **8.3** | Further select pixels where `irrigation` = "irrigated". WorldCereal 2021 includes an irrigation class; verify the exact code values. |
| **8.4** | For each UC, compute total irrigated winter-cereal area in **hectares**: `area_ha = sum(pixel_area_ha * mask_pixel)` where `pixel_area_ha` = 0.01 ha for 10 m pixels. |
| **8.5** | Record `area_ha` per UC per analysis. If `area_ha = 0` or missing → classification is `nodata` (no water-deficit classification). |
| **8.6** | **Important**: The crop mask is static (2021). Crop area may have changed in the analysis period. Document this limitation prominently. |

---

## 9. Irrigated-area calculation

| Step | Description |
|---|---|
| **9.1** | The irrigated-area figure is derived directly from the WorldCereal mask in step 8.3. It is the count of pixels classified as both winter cereals and irrigated, converted to hectares. |
| **9.2** | This area is the denominator for the area-weighting in steps 7 and 10. If `area_ha = 0`, the UC receives `nodata` for all water-balance outputs. |
| **9.3** | **Do not** compute a separate "total irrigated area" that includes non-crop land. The project only analyses *irrigated winter cereals*. |
| **9.4** | If the WorldCereal irrigation classification is binary (irrigated/rainfed), no further breakdown is needed. If finer classes exist, only the "irrigated" class is used. |

---

## 10. Evapotranspiration calculation

| Step | Description |
|---|---|
| **10.1** | Download FAO WaPOR v3 actual ET (AETI) dekadal tiles for the KP extent. |
| **10.2** | Reproject to EPSG:4326. Clip to KP boundary. |
| **10.3** | Mask to the irrigated winter-cereal analysis mask (same mask from WorldCereal). |
| **10.4** | For each UC and each dekad, compute the **area-weighted mean** AET in **mm per dekad**: <br>`uc_et_mm = sum(et_pixel * pixel_area_inside_uc_mask) / sum(pixel_area_inside_uc_mask)` |
| **10.5** | If a UC has fewer than a minimum number of mask pixels (to be agreed; pending decision D-T02), flag the aggregate as low confidence but still compute a value. |
| **10.6** | Record any negative AET values as invalid and set the UC to `nodata` for that dekad. |
| **10.7** | Output one ET value per UC per dekad (six values). |

**Scientific note**: AET already includes water from rainfall and irrigation. The later comparison with rainfall (section 11) yields a balance gap, not a pure irrigation requirement. This must be communicated in the UI and in `docs/thresholds.md`.

---

## 11. Rainfall aggregation

| Step | Description |
|---|---|
| **11.1** | Query NASA POWER daily precipitation for the KP extent and the six dekad windows. |
| **11.2** | Sum daily values within each dekad. If a dekad is `1–10 November`, sum days 1–10 of November. Exact day mapping must match WaPOR dekad IDs. |
| **11.3** | Aggregate the dekad-total rainfall to UC level using the **same area-weighting** as for ET (step 10.4). This is critical: ET and rainfall must describe exactly the same surface and period. |
| **11.4** | If a grid cell spans multiple UCs, proportionally assign the cell's contribution to each UC based on the overlap area between the grid cell and the UC ∩ analysis mask. |
| **11.5** | Record the total rainfall in mm per dekad per UC. |
| **11.6** | **Do not** average rainfall over the whole UC while ET is averaged only over crops; the two must use the same mask (see section 7.5). |

**Known limitation**: POWER 0.5° grid is very coarse relative to UC size and KP's mountainous terrain. Document this in the UI and in `docs/methods.md` section 15.

---

## 12. Water-deficit calculation

| Step | Description |
|---|---|
| **12.1** | For each UC and each dekad: `deficit_mm = et_mm - rainfall_mm`. |
| **12.2** | If either `et_mm` or `rainfall_mm` is missing/null → set deficit to `nodata`; do not impute. |
| **12.3** | If `deficit_mm` is negative → it means rainfall exceeded actual ET. Classify as `green` (no deficit). Do **not** clamp to zero. |
| **12.4** | Apply the traffic-light classification from `docs/thresholds.md` section 5: <br>• `green`: `deficit_mm ≤ 0` <br>• `amber`: `0 < deficit_mm < 30` <br>• `red`: `deficit_mm ≥ 30` |
| **12.5** | **Important**: Classification is only applied when `area_ha > 0` (irrigated winter-cereal mask). If `area_ha = 0` → `nodata`. |
| **12.6** | Round the unrounded deficit for classification; round only to 1 decimal for display. Never reclassify from the rounded value. |

---

## 13. Traffic-light classification

This section formally documents the rule defined in `docs/thresholds.md`. It must not be treated as an independent implementation; the code must read the rule from `data/meta.json` (or the equivalent) so that a version change does not require code edits.

| Category | Condition (unrounded `deficit_mm`) | Action |
|---|---|---|
| `nodata` | `area_ha` is null, <= 0, or ET/rainfall missing | Classification is not defined. UI shows "No data". |
| `green` | `deficit_mm <= 0` | Rainfall meets or exceeds actual ET over the mask. |
| `amber` | `0 < deficit_mm < 30` | Moderate gap. |
| `red` | `deficit_mm >= 30` | Large gap; highest screening priority. |

**Boundary note (section 5 of thresholds.md):** exactly `30.0 mm` is `red`. This resolves the conflict between the initial rule (`red > 30`) and the later proposed rule (`red >= 30`).

**Precedence (section 5.1 of thresholds.md):**
1. Check `area_ha` → `nodata` if insufficient.
2. Check ET / rainfall missing → `nodata`.
3. Check negative inputs → `nodata` + flag.
4. `deficit <= 0` → `green`.
5. `0 < deficit < 30` → `amber`.
6. `deficit >= 30` → `red`.

**Rounding (section 5.2 of thresholds.md):** classify unrounded; display rounded.

**Clamping (section 6.3 of thresholds.md):** never clamp negative deficit to zero.

---

## 14. Spatial and temporal resolution

| Dimension | Value (as specified) | Notes |
|---|---|---|
| **Spatial resolution** | • WorldCereal 2021: 10 m<br>• WaPOR v3 AET: 100 m (L2) or 250 m (L1)<br>• NASA POWER precipitation: 0.5° ≈ 55 km<br>• UC aggregation: final output at union-council level | All inputs are aggregated to the same UC polygon before comparison. The effective resolution is the UC level, but the underlying rasters differ. Must document the aggregation method. |
| **Temporal resolution** | • Six historical dekads (10-day periods).<br>• Exact dates and IDs to be confirmed from metadata.<br>• WaPOR dekads: 1–10, 11–20, 21–end of month.<br>• POWER daily → summed to same dekad windows. | The six dekads are project-specified; they may be November 2024 or another period. Do not assume. |
| **Effective unit of analysis** | Union council (UC) aggregate, not pixel or farm. | This is the level at which all inputs are combined and the traffic-light class is assigned. |
| **Reporting period** | One dekad at a time; the Atlas shows six stacked dekads. Users can select a period via control. | Each dekad is independent; there is no season-long aggregation unless the UI provides it (not in scope unless agreed). |

---

## 15. Data quality and limitations

This section consolidates known issues; it is not a substitute for the validation report (Task 5) or the series quality checks.

| Issue | Description | Mitigation / Communication |
|---|---|---|
| **AET ≠ crop water requirement** | AET is actual ET; it already includes irrigation and soil storage. The gap `ET − rainfall` is a balance, not a validated deficit. | UI tooltip: "ET − rainfall is a water-balance gap, not a crop-water-requirement metric." |
| **Static crop mask (2021)** | WorldCereal 2021 may not represent crop/irrigation status in the analysis period. | Document in UI and methods; flag as assumption. |
| **Coarse rainfall grid** | POWER 0.5° may misrepresent orographic rainfall in KP mountains. | Disclose resolution; where possible, cross-check with PMD station data (not included in baseline). |
| **Boundary mismatch** | GADM UC boundaries may not exactly match WorldCereal pixel counts or census UCs. | Record unmatched UCs; do not infer real missing data from artefacts. |
| **Small mask area** | Some UCs may have very few irrigated winter-cereal pixels, making the area-weighted mean unstable. | Pending decision D-T02: define minimum pixel/area threshold; flag low-confidence UCs. |
| **Dekad misalignment** | If WaPOR and POWER dekad definitions differ (e.g., different "end of month" handling), the deficit is meaningless. | enforce exact day mapping; flag and reject misaligned records. |
| **Negative ET or rainfall** | Indicates data error or artefact; should force `nodata` and flag. | Pipeline step 9.6; report in quality report (Task 5). |
| **No farm-level claim** | A UC class does not describe any individual farm. | Prominent disclaimer in UI and docs. |
| **Six dekads ≠ season** | Do not infer season-long performance, yield, or forecast from six historical dekads. | UI and docs must state "historical snapshot, not forecast." |
| **Threshold uncalibrated** | 30 mm/dekad is a project assumption, not a validated agronomic threshold. | Refer to section 11 (validation plan) and the sign-off requirement. |
| **Missing data = never zero** | Missing ET or rainfall must stay `null`/absent and render as `nodata`, never as `0 mm` or `green`. | Enforce in pipeline; document in UI states. |

---

## 16. Reproducibility

To ensure the pipeline can be reproduced by another team member or re-run after a data update:

1. **All file paths** are relative to the repository root; no absolute paths or environment variables in the frontend.
2. **Configuration file** `config.yaml` (or equivalent) stores:
   - List of dataset IDs and their verified versions.
   - KP bounding box coordinates (from GADM).
   - Dekad date ranges (start/end YYYY-MM-DD for each of the six dekads).
   - Aggregation method description (area‑weighting formula).
   - Threshold rule version (references `data/meta.json` `classification.water_deficit.rule_version`).
3. **Python script** `validation/validation.py` (or equivalent) performs the full pipeline from raw downloads to series JSON output. The script must:
   - Accept a `--overwrite` flag for re‑running.
   - Log the version of each dependency (GDAL, rasterio, pandas, etc.).
   - Output a `manifest.csv` recording for each UC: area_ha, et_mm, rainfall_mm, deficit_mm, class, and any quality flags.
4. **Git history** records all changes to `docs/thresholds.md`, `data/meta.json`, and the pipeline script. Any change to the threshold rule must bump `rule_version` and be accompanied by a sensitivity analysis (see section 11).
5. **No secrets**: NASA POWER and other API data must be pre‑computed or served through a team‑owned proxy; the static frontend must never embed API keys.

A reproducibility checklist (to be kept in `validation/`) should be run before every release:

- [ ] All raw data files present and checksum‑verified.
- [ ] Config file matches the dataset versions in `data/meta.json`.
- [ ] Pipeline script runs without errors.
- [ ] Output series JSON files have correct `generated_at` timestamps.
- [ ] Traffic-light classification follows the rule in `docs/thresholds.md` with the current `rule_version`.
- [ ] Quality flags are present for any `nodata` or low-confidence records.
- [ ] Legend text in `strings.json` matches the current classification rule.
- [ ] `docs/methods.md` and `docs/sources.md` are up‑to‑date.

---

## 17. Scientific references and data attribution

| Dataset | Official source | Licence / attribution (to be confirmed) | Notes |
|---|---|---|---|
| ESA WorldCereal 2021 | <https://www.esa-worldcereal.org> | ESA Open Data licence (typically CC‑BY‑4.0 or similar) | Crop type and irrigation class; verify exact legend values. |
| FAO WaPOR v3 actual ET | <https://wapor.apps.fao.org> | FAO free use with citation ("FAO WaPOR v3 actual evapotranspiration") | AET includes all water sources; not crop water requirement. |
| NASA POWER daily precipitation | <https://power.larc.nasa.gov> | NASA free use with attribution ("NASA POWER") | 0.5° grid; aggregate carefully to UC level. |
| GADM 4.1 administrative boundaries | <https://gadm.org> | CC‑BY‑4.0 (confirm) | Record release date (Nov 2022). |
| Pakistan 2024 Agricultural Census, Table 4 | Pakistan Bureau of Statistics, <https://www.pbs.gov.pk> | Government of Pakistan licence (confirm) | Used for validation only (Task 3). Do not embed census data in the public Atlas unless explicitly approved. |
| **Project‑specific** | — | — | The water‑deficit traffic‑light rule (30 mm boundary) is a project assumption, not a published scientific threshold. Documented in `docs/thresholds.md` and `data/meta.json`. |

> **Never invent references or citations.** If a dataset's technical specification is unknown, record it as `project_specified_unverified` and obtain the official documentation before using the data in any public-facing output.

---

**End of `docs/methods.md`**

This methodology file defines the complete pipeline from raw datasets to traffic‑light classification, with every assumption, limitation, and quality gate explicitly recorded. The next task (Task 3) will produce the census validation CSV and investigate the maize‑variable schema inconsistency noted in the project guide.