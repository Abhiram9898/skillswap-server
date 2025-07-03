const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 1,
    maxlength: 2000 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  },
  attachment: {
    type: String,
    validate: {
      validator: v => !v || /https?:\/\/.+/i.test(v),
      message: 'Invalid attachment URL'
    }
  },
  attachmentType: {
    type: String,
    enum: ['image', 'document', 'video', null],
    default: null
  },
  messageType: {
    type: String,
    enum: ['user', 'system'],
    default: 'user'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }  // Includes virtuals in API responses
});

// Indexes
messageSchema.index({ bookingId: 1, createdAt: 1 }); // Existing
messageSchema.index({ senderId: 1, bookingId: 1 }); // New
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1-year TTL

// Virtuals
messageSchema.virtual('meta').get(function() {
  return {
    isRecent: Date.now() - this.createdAt < 86400000,
    hasAttachment: !!this.attachment
  };
});

module.exports = mongoose.model('Message', messageSchema);