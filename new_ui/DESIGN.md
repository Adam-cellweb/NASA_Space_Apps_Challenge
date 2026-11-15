---
name: Orbital Agricultural Observatory
colors:
  surface: '#f8f9ff'
  surface-dim: '#d6dae4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4fe'
  surface-container: '#eaeef8'
  surface-container-high: '#e4e8f2'
  surface-container-highest: '#dee2ed'
  on-surface: '#171c23'
  on-surface-variant: '#434652'
  inverse-surface: '#2c3138'
  inverse-on-surface: '#edf1fb'
  outline: '#747783'
  outline-variant: '#c4c6d3'
  surface-tint: '#345baf'
  primary: '#002869'
  on-primary: '#ffffff'
  primary-container: '#0b3d91'
  on-primary-container: '#8dadff'
  inverse-primary: '#b1c5ff'
  secondary: '#4a5d8e'
  on-secondary: '#ffffff'
  secondary-container: '#b5c8ff'
  on-secondary-container: '#3f5383'
  tertiary: '#5e0600'
  on-tertiary: '#ffffff'
  tertiary-container: '#870d00'
  on-tertiary-container: '#ff907b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001947'
  on-primary-fixed-variant: '#144296'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b2c5fd'
  on-secondary-fixed: '#001946'
  on-secondary-fixed-variant: '#324575'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a6'
  on-tertiary-fixed: '#3f0300'
  on-tertiary-fixed-variant: '#900f00'
  background: '#f8f9ff'
  on-background: '#171c23'
  surface-variant: '#dee2ed'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  telemetry-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.02em
  telemetry-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The visual identity fuses the cold, calculated precision of an aerospace mission operations deck with the tangible, soil-grounded clarity of a regional field atlas. Created for high-stakes agrotechnological telemetry, the interface treats satellite observation data as an operational imperative. 

The aesthetic is functional, rigorous, and restrained:
- **Scientific Instrument Precision:** Visuals mimic telemetry dashboards and cartographic survey systems rather than generic SaaS dashboards. 
- **Subtle Cartographic Overlays:** Fine structural coordinate crosshairs, hairline division lines, and subtle alignment matrices evoke geospatial surveying.
- **Strict Visual Discipline:** NASA Red is reserved entirely for operational hazards, anomalies, or system-critical telemetry. Non-critical states rely on muted grays and calibrated greens/ambers to maintain an analytical baseline.
- **High Legibility & Multilingual Balance:** Engineered from the ground up to support high-density Latin numerical telemetry alongside balanced, dignified Nastaliq and Naskh scripts for regional field stations in Khyber Pakhtunkhwa.

## Colors
The palette utilizes NASA’s historic identity, rooted in deep planetary blues and sharp observational neutrals, optimized for WCAG AA compliance.

### Palette Architecture
- **Command Shell & Surfaces:** The macro frame features Deep Navy (`#061F4D`) and NASA Blue (`#0B3D91`), while analytical data surfaces default to crisp daylight viewing with Paper (`#F4F6F9`) and pure Surface (`#FFFFFF`).
- **Telemetry Ink:** Dominant metrics and typography use Ink (`#0F141B`), secondary labels use Ink-2 (`#39414D`), and technical meta/coordinates use Muted Ink (`#677485`). Structural dividers rely on Line (`#E1E6ED`).
- **Telemetry & Critical Thresholds:**
  - **Nominal / Optimal:** Field Green (`#15803D`)
  - **Advisory / Moisture Deficit:** Soil Amber (`#D97706`)
  - **Critical Anomaly:** Hazard Red (`#C2250F`)
  - **Telemetry Loss / Unmapped:** No-Data Slate (`#94A3B8`) rendered with a 45° diagonal hairline hatching.
- **Operational Alarm Accent:** NASA Red (`#FC3D21`) is restricted to orbital sync errors, sensor malfunctions, and immediate field risk alerts.
- **Cartographic Data Series:** Evapotranspiration / crop water demand maps to NASA Blue (`#0B3D91`); precipitative telemetry maps to Steel (`#7C93AD`).

## Typography
Typography is treated as instrumentation. Inter provides structural neutrality and dense legibility across low-bandwidth environments.

### Telemetry & Tabular Figures
- Any metric, index value (NDVI, soil moisture, ET deficit), or coordinate string must enforce `font-feature-settings: "tnum" 1, "cv05" 1`. This aligns numeric values across updating feeds and visual data ledgers without lateral jitter.

### Regional Typography (Urdu & Pashto)
- For regional agricultural extensions, Urdu runs in Noto Nastaliq Urdu (scaled to 115% baseline compensation with relaxed `line-height` at 1.8x).
- Pashto and technical signage fallback use Noto Naskh Arabic for superior rendering of dense metadata and agricultural guidelines.
- Mixed telemetry displays Latin numbers left-to-right inside isolated LTR spans (`dir="ltr"`), ensuring coordinates and sensor identifiers do not invert when surrounded by RTL scripts.

## Layout & Spacing
The layout leverages a disciplined 12-column grid resembling flight manifests and telemetry readouts.

### Structural Breakpoints
- **Mobile (< 768px):** 4-column layout, `margin: 1rem`, `gutter: 1rem`. Information cascades into vertically stacked mission modules. Interactive map widgets collapse into full-viewport viewports with floating overlay telemetry pills.
- **Tablet (768px - 1024px):** 8-column layout. Split split-screen viewing: static operational index alongside regional crop map.
- **Desktop (> 1024px):** 12-column fluid grid locked inside a 1440px max viewport. Lateral toolbars display environmental sensors, central canvas features high-resolution geospatial overlays, and bottom drawers reveal timeline feeds.

### Spatial Rhythm
Padding and margins reflect instrument modules. Cards and panels use tight internal padding (`space-md`) to maximize visual data throughput, avoiding excessive whitespace that degrades high-density field diagnostics.

## Elevation & Depth
In place of diffuse consumer shadows, visual hierarchy uses high-precision structural boundaries, planar tonal layering, and technical edge contrasts.

### Planar Architecture
- **Surface Level 0 (Base Frame):** Paper (`#F4F6F9`) or deep console Navy (`#061F4D`).
- **Surface Level 1 (Panels & Atlas Cards):** `#FFFFFF` bordered by a 1px continuous stroke of Line (`#E1E6ED`).
- **Surface Level 2 (Flyouts & Detail Monitors):** `#FFFFFF` paired with an ultra-crisp hairline shadow: `0px 1px 3px rgba(6, 31, 77, 0.08), 0px 8px 16px -4px rgba(6, 31, 77, 0.06)`.
- **Floating Sensor HUDs:** Overlaid on satellite rasters using Deep Navy (`#061F4D`) at 90% opacity with `backdrop-filter: blur(8px)` and a 1px border of `#0A3278`.

### Hairline Technical Grid
Panels feature hairline crosshair indicators (`+`) at intersecting corners and 1px dashed guide markers along metadata headers, anchoring the satellite surveillance tone.

## Shapes
The shape language uses minimal corner radii (`0.25rem` / `4px`) to preserve an instrumental, machined finish. 

- **Data Modules & Metrics Tiles:** Strict 4px corners (`rounded-sm`), preventing soft silhouettes and reinforcing an analytical structure.
- **Satellite Badges & Status Pills:** Pill shapes are strictly forbidden for layout cards; status badges use 2px chamfered or 2px micro-radii to emulate hardware-printed spec plates.
- **Input Controls:** Standard 4px corner treatment with high-contrast 1px boundaries.

## Components

### Buttons & Instrument Switches
- **Primary Mission Actions:** Background `#0B3D91`, text `#FFFFFF`, 4px radius, 0px shadow, with uppercase typography (`label-caps`). Hover shifts to NASA 700 (`#0A3278`). Focus indicator uses a 2px offset stroke in `#0B3D91`.
- **Telemetry Action (Critical):** Background `#FC3D21`, text `#FFFFFF`. Restricted to immediate satellite re-tasking, alarm overrides, or hazard exports.
- **Secondary / Calibration Actions:** Outline button with 1px `#E1E6ED` border, `#0F141B` text, and `#FFFFFF` background. Hover triggers `#F4F6F9`.

### Satellite Status Badges
- Compact rectangular badges (2px radius) with tabular monospace metadata.
- Left-aligned indicator dot (6px × 6px):
  - **Live Orbital Stream:** Solid `#15803D` with an optional 1.5s CSS heartbeat ring.
  - **Sync Delay:** `#D97706`.
  - **Payload Disconnect / Anomaly:** Solid `#FC3D21`.
  - **Unsurveyed Territory:** 45° alternating hatch lines using `#94A3B8`.

### Telemetry Cards & Metric Panels
- Top border features a 2px indicator bar displaying subsystem status (Green, Amber, or Red).
- Metric modules show the label in uppercase 11px Muted Ink (`#677485`), numeric value in bold tabular digits (`telemetry-lg`), and spatial trend glyphs (`+12.4% vs median`).

### Input Fields & Filter Triggers
- Borders use 1px `#E1E6ED`, height 36px for dense data filtering.
- Active focus state overrides border to `#0B3D91` with no soft glow, maintaining an exact 1px crisp outline.
- Dropdown menus present items as telemetry manifests, utilizing tabular text alignments.

### Checkboxes & Segmented Radios
- Square 14px boxes with 2px corner radius.
- Selected state fills with Deep Navy (`#061F4D`) housing a white 1.5px surgical checkmark.

### Field Atlas Cartographic Layers
- Overlay HUD controls display sensor coordinates (lat/long in `Inter` tabular font).
- Soil moisture legends show continuous dual-gradient ribbons transitioning between Soil Amber (`#D97706`), Field Green (`#15803D`), and NASA Blue (`#0B3D91`).