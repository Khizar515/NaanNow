const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    // Links this item to a specific restaurant
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    
    name: { type: String, required: true },
    description: { type: String, required: true },
    
    // The price the vendor actually wants (e.g., 500 PKR)
    basePrice: { type: Number, required: true }, 
    
    category: { type: String, required: true }, // e.g., "Starters", "Mains", "Drinks"
    imageUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);