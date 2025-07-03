const express = require('express');
const router = express.Router();

const {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  getInstructorSkills, 
} = require('../controllers/skillController');

const { protect } = require('../middleware/auth');

// Public Routes
router.get('/', getSkills);

// Instructor Route: Get own skills
// IMPORTANT: This more specific route MUST come BEFORE the general /:id route
router.get('/instructor', protect, getInstructorSkills); 

// Public Route: Get a single skill by ID
router.get('/:id', getSkillById);


// Protected Routes (for CRUD operations)
router.post('/', protect, createSkill);
router.put('/:id', protect, updateSkill);
router.delete('/:id', protect, deleteSkill);

module.exports = router;
