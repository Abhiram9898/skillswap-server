const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, checkValidation } = require('../middleware/validators'); // ✅ Ensure this exists

// Public Routes (No authentication required)
router.post(
  '/register',
  validateRegister, //  Checks name, email, password, etc.
  checkValidation,
  register
);

router.post(
  '/login',
  validateLogin, //  validate email/password format
  checkValidation,
  login
);

router.post('/logout', logout);

// Protected Route (JWT required)
router.get(
  '/me',
  protect, // Ensures valid JWT and attaches user to req.user
  getMe
);

module.exports = router;