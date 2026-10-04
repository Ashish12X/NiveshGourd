// backend/src/services/adaptive/intentDetector.js
/**
 * Intent Detector
 *
 * Two-pass detection:
 *   1. Deterministic keyword/phrase rules (fast, free, inspectable)
 *   2. Pattern-weighted scoring (no LLM needed for common cases)
 *
 * Supported intents:
 *   EXPLAIN   — user wants to understand a concept or term
 *   VERIFY    — user wants to check if something is genuine/trustworthy
 *   GUIDE     — user wants step-by-step help on what to do
 *   COMPARE   — user wants to compare options
 *   LEARN     — user wants to learn a topic more deeply
 *   INCIDENT  — user reports or suspects fraud/loss
 *   GENERAL   — catch-all
 */

export const INTENTS = {
  EXPLAIN: 'explain',
  VERIFY: 'verify',
  GUIDE: 'guide',
  COMPARE: 'compare',
  LEARN: 'learn',
  INCIDENT: 'incident',
  GENERAL: 'general',
};

// Ordered list of pattern rules. Each rule has phrases and a weight.
// First rule to exceed the threshold wins.
const INTENT_RULES = [
  {
    intent: INTENTS.INCIDENT,
    phrases: [
      'fraud', 'scam', 'cheated', 'lost money', 'stolen', 'hacked',
      'account compromise', 'money gone', 'withdrawal blocked', 'blocked account',
      'unauthorized transaction', 'money debited', 'cyber crime', 'police complaint',
      'lodge complaint', 'report fraud', 'not getting withdrawal', 'trapped',
    ],
    threshold: 1,
    weight: 2,
  },
  {
    intent: INTENTS.VERIFY,
    phrases: [
      'is this genuine', 'is this real', 'is this trustworthy', 'is this legitimate',
      'verify', 'check if', 'how do i know', 'is it safe', 'is this safe',
      'authentic', 'real or fake', 'genuine or not', 'trustworthy', 'reliable',
      'registered', 'sebi registered', 'rbi registered', 'licensed',
    ],
    threshold: 1,
    weight: 2,
  },
  {
    intent: INTENTS.GUIDE,
    phrases: [
      'how do i', 'what should i', 'steps to', 'what to do', 'help me',
      'guide me', 'show me how', 'walk me through', 'procedure', 'process',
      'how to file', 'how to report', 'how to complain', 'what action',
    ],
    threshold: 1,
    weight: 2,
  },
  {
    intent: INTENTS.COMPARE,
    phrases: [
      ' vs ', ' versus ', 'difference between', 'compare', 'better than',
      'which is better', 'pros and cons', 'advantage', 'disadvantage',
    ],
    threshold: 1,
    weight: 2,
  },
  {
    intent: INTENTS.LEARN,
    phrases: [
      'teach me', 'want to learn', 'understand more', 'deep dive',
      'explain everything', 'comprehensive', 'in detail',
    ],
    threshold: 1,
    weight: 2,
  },
  {
    intent: INTENTS.EXPLAIN,
    phrases: [
      'what is', 'what are', 'what does', 'explain', 'tell me about',
      'what do you mean', 'definition', 'meaning of', 'how does',
      'why is', 'what happens when', 'how does it work',
    ],
    threshold: 1,
    weight: 1,
  },
];

/**
 * Detects intent from the user message (and optionally the selected UI mode).
 *
 * @param {string} message - Raw user message
 * @param {string|null} uiMode - Mode selected in UI: 'Explain' | 'Verify' | 'Guide' | null
 * @returns {{ intent: string, confidence: 'high'|'medium'|'low', signals: string[] }}
 */
export const detectIntent = (message, uiMode = null) => {
  const lower = message.toLowerCase().trim();
  const signals = [];

  // Check each intent rule
  for (const rule of INTENT_RULES) {
    let matchCount = 0;
    const matchedPhrases = [];

    for (const phrase of rule.phrases) {
      if (lower.includes(phrase)) {
        matchCount += rule.weight;
        matchedPhrases.push(phrase);
      }
    }

    if (matchCount >= rule.threshold) {
      signals.push(...matchedPhrases);
      const confidence = matchCount >= 4 ? 'high' : matchCount >= 2 ? 'medium' : 'low';

      // UI mode can confirm but not override high-confidence detections
      // Exception: INCIDENT always wins over UI mode
      if (rule.intent === INTENTS.INCIDENT) {
        return { intent: INTENTS.INCIDENT, confidence: 'high', signals };
      }

      // Reconcile with UI mode
      const reconciled = reconcileWithUIMode(rule.intent, uiMode, confidence);
      return { ...reconciled, signals };
    }
  }

  // No strong pattern match — use UI mode as the signal
  if (uiMode) {
    const modeIntent = uiModeToIntent(uiMode);
    return { intent: modeIntent, confidence: 'low', signals: [`ui_mode:${uiMode}`] };
  }

  return { intent: INTENTS.GENERAL, confidence: 'low', signals: [] };
};

/**
 * Maps UI mode labels to intent constants
 */
function uiModeToIntent(uiMode) {
  const map = {
    Explain: INTENTS.EXPLAIN,
    Verify: INTENTS.VERIFY,
    Guide: INTENTS.GUIDE,
  };
  return map[uiMode] || INTENTS.GENERAL;
}

/**
 * Reconciles detected intent with UI mode.
 * UI mode is a soft signal; detected intent at medium+ confidence wins.
 */
function reconcileWithUIMode(detectedIntent, uiMode, confidence) {
  if (!uiMode) {
    return { intent: detectedIntent, confidence };
  }

  const modeIntent = uiModeToIntent(uiMode);

  // Same intent — reinforce confidence
  if (detectedIntent === modeIntent) {
    const boosted = confidence === 'low' ? 'medium' : 'high';
    return { intent: detectedIntent, confidence: boosted };
  }

  // Conflict: detected intent wins if medium or high confidence
  if (confidence === 'high' || confidence === 'medium') {
    return { intent: detectedIntent, confidence };
  }

  // Low confidence detected: UI mode wins
  return { intent: modeIntent, confidence: 'medium' };
}
