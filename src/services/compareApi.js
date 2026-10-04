// src/services/compareApi.js
/**
 * Frontend Compare API Service — Stage 7
 *
 * Connects frontend comparison views with the backend Stage 7 comparison engine.
 */

import api, { getErrorMessage } from '../lib/api';

/**
 * Fetch available products catalog and comparison criteria.
 */
export const fetchCompareCatalog = async () => {
  try {
    const res = await api.get('/compare/catalog');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load comparison catalog.'));
  }
};

/**
 * Perform a factual side-by-side comparison between two products.
 *
 * @param {object} payload
 * @param {string} payload.productAId
 * @param {string} payload.productBId
 * @param {string[]} [payload.criteria]
 */
export const submitComparison = async (payload) => {
  try {
    const res = await api.post('/compare', payload);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to perform comparison.'));
  }
};

/**
 * Fetch a specific saved comparison session by ID.
 *
 * @param {string} id
 */
export const fetchComparisonSession = async (id) => {
  try {
    const res = await api.get(`/compare/${id}`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load comparison session.'));
  }
};

/**
 * Fetch user's comparison history.
 */
export const fetchComparisonHistory = async () => {
  try {
    const res = await api.get('/compare/history');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load comparison history.'));
  }
};
