const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cardNumber: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cvv: { type: String, required: true },
  balance: { type: Number, default: 5000 },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' }
}, { timestamps: true });

// Prevent a user from having duplicate active card numbers
// We allow multiple if they are disabled, or just enforce unique (cardNumber, userId) combination
cardSchema.index({ userId: 1, cardNumber: 1 }, { unique: true });

module.exports = mongoose.model('Card', cardSchema);
