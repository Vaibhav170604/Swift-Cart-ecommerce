// ==========================================
// SwiftCart Checkout Logic
// ==========================================

let checkoutCartItems = [];

document.addEventListener('DOMContentLoaded', () => {
  if (typeof PageUI !== 'undefined') {
    PageUI.initTheme();
    PageUI.initMobileNav();
  } else {
    initCheckoutTheme();
    initCheckoutNavbar();
  }

  if (!AuthGuard.requireCheckoutAuth()) return;

  CartService.syncBadge();

  const params = new URLSearchParams(window.location.search);
  const successOrderId = params.get('success');

  if (successOrderId) {
    loadOrderSuccess(successOrderId);
  } else {
    loadCheckoutPage();
  }
});

function initCheckoutTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  const icon = toggleBtn.querySelector('i');
  const savedTheme = localStorage.getItem('theme') || 'light';

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    icon.className = 'fa-regular fa-sun';
  }

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    icon.className = isDark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
  });
}

function initCheckoutNavbar() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      icon.className = navMenu.classList.contains('active')
        ? 'fa-solid fa-xmark'
        : 'fa-solid fa-bars';
    });
  }
}

function renderLoading() {
  const root = document.getElementById('checkout-root');
  if (!root) return;
  root.innerHTML =
    typeof PageUI !== 'undefined'
      ? PageUI.loadingHTML('Loading checkout...')
      : `<div class="checkout-loading"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Loading checkout...</p></div>`;
}

async function loadCheckoutPage() {
  renderLoading();

  try {
    checkoutCartItems = await CartService.fetchCartWithDetails();

    if (checkoutCartItems.length === 0) {
      renderEmptyCheckout();
      return;
    }

    renderCheckoutForm(checkoutCartItems);
  } catch (error) {
    console.error(error);
    renderCheckoutError();
  }
}

function renderEmptyCheckout() {
  const root = document.getElementById('checkout-root');
  root.innerHTML = `
    <div class="checkout-empty">
      <i class="fa-solid fa-bag-shopping"></i>
      <h2>Your cart is empty</h2>
      <p>Add items to your cart before proceeding to checkout.</p>
      <a href="index.html" class="btn btn-primary">Continue Shopping</a>
    </div>
  `;
}

function renderCheckoutError() {
  const root = document.getElementById('checkout-root');
  root.innerHTML = `
    <div class="checkout-empty">
      <i class="fa-solid fa-circle-exclamation"></i>
      <h2>Could not load checkout</h2>
      <p>Please check your connection and try again.</p>
      <button class="btn btn-primary" onclick="loadCheckoutPage()">Retry</button>
    </div>
  `;
}

function renderCheckoutForm(items) {
  const totals = OrderService.calculateTotals(items);
  const root = document.getElementById('checkout-root');

  const summaryItems = items
    .map(
      (item) => `
    <div class="checkout-summary-item">
      <img src="${item.details.image}" alt="${item.details.title}">
      <div class="checkout-summary-item-info">
        <span class="checkout-summary-item-title">${item.details.title}</span>
        <span class="checkout-summary-item-qty">Qty: ${item.quantity}</span>
      </div>
      <span class="checkout-summary-item-price">${OrderService.formatCurrency(item.details.price * item.quantity)}</span>
    </div>
  `
    )
    .join('');

  root.innerHTML = `
    <div class="checkout-header">
      <h1 class="checkout-title">Checkout</h1>
      <p class="checkout-subtitle">Complete your order with secure shipping details.</p>
    </div>

    <div class="checkout-grid">
      <section class="checkout-card checkout-shipping-card">
        <h2><i class="fa-solid fa-truck"></i> Shipping Address</h2>
        <form id="checkout-form" class="checkout-form" novalidate>
          <div class="form-group">
            <label for="address" class="form-label">Street Address</label>
            <input type="text" id="address" name="address" class="form-input checkout-input" placeholder="123 Main Street" required>
            <span class="field-error" id="address-error"></span>
          </div>
          <div class="checkout-form-row">
            <div class="form-group">
              <label for="city" class="form-label">City</label>
              <input type="text" id="city" name="city" class="form-input checkout-input" placeholder="New York" required>
              <span class="field-error" id="city-error"></span>
            </div>
            <div class="form-group">
              <label for="postalCode" class="form-label">Postal Code</label>
              <input type="text" id="postalCode" name="postalCode" class="form-input checkout-input" placeholder="10001" required>
              <span class="field-error" id="postalCode-error"></span>
            </div>
          </div>
          <div class="form-group">
            <label for="country" class="form-label">Country</label>
            <input type="text" id="country" name="country" class="form-input checkout-input" placeholder="United States" required>
            <span class="field-error" id="country-error"></span>
          </div>
          <button type="submit" class="btn btn-primary checkout-place-btn" id="place-order-btn">
            <i class="fa-solid fa-lock"></i> Place Order — ${OrderService.formatCurrency(totals.total)}
          </button>
        </form>
      </section>

      <aside class="checkout-card checkout-summary-card">
        <h2><i class="fa-solid fa-receipt"></i> Order Summary</h2>
        <div class="checkout-summary-items">${summaryItems}</div>
        <div class="checkout-summary-totals">
          <div class="summary-row"><span>Subtotal</span><span>${OrderService.formatCurrency(totals.subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${totals.shipping === 0 ? '<span class="summary-free-shipping">Free</span>' : OrderService.formatCurrency(totals.shipping)}</span></div>
          <div class="summary-row"><span>Estimated Tax</span><span>${OrderService.formatCurrency(totals.tax)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${OrderService.formatCurrency(totals.total)}</span></div>
        </div>
        <a href="cart.html" class="checkout-back-link"><i class="fa-solid fa-arrow-left"></i> Back to cart</a>
      </aside>
    </div>
  `;

  const form = document.getElementById('checkout-form');
  form.addEventListener('submit', handlePlaceOrder);

  form.querySelectorAll('.checkout-input').forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const err = document.getElementById(`${input.id}-error`);
      if (err) err.textContent = '';
    });
  });
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const address = document.getElementById('address').value.trim();
  const city = document.getElementById('city').value.trim();
  const postalCode = document.getElementById('postalCode').value.trim();
  const country = document.getElementById('country').value.trim();
  const btn = document.getElementById('place-order-btn');

  let valid = true;

  const fields = [
    { id: 'address', value: address, label: 'Street address' },
    { id: 'city', value: city, label: 'City' },
    { id: 'postalCode', value: postalCode, label: 'Postal code' },
    { id: 'country', value: country, label: 'Country' },
  ];

  fields.forEach(({ id, value, label }) => {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(`${id}-error`);
    if (!value) {
      input.classList.add('input-error');
      errorEl.textContent = `${label} is required.`;
      valid = false;
    }
  });

  if (!valid) return;

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

  try {
    const order = await OrderService.createOrder({
      address,
      city,
      postalCode,
      country,
    });

    await CartService.syncBadge();

    window.location.href = `checkout.html?success=${order._id}`;
  } catch (error) {
      ToastService.error(error.message);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function loadOrderSuccess(orderId) {
  renderLoading();

  try {
    const order = await OrderService.fetchOrderById(orderId);
    renderOrderSuccess(order);
  } catch (error) {
    const root = document.getElementById('checkout-root');
    root.innerHTML = `
      <div class="checkout-success-card">
        <i class="fa-solid fa-circle-check checkout-success-icon"></i>
        <h1>Order Placed!</h1>
        <p>Your order was submitted successfully.</p>
        <div class="checkout-success-actions">
          <a href="orders.html" class="btn btn-primary">View My Orders</a>
          <a href="index.html" class="btn btn-outline">Continue Shopping</a>
        </div>
      </div>
    `;
  }
}

function renderOrderSuccess(order) {
  const root = document.getElementById('checkout-root');
  const itemsList = order.orderedItems
    .map(
      (item) => `
    <li>
      <span>${item.product?.title || 'Product'} × ${item.quantity}</span>
      <span>${OrderService.formatCurrency(item.price * item.quantity)}</span>
    </li>
  `
    )
    .join('');

  root.innerHTML = `
    <div class="checkout-success-card checkout-success-animate">
      <div class="checkout-success-icon-wrap">
        <i class="fa-solid fa-circle-check checkout-success-icon"></i>
      </div>
      <h1>Thank You for Your Order!</h1>
      <p class="checkout-success-id">Order #${order._id.slice(-8).toUpperCase()}</p>
      <p class="checkout-success-meta">
        Placed on ${OrderService.formatDate(order.createdAt)} ·
        <span class="order-status-badge ${OrderService.statusClass(order.orderStatus)}">${order.orderStatus}</span>
      </p>

      <div class="checkout-success-details">
        <h3>Order Summary</h3>
        <ul class="checkout-success-items">${itemsList}</ul>
        <div class="checkout-summary-totals">
          <div class="summary-row"><span>Subtotal</span><span>${OrderService.formatCurrency(order.subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${order.shippingCost === 0 ? '<span class="summary-free-shipping">Free</span>' : OrderService.formatCurrency(order.shippingCost)}</span></div>
          <div class="summary-row"><span>Tax</span><span>${OrderService.formatCurrency(order.taxAmount)}</span></div>
          <div class="summary-row total"><span>Total Paid</span><span>${OrderService.formatCurrency(order.totalAmount)}</span></div>
        </div>
        <p class="checkout-success-shipping">
          <i class="fa-solid fa-location-dot"></i>
          ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}
        </p>
      </div>

      <div class="checkout-success-actions">
        <a href="orders.html" class="btn btn-primary">View All Orders</a>
        <a href="index.html" class="btn btn-outline">Continue Shopping</a>
      </div>
    </div>
  `;
}
