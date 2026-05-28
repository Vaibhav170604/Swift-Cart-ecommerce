// ==========================================
// SwiftCart Authentication Logic
// ==========================================

const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initCartCount();
  showStoredAuthMessage();

  // Google OAuth callback (also handled on index via authSession.js)
  if (typeof processGoogleAuthCallback === 'function') {
    await processGoogleAuthCallback();
  }

  checkAuthRedirect();
  handleGoogleAuthErrors();

  // Attach form handlers
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) initLoginForm(loginForm);
  if (registerForm) initRegisterForm(registerForm);

  // Google login button
  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) initGoogleLogin(googleBtn);

  initInputErrorClearing();

  // Password visibility toggle
  const toggleBtn = document.getElementById('toggle-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const pwInput = toggleBtn.closest('.input-wrapper').querySelector('input');
      const icon = toggleBtn.querySelector('i');
      if (pwInput.type === 'password') {
        pwInput.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
      } else {
        pwInput.type = 'password';
        icon.className = 'fa-regular fa-eye';
      }
    });
  }

  // Password strength meter (register page only)
  const pwInput = document.getElementById('register-password');
  if (pwInput) {
    pwInput.addEventListener('input', () => {
      updatePasswordStrength(pwInput.value);
    });
  }
});

// 0. Redirect if already logged in
function checkAuthRedirect() {
  const token = localStorage.getItem('token');
  if (token) {
    // If visiting login/register while already logged in, go home
    const isAuthPage = window.location.pathname.includes('login.html') ||
                       window.location.pathname.includes('register.html');
    if (isAuthPage) {
      window.location.href = 'index.html';
    }
  }
}

// 1. Theme Management (Dark Mode)
function initTheme() {
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
    setTimeout(() => { toggleBtn.style.transform = 'none'; }, 200);
  });
}

// 2. Sync cart badge (guest or authenticated)
function initCartCount() {
  if (typeof CartService !== 'undefined') {
    CartService.syncBadge();
  }
}

// 2b. Show login-required message from redirect
function showStoredAuthMessage() {
  const message = sessionStorage.getItem('authRedirectMessage');
  if (!message) return;
  showAlert(message, 'error');
  sessionStorage.removeItem('authRedirectMessage');
}

// 3. Alert Helper
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('auth-alert');
  if (!alertBox) return;

  alertBox.className = `auth-alert auth-alert--${type} auth-alert--visible`;
  alertBox.innerHTML = `
    <i class="fa-solid ${type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
    <span>${message}</span>
  `;

  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => {
      alertBox.className = 'auth-alert';
    }, 4000);
  }
}

function clearAlert() {
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) alertBox.className = 'auth-alert';
}

// 4. Field-level error helper
function showFieldError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('input-error'));
}

// 5. Set button loading state
function setLoading(btn, loading) {
  if (loading) {
    if (!btn.dataset.originalHtml) {
      btn.dataset.originalHtml = btn.innerHTML;
    }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Please wait...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
  }
}

// 5b. Clear field errors as user types
function initInputErrorClearing() {
  document.querySelectorAll('.form-input').forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const group = input.closest('.form-group');
      const errorEl = group?.querySelector('.field-error');
      if (errorEl) errorEl.textContent = '';
    });
  });
}

// 6. Login Form Handler
function initLoginForm(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    clearFieldErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');

    // Client-side validation
    let isValid = true;

    if (!email) {
      showFieldError('email-error', 'Email is required.');
      document.getElementById('login-email').classList.add('input-error');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      showFieldError('email-error', 'Please enter a valid email address.');
      document.getElementById('login-email').classList.add('input-error');
      isValid = false;
    }

    if (!password) {
      showFieldError('password-error', 'Password is required.');
      document.getElementById('login-password').classList.add('input-error');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(loginBtn, true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert(data.message || 'Login failed. Please try again.');
        setLoading(loginBtn, false);
        return;
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      await CartService.mergeGuestCartOnLogin();

      showAlert('Login successful! Redirecting...', 'success');
      if (typeof ToastService !== 'undefined') {
        ToastService.success('Welcome back!');
      }

      const returnUrl = sessionStorage.getItem('authReturnUrl') || 'index.html';
      sessionStorage.removeItem('authReturnUrl');

      setTimeout(() => {
        window.location.href = returnUrl;
      }, 1200);

    } catch (error) {
      console.error('Login error:', error);
      showAlert('Network error. Please check your connection and try again.');
      setLoading(loginBtn, false);
    }
  });
}

// 7. Register Form Handler
function initRegisterForm(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    clearFieldErrors();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const registerBtn = document.getElementById('register-btn');

    // Client-side validation
    let isValid = true;

    if (!name || name.length < 2) {
      showFieldError('name-error', 'Please enter your full name (min. 2 characters).');
      document.getElementById('register-name').classList.add('input-error');
      isValid = false;
    }

    if (!email) {
      showFieldError('email-error', 'Email is required.');
      document.getElementById('register-email').classList.add('input-error');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      showFieldError('email-error', 'Please enter a valid email address.');
      document.getElementById('register-email').classList.add('input-error');
      isValid = false;
    }

    if (!password || password.length < 6) {
      showFieldError('password-error', 'Password must be at least 6 characters.');
      document.getElementById('register-password').classList.add('input-error');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(registerBtn, true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert(data.message || 'Registration failed. Please try again.');
        setLoading(registerBtn, false);
        return;
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      await CartService.mergeGuestCartOnLogin();

      showAlert('Account created! Redirecting to the shop...', 'success');

      const returnUrl = sessionStorage.getItem('authReturnUrl') || 'index.html';
      sessionStorage.removeItem('authReturnUrl');

      setTimeout(() => {
        window.location.href = returnUrl;
      }, 1200);

    } catch (error) {
      console.error('Register error:', error);
      showAlert('Network error. Please check your connection and try again.');
      setLoading(registerBtn, false);
    }
  });
}

// 8. Password Strength Meter
function updatePasswordStrength(password) {
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!fill || !label) return;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '', color: 'transparent', width: '0%' },
    { label: 'Very Weak', color: '#ef4444', width: '20%' },
    { label: 'Weak', color: '#f97316', width: '40%' },
    { label: 'Fair', color: '#fbbf24', width: '60%' },
    { label: 'Strong', color: '#22c55e', width: '80%' },
    { label: 'Very Strong', color: '#10b981', width: '100%' },
  ];

  const level = levels[Math.min(score, 5)];
  fill.style.width = level.width;
  fill.style.backgroundColor = level.color;
  label.textContent = password.length > 0 ? `Strength: ${level.label}` : '';
  label.style.color = level.color;
}

// 9. Google Login Handler
function initGoogleLogin(btn) {
  btn.addEventListener('click', () => {
    window.location.href = `${API_URL}/auth/google`;
  });
}

// 10. Google OAuth error query params (login/register landing)
function handleGoogleAuthErrors() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (!error) return;

  if (error === 'auth_failed') {
    showAlert('Google authentication failed. Please try again.');
  } else if (error === 'server_error') {
    showAlert('Server error during Google authentication. Please try again.');
  }

  if (typeof AuthSession !== 'undefined') {
    AuthSession.clearAuthStorage();
  }
  window.history.replaceState({}, document.title, window.location.pathname);
}
