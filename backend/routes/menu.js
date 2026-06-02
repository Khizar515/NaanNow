const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const AdminSettings = require('../models/AdminSettings');
const { protect, authorize } = require('../middleware/authMiddleware');

const fs = require('fs');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /menu/add
// @desc    Add a new food item WITH A PICTURE
// @access  Protected (Restaurant Owners Only)
router.post('/add', protect, authorize('restaurant_owner'), upload.single('image'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Create a restaurant profile first.');
            return res.redirect('/restaurants/register');
        }

        const { name, description, basePrice, category } = req.body;
        
        let imageUrl = '';

        // If an image was uploaded, move it to the Restaurant's Menu folder
        if (req.file) {
            const targetDir = `uploads/restaurants/${shop._id}/menu`;
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const targetPath = path.join(targetDir, req.file.filename);
            fs.renameSync(req.file.path, targetPath);
            imageUrl = `/${targetPath.replace(/\\/g, '/')}`;
        }

        const newItem = new MenuItem({
            restaurantId: shop._id,
            name,
            description,
            basePrice,
            category,
            imageUrl
        });

        await newItem.save();
        req.flash('success_msg', `"${name}" added to your menu!`);
        res.redirect('/restaurants/my-shop');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error adding menu item.');
        res.redirect('/restaurants/my-shop');
    }
});

// @route   GET /menu/:id/edit
// @desc    Show edit form for a specific item
// @access  Protected (Restaurant Owners Only)
router.get('/:id/edit', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Unauthorized.');
            return res.redirect('/');
        }

        const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: shop._id });
        if (!item) {
            req.flash('error_msg', 'Item not found.');
            return res.redirect('/restaurants/my-shop');
        }

        res.render('menu/edit', { title: 'Edit Item', item });
    } catch (error) {
        req.flash('error_msg', 'Server error.');
        res.redirect('/restaurants/my-shop');
    }
});

// @route   POST /menu/:id/update
// @desc    Update a specific menu item
// @access  Protected (Restaurant Owners Only)
router.post('/:id/update', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Unauthorized.');
            return res.redirect('/');
        }

        const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: shop._id });
        if (!item) {
            req.flash('error_msg', 'Item not found.');
            return res.redirect('/restaurants/my-shop');
        }

        const { name, description, basePrice, category } = req.body;

        if (name) item.name = name;
        if (description) item.description = description;
        if (basePrice) item.basePrice = basePrice;
        if (category) item.category = category;

        await item.save();
        req.flash('success_msg', 'Item updated successfully!');
        res.redirect('/restaurants/my-shop');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error updating item.');
        res.redirect('/restaurants/my-shop');
    }
});

// @route   POST /menu/:id/toggle-availability
// @desc    Toggle item availability on/off
// @access  Protected (Restaurant Owners Only)
router.post('/:id/toggle-availability', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Unauthorized.');
            return res.redirect('/');
        }

        const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: shop._id });
        if (!item) {
            req.flash('error_msg', 'Item not found.');
            return res.redirect('/restaurants/my-shop');
        }

        item.isAvailable = !item.isAvailable;
        await item.save();

        req.flash('success_msg', `"${item.name}" is now ${item.isAvailable ? 'available' : 'unavailable'}.`);
        res.redirect('/restaurants/my-shop');

    } catch (error) {
        req.flash('error_msg', 'Server error.');
        res.redirect('/restaurants/my-shop');
    }
});

module.exports = router;