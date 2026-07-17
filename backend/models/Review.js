const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  // Keeping productId as String since our menu items are embedded docs and don't necessarily have global ObjectIds used reliably in the frontend yet. 
  // Storing the item name is easier for now to identify the product reviewed.
  productName: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true });

// Enforce one review per user per order per product
reviewSchema.index({ orderId: 1, customerId: 1, productName: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
