/* Shared application state. One mutable object so any module can read the
   current language, drill-down level, selected dekad and active layer without
   threading arguments through every call. */
window.Atlas = window.Atlas || {};

Atlas.state = (function () {
  'use strict';

  var store = {
    lang: (function () {
      try { return localStorage.getItem(Atlas.config.langStorageKey) || 'en'; }
      catch (e) { return 'en'; }
    })(),
    level: 'province',   // province | district | uc
    districtId: null,
    ucId: null,
    dekadIndex: null,    // index into meta.dekads; latest by default
    // default map layer comes from the catalog (js/layers/catalog.js)
    layer: (window.AtlasLayers && window.AtlasLayers.defaultId) || 'status',
    query: '',           // panel search text
    detail: false,       // province zoomed past detailZoom
    playing: false       // dekad animation running
  };

  store.setLang = function (lang) {
    store.lang = lang;
    try { localStorage.setItem(Atlas.config.langStorageKey, lang); } catch (e) {}
  };

  return store;
})();
