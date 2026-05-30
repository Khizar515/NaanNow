const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/cart/add
// @desc    Add item to cart or update quantity
// @access  Protected (Customer)
router.post('/add', protect, authorize('customer'), async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;

        // 1. Verify the item exists and find its restaurant
        const item = await MenuItem.findById(menuItemId);
        if (!item || !item.isAvailable) {
            return res.status(404).json({ message: 'Item unavailable' });
        }

        // 2. Find the user's cart (or create a new one)
        let cart = await Cart.findOne({ userId: req.user.userId });
        
        if (!cart) {
            cart = new Cart({ userId: req.user.userId, restaurantId: null, items: [] });
        }

        // 3. The "Single Restaurant" Lockdown Rule
        if (cart.items.length > 0 && cart.restaurantId.toString() !== item.restaurantId.toString()) {
            return res.status(400).json({ 
                message: 'Your cart contains items from another restaurant. Please clear your cart to start a new order.',
                actionRequired: 'CLEAR_CART' // Tells the frontend to show a pop-up warning
            });
        }

        // Lock the cart to this restaurant
        cart.restaurantId = item.restaurantId;

        // 4. Check if the item is already in the cart
        const existingItemIndex = cart.items.findIndex(i => i.menuItemId.toString() === menuItemId);

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({ menuItemId, quantity });
        }

        await cart.save();
        res.status(200).json(cart);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating cart' });
    }
});

// @route   GET /api/cart
// @desc    Get the current user's cart (Populated with prices)
// @access  Protected (Customer)
router.get('/', protect, authorize('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId })
            .populate('restaurantId', 'name')
            .populate('items.menuItemId', 'name basePrice imageUrl'); // NOTE: You will still need to apply Admin Markup to these basePrices in your UI/Checkout!

        if (!cart) {
            return res.status(200).json({ items: [], message: 'Cart is empty' });
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching cart' });
    }
});

// @route   DELETE /api/cart
// @desc    Clear the entire cart
// @access  Protected (Customer)
router.delete('/', protect, authorize('customer'), async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user.userId });
        res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error clearing cart' });
    }
});

// @route   PUT /api/cart/remove-item/:menuItemId
// @desc    Remove a specific item from the cart
// @access  Protected (Customer)
router.put('/remove-item/:menuItemId', protect, authorize('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(item => item.menuItemId.toString() !== req.params.menuItemId);

        // If cart is completely empty after removing, reset the restaurant lock!
        if (cart.items.length === 0) {
            cart.restaurantId = null;
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error removing item' });
    }
});

module.exports = router;