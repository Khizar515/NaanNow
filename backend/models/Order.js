const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // The 3 Key People Involved
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null until a rider accepts
    
    // The Cart Items
    items: [{
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true, min: 1 },
        // We save the price *at the time of order* just in case the restaurant changes the price later
        priceAtOrder: { type: Number, required: true } 
    }],
    
    // Financials
    subTotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    
    // Lifecycle of the Order
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    
    // Logistics
    deliveryAddress: { type: String, required: true },
    paymentMethod: { type: String, enum: ['COD', 'Card'], default: 'COD' },
    
    // Real-time tracking coordinates (for the Leaflet map later)
    riderLocation: {
        lat: { type: Number },
        lng: { type: Number }
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);