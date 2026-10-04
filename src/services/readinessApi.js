// src/services/readinessApi.js
/**
 * Frontend Decision Readiness API Service — Stage 7
 *
 * Connects frontend decision readiness checklists with the backend Stage 7 engine.
 */

import api, { getErrorMessage } from '../lib/api';

/**
 * Fetch default 10-item checklist template.
 */
export const fetchReadinessTemplate = async () => {
  try {
    const res = await api.get('/decision-readiness/template');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load decision readiness template.'));
  }
};

/**
 * Submit or evaluate a completed decision readiness checklist.
 *
 * @param {object} payload
 * @param {string} [payload.productName]
 * @param {Array<{ id: string, answer: 'YES'|'NO'|'NOT_SURE', notes?: string }>} payload.checklist
 */
export const submitReadinessSession = async (payload) => {
  try {
    const res = await api.post('/decision-readiness', payload);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to evaluate decision readiness.'));
  }
};

/**
 * Fetch user's latest saved decision readiness session.
 */
export const fetchLatestReadinessSession = async () => {
  try {
    const res = await api.get('/decision-readiness/latest');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to retrieve latest readiness check.'));
  }
};

/**
 * Fetch a specific decision readiness session by ID.
 *
 * @param {string} id
 */
export const fetchReadinessSessionById = async (id) => {
  try {
    const res = await api.get(`/decision-readiness/${id}`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load readiness session.'));
  }
};

/**
 * Update an existing decision readiness session.
 *
 * @param {string} id
 * @param {object} payload
 */
export const updateReadinessSession = async (id, payload) => {
  try {
    const res = await api.put(`/decision-readiness/${id}`, payload);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update readiness check.'));
  }
};

/**
 * Fetch user's decision readiness history.
 */
export const fetchReadinessHistory = async () => {
  try {
    const res = await api.get('/decision-readiness/history');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load readiness history.'));
  }
};
