const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Failed to fetch products' });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    // Check if error is due to invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error: Failed to fetch product' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin (Placeholder for now)
const createProduct = async (req, res) => {
  try {
    const { title, description, price, image, category, stock, rating } = req.body;

    // Basic Validation
    if (!title || !description || price === undefined || !image || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = new Product({
      title,
      description,
      price,
      image,
      category,
      stock,
      rating
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Failed to create product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin (Placeholder for now)
const updateProduct = async (req, res) => {
  try {
    const { title, description, price, image, category, stock, rating } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.title = title || product.title;
      product.description = description || product.description;
      product.price = price !== undefined ? price : product.price;
      product.image = image || product.image;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      product.rating = rating !== undefined ? rating : product.rating;

      const updatedProduct = await product.save();
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error: Failed to update product' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin (Placeholder for now)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: req.params.id });
      res.status(200).json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error: Failed to delete product' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
