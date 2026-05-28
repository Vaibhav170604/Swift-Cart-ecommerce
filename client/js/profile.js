// ==========================================
// SwiftCart Profile & Account Dashboard
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  PageUI.initTheme();
  PageUI.initMobileNav();

  if (!AuthGuard.requireProfileAuth()) return;

  CartService.syncBadge();
  loadProfileDashboard();
});

async function loadProfileDashboard() {
  const root = document.getElementById('profile-root');
  root.innerHTML = PageUI.loadingHTML('Loading your account...');

  try {
    const [user, orders] = await Promise.all([
      ProfileService.fetchProfile(),
      OrderService.fetchMyOrders().catch(() => []),
    ]);

    const cartCount = await CartService.getCartCount();
    renderDashboard(user, orders, cartCount);
  } catch (error) {
    console.error(error);
    root.innerHTML = PageUI.errorStateHTML({
      title: 'Could not load profile',
      message: error.message || 'Please try again later.',
      retryFn: 'loadProfileDashboard',
    });
  }
}

function renderDashboard(user, orders, cartCount) {
  const root = document.getElementById('profile-root');
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';
  const initial = user.name.trim().charAt(0).toUpperCase() || 'U';
  const recentOrders = orders.slice(0, 3);

  const recentOrdersHtml =
    recentOrders.length > 0
      ? recentOrders
          .map(
            (order) => `
        <div class="profile-order-row">
          <div>
            <span class="profile-order-id">#${order._id.slice(-8).toUpperCase()}</span>
            <span class="profile-order-date">${OrderService.formatDate(order.createdAt)}</span>
          </div>
          <span class="order-status-badge ${OrderService.statusClass(order.orderStatus)}">${order.orderStatus}</span>
          <span class="profile-order-total">${OrderService.formatCurrency(order.totalAmount)}</span>
          <button type="button" class="btn btn-outline btn-sm view-order-btn" data-order-id="${order._id}">Details</button>
        </div>
      `
          )
          .join('')
      : `<p class="profile-no-orders">No orders yet. <a href="index.html">Start shopping</a></p>`;

  root.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar-large" aria-hidden="true">${initial}</div>
      <div>
        <h1 class="profile-title">Account Dashboard</h1>
        <p class="profile-welcome">Welcome back, <strong>${escapeHtml(user.name)}</strong></p>
        <p class="profile-meta">Member since ${memberSince}</p>
      </div>
    </div>

    <div class="profile-stats">
      <div class="profile-stat-card">
        <i class="fa-solid fa-box" aria-hidden="true"></i>
        <span class="profile-stat-value">${orders.length}</span>
        <span class="profile-stat-label">Orders</span>
      </div>
      <div class="profile-stat-card">
        <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
        <span class="profile-stat-value">${cartCount}</span>
        <span class="profile-stat-label">Cart Items</span>
      </div>
      <div class="profile-stat-card">
        <i class="fa-solid fa-envelope" aria-hidden="true"></i>
        <span class="profile-stat-value profile-stat-value--text">${escapeHtml(user.email)}</span>
        <span class="profile-stat-label">Email</span>
      </div>
    </div>

    <div class="profile-grid">
      <section class="profile-card" aria-labelledby="edit-profile-heading">
        <h2 id="edit-profile-heading"><i class="fa-solid fa-user-pen" aria-hidden="true"></i> Edit Profile</h2>
        <form id="profile-form" class="profile-form" novalidate>
          <div class="form-group">
            <label for="profile-name" class="form-label">Full Name</label>
            <input type="text" id="profile-name" class="form-input profile-input" value="${escapeHtml(user.name)}" required autocomplete="name">
            <span class="field-error" id="profile-name-error"></span>
          </div>
          <div class="form-group">
            <label for="profile-email" class="form-label">Email Address</label>
            <input type="email" id="profile-email" class="form-input profile-input" value="${escapeHtml(user.email)}" required autocomplete="email">
            <span class="field-error" id="profile-email-error"></span>
          </div>
          <details class="profile-password-section">
            <summary>Change password (optional)</summary>
            <div class="form-group">
              <label for="profile-current-pw" class="form-label">Current Password</label>
              <input type="password" id="profile-current-pw" class="form-input profile-input" autocomplete="current-password">
            </div>
            <div class="form-group">
              <label for="profile-new-pw" class="form-label">New Password</label>
              <input type="password" id="profile-new-pw" class="form-input profile-input" autocomplete="new-password" minlength="6">
              <span class="field-error" id="profile-pw-error"></span>
            </div>
          </details>
          <button type="submit" class="btn btn-primary" id="profile-save-btn">
            <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save Changes
          </button>
        </form>
      </section>

      <section class="profile-card" aria-labelledby="recent-orders-heading">
        <div class="profile-card-header-row">
          <h2 id="recent-orders-heading"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Recent Orders</h2>
          <a href="orders.html" class="profile-view-all">View all</a>
        </div>
        <div class="profile-recent-orders">${recentOrdersHtml}</div>
      </section>
    </div>
  `;

  document.getElementById('profile-form').addEventListener('submit', handleProfileSave);

  document.querySelectorAll('.view-order-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      OrderModal.open(btn.getAttribute('data-order-id'));
    });
  });
}

async function handleProfileSave(e) {
  e.preventDefault();

  const name = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const currentPassword = document.getElementById('profile-current-pw').value;
  const newPassword = document.getElementById('profile-new-pw').value;
  const btn = document.getElementById('profile-save-btn');

  document.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.profile-input').forEach((el) => el.classList.remove('input-error'));

  let valid = true;
  if (!name || name.length < 2) {
    document.getElementById('profile-name-error').textContent = 'Name must be at least 2 characters.';
    document.getElementById('profile-name').classList.add('input-error');
    valid = false;
  }
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    document.getElementById('profile-email-error').textContent = 'Please enter a valid email.';
    document.getElementById('profile-email').classList.add('input-error');
    valid = false;
  }
  if (newPassword && newPassword.length < 6) {
    document.getElementById('profile-pw-error').textContent = 'New password must be at least 6 characters.';
    document.getElementById('profile-new-pw').classList.add('input-error');
    valid = false;
  }
  if (!valid) return;

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Saving...';

  try {
    await ProfileService.updateProfile({
      name,
      email,
      currentPassword: newPassword ? currentPassword : undefined,
      newPassword: newPassword || undefined,
    });

    ToastService.success('Profile updated successfully.');
    loadProfileDashboard();
  } catch (error) {
    ToastService.error(error.message);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
