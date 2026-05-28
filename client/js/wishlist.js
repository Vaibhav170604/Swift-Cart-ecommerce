// ==========================================
// SwiftCart Wishlist Page Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCartCount();
  initWishlistCount();
  checkAuthRedirect();
  loadWishlist();

  // Clear wishlist button
  const clearBtn = document.getElementById('clear-wishlist-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearWishlist);
  }
});

// Theme Management
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

// Sync cart badge
function initCartCount() {
  if (typeof CartService !== 'undefined') {
    CartService.syncBadge();
  }
}

// Sync wishlist badge
function initWishlistCount() {
  if (typeof WishlistService !== 'undefined') {
    WishlistService.syncBadge();
  }
}

// Check auth redirect
function checkAuthRedirect() {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if not authenticated
    sessionStorage.setItem('authReturnUrl', 'wishlist.html');
    sessionStorage.setItem('authRedirectMessage', 'Please login to view your wishlist.');
    window.location.href = 'login.html';
  }
}

// Load wishlist
async function loadWishlist() {
  const loading = document.getElementById('wishlist-loading');
  const empty = document.getElementById('wishlist-empty');
  const grid = document.getElementById('wishlist-grid');
  const clearBtn = document.getElementById('clear-wishlist-btn');

  try {
    loading.style.display = 'flex';
    empty.style.display = 'none';
    grid.style.display = 'none';

    const products = await WishlistService.getWishlist();

    loading.style.display = 'none';

    if (!products || products.length === 0) {
      empty.style.display = 'block';
      clearBtn.style.display = 'none';
    } else {
      grid.style.display = 'grid';
      clearBtn.style.display = 'block';
      renderWishlistItems(products);
    }
  } catch (error) {
    console.error('Load wishlist error:', error);
    loading.style.display = 'none';
    empty.style.display = 'block';
    if (typeof ToastService !== 'undefined') {
      ToastService.error('Failed to load wishlist. Please try again.');
    }
  }
}

// Render wishlist items
function renderWishlistItems(products) {
  const grid = document.getElementById('wishlist-grid');
  grid.innerHTML = '';

  products.forEach(product => {
    const item = createWishlistItem(product);
    grid.appendChild(item);
  });
}

// Create wishlist item element
function createWishlistItem(product) {
  const item = document.createElement('div');
  item.className = 'wishlist-item';
  item.dataset.productId = product._id;

  item.innerHTML = `
    <div class="wishlist-item-image">
      <a href="product.html?id=${product._id}">
        <img src="${product.image}" alt="${product.title}" loading="lazy">
      </a>
      <button class="wishlist-item-remove" data-product-id="${product._id}" title="Remove from wishlist">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="wishlist-item-details">
      <div class="wishlist-item-category">${product.category}</div>
      <h3 class="wishlist-item-title">
        <a href="product.html?id=${product._id}">${product.title}</a>
      </h3>
      <div class="wishlist-item-price">$${product.price.toFixed(2)}</div>
      <div class="wishlist-item-stock">
        ${product.stock > 0 ? `<span class="in-stock"><i class="fa-solid fa-check"></i> In Stock</span>` : `<span class="out-of-stock"><i class="fa-solid fa-xmark"></i> Out of Stock</span>`}
      </div>
    </div>
    <div class="wishlist-item-actions">
      <button class="btn btn-primary btn-sm add-to-cart-btn" data-product-id="${product._id}" ${product.stock === 0 ? 'disabled' : ''}>
        <i class="fa-solid fa-bag-shopping"></i> ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  `;

  // Add event listeners
  const removeBtn = item.querySelector('.wishlist-item-remove');
  removeBtn.addEventListener('click', () => handleRemoveFromWishlist(product._id));

  const addCartBtn = item.querySelector('.add-to-cart-btn');
  if (product.stock > 0) {
    addCartBtn.addEventListener('click', () => handleAddToCart(product));
  }

  return item;
}

// Handle remove from wishlist
async function handleRemoveFromWishlist(productId) {
  const item = document.querySelector(`.wishlist-item[data-product-id="${productId}"]`);
  if (!item) return;

  // Show loading state on button
  const removeBtn = item.querySelector('.wishlist-item-remove');
  const originalIcon = removeBtn.innerHTML;
  removeBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
  removeBtn.disabled = true;

  try {
    const result = await WishlistService.removeFromWishlist(productId);

    if (result.success) {
      // Animate removal
      item.style.transform = 'translateX(100px)';
      item.style.opacity = '0';
      item.style.transition = 'all 0.3s ease';

      setTimeout(() => {
        item.remove();
        // Check if wishlist is now empty
        const remainingItems = document.querySelectorAll('.wishlist-item');
        if (remainingItems.length === 0) {
          loadWishlist();
        }
        // Update badge
        WishlistService.syncBadge();
      }, 300);

      if (typeof ToastService !== 'undefined') {
        ToastService.success('Item removed from wishlist');
      }
    } else {
      removeBtn.innerHTML = originalIcon;
      removeBtn.disabled = false;
      if (typeof ToastService !== 'undefined') {
        ToastService.error(result.message || 'Failed to remove item');
      }
    }
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    removeBtn.innerHTML = originalIcon;
    removeBtn.disabled = false;
    if (typeof ToastService !== 'undefined') {
      ToastService.error('Failed to remove item. Please try again.');
    }
  }
}

// Handle add to cart from wishlist
async function handleAddToCart(product) {
  const item = document.querySelector(
    `.wishlist-item[data-product-id="${product._id}"]`
  );

  if (!item) return;

  const addBtn = item.querySelector('.add-to-cart-btn');

  if (!addBtn || !window.CartService) return;

  const originalContent = addBtn.innerHTML;

  const resetButton = () => {
    addBtn.innerHTML = originalContent;
    addBtn.disabled = false;
  };

  addBtn.innerHTML =
    '<i class="fa-solid fa-circle-notch fa-spin"></i> Adding...';

  addBtn.disabled = true;

  try {
    const result = await window.CartService.addItem(product._id, 1);

    if (result) {
      addBtn.innerHTML =
        '<i class="fa-solid fa-check"></i> Added!';

      addBtn.classList.remove('btn-primary');
      addBtn.classList.add('btn-success');

      if (window.ToastService) {
        ToastService.success('Item added to cart');
      }

      window.CartService.syncBadge();

      setTimeout(() => {
        resetButton();

        addBtn.classList.remove('btn-success');
        addBtn.classList.add('btn-primary');
      }, 2000);
    } else {
      resetButton();

      if (window.ToastService) {
        ToastService.error('Failed to add to cart');
      }
    }
  } catch (error) {
    console.error('Add to cart error:', error);

    resetButton();

    if (window.ToastService) {
      ToastService.error(
        'Failed to add to cart. Please try again.'
      );
    }
  }
}

// Handle clear wishlist
async function handleClearWishlist() {
  if (!confirm('Are you sure you want to clear your entire wishlist?')) {
    return;
  }

  const clearBtn = document.getElementById('clear-wishlist-btn');
  const originalContent = clearBtn.innerHTML;
  clearBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Clearing...';
  clearBtn.disabled = true;

  try {
    const result = await WishlistService.clearWishlist();

    if (result.success) {
      if (typeof ToastService !== 'undefined') {
        ToastService.success('Wishlist cleared');
      }
      loadWishlist();
      WishlistService.syncBadge();
    } else {
      clearBtn.innerHTML = originalContent;
      clearBtn.disabled = false;
      if (typeof ToastService !== 'undefined') {
        ToastService.error(result.message || 'Failed to clear wishlist');
      }
    }
  } catch (error) {
    console.error('Clear wishlist error:', error);
    clearBtn.innerHTML = originalContent;
    clearBtn.disabled = false;
    if (typeof ToastService !== 'undefined') {
      ToastService.error('Failed to clear wishlist. Please try again.');
    }
  }
}
