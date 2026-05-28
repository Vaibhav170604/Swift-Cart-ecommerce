// ==========================================
// SwiftCart Toast Notifications
// ==========================================

const ToastService = {
  _hideTimer: null,

  show(message, type = 'info', duration = 3500) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }

    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      info: 'fa-circle-info',
      warning: 'fa-triangle-exclamation',
    };

    toast.className = `app-toast app-toast--${type} app-toast--visible`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info}" aria-hidden="true"></i>
      <span>${this._escape(message)}</span>
      <button type="button" class="app-toast-close" aria-label="Dismiss notification">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    `;

    toast.querySelector('.app-toast-close').addEventListener('click', () => {
      this.hide();
    });

    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => this.hide(), duration);
  },

  hide() {
    const toast = document.getElementById('app-toast');
    if (toast) toast.classList.remove('app-toast--visible');
  },

  success(message, duration) {
    this.show(message, 'success', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  },

  warning(message, duration) {
    this.show(message, 'warning', duration);
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
