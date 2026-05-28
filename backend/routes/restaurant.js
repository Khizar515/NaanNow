const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/restaurants
// @desc    Create a new shop profile (Requires Admin Approval later)
// @access  Protected (Restaurant Owners Only)
router.post('/', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        // Prevent an owner from making multiple shops on one account (optional business rule)
        const existingShop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (existingShop) {
            return res.status(400).json({ message: 'You already have a registered restaurant.' });
        }

        const { name, address, coordinates, cuisineType, phone, verificationDocuments } = req.body;

        const newRestaurant = new Restaurant({
            ownerId: req.user.userId,
            name,
            address,
            location: {
                type: 'Point',
                coordinates: coordinates // Expecting [longitude, latitude]
            },
            cuisineType,
            phone,
            verificationDocuments
        });

        await newRestaurant.save();

        res.status(201).json({ 
            message: 'Shop created successfully! Please wait for Admin approval before you can open.',
            restaurant: newRestaurant
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during shop creation' });
    }
});

// @route   GET /api/restaurants/my-shop
// @desc    Get the logged-in owner's shop (even if unapproved)
// @access  Protected (Restaurant Owners Only)
router.get('/my-shop', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) {
            return res.status(404).json({ message: 'You have not registered a shop yet.' });
        }
        res.status(200).json(shop);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/restaurants/:id/update
// @desc    Update shop. If Name or Location changes, triggers Re-Approval lockdown.
// @access  Protected (Restaurant Owners Only)
router.put('/:id/update', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ _id: req.params.id, ownerId: req.user.userId });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const { name, address, coordinates, phone } = req.body;
        let requiresReapproval = false;

        // Check if critical fields were modified
        if ((name && name !== shop.name) || (address && address !== shop.address || coordinates && coordinates !== shop.coordinates)) {
            requiresReapproval = true;
        }

        // Apply updates
        if (name) shop.name = name;
        if (address) shop.address = address;
        if (phone) shop.phone = phone;
        if (coordinates) {
            shop.location.coordinates = coordinates;
            requiresReapproval = true; // Moving the shop always requires re-approval
        }

        // If a critical change happened, lock the shop down
        if (requiresReapproval) {
            shop.isApproved = false;
            shop.isOpen = false;
        }

        await shop.save();

        res.status(200).json({ 
            message: requiresReapproval 
                ? 'Critical details updated. Your shop is now temporarily suspended pending Admin re-approval.'
                : 'Shop details updated successfully!',
            shop 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during update' });
    }
});

// @route   PUT /api/restaurants/:id/toggle-status
// @desc    Switch between Open/Closed (Only works if Approved)
// @access  Protected (Restaurant Owners Only)
router.put('/:id/toggle-status', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ _id: req.params.id, ownerId: req.user.userId });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        if (!shop.isApproved) {
            return res.status(403).json({ message: 'Cannot open shop. Waiting for Admin approval.' });
        }

        shop.isOpen = !shop.isOpen;
        await shop.save();

        res.status(200).json({ message: `Shop is now ${shop.isOpen ? 'OPEN' : 'CLOSED'}` });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/restaurants
// @desc    Get all APPROVED and OPEN restaurants for the customer homepage
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Customers should only see active, vetted shops
        const shops = await Restaurant.find({ isApproved: true, isOpen: true })
                                      .select('-verificationDocuments'); // Hide sensitive docs from public API
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching restaurants' });
    }
});

module.exports = router;