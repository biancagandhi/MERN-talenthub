const jwt = require('jsonwebtoken');
const User = require('../models/User');

// INTENTIONAL ISSUE: Weak middleware — does not check token expiry robustly,
// no refresh token logic, secret hardcoded as fallback, user role not re-validated from DB on every request
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // INTENTIONAL ISSUE: JWT_SECRET fallback to hardcoded string
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // INTENTIONAL ISSUE: Fetches user on every request without caching
      req.user = await User.findById(decoded.id).select('-password');

      // INTENTIONAL ISSUE: Does not check if user is still active
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      // INTENTIONAL ISSUE: Generic error — doesn't distinguish expired vs invalid token
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// INTENTIONAL ISSUE: Role check middleware exists but is inconsistently used across routes
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { protect, requireRole };
