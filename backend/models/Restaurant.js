const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
  image: { type: String }
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuisine: { type: String },
  rating: { type: Number, default: 0 },
  deliveryTime: { type: String },
  deliveryFee: { type: String },
  image: { type: String },
  logo: { type: String },
  address: { type: String },
  city: { type: String },
  phone: { type: String },
  email: { type: String },
  isSuper: { type: Boolean, default: false },
  deal: { type: String },
  menu: [menuItemSchema],
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'suspended', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
