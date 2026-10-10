// Contact form: client-side checks, spam traps (honeypot + minimum fill time), optional Turnstile, then POST /api/contact.
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var cfg = window.MAMA_CONFIG || {};
  var errBox = document.getElementById('formError');
  var btn = document.getElementById('submitBtn');
  var startedAt = Date.now();
  var turnstileToken = '';

  // Optional Cloudflare Turnstile (only when a site key is configured)
  if (cfg.turnstileSiteKey) {
    var ts = document.createElement('script');
    ts.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=mamaTurnstileReady';
    ts.async = true; ts.defer = true;
    window.mamaTurnstileReady = function () {
      window.turnstile.render('#turnstile', { sitekey: cfg.turnstileSiteKey, callback: function (t) { turnstileToken = t; } });
    };
    document.head.appendChild(ts);
  }

  function showError(msg) {
    errBox.textContent = msg;
    errBox.classList.remove('hidden');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errBox.classList.add('hidden');

    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      topic: form.topic.value,
      message: form.message.value.trim(),
      company_website: form.company_website.value,   // honeypot
      elapsedMs: Date.now() - startedAt,              // time-trap
      turnstileToken: turnstileToken
    };

    if (!data.name) return showError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return showError('Please enter a valid email address.');
    if (data.message.length < 10) return showError('Please write a little more so we can help (at least 10 characters).');
    if (!form.consent.checked) return showError('Please tick the box to agree to the Privacy Policy.');
    if (cfg.turnstileSiteKey && !turnstileToken) return showError('Please complete the spam check.');

    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      var res = await fetch(cfg.apiBase + '/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      var body = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
      location.href = 'thank-you.html';
    } catch (err) {
      showError(err.message === 'Failed to fetch' ? 'We could not reach the server. Please check your connection and try again.' : err.message);
      btn.disabled = false;
      btn.textContent = label;
      if (window.turnstile) { try { window.turnstile.reset(); turnstileToken = ''; } catch (x) {} }
    }
  });
})();
