/* Data service: the only module that knows data/ URLs, caching and the offline
   snapshot. Everything else asks for domain objects (meta, districts, ucs,
   series) and never sees fetch or response shapes.
   See docs/data-contract.md for the payloads. */
window.Atlas = window.Atlas || {};

Atlas.data = (function () {
  'use strict';

  var BASES = Atlas.config.bases;
  var baseIndex = 0;
  var meta = null;
  var ucCache = {}, seriesCache = {};
  var allUCsPromise = null;

  // Optional hook fired once when the offline snapshot is used (badge reveal).
  var onOffline = null;

  function setMeta(m) { meta = m; }
  function getMeta() { return meta; }
  function setOnOffline(fn) { onOffline = fn; }

  // The active data root: 'data/' deployed, '../data/' when served from a clone.
  function DATA() { return BASES[baseIndex]; }

  function version() {
    return meta ? encodeURIComponent(meta.generated_at) : Math.floor(Date.now() / 3.6e6);
  }

  // ---- Offline snapshot (loaded only after a fetch fails) -----------------
  var snapshotPromise = null;
  function snapshot() {
    if (window.ATLAS_SNAPSHOT) return Promise.resolve(window.ATLAS_SNAPSHOT);
    if (!snapshotPromise) snapshotPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = Atlas.config.snapshotUrl;
      s.onload = function () { resolve(window.ATLAS_SNAPSHOT); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return snapshotPromise;
  }
  function fromSnapshot(path) {
    return snapshot().then(function (snap) {
      if (!snap || !(path in snap)) throw new Error('not in snapshot: ' + path);
      if (typeof onOffline === 'function') onOffline();
      return JSON.parse(JSON.stringify(snap[path]));
    });
  }

  function fetchFrom(base, path, bust) {
    return fetch(base + path + '?v=' + (bust || version()), { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + path); return r.json(); });
  }

  // Path relative to the data root (e.g. 'meta.json', 'series/PK.KP.CHA.json').
  function getJSON(path, bust) {
    if (window.ATLAS_SNAPSHOT) return fromSnapshot(path);
    return fetchFrom(DATA(), path, bust).catch(function (err) {
      // try the other layout once, then fall back to the offline snapshot
      for (var i = 0; i < BASES.length; i++) {
        if (i === baseIndex) continue;
        return fetchFrom(BASES[i], path, bust).then(function (data) {
          baseIndex = i;
          return data;
        }).catch(function () {
          return fromSnapshot(path).catch(function () { throw err; });
        });
      }
      return fromSnapshot(path).catch(function () { throw err; });
    });
  }

  // Path relative to the site root (e.g. 'strings.json').
  function getText(path, bust) {
    if (window.ATLAS_SNAPSHOT) return fromSnapshot(path);
    return fetch(path + '?v=' + (bust || version()))
      .then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + path); return r.json(); })
      .catch(function (err) { return fromSnapshot(path).catch(function () { throw err; }); });
  }

  // ---- Domain accessors ---------------------------------------------------
  function series(id) {
    if (!seriesCache[id]) seriesCache[id] = getJSON('series/' + id + '.json').catch(function () { return null; });
    return seriesCache[id];
  }

  function loadUCs(districtId) {
    if (!ucCache[districtId]) ucCache[districtId] = getJSON('ucs/' + districtId + '.geojson')
      .catch(function () { return { type: 'FeatureCollection', features: [] }; });
    return ucCache[districtId];
  }

  function loadAllUCs() {
    if (!allUCsPromise) allUCsPromise = getJSON('ucs/all.geojson')
      .catch(function () { return { type: 'FeatureCollection', features: [] }; });
    return allUCsPromise;
  }

  return {
    DATA: DATA,
    version: version,
    getJSON: getJSON,
    getText: getText,
    snapshot: snapshot,
    fromSnapshot: fromSnapshot,
    series: series,
    loadUCs: loadUCs,
    loadAllUCs: loadAllUCs,
    setMeta: setMeta,
    getMeta: getMeta,
    setOnOffline: setOnOffline
  };
})();
