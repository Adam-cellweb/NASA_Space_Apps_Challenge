/* Small pure helpers shared across pages: DOM, number/date formatting and the
   cropland colour ramp. No app state, no network. */
window.Atlas = window.Atlas || {};

Atlas.util = (function () {
  'use strict';

  function qs(id) { return document.getElementById(id); }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  // Numbers stay in en-US so digits and separators are unambiguous; the unit
  // label carries the localisation.
  function fmtInt(n) { return n == null ? '\u2014' : Number(n).toLocaleString('en-US'); }
  function fmtMm(n) { return n == null ? '\u2014' : (Math.round(n * 10) / 10).toLocaleString('en-US'); }

  function fmtDate(iso, lang) {
    var d = new Date(iso + 'T00:00:00Z');
    var locale = Atlas.config.dateLocale[lang] || Atlas.config.dateLocale.en;
    try {
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    } catch (e) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    }
  }
  function dekadLabel(d, lang) { return fmtDate(d.start, lang) + ' \u2013 ' + fmtDate(d.end, lang); }

  function stamp(iso) { return String(iso || '').replace('T', ' ').replace('Z', ' UTC'); }

  function isRtl(lang) { return Atlas.config.rtlLangs.indexOf(lang) !== -1; }

  // Quintile breaks used to shade hectare layers within a district. Returns
  // null when no values exist, so callers can render a no-data state.
  function quantiles(values) {
    var v = values.filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    return [0.2, 0.4, 0.6, 0.8].map(function (q) { return v[Math.min(v.length - 1, Math.floor(q * v.length))]; });
  }

  function haColor(value, breaks, ramp) {
    var colors = ramp || Atlas.config.ramp;
    if (value == null || !breaks) return Atlas.config.colors.nodata;
    for (var i = 0; i < breaks.length; i++) if (value <= breaks[i]) return colors[i];
    return colors[colors.length - 1];
  }

  return {
    qs: qs, el: el,
    fmtInt: fmtInt, fmtMm: fmtMm, fmtDate: fmtDate, dekadLabel: dekadLabel, stamp: stamp,
    isRtl: isRtl, quantiles: quantiles, haColor: haColor
  };
})();
