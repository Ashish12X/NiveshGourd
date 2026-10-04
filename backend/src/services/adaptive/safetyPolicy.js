// backend/src/services/adaptive/safetyPolicy.js
/**
 * Safety Policy
 *
 * Detects safety-sensitive contexts in user messages.
 *
 * Safety levels:
 *   normal          — routine educational question
 *   caution         — mild warning signals present
 *   high_attention  — strong safety-sensitive indicators
 *   incident        — user reports active fraud/loss/compromise
 *
 * IMPORTANT:
 *   Safety level does NOT mean "confirmed scam."
 *   It adjusts how the AI frames its response and how much safety
 *   emphasis to apply. Never claim something is "definitely a scam"
 *   based on keyword detection alone.
 */

export const SAFETY_LEVELS = {
  NORMAL: 'normal',
  CAUTION: 'caution',
  HIGH_ATTENTION: 'high_attention',
  INCIDENT: 'incident',
};

// Pattern groups — each pattern has a level assignment and label
const SAFETY_PATTERNS = [
  // INCIDENT — active loss/fraud/compromise
  {
    level: SAFETY_LEVELS.INCIDENT,
    label: 'active-fraud-report',
    patterns: [
      /\b(lost|transferred|sent|paid)\s+(money|funds|amount|₹|rs)/i,
      /\baccount\s+(hacked|compromised|takeover)/i,
      /\bunauthorized\s+transaction/i,
      /\bmoney\s+(gone|missing|debited|disappeared)/i,
      /\bcybercrime|1930\b/i,
    ],
  },
  // HIGH_ATTENTION — strong financial safety signals
  {
    level: SAFETY_LEVELS.HIGH_ATTENTION,
    label: 'guaranteed-return-language',
    patterns: [
      /guaranteed\s+return/i,
      /guaranteed\s+profit/i,
      /guaranteed\s+income/i,
      /risk[\s-]free\s+(return|investment|profit)/i,
      /no\s+risk.{0,20}(high|great|amazing)\s+return/i,
    ],
  },
  {
    level: SAFETY_LEVELS.HIGH_ATTENTION,
    label: 'urgent-payment-request',
    patterns: [
      /transfer\s+(money\s+|funds\s+)?(now|immediately|urgently|right away)/i,
      /send\s+(money\s+|funds\s+)?(immediately|urgently|now|right away)/i,
      /pay\s+(immediately|now|urgently|right away)/i,
      /urgent\s+(payment|transfer|deposit)/i,
      /time[\s-]sensitive.{0,30}(transfer|payment|deposit)/i,
    ],
  },
  {
    level: SAFETY_LEVELS.HIGH_ATTENTION,
    label: 'credential-request',
    patterns: [
      /share\s+(your\s+)?(otp|password|pin|mpin)/i,
      /send\s+(your\s+)?(otp|password|pin|mpin)/i,
      /asked.{0,20}(otp|password|pin|mpin)/i,
      /\bOTP\b.{0,30}(shared|give|tell|send)/i,
    ],
  },
  {
    level: SAFETY_LEVELS.HIGH_ATTENTION,
    label: 'withdrawal-blocked',
    patterns: [
      /withdrawal\s+(blocked|stopped|frozen|not\s+allowed)/i,
      /can't\s+withdraw/i,
      /cannot\s+withdraw/i,
      /withdraw\s+(problem|issue|blocked)/i,
      /account\s+frozen/i,
      /funds\s+(locked|blocked|frozen)/i,
    ],
  },
  {
    level: SAFETY_LEVELS.HIGH_ATTENTION,
    label: 'suspicious-investment-app',
    patterns: [
      /suspicious\s+(app|platform|website|link)/i,
      /(unknown|unverified|unregistered)\s+(broker|app|platform|advisor)/i,
      /investment\s+app.{0,30}(genuine|real|safe|verified)/i,
    ],
  },
  // CAUTION — mild warning signals
  {
    level: SAFETY_LEVELS.CAUTION,
    label: 'high-return-claim',
    patterns: [
      /\b(20|25|30|40|50|60|70|80|90|100)%\s*(guaranteed|assured|return|profit)/i,
      /double\s+(your\s+)?(money|investment)\s+in/i,
      /triple\s+(your\s+)?(money|investment)/i,
      /sure[\s-]shot\s+(return|profit)/i,
    ],
  },
  {
    level: SAFETY_LEVELS.CAUTION,
    label: 'pressure-tactics',
    patterns: [
      /limited\s+(time|offer|seats|spots)/i,
      /act\s+now.{0,20}(invest|opportunity)/i,
      /today\s+only/i,
      /last\s+chance.{0,20}invest/i,
      /exclusive\s+(offer|opportunity|deal).{0,30}invest/i,
    ],
  },
  {
    level: SAFETY_LEVELS.CAUTION,
    label: 'unofficial-channel',
    patterns: [
      /whatsapp\s+(group|tip|signal|invest)/i,
      /telegram\s+(group|channel|tip|signal|invest)/i,
      /(private\s+group|secret\s+group).{0,30}invest/i,
    ],
  },
];

/**
 * Analyses message for safety signals.
 *
 * @param {string} message - User message
 * @returns {{ safetyLevel: string, reasons: string[], isElevated: boolean }}
 */
export const analyseMessageSafety = (message) => {
  const reasons = [];
  let highestLevel = SAFETY_LEVELS.NORMAL;

  const levelPriority = {
    [SAFETY_LEVELS.NORMAL]: 0,
    [SAFETY_LEVELS.CAUTION]: 1,
    [SAFETY_LEVELS.HIGH_ATTENTION]: 2,
    [SAFETY_LEVELS.INCIDENT]: 3,
  };

  for (const group of SAFETY_PATTERNS) {
    for (const pattern of group.patterns) {
      if (pattern.test(message)) {
        if (!reasons.includes(group.label)) {
          reasons.push(group.label);
        }
        if (levelPriority[group.level] > levelPriority[highestLevel]) {
          highestLevel = group.level;
        }
        break; // Only count each group label once
      }
    }
  }

  return {
    safetyLevel: highestLevel,
    reasons,
    isElevated: highestLevel !== SAFETY_LEVELS.NORMAL,
  };
};

/**
 * Returns a human-readable summary for adaptive metadata.
 */
export const safetyLevelSummary = (level) => {
  const summaries = {
    [SAFETY_LEVELS.NORMAL]: 'No safety concerns detected.',
    [SAFETY_LEVELS.CAUTION]: 'Mild warning signals detected — response includes appropriate caution.',
    [SAFETY_LEVELS.HIGH_ATTENTION]: 'Safety-sensitive context detected — response emphasises verification and caution.',
    [SAFETY_LEVELS.INCIDENT]: 'Possible active incident detected — response provides urgent guidance and official resources.',
  };
  return summaries[level] || 'Safety level unknown.';
};
