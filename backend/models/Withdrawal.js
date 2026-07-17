const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true }, // "Easypaisa", "Bank Transfer", "JazzCash"
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'pending'
  },
  transactionNumber: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
