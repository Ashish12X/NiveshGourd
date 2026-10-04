// src/services/assessmentApi.js
import api, { getErrorMessage } from '../lib/api';

/**
 * Fetch current sanitized assessment questions and metadata
 */
export const fetchAssessment = async () => {
  try {
    const res = await api.get('/assessment');
    return res.data.assessment;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load assessment questions.'));
  }
};

/**
 * Submit answers and compute understanding profile
 */
export const submitAssessmentAnswers = async (payload) => {
  try {
    const res = await api.post('/assessment/submit', payload);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to submit assessment.'));
  }
};

/**
 * Fetch user's latest completed assessment
 */
export const fetchLatestAssessment = async () => {
  try {
    const res = await api.get('/assessment/latest');
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to retrieve latest assessment.'));
  }
};

/**
 * Fetch user's current UnderstandingProfile
 */
export const fetchUnderstandingProfile = async () => {
  try {
    const res = await api.get('/understanding-profile');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to retrieve understanding profile.'));
  }
};
