const express = require('express');
const router = express.Router();
const PlatformSettings = require('../models/PlatformSettings');
const { auth, restrictTo } = require('../middleware/auth');

// Get platform settings (admin & config load)
router.get('/', async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update platform settings (admin)
router.put('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings(req.body);
      await settings.save();
    } else {
      settings = await PlatformSettings.findOneAndUpdate({}, req.body, { new: true });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
