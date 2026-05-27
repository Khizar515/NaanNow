const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    // Link the card to a specific user
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Card Details
    cardHolderName: { type: String, required: true },
    cardNumber: { type: String, required: true, unique: true }, // E.g., "1234 5678 9101 1121"
    expiryDate: { type: String, required: true }, // E.g., "12/28"
    
    // Security (We will treat the PIN like a password)
    cvv: { type: String, required: true }, 
    pin: { type: String, required: true }, // MUST be hashed using bcrypt before saving!
    
    // The simulated money
    balance: { type: Number, default: 5000 }, // Give every new card Rs. 5000 for testing
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);