const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  skillId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Skill', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5,
  },
  comment: { 
    type: String, 
    trim: true, 
    maxlength: 1000,
    required: [true, 'Please provide a comment'],
  }
}, { 
  timestamps: true 
});

// Compound index to ensure a user can only review a skill once.
reviewSchema.index({ userId: 1, skillId: 1 }, { unique: true });
// Index for quickly fetching reviews for a specific skill.
reviewSchema.index({ skillId: 1 });


// This post-save hook automatically updates the average rating on the parent Skill document.
reviewSchema.post('save', async function() {
  // 'this.constructor' refers to the Review model.
  // 'this.skillId' is the skillId from the review that was just saved.
  await this.constructor.calculateAverageRating(this.skillId);
});

// This post-remove hook does the same when a review is deleted.
reviewSchema.post('remove', async function() {
    await this.constructor.calculateAverageRating(this.skillId);
});


/**
 * @desc    Static method to calculate average rating on the Review model itself.
 * This is called by the post-save/remove hooks.
 * @param   {string} skillId - The ID of the skill to update.
 */
reviewSchema.statics.calculateAverageRating = async function(skillId) {
    // We need to require the Skill model here to avoid circular dependency issues.
    const Skill = mongoose.model('Skill');

    const stats = await this.aggregate([
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
            await Skill.findByIdAndUpdate(skillId, {
                averageRating: stats[0].avgRating,
                numReviews: stats[0].numReviews
            });
        } else {
            // If no reviews are left, reset the skill's rating info
            await Skill.findByIdAndUpdate(skillId, {
                averageRating: 0,
                numReviews: 0
            });
        }
    } catch (err) {
        console.error('Error in calculateAverageRating:', err); // Added console.error
    }
};


module.exports = mongoose.model('Review', reviewSchema);
