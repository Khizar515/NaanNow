const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Card = require('../models/Card');
const Restaurant = require('../models/Restaurant');
const PlatformSettings = require('../models/PlatformSettings');
const { auth, restrictTo } = require('../middleware/auth');

// @route   GET /api/escrow
// @desc    Get admin escrow details and held orders
router.get('/', auth, async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne() || {};
    const heldOrders = await Order.find({
      status: { $nin: ['delivered', 'completed', 'cancelled'] },
      cardId: { $exists: true, $ne: null }
    })
    .populate('customerId', 'name phone email')
    .populate('restaurantId', 'name address')
    .populate('riderId', 'name phone')
    .sort({ createdAt: -1 });

    res.json({
      escrowBalance: settings.escrowBalance || 0,
      heldOrdersCount: heldOrders.length,
      heldOrders
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/escrow/release/:orderId
// @desc    Manually release escrow funds for an order to rider, manager, admin
router.post('/release/:orderId', auth, restrictTo('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id || req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'completed' || order.status === 'delivered') {
      return res.status(400).json({ message: 'Order payment has already been released' });
    }

    const platformSt = await PlatformSettings.findOne();
    const commissionPct = platformSt?.commission || 15;

    const riderFee = order.deliveryFee || 150;
    const subtotal = order.subtotal || Math.max(0, order.totalAmount - riderFee - (order.platformFee || 30));

    const restaurantEarnings = subtotal * (1 - commissionPct / 100);
    const adminCut = (subtotal * (commissionPct / 100)) + (order.platformFee || 30);

    // 1. Credit Rider
    if (order.riderId) {
      let rider = await User.findById(order.riderId);
      if (rider) {
        rider.walletBalance = (rider.walletBalance || 0) + riderFee;
        await rider.save();
      }
    }

    // 2. Credit Restaurant Manager
    let restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant && restaurant.managerId) {
      let manager = await User.findById(restaurant.managerId);
      if (manager) {
        manager.walletBalance = (manager.walletBalance || 0) + restaurantEarnings;
        await manager.save();
      }
    }

    // 3. Credit Admin Main Wallet
    let adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      adminUser.walletBalance = (adminUser.walletBalance || 0) + adminCut;
      await adminUser.save();
    }

    // Update Platform Escrow Balance
    if (platformSt) {
      platformSt.escrowBalance = Math.max(0, (platformSt.escrowBalance || 0) - order.totalAmount);
      await platformSt.save();
    }

    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    res.json({ message: 'Escrow funds successfully released', order });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/escrow/refund/:orderId
// @desc    Manually refund held escrow funds back to customer card
router.post('/refund/:orderId', auth, restrictTo('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id || req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled and refunded' });
    }

    if (order.cardId) {
      let card = await Card.findById(order.cardId);
      if (card) {
        card.balance += order.totalAmount;
        await card.save();
      }
    }

    const platformSt = await PlatformSettings.findOne();
    if (platformSt) {
      platformSt.escrowBalance = Math.max(0, (platformSt.escrowBalance || 0) - order.totalAmount);
      await platformSt.save();
    }

    order.status = 'cancelled';
    order.adminNotes = 'Refunded by Admin from Escrow Wallet';
    await order.save();

    res.json({ message: 'Order refunded successfully to customer card', order });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
