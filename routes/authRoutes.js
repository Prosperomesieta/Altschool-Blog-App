const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticateTokenAuth } = require('../middleware/authMiddleware');
const { validateAuth, registerSchema, loginSchema } = require('../middleware/validation');

const router = express.Router();


router.post('/register', validateAuth(registerSchema), register);
router.post('/login', validateAuth(loginSchema), login);


router.use(authenticateTokenAuth); 

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

module.exports = router; 

