/* Temporal control. The header period selector and play button only mean something
   for a time-based layer. When a static layer (for example cropland hectares) is
   active, they are disabled and dimmed instead of silently doing nothing. */
(function () {
  'use strict';

  function apply(isTemporal, t) {
    var sel = document.getElementById('dekadSelect');
    var play = document.getElementById('playBtn');
    if (!sel || !play) return;
    var field = sel.parentNode;
    sel.disabled = !isTemporal;
    play.disabled = !isTemporal;
    if (field && field.classList) field.classList.toggle('off', !isTemporal);
    if (field && field.setAttribute) field.setAttribute('title', isTemporal ? '' : t('static_layer'));
  }

  window.AtlasTemporal = { apply: apply };
})();
