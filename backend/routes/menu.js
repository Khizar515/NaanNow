const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const AdminSettings = require('../models/AdminSettings');
const { protect, authorize } = require('../middleware/authMiddleware');

const fs = require('fs');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /api/menu
// @desc    Add a new food item WITH A PICTURE
// @access  Protected (Restaurant Owners Only)
// 👇 Notice: upload.single('image')
router.post('/', protect, authorize('restaurant_owner'), upload.single('image'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) return res.status(404).json({ message: 'Create a restaurant profile first.' });

        const { name, description, basePrice, category } = req.body;
        
        let imageUrl = ''; // Default to empty if they don't upload a picture

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
        res.status(201).json({ message: 'Menu item added successfully!', item: newItem });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding menu item' });
    }
});

// @route   GET /api/menu/:restaurantId
// @desc    Fetch the menu for a specific restaurant (Applies Admin Markup)
// @access  Public (Customers browsing)
router.get('/:restaurantId', async (req, res) => {
    try {
        // 1. Fetch the raw items from the database
        const items = await MenuItem.find({ 
            restaurantId: req.params.restaurantId,
            isAvailable: true // Only show items that are currently in stock
        });

        // 2. Fetch the global Admin Settings to get the markup percentage
        const settings = await AdminSettings.findOne();
        // Fallback to 10% if the Admin hasn't configured settings yet
        const markupPercentage = settings ? settings.platformMarkupPercentage : 10; 

        // 3. The Magic: Map through items and attach the Customer 'displayPrice'
        const customerMenu = items.map(item => {
            const markupAmount = (item.basePrice * markupPercentage) / 100;
            const displayPrice = item.basePrice + markupAmount;

            return {
                id: item._id,
                name: item.name,
                description: item.description,
                category: item.category,
                imageUrl: item.imageUrl,
                // We send both so the frontend can show: "Rs. 550"
                displayPrice: Math.round(displayPrice), 
                _vendorBasePrice: item.basePrice // Keep this hidden in the background for calculations later
            };
        });

        res.status(200).json(customerMenu);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching menu' });
    }
});

// @route   PUT /api/menu/:id
// @desc    Update a specific item (price, details, or availability)
// @access  Protected (Restaurant Owners Only)
router.put('/:id', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        // 1. Find the owner's shop first to ensure security
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) return res.status(403).json({ message: 'Unauthorized' });

        // 2. Find the item and make sure it actually belongs to this owner's shop
        const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: shop._id });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const { name, description, basePrice, category, imageUrl, isAvailable } = req.body;

        // 3. Update fields if provided
        if (name) item.name = name;
        if (description) item.description = description;
        if (basePrice) item.basePrice = basePrice;
        if (category) item.category = category;
        if (imageUrl) item.imageUrl = imageUrl;
        if (isAvailable !== undefined) item.isAvailable = isAvailable;

        await item.save();
        res.status(200).json({ message: 'Item updated successfully!', item });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating item' });
    }
});

module.exports = router;