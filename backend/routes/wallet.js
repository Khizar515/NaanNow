const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const PaymentMethod = require('../models/PaymentMethod');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Shared constant to fix inconsistency (was 50k in top-up, 100k in withdraw)
const MAX_WALLET_BALANCE = 50000;

// @route   GET /wallet
// @desc    Wallet dashboard — show cards and balances
// @access  Protected
router.get('/', protect, async (req, res) => {
    try {
        const cards = await PaymentMethod.find({ 
            userId: req.user.userId,
            isActive: true 
        });

        const safeCards = cards.map(card => ({
            id: card._id,
            cardHolderName: card.cardHolderName,
            cardNumberMasked: `**** **** **** ${card.cardNumber.slice(-4)}`,
            expiryDate: card.expiryDate,
            balance: card.balance,
            isActive: card.isActive
        }));

        res.render('wallet/index', { title: 'My Wallet', cards: safeCards });

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error loading wallet.');
        res.redirect('/');
    }
});

// @route   GET /wallet/add-card
// @desc    Show add card form
// @access  Protected
router.get('/add-card', protect, (req, res) => {
    res.render('wallet/add-card', { title: 'Add Card' });
});

// @route   POST /wallet/add-card
// @desc    Add a new payment method or reactivate a deleted one
// @access  Protected
router.post('/add-card', protect, async (req, res) => {
    try {
        const { cardHolderName, cardNumber, expiryDate, cvv, pin } = req.body;

        let card = await PaymentMethod.findOne({ cardNumber });

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        if (card) {
            if (card.userId.toString() !== req.user.userId) {
                req.flash('error_msg', 'This card is linked to another account.');
                return res.redirect('/wallet/add-card');
            }

            if (card.isActive) {
                req.flash('error_msg', 'This card is already registered and active.');
                return res.redirect('/wallet');
            }

            // Reactivate deactivated card
            card.isActive = true;
            card.cardHolderName = cardHolderName;
            card.expiryDate = expiryDate;
            card.cvv = cvv;
            card.pin = hashedPin;

            await card.save();
            req.flash('success_msg', 'Card reactivated successfully!');
            return res.redirect('/wallet');
        }

        // Create brand new card
        const newCard = new PaymentMethod({
            userId: req.user.userId,
            cardHolderName,
            cardNumber,
            expiryDate,
            cvv, 
            pin: hashedPin,
            balance: 5000 
        });

        await newCard.save();
        req.flash('success_msg', 'Card added successfully with Rs. 5,000 balance!');
        res.redirect('/wallet');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error while adding card.');
        res.redirect('/wallet/add-card');
    }
});

// @route   POST /wallet/:id/deactivate
// @desc    Deactivate a payment method (Soft Delete)
// @access  Protected
router.post('/:id/deactivate', protect, async (req, res) => {
    try {
        const card = await PaymentMethod.findOne({ 
            _id: req.params.id, 
            userId: req.user.userId 
        });

        if (!card) {
            req.flash('error_msg', 'Card not found.');
            return res.redirect('/wallet');
        }

        card.isActive = false;
        await card.save();

        req.flash('success_msg', 'Card deactivated successfully!');
        res.redirect('/wallet');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error while removing card.');
        res.redirect('/wallet');
    }
});

// @route   POST /wallet/top-up
// @desc    Add funds to an existing active card (with capacity limits)
// @access  Protected (Customers Only)
router.post('/top-up', protect, authorize('customer'), async (req, res) => {
    try {
        const { cardId, amount } = req.body;
        const topUpAmount = Number(amount);

        if (!topUpAmount || topUpAmount <= 0) {
            req.flash('error_msg', 'Please enter a valid amount.');
            return res.redirect('/wallet');
        }

        if (topUpAmount > 20000) {
            req.flash('error_msg', 'Maximum top-up limit is Rs. 20,000 per transaction.');
            return res.redirect('/wallet');
        }

        const card = await PaymentMethod.findOne({ 
            _id: cardId, 
            userId: req.user.userId,
            isActive: true 
        });

        if (!card) {
            req.flash('error_msg', 'Active card not found.');
            return res.redirect('/wallet');
        }

        if (card.balance + topUpAmount > MAX_WALLET_BALANCE) {
            const remainingCapacity = MAX_WALLET_BALANCE - card.balance;
            req.flash('error_msg', `Top-up failed. Your card cannot exceed Rs. ${MAX_WALLET_BALANCE}. You can add a maximum of Rs. ${remainingCapacity} more.`);
            return res.redirect('/wallet');
        }

        card.balance += topUpAmount;
        await card.save();

        req.flash('success_msg', `Successfully added Rs. ${topUpAmount} to your card! New balance: Rs. ${card.balance}`);
        res.redirect('/wallet');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error during top-up.');
        res.redirect('/wallet');
    }
});

// @route   GET /wallet/earnings
// @desc    View platform earnings balance
// @access  Protected (Riders and Restaurant Owners)
router.get('/earnings', protect, authorize('rider', 'restaurant_owner', 'admin'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('earningsBalance');
        
        // Get user's active cards for withdrawal
        const cards = await PaymentMethod.find({ userId: req.user.userId, isActive: true });
        const safeCards = cards.map(card => ({
            id: card._id,
            cardNumberMasked: `**** **** **** ${card.cardNumber.slice(-4)}`,
            balance: card.balance
        }));

        res.render('wallet/earnings', { 
            title: 'Earnings', 
            earningsBalance: user.earningsBalance,
            cards: safeCards
        });
    } catch (error) {
        req.flash('error_msg', 'Server error fetching earnings.');
        res.redirect('/');
    }
});

// @route   POST /wallet/withdraw
// @desc    Transfer money from Platform Earnings to a linked Bank Card
// @access  Protected (Riders and Restaurant Owners)
router.post('/withdraw', protect, authorize('rider', 'restaurant_owner'), async (req, res) => {
    try {
        const { cardId, amount } = req.body;
        const withdrawAmount = Number(amount);

        if (!withdrawAmount || withdrawAmount <= 0) {
            req.flash('error_msg', 'Please enter a valid withdrawal amount.');
            return res.redirect('/wallet/earnings');
        }

        const user = await User.findById(req.user.userId);
        if (user.earningsBalance < withdrawAmount) {
            req.flash('error_msg', `Insufficient funds. Your available balance is Rs. ${user.earningsBalance}`);
            return res.redirect('/wallet/earnings');
        }

        const card = await PaymentMethod.findOne({ 
            _id: cardId, 
            userId: req.user.userId,
            isActive: true 
        });

        if (!card) {
            req.flash('error_msg', 'Active destination card not found.');
            return res.redirect('/wallet/earnings');
        }

        // Use the same MAX_WALLET_BALANCE constant (FIX: was 100000 before)
        if (card.balance + withdrawAmount > MAX_WALLET_BALANCE) {
            const remainingCapacity = MAX_WALLET_BALANCE - card.balance;
            req.flash('error_msg', `Withdrawal failed. Your card cannot hold more than Rs. ${MAX_WALLET_BALANCE}. You can transfer a maximum of Rs. ${remainingCapacity}.`);
            return res.redirect('/wallet/earnings');
        }

        user.earningsBalance -= withdrawAmount;
        card.balance += withdrawAmount;

        await user.save();
        await card.save();

        req.flash('success_msg', `Successfully withdrew Rs. ${withdrawAmount} to your card!`);
        res.redirect('/wallet/earnings');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error during withdrawal.');
        res.redirect('/wallet/earnings');
    }
});

module.exports = router;