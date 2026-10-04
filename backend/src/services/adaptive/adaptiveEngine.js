// backend/src/services/adaptive/adaptiveEngine.js
/**
 * Adaptive Engine — Orchestrator
 *
 * Coordinates the complete adaptive AI flow:
 *
 *   1. Detect intent
 *   2. Map to relevant topics
 *   3. Analyse safety sensitivity
 *   4. Build user context (profile + history)
 *   5. Build adaptation plan
 *   6. Build system prompt
 *   7. Call LLM
 *   8. Validate response
 *   9. Return structured result with adaptive metadata
 *
 * SECURITY:
 *   - The system prompt is NEVER returned to callers.
 *   - The AI API key never reaches this module (handled in llmService.js).
 *   - Chain-of-thought is not exposed.
 *   - Only safe adaptive metadata is returned.
 */

import { detectIntent, INTENTS } from './intentDetector.js';
import { mapToRelevantTopics } from './topicMapper.js';
import { analyseMessageSafety, safetyLevelSummary, SAFETY_LEVELS } from './safetyPolicy.js';
import { buildAdaptationPlan } from './adaptationPolicy.js';
import { buildUserContext } from './contextBuilder.js';
import { buildSystemPrompt } from './responseStrategy.js';
import { generateContextualBridges } from './bridgeGenerator.js';
import { callLLM, validateAIResponse, AIServiceError } from '../ai/llmService.js';

// Safe fallback response shown when AI fails
const SAFE_FALLBACK_RESPONSE =
  "NiveshGuard couldn't complete that response right now. This may be a temporary issue. " +
  "Please try again in a moment. For urgent investor safety concerns, you can visit " +
  "sebi.gov.in or call the SEBI helpline at 1800 22 7575.";

// Message length guard (characters) — prevent abuse
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Main entry point for the adaptive AI engine.
 *
 * @param {object} params
 * @param {object} params.user          - Authenticated User document
 * @param {string} params.message       - User's current message
 * @param {string|null} params.conversationId  - Existing conversation ID
 * @param {string|null} params.uiMode   - 'Explain' | 'Verify' | 'Guide' | null
 * @returns {Promise<AdaptiveEngineResult>}
 */
export const runAdaptiveEngine = async ({
  user,
  message,
  conversationId,
  uiMode,
  language,
}) => {
  // 0. Sanitise input
  const sanitisedMessage = sanitiseMessage(message);

  // 1. Intent detection
  const intentResult = detectIntent(sanitisedMessage, uiMode);
  const { intent, confidence: intentConfidence } = intentResult;

  // 2. Topic relevance mapping
  const relevantTopics = mapToRelevantTopics(sanitisedMessage, intent);

  // 3. Safety analysis
  const safetyResult = analyseMessageSafety(sanitisedMessage);
  const { safetyLevel } = safetyResult;

  // 4. Build user context (loads profile + conversation from DB)
  const userContext = await buildUserContext(user, conversationId, relevantTopics);

  // 5. Build adaptation plan (deterministic rules)
  const adaptationPlan = buildAdaptationPlan({
    intent,
    relevantTopics,
    understandingProfile: userContext.rawUnderstandingProfile,
    userPreferences: user.preferences,
    safetyLevel,
    intentConfidence,
    language: language || user?.preferences?.language || 'en',
  });

  // 6. Build system prompt (never returned to frontend)
  const systemPrompt = buildSystemPrompt({
    adaptationPlan,
    userContext,
    intent,
    relevantTopics,
    safetyLevel,
  });

  // 7. Call LLM
  let aiResponseText;
  try {
    const llmResult = await callLLM(
      systemPrompt,
      userContext.conversationHistory,
      sanitisedMessage
    );
    aiResponseText = llmResult.text;
  } catch (err) {
    // Log safely (no key/prompt in log)
    console.error('[adaptiveEngine] LLM call failed:', {
      code: err.code || 'UNKNOWN',
      message: err.message,
      userId: user._id.toString(),
    });

    return buildFallbackResult({
      message: sanitisedMessage,
      intent,
      relevantTopics,
      safetyLevel,
      safetyResult,
      adaptationPlan,
      errorCode: err.code || 'UNKNOWN',
    });
  }

  // 8. Validate AI response
  const validation = validateAIResponse(aiResponseText);
  if (!validation.valid) {
    console.warn('[adaptiveEngine] AI response validation failed:', validation.reason);
    return buildFallbackResult({
      message: sanitisedMessage,
      intent,
      relevantTopics,
      safetyLevel,
      safetyResult,
      adaptationPlan,
      errorCode: `VALIDATION_${(validation.reason || 'unknown').toUpperCase()}`,
    });
  }

  // 9. Generate contextual action bridges (Stage 7)
  const suggestedActions = generateContextualBridges({
    intent,
    relevantTopics,
    safetyLevel,
    message: sanitisedMessage,
    userContext,
  });

  // 10. Return structured result (safe metadata only — no system prompt, no chain-of-thought)
  return {
    success: true,
    response: aiResponseText,
    metadata: {
      intent,
      intentConfidence,
      relevantTopics,
      safetyLevel,
      safetyReasons: safetyResult.reasons,
      safetyLevelSummary: safetyLevelSummary(safetyLevel),
      adaptation: {
        depth: adaptationPlan.depth,
        jargon: adaptationPlan.jargon,
        format: adaptationPlan.format,
        safetyEmphasis: adaptationPlan.safetyEmphasis,
        uncertainty: adaptationPlan.uncertainty,
        language: adaptationPlan.language,
      },
      adaptationSummary: adaptationPlan.adaptationSummary,
      suggestedActions,
      bridges: suggestedActions,
    },
    isFallback: false,
  };
};

/**
 * Sanitises user message — trims, caps length, removes control characters.
 */
function sanitiseMessage(message) {
  if (!message || typeof message !== 'string') return '';
  // Remove control characters except newline and tab
  const cleaned = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Builds a safe fallback result when the AI fails.
 * The fallback DOES NOT expose any internal error details.
 */
function buildFallbackResult({
  message,
  intent,
  relevantTopics,
  safetyLevel,
  safetyResult,
  adaptationPlan,
  errorCode,
}) {
  // For safety-sensitive situations, return a more helpful fallback
  let fallbackText = SAFE_FALLBACK_RESPONSE;
  if (safetyLevel === SAFETY_LEVELS.INCIDENT) {
    fallbackText =
      "SANGYAN couldn't complete that response right now. " +
      "If you are facing an urgent financial safety issue, please call the Cyber Crime Helpline at 1930 " +
      "or visit cybercrime.gov.in. For SEBI-related complaints: sebi.gov.in/scores.";
  }

  return {
    success: false,
    response: fallbackText,
    metadata: {
      intent: intent || INTENTS.GENERAL,
      intentConfidence: 'low',
      relevantTopics: relevantTopics || [],
      safetyLevel: safetyLevel || SAFETY_LEVELS.NORMAL,
      safetyReasons: safetyResult?.reasons || [],
      safetyLevelSummary: safetyLevelSummary(safetyLevel || SAFETY_LEVELS.NORMAL),
      adaptation: {
        depth: adaptationPlan?.depth || 'standard',
        jargon: adaptationPlan?.jargon || 'moderate',
        format: adaptationPlan?.format || 'plain',
        safetyEmphasis: adaptationPlan?.safetyEmphasis || 'normal',
        uncertainty: 'explicit',
        language: adaptationPlan?.language || 'english',
      },
      adaptationSummary: adaptationPlan?.adaptationSummary || 'Using safe guidance.',
      suggestedActions: [
        {
          type: 'VALIDITY_CHECK',
          label: 'Verify with Validity Check',
          url: '/validity-check',
          description: 'Cross-check financial claims against authoritative regulatory sources.',
        },
        {
          type: 'DECISION_READINESS',
          label: 'Check Decision Readiness',
          url: '/decision-readiness',
          description: 'Assess if you have all critical information before proceeding.',
        },
      ],
      bridges: [
        {
          type: 'VALIDITY_CHECK',
          label: 'Verify with Validity Check',
          url: '/validity-check',
          description: 'Cross-check financial claims against authoritative regulatory sources.',
        },
        {
          type: 'DECISION_READINESS',
          label: 'Check Decision Readiness',
          url: '/decision-readiness',
          description: 'Assess if you have all critical information before proceeding.',
        },
      ],
    },
    isFallback: true,
    errorCode, // Safe internal code, NOT the raw provider error
  };
}
