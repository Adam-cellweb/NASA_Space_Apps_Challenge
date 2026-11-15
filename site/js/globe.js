/* KP Open Farm Atlas on a 3D globe.
   Cesium draws photorealistic imagery; every union council is extruded by the
   number being shown, so a tall red block is a place that went short of water.
   The 2D map stays the default view; this page is only loaded when asked for. */
(function () {
  'use strict';

  var COLORS = { green: '#15803d', amber: '#d97706', red: '#c2250f', nodata: '#94a3b8' };
  var STATUS_LETTER = { g: 'green', a: 'amber', r: 'red', n: 'nodata' };
  var BASES = ['data/', '../data/'];
  var baseIndex = 0;
  var lang = localStorage.getItem('atlas.lang') || 'en';
  var strings = {}, meta = null, matrix = null, fc = null;
  var viewer = null, entities = [], dekadIndex = 0, metric = 'deficit';

  function qs(id) { return document.getElementById(id); }
  function t(k, vars) {
    var s = (strings[lang] && strings[lang][k]) || (strings.en && strings.en[k]) || k;
    return String(s).replace(/\{(\w+)\}/g, function (_, n) { return vars && vars[n] != null ? vars[n] : ''; });
  }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function icon(n, c) { return window.atlasIcon(n, c); }
  function fmtInt(n) { return n == null ? '—' : Number(n).toLocaleString('en-US'); }
  function fmtMm(n) { return n == null ? '—' : (Math.round(n * 10) / 10).toLocaleString('en-US'); }
  function fmtDate(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    try {
      return d.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'ur' ? 'ur-PK' : 'ps-AF',
        { day: 'numeric', month: 'short', timeZone: 'UTC' });
    } catch (e) { return iso; }
  }
  function dekadLabel(d) { return fmtDate(d.start) + ' – ' + fmtDate(d.end); }

  function getJSON(path) {
    var tryBase = function (i) {
      return fetch(BASES[i] + path, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error(r.status + ' ' + path);
        baseIndex = i;
        return r.json();
      });
    };
    return tryBase(baseIndex).catch(function (err) {
      var other = baseIndex === 0 ? 1 : 0;
      return tryBase(other).catch(function () {
        if (window.ATLAS_SNAPSHOT && path in window.ATLAS_SNAPSHOT) {
          return JSON.parse(JSON.stringify(window.ATLAS_SNAPSHOT[path]));
        }
        throw err;
      });
    });
  }

  // ---------------------------------------------------------------- values
  function statusOf(p) {
    var row = matrix && matrix.units && matrix.units[p.uc_id];
    if (!row) return p.status;
    return STATUS_LETTER[row.s[dekadIndex]] || 'nodata';
  }
  function deficitOf(p) {
    var row = matrix && matrix.units && matrix.units[p.uc_id];
    return row ? row.d[dekadIndex] : p.deficit_mm;
  }
  function metricValue(p) {
    if (metric === 'deficit') {
      var d = deficitOf(p);
      return d == null ? 0 : Math.max(0, d);
    }
    return p[metric] == null ? 0 : p[metric];
  }
  function metricMax() {
    var max = 0;
    fc.features.forEach(function (f) { max = Math.max(max, metricValue(f.properties)); });
    return max || 1;
  }

  // ---------------------------------------------------------------- globe
  function buildGlobe() {
    Cesium.Ion.defaultAccessToken = undefined;
    viewer = new Cesium.Viewer('globe', {
      // keyless imagery, so the page needs no account of any kind
      baseLayer: new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        credit: 'Imagery © Esri, Maxar, Earthstar Geographics', maximumLevel: 17
      })),
      baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
      navigationHelpButton: false, animation: false, timeline: false, fullscreenButton: false,
      infoBox: false, selectionIndicator: false, requestRenderMode: true, contextOptions: { webgl: { alpha: false } }
    });
    var s = viewer.scene;
    s.globe.enableLighting = false;
    s.globe.baseColor = Cesium.Color.fromCssColorString('#0a1020');
    s.skyAtmosphere.show = true;
    s.fog.enabled = true;
    s.screenSpaceCameraController.minimumZoomDistance = 2000;

    // Look north across the province from just south of it, so the extruded
    // blocks read as a landscape rather than a flat choropleth.
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(71.4, 30.9, 360000),
      orientation: { heading: Cesium.Math.toRadians(2), pitch: Cesium.Math.toRadians(-42), roll: 0 }
    });
    viewer.resetView = function () {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(71.4, 30.9, 360000),
        orientation: { heading: Cesium.Math.toRadians(2), pitch: Cesium.Math.toRadians(-42), roll: 0 },
        duration: 1.2
      });
    };

    var handler = new Cesium.ScreenSpaceEventHandler(s.canvas);
    handler.setInputAction(function (click) {
      var picked = s.pick(click.position);
      if (picked && picked.id && picked.id.properties && picked.id.properties.uc_id) {
        showCard(picked.id.properties.uc_id.getValue());
      } else {
        qs('card').hidden = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function ringsOf(geom) {
    if (geom.type === 'Polygon') return [geom.coordinates];
    if (geom.type === 'MultiPolygon') return geom.coordinates;
    return [];
  }

  function drawUnits() {
    entities.forEach(function (e) { viewer.entities.remove(e); });
    entities = [];
    var max = metricMax();
    var topMetres = 30000;
    fc.features.forEach(function (f) {
      var p = f.properties;
      var st = statusOf(p);
      var v = metricValue(p);
      var h = Math.max(900, (v / max) * topMetres);
      var colour = Cesium.Color.fromCssColorString(COLORS[st] || COLORS.nodata).withAlpha(0.78);
      ringsOf(f.geometry).forEach(function (poly) {
        var flat = [];
        poly[0].forEach(function (c) { flat.push(c[0], c[1]); });
        var ent = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(flat)),
            extrudedHeight: h, height: 0, material: colour,
            outline: true, outlineColor: Cesium.Color.fromCssColorString('#05080f').withAlpha(0.55),
            closeTop: true, closeBottom: false
          },
          properties: { uc_id: p.uc_id }
        });
        entities.push(ent);
      });
    });
    viewer.scene.requestRender();
  }

  // ---------------------------------------------------------------- card
  function showCard(ucId) {
    var f = fc.features.filter(function (x) { return x.properties.uc_id === ucId; })[0];
    if (!f) return;
    var p = f.properties, st = statusOf(p), def = deficitOf(p);
    var card = qs('card');
    card.hidden = false;
    card.innerHTML = '';
    card.appendChild(el('div', { 'class': 'bar', style: 'background:' + COLORS[st] }));
    card.appendChild(el('button', { 'class': 'close', type: 'button', 'aria-label': t('clear'),
      onclick: function () { card.hidden = true; } }, [icon('close', 'icon-sm')]));
    var body = el('div', { 'class': 'body' });
    body.appendChild(el('h2', { text: p.uc_name_en }));
    body.appendChild(el('p', { 'class': 'sub', text: t('uc_sub', { district: p['name_' + lang] || p.name_en }) }));
    if (def == null) {
      body.appendChild(el('p', { text: t('status_nodata') }));
    } else {
      body.appendChild(el('div', { 'class': 'big num' },
        [document.createTextNode(fmtMm(Math.abs(def))),
         el('small', { text: ' ' + t('mm') + ' ' + (def > 0 ? t('deficit') : t('surplus')) })]));
      body.appendChild(el('div', { 'class': 'rows' }, [
        el('div', {}, [el('div', { 'class': 'k', text: t('layer_crop_ha') }),
          el('div', { 'class': 'v num', text: fmtInt(p.crop_ha) + ' ' + t('ha') })]),
        el('div', {}, [el('div', { 'class': 'k', text: t('status_' + st) }),
          el('div', { 'class': 'v', text: dekadLabel(meta.dekads[dekadIndex]) })])]));
    }
    body.appendChild(el('a', { 'class': 'open-2d', href: './#' + p.uc_id },
      [icon('map', 'icon-sm'), document.createTextNode(t('open_2d'))]));
    card.appendChild(body);
  }

  // ---------------------------------------------------------------- chrome
  function renderLegend() {
    var box = qs('legend');
    box.innerHTML = '';
    box.appendChild(el('div', { 'class': 'legend-head' },
      [icon('droplet'), el('b', { text: t('legend_title') })]));
    var body = el('div', { 'class': 'legend-body' });
    var max = meta.thresholds.amber.max_deficit_mm;
    [['green', t('legend_green')], ['amber', t('legend_amber', { max: max })],
     ['red', t('legend_red', { max: max })], ['nodata', t('legend_nodata')]].forEach(function (r) {
      body.appendChild(el('div', { 'class': 'legend-row' },
        [el('span', { 'class': 'sw', style: 'background:' + COLORS[r[0]] }), el('span', { text: r[1] })]));
    });
    body.appendChild(el('div', { 'class': 'legend-note', text: t('globe_note') }));
    box.appendChild(body);
  }

  function fillSelects() {
    var ds = qs('dekadSelect');
    ds.innerHTML = '';
    meta.dekads.forEach(function (d, i) {
      ds.appendChild(el('option', { value: i, text: dekadLabel(d) }));
    });
    ds.value = dekadIndex;
    var hs = qs('heightSelect');
    hs.innerHTML = '';
    [['deficit', t('height_deficit')], ['crop_ha', t('height_cropland')]].forEach(function (o) {
      hs.appendChild(el('option', { value: o[0], text: o[1] }));
    });
    hs.value = metric;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ur' || lang === 'ps') ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.getAttribute('data-i18n'));
    });
    qs('hint').textContent = t('globe_hint');
    qs('footGenerated').textContent = t('generated', { ts: String(meta.generated_at).replace('T', ' ').replace('Z', ' UTC') });
    qs('footSources').textContent = t('footer_sources');
  }

  function boot() {
    Promise.all([
      getJSON('meta.json'),
      fetch('strings.json').then(function (r) { return r.json(); }).catch(function () {
        return window.ATLAS_SNAPSHOT ? window.ATLAS_SNAPSHOT['strings.json'] : {};
      }),
      getJSON('ucs/all.geojson'),
      getJSON('matrix.json').catch(function () { return null; })
    ]).then(function (res) {
      meta = res[0]; strings = res[1]; fc = res[2]; matrix = res[3];
      dekadIndex = meta.dekads.length - 1;
      applyLang();
      fillSelects();
      renderLegend();
      if (!window.Cesium) throw new Error('Cesium did not load');
      buildGlobe();
      drawUnits();
      qs('loading').hidden = true;
      qs('dekadSelect').addEventListener('change', function (e) {
        dekadIndex = Number(e.target.value);
        drawUnits();
        qs('card').hidden = true;
      });
      qs('heightSelect').addEventListener('change', function (e) {
        metric = e.target.value;
        drawUnits();
      });
      qs('resetView').addEventListener('click', function () {
        if (viewer.resetView) viewer.resetView();
        qs('card').hidden = true;
      });
    }).catch(function (err) {
      qs('loading').hidden = true;
      qs('hint').textContent = t('globe_failed') + ' ' + err.message;
    });
  }
  boot();
})();
