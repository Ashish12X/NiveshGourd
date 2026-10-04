// backend/src/services/ai/aiProvider.js
/**
 * AI Provider Configuration Layer
 *
 * Dedicated Google Gemini AI provider for NiveshGuard.
 * Uses official @google/genai SDK with configurable model and key.
 *
 * Configuration:
 *   GEMINI_API_KEY (primary) or GOOGLE_API_KEY / AI_API_KEY (backward-compatible)
 *   GEMINI_MODEL   (primary) or AI_MODEL (default: 'gemini-2.5-flash')
 *
 * SECURITY:
 *   - GEMINI_API_KEY is NEVER sent to frontend.
 *   - Key is masked in logs.
 *   - No OpenAI or third-party providers.
 */

import { GoogleGenAI } from '@google/genai';

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
};

let providerInstance = null;

/**
 * Resolves the Gemini API key from environment variables with safe fallbacks.
 */
export const getGeminiApiKey = () => {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.AI_API_KEY ||
    ''
  ).trim();
};

/**
 * Resolves the Gemini Model name from environment variables with sensible default.
 */
export const getGeminiModelName = () => {
  return (
    process.env.GEMINI_MODEL ||
    process.env.AI_MODEL ||
    'gemini-3.7-flash'
  ).trim();
};

/**
 * Checks if a valid-looking API key is configured.
 */
export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
  return Boolean(key && key !== 'your_gemini_api_key_here' && key !== 'your_api_key_here' && key.length > 5);
};

/**
 * Returns configured Gemini provider client.
 * Lazy-initialised once per process lifecycle.
 */
export const getAIProvider = () => {
  if (providerInstance) return providerInstance;

  const apiKey = getGeminiApiKey();

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'your_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY environment variable is required but not set. ' +
      'Please add GEMINI_API_KEY to backend/.env (never commit this file).'
    );
  }

  const model = getGeminiModelName();

  providerInstance = {
    type: AI_PROVIDERS.GEMINI,
    client: new GoogleGenAI({ apiKey }),
    model,
    apiKey,
  };

  return providerInstance;
};

/**
 * Resets the provider instance (useful for testing and configuration reload).
 */
export const resetAIProvider = () => {
  providerInstance = null;
};

/**
 * Returns a masked API key string for safe logging (never log full keys).
 */
export const getMaskedKey = () => {
  const key = getGeminiApiKey();
  if (!key) return '(not set)';
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};
