/* ============================================================
   REALITY FX OS — icon set (line style, inherits currentColor)
   ------------------------------------------------------------
   The same stroke family as the registrar (System A): thin gold
   lines, no fills, no emoji. Usage:
     Static HTML : <span class="ni-ic" data-icon="map"></span>
                   (OSIconify() fills it automatically on load)
     JS-built   : OSIcon('map') or OSIcon('map', 'class-name')
   ============================================================ */
(function () {
  'use strict';

  function S(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  var icons = {
    user:     S('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    home:     S('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    map:      S('<polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6"/><polyline points="8 3 8 18"/><polyline points="16 6 16 21"/>'),
    chart:    S('<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>'),
    shield:   S('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11.5 11.5 14 15.5 9.5"/>'),
    compass:  S('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
    grad:     S('<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12.5v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><line x1="22" y1="10" x2="22" y2="15.5"/>'),
    key:      S('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'),
    pen:      S('<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'),
    flask:    S('<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><line x1="7.5" y1="15" x2="16.5" y2="15"/>'),
    robot:    S('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M2 14v-2M22 14v-2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/>'),
    diamond:  S('<path d="M12 2l4.5 4.5L12 22 7.5 6.5 12 2z"/><path d="M2 6.5h20M7.5 6.5L12 22l4.5-15.5"/>'),
    trophy:   S('<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0 2 5h1M17 6h3a2 2 0 0 1-2 5h-1"/>'),
    book:     S('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
    check:    S('<polyline points="20 6 9 17 4 12"/>'),
    flame:    S('<path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-1.5.5-3 1.5-4.5C9 9 12 6 12 2z"/>'),
    clock:    S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    sparkle:  S('<path d="M12 3l1.9 5.8L19.7 10l-5.8 1.9L12 17.7l-1.9-5.8L4.3 10l5.8-1.9L12 3z"/><path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z"/>'),
    lock:     S('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    cart:     S('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>'),
    alert:    S('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    zap:      S('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    note:     S('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
    brain:    S('<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4 17.5v-3a2.5 2.5 0 0 1-1.5-4.64A2.5 2.5 0 0 1 4.5 7.5 2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 20 17.5v-3a2.5 2.5 0 0 0 1.5-4.64A2.5 2.5 0 0 0 19.5 7.5 2.5 2.5 0 0 0 14.5 2z"/>'),
    target:   S('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    lockOpen: S('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
    shieldX:  S('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="9.5" x2="15" y2="14.5"/><line x1="15" y1="9.5" x2="9" y2="14.5"/>'),
    scale:    S('<path d="M12 3v18M5 7h14M5 7l-3 6a3.5 3.5 0 0 0 6 0L5 7zM19 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6z"/><line x1="8" y1="21" x2="16" y2="21"/>'),
  };

  window.OSIcon = function (name, cls) {
    var svg = icons[name] || '';
    if (svg && cls) svg = svg.replace('<svg ', '<svg class="' + cls + '" ');
    return svg;
  };
  window.OSIconify = function () {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      var name = el.getAttribute('data-icon');
      if (icons[name]) el.innerHTML = icons[name];
    });
  };
  document.addEventListener('DOMContentLoaded', window.OSIconify);
})();
