// backend/src/controllers/assessmentController.js
import {
  getAssessmentForUser,
  submitAssessmentAttempt,
  getLatestAttemptForUser,
} from '../services/assessmentService.js';

/**
 * @desc    Get assessment questions & metadata (sanitized, no answer keys)
 * @route   GET /api/assessment
 * @access  Private
 */
export const getAssessment = async (req, res, next) => {
  try {
    const assessment = await getAssessmentForUser();
    return res.status(200).json({
      success: true,
      assessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit completed assessment answers and compute understanding profile
 * @route   POST /api/assessment/submit
 * @access  Private
 */
export const submitAssessment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await submitAssessmentAttempt(userId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Assessment completed and understanding profile calibrated.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's latest completed assessment summary
 * @route   GET /api/assessment/latest
 * @access  Private
 */
export const getLatestAssessment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const latestAttempt = await getLatestAttemptForUser(userId);

    if (!latestAttempt) {
      return res.status(200).json({
        success: true,
        completed: false,
        message: 'No completed assessment found.',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      completed: true,
      data: latestAttempt,
    });
  } catch (error) {
    next(error);
  }
};
