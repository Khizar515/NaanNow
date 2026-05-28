const jwt = require('jsonwebtoken');

// 1. The main "Security Guard" - Checks if you are logged in
const protect = (req, res, next) => {
    // Look for the token in the headers
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        // Tokens usually come in the format: "Bearer eyJhbGciOi..."
        // We need to strip out the word "Bearer " to just get the string
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }

        // Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user payload (userId and role) to the request object
        req.user = decoded; 
        
        // Let the user pass to the actual route!
        next(); 
    } catch (error) {
        res.status(401).json({ message: 'Token is invalid or expired' });
    }
};

// 2. The "VIP Bouncer" - Checks if you have the correct role
const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user.role was just attached by the 'protect' function above!
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Your role (${req.user.role}) is not authorized to do this.` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };