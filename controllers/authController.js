const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');

// Validate JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Token configuration
const TOKEN_CONFIG = {
  expiresIn: '30d',
  cookieName: 'token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }
};

// Helper to generate JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: TOKEN_CONFIG.expiresIn });

// Helper to set the secure cookie
const setTokenCookie = (res, token) => {
  res.cookie(TOKEN_CONFIG.cookieName, token, TOKEN_CONFIG.cookieOptions);
};

/**
 * @desc    Generates the authentication response (token and user info)
 * @param   {object} res - Express response object
 * @param   {object} user - Mongoose user object
 * @returns {object} The flat user info object for the JSON response
 */
const generateAuthResponse = (res, user) => {
  const token = generateToken(user._id);
  setTokenCookie(res, token); // Set the secure httpOnly cookie

  // Create the flat JSON object that the frontend expects
  const userInfo = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token: token, // Also include token in the body for easy access by frontend
  };

  return userInfo;
};


/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  // FIX 1: Destructure 'role' from the request body
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409); // 409 Conflict
    throw new Error('Email already registered');
  }

  // FIX 1: Pass 'role' when creating the user
  const user = await User.create({ name, email, password, role });
  
  if (user) {
    // FIX 2: Use the helper to generate and send the flat response
    const userInfo = generateAuthResponse(res, user);
    res.status(201).json(userInfo);
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});


/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.comparePassword(password))) {
    // FIX 2: Use the helper to generate and send the flat response
    const userInfo = generateAuthResponse(res, user);
    res.json(userInfo);
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});


/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the 'protect' middleware
  const user = await User.findById(req.user.id);

  if (user) {
    // FIX 2: Send a flat response consistent with login/register
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = (req, res) => {
  // Clear the secure cookie
  res.clearCookie(TOKEN_CONFIG.cookieName, TOKEN_CONFIG.cookieOptions);
  res.status(200).json({ message: 'Logged out successfully' });
};


module.exports = {
  register,
  login,
  logout,
  getMe
};
