const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  commission: { type: Number, default: 15 },
  deliveryCharges: { type: Number, default: 150 },
  taxes: { type: Number, default: 5 },
  maintenanceMode: { type: Boolean, default: false },
  backupInterval: { type: String, default: 'Daily' }
}, { timestamps: true });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
