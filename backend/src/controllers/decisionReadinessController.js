// backend/src/controllers/decisionReadinessController.js
/**
 * Decision Readiness Controller — Stage 7
 *
 * Exposes endpoints for:
 *   - GET  /api/decision-readiness/template  (Default checklist template)
 *   - POST /api/decision-readiness           (Submit/evaluate checklist)
 *   - GET  /api/decision-readiness/latest     (Get user's latest readiness check)
 *   - GET  /api/decision-readiness/history    (List past sessions)
 *   - GET  /api/decision-readiness/:id        (Get session by ID)
 *   - PUT  /api/decision-readiness/:id        (Update session answers)
 *
 * SECURITY:
 *   - All endpoints enforce authentication via protect middleware
 *   - Cross-user access returns 404
 */

import {
  getChecklistTemplate,
  evaluateReadiness,
  getLatestSession,
  getSessionById,
  updateSession,
  getSessionHistory,
} from '../services/readiness/decisionReadinessService.js';

/**
 * @desc    Get checklist template
 * @route   GET /api/decision-readiness/template
 * @access  Private
 */
export const getTemplate = async (req, res, next) => {
  try {
    const data = getChecklistTemplate();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create/submit a decision readiness check
 * @route   POST /api/decision-readiness
 * @access  Private
 */
export const createSession = async (req, res, next) => {
  try {
    const { productName, checklist } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Checklist must be a non-empty array of items.',
      });
    }

    const result = await evaluateReadiness({
      userId,
      productName,
      checklist,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to process readiness check.',
    });
  }
};

/**
 * @desc    Get user's latest decision readiness session
 * @route   GET /api/decision-readiness/latest
 * @access  Private
 */
export const getLatest = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const session = await getLatestSession(userId);

    return res.status(200).json({
      success: true,
      data: session || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's past decision readiness sessions
 * @route   GET /api/decision-readiness/history
 * @access  Private
 */
export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const history = await getSessionHistory(userId);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get decision readiness session by ID
 * @route   GET /api/decision-readiness/:id
 * @access  Private
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await getSessionById(id, userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Decision readiness session not found or does not belong to you.',
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update decision readiness session by ID
 * @route   PUT /api/decision-readiness/:id
 * @access  Private
 */
export const updateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { checklist, productName } = req.body;

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Checklist must be a non-empty array of items.',
      });
    }

    const updated = await updateSession({
      sessionId: id,
      userId,
      checklist,
      productName,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Decision readiness session not found or does not belong to you.',
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to update readiness session.',
    });
  }
};
