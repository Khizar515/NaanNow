const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const { auth } = require('../middleware/auth');

// @route   GET /api/cards
// @desc    Get user's cards
router.get('/', auth, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user.id, status: 'active' });
    res.json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/cards
// @desc    Register a new card or enable a soft-deleted one
router.post('/', auth, async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv } = req.body;
    
    // Check if card already exists for user
    let card = await Card.findOne({ userId: req.user.id, cardNumber });
    
    if (card) {
      if (card.status === 'disabled') {
        card.status = 'active';
        await card.save();
        return res.json(card);
      } else {
        return res.status(400).json({ message: 'Card is already active' });
      }
    }

    // New card
    card = new Card({
      userId: req.user.id,
      cardNumber,
      expiryDate,
      cvv,
      balance: 5000 // Initial balance mockup
    });

    await card.save();
    res.json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/cards/:id/topup
// @desc    Top up card balance (Max 50k total balance)
router.post('/:id/topup', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Amount must be positive' });

    let card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    // Verify ownership
    if (card.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (card.status === 'disabled') {
       return res.status(400).json({ message: 'Cannot top up a disabled card' });
    }

    if (card.balance + amount > 50000) {
      return res.status(400).json({ message: 'Top up failed. Max balance cannot exceed 50,000' });
    }

    card.balance += amount;
    await card.save();
    res.json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/cards/:id
// @desc    Soft delete card
router.delete('/:id', auth, async (req, res) => {
  try {
    let card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    // Verify ownership
    if (card.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    card.status = 'disabled';
    await card.save();
    res.json({ message: 'Card removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
