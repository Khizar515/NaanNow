const mongoose = require('mongoose');

const staffAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole', required: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: String, default: 'Admin' },
  revokedAt: { type: Date, default: null },
  revokedBy: { type: String, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('StaffAssignment', staffAssignmentSchema);
