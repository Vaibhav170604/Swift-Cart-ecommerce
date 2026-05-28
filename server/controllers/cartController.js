const Cart = require('../models/Cart');
const Product = require('../models/Product');

const formatCartResponse = (cart) => {
  if (!cart || !cart.items.length) {
    return { success: true, count: 0, items: [] };
  }

  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      id: item.product._id.toString(),
      quantity: item.quantity,
      details: item.product,
    }));

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return { success: true, count, items };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @route  GET /api/cart
// @desc   Get logged-in user's cart
// @access Protected
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product'
    );

    return res.status(200).json(formatCartResponse(cart));
  } catch (error) {
    console.error('Get Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch cart.' });
  }
};

// @route  POST /api/cart/merge
// @desc   Merge guest localStorage items into DB cart
// @access Protected
const mergeCart = async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    return res.status(200).json(formatCartResponse(cart));
  }

  try {
    const cart = await getOrCreateCart(req.user._id);

    for (const guestItem of items) {
      const productId = guestItem.id || guestItem.productId || guestItem.product;
      const quantity = Math.max(1, parseInt(guestItem.quantity, 10) || 1);

      if (!productId) continue;

      const product = await Product.findById(productId);
      if (!product) continue;

      const existing = cart.items.find(
        (item) => item.product.toString() === productId.toString()
      );

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, product.stock);
      } else {
        cart.items.push({
          product: productId,
          quantity: Math.min(quantity, product.stock),
        });
      }
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');

    return res.status(200).json({
      ...formatCartResponse(populated),
      message: 'Cart merged successfully.',
    });
  } catch (error) {
    console.error('Merge Cart Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to merge cart.' });
  }
};

// @route  POST /api/cart/items
// @desc   Add item to cart
// @access Protected
const addCartItem = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (product.stock === 0) {
      return res.status(400).json({ success: false, message: 'Product is out of stock.' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find(
      (item) => item.product.toString() === productId.toString()
    );

    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, product.stock);
    } else {
      cart.items.push({
        product: productId,
        quantity: Math.min(qty, product.stock),
      });
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');

    return res.status(200).json({
      ...formatCartResponse(populated),
      message: 'Item added to cart.',
    });
  } catch (error) {
    console.error('Add Cart Item Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
};

// @route  PUT /api/cart/items/:productId
// @desc   Update item quantity
// @access Protected
const updateCartItem = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  if (!qty || qty < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((i) => i.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    item.quantity = Math.min(qty, product.stock);
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product');
    return res.status(200).json(formatCartResponse(populated));
  } catch (error) {
    console.error('Update Cart Item Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update cart item.' });
  }
};

// @route  DELETE /api/cart/items/:productId
// @desc   Remove item from cart
// @access Protected
const removeCartItem = async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await getOrCreateCart(req.user._id);
    const initialLength = cart.items.length;

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');

    return res.status(200).json(formatCartResponse(populated));
  } catch (error) {
    console.error('Remove Cart Item Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to remove cart item.' });
  }
};

module.exports = {
  getCart,
  mergeCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
};
