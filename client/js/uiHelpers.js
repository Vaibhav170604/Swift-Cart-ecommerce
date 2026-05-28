// ==========================================
// SwiftCart UI Helpers (theme, loading, a11y)
// ==========================================

const PageUI = {
  initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('i');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      icon.className = 'fa-regular fa-sun';
    } else {
      document.body.classList.remove('dark-mode');
      icon.className = 'fa-regular fa-moon';
    }

    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      icon.className = isDark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
      toggleBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        toggleBtn.style.transform = '';
      }, 200);
    });
  },

  initMobileNav() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (!mobileToggle || !navMenu) return;

    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('active');
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const icon = mobileToggle.querySelector('i');
      icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
  },

  loadingHTML(message = 'Loading...') {
    return `
      <div class="ui-state ui-state--loading" role="status" aria-live="polite">
        <div class="ui-spinner" aria-hidden="true">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
        </div>
        <p>${message}</p>
      </div>
    `;
  },

  emptyStateHTML({ icon, title, message, actionHtml = '' }) {
    return `
      <div class="ui-state ui-state--empty">
        <div class="ui-state-icon" aria-hidden="true">
          <i class="fa-solid ${icon}"></i>
        </div>
        <h2>${title}</h2>
        <p>${message}</p>
        ${actionHtml ? `<div class="ui-state-actions">${actionHtml}</div>` : ''}
      </div>
    `;
  },

  errorStateHTML({ title, message, retryFn }) {
    const retryAttr = retryFn ? `onclick="${retryFn}()"` : '';
    return `
      <div class="ui-state ui-state--error" role="alert">
        <div class="ui-state-icon" aria-hidden="true">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <h2>${title}</h2>
        <p>${message}</p>
        <div class="ui-state-actions">
          <button type="button" class="btn btn-primary" ${retryAttr}>
            <i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Try Again
          </button>
        </div>
      </div>
    `;
  },
};
