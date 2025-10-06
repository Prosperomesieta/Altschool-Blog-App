const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticateTokenAuth } = require('../middleware/authMiddleware');
const { validateAuth, registerSchema, loginSchema } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateAuth(registerSchema), register);
router.post('/login', validateAuth(loginSchema), login);

// Protected routes
router.use(authenticateTokenAuth); // All routes after this middleware require authentication

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

module.exports = router; 

