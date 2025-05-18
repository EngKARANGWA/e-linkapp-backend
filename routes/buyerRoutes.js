const express = require('express');
const router = express.Router();
const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');

// Middleware to verify email and password
const verifyCredentials = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await buyer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.buyer = buyer;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register a new buyer
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, address, location, password } = req.body;

    // Check if buyer already exists
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new buyer
    const buyer = new Buyer({
      name,
      email,
      phone,
      address,
      location,
      password
    });

    await buyer.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: buyer._id, role: 'buyer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Buyer registered successfully',
      token,
      buyer: {
        id: buyer._id,
        name: buyer.name,
        email: buyer.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login buyer
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find buyer by email
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await buyer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: buyer._id, role: 'buyer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      buyer: {
        id: buyer._id,
        name: buyer.name,
        email: buyer.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get buyer profile using email and password
router.post('/profile', verifyCredentials, async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.buyer._id).select('-password');
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all buyers (admin only)
router.get('/', async (req, res) => {
  try {
    const buyers = await Buyer.find().select('-password');
    res.json(buyers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update buyer profile using email and password
router.put('/profile', verifyCredentials, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'phone', 'address', 'location'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.buyer[update] = req.body[update]);
    await req.buyer.save();
    res.json(req.buyer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 