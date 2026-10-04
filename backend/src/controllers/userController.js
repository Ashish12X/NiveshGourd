// backend/src/controllers/userController.js
import User from '../models/User.js';
import { ensureUserLocalizedName, normalizeLanguageCode } from '../services/ai/transliterationService.js';

// All 12 supported Indian languages + display labels
const ALLOWED_LANGUAGES = [
  'en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as',
  'English',
  'English (Indian Context)',
  'Hindi', 'हिन्दी', 'Hindi (हिन्दी)',
  'Bengali', 'বাংলা', 'Bengali (বাংলা)',
  'Marathi', 'मराठी', 'Marathi (मराठी)',
  'Telugu', 'తెలుగు', 'Telugu (తెలుగు)',
  'Tamil', 'தமிழ்', 'Tamil (தமிழ்)',
  'Gujarati', 'ગુજરાતી', 'Gujarati (ગુજરાતી)',
  'Kannada', 'ಕನ್ನಡ', 'Kannada (ಕನ್ನಡ)',
  'Malayalam', 'മലയാളം', 'Malayalam (മലയാളം)',
  'Punjabi', 'ਪੰਜਾਬੀ', 'Punjabi (ਪੰਜਾਬੀ)',
  'Odia', 'ଓଡ଼ିଆ', 'Odia (ଓଡ଼ିଆ)',
  'Assamese', 'অসমীয়া', 'Assamese (অসমীয়া)',
  'Hinglish',
];

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const requestedLang = req.query.lang || req.query.language || user.preferences?.language || 'en';
    // Ensure transliterated name is cached for requested language
    await ensureUserLocalizedName(user, requestedLang);

    return res.status(200).json({
      success: true,
      user: user.toSafeObject(requestedLang),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile & preferences
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Explicitly allow only permissible fields to prevent mass assignment
    const { name, preferences } = req.body;

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
      // Reset localizedNames cache when canonical name changes
      user.localizedNames = new Map();
      user.localizedNames.set('en', user.name);
    }

    let activeLang = user.preferences?.language || 'en';

    if (preferences && typeof preferences === 'object') {
      if (preferences.language && typeof preferences.language === 'string') {
        user.preferences.language = preferences.language;
        activeLang = preferences.language;
      }

      if (preferences.responseStyle && typeof preferences.responseStyle === 'string') {
        user.preferences.responseStyle = preferences.responseStyle;
      }

      if (preferences.textSize && typeof preferences.textSize === 'string') {
        user.preferences.textSize = preferences.textSize;
      }

      if (preferences.voicePrompt !== undefined) {
        user.preferences.voicePrompt = preferences.voicePrompt;
        user.preferences.voiceEnabled = preferences.voicePrompt === 'On';
      }

      if (preferences.voiceEnabled !== undefined) {
        user.preferences.voiceEnabled = Boolean(preferences.voiceEnabled);
        user.preferences.voicePrompt = preferences.voiceEnabled ? 'On' : 'Off';
      }

      if (preferences.highContrast !== undefined) {
        user.preferences.highContrast = Boolean(preferences.highContrast);
      }
    }

    // Ensure transliteration exists for the active language
    await ensureUserLocalizedName(user, activeLang);

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser.toSafeObject(activeLang),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Transliterate user name on language switch
 * @route   POST /api/users/transliterate-name
 * @access  Private
 */
export const transliterateUserName = async (req, res, next) => {
  try {
    const { language } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const targetLang = language || user.preferences?.language || 'en';
    const localizedName = await ensureUserLocalizedName(user, targetLang);

    return res.status(200).json({
      success: true,
      canonicalName: user.name,
      displayName: localizedName,
      language: targetLang,
      localizedNames: user.localizedNames instanceof Map
        ? Object.fromEntries(user.localizedNames)
        : (user.localizedNames || {}),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
