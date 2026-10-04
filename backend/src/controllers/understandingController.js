// backend/src/controllers/understandingController.js
import { getUnderstandingProfileForUser } from '../services/assessmentService.js';

/**
 * @desc    Get current UnderstandingProfile for authenticated user
 * @route   GET /api/understanding-profile
 * @access  Private
 */
export const getUnderstandingProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profile = await getUnderstandingProfileForUser(userId);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
