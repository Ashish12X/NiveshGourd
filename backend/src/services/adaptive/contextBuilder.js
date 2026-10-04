// backend/src/services/adaptive/contextBuilder.js
/**
 * Context Builder
 *
 * Assembles a structured user context from:
 *   - Authenticated user record (name, preferences)
 *   - Current UnderstandingProfile
 *   - Current conversation history
 *
 * PRIVACY:
 *   Only the minimum required data is included.
 *   Passwords, JWTs, auth cookies, and internal IDs are NEVER passed
 *   to the AI provider.
 *
 *   We pass only:
 *     - First name (optional, for personalisation)
 *     - Relevant topic states (NOT the entire profile)
 *     - Response preferences (language, style — not UI-only ones like highContrast)
 *     - Relevant conversation history (capped)
 */

import UnderstandingProfile from '../../models/UnderstandingProfile.js';
import Conversation from '../../models/Conversation.js';

// Maximum conversation turns to include in AI context
const MAX_HISTORY_TURNS = 8;

// Maximum time (ms) to wait for DB queries before proceeding without context
const DB_QUERY_TIMEOUT_MS = 5000;

/**
 * Wraps a promise with a timeout that resolves to null instead of rejecting.
 * Prevents slow DB queries from blocking the AI response pipeline.
 */
function withTimeout(queryOrPromise, ms, label) {
  if (!queryOrPromise) return Promise.resolve(null);
  const promise = typeof queryOrPromise.exec === 'function' 
    ? queryOrPromise.exec() 
    : Promise.resolve(queryOrPromise);

  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[contextBuilder] DB query timed out after ${ms}ms: ${label}`);
      resolve(null);
    }, ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}

/**
 * Builds the full user context object for the adaptive engine.
 *
 * @param {object} user - Authenticated User document (from req.user)
 * @param {string|null} conversationId - Current conversation ID
 * @param {string[]} relevantTopics - Topics relevant to current message
 * @returns {Promise<object>} Built context
 */
export const buildUserContext = async (user, conversationId, relevantTopics) => {
  // 1. Load UnderstandingProfile (read-only in Stage 4)
  // Uses timeout guard to prevent slow DB from blocking the AI response
  let understandingProfile = null;
  try {
    understandingProfile = await withTimeout(
      UnderstandingProfile.findOne({ user: user._id }).lean(),
      DB_QUERY_TIMEOUT_MS,
      'UnderstandingProfile.findOne'
    );
  } catch (err) {
    console.warn('[contextBuilder] Could not load understanding profile:', err.message);
  }

  // 2. Load conversation history (if conversation exists)
  let conversationHistory = [];
  let conversation = null;
  if (conversationId) {
    try {
      conversation = await withTimeout(
        Conversation.findOne({
          _id: conversationId,
          user: user._id, // Security: enforce ownership
        }).lean(),
        DB_QUERY_TIMEOUT_MS,
        'Conversation.findOne'
      );

      if (conversation && conversation.messages) {
        // Only include user/assistant turns (not internal system messages)
        // Cap at MAX_HISTORY_TURNS (most recent turns)
        const visibleMessages = conversation.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-MAX_HISTORY_TURNS);

        conversationHistory = visibleMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      }
    } catch (err) {
      console.warn('[contextBuilder] Could not load conversation:', err.message);
    }
  }

  // 3. Build compact relevant topic context
  // Do NOT send the entire profile — only topics relevant to current request
  const compactTopicContext = buildCompactTopicContext(
    understandingProfile?.topics,
    relevantTopics
  );

  // 4. Preferences relevant to AI response generation
  // Do NOT include UI-only preferences (highContrast, voiceEnabled, textSize)
  const relevantPreferences = {
    language: user.preferences?.language || 'English (Indian Context)',
    responseStyle: user.preferences?.responseStyle || 'Simple, Jargon-Free',
  };

  // 5. Build the final context object
  // PRIVACY: No password, JWT, auth cookie, or unnecessary personal data
  return {
    userId: user._id.toString(),   // Used for DB operations — NOT sent to AI
    firstName: extractFirstName(user.name),  // Optional personalisation only
    preferences: relevantPreferences,
    understandingProfile: compactTopicContext,
    baselineCompleted: understandingProfile?.baselineAssessmentCompleted || false,
    conversationHistory,
    conversation,
    rawUnderstandingProfile: understandingProfile?.topics || null, // For adaptation policy (not for AI)
  };
};

/**
 * Builds a compact topic context with only the relevant domains.
 * Returns null entries for non-assessed topics.
 */
function buildCompactTopicContext(topics, relevantTopics) {
  if (!topics || !relevantTopics || relevantTopics.length === 0) {
    return null;
  }

  const compact = {};
  for (const topicId of relevantTopics) {
    const topicData = topics[topicId];
    if (topicData) {
      compact[topicId] = {
        label: topicData.label,
        status: topicData.status,
        knowledgeScore: topicData.knowledgeScore,
        practicalScore: topicData.practicalScore,
        misconceptionCount: topicData.misconceptionCount,
      };
    } else {
      compact[topicId] = { status: 'Not Assessed' };
    }
  }
  return compact;
}

/**
 * Safely extracts first name for personalisation.
 * If name is unavailable or a single character, falls back to null.
 */
function extractFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return null;
  const first = fullName.trim().split(' ')[0];
  return first.length > 1 ? first : null;
}
