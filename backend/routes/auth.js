const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /auth/register
// @desc    Show registration form
router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('auth/register', { title: 'Register' });
});

// @route   POST /auth/register
// @desc    Register a new user (Customer, Rider, Restaurant Owner)
router.post('/register', upload.array('documents', 5), async (req, res) => {
    try {
        const { name, email, password, phone, role, address } = req.body;

        // Password strength validation
        if (!password || password.length < 6) {
            req.flash('error_msg', 'Password must be at least 6 characters long.');
            return res.redirect('/auth/register');
        }

        // Check if the email is already in use
        let user = await User.findOne({ email });
        if (user) {
            req.flash('error_msg', 'An account already exists with this email.');
            return res.redirect('/auth/register');
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user
        user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'customer',
            address
        });

        await user.save();

        // Handle Rider Proofs Upload if Rider
        if (role === 'rider' && req.files && req.files.length > 0) {
            const safeName = user.name.replace(/[^a-zA-Z0-9]/g, '_');
            const targetDir = `uploads/riders/${safeName}_${user._id}`;
            
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const finalFilePaths = [];

            req.files.forEach(file => {
                const targetPath = path.join(targetDir, file.filename);
                fs.renameSync(file.path, targetPath);
                finalFilePaths.push(`/${targetPath.replace(/\\/g, '/')}`);
            });

            user.riderProofs = finalFilePaths;
            await user.save();
        }

        req.flash('success_msg', 'Account created successfully! Please log in.');
        res.redirect('/auth/login');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error during registration.');
        res.redirect('/auth/register');
    }
});

// @route   GET /auth/login
// @desc    Show login form
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('auth/login', { title: 'Login' });
});

// @route   POST /auth/login
// @desc    Authenticate user & create session
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid email or password.');
            return res.redirect('/auth/login');
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid email or password.');
            return res.redirect('/auth/login');
        }

        // Store user data in session (excluding password)
        req.session.user = {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePic: user.profilePic,
            address: user.address,
            isApprovedRider: user.isApprovedRider,
            riderProofs: user.riderProofs
        };

        req.flash('success_msg', `Welcome back, ${user.name}!`);

        // Role-based redirect
        switch (user.role) {
            case 'admin':
                return res.redirect('/admin/dashboard');
            case 'restaurant_owner':
                return res.redirect('/restaurants/my-shop');
            case 'rider':
                return res.redirect('/orders/available-deliveries');
            default:
                return res.redirect('/');
        }

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error during login.');
        res.redirect('/auth/login');
    }
});

// @route   GET /auth/logout
// @desc    Destroy session and redirect to login
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
        res.redirect('/auth/login');
    });
});

module.exports = router;