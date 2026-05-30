const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    // One cart per user
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    
    // Locks the cart to ONE specific restaurant
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null }, 
    
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true, min: 1 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);