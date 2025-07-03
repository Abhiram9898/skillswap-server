const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Do not send password in query results by default
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'], 
    default: 'student'
  },
  avatar: {
    type: String,
    default: 'https://placehold.co/150x150/EFEFEF/AAAAAA?text=User',
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
}, {
  timestamps: true,
});

// Mongoose middleware to hash the password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with a cost factor of 12
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * @desc    Mongoose instance method to compare a candidate password 
 * with the user's hashed password.
 * @param   {string} candidatePassword - The plain-text password from the login form.
 * @returns {Promise<boolean>} - A promise that resolves to true if passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  // FIX: This now correctly uses `this.password` to refer to the hashed password
  // of the user instance, which is the correct way to do it.
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
