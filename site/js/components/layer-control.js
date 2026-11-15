/* Layer control. Builds the "Map layer" chip rows, grouped by catalog category and
   driven by js/services/layer-service.js. Used by both the province panel and the
   district panel so the selector is defined once. Layers whose source is not live
   are shown disabled with a "Not connected" title rather than hidden. */
(function () {
  'use strict';

  var L = window.AtlasLayers;

  function chip(layer, currentId, meta, features, t, onSelect) {
    var on = layer.id === currentId;
    var ok = L.isAvailable(layer, meta, features);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (on ? ' on' : '');
    if (!ok) { btn.disabled = true; btn.setAttribute('title', t('not_connected')); }
    btn.appendChild(window.atlasIcon(layer.icon, 'icon-sm'));
    btn.appendChild(document.createTextNode(t(layer.nameKey)));
    btn.addEventListener('click', function () { if (ok) onSelect(layer.id); });
    return btn;
  }

  function render(opts) {
    var wrap = document.createElement('div');
    wrap.className = 'chip-groups';
    L.byCategory().forEach(function (cat) {
      if (!cat.layers.length) return;
      var group = document.createElement('div');
      group.className = 'chip-group';
      var label = document.createElement('div');
      label.className = 'chip-group-label';
      label.textContent = opts.t(cat.nameKey);
      group.appendChild(label);
      var row = document.createElement('div');
      row.className = 'chips';
      cat.layers.forEach(function (l) {
        row.appendChild(chip(l, opts.currentId, opts.meta, opts.features, opts.t, opts.onSelect));
      });
      group.appendChild(row);
      wrap.appendChild(group);
    });
    return wrap;
  }

  window.AtlasLayerControl = { render: render };
})();
