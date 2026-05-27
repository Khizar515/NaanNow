const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    // Links this food item to a specific restaurant
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true }, // e.g., "Starters", "Main Course", "Drinks"
    imageUrl: { type: String, default: '' },
    
    // Allows the restaurant to hide an item if they run out of ingredients
    isAvailable: { type: Boolean, default: true } 
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);