// ==========================================
// SwiftCart Frontend Logic
// ==========================================

// const { log } = require("console");

const API_URL = 'https://swift-cart-ecommerce.onrender.com/api';
let allProducts = [];


document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initTheme();
  initCartCount();
  initWishlistCount();
  initProductGridDelegation();
  fetchProducts();
});

// Re-sync cart badge after Google OAuth or session restore completes
document.addEventListener('auth:ready', () => {
  if (typeof CartService !== 'undefined') {
    CartService.syncBadge();
  }
  if (typeof WishlistService !== 'undefined') {
    WishlistService.syncBadge();
  }
}, { once: true });

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
  const navLinks = document.querySelectorAll('.nav-link');

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

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
      });
    });
  }
}

// 2. Sync cart badge
function initCartCount() {
  CartService.syncBadge();
}

// 2c. Sync wishlist badge
function initWishlistCount() {
  if (typeof WishlistService !== 'undefined') {
    WishlistService.syncBadge();
  }
}

// 2b. Event delegation on product grid (avoids rebinding each render)
function initProductGridDelegation() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      e.stopPropagation();
      if (!addBtn.disabled) {
        addToCart(addBtn.getAttribute('data-id'));
      }
      return;
    }

    const wishlistBtn = e.target.closest('.wishlist-btn');
    if (wishlistBtn) {
      e.stopPropagation();
      toggleWishlist(wishlistBtn.getAttribute('data-id'), wishlistBtn);
      return;
    }

    if (e.target.closest('.details-btn')) return;

    const card = e.target.closest('.product-card');
    if (card) {
      window.location.href = `product.html?id=${card.getAttribute('data-id')}`;
    }
  });
}

// 3. Render Skeleton Loaders
function renderSkeletons() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.classList.add('product-grid--loading');
  let skeletonHTML = '';
  for (let i = 0; i < 8; i++) {
    skeletonHTML += `
      <div class="skeleton-card" style="animation-delay: ${i * 0.06}s">
        <div class="skeleton-image"></div>
        <div class="skeleton-info">
          <div class="skeleton-text sm"></div>
          <div class="skeleton-text lg"></div>
          <div class="skeleton-text md"></div>
          <div class="skeleton-text sm skeleton-price"></div>
        </div>
      </div>
    `;
  }
  grid.innerHTML = skeletonHTML;
}

// 4. Fetch Products from Backend API
async function fetchProducts() {
  renderSkeletons();

  try {
    const response = await fetch('https://swift-cart-ecommerce.onrender.com/api/products');
     
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    allProducts = await response.json();
    // console.log(allProducts);
    const grid = document.getElementById('product-grid');
    if (grid) grid.classList.remove('product-grid--loading');
    
    
    ProductCatalog.init(allProducts, renderProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    renderErrorState();
  }
}

// 5. Render Error State
function renderErrorState() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.classList.remove('product-grid--loading');
  grid.innerHTML =
    typeof PageUI !== 'undefined'
      ? PageUI.errorStateHTML({
          title: 'Failed to load products',
          message:
            'There was a problem connecting to the server. Please check your connection and try again.',
          retryFn: 'fetchProducts',
        })
      : `<div class="catalog-empty-state"><h3>Failed to Load Products</h3><button class="btn btn-primary" id="retry-btn">Retry</button></div>`;

  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) retryBtn.addEventListener('click', fetchProducts);
}

// 6. Render Product Cards
function renderProducts(products, emptyType = null) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.classList.remove('product-grid--loading');

  if (products.length === 0) {
    grid.innerHTML = renderCatalogEmptyState(emptyType);
    const resetBtn = document.getElementById('catalog-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => ProductCatalog.resetFilters());
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement('div');
  wrapper.className = 'product-grid-inner';
  wrapper.innerHTML = products.map(buildProductCardHTML).join('');
  while (wrapper.firstChild) {
    fragment.appendChild(wrapper.firstChild);
  }

  grid.innerHTML = '';
  grid.appendChild(fragment);

  requestAnimationFrame(() => {
    grid.querySelectorAll('.product-card').forEach((card, i) => {
      card.style.animationDelay = `${Math.min(i * 0.04, 0.4)}s`;
    });
  });
}

function buildProductCardHTML(product) {
  const ratingValue = product.rating || 0;
  const fullStars = Math.floor(ratingValue);
  const halfStar = ratingValue % 1 >= 0.5 ? 1 : 0;
  const emptyStars = Math.max(0, 5 - fullStars - halfStar);
  let starsHTML = '';

  for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fa-solid fa-star"></i>';
  if (halfStar) starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
  for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="fa-regular fa-star"></i>';

  const title = escapeHtml(product.title);
  const category = escapeHtml(product.category);

  return `
    <article class="product-card" data-id="${product._id}">
      ${product.stock < 10 && product.stock > 0 ? `<span class="product-badge">Only ${product.stock} left</span>` : ''}
      ${product.stock === 0 ? `<span class="product-badge product-badge--out">Out of Stock</span>` : ''}
      <div class="product-card-image">
        <img src="${product.image}" alt="${title}" loading="lazy" decoding="async" width="300" height="300">
        <div class="product-card-actions">
          <button class="btn-icon wishlist-btn" data-id="${product._id}" title="Add to Wishlist">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="btn-icon add-to-cart-btn" data-id="${product._id}" title="Add to Cart" ${product.stock === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-cart-plus"></i>
          </button>
          <a href="product.html?id=${product._id}" class="btn-icon details-btn" title="View Details">
            <i class="fa-solid fa-eye"></i>
          </a>
        </div>
      </div>
      <div class="product-card-info">
        <span class="product-card-category">${category}</span>
        <h3 class="product-card-title">
          <a href="product.html?id=${product._id}">${title}</a>
        </h3>
        <div class="product-card-rating">
          ${starsHTML}
          <span>(${ratingValue.toFixed(1)})</span>
        </div>
        <div class="product-card-price-row">
          <span class="product-card-price">$${product.price.toFixed(2)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderCatalogEmptyState(emptyType) {
  const configs = {
    search: {
      icon: 'fa-magnifying-glass',
      title: 'No matches found',
      message: 'Try a different search term or clear filters to see more products.',
    },
    category: {
      icon: 'fa-filter',
      title: 'No products in this category',
      message: 'Browse another category or view all products.',
    },
    default: {
      icon: 'fa-folder-open',
      title: 'No products available',
      message: 'Check back soon for new arrivals.',
    },
  };

  const cfg = configs[emptyType] || configs.default;

  return `
    <div class="catalog-empty-state" role="status">
      <div class="catalog-empty-icon" aria-hidden="true">
        <i class="fa-solid ${cfg.icon}"></i>
      </div>
      <h3>${cfg.title}</h3>
      <p>${cfg.message}</p>
      <button type="button" class="btn btn-outline" id="catalog-reset-btn">
        <i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Clear filters
      </button>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 7. Add to cart
async function addToCart(productId) {
  await CartService.addItem(productId, 1);
}

// 8. Toggle wishlist
async function toggleWishlist(productId, btn) {
  console.log('BOTTOM REACHED');
  const token = localStorage.getItem('token');
  if (!token) {
    sessionStorage.setItem('authReturnUrl', window.location.href);
    sessionStorage.setItem('authRedirectMessage', 'Please login to add items to your wishlist.');
    window.location.href = 'login.html';
    return;
  }
console.log('BOTTOM REACHED');
  const icon = btn.querySelector('i');
  const originalIcon = icon.className;
  icon.className = 'fa-solid fa-circle-notch fa-spin';
  btn.disabled = true;
console.log('BOTTOM REACHED');
  try {
    // Check if product is already in wishlist
    const isInWishlist = await window.WishlistService.checkWishlist(productId);

    let result;
    if (isInWishlist) {
      result = await window.WishlistService.removeFromWishlist(productId);
      if (result.success) {
        icon.className = 'fa-regular fa-heart';
        if (typeof ToastService !== 'undefined') {
          ToastService.success('Removed from wishlist');
        }
      }
      console.log('BOTTOM REACHED');
    } else {
      result = await window.WishlistService.addToWishlist(productId);
      if (result.success) {
        icon.className = 'fa-solid fa-heart';
        if (typeof ToastService !== 'undefined') {
          ToastService.success('Added to wishlist');
        }
      }
      console.log('BOTTOM REACHED');
    }

    console.log('BOTTOM REACHED');
    if (result && result.success) {
      window.WishlistService.syncBadge();
    } else if (result) {
      icon.className = originalIcon;
      if (typeof ToastService !== 'undefined') {
        ToastService.error(result.message || 'Failed to update wishlist');
      }
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    icon.className = originalIcon;
    if (typeof ToastService !== 'undefined') {
      ToastService.error('Failed to update wishlist');
    }
  }

  btn.disabled = false;
}
