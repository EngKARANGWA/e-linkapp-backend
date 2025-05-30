const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Furniture', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Other']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  image: {
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
    enum: ['Active', 'Inactive', 'Sold'],
    default: 'Active'
  },
  views: {
    type: Number,
    default: 0
  },
  inCart: {
    type: Number,
    default: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 