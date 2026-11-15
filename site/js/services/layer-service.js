/* Layer service. Read-only queries over the catalog in js/layers/catalog.js.
   Availability is derived from meta.json sources (a layer whose backing source is
   not live is reported as unavailable) and, when feature data is supplied, from
   whether the units actually carry a value. No UI logic lives here. */
(function () {
  'use strict';

  var def = window.ATLAS_LAYERS || { default: 'status', layers: [], categories: [] };

  function all() { return def.layers.slice(); }
  function get(id) {
    for (var i = 0; i < def.layers.length; i++) if (def.layers[i].id === id) return def.layers[i];
    return null;
  }
  function resolve(id) { return get(id) || get(def.default) || def.layers[0] || null; }
  function categories() { return def.categories.slice(); }
  function byCategory() {
    return def.categories.map(function (c) {
      return { id: c.id, nameKey: c.nameKey, layers: def.layers.filter(function (l) { return l.category === c.id; }) };
    });
  }
  function continuous() { return def.layers.filter(function (l) { return l.type === 'continuous'; }); }
  function isTemporal(id) { var l = get(id); return !!(l && l.temporal); }

  function hasValues(features, id) {
    if (!features || !features.length) return true;
    return features.some(function (f) { return f.properties && f.properties[id] != null; });
  }
  function isAvailable(layer, meta, features) {
    if (!layer) return false;
    if (layer.requires === 'baseline' && !(meta && meta.baseline)) return false;
    var src = (layer.source && meta && meta.sources) ? meta.sources[layer.source] : null;
    if (layer.source && src && src.status !== 'live') return false;
    return hasValues(features, layer.id);
  }
  function availability(meta, features) {
    var on = [], off = [];
    def.layers.forEach(function (l) { (isAvailable(l, meta, features) ? on : off).push(l); });
    return { available: on, unavailable: off };
  }
  function available(meta, features) { return availability(meta, features).available; }
  function unavailable(meta, features) { return availability(meta, features).unavailable; }

  window.AtlasLayers = {
    defaultId: def.default,
    all: all,
    get: get,
    resolve: resolve,
    categories: categories,
    byCategory: byCategory,
    continuous: continuous,
    isTemporal: isTemporal,
    hasValues: hasValues,
    isAvailable: isAvailable,
    available: available,
    unavailable: unavailable,
    availability: availability
  };
})();
