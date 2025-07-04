const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Skill = require('../models/Skill'); // Ensure Skill model is imported
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Create a review for a skill
 * @route   POST /api/reviews
 * @access  Private
 */
exports.createReview = asyncHandler(async (req, res) => {
  const { skillId, rating, comment } = req.body;

  // 1. Check: Completed booking exists for this skill by this user
  const hasCompletedBooking = await Booking.exists({
    userId: req.user.id,
    skillId,
    status: 'completed',
  });

  if (!hasCompletedBooking) {
    res.status(403);
    throw new Error('Only users with a completed session can leave a review.');
  }

  // 2. Check: User hasn't already reviewed this skill
  const alreadyReviewed = await Review.exists({
    userId: req.user.id,
    skillId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already submitted a review for this skill.');
  }

  // 3. Create Review
  const review = await Review.create({
    userId: req.user.id,
    skillId,
    rating,
    comment,
  });

  // --- FIX START: Update the Skill's reviews array ---
  const skillToUpdate = await Skill.findById(skillId);
  if (skillToUpdate) {
    // Check if the review already exists in the array (for idempotency, though unique index helps)
    if (!skillToUpdate.reviews.includes(review._id)) {
      skillToUpdate.reviews.push(review._id);
      await skillToUpdate.save(); // Save the skill to persist the new review reference
    }
  }
  // --- FIX END ---

  // 4. Update average rating of the skill
  await Skill.calculateAverageRating(skillId);

  // 5. Populate user details in review
  const populatedReview = await review.populate({
    path: 'userId',
    select: 'name avatar',
  });

  res.status(201).json(populatedReview);
});

/**
 * @desc    Get all reviews for a skill
 * @route   GET /api/reviews/:id
 * @access  Public
 */
exports.getSkillReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ skillId: req.params.id })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(200).json(reviews);
});
