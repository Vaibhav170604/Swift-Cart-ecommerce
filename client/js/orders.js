// ==========================================
// SwiftCart Order History Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  PageUI.initTheme();
  PageUI.initMobileNav();

  if (!AuthGuard.requireOrdersAuth()) return;

  CartService.syncBadge();
  loadOrders();
});

function renderOrdersLoading() {
  const root = document.getElementById('orders-root');
  root.innerHTML = PageUI.loadingHTML('Loading your orders...');
}

async function loadOrders() {
  renderOrdersLoading();

  try {
    const orders = await OrderService.fetchMyOrders();

    if (orders.length === 0) {
      renderEmptyOrders();
      return;
    }

    renderOrdersList(orders);
  } catch (error) {
    console.error(error);
    renderOrdersError();
  }
}

function renderEmptyOrders() {
  const root = document.getElementById('orders-root');
  root.innerHTML = `
    <div class="orders-header">
      <h1 class="orders-title">My Orders</h1>
      <p class="orders-subtitle">Track your purchases and order status.</p>
    </div>
    ${PageUI.emptyStateHTML({
      icon: 'fa-box-open',
      title: 'No orders yet',
      message: 'When you place an order, it will appear here with full details and status updates.',
      actionHtml: '<a href="index.html" class="btn btn-primary">Start Shopping</a>',
    })}
  `;
}

function renderOrdersError() {
  const root = document.getElementById('orders-root');
  root.innerHTML = `
    <div class="orders-header">
      <h1 class="orders-title">My Orders</h1>
    </div>
    ${PageUI.errorStateHTML({
      title: 'Failed to load orders',
      message: 'We could not retrieve your order history. Please try again.',
      retryFn: 'loadOrders',
    })}
  `;
}

function renderOrdersList(orders) {
  const root = document.getElementById('orders-root');

  const cards = orders
    .map((order) => {
      const previewItems = order.orderedItems
        .slice(0, 3)
        .map(
          (item) => `
        <div class="order-card-thumb">
          <img src="${item.product?.image || ''}" alt="">
        </div>
      `
        )
        .join('');

      const extraCount =
        order.orderedItems.length > 3
          ? `<span class="order-card-more">+${order.orderedItems.length - 3} more</span>`
          : '';

      const itemCount = order.orderedItems.reduce((s, i) => s + i.quantity, 0);

      return `
        <article class="order-card" data-order-id="${order._id}">
          <div class="order-card-header">
            <div>
              <span class="order-card-id">Order #${order._id.slice(-8).toUpperCase()}</span>
              <span class="order-card-date">${OrderService.formatDate(order.createdAt)}</span>
            </div>
            <span class="order-status-badge ${OrderService.statusClass(order.orderStatus)}">${order.orderStatus}</span>
          </div>
          <div class="order-card-items">
            ${previewItems}
            ${extraCount}
          </div>
          <div class="order-card-footer">
            <span class="order-card-meta">${itemCount} item${itemCount !== 1 ? 's' : ''} · Payment: ${order.paymentStatus}</span>
            <span class="order-card-total">${OrderService.formatCurrency(order.totalAmount)}</span>
          </div>
          <div class="order-card-breakdown">
            <span>Subtotal ${OrderService.formatCurrency(order.subtotal)}</span>
            <span>Shipping ${order.shippingCost === 0 ? 'Free' : OrderService.formatCurrency(order.shippingCost)}</span>
            <span>Tax ${OrderService.formatCurrency(order.taxAmount)}</span>
          </div>
          <button type="button" class="order-card-link view-order-details-btn" data-order-id="${order._id}">
            View details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </article>
      `;
    })
    .join('');

  root.innerHTML = `
    <div class="orders-header">
      <h1 class="orders-title">My Orders</h1>
      <p class="orders-subtitle">Track your purchases and order status.</p>
    </div>
    <div class="orders-list">${cards}</div>
  `;

  document.querySelectorAll('.view-order-details-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      OrderModal.open(btn.getAttribute('data-order-id'));
    });
  });
}
