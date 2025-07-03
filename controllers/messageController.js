const mongoose = require('mongoose');
const Message = require('../models/Message');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get messages for a specific booking
 * @route   GET /api/messages/:bookingId
 * @access  Private (User or Instructor involved in the booking)
 */
exports.getMessages = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.bookingId)) {
    res.status(404);
    throw new Error('Booking not found (invalid ID format)');
  }

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    $or: [{ userId: req.user.id }, { instructorId: req.user.id }],
  });

  if (!booking) {
    res.status(403);
    throw new Error('You are not authorized to access this chat.');
  }

  const messages = await Message.find({ bookingId: req.params.bookingId })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: 1 });

  res.status(200).json(messages);
});

/**
 * @desc    Send a new message via REST (not WebSocket)
 * @route   POST /api/messages
 * @access  Private (User or Instructor involved in the booking)
 */
exports.createMessage = asyncHandler(async (req, res) => {
  const { bookingId, message } = req.body;

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    res.status(400);
    throw new Error('Invalid booking ID');
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    $or: [{ userId: req.user.id }, { instructorId: req.user.id }],
  });

  if (!booking) {
    res.status(403);
    throw new Error('You are not authorized to send messages for this booking');
  }

  const newMessage = await Message.create({
    bookingId,
    senderId: req.user.id,
    message,
  });

  const populatedMessage = await newMessage.populate({
    path: 'senderId',
    select: 'name avatar',
  });

  res.status(201).json(populatedMessage);
});

/**
 * @desc    Save a new message (for WebSocket usage)
 * @param   {object} messageData - bookingId, senderId, message
 * @returns {Promise<object>} - Populated message object
 */
exports.saveMessage = async (messageData) => {
  const { bookingId, senderId, message } = messageData;

  const newMessage = await Message.create({
    bookingId,
    senderId,
    message,
  });

  const populatedMessage = await newMessage.populate({
    path: 'senderId',
    select: 'name avatar',
  });

  return populatedMessage;
};
