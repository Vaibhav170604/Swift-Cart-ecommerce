// ==========================================
// SwiftCart Wishlist Service

// const { log } = require("console");

// ==========================================
console.log('wishlistService loaded');
const WISHLIST_API_URL = 'https://swift-cart-ecommerce.onrender.com/api';

const WishlistService = {
  // Get user's wishlist
  async getWishlist() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await fetch(`${WISHLIST_API_URL}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch wishlist');

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Get wishlist error:', error);
      return null;
    }
  },

  // Add product to wishlist
  async addToWishlist(productId) {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Please login to add to wishlist' };

    try {
      const response = await fetch(`${WISHLIST_API_URL}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return { success: false, message: 'Failed to add to wishlist' };
    }
  },

  // Remove product from wishlist
  async removeFromWishlist(productId) {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Please login to remove from wishlist' };

    try {
      const response = await fetch(`${WISHLIST_API_URL}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return { success: false, message: 'Failed to remove from wishlist' };
    }
  },

  // Check if product is in wishlist
  async checkWishlist(productId) {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await fetch(`${WISHLIST_API_URL}/wishlist/check/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.inWishlist || false;
    } catch (error) {
      console.error('Check wishlist error:', error);
      return false;
    }
  },

  // Clear entire wishlist
  async clearWishlist() {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, message: 'Please login to clear wishlist' };

    try {
      const response = await fetch(`${WISHLIST_API_URL}/wishlist`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Clear wishlist error:', error);
      return { success: false, message: 'Failed to clear wishlist' };
    }
  },

  // Sync wishlist badge count
  async syncBadge() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.updateBadge(0);
      return;
    }

    const products = await this.getWishlist();
    if (products) {
      this.updateBadge(products.length);
    }
  },

  // Update badge in navbar
  updateBadge(count) {
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },
};
console.log('wishlistService loaded');

window.WishlistService = WishlistService;
