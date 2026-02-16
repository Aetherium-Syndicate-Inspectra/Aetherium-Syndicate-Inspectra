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
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountControls();
    applyLanguage(getLanguage());
  });
})();
