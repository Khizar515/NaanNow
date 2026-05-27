const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // We will hash this later
    phone: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['customer', 'restaurant_owner', 'admin', 'rider'], 
        default: 'customer' 
    },
    // Useful for customers and riders
    address: { type: String }, 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);