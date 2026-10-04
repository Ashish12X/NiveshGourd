// src/services/aiApi.js
/**
 * Frontend AI API service
 *
 * All AI calls go through the backend.
 * AI_API_KEY is NEVER exposed to the browser.
 */

import api, { getErrorMessage } from '../lib/api';

/**
 * Send a message to the adaptive AI engine.
 *
 * @param {object} params
 * @param {string} params.message
 * @param {string|null} params.conversationId
 * @param {string|null} params.uiMode - 'Explain' | 'Verify' | 'Guide'
 * @param {string|null} params.language - 'en' | 'hi' | 'bn' | etc.
 * @returns {Promise<{conversationId, message, metadata, isFallback}>}
 */
export const sendMessage = async ({ message, conversationId, uiMode, language }) => {
  try {
    const res = await api.post('/ai/chat', {
      message,
      conversationId: conversationId || null,
      uiMode: uiMode || null,
      language: language || null,
    });
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'NiveshGuard couldn\'t complete that response right now. Please try again.'));
  }
};

/**
 * List user's conversations
 */
export const listConversations = async () => {
  try {
    const res = await api.get('/ai/conversations');
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load conversations.'));
  }
};

/**
 * Get a specific conversation with all messages
 */
export const getConversation = async (conversationId) => {
  try {
    const res = await api.get(`/ai/conversations/${conversationId}`);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load conversation.'));
  }
};

/**
 * Create a new empty conversation
 */
export const createConversation = async (title) => {
  try {
    const res = await api.post('/ai/conversations', { title });
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to create conversation.'));
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId) => {
  try {
    await api.delete(`/ai/conversations/${conversationId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete conversation.'));
  }
};
