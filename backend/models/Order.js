const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const chatMessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['rider', 'customer'], required: true },
  text: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

const ratingSchema = new mongoose.Schema({
  riderRating: { type: Number, min: 1, max: 5 },
  riderReview: { type: String },
  restaurantRating: { type: Number, min: 1, max: 5 },
  restaurantReview: { type: String },
  itemRatings: { type: Map, of: Number } // item id to rating mapping
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  deliveryAddress: { type: String },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  deliverySpeed: { type: String }, // 'standard' | 'priority'
  instructions: { type: String },
  phone: { type: String },
  name: { type: String },
  dispatchedAt: { type: Date },
  completedAt: { type: Date },
  customerConfirmedAt: { type: Date },
  messages: [chatMessageSchema],
  rating: ratingSchema,
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
