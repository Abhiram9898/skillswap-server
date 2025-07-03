const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin or Owner)
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Only owner or admin can access
  if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access this profile');
  }

  res.status(200).json(user);
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private (Admin or Owner)
 */
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Only owner or admin can update
  if (req.user.id !== user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this profile');
  }

  const { name, bio, avatar } = req.body;

  user.name = name || user.name;
  user.bio = bio || user.bio;
  user.avatar = avatar || user.avatar;

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    bio: updatedUser.bio,
    avatar: updatedUser.avatar,
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.deleteOne(); // or user.remove()

  res.status(200).json({ success: true, message: 'User removed successfully' });
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.status(200).json(users);
});

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin only)
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: firstDayOfMonth },
  });

  res.status(200).json({
    totalUsers,
    newUsersThisMonth,
  });
});
