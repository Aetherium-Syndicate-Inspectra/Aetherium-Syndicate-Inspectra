(function pageShellInit() {
  const STORAGE_KEY = 'asi-lang';
  const root = document.documentElement;

  function getLanguage() {
    return localStorage.getItem(STORAGE_KEY) || (root.getAttribute('lang') === 'th' ? 'th' : 'en');
  }

  function resolveHomeUrl() {
    const path = window.location.pathname;
    if (path.includes('/src/frontend/')) {
      return '../../index.html';
    }
    return 'index.html';
  }

  function resolveRelativeUrl(rootPath, frontendPath) {
    const path = window.location.pathname;
    return path.includes('/src/frontend/') ? frontendPath : rootPath;
  }

  function applyLanguage(lang) {
    root.setAttribute('lang', lang);
    localStorage.setItem(STORAGE_KEY, lang);

    document.querySelectorAll('[data-i18n-th]').forEach((el) => {
      const nextText = el.dataset[`i18n${lang === 'th' ? 'Th' : 'En'}`];
      if (!nextText) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', nextText);
      } else {
        el.textContent = nextText;
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const attrName = el.dataset.i18nAttr;
      const attrVal = el.dataset[`i18nAttr${lang === 'th' ? 'Th' : 'En'}`];
      if (attrName && attrVal) {
        el.setAttribute(attrName, attrVal);
      }
    });

    const langBtnLabel = document.getElementById('pageShellLangLabel');
    if (langBtnLabel) {
      langBtnLabel.textContent = lang === 'th' ? 'TH' : 'EN';
    }
  }

  function mountControls() {
    if (document.getElementById('pageShellControls')) return;

    const controls = document.createElement('div');
    controls.id = 'pageShellControls';
    controls.className = 'page-shell-controls';
    controls.innerHTML = `
      <button type="button" class="page-shell-btn" id="pageShellNavBtn">
        <span class="icon" aria-hidden="true">☰</span>
        <span data-i18n-th="เมนูหน้าเว็บ" data-i18n-en="Page menu">เมนูหน้าเว็บ</span>
      </button>
      <nav id="pageShellNavMenu" class="page-shell-nav" hidden>
        <a href="${resolveRelativeUrl('index.html', '../../index.html')}" data-i18n-th="หน้าแรกหลัก" data-i18n-en="Landing">หน้าแรกหลัก</a>
        <a href="${resolveRelativeUrl('src/frontend/login.html', 'login.html')}" data-i18n-th="เข้าสู่ระบบ" data-i18n-en="Login">เข้าสู่ระบบ</a>
        <a href="${resolveRelativeUrl('app-home.html', '../../app-home.html')}" data-i18n-th="Workspace" data-i18n-en="Workspace">Workspace</a>
        <a href="${resolveRelativeUrl('creator-studio.html', '../../creator-studio.html')}" data-i18n-th="Creator Studio" data-i18n-en="Creator Studio">Creator Studio</a>
        <a href="${resolveRelativeUrl('enterprise_windows.html', '../../enterprise_windows.html')}" data-i18n-th="Enterprise Windows" data-i18n-en="Enterprise Windows">Enterprise Windows</a>
        <a href="${resolveRelativeUrl('github-pr-settings.html', '../../github-pr-settings.html')}" data-i18n-th="PR Settings" data-i18n-en="PR Settings">PR Settings</a>
        <a href="${resolveRelativeUrl('src/frontend/billing_settings.html', 'billing_settings.html')}" data-i18n-th="Billing Settings" data-i18n-en="Billing Settings">Billing Settings</a>
      </nav>
      <button type="button" class="page-shell-btn page-shell-btn--lang" id="pageShellLangBtn" aria-label="Toggle language">
        <span class="icon" aria-hidden="true">🌐</span>
        <span id="pageShellLangLabel">TH</span>
      </button>
      <button type="button" class="page-shell-btn" id="pageShellBackBtn">
        <span class="icon" aria-hidden="true">↩</span>
        <span data-i18n-th="ย้อนกลับ" data-i18n-en="Back">ย้อนกลับ</span>
      </button>
      <button type="button" class="page-shell-btn" id="pageShellHomeBtn">
        <span class="icon" aria-hidden="true">⌂</span>
        <span data-i18n-th="หน้าแรก" data-i18n-en="Home">หน้าแรก</span>
      </button>
    `;

    document.body.appendChild(controls);

    const langBtn = document.getElementById('pageShellLangBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const next = getLanguage() === 'th' ? 'en' : 'th';
        applyLanguage(next);
      });
    }

    const backBtn = document.getElementById('pageShellBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = resolveHomeUrl();
        }
      });
    }

    const homeBtn = document.getElementById('pageShellHomeBtn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        window.location.href = resolveHomeUrl();
      });
    }

    const navBtn = document.getElementById('pageShellNavBtn');
    const navMenu = document.getElementById('pageShellNavMenu');
    if (navBtn && navMenu) {
      navBtn.addEventListener('click', () => {
        const shouldOpen = navMenu.hasAttribute('hidden');
        if (shouldOpen) {
          navMenu.removeAttribute('hidden');
          navBtn.setAttribute('aria-expanded', 'true');
        } else {
          navMenu.setAttribute('hidden', 'hidden');
          navBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountControls();
    applyLanguage(getLanguage());
  });
})();
