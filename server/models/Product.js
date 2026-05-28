const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a product title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: 0,
  },
  image: {
    type: String,
    required: [true, 'Please provide a product image URL'],
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
  },
  stock: {
    type: Number,
    required: [true, 'Please provide product stock quantity'],
    min: 0,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
