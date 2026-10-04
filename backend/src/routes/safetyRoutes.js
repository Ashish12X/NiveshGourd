// backend/src/routes/safetyRoutes.js
/**
 * SafetyRoutes
 * 
 * Routes for:
 * - Evidence Vault: /api/safety/evidence
 * - Safety Receipts: /api/safety/receipts
 * - Incidents: /api/safety/incidents
 * - Safety Hub: /api/safety/overview
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as safetyController from '../controllers/safetyController.js';

const router = express.Router();

// All safety routes require authentication
router.use(protect);

// Safety Hub Overview
router.get('/overview', safetyController.getSafetyHubOverview);

// Evidence Vault
router.post('/evidence', safetyController.createEvidenceItem);
router.get('/evidence', safetyController.listEvidenceItems);
router.get('/evidence/:id', safetyController.getEvidenceItem);
router.delete('/evidence/:id', safetyController.deleteEvidenceItem);

// Safety Receipts
router.post('/receipts', safetyController.createReceipt);
router.get('/receipts', safetyController.listSafetyReceipts);
router.get('/receipts/:id', safetyController.getSafetyReceipt);

// Incidents
router.post('/incidents', safetyController.createIncident);
router.get('/incidents', safetyController.listIncidents);
router.get('/incidents/:id', safetyController.getIncident);
router.patch('/incidents/:id/status', safetyController.updateIncidentStatus);

export default router;
