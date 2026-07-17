const jwt = require('jsonwebtoken');

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
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

module.exports = { auth, restrictTo, roleCheck: restrictTo };
