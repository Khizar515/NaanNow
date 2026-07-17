const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount: { type: Number, required: true },
  type: { type: String, enum: ['percentage', 'flat'], required: true },
  minBasket: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'expired'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
