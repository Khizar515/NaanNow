const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const { auth, restrictTo } = require('../middleware/auth');

// Get all promos (admin)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const promos = await Promotion.find().sort('-createdAt');
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create promo (admin)
router.post('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const promo = new Promotion(req.body);
    await promo.save();
    res.status(201).json(promo);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Promo code already exists' });
    res.status(500).json({ message: 'Server Error' });
  }
});

// Toggle promo status (admin)
router.put('/:id/toggle', auth, restrictTo('admin'), async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promotion not found' });
    promo.status = promo.status === 'active' ? 'expired' : 'active';
    await promo.save();
    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete promo (admin)
router.delete('/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promotion deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Validate promo code
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, basketTotal } = req.body;
    const promo = await Promotion.findOne({ code: code.toUpperCase() });
    
    if (!promo) return res.status(404).json({ message: 'Invalid promo code' });
    if (promo.status === 'expired') return res.status(400).json({ message: 'Promo code has expired' });
    if (basketTotal < promo.minBasket) return res.status(400).json({ message: `Minimum basket total is Rs. ${promo.minBasket}` });
    
    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
