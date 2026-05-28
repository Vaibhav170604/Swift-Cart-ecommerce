// ==========================================
// SwiftCart Order Details Modal
// ==========================================

const OrderModal = {
  _previousFocus: null,

  async open(orderId) {
    this._previousFocus = document.activeElement;
    this._renderLoading();

    try {
      const order = await OrderService.fetchOrderById(orderId);
      this._renderOrder(order);
      this._trapFocus();
    } catch (error) {
      ToastService.error(error.message || 'Could not load order details.');
      this.close();
    }
  },

  _renderLoading() {
    let overlay = document.getElementById('order-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'order-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.classList.add('modal-overlay--visible');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'order-modal-title');
    document.body.classList.add('modal-open');

    overlay.innerHTML = `
      <div class="modal-dialog order-modal">
        ${PageUI.loadingHTML('Loading order details...')}
      </div>
    `;

    overlay.addEventListener('click', this._handleOverlayClick);
    document.addEventListener('keydown', this._handleKeydown);
  },

  _renderOrder(order) {
    const overlay = document.getElementById('order-modal-overlay');
    if (!overlay) return;

    const itemsHtml = order.orderedItems
      .map(
        (item) => `
      <li class="order-modal-item">
        <img src="${item.product?.image || ''}" alt="" width="48" height="48">
        <div class="order-modal-item-info">
          <span class="order-modal-item-title">${item.product?.title || 'Product'}</span>
          <span class="order-modal-item-meta">Qty ${item.quantity} · ${OrderService.formatCurrency(item.price)} each</span>
        </div>
        <span class="order-modal-item-total">${OrderService.formatCurrency(item.price * item.quantity)}</span>
      </li>
    `
      )
      .join('');

    overlay.innerHTML = `
      <div class="modal-dialog order-modal">
        <button type="button" class="modal-close" id="order-modal-close" aria-label="Close order details">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <header class="order-modal-header">
          <h2 id="order-modal-title">Order #${order._id.slice(-8).toUpperCase()}</h2>
          <p class="order-modal-date">${OrderService.formatDate(order.createdAt)}</p>
          <div class="order-modal-badges">
            <span class="order-status-badge ${OrderService.statusClass(order.orderStatus)}">${order.orderStatus}</span>
            <span class="order-status-badge ${OrderService.statusClass(order.paymentStatus)}">${order.paymentStatus}</span>
          </div>
        </header>
        <div class="order-modal-body">
          <section class="order-modal-section">
            <h3><i class="fa-solid fa-box" aria-hidden="true"></i> Items</h3>
            <ul class="order-modal-items">${itemsHtml}</ul>
          </section>
          <section class="order-modal-section">
            <h3><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Shipping</h3>
            <p class="order-modal-address">
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
              ${order.shippingAddress.country}
            </p>
          </section>
          <section class="order-modal-section order-modal-totals">
            <div class="summary-row"><span>Subtotal</span><span>${OrderService.formatCurrency(order.subtotal)}</span></div>
            <div class="summary-row"><span>Shipping</span><span>${order.shippingCost === 0 ? '<span class="summary-free-shipping">Free</span>' : OrderService.formatCurrency(order.shippingCost)}</span></div>
            <div class="summary-row"><span>Tax</span><span>${OrderService.formatCurrency(order.taxAmount)}</span></div>
            <div class="summary-row total"><span>Total</span><span>${OrderService.formatCurrency(order.totalAmount)}</span></div>
          </section>
        </div>
      </div>
    `;

    document.getElementById('order-modal-close').addEventListener('click', () => this.close());
    document.getElementById('order-modal-close').focus();
  },

  _handleOverlayClick(e) {
    if (e.target.id === 'order-modal-overlay') {
      OrderModal.close();
    }
  },

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      OrderModal.close();
    }
  },

  _trapFocus() {
    const overlay = document.getElementById('order-modal-overlay');
    if (!overlay) return;
    const focusable = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  },

  close() {
    const overlay = document.getElementById('order-modal-overlay');
    if (overlay) {
      overlay.classList.remove('modal-overlay--visible');
      overlay.removeEventListener('click', this._handleOverlayClick);
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
    }
    document.removeEventListener('keydown', this._handleKeydown);
    document.body.classList.remove('modal-open');
    if (this._previousFocus) this._previousFocus.focus();
  },
};
