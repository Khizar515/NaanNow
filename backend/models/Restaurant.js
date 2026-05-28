const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    name: { type: String, required: true },
    cuisineType: { type: String, required: true },
    phone: { type: String, required: true },
    
    // Address text for humans
    address: { type: String, required: true },
    
    // GeoJSON for OpenStreetMap / Leaflet calculations
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // MongoDB requires [longitude, latitude]
    },
    
    // Array of image/PDF URLs (e.g., CNIC, utility bill, shop photo)
    verificationDocuments: [{ type: String, required: true }],
    logoUrl: { type: String, default: '' }, 
    
    // Governance State
    isApproved: { type: Boolean, default: false }, 
    isOpen: { type: Boolean, default: false }, // Default to false until approved
    adminStatusMessage: { type: String, default: 'Pending initial review.' }
}, { timestamps: true });

// This index allows us to do "Find restaurants within 5km of me" queries later!
restaurantSchema.index({ location: '2dsphere' }); 

module.exports = mongoose.model('Restaurant', restaurantSchema);