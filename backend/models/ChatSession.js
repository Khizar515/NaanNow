const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    // Link the session to the specific order, customer, and rider
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // The Text Chat History
    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    
    // // The Audio Call Logs
    // callLogs: [{
    //     callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    //     startTime: { type: Date, default: Date.now },
    //     endTime: { type: Date },
    //     status: { type: String, enum: ['Missed', 'Completed', 'Rejected'], required: true }
    // }],
    
    // When the order is delivered, this turns false so they can no longer chat
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);