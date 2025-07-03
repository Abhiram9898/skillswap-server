
const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
exports.protect = async (req, res, next) => {
  let token;

  // Check 1: Token in Authorization header (Bearer)
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check 2: Token in HTTP-only cookie (optional)
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // Reject if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No token provided',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: User not found',
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Not authorized: Invalid token',
    });
  }
};


exports.admin = (req, res, next) => {
  // Ensure `protect` middleware runs first
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: User not authenticated',
    });
  }

  // Check admin role
  if (req.user.role === 'admin') {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Access denied: Admin privileges required',
  });
};

// middleware/auth.js
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Requires ${roles.join(' or ')} role`
      });
    }
    next();
  };
};