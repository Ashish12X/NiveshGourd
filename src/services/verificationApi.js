// src/services/verificationApi.js
/**
 * Frontend Verification API Service — Stage 5
 *
 * All verification calls go through the backend.
 * This module provides a clean interface for the ValidityCheck pages.
 */

import api, { getErrorMessage } from '../lib/api';

/**
 * Submit a text, URL, or image for verification analysis.
 *
 * @param {object} params
 * @param {string}  params.inputType            - 'TEXT' | 'IMAGE' | 'URL'
 * @param {string}  [params.text]               - Text to verify
 * @param {string}  [params.url]                - URL to verify
 * @param {object}  [params.imageFile]          - { filename, mimeType, sizeBytes }
 * @param {string}  [params.extractedImageText] - Text extracted from image
 * @returns {Promise<object>} VerificationAnalysis document
 */
export const analyzeInput = async ({
  inputType,
  text,
  url,
  imageFile,
  extractedImageText,
}) => {
  try {
    const res = await api.post('/verification/analyze', {
      inputType,
      text: text || undefined,
      url: url || undefined,
      imageFile: imageFile || undefined,
      extractedImageText: extractedImageText || undefined,
    });
    return res.data.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        'Verification analysis could not be completed. Please try again.'
      )
    );
  }
};

/**
 * Get user's verification history (paginated).
 *
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{ items, total, page, pages }>}
 */
export const getVerificationHistory = async (page = 1, limit = 10) => {
  try {
    const res = await api.get('/verification/history', { params: { page, limit } });
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load verification history.'));
  }
};

/**
 * Get a specific verification analysis by ID.
 *
 * @param {string} id
 * @returns {Promise<object>} VerificationAnalysis document
 */
export const getVerificationById = async (id) => {
  try {
    const res = await api.get(`/verification/${id}`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load verification analysis.'));
  }
};

/**
 * Delete a verification analysis.
 *
 * @param {string} id
 */
export const deleteVerification = async (id) => {
  try {
    await api.delete(`/verification/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete verification analysis.'));
  }
};
