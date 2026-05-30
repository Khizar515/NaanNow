const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/authMiddleware');

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

module.exports = router;