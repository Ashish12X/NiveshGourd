// backend/src/routes/aiRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  chat,
  listConversations,
  getConversation,
  createConversation,
  deleteConversation,
  getHealth,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public health check and diagnostics (Safe - returns no keys or user data)
router.get('/health', getHealth);

// AI-specific rate limiter — configurable via env vars
// Defaults to 20 requests per 15 minutes per authenticated user
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AI_REQUESTS_PER_15_MIN || '20', 10),
  keyGenerator: (req) => req.user?._id?.toString() || req.ip, // Rate limit per user, not per IP
  message: {
    success: false,
    message: 'You have sent too many requests. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limit for development if explicitly disabled
  skip: () => process.env.NODE_ENV === 'development' && process.env.DISABLE_AI_RATE_LIMIT === 'true',
});

// All subsequent AI routes require authentication
router.use(protect);

// Chat endpoint — rate limited
router.post('/chat', aiRateLimiter, chat);

// Conversation management — lighter rate limiting not needed, but still protected
router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId', getConversation);
router.delete('/conversations/:conversationId', deleteConversation);

export default router;
