const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank Transfer', 'Mobile Payment', 'Credit Card']
  },
  paymentTiming: {
    type: String,
    required: true,
    enum: ['Pay Now', 'Pay Later']
  },
  paymentReference: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Completed', 'Failed']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);