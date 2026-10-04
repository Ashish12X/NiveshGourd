// backend/src/routes/decisionReadinessRoutes.js
/**
 * Decision Readiness Routes — Stage 7
 *
 * All routes require authentication via protect middleware.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getTemplate,
  createSession,
  getLatest,
  getHistory,
  getById,
  updateById,
} from '../controllers/decisionReadinessController.js';

const router = express.Router();

router.use(protect);

router.get('/template', getTemplate);
router.post('/', createSession);
router.get('/latest', getLatest);
router.get('/history', getHistory);
router.get('/:id', getById);
router.put('/:id', updateById);

export default router;
