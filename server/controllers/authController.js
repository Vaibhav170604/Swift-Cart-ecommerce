const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// Helper: Generate signed JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @route  POST /api/auth/register
// @desc   Register a new user
// @access Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    // Prevent duplicate registration
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    console.error('Register Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

// @route  POST /api/auth/login
// @desc   Authenticate user and return JWT token
// @access Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

// @route  GET /api/auth/me
// @desc   Get current logged-in user profile
// @access Protected
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @route  PUT /api/auth/profile
// @desc   Update user profile (name, email, optional password)
// @access Protected
const updateProfile = async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required.',
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters.',
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    if (normalizedEmail !== req.user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.',
        });
      }
      const isMatch = await bcrypt.compare(currentPassword, req.user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
      const salt = await bcrypt.genSalt(12);
      req.user.password = await bcrypt.hash(newPassword, salt);
    }

    req.user.name = name.trim();
    req.user.email = normalizedEmail;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    console.error('Update Profile Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
};

// @route  GET /api/auth/google/callback
// @desc   Google OAuth callback handler
// @access Public
const googleAuthCallback = async (req, res) => {
  try {
    // Passport attaches the user to req.user after successful authentication
    if (!req.user) {
      const frontendBase = (process.env.FRONTEND_URL || 'http://127.0.0.1:5500').replace(/\/$/, '');
      return res.redirect(`${frontendBase}/login.html?error=auth_failed`);
    }

    const token = generateToken(req.user._id);
    const frontendBase = (process.env.FRONTEND_URL || 'http://127.0.0.1:5500').replace(/\/$/, '');
    const redirectUrl = new URL('index.html', `${frontendBase}/`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('googleAuth', 'true');

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google Auth Callback Error:', error.message);
    const frontendBase = (process.env.FRONTEND_URL || 'http://127.0.0.1:5500').replace(/\/$/, '');
    return res.redirect(`${frontendBase}/login.html?error=server_error`);
  }
};

module.exports = { registerUser, loginUser, getMe, updateProfile, googleAuthCallback };
