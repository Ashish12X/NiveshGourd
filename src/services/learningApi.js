// src/services/learningApi.js
/**
 * Frontend Learning API Service — Stage 6
 *
 * Connects frontend learning pages with the backend Stage 6 engine.
 */

import api, { getErrorMessage } from '../lib/api';

/**
 * Fetch learning dashboard (recommended next topic, categorized lists).
 * @param {string} [signal] - Optional contextual risk signal (e.g. from Stage 5)
 */
export const fetchLearningDashboard = async (signal = null) => {
  try {
    const params = signal ? { signal } : {};
    const res = await api.get('/learning/dashboard', { params });
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load learning dashboard.'));
  }
};

/**
 * Fetch a specific learning topic with adaptive explanation.
 * @param {string} topicId
 */
export const fetchTopicDetails = async (topicId) => {
  try {
    const res = await api.get(`/learning/topics/${topicId}`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load topic details.'));
  }
};

/**
 * Start or resume a learning module.
 * @param {string} topicId
 */
export const startLearningTopic = async (topicId) => {
  try {
    const res = await api.post(`/learning/${topicId}/start`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to start module.'));
  }
};

/**
 * Record a learning interaction (comprehension answer, scenario attempt, confidence).
 * @param {string} topicId
 * @param {object} payload
 */
export const submitLearningInteraction = async (topicId, payload) => {
  try {
    const res = await api.post(`/learning/${topicId}/interaction`, payload);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to record interaction.'));
  }
};

/**
 * Complete a learning topic and receive the adaptive next recommendation.
 * @param {string} topicId
 */
export const completeLearningTopic = async (topicId) => {
  try {
    const res = await api.post(`/learning/${topicId}/complete`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to complete topic.'));
  }
};

/**
 * Ask the fact-locked AI tutor a question inside a topic.
 * @param {string} topicId
 * @param {string} question
 */
export const askAITutor = async (topicId, question) => {
  try {
    const res = await api.post(`/learning/${topicId}/ask`, { question });
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to get response from AI tutor.'));
  }
};
