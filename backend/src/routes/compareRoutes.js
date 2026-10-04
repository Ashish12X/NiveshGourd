// backend/src/routes/compareRoutes.js
/**
 * Compare Routes — Stage 7
 *
 * All routes require authentication via protect middleware.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCompareCatalog,
  createComparison,
  getHistory,
  getSessionById,
} from '../controllers/compareController.js';

const router = express.Router();

router.use(protect);

router.get('/catalog', getCompareCatalog);
router.post('/', createComparison);
router.get('/history', getHistory);
router.get('/:id', getSessionById);

export default router;
