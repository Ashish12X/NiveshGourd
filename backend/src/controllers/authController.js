// backend/src/controllers/authController.js
import User from '../models/User.js';
import { generateTokenAndSetCookie, clearAuthCookie } from '../utils/generateToken.js';
import { ensureUserLocalizedName } from '../services/ai/transliterationService.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // 3. Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      localizedNames: new Map([['en', name.trim()]]),
    });

    // 4. Generate JWT & set HTTP-only cookie
    const token = generateTokenAndSetCookie(res, user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: user.toSafeObject('en'),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user with password selected explicitly
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT & set HTTP-only cookie
    const token = generateTokenAndSetCookie(res, user._id);

    const preferredLang = user.preferences?.language || 'en';
    await ensureUserLocalizedName(user, preferredLang);
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: user.toSafeObject(preferredLang),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const lang = req.query.lang || req.query.language || req.user.preferences?.language || 'en';
    await ensureUserLocalizedName(req.user, lang);
    return res.status(200).json({
      success: true,
      user: req.user.toSafeObject(lang),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user & clear cookie
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
export const logoutUser = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};
