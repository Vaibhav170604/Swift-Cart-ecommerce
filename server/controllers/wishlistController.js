const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [],
      });
    }

    res.status(200).json({
      success: true,
      products: wishlist.products,
    });
  } catch (error) {
    console.error('Get Wishlist Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to fetch wishlist.' });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [productId],
      });
    } else {
      // Check if product already in wishlist
      if (wishlist.products.includes(productId)) {
        return res.status(400).json({ success: false, message: 'Product already in wishlist.' });
      }
      wishlist.products.push(productId);
      await wishlist.save();
    }

    // Populate products for response
    await wishlist.populate('products');

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist.',
      products: wishlist.products,
    });
  } catch (error) {
    console.error('Add to Wishlist Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to add to wishlist.' });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found.' });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();

    // Populate products for response
    await wishlist.populate('products');

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
      products: wishlist.products,
    });
  } catch (error) {
    console.error('Remove from Wishlist Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to remove from wishlist.' });
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(200).json({ success: true, inWishlist: false });
    }

    const inWishlist = wishlist.products.includes(productId);

    res.status(200).json({ success: true, inWishlist });
  } catch (error) {
    console.error('Check Wishlist Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to check wishlist.' });
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found.' });
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared.',
      products: [],
    });
  } catch (error) {
    console.error('Clear Wishlist Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to clear wishlist.' });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
};
