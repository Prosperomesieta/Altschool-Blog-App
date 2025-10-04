const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

// Create and send token response
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user: user.getPublicProfile()
    }
  });
};

// Register new user
const register = catchAsync(async (req, res, next) => {
  const { first_name, last_name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create new user
  const newUser = await User.create({
    first_name,
    last_name,
    email,
    password
  });

  createSendToken(newUser, 201, res, 'User registered successfully');
});

// Login user
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findByEmail(email).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  createSendToken(user, 200, res, 'Login successful');
});

// Get current user profile
const getProfile = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res, next) => {
  const { first_name, last_name, email } = req.body;
  
  // Don't allow password updates through this endpoint
  if (req.body.password) {
    return next(new AppError('Password updates not allowed through this endpoint', 400));
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { first_name, last_name, email },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: updatedUser.getPublicProfile()
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};