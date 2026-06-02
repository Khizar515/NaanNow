const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /cart/add
// @desc    Add item to cart or update quantity
// @access  Protected (Customer)
router.post('/add', protect, authorize('customer'), async (req, res) => {
    try {
        const { menuItemId, quantity } = req.body;

        // 1. Verify the item exists and find its restaurant
        const item = await MenuItem.findById(menuItemId);
        if (!item || !item.isAvailable) {
            req.flash('error_msg', 'Item unavailable.');
            return res.redirect('back');
        }

        // 2. Find the user's cart (or create a new one)
        let cart = await Cart.findOne({ userId: req.user.userId });
        
        if (!cart) {
            cart = new Cart({ userId: req.user.userId, restaurantId: null, items: [] });
        }

        // 3. The "Single Restaurant" Lockdown Rule
        if (cart.items.length > 0 && cart.restaurantId && cart.restaurantId.toString() !== item.restaurantId.toString()) {
            req.flash('warning_msg', 'Your cart contains items from another restaurant. Clear your cart to start a new order.');
            return res.redirect('/cart');
        }

        // Lock the cart to this restaurant
        cart.restaurantId = item.restaurantId;

        // 4. Check if the item is already in the cart
        const existingItemIndex = cart.items.findIndex(i => i.menuItemId.toString() === menuItemId);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += parseInt(quantity) || 1;
        } else {
            cart.items.push({ menuItemId, quantity: parseInt(quantity) || 1 });
        }

        await cart.save();
        req.flash('success_msg', `"${item.name}" added to cart!`);
        res.redirect('back');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error updating cart.');
        res.redirect('/');
    }
});

// @route   GET /cart
// @desc    Get the current user's cart page
// @access  Protected (Customer)
router.get('/', protect, authorize('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId })
            .populate('restaurantId', 'name')
            .populate('items.menuItemId', 'name basePrice imageUrl');

        res.render('cart/index', { title: 'My Cart', cart: cart || { items: [] } });
    } catch (error) {
        req.flash('error_msg', 'Server error fetching cart.');
        res.redirect('/');
    }
});

// @route   POST /cart/clear
// @desc    Clear the entire cart
// @access  Protected (Customer)
router.post('/clear', protect, authorize('customer'), async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user.userId });
        req.flash('success_msg', 'Cart cleared successfully!');
        res.redirect('/cart');
    } catch (error) {
        req.flash('error_msg', 'Server error clearing cart.');
        res.redirect('/cart');
    }
});

// @route   POST /cart/remove-item/:menuItemId
// @desc    Remove a specific item from the cart
// @access  Protected (Customer)
router.post('/remove-item/:menuItemId', protect, authorize('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) {
            req.flash('error_msg', 'Cart not found.');
            return res.redirect('/cart');
        }

        cart.items = cart.items.filter(item => item.menuItemId.toString() !== req.params.menuItemId);

        // If cart is completely empty after removing, reset the restaurant lock
        if (cart.items.length === 0) {
            cart.restaurantId = null;
        }

        await cart.save();
        req.flash('success_msg', 'Item removed from cart.');
        res.redirect('/cart');
    } catch (error) {
        req.flash('error_msg', 'Server error removing item.');
        res.redirect('/cart');
    }
});

module.exports = router;