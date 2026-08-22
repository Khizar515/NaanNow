const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['customer', 'manager', 'rider', 'support'], required: true },
  text: { type: String, required: true },
  attachments: [{ type: String }],
  time: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Alias for backward compatibility
  userRole: {
    type: String,
    enum: ['customer', 'manager', 'rider'],
    default: 'customer'
  },
  ticketType: {
    type: String,
    enum: ['general', 'unban'],
    default: 'general'
  },
  subject: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: { type: String },
  adminAction: { type: String, default: '' },
  closedAt: { type: Date },
  closedBy: { type: String },
  closingUnbanRestriction: {
    canOpen: { type: Boolean, default: true },
    blockedUntil: { type: Date, default: null },
    adminRemarks: { type: String, default: '' }
  },
  chat: [chatMessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);

