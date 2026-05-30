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
const { protect, authorize } = require('../middleware/authMiddleware');
const { calculateDistance } = require('../utils/geoMath');

// @route   POST /api/orders/checkout
// @desc    Process payment, generate order from DB Cart, and clear Cart
// @access  Protected (Customers Only)
router.post('/checkout', protect, authorize('customer'), async (req, res) => {
    try {
        // 👇 Notice how small the payload is now! No more items or restaurantId.
        const { cardId, pin, deliveryAddress, deliveryCoordinates } = req.body;

        // --- STRICT LOCATION ENFORCEMENT ---
        if (!deliveryCoordinates || deliveryCoordinates.length !== 2 || !deliveryAddress) {
            return res.status(400).json({ message: 'Delivery address and map coordinates are required.' });
        }

        // --- 1. FETCH CART FROM DATABASE (The New Single Source of Truth) ---
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty! Add some items first.' });
        }
        
        // Extract the locked restaurant ID from the cart
        const restaurantId = cart.restaurantId;

        // --- 2. VERIFY WALLET & SECURITY PIN ---
        const card = await PaymentMethod.findOne({ _id: cardId, userId: req.user.userId, isActive: true });
        if (!card) return res.status(404).json({ message: 'Payment card not found' });

        const isPinValid = await bcrypt.compare(pin, card.pin);
        if (!isPinValid) return res.status(401).json({ message: 'Invalid payment PIN' });

        // --- 3. CALCULATE ITEM TOTALS WITH ADMIN MARKUP ---
        const settings = await AdminSettings.findOne();
        const markupPercentage = settings ? settings.platformMarkupPercentage : 10;
        const perKmRate = settings ? settings.perKmRate : 40;

        let itemTotal = 0;
        const processedItems = [];

        // Loop through the DATABASE cart items, not frontend items
        for (let cartItem of cart.items) {
            const dbItem = await MenuItem.findById(cartItem.menuItemId);
            if (!dbItem || !dbItem.isAvailable) {
                return res.status(400).json({ message: `Item ${dbItem.name || cartItem.menuItemId} is currently unavailable.` });
            }

            const markupAmount = (dbItem.basePrice * markupPercentage) / 100;
            const finalDisplayPrice = Math.round(dbItem.basePrice + markupAmount);

            itemTotal += (finalDisplayPrice * cartItem.quantity);
            
            processedItems.push({
                menuItemId: dbItem._id,
                name: dbItem.name,
                quantity: cartItem.quantity,
                unitDisplayPrice: finalDisplayPrice
            });
        }

        // --- 4. CALCULATE DELIVERY DISTANCE (OSRM) & FEE ---
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.isOpen) {
            return res.status(400).json({ message: 'Restaurant is closed or unavailable.' });
        }

        const distanceKm = await calculateDistance(restaurant.location.coordinates, deliveryCoordinates);
        const deliveryFee = Math.max(50, Math.round(distanceKm * perKmRate)); 
        const grandTotal = itemTotal + deliveryFee;

        // --- 5. VERIFY BALANCE & DEDUCT ---
        if (card.balance < grandTotal) {
            return res.status(400).json({ message: `Insufficient balance. Total is Rs. ${grandTotal}` });
        }
        card.balance -= grandTotal;
        await card.save();

        // --- 6. GENERATE ORDER RECEIPT ---
        const order = new Order({
            customerId: req.user.userId,
            restaurantId,
            items: processedItems,
            deliveryAddress,
            deliveryCoordinates,
            financials: { itemTotal, deliveryFee, grandTotal }
        });
        await order.save();

        // --- 7. WIPE THE CART CLEAN! ---
        // Now that the receipt is generated and paid for, the cart is no longer needed.
        await Cart.findOneAndDelete({ userId: req.user.userId });

        res.status(201).json({ message: 'Payment successful! Order placed.', order });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Checkout failed due to server error' });
    }
});

// @route   GET /api/orders/my-orders
// @desc    Customer order history
// @access  Protected (Customers Only)
router.get('/my-orders', protect, authorize('customer'), async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/orders/restaurant-queue
// @desc    Dashboard for incoming vendor orders
// @access  Protected (Restaurant Owners Only)
router.get('/restaurant-queue', protect, authorize('restaurant_owner'), async (req, res) => {
    try {
        const shop = await Restaurant.findOne({ ownerId: req.user.userId });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const orders = await Order.find({ restaurantId: shop._id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/orders/available-deliveries
// @desc    Rider board to find orders ready to be picked up
// @access  Protected (Riders Only)
router.get('/available-deliveries', protect, authorize('rider'), async (req, res) => {
    try {
        // Riders only see orders the restaurant has finished preparing
        const orders = await Order.find({ status: 'Ready for Pickup' }).sort({ createdAt: 1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order lifecycle and process Rider Payouts
// @access  Protected (Restaurant Owner or Rider)
router.put('/:id/status', protect, authorize('restaurant_owner', 'rider'), async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // If Rider is accepting the order, attach their ID to it
        if (status === 'Accepted by Rider' && req.user.role === 'rider') {
            order.riderId = req.user.userId;
        }

        // --- THE FINANCIAL CLEARINGHOUSE (PAY THE RIDER) ---
        // When the rider successfully drops off the food, their wallet is instantly credited!
        if (status === 'Delivered' && req.user.role === 'rider') {
            if (order.riderId.toString() !== req.user.userId) {
                return res.status(403).json({ message: 'You are not assigned to this delivery' });
            }
            
            const riderAccount = await User.findById(req.user.userId);
            riderAccount.earningsBalance += order.financials.deliveryFee;
            await riderAccount.save();
        }

        order.status = status;
        await order.save();
        res.status(200).json({ message: `Order status updated to ${status}`, order });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;