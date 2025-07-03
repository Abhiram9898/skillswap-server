const Booking = require('../models/Booking');
const Skill = require('../models/Skill');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Create a booking
 * @route   POST /api/bookings
 * @access  Private
 */
exports.createBooking = asyncHandler(async (req, res) => {
  const { skillId, date, duration } = req.body;

  const skill = await Skill.findById(skillId);
  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (skill.createdBy.toString() === req.user.id) {
    res.status(400);
    throw new Error('You cannot book your own skill');
  }

  // FIX 1: Define startTime and endTime for conflict checking
  const startTime = new Date(date);
  const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

  // Check for booking conflicts with the instructor's schedule
  const conflictingBooking = await Booking.findOne({
    instructorId: skill.createdBy,
    status: { $in: ['pending', 'confirmed'] }, // Only check active bookings
    $or: [
      // Starts during the new booking window
      { date: { $gte: startTime, $lt: endTime } },
      // Ends during the new booking window
      { $expr: { $gt: [{ $add: ["$date", { $multiply: ["$duration", 60 * 60 * 1000] }] }, startTime] } },
    ],
  });

  if (conflictingBooking) {
    res.status(409); // 409 Conflict
    throw new Error('This time slot is unavailable with the instructor.');
  }

  const booking = await Booking.create({
    userId: req.user.id,
    skillId,
    instructorId: skill.createdBy,
    date: startTime,
    duration,
  });

  const populatedBooking = await booking.populate([
    { path: 'skillId', select: 'title category pricePerHour' },
    { path: 'instructorId', select: 'name avatar' },
    { path: 'userId', select: 'name avatar' },
  ]);

  // FIX 2: Send the populated booking object directly
  res.status(201).json(populatedBooking);
});

/**
 * @desc    Get bookings for a specific user
 * @route   GET /api/bookings/user/:id
 * @access  Private
 */
exports.getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.params.id })
    .populate('skillId', 'title category pricePerHour')
    .populate('instructorId', 'name avatar')
    .sort({ date: -1 });

  // FIX 2: Send the array of bookings directly
  res.status(200).json(bookings);
});

/**
 * @desc    Get bookings for a specific instructor
 * @route   GET /api/bookings/instructor/:id
 * @access  Private
 */
exports.getInstructorBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ instructorId: req.params.id })
    .populate('skillId', 'title category pricePerHour')
    .populate('userId', 'name avatar')
    .sort({ date: -1 });

  // FIX 2: Send the array of bookings directly
  res.status(200).json(bookings);
});

/**
 * @desc    Update booking status
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Instructor or Admin)
 */
exports.updateBookingStatus = asyncHandler(async (req, res) => {
    const { status, meetingLink } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Authorization check
    if (booking.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to update this booking');
    }

    booking.status = status || booking.status;
    if (meetingLink) {
        booking.meetingLink = meetingLink;
    }

    const updatedBooking = await booking.save();
    const populatedBooking = await updatedBooking.populate([
        { path: 'userId', select: 'name avatar' },
        { path: 'skillId', select: 'title pricePerHour' }
    ]);

    // FIX 2: Send the updated booking object directly
    res.status(200).json(populatedBooking);
});

/**
 * @desc    Cancel a booking
 * @route   DELETE /api/bookings/:id
 * @access  Private (User, Instructor, or Admin)
 */
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Authorization check
  const isUser = booking.userId.toString() === req.user.id;
  const isInstructor = booking.instructorId.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isUser && !isInstructor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  booking.status = 'cancelled';
  booking.cancelledBy = req.user.id;
  await booking.save();

  // FIX 3: Return the bookingId directly as the frontend expects
  res.status(200).json(booking._id);
});


/**
 * @desc    Get all bookings (for Admin)
 * @route   GET /api/bookings/admin/all
 * @access  Private (Admin only)
 */
exports.getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('userId', 'name email')
    .populate('instructorId', 'name email')
    .populate('skillId', 'title pricePerHour')
    .sort({ createdAt: -1 });


  res.status(200).json(bookings);
});
