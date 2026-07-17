const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth, restrictTo } = require('../middleware/auth');

// Get all notifications (admin)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const notifications = await Notification.find().sort('-createdAt');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create notification (admin)
router.post('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get user notifications (general)
router.get('/my', auth, async (req, res) => {
  try {
    // Basic implementation: send 'all' and target specific
    let targets = ['all'];
    if (req.user.role === 'customer') targets.push('customers');
    if (req.user.role === 'rider') targets.push('riders');
    if (req.user.role === 'manager') targets.push('managers');
    
    const notifications = await Notification.find({ target: { $in: targets } }).sort('-createdAt').limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
