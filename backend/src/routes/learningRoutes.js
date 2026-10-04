// backend/src/routes/learningRoutes.js
/**
 * Learning Routes — Stage 6
 *
 * All routes require authentication via protect middleware.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getDashboard,
  getTopic,
  startTopicHandler,
  interactionHandler,
  completeTopicHandler,
  askAITutorHandler,
} from '../controllers/learningController.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/topics/:topicId', getTopic);
router.post('/:topicId/start', startTopicHandler);
router.post('/:topicId/interaction', interactionHandler);
router.post('/:topicId/complete', completeTopicHandler);
router.post('/:topicId/ask', askAITutorHandler);

export default router;
