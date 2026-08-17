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

const Notification = require('../models/Notification');

// Update platform settings (admin)
router.put('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    let oldSettings = await PlatformSettings.findOne();
    const oldCommission = oldSettings ? oldSettings.commission : null;
    const oldDeliveryFee = oldSettings ? oldSettings.deliveryCharges : null;

    let settings;
    if (!oldSettings) {
      settings = new PlatformSettings(req.body);
      await settings.save();
    } else {
      settings = await PlatformSettings.findOneAndUpdate({}, req.body, { new: true });
    }

    // Notify managers if commission rate changed
    if (req.body.commission !== undefined && oldCommission !== null && Number(req.body.commission) !== Number(oldCommission)) {
      await Notification.create({
        title: 'Platform Commission Updated 📢',
        body: `Notice: Platform commission rate has been set to ${req.body.commission}%.`,
        target: 'managers'
      });
    }

    // Notify riders if delivery per-km rate changed
    if (req.body.deliveryCharges !== undefined && oldDeliveryFee !== null && Number(req.body.deliveryCharges) !== Number(oldDeliveryFee)) {
      await Notification.create({
        title: 'Delivery Per-KM Rate Updated 🛵',
        body: `Notice: Delivery per-km rate has been updated to Rs. ${req.body.deliveryCharges}/km.`,
        target: 'riders'
      });
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
