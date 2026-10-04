// backend/src/services/ai/llmService.js
/**
 * LLM Service
 *
 * Handles the actual call to the Google Gemini AI provider.
 * All prompts are assembled externally (by adaptiveEngine.js / responseStrategy.js).
 * This module handles transport, output validation, error normalisation,
 * and safe diagnostics.
 *
 * SECURITY:
 *   - GEMINI_API_KEY is accessed only server-side, never forwarded to frontend.
 *   - Internal errors are normalised before propagation.
 *   - Response safety guardrails are strictly validated.
 */

import { getAIProvider, isGeminiConfigured, getGeminiModelName } from './aiProvider.js';

// Configurable limits
const MAX_OUTPUT_TOKENS = 1024;
const TIMEOUT_MS = 45000; // 45 second limit for Indian multilingual network paths
const MAX_RETRIES = 3;    // Retry transient 503/overloaded errors
const RETRY_DELAY_MS = 2000; // Initial retry delay (2s, 4s, 6s)

/**
 * Custom error class for structured error handling in controllers and engines.
 */
export class AIServiceError extends Error {
  constructor(message, code = 'PROVIDER_ERROR', userMessage = null) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.userMessage = userMessage || 'AI service is temporarily unavailable. Please try again.';
  }
}

/**
 * Calls the configured Gemini AI provider with the supplied prompt and messages.
 *
 * @param {string} systemPrompt - System instructions for the AI
 * @param {Array<{role:string, content:string}>} conversationHistory - Recent turns
 * @param {string} userMessage - Current user message
 * @returns {Promise<{text: string, raw: object}>}
 */
export const callLLM = async (systemPrompt, conversationHistory = [], userMessage) => {
  const provider = getAIProvider();
  return await callGemini(provider, systemPrompt, conversationHistory, userMessage);
};

/**
 * Gemini-specific call implementation using official @google/genai SDK
 * Includes exponential backoff retry for transient 503/overloaded errors.
 */
async function callGemini(provider, systemPrompt, conversationHistory = [], userMessage) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1.2s, 2.4s
      const delay = RETRY_DELAY_MS * attempt;
      console.warn(`[llmService] Retrying Gemini call (attempt ${attempt}/${MAX_RETRIES}) after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      return await callGeminiOnce(provider, systemPrompt, conversationHistory, userMessage);
    } catch (err) {
      lastError = err;
      // Only retry transient errors (SERVICE_UNAVAILABLE, network issues)
      const isTransient = (
        err.code === 'SERVICE_UNAVAILABLE' ||
        err.code === 'NETWORK_ERROR' ||
        err.code === 'PROVIDER_TIMEOUT'
      );
      if (!isTransient || attempt >= MAX_RETRIES) {
        throw err; // Non-retryable or exhausted retries
      }
    }
  }

  throw lastError;
}

/**
 * Single Gemini attempt (no retry).
 */
async function callGeminiOnce(provider, systemPrompt, conversationHistory = [], userMessage) {
  const { client, model } = provider;

  // Build Gemini contents array from conversation history
  const contents = [];

  // Include recent conversation history
  for (const turn of conversationHistory) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    });
  }

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // Call official @google/genai SDK models.generateContent
  const responsePromise = client.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,       // Factual, consistent responses
      topP: 0.85,
      candidateCount: 1,
    },
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), TIMEOUT_MS)
  );

  let response;
  try {
    response = await Promise.race([responsePromise, timeoutPromise]);
  } catch (err) {
    if (err.message === 'AI_TIMEOUT') {
      throw new AIServiceError('AI response timed out.', 'PROVIDER_TIMEOUT', 'AI response timed out. Please try again.');
    }
    throw normaliseProviderError(err);
  }

  // Extract text from Gemini response safely
  // Note: in @google/genai, response.text is a getter property, NOT a function.
  let text = '';
  if (typeof response?.text === 'function') {
    text = response.text() || '';
  } else if (typeof response?.text === 'string' && response.text.trim()) {
    text = response.text || '';
  } else if (Array.isArray(response?.candidates?.[0]?.content?.parts)) {
    text = response.candidates[0].content.parts
      .map((p) => p.text || '')
      .filter(Boolean)
      .join('\n');
  }

  text = text.trim();

  if (!text || text.length < 2) {
    // Check if safety filter blocked it
    const finishReason = response?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new AIServiceError(
        'AI response blocked by safety filter.',
        'SAFETY_BLOCK',
        'This query could not be completed due to safety guidelines.'
      );
    }
    throw new AIServiceError('AI returned an empty response.', 'EMPTY_RESPONSE', 'AI service is temporarily unavailable. Please try again.');
  }

  if (text.length > 8000) {
    return { text: text.slice(0, 8000) + '\n\n[Response truncated for length.]', raw: response };
  }

  return { text, raw: response };
}

/**
 * Normalise provider-specific errors into a consistent AIServiceError.
 */
export function normaliseProviderError(err) {
  const msg = (err.message || '').toString();
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('api_key_missing') || lowerMsg.includes('api key not set')) {
    return new AIServiceError('Gemini API key is not configured.', 'API_KEY_MISSING', 'AI service is temporarily unavailable. Please check system configuration.');
  }

  if (
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('401') ||
    lowerMsg.includes('403') ||
    lowerMsg.includes('auth') ||
    lowerMsg.includes('unauthenticated') ||
    lowerMsg.includes('permission_denied')
  ) {
    return new AIServiceError('Gemini authentication failed.', 'AUTH_FAILED', 'AI service is temporarily unavailable. Please try again later.');
  }

  if (
    lowerMsg.includes('not found') ||
    lowerMsg.includes('model_unavailable') ||
    lowerMsg.includes('models/') ||
    lowerMsg.includes('404')
  ) {
    return new AIServiceError('Configured Gemini model is unavailable.', 'MODEL_UNAVAILABLE', 'AI model is temporarily unavailable. Please try again.');
  }

  if (
    lowerMsg.includes('429') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('rate') ||
    lowerMsg.includes('resource_exhausted')
  ) {
    return new AIServiceError('Gemini rate limit exceeded.', 'RATE_LIMITED', 'AI service is receiving high traffic. Please try again shortly.');
  }

  if (
    lowerMsg.includes('safety') ||
    lowerMsg.includes('blocked') ||
    lowerMsg.includes('harm')
  ) {
    return new AIServiceError('AI response was blocked by safety policy.', 'SAFETY_BLOCK', 'This query could not be completed due to safety guidelines.');
  }

  if (
    lowerMsg.includes('500') ||
    lowerMsg.includes('502') ||
    lowerMsg.includes('503') ||
    lowerMsg.includes('504') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('overloaded')
  ) {
    return new AIServiceError('Gemini service is temporarily unavailable.', 'SERVICE_UNAVAILABLE', 'AI service is temporarily unavailable. Please try again.');
  }

  if (
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('enotfound') ||
    lowerMsg.includes('network') ||
    lowerMsg.includes('fetch failed')
  ) {
    return new AIServiceError('Network connection to Gemini failed.', 'NETWORK_ERROR', 'Unable to reach AI service. Please check network connection.');
  }

  return new AIServiceError(`Gemini error: ${msg.slice(0, 150)}`, 'PROVIDER_ERROR', 'AI service encountered an unexpected error. Please try again.');
}

/**
 * Validates that an AI text response is safe to return.
 * Returns { valid: boolean, reason?: string }
 */
export const validateAIResponse = (text) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'empty' };
  }

  const trimmed = text.trim();

  if (trimmed.length < 5) {
    return { valid: false, reason: 'too_short' };
  }

  // Guard: Promising guaranteed returns is strictly forbidden
  const guaranteePatterns = [
    /\b(promise|assure|promising|assuring)\s+(a\s+)?guaranteed\s+(return|profit|income)\b/i,
    /(?<!\b(no|not|cannot|can't|never|neither|without|beware\s+of|caution\s+against|red\s+flag(\s+for|\s+is)?)\s+)\b(get|earn|make|provide|offer)\s+guaranteed\s+(returns?|profits?|income)\b/i,
  ];

  for (const pattern of guaranteePatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'forbidden_guaranteed_returns' };
    }
  }

  // If the AI explicitly declined or refused to advise (which adheres to NiveshGuard guardrails),
  // it is safe and must NOT be rejected for mentioning stock/buy/sell terms in its disclaimer.
  const isExplicitRefusal = /\b(cannot|can't|do\s+not|don't|will\s+not|won't)\s+(provide|recommend|give|advise|suggest|predict|make)\b/i.test(trimmed);

  if (!isExplicitRefusal) {
    const affirmativeAdvicePatterns = [
      /\b(you\s+should|i\s+(recommend|suggest|advise)|we\s+(recommend|suggest|advise)|go\s+ahead\s+and)\s+(buy|buying|sell|selling|purchase|purchasing|invest|investing)\b/i,
      /\b(buy|buying|sell|selling|purchase|purchasing)\s+(this|that|it|now|immediately|today)?\s*(stock|share|crypto|token|fund|coin)\b/i,
      /\b(invest|investing)\s+(your\s+money\s+in\s+this)\b/i,
    ];

    for (const pattern of affirmativeAdvicePatterns) {
      if (pattern.test(trimmed)) {
        return { valid: false, reason: 'forbidden_investment_advice' };
      }
    }
  }

  return { valid: true };
};

/**
 * Health check diagnostic function for backend GET /api/ai/health
 * Safe: never returns API keys or internal secrets.
 */
export const checkGeminiHealth = async () => {
  const model = getGeminiModelName();
  const configured = isGeminiConfigured();

  if (!configured) {
    return {
      provider: 'gemini',
      configured: false,
      model,
      reachable: false,
      status: 'API_KEY_MISSING',
      message: 'GEMINI_API_KEY is not configured on the server.',
    };
  }

  try {
    const provider = getAIProvider();
    // Perform a lightweight probe ping (1 token prompt)
    const probe = await Promise.race([
      provider.client.models.generateContent({
        model: provider.model,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        config: { maxOutputTokens: 5, temperature: 0.1 },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 15000)
      ),
    ]);

    const hasResponse = Boolean(probe?.text || probe?.candidates?.[0]);

    return {
      provider: 'gemini',
      configured: true,
      model: provider.model,
      reachable: hasResponse,
      status: hasResponse ? 'HEALTHY' : 'MALFORMED_RESPONSE',
    };
  } catch (err) {
    const normalised = normaliseProviderError(err);
    return {
      provider: 'gemini',
      configured: true,
      model,
      reachable: false,
      status: normalised.code,
      message: normalised.message,
    };
  }
};
