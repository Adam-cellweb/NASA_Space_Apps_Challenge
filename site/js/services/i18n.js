/* i18n service: holds the central dictionary, resolves keys with a safe
   English fallback, picks localised feature names and keeps <html lang/dir> in
   sync. No page-specific text is hardcoded anywhere else. */
window.Atlas = window.Atlas || {};

Atlas.i18n = (function () {
  'use strict';

  var strings = {};

  function setStrings(dict) { strings = dict || {}; }

  function t(key, vars) {
    var lang = Atlas.state.lang;
    var s = (strings[lang] && strings[lang][key]) || (strings.en && strings.en[key]) || key;
    return String(s).replace(/\{(\w+)\}/g, function (_, k) {
      return vars && vars[k] != null ? vars[k] : '';
    });
  }

  // Pick the localised feature name, falling back to English.
  function name(props) { return props['name_' + Atlas.state.lang] || props.name_en; }

  // Sync the document root with the current language.
  function applyRoot() {
    var lang = Atlas.state.lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = Atlas.util.isRtl(lang) ? 'rtl' : 'ltr';
  }

  // Fill every [data-i18n] node in the given root with its translated text.
  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.getAttribute('data-i18n'));
    });
  }

  return { setStrings: setStrings, t: t, name: name, applyRoot: applyRoot, apply: apply };
})();
