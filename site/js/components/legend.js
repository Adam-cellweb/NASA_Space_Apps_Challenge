/* Legend component: renders the map legend from metadata. The controller passes
   the quantile breaks; the component reads the shared state for the active layer
   and level, but never computes status itself. Collapsed state persists in
   localStorage. */
window.Atlas = window.Atlas || {};
Atlas.components = Atlas.components || {};

Atlas.components.legend = (function () {
  'use strict';

  var util = Atlas.util;
  var el = util.el;
  var colors = Atlas.config.colors;
  var storageKey = Atlas.config.legendStorageKey;

  var open = (function () {
    try { return localStorage.getItem(storageKey) !== 'closed'; } catch (e) { return true; }
  })();

  function icon(n, c) { return window.atlasIcon(n, c); }
  function t(k, v) { return Atlas.i18n.t(k, v); }

  // ctx: { breaks }  — layer/level come from the shared state.
  function render(ctx) {
    ctx = ctx || {};
    var state = Atlas.state;
    var meta = Atlas.data.getMeta();
    var Layers = window.AtlasLayers, Temporal = window.AtlasTemporal;
    var box = util.qs('legend');
    if (!box || !meta || !Layers) return;

    var layer = Layers.resolve(state.layer);
    var showStatus = layer.id === 'status';
    function unit(l) { return t((l || layer).unit); }

    box.className = 'legend' + (open ? '' : ' closed');
    box.innerHTML = '';

    box.appendChild(el('button', { 'class': 'legend-head', type: 'button', onclick: function () {
      open = !open;
      try { localStorage.setItem(storageKey, open ? 'open' : 'closed'); } catch (e) {}
      render(ctx);
    } }, [
      icon(showStatus ? 'droplet' : 'layers'),
      el('b', { text: showStatus ? t('legend_title') : t(layer.nameKey) }),
      icon('chevron-right', 'caret icon-sm')
    ]));

    var body = el('div', { 'class': 'legend-body' });
    if (showStatus) {
      var max = meta.thresholds.amber.max_deficit_mm;
      [['green', t('legend_green')], ['amber', t('legend_amber', { max: max })],
       ['red', t('legend_red', { max: max })], ['nodata', t('legend_nodata')]].forEach(function (r) {
        body.appendChild(el('div', { 'class': 'legend-row' }, [
          el('span', { 'class': 'sw' + (r[0] === 'nodata' ? ' nodata' : ''), style: 'background:' + colors[r[0]] }), el('span', { text: r[1] })]));
      });
      body.appendChild(el('div', { 'class': 'legend-note' }, [
        document.createTextNode(t('legend_note', { basis: t('basis_' + (meta.status_basis === 'cropland' ? 'cropland' : 'irrigated')) }) + ' '),
        el('a', { href: 'guide.html', text: t('legend_learn') })]));
    } else if (layer.type === 'percentile') {
      var pr = Atlas.config[layer.ramp];
      body.appendChild(el('div', { 'class': 'ramp', style: 'background:linear-gradient(90deg,' + pr.join(',') + ')' }));
      body.appendChild(el('div', { 'class': 'ramp-labels' }, [
        el('span', { text: t('pct_low') }), el('span', { text: t('pct_high') })]));
      var bl = meta.baseline;
      body.appendChild(el('div', { 'class': 'legend-note',
        text: t(layer.noteKey, { from: bl.first_year, to: bl.last_year }) }));
    } else {
      body.appendChild(el('div', { 'class': 'ramp' }));
      body.appendChild(el('div', { 'class': 'ramp-labels' }, [
        el('span', { text: '0' }), el('span', { text: util.fmtInt(ctx.breaks && ctx.breaks[3]) + '+ ' + unit(layer) })]));
      body.appendChild(el('div', { 'class': 'legend-note',
        text: t(state.level === 'province' ? 'layer_note_province' : 'layer_note') }));
    }
    box.appendChild(body);
    if (Temporal) Temporal.apply(Layers.isTemporal(layer.id), t);
  }

  return { render: render };
})();
