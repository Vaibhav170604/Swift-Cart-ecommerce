// ==========================================
// SwiftCart Shopping Cart Logic
// ==========================================

const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initTheme();

  if (!AuthGuard.requirePageAuth('Please sign in to view your cart.')) {
    return;
  }

  CartService.syncBadge();
  loadCartItems();
});

// 0. Theme Management (Dark Mode)
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
    setTimeout(() => {
      toggleBtn.style.transform = 'none';
    }, 200);
  });
}

// 1. Mobile Menu Toggle
function initNavbar() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });
  }
}

// 2. Load Cart Items from MongoDB
async function loadCartItems() {
  const container = document.getElementById('cart-view-container');

  try {
    const populatedCart = await CartService.fetchCartWithDetails();

    if (populatedCart.length === 0) {
      renderEmptyCart();
      return;
    }

    renderCartContent(populatedCart);
  } catch (error) {
    console.error('Error loading cart:', error);
    renderErrorState();
  }
}

// 3. Render Empty Cart State
function renderEmptyCart() {
  const container = document.getElementById('cart-view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-cart-container">
      <i class="fa-solid fa-bag-shopping"></i>
      <h2>Your Cart is Empty</h2>
      <p>Looks like you haven't added anything to your cart yet. Explore our curated catalog to get started.</p>
      <a href="index.html" class="btn btn-primary">Start Shopping</a>
    </div>
  `;
}

// 4. Render Error State
function renderErrorState() {
  const container = document.getElementById('cart-view-container');
  if (!container) return;

  container.innerHTML = `
    <div class="cart-error-state">
      <i class="fa-solid fa-circle-exclamation"></i>
      <h2>Failed to load shopping cart</h2>
      <p>We had trouble communicating with our servers. Please try again.</p>
      <button class="btn btn-primary" onclick="loadCartItems()"><i class="fa-solid fa-rotate-right"></i> Retry Loading</button>
    </div>
  `;
}

// 5. Render Cart content & calculations
function renderCartContent(populatedCart) {
  const container = document.getElementById('cart-view-container');
  if (!container) return;

  let subtotal = 0;

  const itemsHTML = populatedCart.map((item) => {
    const itemSubtotal = item.details.price * item.quantity;
    subtotal += itemSubtotal;

    return `
      <article class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.details.image}" alt="${item.details.title}">
        </div>
        <div class="cart-item-details">
          <span class="cart-item-category">${item.details.category}</span>
          <h3 class="cart-item-title"><a href="product.html?id=${item.id}">${item.details.title}</a></h3>
          <div class="cart-item-price">$${item.details.price.toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="quantity-btn qty-dec" data-id="${item.id}">-</button>
            <input type="number" class="quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="${item.details.stock}" readOnly>
            <button class="quantity-btn qty-inc" data-id="${item.id}">+</button>
          </div>
          <button class="remove-item-btn" data-id="${item.id}" title="Remove item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </article>
    `;
  }).join('');

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  container.innerHTML = `
    <h1 class="cart-page-title">Your Shopping Cart</h1>
    <div class="cart-container">
      <div class="cart-list">
        ${itemsHTML}
      </div>
      <aside class="cart-summary">
        <h2 class="summary-title">Order Summary</h2>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>${shipping === 0 ? '<span class="summary-free-shipping">Free</span>' : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div class="summary-row">
          <span>Estimated Tax</span>
          <span>$${tax.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <button class="btn btn-primary" id="checkout-btn">
          Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
        </button>
      </aside>
    </div>
  `;

  document.querySelectorAll('.qty-dec').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      updateQuantity(id, -1, populatedCart);
    });
  });

  document.querySelectorAll('.qty-inc').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      updateQuantity(id, 1, populatedCart);
    });
  });

  document.querySelectorAll('.remove-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      removeProductFromCart(id);
    });
  });

  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (!AuthGuard.requireCheckoutAuth()) return;
    window.location.href = 'checkout.html';
  });
}

// 6. Update Cart Item Quantities
async function updateQuantity(productId, delta, populatedCart) {
  const item = populatedCart.find((i) => i.id === productId);
  if (!item) return;

  const maxStock = item.details ? item.details.stock : 99;
  const newQty = item.quantity + delta;

  if (newQty < 1 || newQty > maxStock) return;

  try {
    await CartService.updateItemQuantity(productId, newQty);
    loadCartItems();
  } catch (error) {
    CartService.showToast(error.message, 'error');
  }
}

// 7. Remove Product from Cart
async function removeProductFromCart(productId) {
  try {
    await CartService.removeItem(productId);
    loadCartItems();
  } catch (error) {
    CartService.showToast(error.message, 'error');
  }
}
