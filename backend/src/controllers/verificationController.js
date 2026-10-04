// backend/src/controllers/verificationController.js
/**
 * Verification Controller
 *
 * Handles HTTP request/response for Stage 5 verification API.
 * All operations enforce authentication (via authMiddleware.protect).
 * Ownership checks are performed in verificationService.
 *
 * Routes handled:
 *   POST   /api/verification/analyze       — Run a new verification analysis
 *   GET    /api/verification/history       — Get user's verification history
 *   GET    /api/verification/:id           — Get a specific analysis
 *   DELETE /api/verification/:id           — Delete an analysis
 *
 * Security:
 *   - Input length and type validated before service calls
 *   - Image MIME type validated (allow-list)
 *   - No raw credentials stored
 *   - Errors sanitised before response
 */

import {
  analyseVerification,
  getUserVerificationHistory,
  getVerificationById,
  deleteVerification,
} from '../services/verification/verificationService.js';

// Allowed image MIME types (strict allow-list)
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

// Input length limits
const MAX_TEXT_CHARS = 5000;
const MAX_URL_CHARS = 2048;
const MAX_IMAGE_TEXT_CHARS = 5000;

/**
 * POST /api/verification/analyze
 */
export const analyze = async (req, res) => {
  try {
    const { inputType, text, url, imageFile, extractedImageText } = req.body;

    // ── Validate inputType ────────────────────────────────────────────────
    const allowedInputTypes = ['TEXT', 'IMAGE', 'URL'];
    if (!inputType || !allowedInputTypes.includes(inputType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid inputType. Must be one of: ${allowedInputTypes.join(', ')}.`,
      });
    }

    // ── Type-specific validation ──────────────────────────────────────────
    if (inputType === 'TEXT') {
      if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Text input is required and must be at least 10 characters.',
        });
      }
      if (text.length > MAX_TEXT_CHARS) {
        return res.status(400).json({
          success: false,
          message: `Text input must not exceed ${MAX_TEXT_CHARS} characters.`,
        });
      }
    }

    if (inputType === 'URL') {
      if (!url || typeof url !== 'string' || url.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'URL input is required.',
        });
      }
      if (url.length > MAX_URL_CHARS) {
        return res.status(400).json({
          success: false,
          message: `URL must not exceed ${MAX_URL_CHARS} characters.`,
        });
      }
    }

    if (inputType === 'IMAGE') {
      // Validate imageFile metadata if provided
      if (imageFile) {
        if (imageFile.mimeType && !ALLOWED_IMAGE_MIMES.has(imageFile.mimeType.toLowerCase())) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid image type. Allowed types: JPEG, PNG, WebP, GIF, BMP. ' +
              'Executable files are not accepted.',
          });
        }
        if (imageFile.sizeBytes && imageFile.sizeBytes > 20 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: 'Image file size must not exceed 20MB.',
          });
        }
      }
      // Validate extracted image text if provided
      if (extractedImageText && extractedImageText.length > MAX_IMAGE_TEXT_CHARS) {
        return res.status(400).json({
          success: false,
          message: `Extracted image text must not exceed ${MAX_IMAGE_TEXT_CHARS} characters.`,
        });
      }
    }

    // ── Run verification pipeline ─────────────────────────────────────────
    const result = await analyseVerification({
      user: req.user,
      inputType,
      text,
      url,
      imageFile,
      extractedImageText,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });

  } catch (err) {
    // Sanitised error responses
    if (err.message === 'INVALID_URL') {
      return res.status(400).json({ success: false, message: 'The provided URL is invalid or not supported.' });
    }
    if (err.message === 'NO_EXTRACTABLE_TEXT') {
      return res.status(400).json({
        success: false,
        message:
          'No text could be extracted from your input. ' +
          'For images, please also paste the message text in the "Extracted text" field.',
      });
    }
    if (err.message === 'PDF_NOT_SUPPORTED') {
      return res.status(400).json({
        success: false,
        message: 'PDF analysis is not yet supported. Please copy and paste the PDF text.',
      });
    }

    console.error('[verificationController] analyze error:', {
      message: err.message,
      userId: req.user?._id?.toString(),
    });

    return res.status(500).json({
      success: false,
      message: 'Verification analysis could not be completed. Please try again.',
    });
  }
};

/**
 * GET /api/verification/history
 */
export const getHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const result = await getUserVerificationHistory(req.user._id, page, limit);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[verificationController] getHistory error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve verification history.',
    });
  }
};

/**
 * GET /api/verification/:id
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid verification ID.' });
    }

    const doc = await getVerificationById(id, req.user._id);

    if (!doc) {
      // Return 404 regardless of whether it exists or belongs to another user
      // This prevents user enumeration attacks
      return res.status(404).json({
        success: false,
        message: 'Verification analysis not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    console.error('[verificationController] getById error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve verification analysis.',
    });
  }
};

/**
 * DELETE /api/verification/:id
 */
export const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid verification ID.' });
    }

    const deleted = await deleteVerification(id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Verification analysis not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification analysis deleted.',
    });
  } catch (err) {
    console.error('[verificationController] deleteById error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete verification analysis.',
    });
  }
};
