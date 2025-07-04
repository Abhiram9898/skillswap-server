const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A skill must have a title'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'A skill must have a description'],
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: [true, 'A skill must have a category'],
    enum: ['Programming', 'Design', 'Music', 'Language', 'Cooking', 'Other'],
    index: true
  },
  pricePerHour: {
    type: Number,
    required: [true, 'A skill must have a price'],
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // This field will store ObjectIDs of reviews.
  // It needs to be explicitly updated when reviews are created/deleted.
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: val => Math.round(val * 100) / 100
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
skillSchema.index({ title: 'text', description: 'text' });
skillSchema.index({ pricePerHour: 1, averageRating: -1 });

/**
 * @desc    Static method to calculate the average rating for a skill
 * @param   {string} skillId - The ID of the skill to update
 */
skillSchema.statics.calculateAverageRating = async function(skillId) {
  const Review = mongoose.model('Review'); // Avoid circular dependency

  const stats = await Review.aggregate([
    {
      $match: { skillId: skillId }
    },
    {
      $group: {
        _id: '$skillId',
        numReviews: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await this.findByIdAndUpdate(skillId, {
        numReviews: stats[0].numReviews,
        averageRating: stats[0].avgRating
      });
    } else {
      await this.findByIdAndUpdate(skillId, {
        numReviews: 0,
        averageRating: 0
      });
    }
  } catch (err) {
    console.error('Error calculating average rating for skill:', skillId, err);
  }
};

module.exports = mongoose.model('Skill', skillSchema);
