const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getAllUsers,
  getUserStats
} = require('../controllers/userController');

const { protect, admin } = require('../middleware/auth');

// Routes
router.get('/', protect, admin, getAllUsers);
router.get('/stats', protect, admin, getUserStats);
router.get('/:id', protect, getUserProfile);
router.put('/:id', protect, updateUserProfile);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
