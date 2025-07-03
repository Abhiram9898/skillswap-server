const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true, min: 1 }, // Changed from 0.5 to 1 to match validation
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], // Removed 'rejected' to match controller validation
    default: 'pending' 
  },
  meetingLink: { type: String, default: '' },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  cancellationReason: { type: String, maxlength: 500 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtuals
bookingSchema.virtual('endTime').get(function() {
  return new Date(this.date.getTime() + this.duration * 60 * 60 * 1000);
});

// Indexes
bookingSchema.index({ userId: 1 });
bookingSchema.index({ instructorId: 1 });
bookingSchema.index({ skillId: 1, date: 1 });

// Updated index for conflict detection - includes all active bookings (not cancelled)
bookingSchema.index(
  { instructorId: 1, date: 1, status: 1 },
  { partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'completed'] } } }
);

// Additional index for efficient overlap detection queries
bookingSchema.index({ instructorId: 1, date: 1, duration: 1 });

module.exports = mongoose.model('Booking', bookingSchema);