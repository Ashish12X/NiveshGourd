// backend/src/routes/understandingRoutes.js
import express from 'express';
import { getUnderstandingProfile } from '../controllers/understandingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getUnderstandingProfile);

export default router;
