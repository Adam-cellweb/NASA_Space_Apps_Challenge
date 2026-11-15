/* Layer catalog. The single source of truth for which map layers exist, how they
   are grouped in the interface, whether they are time-based, and which data source
   backs each one. app.js reads this instead of hardcoding a layer list, so adding a
   layer is a one-line change here and availability follows the meta.json sources. */
(function () {
  'use strict';

  var LAYERS = [
    { id: 'status', nameKey: 'layer_status', icon: 'droplet', type: 'categorical',
      temporal: true, unit: 'mm', category: 'water', source: null },
    // Percentile of the latest dekad's deficit against the same dekad in 2001-2025
    // (same method, same point). Computed by the pipeline; context only, never a status.
    { id: 'pct', nameKey: 'layer_pct', icon: 'chart', type: 'percentile',
      temporal: false, latestOnly: true, unit: 'unit_pct', category: 'water', source: null,
      requires: 'baseline', breaks: [20, 40, 60, 80], ramp: 'pctRamp', noteKey: 'layer_note_pct' },
    { id: 'crop_ha', nameKey: 'layer_crop_ha', icon: 'sprout', type: 'continuous',
      temporal: false, unit: 'ha', category: 'land', source: 'cropland' },
    { id: 'wheat_ha', nameKey: 'layer_wheat_ha', icon: 'wheat', type: 'continuous',
      temporal: false, unit: 'ha', category: 'crop_type', source: 'crop_type' },
    { id: 'maize_ha', nameKey: 'layer_maize_ha', icon: 'maize', type: 'continuous',
      temporal: false, unit: 'ha', category: 'crop_type', source: 'crop_type' },
    { id: 'irrigated_ha', nameKey: 'layer_irrigated_ha', icon: 'irrigation', type: 'continuous',
      temporal: false, unit: 'ha', category: 'crop_type', source: 'crop_type' }
  ];

  var CATEGORIES = [
    { id: 'water', nameKey: 'cat_water' },
    { id: 'land', nameKey: 'cat_land' },
    { id: 'crop_type', nameKey: 'cat_crop_type' }
  ];

  window.ATLAS_LAYERS = { default: 'status', layers: LAYERS, categories: CATEGORIES };
})();


