const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Cart = require('../models/Cart');
const { calculateOrderTotals } = require('../utils/orderPricing');


const getCheckoutSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate('items.product');

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    const subtotal = cart.items.reduce(
      (sum, item) =>
        sum + item.product.price * item.quantity,
      0
    );

    const totals = calculateOrderTotals(subtotal);

    return res.status(200).json({
      success: true,
      totals,
    });
  } catch (error) {
    console.error('Checkout summary error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to calculate checkout totals',
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body =
      razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body.toString())
      .digest('hex');

    const isAuthentic =
      expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Verify payment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
};
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
      });
    }

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order',
    });
  }
};


module.exports = {
  createOrder,
  verifyPayment,
  getCheckoutSummary,
};