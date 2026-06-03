const fs = require('fs');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');

const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /restaurants/register
// @desc    Show restaurant registration form
// @access  Protected (Restaurant Owners Only)
router.get('/register', protect, authorize('restaurant_owner'), (req, res) => {
    res.render('restaurants/register', { title: 'Register Restaurant' });
});

// @route   POST /restaurants/register
// @desc    Create a new shop profile (Requires Admin Approval later)
// @access  Protected (Restaurant Owners Only)
router.post('/register', protect, authorize('restaurant_owner'), upload.array('documents', 5), async (req, res) => {
    try {
        const existingShop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (existingShop) {
            req.flash('error_msg', 'You already have a registered restaurant.');
            return res.redirect('/restaurants/my-shop');
        }

        const { name, address, longitude, latitude, cuisineType, phone } = req.body;

        const newRestaurant = new Restaurant({
            ownerId: req.user.userId,
            name,
            address,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            cuisineType,
            phone
        });

        await newRestaurant.save();

        // File Moving Logic
        if (req.files && req.files.length > 0) {
            const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
            const targetDir = `uploads/restaurants/${safeName}_${newRestaurant._id}`;
            
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const finalFilePaths = [];

            req.files.forEach(file => {
                const targetPath = path.join(targetDir, file.filename);
                fs.renameSync(file.path, targetPath);
                finalFilePaths.push(`/${targetPath.replace(/\\/g, '/')}`);
            });

            newRestaurant.verificationDocuments = finalFilePaths;
            await newRestaurant.save();
        }

        req.flash('success_msg', 'Restaurant submitted! Pending Admin approval.');
        res.redirect('/restaurants/my-shop');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error during restaurant creation.');
        res.redirect('/restaurants/register');
    }
});

// @route   GET /restaurants/my-shop
// @desc    Get the logged-in owner's shop dashboard
// @access  Protected (Restaurant Owners Only)
router.get('/my-shop', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) {
            req.flash('info_msg', 'You haven\'t registered a restaurant yet. Register one below.');
            return res.redirect('/restaurants/register');
        }

        // Fetch menu items for this shop
        const menuItems = await MenuItem.find({ restaurantId: shop._id });

        res.render('restaurants/my-shop', { title: 'My Shop', shop, menuItems });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error loading shop.');
        res.redirect('/');
    }
});

// @route   GET /restaurants/:id/edit
// @desc    Show shop edit form
// @access  Protected (Restaurant Owners Only)
router.get('/:id/edit', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ _id: req.params.id, ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Shop not found.');
            return res.redirect('/restaurants/my-shop');
        }
        res.render('restaurants/edit', { title: 'Edit Shop', shop });
    } catch (error) {
        req.flash('error_msg', 'Server error.');
        res.redirect('/restaurants/my-shop');
    }
});

// @route   POST /restaurants/:id/update
// @desc    Update shop. If Name or Location changes, triggers Re-Approval lockdown.
// @access  Protected (Restaurant Owners Only)
router.post('/:id/update', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ _id: req.params.id, ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Shop not found.');
            return res.redirect('/restaurants/my-shop');
        }

        const { name, address, longitude, latitude, phone } = req.body;
        let requiresReapproval = false;

        // Check if critical fields were modified
        if ((name && name !== shop.name) || (address && address !== shop.address)) {
            requiresReapproval = true;
        }

        // Apply updates
        if (name) shop.name = name;
        if (address) shop.address = address;
        if (phone) shop.phone = phone;
        if (longitude && latitude) {
            const newCoords = [parseFloat(longitude), parseFloat(latitude)];
            if (newCoords[0] !== shop.location.coordinates[0] || newCoords[1] !== shop.location.coordinates[1]) {
                shop.location.coordinates = newCoords;
                requiresReapproval = true;
            }
        }

        // If a critical change happened, lock the shop down
        if (requiresReapproval) {
            shop.isApproved = false;
            shop.isOpen = false;
        }

        await shop.save();

        if (requiresReapproval) {
            req.flash('warning_msg', 'Critical details updated. Your shop is temporarily suspended pending Admin re-approval.');
        } else {
            req.flash('success_msg', 'Shop details updated successfully!');
        }
        res.redirect('/restaurants/my-shop');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error during update.');
        res.redirect('/restaurants/my-shop');
    }
});

// @route   POST /restaurants/:id/toggle-status
// @desc    Switch between Open/Closed (Only works if Approved)
// @access  Protected (Restaurant Owners Only)
router.post('/:id/toggle-status', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ _id: req.params.id, ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Shop not found.');
            return res.redirect('/restaurants/my-shop');
        }

        if (!shop.isApproved) {
            req.flash('error_msg', 'Cannot open shop. Waiting for Admin approval.');
            return res.redirect('/restaurants/my-shop');
        }

        shop.isOpen = !shop.isOpen;
        await shop.save();

        req.flash('success_msg', `Shop is now ${shop.isOpen ? 'OPEN' : 'CLOSED'}`);
        res.redirect('/restaurants/my-shop');

    } catch (error) {
        req.flash('error_msg', 'Server error.');
        res.redirect('/restaurants/my-shop');
    }
});

// @route   GET /restaurants/:restaurantId/menu
// @desc    Public menu page for a specific restaurant
// @access  Public
router.get('/:restaurantId/menu', async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({
            _id: req.params.restaurantId,
            isApproved: true,
            isOpen: true
        }).select('-verificationDocuments');

        if (!restaurant) {
            req.flash('error_msg', 'Restaurant not found or is currently closed.');
            return res.redirect('/');
        }

        // Fetch menu with admin markup applied
        const AdminSettings = require('../models/AdminSettings');
        const items = await MenuItem.find({
            restaurantId: req.params.restaurantId,
            isAvailable: true
        });

        const settings = await AdminSettings.findOne();
        const markupPercentage = settings ? settings.platformMarkupPercentage : 10;

        const menuItems = items.map(item => {
            const markupAmount = (item.basePrice * markupPercentage) / 100;
            const displayPrice = Math.round(item.basePrice + markupAmount);
            return {
                id: item._id,
                name: item.name,
                description: item.description,
                category: item.category,
                imageUrl: item.imageUrl,
                displayPrice,
                _vendorBasePrice: item.basePrice
            };
        });

        res.render('restaurants/menu', { title: restaurant.name, restaurant, menuItems });

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error loading restaurant menu.');
        res.redirect('/');
    }
});

module.exports = router;