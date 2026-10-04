// backend/src/routes/verificationRoutes.js
/**
 * Verification Routes — Stage 5
 *
 * All routes require authentication.
 * Dedicated rate limiter for verification (more expensive than chat).
 *
 * Routes:
 *   POST   /api/verification/analyze       — Run new analysis
 *   GET    /api/verification/history       — User's history
 *   GET    /api/verification/:id           — Get specific analysis
 *   DELETE /api/verification/:id           — Delete analysis
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware.js';
import {
  analyze,
  getHistory,
  getById,
  deleteById,
} from '../controllers/verificationController.js';

const router = express.Router();

// Dedicated verification rate limiter (configurable via env)
// Default: 10 analyses per 15 minutes per user
const verificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.VERIFICATION_REQUESTS_PER_15_MIN || '10', 10),
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message:
      'You have performed too many verification analyses. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === 'development' &&
    process.env.DISABLE_AI_RATE_LIMIT === 'true',
});

// All verification routes require authentication
router.use(protect);

// Analyse endpoint — rate limited
router.post('/analyze', verificationRateLimiter, analyze);

// History and retrieval — no extra rate limit (auth already protects)
router.get('/history', getHistory);
router.get('/:id', getById);
router.delete('/:id', deleteById);

export default router;
