const express = require('express');
const router = express.Router();
const Payment = require('../models/paymentModel');
const cloudinary = require('../config/cloudinary');
const Upload = require('../config/multer');

// Process payment with image upload
router.post('/', Upload, async (req, res) => {
    try {
        const { amount, paymentMethod, paymentTiming } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Payment reference image is required' });
        }

        // Get Cloudinary details from the uploaded file
        const paymentReference = {
            public_id: req.file.filename,
            url: req.file.path
        };
        const result = await cloudinary.uploader.upload(paymentReference.url, { public_id: paymentReference.public_id });
        paymentReference.url = result.secure_url;
        // Create new payment with proper image reference
        const payment = new Payment({
            amount: Number(amount), // Convert amount to number
            paymentMethod,
            paymentTiming,
            paymentReference
        });

        const savedPayment = await payment.save();

        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            payment: {
                orderId: savedPayment._id,
                amount: savedPayment.amount,
                paymentMethod: savedPayment.paymentMethod,
                paymentReference: savedPayment.paymentReference.url
            }
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing payment'
        });
    }
});

// Delete payment and image
router.delete('/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Delete image from Cloudinary using stored public_id
        if (payment.paymentReference && payment.paymentReference.public_id) {
            await cloudinary.uploader.destroy(payment.paymentReference.public_id);
        }

        await payment.deleteOne();
        res.json({
            success: true,
            message: 'Payment deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error deleting payment'
        });
    }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching payment'
        });
    }
});

module.exports = router;