// Wires the exported screens together as a multi-page site and connects to MAMA API.
(function () {
  var routes = {
    'home': 'home.html', 'my-health': 'my-health.html', 'medicines': 'medicines.html',
    'appointments': 'appointments.html', 'insights': 'insights.html', 'support': 'support.html',
    'doctor-brief': 'doctor-brief.html', 'settings': 'settings.html'
  };

  // Wire data-path links
  document.querySelectorAll('[data-path]').forEach(function (a) {
    var p = a.getAttribute('data-path');
    if (routes[p]) a.setAttribute('href', routes[p]);
  });

  var file = location.pathname.split('/').pop() || 'index.html';
  var isAuth = file === 'login.html' || file === 'signup.html' || file === 'index.html';

  function showMessage(msg, isError = false) {
    var existing = document.getElementById('mama-global-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'mama-global-toast';
    toast.className = 'fixed top-5 right-5 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ' +
      (isError ? 'bg-red-600 text-white' : 'bg-[#124C45] text-white');
    toast.innerHTML = (isError ? '<span class="material-symbols-outlined text-[20px]">error</span>' : '<span class="material-symbols-outlined text-[20px]">check_circle</span>') +
      '<span>' + msg + '</span>';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4000);
  }
  window.mamaToast = showMessage;

  // Protect private pages
  if (!isAuth) {
    if (!window.MamaAPI || !window.MamaAPI.getToken()) {
      location.href = 'login.html';
      return;
    }
  }

  // Auth screen handling
  if (file === 'login.html') {
    document.querySelectorAll('a').forEach(function (a) {
      if (/create an account/i.test(a.textContent)) a.href = 'signup.html';
    });

    var loginForm = document.querySelector('form');
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var emailInput = document.getElementById('identifier');
        var passInput = document.getElementById('password');
        var submitBtn = loginForm.querySelector('button[type="submit"]');

        if (!emailInput || !passInput) return;
        var email = emailInput.value.trim();
        var password = passInput.value;

        if (!email || !password) {
          showMessage('Please enter both email and password', true);
          return;
        }

        var origText = submitBtn ? submitBtn.innerHTML : 'Sign in';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Signing in...';
        }

        try {
          await window.MamaAPI.auth.login(email, password);
          showMessage('Signed in successfully! Welcome back.');
          setTimeout(function () { location.href = 'home.html'; }, 500);
        } catch (err) {
          showMessage(err.message || 'Login failed', true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
          }
        }
      });
    }
  }

  if (file === 'signup.html') {
    document.querySelectorAll('a').forEach(function (a) {
      if (/^\s*sign in\s*$/i.test(a.textContent)) a.href = 'login.html';
    });

    var signupForm = document.querySelector('form');
    if (signupForm) {
      signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('fullName');
        var emailInput = document.getElementById('email');
        var passInput = document.getElementById('password');
        var dueDateInput = document.getElementById('dueDate');
        var submitBtn = signupForm.querySelector('button[type="submit"]');

        var name = nameInput ? nameInput.value.trim() : '';
        var email = emailInput ? emailInput.value.trim() : '';
        var password = passInput ? passInput.value : '';
        var dueDate = dueDateInput ? dueDateInput.value : '';

        if (!name || !email || !password) {
          showMessage('Please fill in your name, email, and password', true);
          return;
        }

        if (password.length < 8) {
          showMessage('Password must be at least 8 characters long', true);
          return;
        }

        var origText = submitBtn ? submitBtn.innerHTML : 'Create account';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Creating account...';
        }

        try {
          var hp = document.getElementById('company_website');   // honeypot: real users leave it empty
          await window.MamaAPI.auth.register({ name: name, email: email, password: password, company_website: hp ? hp.value : '' });
          if (dueDate) {
            await window.MamaAPI.profile.update({ stage: 'pregnant', edd: dueDate }).catch(function () {});
          } else {
            // Default to 24 weeks pregnant (approx 16 weeks to due date)
            var futureDate = new Date(Date.now() + 112 * 86400000).toISOString().split('T')[0];
            await window.MamaAPI.profile.update({ stage: 'pregnant', edd: futureDate }).catch(function () {});
          }
          showMessage('Account created successfully!');
          setTimeout(function () { location.href = 'home.html'; }, 500);
        } catch (err) {
          showMessage(err.message || 'Registration failed', true);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
          }
        }
      });
    }
  }

  // App screens common data sync & dynamic personalization
  if (!isAuth) {
    // Logo navigates to home
    document.querySelectorAll('aside img[alt*="MAMA"]').forEach(function (img) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', function () { location.href = 'home.html'; });
    });

    // Profile link to settings
    var aside = document.querySelector('aside');
    if (aside && file !== 'settings.html') {
      var prof = aside.querySelector('img[alt*="rofile"], img[alt*="vatar"], img[alt*="nanya"]');
      var box = prof && (prof.closest('div[class*="flex"]') || prof.parentElement);
      if (box && !box.closest('nav')) {
        box.style.cursor = 'pointer';
        box.addEventListener('click', function () { location.href = 'settings.html'; });
      }
    }

    // Privacy Policy link in the sidebar footer
    if (aside && !document.getElementById('navPrivacyLink')) {
      var pf = aside.querySelector('.border-t') || aside.lastElementChild;
      if (pf) {
        var pl = document.createElement('a');
        pl.id = 'navPrivacyLink';
        pl.href = 'privacy.html';
        pl.className = 'block px-3 pt-2 text-[11px] text-on-surface-variant hover:underline';
        pl.textContent = 'Privacy Policy';
        pf.appendChild(pl);
      }
    }

    // Add Sign Out button in sidebar footer if not already present
    if (aside && !document.getElementById('navSignOutBtn')) {
      var footerContainer = aside.querySelector('.border-t') || aside.lastElementChild;
      if (footerContainer) {
        var signOutBtn = document.createElement('button');
        signOutBtn.id = 'navSignOutBtn';
        signOutBtn.className = 'w-full mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors';
        signOutBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">logout</span><span>Sign Out</span>';
        signOutBtn.addEventListener('click', function () {
          window.MamaAPI.auth.logout();
        });
        footerContainer.appendChild(signOutBtn);
      }
    }

    // Populate user profile dynamically
    async function loadUserProfile() {
      if (!window.MamaAPI) return;
      try {
        var user = await window.MamaAPI.auth.me().catch(function () { return window.MamaAPI.getUser(); });
        var profileData = await window.MamaAPI.profile.get().catch(function () { return window.MamaAPI.getProfile(); });

        var motherName = (user && user.name && user.name !== 'User') ? user.name : (localStorage.getItem('mama_display_name') || localStorage.getItem('userName') || 'Mother');
        var firstName = motherName.split(' ')[0];

        // Update headers and greeting
        document.querySelectorAll('h1').forEach(function (h) {
          if (/Good morning|Good afternoon|Good evening/i.test(h.textContent) || /Ananya/i.test(h.textContent)) {
            var hour = new Date().getHours();
            var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
            h.textContent = greeting + ', ' + firstName + ' 🌸';
          }
        });

        // Update name in aside and cards
        document.querySelectorAll('span, div, h2, h3, p').forEach(function (el) {
          if (el.children.length === 0) {
            if (/Ananya Sharma/i.test(el.textContent)) {
              el.textContent = el.textContent.replace(/Ananya Sharma/g, motherName);
            } else if (/Ananya\b/i.test(el.textContent) && !el.textContent.includes('Good morning')) {
              el.textContent = el.textContent.replace(/Ananya/g, firstName);
            }
          }
        });

        if (profileData && profileData.progress) {
          var prog = profileData.progress;
          var weekText = 'Week ' + (prog.gestationalWeek || 24);
          var trimesterText = (prog.trimester || 2) + (prog.trimester === 1 ? 'st' : prog.trimester === 2 ? 'nd' : 'rd') + ' Trimester';
          var subtitle = weekText + ' · ' + trimesterText;

          // Update aside subtext
          if (aside) {
            aside.querySelectorAll('span').forEach(function (s) {
              if (/Week \d+/i.test(s.textContent) || /Trimester/i.test(s.textContent)) {
                s.textContent = subtitle;
              }
            });
          }

          // Update hero due date/week pills
          document.querySelectorAll('span, p').forEach(function (el) {
            if (/Week \d+ · \d+(st|nd|rd) trimester/i.test(el.textContent)) {
              el.textContent = weekText + ' · ' + trimesterText + ' · You and baby are doing well today.';
            }
            if (/Due /i.test(el.textContent) && profileData.profile && profileData.profile.edd) {
              var eddDate = new Date(profileData.profile.edd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              el.textContent = 'Due ' + eddDate;
            }
          });
        }
      } catch (err) {
        console.warn('Failed to load profile:', err);
      }
    }

    // -------------------------------------------------------------
    // LANGUAGE SWITCHER & GEMINI TRANSLATION ENGINE
    // -------------------------------------------------------------
    function setupLanguageSwitcher() {
      var header = document.querySelector('header');
      if (!header || document.getElementById('mamaLangWidget')) return;

      var container = header.querySelector('.flex.items-center.gap-5') || header;

      var langWidget = document.createElement('div');
      langWidget.id = 'mamaLangWidget';
      langWidget.className = 'relative inline-block text-left';
      langWidget.innerHTML = `
        <button id="langSelectBtn" type="button" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary transition-all border border-[#EAE4E7] shadow-sm cursor-pointer">
          <span class="material-symbols-outlined text-[16px] text-secondary">translate</span>
          <span id="currentLangLabel">English</span>
          <span class="material-symbols-outlined text-[14px]">expand_more</span>
        </button>
        <div id="langDropdown" class="hidden absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-[#EAE4E7] z-50 overflow-hidden text-xs py-1">
          <button class="lang-opt w-full text-left px-3 py-2 hover:bg-[#F8E7EF] flex items-center justify-between cursor-pointer" data-lang="en">
            <span>English</span><span class="text-secondary font-bold">EN</span>
          </button>
          <button class="lang-opt w-full text-left px-3 py-2 hover:bg-[#F8E7EF] flex items-center justify-between cursor-pointer" data-lang="hi">
            <span>हिंदी (Hindi)</span><span class="text-secondary font-bold">HI</span>
          </button>
          <button class="lang-opt w-full text-left px-3 py-2 hover:bg-[#F8E7EF] flex items-center justify-between cursor-pointer" data-lang="es">
            <span>Español</span><span class="text-secondary font-bold">ES</span>
          </button>
          <button class="lang-opt w-full text-left px-3 py-2 hover:bg-[#F8E7EF] flex items-center justify-between cursor-pointer" data-lang="fr">
            <span>Français</span><span class="text-secondary font-bold">FR</span>
          </button>
        </div>
      `;

      container.insertBefore(langWidget, container.firstChild);

      var btn = document.getElementById('langSelectBtn');
      var dropdown = document.getElementById('langDropdown');
      var currentLabel = document.getElementById('currentLangLabel');

      var langNames = { en: 'English', hi: 'हिंदी', es: 'Español', fr: 'Français' };
      var currentLang = localStorage.getItem('mama_selected_lang') || 'en';
      if (currentLabel) currentLabel.textContent = langNames[currentLang] || 'English';

      if (btn && dropdown) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          dropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', function () {
          dropdown.classList.add('hidden');
        });
      }

      document.querySelectorAll('.lang-opt').forEach(function (opt) {
        opt.addEventListener('click', function (e) {
          e.stopPropagation();
          var selected = this.getAttribute('data-lang');
          if (dropdown) dropdown.classList.add('hidden');
          if (selected === currentLang) return;
          currentLang = selected;
          localStorage.setItem('mama_selected_lang', selected);
          if (currentLabel) currentLabel.textContent = langNames[selected] || 'English';
          applyTranslation(selected);
        });
      });

      if (currentLang !== 'en') {
        setTimeout(function () { applyTranslation(currentLang); }, 300);
      }
    }

    var uiDict = {
      hi: {
        'Home': 'होम', 'My Health': 'मेरा स्वास्थ्य', 'Medicines': 'दवाइयां', 'Appointments': 'अपॉइंटमेंट',
        'Insights': 'इनसाइट्स', 'Support': 'सपोर्ट', 'Doctor Brief': 'डॉक्टर ब्रीफ', 'Settings': 'सेटिंग्स',
        'Privacy Policy': 'गोपनीयता नीति', 'Sign Out': 'साइन आउट', 'Good morning': 'शुभ प्रभात',
        'Good afternoon': 'शुभ दोपहर', 'Good evening': 'शुभ संध्या', 'Quiet Sanctuary · Maternal Companion': 'शांत आश्रय · मातृ साथी',
        'Continuous care active': 'निरंतर देखभाल सक्रिय', 'Before your visit': 'आपकी यात्रा से पहले', 'Previous visits': 'पिछली मुलाकातें',
        'Invite Member': 'सदस्य को आमंत्रित करें', 'Care Circle Companions & Access': 'देखभाल चक्र के साथी और पहुंच',
        'Your week at a glance': 'आपका सप्ताह एक नज़र में', 'What we noticed': 'हमने क्या देखा'
      },
      es: {
        'Home': 'Inicio', 'My Health': 'Mi Salud', 'Medicines': 'Medicamentos', 'Appointments': 'Citas',
        'Insights': 'Estadísticas', 'Support': 'Apoyo', 'Doctor Brief': 'Informe Médico', 'Settings': 'Ajustes',
        'Privacy Policy': 'Política de Privacidad', 'Sign Out': 'Cerrar Sesión', 'Good morning': 'Buenos días',
        'Good afternoon': 'Buenas tardes', 'Good evening': 'Buenas noches', 'Invite Member': 'Invitar Miembro',
        'Your week at a glance': 'Su semana de un vistazo', 'What we noticed': 'Lo que observamos'
      },
      fr: {
        'Home': 'Accueil', 'My Health': 'Ma Santé', 'Medicines': 'Médicaments', 'Appointments': 'Rendez-vous',
        'Insights': 'Aperçus', 'Support': 'Soutien', 'Doctor Brief': 'Dossier Médical', 'Settings': 'Paramètres',
        'Privacy Policy': 'Politique de Confidentialité', 'Sign Out': 'Déconnexion', 'Good morning': 'Bonjour',
        'Good afternoon': 'Bon après-midi', 'Good evening': 'Bonsoir', 'Invite Member': 'Inviter Membre',
        'Your week at a glance': 'Votre semaine en un coup d\'œil', 'What we noticed': 'Ce que nous avons remarqué'
      }
    };

    async function applyTranslation(targetLang) {
      if (targetLang === 'en') {
        location.reload();
        return;
      }
      if (window.mamaToast) window.mamaToast('Translating app into ' + targetLang.toUpperCase() + ' using Gemini AI...');

      // Local dictionary pass
      var dict = uiDict[targetLang] || {};
      document.querySelectorAll('a, button, span, h1, h2, h3, h4, label, p').forEach(function (el) {
        if (el.children.length === 0) {
          var t = el.textContent.trim();
          if (dict[t]) el.textContent = dict[t];
        }
      });

      // Gemini AI Translation for remaining text elements
      if (window.MamaAPI && window.MamaAPI.translate) {
        var textNodes = [];
        var elements = [];
        document.querySelectorAll('h1, h2, h3, h4, p, label').forEach(function (el) {
          if (el.children.length === 0 && el.textContent.trim().length > 3 && !el.dataset.translated) {
            textNodes.push(el.textContent.trim());
            elements.push(el);
          }
        });

        if (textNodes.length > 0) {
          try {
            var translated = await window.MamaAPI.translate(textNodes.slice(0, 20), targetLang);
            if (Array.isArray(translated)) {
              translated.forEach(function (resText, idx) {
                if (elements[idx] && resText) {
                  elements[idx].textContent = resText;
                  elements[idx].dataset.translated = 'true';
                }
              });
            }
          } catch (e) {
            console.warn('Gemini translation error:', e);
          }
        }
      }
    }

    loadUserProfile();
    setupLanguageSwitcher();
  }

  // -------------------------------------------------------------
  // UNIFORM ICON STYLING & DYNAMIC CLICK COLOR SWITCH ENGINE
  // -------------------------------------------------------------
  function setupUniformIcons() {
    if (document.getElementById('mama-uniform-icons-style')) return;
    var style = document.createElement('style');
    style.id = 'mama-uniform-icons-style';
    style.textContent = `
      .material-symbols-outlined, .material-symbols-rounded, svg {
        transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease, font-variation-settings 0.2s ease !important;
      }
      /* Uniform base icon tint across UI controls */
      button .material-symbols-outlined,
      a .material-symbols-outlined,
      .icon-container .material-symbols-outlined,
      .mood-btn .material-symbols-outlined,
      .comfort-btn .material-symbols-outlined,
      .sensation-chip .material-symbols-outlined {
        color: #124C45;
      }
      /* Hover state for icons */
      button:hover .material-symbols-outlined,
      a:hover .material-symbols-outlined {
        color: #834E6A !important;
      }
      /* Dynamic active / clicked icon highlight */
      .icon-active,
      .material-symbols-outlined.clicked-active,
      a[aria-current="page"] .material-symbols-outlined,
      button.bg-secondary-container .material-symbols-outlined,
      .bg-secondary-container .material-symbols-outlined {
        color: #834E6A !important;
        font-variation-settings: 'FILL' 1, 'wght' 600 !important;
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('click', function (e) {
      var icon = e.target.closest('.material-symbols-outlined, .material-symbols-rounded, svg');
      if (!icon) {
        var btn = e.target.closest('button, a, .mood-btn, .comfort-btn, .sensation-chip');
        if (btn) icon = btn.querySelector('.material-symbols-outlined, .material-symbols-rounded, svg');
      }
      if (icon) {
        icon.classList.add('clicked-active');
        icon.style.color = '#834E6A';
        icon.style.transform = 'scale(1.2)';
        setTimeout(function () {
          icon.style.transform = 'scale(1)';
        }, 200);
      }
    });
  }

  // Sign out button handler if present anywhere on page
  var so = document.getElementById('signOutBtn');
  if (so) {
    so.addEventListener('click', function () {
      if (window.MamaAPI) window.MamaAPI.auth.logout();
      else location.href = 'login.html';
    });
  }

  // Fallback for logo
  document.querySelectorAll('img[alt^="MAMA"]').forEach(function (img) {
    img.addEventListener('error', function () {
      if (!img.dataset.fb) {
        img.dataset.fb = '1';
        img.src = 'assets/logo.png';
      }
    });
  });

  setupUniformIcons();
})();
