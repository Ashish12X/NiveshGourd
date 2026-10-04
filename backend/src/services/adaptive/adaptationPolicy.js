// backend/src/services/adaptive/adaptationPolicy.js
/**
 * Adaptation Policy
 *
 * The heart of Stage 4.
 *
 * Determines HOW the response should be structured based on:
 *   - User's UnderstandingProfile (per-topic status)
 *   - User preferences (responseStyle, language)
 *   - Detected intent
 *   - Safety level
 *   - Relevant topics
 *
 * Produces an AdaptationPlan consumed by responseStrategy.js to build
 * the AI prompt.
 *
 * All rules are deterministic and inspectable — NOT AI-generated.
 *
 * Adaptation dimensions:
 *   depth:         simple | standard | detailed
 *   jargon:        minimal | moderate | technical
 *   format:        plain | step_by_step | structured | example_first
 *   examples:      boolean
 *   safetyEmphasis: normal | high
 *   uncertainty:   standard | explicit
 *   interaction:   answer | answer_then_question | clarify_first
 */

import { SAFETY_LEVELS } from './safetyPolicy.js';
import { INTENTS } from './intentDetector.js';

/**
 * Determines adaptation plan from all available signals.
 *
 * @param {object} params
 * @param {string} params.intent
 * @param {string[]} params.relevantTopics
 * @param {object} params.understandingProfile  - Full UnderstandingProfile.topics
 * @param {object} params.userPreferences       - User.preferences
 * @param {string} params.safetyLevel
 * @param {string} params.intentConfidence
 * @returns {object} AdaptationPlan
 */
export const buildAdaptationPlan = ({
  intent,
  relevantTopics,
  understandingProfile,
  userPreferences,
  safetyLevel,
  intentConfidence,
  language,
}) => {
  // 1. Derive base settings from topic understanding states
  const baseSettings = deriveBaseFromTopics(relevantTopics, understandingProfile);

  // 2. Apply intent-specific overrides
  const intentSettings = applyIntentOverrides(baseSettings, intent, intentConfidence);

  // 3. Apply user preference overrides (explicit user choice always wins)
  const preferenceSettings = applyPreferenceOverrides(intentSettings, userPreferences, language);

  // 4. Apply safety overrides (safety level can escalate but never reduce safety)
  const safetySettings = applySafetyOverrides(preferenceSettings, safetyLevel);

  // Build summary for metadata (safe to expose to frontend)
  const adaptationSummary = buildSummary(safetySettings, relevantTopics, understandingProfile);

  return {
    ...safetySettings,
    adaptationSummary,
  };
};

/**
 * Derives base settings from relevant topic understanding states.
 * If multiple topics are relevant, we use the WEAKEST state as the primary driver
 * (err on the side of simpler explanations).
 */
function deriveBaseFromTopics(relevantTopics, understandingProfile) {
  if (!relevantTopics || relevantTopics.length === 0 || !understandingProfile) {
    return defaultSettings();
  }

  const statuses = relevantTopics
    .map((t) => understandingProfile[t]?.status)
    .filter(Boolean);

  if (statuses.length === 0) return defaultSettings();

  // Priority for assessed topics: Needs Attention > Developing > Strong
  // If only 'Not Assessed' or unassessed, use neutral/default settings
  if (statuses.includes('Needs Attention')) return statusToSettings('Needs Attention');
  if (statuses.includes('Developing')) return statusToSettings('Developing');
  if (statuses.includes('Strong')) return statusToSettings('Strong');
  return statusToSettings('Not Assessed');
}

function statusToSettings(status) {
  switch (status) {
    case 'Needs Attention':
      return {
        depth: 'simple',
        jargon: 'minimal',
        format: 'step_by_step',
        examples: true,
        uncertainty: 'explicit',
        interaction: 'answer_then_question',
      };
    case 'Not Assessed':
      // Not Assessed !== Beginner. Neutral / default explanation.
      return {
        depth: 'standard',
        jargon: 'moderate',
        format: 'structured',
        examples: true,
        uncertainty: 'standard',
        interaction: 'answer',
      };
    case 'Developing':
      return {
        depth: 'standard',
        jargon: 'moderate',
        format: 'structured',
        examples: true,
        uncertainty: 'standard',
        interaction: 'answer',
      };
    case 'Strong':
    default:
      return {
        depth: 'detailed',
        jargon: 'moderate',
        format: 'structured',
        examples: false,
        uncertainty: 'standard',
        interaction: 'answer',
      };
  }
}

function defaultSettings() {
  return {
    depth: 'standard',
    jargon: 'moderate',
    format: 'structured',
    examples: true,
    uncertainty: 'standard',
    interaction: 'answer',
  };
}

/**
 * Intent-specific adjustments on top of base settings.
 */
function applyIntentOverrides(settings, intent, confidence) {
  const result = { ...settings };

  switch (intent) {
    case INTENTS.VERIFY:
      // Verification requests always benefit from step-by-step checklists
      result.format = 'step_by_step';
      result.examples = true;
      break;

    case INTENTS.GUIDE:
      // Guided steps always use step-by-step
      result.format = 'step_by_step';
      break;

    case INTENTS.INCIDENT:
      // Incident: simple, urgent, step-by-step, explicit uncertainty
      result.depth = 'simple';
      result.jargon = 'minimal';
      result.format = 'step_by_step';
      result.examples = false;
      result.uncertainty = 'explicit';
      result.interaction = 'answer';
      break;

    case INTENTS.COMPARE:
      // Comparisons benefit from structured format
      result.format = 'structured';
      break;

    case INTENTS.GENERAL:
      // Ambiguous intent — ask a clarifying question
      if (confidence === 'low') {
        result.interaction = 'clarify_first';
      }
      break;

    default:
      break;
  }

  return result;
}

/**
 * User preference overrides — explicit user choice takes precedence.
 */
export const LANGUAGE_REGISTRY = {
  en: { code: 'en', name: 'English', native: 'English' },
  hi: { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  bn: { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  mr: { code: 'mr', name: 'Marathi', native: 'मराठी' },
  te: { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  ta: { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  gu: { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  kn: { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  pa: { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  or: { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  as: { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
};

function resolveLanguage(langInput) {
  if (!langInput) return LANGUAGE_REGISTRY.en;
  const str = String(langInput).trim().toLowerCase();

  for (const [code, info] of Object.entries(LANGUAGE_REGISTRY)) {
    if (
      str === code ||
      str === info.name.toLowerCase() ||
      str === info.native.toLowerCase() ||
      str.includes(info.name.toLowerCase()) ||
      str.includes(info.native.toLowerCase())
    ) {
      return info;
    }
  }

  if (str.includes('hinglish')) {
    return { code: 'hi', name: 'Hindi (Hinglish/Conversational)', native: 'हिन्दी' };
  }

  return LANGUAGE_REGISTRY.en;
}

function applyPreferenceOverrides(settings, preferences, explicitLanguage) {
  const result = { ...settings };

  if (preferences) {
    // Response style preferences
    const style = preferences.responseStyle || '';
    if (style.toLowerCase().includes('simple') || style.toLowerCase().includes('jargon-free')) {
      result.jargon = 'minimal';
    } else if (style.toLowerCase().includes('detailed') || style.toLowerCase().includes('technical')) {
      result.jargon = 'moderate';
      result.depth = 'detailed';
    }
  }

  // Language resolution: explicitLanguage > preferences.language > default English
  const targetLang = explicitLanguage || preferences?.language || 'en';
  const resolved = resolveLanguage(targetLang);

  result.language = resolved.code;
  result.responseLanguage = resolved.name;
  result.nativeScript = resolved.native;

  // IMPORTANT: Language preference does NOT change literacy or simplicity!
  // Depth and jargon remain determined by UnderstandingProfile.
  return result;
}

/**
 * Safety-level overrides — safety can only increase emphasis, never decrease.
 */
function applySafetyOverrides(settings, safetyLevel) {
  const result = { ...settings };

  if (safetyLevel === SAFETY_LEVELS.INCIDENT) {
    result.safetyEmphasis = 'high';
    result.format = 'step_by_step';
    result.depth = 'simple';
    result.jargon = 'minimal';
  } else if (safetyLevel === SAFETY_LEVELS.HIGH_ATTENTION) {
    result.safetyEmphasis = 'high';
    if (result.format === 'plain') result.format = 'structured';
  } else if (safetyLevel === SAFETY_LEVELS.CAUTION) {
    result.safetyEmphasis = result.safetyEmphasis || 'normal';
  } else {
    result.safetyEmphasis = result.safetyEmphasis || 'normal';
  }

  return result;
}

/**
 * Builds a concise, user-safe summary string for adaptive metadata.
 * NEVER includes internal prompt or chain-of-thought.
 */
function buildSummary(settings, relevantTopics, understandingProfile) {
  const parts = [];

  if (settings.depth === 'simple') {
    parts.push('Using simplified explanations');
  } else if (settings.depth === 'detailed') {
    parts.push('Using detailed explanations');
  } else {
    parts.push('Using standard explanations');
  }

  if (settings.jargon === 'minimal') {
    parts.push('jargon-free language');
  } else if (settings.jargon === 'technical') {
    parts.push('technical language');
  }

  if (settings.format === 'step_by_step') {
    parts.push('step-by-step format');
  } else if (settings.format === 'example_first') {
    parts.push('example-first format');
  }

  if (settings.safetyEmphasis === 'high') {
    parts.push('with safety emphasis');
  }

  if (relevantTopics && relevantTopics.length > 0 && understandingProfile) {
    const topicStatus = understandingProfile[relevantTopics[0]]?.status;
    if (topicStatus) {
      parts.push(`based on your understanding level in this topic (${topicStatus})`);
    }
  }

  return parts.join(', ') + '.';
}
