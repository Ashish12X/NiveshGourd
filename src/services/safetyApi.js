// src/services/safetyApi.js
/**
 * Frontend Safety API Service — Stage 8
 * 
 * Provides typed, clean methods for:
 * - Evidence Vault: /api/safety/evidence
 * - Safety Receipts: /api/safety/receipts
 * - Incidents: /api/safety/incidents
 * - Safety Hub: /api/safety/overview
 */

import api, { getErrorMessage } from '../lib/api';

// ==========================================
// Safety Hub Overview
// ==========================================
export const fetchSafetyHubOverview = async () => {
  try {
    const res = await api.get('/safety/overview');
    return res.data.overview;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load safety overview.'));
  }
};

// ==========================================
// Evidence Vault
// ==========================================
export const fetchEvidenceItems = async (category = 'All', search = '', page = 1, limit = 50) => {
  try {
    const params = { page, limit };
    if (category && category !== 'All') params.category = category;
    if (search && search.trim()) params.search = search.trim();

    const res = await api.get('/safety/evidence', { params });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load evidence items.'));
  }
};

export const createEvidenceItem = async (evidenceData) => {
  try {
    const res = await api.post('/safety/evidence', evidenceData);
    return res.data.item;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to save evidence item.'));
  }
};

export const deleteEvidenceItem = async (id) => {
  try {
    const res = await api.delete(`/safety/evidence/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete evidence item.'));
  }
};

// ==========================================
// Safety Receipts
// ==========================================
export const fetchSafetyReceipts = async (page = 1, limit = 50) => {
  try {
    const res = await api.get('/safety/receipts', { params: { page, limit } });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load safety receipts.'));
  }
};

export const createSafetyReceipt = async ({ analysisId, situationNote }) => {
  try {
    const res = await api.post('/safety/receipts', { analysisId, situationNote });
    return res.data.receipt;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to generate safety receipt.'));
  }
};

export const fetchSafetyReceiptById = async (id) => {
  try {
    const res = await api.get(`/safety/receipts/${id}`);
    return res.data.receipt;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load safety receipt details.'));
  }
};

// ==========================================
// Incidents
// ==========================================
export const fetchIncidents = async (page = 1, limit = 50) => {
  try {
    const res = await api.get('/safety/incidents', { params: { page, limit } });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load incidents.'));
  }
};

export const createIncidentReport = async ({ category, title, details, evidenceIds, verificationIds }) => {
  try {
    const res = await api.post('/safety/incidents', {
      category,
      title,
      details,
      evidenceIds,
      verificationIds,
    });
    return res.data.incident;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to record incident report.'));
  }
};

export const fetchIncidentById = async (id) => {
  try {
    const res = await api.get(`/safety/incidents/${id}`);
    return res.data.incident;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load incident details.'));
  }
};

export const updateIncidentStatus = async (id, status) => {
  try {
    const res = await api.patch(`/safety/incidents/${id}/status`, { status });
    return res.data.incident;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to update incident status.'));
  }
};
