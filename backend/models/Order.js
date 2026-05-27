const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Assigned later
    
    // Snapshot of the items at the exact moment of purchase
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitDisplayPrice: { type: Number, required: true } // Price INCLUDING the platform markup
    }],

    deliveryAddress: { type: String, required: true },
    deliveryCoordinates: { type: [Number], required: true }, // [longitude, latitude]

    financials: {
        itemTotal: { type: Number, required: true },
        deliveryFee: { type: Number, required: true }, // Goes to the rider
        grandTotal: { type: Number, required: true }   // Deducted from customer card
    },

    status: { 
        type: String, 
        enum: ['Pending', 'Preparing', 'Ready for Pickup', 'Accepted by Rider', 'Out for Delivery', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);