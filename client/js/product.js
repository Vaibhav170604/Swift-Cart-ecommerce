// ==========================================
// SwiftCart Product Details Logic
// ==========================================

const API_URL = 'https://swift-cart-ecommerce.onrender.com/api';
let currentProduct = null;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initTheme();
  initCartCount();
  initWishlistCount();
  loadProductDetails();
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
  }
}

// 2. Sync cart badge (guest localStorage or authenticated DB cart)
function initCartCount() {
  CartService.syncBadge();
}

// 2c. Sync wishlist badge
function initWishlistCount() {
  if (typeof WishlistService !== 'undefined') {
    WishlistService.syncBadge();
  }
}

// 3. Extract ID and Fetch Product
async function loadProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const target = document.getElementById('product-details-target');

  if (!productId) {
    target.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #ef4444; margin-bottom: 1.5rem;"></i>
        <h2>Missing Product Parameter</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">No product ID was found in the URL address.</p>
        <a href="index.html" class="btn btn-primary">Go back to Homepage</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/products/${productId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error('Server error');
    }

    currentProduct = await response.json();
    renderProductDetails(currentProduct);
    loadRelatedProducts(currentProduct.category, productId);
    checkWishlistStatus(productId);
  } catch (error) {
    console.error('Error fetching product details:', error);
    renderErrorState(error.message);
  }
}

// 4. Render Error State
function renderErrorState(message) {
  const target = document.getElementById('product-details-target');
  if (!target) return;

  target.innerHTML = `
    <div style="text-align: center; padding: 4rem 2rem;">
      <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; color: #ef4444; margin-bottom: 1.5rem;"></i>
      <h2>Unable to Load Product</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">${message === 'Product not found' ? 'The requested product could not be located.' : 'Something went wrong while retrieving product details.'}</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <a href="index.html" class="btn btn-outline">Back to Shop</a>
        <button class="btn btn-primary" onclick="loadProductDetails()"><i class="fa-solid fa-rotate-right"></i> Retry</button>
      </div>
    </div>
  `;
}

// 5. Render Core Product details
function renderProductDetails(product) {
  const target = document.getElementById('product-details-target');
  if (!target) return;

  // Generate Stars
  const ratingValue = product.rating || 0;
  const fullStars = Math.floor(ratingValue);
  const halfStar = ratingValue % 1 >= 0.5 ? 1 : 0;
  const emptyStars = Math.max(0, 5 - fullStars - halfStar);
  let starsHTML = '';
  
  for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fa-solid fa-star"></i>';
  if (halfStar) starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
  for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="fa-regular fa-star"></i>';

  // Stock status styling
  let stockHTML = '';
  if (product.stock === 0) {
    stockHTML = '<span class="details-stock stock-out"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>';
  } else if (product.stock < 10) {
    stockHTML = `<span class="details-stock stock-low"><i class="fa-solid fa-circle-exclamation"></i> Only ${product.stock} left in stock</span>`;
  } else {
    stockHTML = '<span class="details-stock stock-instock"><i class="fa-solid fa-circle-check"></i> In Stock</span>';
  }

  target.innerHTML = `
    <div class="details-grid">
      <div class="details-image-container">
        <img src="${product.image}" alt="${product.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/500x500.png?text=Product+Image';">
      </div>
      <div class="details-info">
        <span class="details-category">${product.category}</span>
        <h1 class="details-title">${product.title}</h1>
        <div class="details-rating">
          <div class="rating-stars">${starsHTML}</div>
          <span>(${ratingValue.toFixed(1)} / 5.0)</span>
        </div>
        <div class="details-price">$${product.price.toFixed(2)}</div>
        <p class="details-description">${product.description}</p>
        
        <div>
          ${stockHTML}
        </div>

        <div class="details-actions">
          <button class="btn btn-outline" id="wishlist-cta" title="Add to Wishlist">
            <i class="fa-regular fa-heart"></i> Wishlist
          </button>
          ${product.stock > 0 ? `
            <div class="quantity-control">
              <button class="quantity-btn" id="qty-dec" aria-label="Decrease Quantity">-</button>
              <input type="number" class="quantity-input" id="qty-input" value="1" min="1" max="${product.stock}" readOnly>
              <button class="quantity-btn" id="qty-inc" aria-label="Increase Quantity">+</button>
            </div>
            <button class="btn btn-primary" id="add-to-cart-cta">
              <i class="fa-solid fa-bag-shopping"></i> Add to Cart
            </button>
          ` : `
            <button class="btn btn-primary" style="background-color: var(--text-muted); cursor: not-allowed;" disabled>
              Out of Stock
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  const wishlistCta = document.getElementById('wishlist-cta');
  if (wishlistCta) {
    wishlistCta.addEventListener('click', () => toggleWishlist(product._id, wishlistCta));
  }

  if (product.stock > 0) {
    const qtyInput = document.getElementById('qty-input');
    const qtyDec = document.getElementById('qty-dec');
    const qtyInc = document.getElementById('qty-inc');
    const addToCartCta = document.getElementById('add-to-cart-cta');

    qtyDec.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value);
      if (currentVal > 1) {
        qtyInput.value = currentVal - 1;
      }
    });

    qtyInc.addEventListener('click', () => {
      let currentVal = parseInt(qtyInput.value);
      if (currentVal < product.stock) {
        qtyInput.value = currentVal + 1;
      }
    });

    addToCartCta.addEventListener('click', async () => {
      const quantity = parseInt(qtyInput.value, 10);
      await addProductToCart(product._id, quantity);
    });
  }
}

// 6. Related Products Fetching
async function loadRelatedProducts(category, currentId) {
  const relatedGrid = document.getElementById('related-grid');
  if (!relatedGrid) return;

  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error();
    const products = await response.json();
    
    // Filter related items in category, excluding current product, limit to 4
    const related = products
      .filter(p => p.category.toLowerCase() === category.toLowerCase() && p._id !== currentId)
      .slice(0, 4);

    if (related.length === 0) {
      relatedGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted);">No related items found.</p>`;
      return;
    }

    relatedGrid.innerHTML = related.map(p => {
      const ratingValue = p.rating || 0;
      const fullStars = Math.floor(ratingValue);
      const halfStar = ratingValue % 1 >= 0.5 ? 1 : 0;
      const emptyStars = Math.max(0, 5 - fullStars - halfStar);
      let starsHTML = '';
      
      for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fa-solid fa-star"></i>';
      if (halfStar) starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
      for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="fa-regular fa-star"></i>';

      return `
        <article class="product-card" data-id="${p._id}" style="cursor: pointer;">
          <div class="product-card-image">
            <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300.png?text=Product+Image';">
            <div class="product-card-actions">
              <button class="btn-icon add-related-to-cart" data-id="${p._id}" title="Add to Cart" ${p.stock === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-cart-plus"></i>
              </button>
              <a href="product.html?id=${p._id}" class="btn-icon view-related-details" title="View Details">
                <i class="fa-solid fa-eye"></i>
              </a>
            </div>
          </div>
          <div class="product-card-info">
            <span class="product-card-category">${p.category}</span>
            <h3 class="product-card-title">
              <a href="product.html?id=${p._id}">${p.title}</a>
            </h3>
            <div class="product-card-rating">
              ${starsHTML}
              <span>(${ratingValue.toFixed(1)})</span>
            </div>
            <div class="product-card-price-row">
              <span class="product-card-price">$${p.price.toFixed(2)}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Click handler for related cards
    document.querySelectorAll('#related-grid .product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.add-related-to-cart') || e.target.closest('.view-related-details')) {
          return;
        }
        const pId = card.getAttribute('data-id');
        window.location.href = `product.html?id=${pId}`;
      });
    });

    document.querySelectorAll('.add-related-to-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-id');
        await addProductToCart(pId, 1);
      });
    });

  } catch (error) {
    relatedGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted);">Failed to load related products.</p>`;
  }
}

// 7. Cart Action (requires authentication — persists to MongoDB)
async function addProductToCart(productId, quantity) {
  await CartService.addItem(productId, quantity);
}

// 8. Check wishlist status for current product
async function checkWishlistStatus(productId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const isInWishlist = await WishlistService.checkWishlist(productId);
    const wishlistCta = document.getElementById('wishlist-cta');
    if (wishlistCta) {
      const icon = wishlistCta.querySelector('i');
      if (isInWishlist) {
        icon.className = 'fa-solid fa-heart';
        wishlistCta.classList.add('btn-outline--active');
      } else {
        icon.className = 'fa-regular fa-heart';
        wishlistCta.classList.remove('btn-outline--active');
      }
    }
  } catch (error) {
    console.error('Check wishlist status error:', error);
  }
}

// 9. Toggle wishlist
async function toggleWishlist(productId, btn) {
  const token = localStorage.getItem('token');
  if (!token) {
    sessionStorage.setItem('authReturnUrl', window.location.href);
    sessionStorage.setItem('authRedirectMessage', 'Please login to add items to your wishlist.');
    window.location.href = 'login.html';
    return;
  }

  const icon = btn.querySelector('i');
  const originalIcon = icon.className;
  icon.className = 'fa-solid fa-circle-notch fa-spin';
  btn.disabled = true;

  try {
    const isInWishlist = await WishlistService.checkWishlist(productId);

    let result;
    if (isInWishlist) {
      result = await WishlistService.removeFromWishlist(productId);
      if (result.success) {
        icon.className = 'fa-regular fa-heart';
        btn.classList.remove('btn-outline--active');
        if (typeof ToastService !== 'undefined') {
          ToastService.success('Removed from wishlist');
        }
      }
    } else {
      result = await WishlistService.addToWishlist(productId);
      if (result.success) {
        icon.className = 'fa-solid fa-heart';
        btn.classList.add('btn-outline--active');
        if (typeof ToastService !== 'undefined') {
          ToastService.success('Added to wishlist');
        }
      }
    }

    if (result && result.success) {
      WishlistService.syncBadge();
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
