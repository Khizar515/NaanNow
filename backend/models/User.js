const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'manager', 'rider', 'admin'],
    default: 'customer'
  },

  // Profile
  phone: { type: String },
  profilePic: { type: String },
  address: { type: String },

  // Rider specific
  vehicleDetails: { type: String },
  licensePlate: { type: String },
  dob: { type: Date },
  cnicNumber: { type: String },
  cnicFront: { type: String },
  cnicBack: { type: String },
  licenseNumber: { type: String },
  licenseImage: { type: String },
  bikeRegistration: { type: String },
  bikeModel: { type: String },
  bikeColor: { type: String },
  avatar: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  walletNumber: { type: String },

  // Manager specific
  restaurantName: { type: String },
  restaurantAddress: { type: String },
  city: { type: String },
  mapsLocation: { type: String },
  restaurantPhone: { type: String },
  restaurantEmail: { type: String },
  logo: { type: String },
  cover: { type: String },
  photoFront: { type: String },
  photoKitchen: { type: String },
  photoDining: { type: String },
  certDoc: { type: String },
  licenseDoc: { type: String },
  ntnDoc: { type: String },
  holderName: { type: String },

  // Common for Rider/Manager
  isOnline: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['unverified', 'pending', 'approved', 'blocked', 'rejected', 'revoked'],
    default: 'approved'
  },
  rejectionReason: { type: String },
  blockReason: { type: String },
  rating: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },

  // Unban appeal ticket restriction settings set by admin
  unbanRestriction: {
    canOpen: { type: Boolean, default: true },
    blockedUntil: { type: Date, default: null },
    adminRemarks: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
