require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const productsData = require('./productsData');

const seedProducts = async () => {
  try {
    await connectDB();

    console.log('Clearing old products...');
    await Product.deleteMany();

    console.log('Inserting new products...');
    await Product.insertMany(productsData);

    console.log('Products seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

seedProducts();
