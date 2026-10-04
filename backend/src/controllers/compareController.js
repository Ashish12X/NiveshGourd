// backend/src/controllers/compareController.js
/**
 * Comparison Controller — Stage 7
 *
 * Exposes endpoints for:
 *   - GET  /api/compare/catalog  (Products & Criteria)
 *   - POST /api/compare          (Execute comparison & adapt explanation)
 *   - GET  /api/compare/history  (List user's past comparisons)
 *   - GET  /api/compare/:id      (Retrieve specific comparison session)
 *
 * SECURITY:
 *   - All mutating/user-specific endpoints enforce authentication via protect middleware
 *   - Ownership isolation strictly enforced (returns 404 for unauthorized access)
 */

import {
  getCatalog,
  performComparison,
  getComparisonSession,
  getComparisonHistory,
} from '../services/compare/compareService.js';

/**
 * @desc    Get comparison catalog (products and criteria)
 * @route   GET /api/compare/catalog
 * @access  Private
 */
export const getCompareCatalog = async (req, res, next) => {
  try {
    const catalog = getCatalog();
    return res.status(200).json({
      success: true,
      data: catalog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Perform factual side-by-side comparison
 * @route   POST /api/compare
 * @access  Private
 */
export const createComparison = async (req, res, next) => {
  try {
    const { productAId, productBId, criteria } = req.body;
    const userId = req.user._id;

    if (!productAId || !productBId) {
      return res.status(400).json({
        success: false,
        message: 'Both productAId and productBId are required.',
      });
    }

    const result = await performComparison({
      userId,
      productAId,
      productBId,
      criteria,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to perform comparison.',
    });
  }
};

/**
 * @desc    Get past comparison history
 * @route   GET /api/compare/history
 * @access  Private
 */
export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const history = await getComparisonHistory(userId);
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific comparison session by ID
 * @route   GET /api/compare/:id
 * @access  Private
 */
export const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await getComparisonSession(id, userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Comparison session not found or does not belong to you.',
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
