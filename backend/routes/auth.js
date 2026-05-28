const { protect } = require('../middleware/authMiddleware');

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a new user (Customer, Rider, Restaurant Owner)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, address } = req.body;

        // 1. Check if the email is already in use
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the new user object
        user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            address
        });

        // 4. Save to MongoDB
        await user.save();

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get JWT token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Compare the typed password with the hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. Create the JWT Payload (The data stored inside the token)
        const payload = {
            userId: user._id,
            role: user.role
        };

        // 4. Sign the token and send it back
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, // Pulling from your .env file
            { expiresIn: '7d' }     // Token expires in 7 days
        );

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @desc    Get current logged-in user profile
// @access  Protected (Requires JWT Token)
router.get('/me', protect, async (req, res) => {
    try {
        // req.user.userId was attached by the protect middleware!
        // The .select('-password') part ensures we NEVER send the hashed password back to the frontend
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

module.exports = router;