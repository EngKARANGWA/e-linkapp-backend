const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Seller = require('../models/Seller');

// Middleware to verify seller credentials
const verifySellerCredentials = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await seller.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.seller = seller;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new product
router.post('/', verifySellerCredentials, async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      description,
      address,
      image
    } = req.body;

    const product = new Product({
      name,
      price,
      category,
      description,
      address,
      image: image || 'https://via.placeholder.com/150',
      seller: req.seller._id
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name businessName email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category })
      .populate('seller', 'name businessName email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get seller's products
router.post('/seller', verifySellerCredentials, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.seller._id })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name businessName email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put('/:id', verifySellerCredentials, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.seller._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'price', 'category', 'description', 'address', 'image', 'status'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    updates.forEach(update => product[update] = req.body[update]);
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', verifySellerCredentials, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.seller._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 