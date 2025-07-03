const express = require('express');
const router = express.Router();
const {
  createReview,
  getSkillReviews
} = require('../controllers/reviewController');

const { protect } = require('../middleware/auth');

// Routes
router.post('/', protect, createReview);
router.get('/:id', getSkillReviews); // skillId

module.exports = router;
