const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { upload, cloudinary } = require('../config/cloudinary');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Product image is required' 
      });
    }

    const product = new Product({
      name,
      description,
      price: Number(price),
      category,
      image: {
        public_id: req.file.filename,
        url: req.file.path
      }
    });

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product'
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updates = { ...req.body };

    if (req.file) {
      // Delete old image from Cloudinary
      if (product.image.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }

      updates.image = {
        public_id: req.file.filename,
        url: req.file.path
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;