const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const { auth, restrictTo } = require('../middleware/auth');

// Get all withdrawals (admin)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate('userId', 'name email role').sort('-createdAt');
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get my withdrawals (manager/rider)
router.get('/my', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort('-createdAt');
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Request withdrawal (manager/rider)
router.post('/', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    // Check if user has enough balance
    const user = await User.findById(req.user._id);
    if (user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    
    const withdrawalCount = await Withdrawal.countDocuments();
    const transactionNumber = `TXN-${1000 + withdrawalCount + 1}`;
    
    const withdrawal = new Withdrawal({
      userId: req.user._id,
      amount,
      method,
      transactionNumber
    });
    
    // Deduct balance immediately
    user.walletBalance -= amount;
    await user.save();
    
    await withdrawal.save();
    res.status(201).json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update withdrawal status (admin)
router.put('/:id/status', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    
    // If rejected, refund balance
    if (status === 'rejected' && withdrawal.status === 'pending') {
      const user = await User.findById(withdrawal.userId);
      user.walletBalance += withdrawal.amount;
      await user.save();
    }
    // If pending and previously rejected, deduct again (edge case handling)
    else if (status === 'pending' && withdrawal.status === 'rejected') {
       const user = await User.findById(withdrawal.userId);
       user.walletBalance -= withdrawal.amount;
       await user.save();
    }

    withdrawal.status = status;
    await withdrawal.save();
    
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
