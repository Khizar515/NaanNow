const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { auth, restrictTo } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create a new order
router.post('/', auth, restrictTo('customer'), async (req, res) => {
  try {
    const { restaurantId, items, totalAmount, deliveryAddress, paymentMethod, deliverySpeed, instructions, phone, name } = req.body;

    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${1000 + orderCount + 1}`;

    const newOrder = new Order({
      orderNumber,
      customerId: req.user._id,
      restaurantId,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      deliverySpeed,
      instructions,
      phone,
      name
    });

    const order = await newOrder.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/orders
// @desc    Get orders based on role
router.get('/', auth, async (req, res) => {
  try {
    let orders;

    if (req.user.role === 'admin') {
      orders = await Order.find()
        .populate('customerId', 'name phone')
        .populate('restaurantId', 'name address')
        .populate('riderId', 'name phone vehicleDetails')
        .sort({ createdAt: -1 });
    }
    else if (req.user.role === 'customer') {
      orders = await Order.find({ customerId: req.user._id })
        .populate('restaurantId', 'name address')
        .populate('riderId', 'name phone vehicleDetails licensePlate avatar')
        .sort({ createdAt: -1 });
    }
    else if (req.user.role === 'manager') {
      const restaurant = await Restaurant.findOne({ managerId: req.user._id });
      if (!restaurant) {
        return res.status(400).json({ message: 'No restaurant found for this manager' });
      }
      orders = await Order.find({ restaurantId: restaurant._id })
        .populate('customerId', 'name phone')
        .populate('riderId', 'name phone vehicleDetails')
        .sort({ createdAt: -1 });
    }
    else if (req.user.role === 'rider') {
      // Rider sees unassigned orders across key statuses
      // AND orders already assigned to them
      orders = await Order.find({
        $or: [
          { status: { $in: ['pending', 'preparing', 'ready_for_pickup'] }, $or: [{ riderId: { $exists: false } }, { riderId: null }] },
          { riderId: req.user._id }
        ]
      })
      .populate('restaurantId', 'name address city mapsLocation')
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
      .populate('restaurantId', 'name address phone')
      .populate('customerId', 'name phone profilePic')
      .populate('riderId', 'name phone vehicleDetails licensePlate avatar rating');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Auth check based on role
    if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Add similar checks for rider and manager if strict security needed

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
// @desc    Update order status
router.put('/:id/status', auth, restrictTo('manager', 'rider', 'admin'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status === 'delivered' && order.status !== 'delivered') {
      order.completedAt = new Date();
    }

    order.status = status;
    if (adminNotes) order.adminNotes = adminNotes;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/orders/:id/confirm-receipt
// @desc    Customer confirms receiving the order -> status becomes completed & money transfers to rider and manager
router.put('/:id/confirm-receipt', auth, restrictTo('customer'), async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.status !== 'delivered' && order.status !== 'completed') {
      return res.status(400).json({ message: 'Order must be delivered by rider before confirming receipt' });
    }

    if (order.status === 'delivered') {
      const riderFee = 150;
      const managerEarnings = order.totalAmount * 0.85;

      if (order.riderId) {
        let rider = await User.findById(order.riderId);
        if (rider) {
          rider.walletBalance = (rider.walletBalance || 0) + riderFee;
          await rider.save();
        }
      }

      let restaurant = await Restaurant.findById(order.restaurantId);
      if (restaurant && restaurant.managerId) {
        let manager = await User.findById(restaurant.managerId);
        if (manager) {
          manager.walletBalance = (manager.walletBalance || 0) + managerEarnings;
          await manager.save();
        }
      }

      order.status = 'completed';
      order.customerConfirmedAt = new Date();
      await order.save();
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/orders/:id/assign
// @desc    Assign order to rider
router.put('/:id/assign', auth, restrictTo('rider'), async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.riderId) return res.status(400).json({ message: 'Order already assigned' });

    order.riderId = req.user._id;
    order.status = 'out_for_delivery';
    await order.save();

    res.json(order);
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
