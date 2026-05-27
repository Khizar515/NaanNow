const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const PaymentMethod = require('../models/PaymentMethod');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/wallet/add-card
// @desc    Add a new payment method or reactivate a deleted one
// @access  Protected (Customers Only)
router.post('/add-card', protect, authorize('customer'), async (req, res) => {
    try {
        const { cardHolderName, cardNumber, expiryDate, cvv, pin } = req.body;

        // 1. Look for the card by number
        let card = await PaymentMethod.findOne({ cardNumber });

        // 2. Hash the incoming PIN regardless of whether it's a new or old card
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        if (card) {
            // IF CARD EXISTS: Check if it belongs to someone else
            if (card.userId.toString() !== req.user.userId) {
                 return res.status(403).json({ message: 'This card is linked to another account.' });
            }

            // IF CARD EXISTS AND IS ACTIVE: Reject the request
            if (card.isActive) {
                return res.status(400).json({ message: 'This card is already registered and active.' });
            }

            // IF CARD EXISTS BUT WAS DEACTIVATED: Reactivate and update details
            card.isActive = true;
            card.cardHolderName = cardHolderName;
            card.expiryDate = expiryDate;
            card.cvv = cvv;
            card.pin = hashedPin;

            await card.save();
            return res.status(200).json({ message: 'Card reactivated successfully!' });
        }

        // 3. IF CARD DOES NOT EXIST: Create a brand new one
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
        res.status(201).json({ message: 'Card added successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while adding card' });
    }
});

// @route   GET /api/wallet/my-cards
// @desc    Fetch all masked cards for the logged-in user
// @access  Protected (Customers Only)
router.get('/my-cards', protect, authorize('customer'), async (req, res) => {
    try {
        // 👇 NEW: Only fetch cards where isActive is true
        const cards = await PaymentMethod.find({ 
            userId: req.user.userId,
            isActive: true 
        });

        const safeCards = cards.map(card => {
            const last4Digits = card.cardNumber.slice(-4);
            return {
                id: card._id,
                cardHolderName: card.cardHolderName,
                cardNumberMasked: `**** **** **** ${last4Digits}`,
                expiryDate: card.expiryDate,
                balance: card.balance,
                isActive: card.isActive
            };
        });

        res.status(200).json(safeCards);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching cards' });
    }
});

// @route   DELETE /api/wallet/:id
// @desc    Deactivate a payment method (Soft Delete)
// @access  Protected (Customers Only)
router.delete('/:id', protect, authorize('customer'), async (req, res) => {
    try {
        const card = await PaymentMethod.findOne({ 
            _id: req.params.id, 
            userId: req.user.userId 
        });

        if (!card) {
            return res.status(404).json({ message: 'Card not found or unauthorized action' });
        }

        // 👇 NEW: Soft Delete Logic
        card.isActive = false;
        await card.save();

        res.status(200).json({ message: 'Card deactivated successfully!' });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Invalid Card ID format' });
        }
        res.status(500).json({ message: 'Server error while removing card' });
    }
});

// @route   PUT /api/wallet/top-up
// @desc    Add funds to an existing active card (with capacity limits)
// @access  Protected (Customers Only)
router.put('/top-up', protect, authorize('customer'), async (req, res) => {
    try {
        const { cardId, amount } = req.body;
        const topUpAmount = Number(amount);

        // Security Check 1: Valid number
        if (!topUpAmount || topUpAmount <= 0) {
            return res.status(400).json({ message: 'Please enter a valid amount' });
        }

        // Security Check 2: Transaction limit
        if (topUpAmount > 20000) {
            return res.status(400).json({ message: 'Maximum top-up limit is Rs. 20,000 per transaction' });
        }

        const card = await PaymentMethod.findOne({ 
            _id: cardId, 
            userId: req.user.userId,
            isActive: true 
        });

        if (!card) {
            return res.status(404).json({ message: 'Active card not found' });
        }

        // 👇 NEW Security Check 3: Maximum Wallet Capacity (Let's set it to Rs. 100,000)
        const MAX_WALLET_BALANCE = 50000;
        
        if (card.balance + topUpAmount > MAX_WALLET_BALANCE) {
            // Calculate exactly how much room they have left
            const remainingCapacity = MAX_WALLET_BALANCE - card.balance;
            
            return res.status(400).json({ 
                message: `Top-up failed. Your card cannot exceed Rs. ${MAX_WALLET_BALANCE}. You can add a maximum of Rs. ${remainingCapacity} more.` 
            });
        }

        // If it passes all 3 security checks, update the balance!
        card.balance += topUpAmount;
        await card.save();

        res.status(200).json({ 
            message: `Successfully added Rs. ${topUpAmount} to your card!`,
            newBalance: card.balance
        });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Invalid Card ID' });
        }
        res.status(500).json({ message: 'Server error during top-up' });
    }
});

module.exports = router;