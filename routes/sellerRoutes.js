const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');

// Middleware to verify email and password
const verifyCredentials = async (req, res, next) => {
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

// Register a new seller
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      businessName,
      email,
      phone,
      businessAddress,
      location,
      password
    } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new seller
    const seller = new Seller({
      name,
      businessName,
      email,
      phone,
      businessAddress,
      location,
      password
    });

    await seller.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: seller._id, role: 'seller' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Seller registered successfully',
      token,
      seller: {
        id: seller._id,
        name: seller.name,
        businessName: seller.businessName,
        email: seller.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login seller
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find seller by email
        const seller = await Seller.findOne({ email });
        if (!seller) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isMatch = await seller.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: seller._id, email: seller.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            seller: {
                id: seller._id,
                name: seller.name,
                businessName: seller.businessName,
                email: seller.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
});

// Get seller profile using email and password
router.post('/profile', verifyCredentials, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('-password');
    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all sellers (admin only)
router.get('/', async (req, res) => {
  try {
    const sellers = await Seller.find().select('-password');
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update seller profile using email and password
router.put('/profile', verifyCredentials, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'businessName', 'phone', 'businessAddress', 'location'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.seller[update] = req.body[update]);
    await req.seller.save();
    res.json(req.seller);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;