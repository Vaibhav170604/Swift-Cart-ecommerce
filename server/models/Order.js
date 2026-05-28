const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderedItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      }
    }
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0.0,
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0.0,
  },
  taxAmount: {
    type: Number,
    required: true,
    default: 0.0,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0.0,
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending',
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['Processing', 'Shipped', 'Delivered'],
    default: 'Processing',
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
