const { body, validationResult, param } = require('express-validator');

/**
 * @desc    Validation rules for registration
 */
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
    
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
];

/**
 * @desc    Validation rules for login
 */
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
    
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
];

/**
 * @desc    Middleware to check validation results with debug logging
 */
exports.checkValidation = (req, res, next) => {
  console.log('🔍 CheckValidation middleware hit');
  console.log('📦 Request body in validation:', req.body);
  
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors found:');
    errors.array().forEach(err => {
      console.log(`   - ${err.param}: ${err.msg}`);
    });
    
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  console.log('✅ Validation passed');
  next();
};

// Booking creation validation
exports.validateCreateBooking = [
  body('skillId')
    .notEmpty().withMessage('Skill ID is required')
    .isMongoId().withMessage('Invalid Skill ID format'),
    
  body('date')
    .notEmpty().withMessage('Booking date is required')
    .isISO8601().withMessage('Invalid date format'),
    
  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 1 }).withMessage('Duration must be at least 1 hour')
];

// Booking status update validation
exports.validateUpdateBookingStatus = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
    
  body('meetingLink')
    .optional()
    .isURL().withMessage('Invalid meeting link format')
];

// ID parameter validation (reusable)
exports.validateBookingParams = [
  param('id')
    .optional()
    .isMongoId().withMessage('Invalid ID format'),
    
  param('userId')
    .optional()
    .isMongoId().withMessage('Invalid User ID format'),
    
  param('instructorId')
    .optional()
    .isMongoId().withMessage('Invalid Instructor ID format')
];

exports.validateReview = [
  body('skillId')
    .notEmpty().withMessage('Skill ID is required')
    .isMongoId().withMessage('Invalid skill ID'),
  body('rating')
    .isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim().notEmpty().withMessage('Comment is required')
];

