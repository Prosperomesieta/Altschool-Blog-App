const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.use(authenticateToken); // All routes after this middleware require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router; 

