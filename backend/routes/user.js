const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/authMiddleware');

const fs = require('fs');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /users/wishlist/:restaurantId
// @desc    Toggle a restaurant in/out of the wishlist
// @access  Protected (Customer)
router.post('/wishlist/:restaurantId', protect, authorize('customer'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const restaurantId = req.params.restaurantId;

        const shop = await Restaurant.findById(restaurantId);
        if (!shop) {
            req.flash('error_msg', 'Restaurant not found.');
            return res.redirect('/');
        }

        const isFavorited = user.wishlist.includes(restaurantId);

        if (isFavorited) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== restaurantId);
            await user.save();
            req.flash('success_msg', `"${shop.name}" removed from wishlist.`);
        } else {
            user.wishlist.push(restaurantId);
            await user.save();
            req.flash('success_msg', `"${shop.name}" added to wishlist!`);
        }

        res.redirect('back');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error updating wishlist.');
        res.redirect('/');
    }
});

// @route   GET /users/wishlist
// @desc    Get the populated wishlist page
// @access  Protected (Customer)
router.get('/wishlist', protect, authorize('customer'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate('wishlist', 'name imageUrl cuisineType isApproved isOpen');
        res.render('users/wishlist', { title: 'My Wishlist', wishlist: user.wishlist });
    } catch (error) {
        req.flash('error_msg', 'Server error fetching wishlist.');
        res.redirect('/');
    }
});

// @route   GET /users/profile
// @desc    Show user profile page
// @access  Protected (All logged-in users)
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/');
        }
        res.render('users/profile', { title: 'My Profile', user });
    } catch (error) {
        req.flash('error_msg', 'Server error loading profile.');
        res.redirect('/');
    }
});

// @route   POST /users/profile-pic
// @desc    Upload or update a user's profile picture
// @access  Protected (All logged-in users)
router.post('/profile-pic', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error_msg', 'No image file uploaded.');
            return res.redirect('/users/profile');
        }

        const user = await User.findById(req.user.userId);
        
        // Create a dedicated folder for this user
        const targetDir = `uploads/users/${user._id}`;
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Move the file from Temp to the Permanent folder
        const targetPath = path.join(targetDir, req.file.filename);
        fs.renameSync(req.file.path, targetPath);

        // Cleanup old profile pic
        if (user.profilePic && !user.profilePic.includes('defaults/profile-avatar.png')) {
            const oldFilePath = path.join(__dirname, '..', user.profilePic);
            if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }

        // Update Database
        const finalUrl = `/${targetPath.replace(/\\/g, '/')}`;
        user.profilePic = finalUrl;
        await user.save();

        // Update session so navbar avatar reflects immediately
        req.session.user.profilePic = finalUrl;

        req.flash('success_msg', 'Profile picture updated!');
        res.redirect('/users/profile');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error updating profile picture.');
        res.redirect('/users/profile');
    }
});

module.exports = router;