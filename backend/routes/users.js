const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Card = require('../models/Card');

// @route   GET /api/users
// @desc    Get all users (Admin only)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:id
// @desc    Get single user (Admin only)
router.get('/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (e.g. approve rider/manager)
router.put('/:id/status', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    user.rejectionReason = ''; // Clear rejection reason on approve
    
    // Auto create restaurant if manager is approved
    if (status === 'approved' && user.role === 'manager') {
      const Restaurant = require('../models/Restaurant');
      let rest = await Restaurant.findOne({ managerId: user._id });
      if (!rest) {
        rest = new Restaurant({
          name: user.restaurantName || `${user.name}'s Restaurant`,
          managerId: user._id,
          address: user.restaurantAddress,
          city: user.city,
          phone: user.restaurantPhone,
          email: user.restaurantEmail,
          logo: user.logo,
          image: user.cover,
          cuisine: "Multiple Cuisines",
          status: 'approved'
        });
        await rest.save();
      } else {
        rest.status = 'approved';
        await rest.save();
      }
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/:id/reject
// @desc    Reject user with reason
router.put('/:id/reject', auth, restrictTo('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'rejected';
    user.rejectionReason = reason;
    await user.save();
    
    if (user.role === 'manager') {
      const Restaurant = require('../models/Restaurant');
      await Restaurant.findOneAndUpdate({ managerId: user._id }, { status: 'rejected' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/upload-docs
// @desc    Upload multiple verification documents
router.post('/upload-docs', auth, upload.fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 },
  { name: 'licenseImage', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
  { name: 'photoFront', maxCount: 1 },
  { name: 'photoKitchen', maxCount: 1 },
  { name: 'photoDining', maxCount: 1 },
  { name: 'certDoc', maxCount: 1 },
  { name: 'licenseDoc', maxCount: 1 },
  { name: 'ntnDoc', maxCount: 1 }
]), async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Helper to format URL
    const getUrl = (fileArray) => {
      if (fileArray && fileArray.length > 0) {
        return `http://localhost:5000/${fileArray[0].path.replace(/\\/g, '/')}`;
      }
      return null;
    };

    if (req.files) {
      if (req.files.cnicFront) user.cnicFront = getUrl(req.files.cnicFront);
      if (req.files.cnicBack) user.cnicBack = getUrl(req.files.cnicBack);
      if (req.files.licenseImage) user.licenseImage = getUrl(req.files.licenseImage);
      if (req.files.avatar) user.avatar = getUrl(req.files.avatar);
      if (req.files.logo) user.logo = getUrl(req.files.logo);
      if (req.files.cover) user.cover = getUrl(req.files.cover);
      if (req.files.photoFront) user.photoFront = getUrl(req.files.photoFront);
      if (req.files.photoKitchen) user.photoKitchen = getUrl(req.files.photoKitchen);
      if (req.files.photoDining) user.photoDining = getUrl(req.files.photoDining);
      if (req.files.certDoc) user.certDoc = getUrl(req.files.certDoc);
      if (req.files.licenseDoc) user.licenseDoc = getUrl(req.files.licenseDoc);
      if (req.files.ntnDoc) user.ntnDoc = getUrl(req.files.ntnDoc);
    }

    // Save any text fields sent with form data
    const textFields = ['dob', 'address', 'cnicNumber', 'licenseNumber', 'bikeRegistration', 
                        'bikeModel', 'bikeColor', 'bankName', 'accountNumber', 'walletNumber',
                        'restaurantName', 'restaurantAddress', 'city', 'mapsLocation', 
                        'restaurantPhone', 'restaurantEmail', 'holderName', 'vehicleDetails', 'licensePlate'];
    
    textFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    user.status = 'pending'; // Change back to pending if they upload new docs
    user.rejectionReason = '';

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/withdraw
// @desc    Withdraw wallet balance to linked card (Manager/Rider)
router.post('/withdraw', auth, restrictTo('manager', 'rider'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Amount must be positive' });

    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    let card = await Card.findOne({ userId: user.id, status: 'active' });
    if (!card) {
      return res.status(400).json({ message: 'No active card linked to withdraw to' });
    }

    if (card.balance + amount > 50000) {
      return res.status(400).json({ message: 'Withdrawal failed. Card balance cannot exceed 50,000' });
    }

    user.walletBalance -= amount;
    card.balance += amount;

    await user.save();
    await card.save();

    res.json({ message: 'Withdrawal successful', walletBalance: user.walletBalance, cardBalance: card.balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
