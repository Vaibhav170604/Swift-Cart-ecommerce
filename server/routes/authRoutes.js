const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, googleAuthCallback } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const passport = require('../config/googleAuth');

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/client/login.html' }), googleAuthCallback);

// Protected Route
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
