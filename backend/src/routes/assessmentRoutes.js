// backend/src/routes/assessmentRoutes.js
import express from 'express';
import {
  getAssessment,
  submitAssessment,
  getLatestAssessment,
} from '../controllers/assessmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All assessment routes are protected
router.get('/', protect, getAssessment);
router.post('/submit', protect, submitAssessment);
router.get('/latest', protect, getLatestAssessment);

export default router;
