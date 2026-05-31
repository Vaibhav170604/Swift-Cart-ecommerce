// ==========================================
// SwiftCart Auth Session (Navbar + Token)
// ==========================================

const AUTH_API_URL = 'https://swift-cart-ecommerce.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  bootstrapAuthSession();
});

/**
 * Process OAuth redirect params, then initialize navbar session.
 * Must run on every page that includes this script (especially index.html).
 */
async function bootstrapAuthSession() {
  await processGoogleAuthCallback();
  await initAuthNav();
  window.dispatchEvent(new CustomEvent('auth:ready'));
}

/**
 * Persist JWT + user from Google OAuth redirect query string.
 * @returns {Promise<boolean>} true if callback was handled
 */
async function processGoogleAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const googleAuth = urlParams.get('googleAuth');

  if (!token || googleAuth !== 'true') {
    return false;
  }

  // Store token immediately so downstream code sees authenticated state
  localStorage.setItem('token', token);

  try {
    const user = await validateSession(token);

    if (!user) {
      clearAuthStorage();
      if (typeof ToastService !== 'undefined') {
        ToastService.error('Google sign-in failed. Please try again.');
      }
      cleanOAuthQueryFromUrl();
      return false;
    }

    if (typeof CartService !== 'undefined') {
      await CartService.mergeGuestCartOnLogin();
    }

    if (typeof ToastService !== 'undefined') {
      ToastService.success('Successfully signed in with Google!');
    }

    cleanOAuthQueryFromUrl();
    return true;
  } catch (error) {
    console.error('Google auth callback error:', error);
    clearAuthStorage();
    if (typeof ToastService !== 'undefined') {
      ToastService.error('Failed to complete Google sign-in.');
    }
    cleanOAuthQueryFromUrl();
    return false;
  }
}

function cleanOAuthQueryFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('token');
  url.searchParams.delete('googleAuth');
  url.searchParams.delete('error');
  const clean =
    url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash;
  window.history.replaceState({}, document.title, clean);
}

function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function validateSession(token) {
  const authToken = token || localStorage.getItem('token');
  if (!authToken) return null;

  try {
    const response = await fetch(`${AUTH_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch {
    const cached = localStorage.getItem('user');
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
}

function closeAuthDropdown() {
  const menu = document.getElementById('auth-dropdown');
  if (menu) {
    menu.classList.remove('auth-dropdown--visible');
    setTimeout(() => menu.remove(), 200);
  }
  document.removeEventListener('keydown', handleDropdownKeydown);
  const authLink = document.getElementById('auth-link');
  if (authLink) authLink.setAttribute('aria-expanded', 'false');
}

function handleDropdownKeydown(e) {
  if (e.key === 'Escape') {
    closeAuthDropdown();
    document.getElementById('auth-link')?.focus();
  }
}

function handleOutsideClick(e) {
  const menu = document.getElementById('auth-dropdown');
  const authLink = document.getElementById('auth-link');
  if (!menu || !authLink) return;
  if (!menu.contains(e.target) && !authLink.contains(e.target)) {
    closeAuthDropdown();
    document.removeEventListener('click', handleOutsideClick);
  }
}

function renderAuthDropdown(anchor, user) {
  closeAuthDropdown();

  const menu = document.createElement('div');
  menu.id = 'auth-dropdown';
  menu.className = 'auth-dropdown';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <div class="auth-dropdown-header">
      <span class="auth-dropdown-avatar" aria-hidden="true">${user.name.trim().charAt(0).toUpperCase() || 'U'}</span>
      <div>
        <span class="auth-dropdown-name">${escapeHtml(user.name)}</span>
        <span class="auth-dropdown-email">${escapeHtml(user.email)}</span>
      </div>
    </div>
    <div class="auth-dropdown-divider" role="separator"></div>
    <a href="profile.html" class="auth-dropdown-link" role="menuitem">
      <i class="fa-solid fa-user" aria-hidden="true"></i> My Profile
    </a>
    <a href="orders.html" class="auth-dropdown-link" role="menuitem">
      <i class="fa-solid fa-box" aria-hidden="true"></i> My Orders
    </a>
    <a href="cart.html" class="auth-dropdown-link" role="menuitem">
      <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Shopping Cart
    </a>
    <div class="auth-dropdown-divider" role="separator"></div>
    <button type="button" class="auth-dropdown-logout" id="logout-btn" role="menuitem">
      <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Sign Out
    </button>
  `;

  const wrapper = anchor.closest('.nav-actions') || anchor.parentElement;
  wrapper.classList.add('auth-nav-wrapper');
  wrapper.appendChild(menu);

  requestAnimationFrame(() => menu.classList.add('auth-dropdown--visible'));

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearAuthStorage();
    closeAuthDropdown();
    if (typeof ToastService !== 'undefined') {
      ToastService.info('You have been signed out.');
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  });

  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleDropdownKeydown);
  }, 0);

  const firstLink = menu.querySelector('.auth-dropdown-link');
  if (firstLink) firstLink.focus();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderLoggedInNav(authLink, user) {
  const initial = user.name.trim().charAt(0).toUpperCase() || 'U';

  authLink.href = 'profile.html';
  authLink.classList.add('auth-nav--logged-in');
  authLink.title = `Account — ${user.name}`;
  authLink.setAttribute('aria-label', `Account menu for ${user.name}`);
  authLink.setAttribute('aria-haspopup', 'true');
  authLink.setAttribute('aria-expanded', 'false');
  authLink.innerHTML = `<span class="auth-avatar">${initial}</span>`;

  if (authLink.dataset.authNavBound === 'true') return;
  authLink.dataset.authNavBound = 'true';

  authLink.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const existing = document.getElementById('auth-dropdown');
    if (existing) {
      closeAuthDropdown();
      return;
    }
    authLink.setAttribute('aria-expanded', 'true');
    renderAuthDropdown(authLink, user);
  });
}

async function initAuthNav() {
  const authLink = document.getElementById('auth-link');
  if (!authLink) return;

  const token = localStorage.getItem('token');
  if (!token) {
    resetGuestAuthLink(authLink);
    return;
  }

  const user = await validateSession(token);
  if (!user) {
    clearAuthStorage();
    resetGuestAuthLink(authLink);
    return;
  }

  renderLoggedInNav(authLink, user);

  if (typeof CartService !== 'undefined') {
    CartService.syncBadge();
  }
}

function resetGuestAuthLink(authLink) {
  authLink.href = 'login.html';
  authLink.classList.remove('auth-nav--logged-in');
  authLink.removeAttribute('data-auth-nav-bound');
  authLink.title = 'Account';
  authLink.setAttribute('aria-label', 'Sign in');
  authLink.removeAttribute('aria-haspopup');
  authLink.removeAttribute('aria-expanded');
  authLink.innerHTML = '<i class="fa-regular fa-user"></i>';
}

// Shared API for auth.js and other modules
window.AuthSession = {
  processGoogleAuthCallback,
  bootstrapAuthSession,
  initAuthNav,
  validateSession,
  clearAuthStorage,
};
