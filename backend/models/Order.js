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
  subtotal: { type: Number },
  platformFee: { type: Number },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready_for_pickup', 'handed_over', 'out_for_delivery', 'delivered', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  customerOtp: { type: String },
  handoverOtp: { type: String },
  riderLat: { type: Number },
  riderLng: { type: Number },
  riderLocationUpdatedAt: { type: Date },
  deliveryAddress: { type: String },
  paymentMethod: { type: String, default: 'Credit / Debit Card' },
  deliverySpeed: { type: String }, // 'standard' | 'priority'
  instructions: { type: String },
  phone: { type: String },
  name: { type: String },
  deliveryLat: { type: Number },
  deliveryLng: { type: Number },
  deliveryFee: { type: Number },
  dispatchedAt: { type: Date },
  completedAt: { type: Date },
  customerConfirmedAt: { type: Date },
  messages: [chatMessageSchema],
  rating: ratingSchema,
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
