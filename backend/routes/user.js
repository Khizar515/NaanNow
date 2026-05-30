const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/authMiddleware');

const fs = require('fs');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');

// @route   PUT /api/users/wishlist/:restaurantId
// @desc    Toggle a restaurant in/out of the wishlist
// @access  Protected (Customer)
router.put('/wishlist/:restaurantId', protect, authorize('customer'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const restaurantId = req.params.restaurantId;

        // Check if the restaurant actually exists
        const shop = await Restaurant.findById(restaurantId);
        if (!shop) return res.status(404).json({ message: 'Restaurant not found' });

        // Check if it's already in the wishlist
        const isFavorited = user.wishlist.includes(restaurantId);

        if (isFavorited) {
            // Remove it
            user.wishlist = user.wishlist.filter(id => id.toString() !== restaurantId);
            await user.save();
            return res.status(200).json({ message: 'Removed from wishlist', wishlist: user.wishlist });
        } else {
            // Add it
            user.wishlist.push(restaurantId);
            await user.save();
            return res.status(200).json({ message: 'Added to wishlist', wishlist: user.wishlist });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating wishlist' });
    }
});

// @route   GET /api/users/wishlist
// @desc    Get the populated wishlist for the UI
// @access  Protected (Customer)
router.get('/wishlist', protect, authorize('customer'), async (req, res) => {
    try {
        // We use .populate() to get the actual restaurant details, not just the IDs
        const user = await User.findById(req.user.userId).populate('wishlist', 'name imageUrl cuisineType isApproved isOpen');
        res.status(200).json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching wishlist' });
    }
});

// @route   PUT /api/users/profile-pic
// @desc    Upload or update a user's profile picture
// @access  Protected (All logged-in users)
router.put('/profile-pic', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }

        const user = await User.findById(req.user.userId);
        
        // 1. Create a dedicated folder for this user
        const targetDir = `uploads/users/${user._id}`;
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 2. Move the file from Temp to the Permanent folder
        const targetPath = path.join(targetDir, req.file.filename);
        fs.renameSync(req.file.path, targetPath);

        // 3. Optional Cleanup: If they had an old profile pic (and it wasn't the default), delete it to save hard drive space!
        if (user.profilePic && !user.profilePic.includes('defaults/profile-avatar.png')) {
            const oldFilePath = path.join(__dirname, '..', user.profilePic);
            if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }

        // 4. Update Database
        const finalUrl = `/${targetPath.replace(/\\/g, '/')}`;
        user.profilePic = finalUrl;
        await user.save();

        res.status(200).json({ message: 'Profile picture updated!', profilePic: finalUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile picture' });
    }
});

module.exports = router;