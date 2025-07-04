
const Skill = require('../models/Skill');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Create a new skill
 * @route   POST /api/skills
 * @access  Private
 */
exports.createSkill = asyncHandler(async (req, res) => {
  const { title, description, category, pricePerHour } = req.body;

  const skill = await Skill.create({
    title,
    description,
    category,
    pricePerHour,
    createdBy: req.user.id,
  });

  res.status(201).json(skill);
});

/**
 * @desc    Get all skills (with optional category & search filter)
 * @route   GET /api/skills
 * @access  Public
 */
exports.getSkills = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const query = {};

  if (category) query.category = category;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skills = await Skill.find(query)
    .populate('createdBy', 'name avatar')
    .lean();

  res.status(200).json({ skills });
});

/**
 * @desc    Get a single skill by ID
 * @route   GET /api/skills/:id
 * @access  Public
 */
exports.getSkillById = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id)
    .populate('createdBy', 'name avatar bio')
    .populate({
      path: 'reviews', // This is the array on the Skill model
      populate: {
        path: 'userId', // Nested populate for the user who wrote the review
        select: 'name avatar',
      },
    });

  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  res.status(200).json(skill);
});

/**
 * @desc    Get all skills created by the logged-in instructor
 * @route   GET /api/skills/instructor
 * @access  Private
 */
exports.getInstructorSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(skills);
});

/**
 * @desc    Update a skill
 * @route   PUT /api/skills/:id
 * @access  Private (Owner only)
 */
exports.updateSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    res.status(404);
    throw new new Error('Skill not found');
  }

  if (skill.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('You are not authorized to update this skill');
  }

  const { title, description, category, pricePerHour } = req.body;

  skill.title = title || skill.title;
  skill.description = description || skill.description;
  skill.category = category || skill.category;
  skill.pricePerHour = pricePerHour || skill.pricePerHour;

  const updatedSkill = await skill.save();

  res.status(200).json(updatedSkill);
});

/**
 * @desc    Delete a skill
 * @route   DELETE /api/skills/:id
 * @access  Private (Owner or Admin)
 */
exports.deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (skill.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not authorized to delete this skill');
  }

  await skill.deleteOne();

  res.status(200).json({ success: true, message: 'Skill removed successfully' });
});
