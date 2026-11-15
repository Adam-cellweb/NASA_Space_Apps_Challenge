# Water-Deficit Thresholds and Traffic-Light Classification

| Field | Value |
|---|---|
| Document | `docs/thresholds.md` |
| Classification rule | `water_deficit_traffic_light` |
| Rule version | `1.0.0-proposed` |
| Status | **PROPOSED — pending team sign-off** |
| Owner | Person 4 (Science, Validation and Documentation) |
| Consumers | Person 1 (data pipeline), Person 2 (frontend legend), Person 3 (backend/data delivery) |
| Last updated | 2026-11-14 |
| Machine-readable copy | `data/meta.json` |

> This document defines the single authoritative rule for the Atlas traffic-light
> classification. It is not approved until the sign-off table in section 14 is
> completed. Until then, the rule must not be described as scientifically
> validated or as a drought warning.

---

## 1. Purpose

The Atlas converts a continuous water-balance quantity into three screening
classes so that a user can quickly see which union councils (UCs) may deserve
attention. The classes are a **regional screening signal**, not a diagnosis,
warning, forecast, or farm-level measurement.

Thresholds matter because:

- They determine which UCs are shown as green, amber or red.
- A small change in a threshold can change the count of red UCs and therefore
  the number of areas that appear to need a field visit.
- They are a decision parameter, not a physical constant. They must be stable,
  documented, versioned, and changed only with team approval.

The threshold values in this rule are **project assumptions**. No peer-reviewed
calibration for Khyber Pakhtunkhwa winter cereals is claimed here. Section 11
defines the validation needed before the rule can be described as validated.

---

## 2. Scope and unit of analysis

- **Geographic unit:** union council (UC), aggregated from pixels.
- **Analysis mask:** pixels classified as **winter cereals** that are also
  classified as **irrigated** in the project-confirmed crop/irrigation mask
  (ESA WorldCereal 2021, as specified by the project).
- **Not in scope:** individual farms, fields, plots, or households.
- **Temporal unit:** one dekad (10-day period). The Atlas uses six historical
  dekads; the rule is applied independently to each dekad.
- **Water unit:** millimetres (mm). **Area unit:** hectares (ha).
  Millimetres and hectares must never be mixed.

A UC with zero irrigated winter-cereal area must receive `nodata`. It must not
receive a water-deficit class, because the classification is only defined on
that crop/irrigation mask.

---

## 3. Definitions

### 3.1 Evapotranspiration (ET)

Actual evapotranspiration from FAO WaPOR v3, expressed in **mm per dekad**,
area-weighted over the analysis mask.

ET is *actual* ET. It already includes water lost from rainfall, irrigation,
and soil storage. It is **not** crop water requirement and it is **not** a
measurement of unmet crop demand.

### 3.2 Rainfall

Daily precipitation from NASA POWER, summed to the same dekad boundaries as the
ET product, and aggregated over the same analysis mask (or the grid cells that
intersect that mask). Rainfall is expressed in **mm per dekad**.

Daily rainfall must never be compared directly with dekadal ET. Both inputs
must cover exactly the same dates.

### 3.3 Water deficit

```text
deficit_mm = et_mm - rainfall_mm
```

- `deficit_mm > 0`: actual ET exceeds rainfall. The difference was supplied by
  irrigation and/or soil-water storage.
- `deficit_mm <= 0`: rainfall equals or exceeds actual ET. There is no
  rainfall-to-ET gap in that dekad.

This quantity is a **water-balance gap**. It is not proof of crop stress,
yield loss, or a need for a specific irrigation depth. A positive gap on an
irrigated field can simply mean that the field was irrigated.

Recommended UI label: **"Water deficit (ET − rainfall)"**, with a tooltip
stating that ET is actual ET and that the value is an area-level balance.

### 3.4 Dekad

A ten-day period. WaPOR uses 1–10, 11–20, and 21–end-of-month. NASA POWER daily
values must be summed using those same windows. The exact period IDs and dates
must come from confirmed metadata, not from assumptions in the frontend.

---

## 4. Conflicting specifications in the project guide

The project material contains two different boundary rules.

| Source | Green | Amber | Red |
|---|---|---|---|
| Initial specification | Deficit = 0 mm, or rainfall exceeds ET | Deficit 1–30 mm | Deficit > 30 mm |
| Later proposed rule | Deficit = 0 mm, or rainfall exceeds ET | Deficit 1–30 mm | Deficit **30 mm or more** |

The conflict is narrow but real:

1. **At exactly 30.0 mm**, the initial rule says amber and the later rule says
   red.
2. Read as whole numbers, "1–30" leaves `0 < deficit < 1` unclassified.
   Continuous data will produce such values.

This inconsistency must not be resolved silently in code, in the legend, or in
the data pipeline. One rule must be chosen, versioned, and used everywhere:
`docs/thresholds.md`, `data/meta.json`, the website legend, and the series
generator.

---

## 5. Recommended final rule

The recommended rule uses half-open intervals so that every valid value has
exactly one class and there is no gap at zero.

| Status | Condition on unrounded `deficit_mm` | Meaning |
|---|---|---|
| `nodata` | No irrigated winter-cereal area, or ET missing, or rainfall missing, or invalid input | Classification is not defined |
| `green` | `deficit_mm <= 0` | Rainfall meets or exceeds actual ET over the analysis mask |
| `amber` | `0 < deficit_mm < 30` | Moderate rainfall-to-ET gap |
| `red` | `deficit_mm >= 30` | Large rainfall-to-ET gap; highest screening priority |

**Boundary decision:** exactly `30.0 mm` is **red**. Amber is strictly greater
than 0 and strictly less than 30.

This is equivalent to the later project rule ("30 mm or more is red") and
removes the unclassified `0 < deficit < 1` gap. The initial rule can only be
kept if the team explicitly accepts `amber: 0 < deficit <= 30` and
`red: deficit > 30`; that choice must then replace this table everywhere.

### 5.1 Evaluation order (precedence)

The pipeline must evaluate in this order and stop at the first match:

1. If the UC has zero or missing irrigated winter-cereal area → `nodata`.
2. If ET is missing/null or rainfall is missing/null → `nodata`.
3. If ET < 0 or rainfall < 0 → invalid input → `nodata` (and flag the record).
4. If `deficit_mm <= 0` → `green`.
5. If `0 < deficit_mm < 30` → `amber`.
6. If `deficit_mm >= 30` → `red`.

A partial record (one input present, one missing) is `nodata` for the
classification, with a separate quality flag. Missing data must never be
coerced to zero.

### 5.2 Rounding

- Compute the deficit from unrounded inputs.
- Classify the unrounded deficit.
- Round only for display (recommended: one decimal place).
- Never reclassify from the rounded display value. Otherwise `29.96 mm` could
  display as `30.0` but remain amber, which looks inconsistent to users.

### 5.3 Aggregation rule

ET and rainfall must be aggregated over the **same** analysis mask:

- ET: area-weighted mean of dekadal ET over irrigated winter-cereal pixels.
- Rainfall: area-weighted mean of the rainfall grid over the same mask, or the
  documented equivalent used by Person 1.
- Deficit: mean ET minus mean rainfall for that mask.

Rainfall must not be averaged over the whole UC while ET is averaged only over
crops, because the two numbers would then describe different surfaces. The
exact aggregation method must be recorded in `docs/methods.md` and in the
series metadata.

---

## 6. Why these values

### 6.1 Why ET and rainfall are compared

Rainfall is the atmospheric water input. Actual ET is the atmospheric water
output from the crop–soil surface. Their difference shows how much of the
observed ET was not supplied by rainfall during the same dekad. On irrigated
land, that difference is largely supplied by irrigation and soil storage.

### 6.2 Why 30 mm per dekad

- 30 mm per dekad is approximately **3 mm per day**.
- The project's November sanity check expects roughly **15–45 mm per dekad**
  of ET. A 30 mm gap therefore sits inside the plausible seasonal range rather
  than at an extreme.
- It separates a moderate gap from a large gap without claiming a biological
  threshold.

This is a **screening assumption**, not a validated agronomic threshold. The
value must be tested with sensitivity analysis and, where possible, calibrated
against independent observations (section 11).

### 6.3 Why not clamp negative values to zero

A negative balance is meaningful: rainfall exceeded actual ET. Clamping it to
zero would turn a real surplus into a false deficit and would hide information.
Keep the signed value; classify it as green; display it as "no deficit" or as a
surplus, not as `0 mm deficit`.

---

## 7. What each class means

| Status | Means | Does not mean |
|---|---|---|
| `green` | Over the irrigated winter-cereal mask, rainfall was at least as large as actual ET during the dekad. | That the crop is healthy, that no irrigation occurred, or that no future deficit will occur. |
| `amber` | A moderate rainfall-to-ET gap was observed over the mask. | That the crop is stressed or that a specific amount of irrigation is required. |
| `red` | A large rainfall-to-ET gap was observed over the mask. | A drought declaration, a confirmed crop failure, a forecast, or a farm-level warning. |
| `nodata` | The classification is not defined for this UC/dekad. | Zero deficit, zero ET, zero rainfall, or "all clear". |

`red` is a **priority-for-verification** signal. It is not a confirmed hazard.

---

## 8. Scientific assumptions

1. The WorldCereal 2021 crop and irrigation mask is an acceptable proxy for the
   crop/irrigation surface during the analysed dekads. This is an assumption,
   because the mask is static and the water-balance period may be later.
2. WaPOR v3 actual ET is sufficiently accurate at the UC aggregate after
   area-weighting.
3. NASA POWER rainfall is sufficiently representative of the UC after
   aggregation, despite its coarse grid.
4. The same dekad dates and the same analysis mask are used for ET and
   rainfall.
5. A 30 mm per dekad gap is a meaningful screening boundary for this project.
6. UC boundaries and district IDs are stable and correctly matched across all
   datasets.
7. Areas with very small irrigated winter-cereal masks produce unstable
   averages and should be flagged for low confidence.

Each assumption must be revisited in `docs/methods.md` and in the final
scientific audit.

---

## 9. Limitations

- **Actual ET is not crop water requirement.** A positive ET − rainfall value
  does not prove that the crop lacked water; it may have been irrigated.
- **The crop mask is from 2021.** Crop areas, irrigation status and rotations
  can change in later seasons. The mask may not represent the analysed period.
- **Scale mismatch.** Rainfall is coarse relative to a UC; ET and crop masks
  have finer resolutions. Aggregation smooths real spatial variation.
- **Irrigation classification uncertainty.** Rainfed pixels misclassified as
  irrigated, or the reverse, change the mask and therefore the result.
- **Boundary mismatch.** UC boundaries from GADM 4.1 may not match the
  boundaries used by the census or by other datasets.
- **Six dekads are not a season.** The Atlas must not infer season-long
  performance, yield, or future conditions from six historical dekads.
- **Thresholds are uncalibrated.** The 30 mm boundary has not been validated
  against field measurements in KP.
- **No farm-level inference.** A UC class says nothing definitive about any
  individual farm inside that UC.

---

## 10. Data-quality gates

The classifier must reject or flag, not silently absorb, the following:

| Condition | Required behaviour |
|---|---|
| Irrigated winter-cereal area = 0 ha | `nodata`; no classification |
| Irrigated winter-cereal area missing/null | `nodata`; flag missing area |
| ET missing/null | `nodata`; flag missing ET |
| Rainfall missing/null | `nodata`; flag missing rainfall |
| ET < 0 or rainfall < 0 | `nodata`; flag invalid value |
| Rainfall > ET | `green`; not an error |
| Deficit exactly 30.0 mm | `red` under this rule |
| Very small crop mask | Classify, but set a low-confidence flag (minimum area/pixel rule to be agreed) |
| Dekad dates do not match between ET and rainfall | Reject the record; flag date misalignment |
| Source or `generated_at` missing | Flag metadata error |

Missing values stay `null`/absent. They are never replaced with `0`.

---

## 11. Validation and calibration plan

The rule cannot be called validated until at least the following are done and
documented:

1. **Sensitivity analysis:** recompute class counts at 20, 30 and 40 mm per
   dekad and report how many UCs change class.
2. **Rainfall cross-check:** compare NASA POWER dekadal totals with PMD station
   observations where available.
3. **Irrigation cross-check:** compare Atlas irrigated area with the 2024
   Agricultural Census irrigated area at district level.
4. **Independent water observations:** calibrate against IWMI soil-moisture
   sensors or other approved field data if they become available.
5. **Uncertainty reporting:** report the number and share of `nodata` UCs and
   low-confidence UCs alongside the class counts.
6. **No result tuning:** thresholds must not be adjusted to improve correlation
   with the census or to make the map look better.

Until then, the website must describe the classes as an **experimental
screening classification based on project assumptions**.

---

## 12. Legend and interface copy

Person 2 should render the legend from these keys rather than hardcoding text.
Translations will be supplied in `strings.json` (Task 7).

| Key | English text |
|---|---|
| `legend.title` | Water deficit (ET − rainfall) |
| `legend.subtitle` | Irrigated winter cereals · last ten days |
| `legend.green` | No deficit |
| `legend.green.description` | Rainfall meets or exceeds actual ET over the irrigated winter-cereal area. |
| `legend.amber` | Moderate deficit |
| `legend.amber.description` | Actual ET exceeds rainfall by more than 0 mm and less than 30 mm. |
| `legend.red` | Large deficit |
| `legend.red.description` | Actual ET exceeds rainfall by 30 mm or more. |
| `legend.nodata` | No data |
| `legend.nodata.description` | No irrigated winter-cereal area, or ET/rainfall is unavailable for this area and period. |
| `legend.unit` | mm per dekad |
| `legend.disclaimer` | Area-level screening signal, not a farm-level measurement, forecast or drought warning. |

The legend must show the unit, the period, the data sources, and the
`nodata` state. Colour must not be the only signal: include text labels or
icons for accessibility.

---

## 13. Implementation contract

The machine-readable rule lives in `data/meta.json` under
`classification.water_deficit`. Required fields:

- `rule_id`: `water_deficit_traffic_light`
- `rule_version`: `1.0.0-proposed` (becomes `1.0.0` after sign-off)
- `formula`: `deficit_mm = et_mm - rainfall_mm`
- `thresholds_mm.amber_lower_exclusive`: `0`
- `thresholds_mm.red_lower_inclusive`: `30`
- `status_values`: `["green", "amber", "red", "nodata"]`
- `precedence`: ordered list of the gates in section 5.1
- `rounding`: compute and classify unrounded; round for display only

Reference pseudocode:

```text
if area_ha is null or area_ha <= 0: return "nodata"
if et_mm is null or rainfall_mm is null: return "nodata"
if et_mm < 0 or rainfall_mm < 0: return "nodata"   # flag invalid
d = et_mm - rainfall_mm
if d <= 0: return "green"
if d < 30: return "amber"
return "red"
```

Any implementation that uses `d > 30` for red, or `d <= 30` for amber, is
using a different rule version and must be rejected in review.

---

## 14. Sign-off

The rule is not final until this table is completed. The decision required is:

> **At exactly 30.0 mm, is the class red (recommended) or amber?**

| Role | Person | Decision | Date |
|---|---|---|---|
| Science / validation owner | Person 4 | Proposed red at `>= 30` | 2026-11-14 |
| Data pipeline owner | Person 1 | Pending | — |
| Frontend / legend owner | Person 2 | Pending | — |
| Backend / data delivery owner | Person 3 | Pending | — |
| Team lead / scientific reviewer | — | Pending | — |

After sign-off:

1. Change `rule_version` to `1.0.0` in `data/meta.json`.
2. Change `document_status` to `approved`.
3. Record the decision in `AGENTS.md` change log.
4. Confirm the legend text in `strings.json` matches this rule.

---

## 15. References and attribution

This document defines a project rule. It does not introduce a new published
threshold.

- FAO WaPOR v3 — actual evapotranspiration product. Official portal:
  <https://wapor.apps.fao.org>. Product version, resolution and licence must be
  recorded in `docs/methods.md` and `docs/sources.md`.
- NASA POWER — daily precipitation. Official portal:
  <https://power.larc.nasa.gov>. Aggregation and attribution details must be
  recorded in `docs/methods.md` and `docs/sources.md`.
- ESA WorldCereal 2021 — crop and irrigation mask. Official portal:
  <https://www.esa-worldcereal.org>. Mask version and irrigation-class
  definition must be verified before use.
- GADM 4.1 — administrative boundaries. Official portal:
  <https://gadm.org>. Licence restrictions must be recorded.
- Pakistan Bureau of Statistics, 2024 Agricultural Census — validation
  reference. Official portal: <https://www.pbs.gov.pk>. Table and definition
  details must be recorded in `validation/validation_report.md`.

Dataset specifications are not asserted here beyond what the project has
provided. They must be verified against official documentation before
publication.
