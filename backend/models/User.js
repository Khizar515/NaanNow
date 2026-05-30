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
    profilePic: { type: String, default: '/uploads/defaults/profile-avatar.png' },
    earningsBalance: { type: Number, default: 0 }, 
    
    // 👇 NEW: Rider Verification Fields
    isApprovedRider: { type: Boolean, default: false }, // Admins must flip this to true
    riderProofs: [{ type: String }], // Will store the file paths
    // Useful for customers and riders
    address: { type: String }, 
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);