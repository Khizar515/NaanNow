const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Card = require('../models/Card');
const PlatformSettings = require('../models/PlatformSettings');
const { auth, restrictTo } = require('../middleware/auth');

function generateOtp() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// @route   POST /api/orders
// @desc    Create a new order
router.post('/', auth, restrictTo('customer'), async (req, res) => {
  try {
    const { 
      restaurantId, 
      items, 
      totalAmount, 
      subtotal, 
      platformFee, 
      cardId, 
      pin, 
      deliveryAddress, 
      paymentMethod, 
      deliverySpeed, 
      instructions, 
      phone, 
      name, 
      deliveryLat, 
      deliveryLng, 
      deliveryFee 
    } = req.body;

    if (!cardId) {
      return res.status(400).json({ message: 'Please select a valid card from your profile' });
    }

    const card = await Card.findById(cardId);
    if (!card || card.userId.toString() !== req.user._id.toString() || card.status !== 'active') {
      return res.status(400).json({ message: 'Selected card is invalid or disabled' });
    }

    if (!pin || (card.pin && card.pin !== pin.toString().trim())) {
      return res.status(400).json({ message: 'Invalid card 4-digit security PIN. Verification failed.' });
    }

    if (card.balance < totalAmount) {
      return res.status(400).json({ message: `Insufficient card balance. Card balance: Rs. ${card.balance}` });
    }

    // Deduct from card balance
    card.balance -= totalAmount;
    await card.save();

    // Transfer to Admin Escrow
    let st = await PlatformSettings.findOne();
    if (!st) st = new PlatformSettings();
    st.escrowBalance = (st.escrowBalance || 0) + totalAmount;
    await st.save();

    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${1000 + orderCount + 1}`;
    const customerOtp = generateOtp();

    const newOrder = new Order({
      orderNumber,
      customerId: req.user._id,
      restaurantId,
      items,
      totalAmount,
      subtotal: subtotal || (totalAmount - (deliveryFee || 150) - (platformFee || 30)),
      platformFee: platformFee || 30,
      cardId,
      customerOtp,
      deliveryAddress,
      paymentMethod: paymentMethod || 'Credit / Debit Card',
      deliverySpeed,
      instructions,
      phone,
      name,
      deliveryLat,
      deliveryLng,
      deliveryFee: deliveryFee || 150,
      status: 'pending'
    });

    const order = await newOrder.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/orders
// @desc    Get orders based on role or myOrders filter
router.get('/', auth, async (req, res) => {
  try {
    let orders;

    if (req.query.myOrders === 'true') {
      orders = await Order.find({ customerId: req.user._id })
        .populate('restaurantId', 'name address lat lng')
        .populate('riderId', 'name phone vehicleDetails licensePlate bikeModel bikeColor avatar rating')
        .sort({ createdAt: -1 });
      return res.json(orders);
    }

    if (req.user.role === 'admin') {
      orders = await Order.find()
        .populate('customerId', 'name phone')
        .populate('restaurantId', 'name address lat lng')
        .populate('riderId', 'name phone vehicleDetails licensePlate bikeModel bikeColor avatar rating')
        .sort({ createdAt: -1 });
    }
    else if (req.user.role === 'customer') {
      orders = await Order.find({ customerId: req.user._id })
        .populate('restaurantId', 'name address lat lng')
        .populate('riderId', 'name phone vehicleDetails licensePlate bikeModel bikeColor avatar rating')
        .sort({ createdAt: -1 });
    }
    else if (req.user.role === 'manager') {
      const restaurant = await Restaurant.findOne({ managerId: req.user._id });
      if (!restaurant) {
        return res.status(400).json({ message: 'No restaurant found for this manager' });
      }
      orders = await Order.find({ restaurantId: restaurant._id })
        .populate('customerId', 'name phone')
        .populate('riderId', 'name phone vehicleDetails licensePlate bikeModel bikeColor avatar rating')
        .sort({ createdAt: -1 });
    }
    else if (req.user.role === 'rider') {
      // Rider sees unassigned orders ONLY when in 'preparing' status
      // AND orders assigned to themselves
      orders = await Order.find({
        $or: [
          { status: 'preparing', $or: [{ riderId: { $exists: false } }, { riderId: null }] },
          { riderId: req.user._id }
        ]
      })
      .populate('restaurantId', 'name address city mapsLocation lat lng')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name address phone lat lng')
      .populate('customerId', 'name phone profilePic')
      .populate('riderId', 'name phone vehicleDetails licensePlate bikeModel bikeColor avatar rating');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status with strict gating
router.put('/:id/status', auth, restrictTo('manager', 'rider', 'admin'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Gate: Rider can only mark out_for_delivery if manager has set status to handed_over
    if (req.user.role === 'rider' && status === 'out_for_delivery' && order.status !== 'handed_over') {
      return res.status(400).json({ message: 'Order cannot be marked Out for Delivery until manager marks it Handed over to rider' });
    }

    // Manager setting ready_for_pickup or preparing
    order.status = status;
    if (status === 'out_for_delivery') {
      order.dispatchedAt = new Date();
    }
    if (adminNotes) order.adminNotes = adminNotes;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/orders/:id/assign
// @desc    Assign order to rider when marked preparing
router.put('/:id/assign', auth, restrictTo('rider'), async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'preparing') {
      return res.status(400).json({ message: 'Riders can only accept orders marked as Preparing by restaurant' });
    }
    if (order.riderId) return res.status(400).json({ message: 'Order already assigned to another rider' });

    order.riderId = req.user._id;
    order.handoverOtp = generateOtp(); // Generate random 6-char OTP for handover
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('restaurantId', 'name address city mapsLocation lat lng')
      .populate('customerId', 'name phone')
      .populate('riderId', 'name phone vehicleDetails licensePlate bikeModel bikeColor avatar rating');

    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/orders/:id/verify-handover-otp
// @desc    Restaurant manager verifies handover OTP from rider -> status becomes handed_over
router.put('/:id/verify-handover-otp', auth, restrictTo('manager', 'admin'), async (req, res) => {
  try {
    const { otp } = req.body;
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.handoverOtp) {
      return res.status(400).json({ message: 'No handover OTP generated for this order yet' });
    }

    if (order.handoverOtp.toUpperCase() !== (otp || '').trim().toUpperCase()) {
      return res.status(400).json({ message: 'Incorrect Handover OTP. Please verify with rider.' });
    }

    order.status = 'handed_over';
    await order.save();

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/orders/:id/verify-delivery-otp
// @desc    Rider verifies customer OTP on delivery -> status becomes delivered & funds transferred from Escrow
router.put('/:id/verify-delivery-otp', auth, restrictTo('rider', 'admin'), async (req, res) => {
  try {
    const { otp } = req.body;
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.customerOtp) {
      return res.status(400).json({ message: 'No customer OTP found for this order' });
    }

    if (order.customerOtp.toUpperCase() !== (otp || '').trim().toUpperCase()) {
      return res.status(400).json({ message: 'Incorrect Customer OTP. Delivery verification failed.' });
    }

    if (order.status !== 'delivered' && order.status !== 'completed') {
      order.status = 'delivered';
      order.completedAt = new Date();

      // Transfer money from Admin Escrow Wallet to Rider, Restaurant Manager, and Admin Cut
      const platformSt = await PlatformSettings.findOne();
      const commissionPct = platformSt?.commission || 15;

      const riderFee = order.deliveryFee || 150;
      const subtotal = order.subtotal || Math.max(0, order.totalAmount - riderFee - (order.platformFee || 30));

      const restaurantEarnings = subtotal * (1 - commissionPct / 100);
      const adminCut = (subtotal * (commissionPct / 100)) + (order.platformFee || 30);

      // 1. Credit Rider Wallet
      if (order.riderId) {
        let rider = await User.findById(order.riderId);
        if (rider) {
          rider.walletBalance = (rider.walletBalance || 0) + riderFee;
          await rider.save();
        }
      }

      // 2. Credit Restaurant Manager Wallet
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

      // Deduct from Admin Escrow Balance
      if (platformSt) {
        platformSt.escrowBalance = Math.max(0, (platformSt.escrowBalance || 0) - order.totalAmount);
        await platformSt.save();
      }

      await order.save();
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH /api/orders/:id/rider-location
// @desc    Update live GPS coordinates of rider
router.patch('/:id/rider-location', auth, restrictTo('rider'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.riderLat = lat;
    order.riderLng = lng;
    order.riderLocationUpdatedAt = new Date();
    await order.save();

    res.json({ success: true, riderLat: lat, riderLng: lng });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/orders/:id/rate
// @desc    Rate an order (Rider & Restaurant)
router.put('/:id/rate', auth, restrictTo('customer'), async (req, res) => {
  try {
    const { riderRating, riderReview, restaurantRating, restaurantReview, itemRatings } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.rating = {
      riderRating,
      riderReview,
      restaurantRating,
      restaurantReview,
      itemRatings
    };

    // Update rider average rating
    if (riderRating && order.riderId) {
      const rider = await User.findById(order.riderId);
      if (rider) {
        const riderOrders = await Order.find({ riderId: order.riderId, 'rating.riderRating': { $exists: true } });
        const totalRiderRatings = riderOrders.reduce((sum, o) => sum + (o.rating?.riderRating || 0), 0) + riderRating;
        const count = riderOrders.length + 1;
        rider.rating = Number((totalRiderRatings / count).toFixed(1));
        await rider.save();
      }
    }

    // Update restaurant average rating
    if (restaurantRating && order.restaurantId) {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (restaurant) {
        const restOrders = await Order.find({ restaurantId: order.restaurantId, 'rating.restaurantRating': { $exists: true } });
        const totalRestRatings = restOrders.reduce((sum, o) => sum + (o.rating?.restaurantRating || 0), 0) + restaurantRating;
        const count = restOrders.length + 1;
        restaurant.rating = Number((totalRestRatings / count).toFixed(1));
        await restaurant.save();
      }
    }

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/orders/:id/message
// @desc    Add a chat message to an order
router.post('/:id/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const senderRole = req.user.role === 'rider' ? 'rider' : 'customer';
    order.messages.push({
      sender: senderRole,
      text,
      time: new Date()
    });

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
