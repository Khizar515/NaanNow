const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
    // Using a single document to hold global variables
    platformMarkupPercentage: { type: Number, default: 10 }, 
    perKmDeliveryRate: { type: Number, default: 30 }, // e.g., 40 PKR per Km
}, { timestamps: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);