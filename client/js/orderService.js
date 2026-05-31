// ==========================================
// SwiftCart Order Service
// ==========================================

const OrderService = {
  API_URL: 'https://swift-cart-ecommerce.onrender.com/api',
  SHIPPING_COST: 5.99,
  FREE_SHIPPING_MIN: 50,
  TAX_RATE: 0.08,

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  calculateTotals(cartItems) {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.details.price * item.quantity,
      0
    );
    const shipping =
      subtotal >= this.FREE_SHIPPING_MIN ? 0 : this.SHIPPING_COST;
    const tax = Math.round(subtotal * this.TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping,
      tax,
      total,
    };
  },

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  formatCurrency(amount) {
    return `$${Number(amount).toFixed(2)}`;
  },

  statusClass(status) {
    const map = {
      Processing: 'order-status--processing',
      Shipped: 'order-status--shipped',
      Delivered: 'order-status--delivered',
      Pending: 'order-status--pending',
      Completed: 'order-status--completed',
      Failed: 'order-status--failed',
    };
    return map[status] || 'order-status--processing';
  },

  async createOrder(shippingAddress) {
    const response = await fetch(`${this.API_URL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ shippingAddress }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to place order.');
    }
    return data.order;
  },

  async fetchMyOrders() {
    const response = await fetch(`${this.API_URL}/orders`, {
      headers: this.getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load orders.');
    }
    return data.orders || [];
  },

  async fetchOrderById(orderId) {
    const response = await fetch(`${this.API_URL}/orders/${orderId}`, {
      headers: this.getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load order.');
    }
    return data.order;
  },

  showToast(message, type = 'info') {
    if (typeof ToastService !== 'undefined') {
      ToastService.show(message, type);
    } else if (typeof CartService !== 'undefined') {
      CartService.showToast(message, type);
    }
  },
};
