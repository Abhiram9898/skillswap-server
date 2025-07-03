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
    // FIX: Added 'Cooking' to match the frontend categories
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
  // This field will be populated by the Review model via a pre-save hook
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    // Round the average rating to two decimal places when setting it
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
 * * This function calculates the average of all review ratings for a given skill
 * and updates the 'averageRating' and 'numReviews' fields on the skill document.
 */
skillSchema.statics.calculateAverageRating = async function(skillId) {
  const stats = await this.model('Review').aggregate([
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

  if (stats.length > 0) {
    await this.findByIdAndUpdate(skillId, {
      numReviews: stats[0].numReviews,
      averageRating: stats[0].avgRating
    });
  } else {
    // If no reviews exist, reset to defaults
    await this.findByIdAndUpdate(skillId, {
      numReviews: 0,
      averageRating: 0
    });
  }
};

// Hook to call the calculation after a review is saved
// This will be on the Review model, which we'll see next.

module.exports = mongoose.model('Skill', skillSchema);
