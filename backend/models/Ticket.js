const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['customer', 'support'], required: true },
  text: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  chat: [chatMessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
