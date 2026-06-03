const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Session-based protection for EJS pages — redirects to login if not authenticated
const protect = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }
    req.flash('error_msg', 'Please log in to access this page.');
    return res.redirect('/auth/login');
};

// 2. Role-based authorization — redirects to home if role doesn't match
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            req.flash('error_msg', `Access denied. Your role (${req.user ? req.user.role : 'unknown'}) is not authorized.`);
            return res.redirect('/');
        }
        next();
    };
};

// 3. API-style JWT protection for AJAX/Socket.io endpoints that still need JSON responses
const protectAPI = (req, res, next) => {
    // First check session (for EJS-based AJAX calls)
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    // Fallback to JWT header (for external API consumers)
    let token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is invalid or expired' });
    }
};

module.exports = { protect, authorize, protectAPI };