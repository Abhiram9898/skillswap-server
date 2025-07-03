const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getInstructorBookings,
  updateBookingStatus,
  cancelBooking,
  getAllBookings
} = require('../controllers/bookingController');

const { protect, admin } = require('../middleware/auth');

// Routes
const { 
  validateCreateBooking, 
  validateUpdateBookingStatus, 
  validateBookingParams,
  checkValidation 
} = require('../middleware/validators');

// Routes
router.post('/', protect, validateCreateBooking, checkValidation, createBooking);

router.get('/admin/all', protect, admin, getAllBookings);

router.get('/user/:id', protect, validateBookingParams, checkValidation, getUserBookings);

router.get('/instructor/:id', protect, validateBookingParams, checkValidation, getInstructorBookings);

router.put('/:id/status', protect, validateBookingParams, validateUpdateBookingStatus, checkValidation, updateBookingStatus);

router.delete('/:id', protect, validateBookingParams, checkValidation, cancelBooking);

module.exports = router;
