// ==========================================
// SwiftCart Cart Service (Guest + DB sync)
// ==========================================

const CartService = {
  API_URL: 'http://localhost:5000/api',
  GUEST_KEY: 'cart',

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  getGuestCart() {
    try {
      return JSON.parse(localStorage.getItem(this.GUEST_KEY)) || [];
    } catch {
      return [];
    }
  },

  setGuestCart(items) {
    localStorage.setItem(this.GUEST_KEY, JSON.stringify(items));
  },

  redirectToLogin(message) {
    sessionStorage.setItem('authRedirectMessage', message);
    sessionStorage.setItem(
      'authReturnUrl',
      window.location.pathname + window.location.search
    );
    window.location.href = 'login.html';
  },

  async requireAuthForAction(message) {
    if (this.isAuthenticated()) return true;
    this.redirectToLogin(message);
    return false;
  },

  async getCartCount() {
    if (this.isAuthenticated()) {
      try {
        const response = await fetch(`${this.API_URL}/cart`, {
          headers: this.getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          return data.count || 0;
        }
      } catch (error) {
        console.error('Cart count fetch error:', error);
      }
    }

    const guestCart = this.getGuestCart();
    return guestCart.reduce((sum, item) => sum + item.quantity, 0);
  },

  async syncBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = await this.getCartCount();
    badge.textContent = count;
  },

  animateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    badge.style.transform = 'scale(1.4)';
    badge.style.backgroundColor = '#10b981';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
      badge.style.backgroundColor = 'var(--accent-color)';
    }, 300);
  },

  async mergeGuestCartOnLogin() {
    const guestItems = this.getGuestCart();
    if (!this.isAuthenticated() || guestItems.length === 0) return;

    try {
      const response = await fetch(`${this.API_URL}/cart/merge`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ items: guestItems }),
      });

      if (response.ok) {
        this.setGuestCart([]);
        await this.syncBadge();
      }
    } catch (error) {
      console.error('Cart merge failed:', error);
    }
  },

  async addItem(productId, quantity = 1) {
    if (
      !(await this.requireAuthForAction(
        'Please sign in to add items to your cart.'
      ))
    ) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_URL}/cart/items`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.showToast(data.message || 'Could not add item to cart.', 'error');
        return false;
      }

      await this.syncBadge();
      this.animateBadge();
      return true;
    } catch (error) {
      console.error('Add to cart error:', error);
      this.showToast('Network error. Please try again.', 'error');
      return false;
    }
  },

  async fetchCartWithDetails() {
    if (!this.isAuthenticated()) {
      return [];
    }

    const response = await fetch(`${this.API_URL}/cart`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    const data = await response.json();
    return data.items || [];
  },

  async updateItemQuantity(productId, quantity) {
    const response = await fetch(`${this.API_URL}/cart/items/${productId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update quantity');
    }

    await this.syncBadge();
    return data;
  },

  async removeItem(productId) {
    const response = await fetch(`${this.API_URL}/cart/items/${productId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove item');
    }

    await this.syncBadge();
    return data;
  },

  showToast(message, type = 'info') {
    if (typeof ToastService !== 'undefined') {
      ToastService.show(message, type);
      return;
    }
    alert(message);
  },
};
window.CartService = CartService;