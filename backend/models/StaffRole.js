const mongoose = require('mongoose');

const staffRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  permissions: [{
    type: String,
    enum: [
      'dashboard',
      'orders',
      'restaurants',
      'riders',
      'customers',
      'verification',
      'menu_categories',
      'payments',
      'promotions',
      'analytics',
      'support',
      'notifications',
      'staff',
      'settings'
    ]
  }],
  createdBy: { type: String, default: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('StaffRole', staffRoleSchema);
