const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { AppError, catchAsync } = require('../middleware/errorHandler');


const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};


const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  
  
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


const register = catchAsync(async (req, res, next) => {
  const { first_name, last_name, email, password } = req.body;

  
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      status: 'error',
      message: 'User with this email already exists'
    });
  }

  
  const newUser = await User.create({
    first_name,
    last_name,
    email,
    password
  });

  createSendToken(newUser, 201, res, 'User registered successfully');
});


const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  
  const user = await User.findByEmail(email).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid email or password'
    });
  }

  createSendToken(user, 200, res, 'Login successful');
});


const getProfile = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user.getPublicProfile()
    }
  });
});


const updateProfile = catchAsync(async (req, res, next) => {
  const { first_name, last_name, email } = req.body;
  
  
  if (req.body.password) {
    return res.status(400).json({
      status: 'error',
      message: 'Password updates not allowed through this endpoint'
    });
  }

  
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