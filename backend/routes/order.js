const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const PaymentMethod = require('../models/PaymentMethod');
const AdminSettings = require('../models/AdminSettings');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const { protect, authorize } = require('../middleware/authMiddleware');
const { calculateDistance } = require('../utils/geoMath');

// Shared constant for wallet balance limits
const MAX_WALLET_BALANCE = 50000;

// @route   GET /orders/checkout
// @desc    Show the checkout page
// @access  Protected (Customers Only)
router.get('/checkout', protect, authorize('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId })
            .populate('restaurantId', 'name')
            .populate('items.menuItemId', 'name basePrice imageUrl');

        if (!cart || cart.items.length === 0) {
            req.flash('error_msg', 'Your cart is empty. Add items before checking out.');
            return res.redirect('/cart');
        }

        // Fetch user's active cards
        const cards = await PaymentMethod.find({ userId: req.user.userId, isActive: true });
        const safeCards = cards.map(card => ({
            id: card._id,
            cardNumberMasked: `**** **** **** ${card.cardNumber.slice(-4)}`,
            balance: card.balance
        }));

        if (safeCards.length === 0) {
            req.flash('error_msg', 'You need to add a payment card first.');
            return res.redirect('/wallet/add-card');
        }

        res.render('orders/checkout', { title: 'Checkout', cart, cards: safeCards });

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error loading checkout.');
        res.redirect('/cart');
    }
});

// @route   POST /orders/checkout
// @desc    Process payment, generate order from DB Cart, and clear Cart
// @access  Protected (Customers Only)
router.post('/checkout', protect, authorize('customer'), async (req, res) => {
    try {
        const { cardId, pin, deliveryAddress, longitude, latitude } = req.body;
        const deliveryCoordinates = [parseFloat(longitude), parseFloat(latitude)];

        // STRICT LOCATION ENFORCEMENT
        if (!deliveryCoordinates || deliveryCoordinates.length !== 2 || !deliveryAddress || isNaN(deliveryCoordinates[0]) || isNaN(deliveryCoordinates[1])) {
            req.flash('error_msg', 'Delivery address and valid map coordinates are required.');
            return res.redirect('/orders/checkout');
        }

        // 1. FETCH CART FROM DATABASE
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart || cart.items.length === 0) {
            req.flash('error_msg', 'Your cart is empty! Add some items first.');
            return res.redirect('/');
        }
        
        const restaurantId = cart.restaurantId;

        // 2. VERIFY WALLET & SECURITY PIN
        const card = await PaymentMethod.findOne({ _id: cardId, userId: req.user.userId, isActive: true });
        if (!card) {
            req.flash('error_msg', 'Payment card not found.');
            return res.redirect('/orders/checkout');
        }

        const isPinValid = await bcrypt.compare(pin, card.pin);
        if (!isPinValid) {
            req.flash('error_msg', 'Invalid payment PIN.');
            return res.redirect('/orders/checkout');
        }

        // 3. CALCULATE ITEM TOTALS WITH ADMIN MARKUP
        const settings = await AdminSettings.findOne();
        const markupPercentage = settings ? settings.platformMarkupPercentage : 10;
        // BUG FIX: was reading settings.perKmRate which doesn't exist — correct field is perKmDeliveryRate
        const perKmRate = settings ? settings.perKmDeliveryRate : 40;

        let itemTotal = 0;
        let vendorTotal = 0; // Track what the vendor actually earns
        const processedItems = [];

        for (let cartItem of cart.items) {
            const dbItem = await MenuItem.findById(cartItem.menuItemId);
            if (!dbItem || !dbItem.isAvailable) {
                req.flash('error_msg', `Item "${dbItem ? dbItem.name : 'Unknown'}" is currently unavailable.`);
                return res.redirect('/cart');
            }

            const markupAmount = (dbItem.basePrice * markupPercentage) / 100;
            const finalDisplayPrice = Math.round(dbItem.basePrice + markupAmount);

            itemTotal += (finalDisplayPrice * cartItem.quantity);
            vendorTotal += (dbItem.basePrice * cartItem.quantity);
            
            processedItems.push({
                menuItemId: dbItem._id,
                name: dbItem.name,
                quantity: cartItem.quantity,
                unitDisplayPrice: finalDisplayPrice
            });
        }

        // 4. CALCULATE DELIVERY DISTANCE & FEE
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.isOpen) {
            req.flash('error_msg', 'Restaurant is closed or unavailable.');
            return res.redirect('/cart');
        }

        const distanceKm = await calculateDistance(restaurant.location.coordinates, deliveryCoordinates);
        const deliveryFee = Math.max(50, Math.round(distanceKm * perKmRate)); 
        const grandTotal = itemTotal + deliveryFee;

        // 5. VERIFY BALANCE & DEDUCT
        if (card.balance < grandTotal) {
            req.flash('error_msg', `Insufficient balance. Total is Rs. ${grandTotal}, but your card has Rs. ${card.balance}.`);
            return res.redirect('/orders/checkout');
        }
        card.balance -= grandTotal;
        await card.save();

        // 6. GENERATE ORDER RECEIPT
        const order = new Order({
            customerId: req.user.userId,
            restaurantId,
            items: processedItems,
            deliveryAddress,
            deliveryCoordinates,
            financials: { itemTotal, deliveryFee, grandTotal }
        });
        await order.save();

        // 7. PAY THE VENDOR (BUG FIX: vendor payout was missing)
        // The vendor gets the base price total (without platform markup)
        const owner = await User.findById(restaurant.ownerId);
        if (owner) {
            owner.earningsBalance += vendorTotal;
            await owner.save();
        }

        // 8. WIPE THE CART CLEAN
        await Cart.findOneAndDelete({ userId: req.user.userId });

        req.flash('success_msg', 'Payment successful! Your order has been placed.');
        res.redirect('/orders/my-orders');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Checkout failed due to a server error.');
        res.redirect('/cart');
    }
});

// @route   GET /orders/my-orders
// @desc    Customer order history
// @access  Protected (Customers Only)
router.get('/my-orders', protect, authorize('customer'), async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user.userId }).sort({ createdAt: -1 });
        res.render('orders/my-orders', { title: 'My Orders', orders });
    } catch (error) {
        req.flash('error_msg', 'Server error loading orders.');
        res.redirect('/');
    }
});

// @route   GET /orders/restaurant-queue
// @desc    Dashboard for incoming vendor orders
// @access  Protected (Restaurant Owners Only)
router.get('/restaurant-queue', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) {
            req.flash('error_msg', 'Shop not found.');
            return res.redirect('/restaurants/register');
        }

        const orders = await Order.find({ restaurantId: shop._id }).sort({ createdAt: -1 });
        res.render('orders/restaurant-queue', { title: 'Order Queue', orders });
    } catch (error) {
        req.flash('error_msg', 'Server error.');
        res.redirect('/');
    }
});

// @route   GET /orders/available-deliveries
// @desc    Rider board to find orders ready to be picked up
// @access  Protected (Riders Only)
router.get('/available-deliveries', protect, authorize('rider'), async (req, res) => {
    try {
        const orders = await Order.find({ status: 'Ready for Pickup' })
            .populate('restaurantId', 'name location')
            .sort({ createdAt: 1 });
        res.render('orders/available', { title: 'Available Deliveries', orders });
    } catch (error) {
        req.flash('error_msg', 'Server error.');
        res.redirect('/');
    }
});

// @route   POST /orders/:id/status
// @desc    Update order lifecycle and process Rider Payouts
// @access  Protected (Restaurant Owner or Rider)
router.post('/:id/status', protect, authorize('restaurant_owner', 'rider'), async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('back');
        }

        // If Rider is accepting the order, attach their ID to it
        if (status === 'Accepted by Rider' && req.user.role === 'rider') {
            order.riderId = req.user.userId;
        }

        // THE FINANCIAL CLEARINGHOUSE (PAY THE RIDER)
        if (status === 'Delivered' && req.user.role === 'rider') {
            if (order.riderId.toString() !== req.user.userId) {
                req.flash('error_msg', 'You are not assigned to this delivery.');
                return res.redirect('/orders/available-deliveries');
            }
            
            const riderAccount = await User.findById(req.user.userId);
            riderAccount.earningsBalance += order.financials.deliveryFee;
            await riderAccount.save();
        }

        order.status = status;
        await order.save();

        req.flash('success_msg', `Order status updated to "${status}".`);

        // Role-based redirect
        if (req.user.role === 'rider') {
            return res.redirect('/orders/available-deliveries');
        }
        res.redirect('/orders/restaurant-queue');

    } catch (error) {
        req.flash('error_msg', 'Server error updating order.');
        res.redirect('/');
    }
});

// @route   POST /orders/:id/cancel
// @desc    Cancel a pending order and refund the customer
// @access  Protected (Customers Only)
router.post('/:id/cancel', protect, authorize('customer'), async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, customerId: req.user.userId });
        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/orders/my-orders');
        }

        // Only allow cancellation for Pending orders
        if (order.status !== 'Pending') {
            req.flash('error_msg', 'This order can no longer be cancelled. It is already being prepared.');
            return res.redirect('/orders/my-orders');
        }

        // Refund the customer's card
        // Find the most recently used active card to refund
        const card = await PaymentMethod.findOne({ userId: req.user.userId, isActive: true }).sort({ updatedAt: -1 });
        if (card) {
            card.balance += order.financials.grandTotal;
            await card.save();
        }

        // Reverse vendor payout
        const restaurant = await Restaurant.findById(order.restaurantId);
        if (restaurant) {
            const owner = await User.findById(restaurant.ownerId);
            if (owner) {
                // Calculate vendor total from items
                const settings = await AdminSettings.findOne();
                const markupPercentage = settings ? settings.platformMarkupPercentage : 10;
                let vendorRefund = 0;
                for (let item of order.items) {
                    const basePrice = Math.round(item.unitDisplayPrice / (1 + markupPercentage / 100));
                    vendorRefund += basePrice * item.quantity;
                }
                owner.earningsBalance = Math.max(0, owner.earningsBalance - vendorRefund);
                await owner.save();
            }
        }

        order.status = 'Cancelled';
        await order.save();

        req.flash('success_msg', `Order cancelled. Rs. ${order.financials.grandTotal} has been refunded to your card.`);
        res.redirect('/orders/my-orders');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error cancelling order.');
        res.redirect('/orders/my-orders');
    }
});

// @route   GET /orders/:id/chat
// @desc    Real-time chat between Rider and Customer
// @access  Protected (Customer or Rider)
router.get('/:id/chat', protect, authorize('customer', 'rider'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name profilePic')
            .populate('riderId', 'name profilePic');

        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/');
        }

        // Only allow if order is active
        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            req.flash('error_msg', 'Chat is no longer available for this order.');
            return res.redirect('/');
        }

        // Must have a rider assigned
        if (!order.riderId) {
            req.flash('error_msg', 'Waiting for a rider to accept the order first.');
            return res.redirect('back');
        }

        // Security: only the assigned customer or rider can access this chat
        const isCustomer = req.user.userId === order.customerId._id.toString();
        const isRider = req.user.userId === order.riderId._id.toString();

        if (!isCustomer && !isRider) {
            req.flash('error_msg', 'You are not authorized to view this chat.');
            return res.redirect('/');
        }

        // Find or Create Chat Session
        let chatSession = await ChatSession.findOne({ orderId: order._id }).populate('messages.senderId', 'name');
        if (!chatSession) {
            chatSession = new ChatSession({
                orderId: order._id,
                customerId: order.customerId._id,
                riderId: order.riderId._id,
                messages: []
            });
            await chatSession.save();
        }

        res.render('orders/chat', { 
            title: 'Order Chat', 
            order, 
            chatSession,
            otherParty: isCustomer ? order.riderId : order.customerId
        });

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error loading chat.');
        res.redirect('/');
    }
});

module.exports = router;