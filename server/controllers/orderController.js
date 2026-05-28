const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { calculateOrderTotals } = require('../utils/orderPricing');

const formatOrder = (order) => ({
  _id: order._id,
  orderStatus: order.orderStatus,
  paymentStatus: order.paymentStatus,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  shippingAddress: order.shippingAddress,
  subtotal: order.subtotal,
  shippingCost: order.shippingCost,
  taxAmount: order.taxAmount,
  totalAmount: order.totalAmount,
  orderedItems: order.orderedItems.map((item) => ({
    product: item.product
      ? {
          _id: item.product._id,
          title: item.product.title,
          image: item.product.image,
          category: item.product.category,
        }
      : null,
    quantity: item.quantity,
    price: item.price,
  })),
});

// @route  POST /api/orders
// @desc   Create order from cart (validates stock, clears cart)
// @access Protected
const createOrder = async (req, res) => {
  const { shippingAddress } = req.body;

  if (
    !shippingAddress ||
    !shippingAddress.address ||
    !shippingAddress.city ||
    !shippingAddress.postalCode ||
    !shippingAddress.country
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a complete shipping address.',
    });
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product'
    );

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add items before checkout.',
      });
    }

    const validItems = cart.items.filter((item) => item.product);

    if (validItems.length === 0) {
      cart.items = [];
      await cart.save();
      return res.status(400).json({
        success: false,
        message: 'No valid products found in your cart.',
      });
    }

    for (const item of validItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'A product in your cart is no longer available.',
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title}". Only ${product.stock} available.`,
        });
      }
    }

    const rawSubtotal = validItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totals = calculateOrderTotals(rawSubtotal);

    const orderedItems = validItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const order = await Order.create({
      user: req.user._id,
      orderedItems,
      shippingAddress: {
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country.trim(),
      },
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paymentStatus: 'Completed',
      orderStatus: 'Processing',
    });

    for (const item of validItems) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    cart.items = [];
    await cart.save();

    const populated = await Order.findById(order._id).populate(
      'orderedItems.product'
    );

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order: formatOrder(populated),
    });
  } catch (error) {
    console.error('Create Order Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order. Please try again.',
    });
  }
};

// @route  GET /api/orders
// @desc   Get logged-in user's order history
// @access Protected
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderedItems.product');

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    console.error('Get Orders Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order history.',
    });
  }
};

// @route  GET /api/orders/:id
// @desc   Get single order by ID
// @access Protected
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('orderedItems.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      order: formatOrder(order),
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    console.error('Get Order Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order.',
    });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById };
