const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  image: { type: String },
  target: {
    type: String,
    enum: ['all', 'customers', 'riders', 'managers'],
    default: 'all'
  },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
