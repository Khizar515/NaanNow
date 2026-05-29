const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const AdminSettings = require('../models/AdminSettings');
const { protect, authorize } = require('../middleware/authMiddleware');

// ALL routes in this file require an Admin token!
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard-stats
// @desc    Get aggregate data for the Admin Dashboard UI
router.get('/dashboard-stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRestaurants = await Restaurant.countDocuments();
        
        // Count orders that are not yet finished
        const activeOrders = await Order.countDocuments({ 
            status: { $nin: ['Delivered', 'Cancelled'] } 
        });

        // Calculate Total Gross Merchandise Value (GMV) from Delivered orders
        const completedOrders = await Order.find({ status: 'Delivered' });
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.financials.grandTotal, 0);

        res.status(200).json({
            totalUsers,
            totalRestaurants,
            activeOrders,
            totalRevenue: Math.round(totalRevenue),
            message: 'Dashboard stats fetched successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
});

// @route   PUT /api/admin/approve-restaurant/:id
// @desc    Approve a restaurant to go live
router.put('/approve-restaurant/:id', async (req, res) => {
    try {
        const shop = await Restaurant.findById(req.params.id);
        if (!shop) return res.status(404).json({ message: 'Restaurant not found' });

        shop.isApproved = true;
        shop.adminStatusMessage = 'Approved and active.';
        await shop.save();

        res.status(200).json({ message: `${shop.name} has been APPROVED.`, shop });
    } catch (error) {
        res.status(500).json({ message: 'Server error during approval' });
    }
});

// @route   PUT /api/admin/revoke-restaurant/:id
// @desc    Suspend a restaurant and provide a reason
router.put('/revoke-restaurant/:id', async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ message: 'You must provide a reason for revocation.' });
        }

        const shop = await Restaurant.findById(req.params.id);
        if (!shop) return res.status(404).json({ message: 'Restaurant not found' });

        shop.isApproved = false;
        shop.isOpen = false; // Force the shop to close immediately
        shop.adminStatusMessage = `Suspended by Admin: ${reason}`;
        
        await shop.save();

        res.status(200).json({ 
            message: `${shop.name} has been REVOKED.`, 
            reason: shop.adminStatusMessage 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during revocation' });
    }
});

// @route   PUT /api/admin/change-role/:userId
// @desc    Promote or demote a user account
router.put('/change-role/:userId', async (req, res) => {
    try {
        const { newRole } = req.body;
        const validRoles = ['customer', 'restaurant_owner', 'admin', 'rider'];

        if (!validRoles.includes(newRole)) {
            return res.status(400).json({ message: 'Invalid role provided.' });
        }

        // Prevent the admin from accidentally demoting themselves
        if (req.params.userId === req.user.userId) {
            return res.status(400).json({ message: 'You cannot change your own admin role.' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = newRole;
        await user.save();

        res.status(200).json({ 
            message: `User ${user.name} is now a ${newRole.toUpperCase()}`,
            user: { id: user._id, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error changing role' });
    }
});

// @route   PUT /api/admin/settings
// @desc    Update global financial markup and delivery rates
router.put('/settings', async (req, res) => {
    try {
        const { platformMarkupPercentage, perKmDeliveryRate } = req.body;

        // There should only ever be ONE settings document in the database
        let settings = await AdminSettings.findOne();
        
        if (!settings) {
            settings = new AdminSettings({ platformMarkupPercentage, perKmDeliveryRate });
        } else {
            if (platformMarkupPercentage) settings.platformMarkupPercentage = platformMarkupPercentage;
            if (perKmDeliveryRate) settings.perKmDeliveryRate = perKmDeliveryRate;
        }

        await settings.save();
        res.status(200).json({ message: 'Platform financial settings updated!', settings });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating settings' });
    }
});

// @route   PUT /api/admin/approve-rider/:id
// @desc    Approve a rider after checking their uploaded proofs
// @access  Protected (Admin Only)
router.put('/approve-rider/:id', async (req, res) => {
    try {
        const rider = await User.findById(req.params.id);
        if (!rider || rider.role !== 'rider') {
            return res.status(404).json({ message: 'Rider not found' });
        }

        rider.isApprovedRider = true;
        await rider.save();

        res.status(200).json({ message: `${rider.name} is now an APPROVED Rider.`, rider });
    } catch (error) {
        res.status(500).json({ message: 'Server error during approval' });
    }
});

module.exports = router;