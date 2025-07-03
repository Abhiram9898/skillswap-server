const express = require('express');
const router = express.Router();
const Message = require('../models/Message'); // Make sure to import Message model
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { checkValidation } = require('../middleware/validators');

/**
 * @route GET /api/messages/:bookingId
 * @desc Get all messages for a booking
 * @access Private
 */
router.get('/:bookingId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ bookingId: req.params.bookingId })
      .populate({
        path: 'senderId',
        select: 'name firstName lastName role avatar',
        transform: doc => {
          if (!doc) return null;
          return {
            _id: doc._id,
            name: doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim(),
            role: doc.role,
            avatar: doc.avatar
          };
        }
      })
      .sort({ createdAt: 1 });

    // Filter out messages where sender is null (deleted users)
    const filteredMessages = messages.filter(msg => msg.senderId !== null);

    res.json(filteredMessages.map(msg => ({
      _id: msg._id,
      bookingId: msg.bookingId,
      message: msg.message,
      attachment: msg.attachment,
      createdAt: msg.createdAt,
      sender: {
        _id: msg.senderId._id,
        name: msg.senderId.name,
        role: msg.senderId.role || 'student', // Default to student if missing
        avatar: msg.senderId.avatar
      }
    })));
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching messages',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * @route POST /api/messages/
 * @desc Create a new message
 * @access Private
 */
router.post(
  '/',
  protect,
  [
    body('bookingId').notEmpty().isMongoId().withMessage('Invalid booking ID'),
    body('message')
      .if(body('attachment').not().exists())
      .notEmpty()
      .withMessage('Message cannot be empty when no attachment is provided'),
    body('attachment')
      .optional()
      .isString()
      .withMessage('Attachment must be a string'),
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { bookingId, message, attachment } = req.body;
      
      const newMessage = new Message({
        bookingId,
        message,
        attachment,
        senderId: req.user._id
      });

      const savedMessage = await newMessage.save();
      
      // Populate sender info before sending response
      const populatedMessage = await Message.populate(savedMessage, {
        path: 'senderId',
        select: 'name firstName lastName role avatar'
      });

      res.status(201).json({
        _id: populatedMessage._id,
        bookingId: populatedMessage.bookingId,
        message: populatedMessage.message,
        attachment: populatedMessage.attachment,
        createdAt: populatedMessage.createdAt,
        sender: {
          _id: req.user._id,
          name: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
          role: req.user.role || 'student',
          avatar: req.user.avatar
        }
      });
    } catch (err) {
      console.error('Error creating message:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

module.exports = router;