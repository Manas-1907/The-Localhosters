// Site-wide settings + Google Analytics loader.
// Change these with:  npm run configure -- --url=https://your-domain.com --ga=G-XXXXXXXXXX [--api=https://api.your-domain.com/api]
(function () {
  var cfg = window.MAMA_CONFIG = Object.assign({
    siteUrl: 'https://YOUR-DOMAIN.com',
    gaId: 'G-XXXXXXXXXX',
    apiUrl: '',            // full API base, e.g. https://api.your-domain.com/api. Leave '' for same-origin /api
    turnstileSiteKey: ''   // optional Cloudflare Turnstile site key for the contact form
  }, window.MAMA_CONFIG || {});

  // API base: explicit setting > Vite dev proxy > local API on :4000 > same-origin /api
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  var isViteDev = location.port === '5173';
  cfg.apiBase = cfg.apiUrl || (isViteDev ? '/api' : isLocal ? location.protocol + '//' + host + ':4000/api' : '/api');

  // ---- Google Analytics 4 ----
  // Loads only when a real Measurement ID is set and the visitor has not enabled Do Not Track.
  var validId = /^G-[A-Z0-9]{6,}$/.test(cfg.gaId) && cfg.gaId !== 'G-XXXXXXXXXX';
  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  if (!validId || dnt) { window.gtag = function () {}; return; }

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.gaId);
  document.head.appendChild(s);
  window.gtag('js', new Date());
  window.gtag('config', cfg.gaId, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
})();
