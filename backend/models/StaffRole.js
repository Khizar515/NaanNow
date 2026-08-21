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
      'users',
      'support',
      'promotions',
      'categories',
      'settings',
      'withdrawals',
      'staff'
    ]
  }],
  createdBy: { type: String, default: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('StaffRole', staffRoleSchema);
