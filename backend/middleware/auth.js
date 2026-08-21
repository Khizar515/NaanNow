const jwt = require('jsonwebtoken');
const StaffAssignment = require('../models/StaffAssignment');

const auth = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded.user;
    req.user._id = decoded.user.id; // Alias for convenience
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    // If endpoint requires admin role, check if user is an active staff member
    if (roles.includes('admin')) {
      try {
        const activeAssignment = await StaffAssignment.findOne({
          userId: req.user._id,
          revokedAt: null
        }).populate('roleId');

        if (activeAssignment && activeAssignment.roleId) {
          req.isStaff = true;
          req.staffPermissions = activeAssignment.roleId.permissions || [];
          return next();
        }
      } catch (err) {
        console.error("Error checking staff assignment in auth middleware:", err);
      }
    }

    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  };
};

module.exports = { auth, restrictTo, roleCheck: restrictTo };
