// backend/src/controllers/safetyController.js
/**
 * SafetyController
 * 
 * Handles authenticated API endpoints for:
 * - Evidence Vault
 * - Safety Receipts
 * - Incidents
 * - Safety Hub overview
 */

import * as safetyService from '../services/safety/safetyService.js';

// ==========================================
// Evidence Endpoints
// ==========================================
export async function createEvidenceItem(req, res, next) {
  try {
    const userId = req.user._id;
    const { name, category, description, source, size, relatedAnalysisId, relatedIncidentId, metadata } = req.body;

    const item = await safetyService.createEvidence({
      userId,
      name,
      category,
      description,
      source,
      size,
      relatedAnalysisId,
      relatedIncidentId,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: 'Evidence item securely recorded in vault.',
      item,
    });
  } catch (err) {
    next(err);
  }
}

export async function listEvidenceItems(req, res, next) {
  try {
    const userId = req.user._id;
    const { category, search, page = 1, limit = 50 } = req.query;

    const result = await safetyService.listEvidence({
      userId,
      category,
      search,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEvidenceItem(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const item = await safetyService.getEvidenceById({ userId, evidenceId: id });
    res.status(200).json({
      success: true,
      item,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvidenceItem(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const result = await safetyService.deleteEvidence({ userId, evidenceId: id });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ==========================================
// Safety Receipt Endpoints
// ==========================================
export async function createReceipt(req, res, next) {
  try {
    const userId = req.user._id;
    const { analysisId, situationNote } = req.body;

    if (!analysisId) {
      return res.status(400).json({ error: 'analysisId is required to generate a safety receipt.' });
    }

    const receipt = await safetyService.createReceiptFromVerification({
      userId,
      analysisId,
      situationNote,
    });

    res.status(201).json({
      success: true,
      message: 'Safety receipt created successfully.',
      receipt,
    });
  } catch (err) {
    next(err);
  }
}

export async function listSafetyReceipts(req, res, next) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const result = await safetyService.listSafetyReceipts({
      userId,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSafetyReceipt(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const receipt = await safetyService.getSafetyReceiptById({ userId, receiptId: id });
    res.status(200).json({
      success: true,
      receipt,
    });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// Incident Endpoints
// ==========================================
export async function createIncident(req, res, next) {
  try {
    const userId = req.user._id;
    const { category, title, details, evidenceIds, verificationIds } = req.body;

    const incident = await safetyService.createIncident({
      userId,
      category,
      title,
      details,
      evidenceIds,
      verificationIds,
    });

    res.status(201).json({
      success: true,
      message: 'Incident documented safely. Official guidance generated.',
      incident,
    });
  } catch (err) {
    next(err);
  }
}

export async function listIncidents(req, res, next) {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const result = await safetyService.listIncidents({
      userId,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getIncident(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const incident = await safetyService.getIncidentById({ userId, incidentId: id });
    res.status(200).json({
      success: true,
      incident,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateIncidentStatus(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const incident = await safetyService.updateIncidentStatus({ userId, incidentId: id, status });
    res.status(200).json({
      success: true,
      incident,
    });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// Safety Hub Overview
// ==========================================
export async function getSafetyHubOverview(req, res, next) {
  try {
    const userId = req.user._id;
    const overview = await safetyService.getSafetyHubOverview({ userId });

    res.status(200).json({
      success: true,
      overview,
    });
  } catch (err) {
    next(err);
  }
}
