// backend/src/services/verification/riskSignalDetector.js
/**
 * Risk Signal Detector
 *
 * Deterministic detection of investor-safety risk signals in text.
 *
 * CRITICAL INVARIANT:
 *   Risk signal detection ≠ proof of fraud.
 *   Every signal is a warning indicator, not a verdict.
 *   The UI MUST communicate this distinction clearly.
 *
 * Signal severity levels:
 *   critical — strongly associated with known fraud vectors
 *   high     — significant warning, requires verification
 *   medium   — notable concern, exercise caution
 *   low      — mild indicator, informational
 */

export const SIGNAL_TYPES = {
  GUARANTEED_RETURN_CLAIM: 'GUARANTEED_RETURN_CLAIM',
  PAYMENT_PRESSURE: 'PAYMENT_PRESSURE',
  CREDENTIAL_REQUEST: 'CREDENTIAL_REQUEST',
  URGENCY_TACTICS: 'URGENCY_TACTICS',
  REGULATORY_CLAIM_UNVERIFIED: 'REGULATORY_CLAIM_UNVERIFIED',
  UNOFFICIAL_CHANNEL: 'UNOFFICIAL_CHANNEL',
  DOMAIN_REQUIRES_VERIFICATION: 'DOMAIN_REQUIRES_VERIFICATION',
  WITHDRAWAL_PAYMENT_REQUEST: 'WITHDRAWAL_PAYMENT_REQUEST',
  UNVERIFIABLE_PERFORMANCE: 'UNVERIFIABLE_PERFORMANCE',
  HIGH_RETURN_PROMISE: 'HIGH_RETURN_PROMISE',
  SCARCITY_TACTICS: 'SCARCITY_TACTICS',
  MISSING_REGULATORY_ID: 'MISSING_REGULATORY_ID',
};

/**
 * Signal rules — evaluated in order.
 * Each rule maps to a signal type, severity, patterns, and user-facing description.
 */
const SIGNAL_RULES = [
  // ── CRITICAL signals ──────────────────────────────────────────────────────
  {
    signalType: SIGNAL_TYPES.CREDENTIAL_REQUEST,
    severity: 'critical',
    description:
      'Request for OTP, PIN, password, or other security credentials detected. ' +
      'No legitimate financial institution will ask for these via chat.',
    patterns: [
      /\b(share|send|give|tell|enter|provide)\s+(your\s+)?(otp|one[\s-]time[\s-]password|pin|mpin|password|passcode)\b/i,
      /\bOTP\b.{0,40}\b(share|give|send|tell|enter)\b/i,
      /(bank\s+)?account\s+(password|pin)\b/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.WITHDRAWAL_PAYMENT_REQUEST,
    severity: 'critical',
    description:
      'Request to pay fees in order to withdraw or unlock funds. ' +
      'This is a well-known advance-fee fraud pattern.',
    patterns: [
      /withdrawal\s+(blocked|stopped|frozen|not\s+allowed).{0,100}(pay|deposit|transfer)/i,
      /(pay|deposit|transfer).{0,100}withdrawal\s+(blocked|stopped|frozen)/i,
      /pay\s+(tax|gst|fee|charge).{0,50}(withdraw|release|unlock)/i,
      /(unlock|release|unblock)\s+(fund|money|profit).{0,50}(pay|deposit)/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.GUARANTEED_RETURN_CLAIM,
    severity: 'critical',
    description:
      'Guaranteed or assured returns claim detected. ' +
      'SEBI regulations prohibit registered entities from promising guaranteed returns on market-linked securities.',
    patterns: [
      /guaranteed?\s+(return|profit|income|yield)/i,
      /guaranteed?\s+(\d+%\s+)?(return|profit|income|yield)/i,
      /assured\s+(return|profit|income)/i,
      /assured\s+(\d+%\s+)?(return|profit|income)/i,
      /risk[\s-]free\s+(return|investment|profit|income)/i,
      /\b(100|1000)%\s+capital\s+protect(ion)?/i,
      /zero\s+risk.{0,20}(return|profit|income)/i,
    ],
  },
  // ── HIGH signals ──────────────────────────────────────────────────────────
  {
    signalType: SIGNAL_TYPES.PAYMENT_PRESSURE,
    severity: 'high',
    description:
      'Request to make a payment or deposit, often with urgency signals.',
    patterns: [
      /(pay|deposit|transfer|send)\s+(₹|\$|rs\.?|inr)?\s*[\d,]+/i,
      /(send|transfer|deposit|pay)\s+(funds|money|capital|fees?)/i,
      /\b(upi|neft|imps|rtgs)\s+(transfer|payment|deposit)/i,
      /joining\s+fee/i,
      /registration\s+fee/i,
      /membership\s+(fee|charges?)/i,
      /deposit\s+(money|funds|amount|capital)/i,
      /activate\s+(your\s+)?account\s+(by\s+)?(paying|depositing|transferring)/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.HIGH_RETURN_PROMISE,
    severity: 'high',
    description:
      'Unusually high return percentages claimed (typically above 15% monthly or 100% annually).',
    patterns: [
      /\b(2[5-9]|[3-9]\d|\d{3,})\s*%\s*(monthly|weekly|daily|per\s+month)/i,
      /\b(1[0-9][0-9]|[2-9]\d{2}|\d{4,})\s*%\s*(annually|yearly|per\s+year|p\.?a\.?)/i,
      /double.{0,30}(money|investment|capital).{0,20}in\s+\d+\s*(day|week|month)/i,
      /triple.{0,30}(money|investment|capital)/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.REGULATORY_CLAIM_UNVERIFIED,
    severity: 'high',
    description:
      'Regulatory approval or registration claimed without verifiable registration numbers. ' +
      'Actual SEBI registrations have 12-character codes (e.g., INH000001234).',
    patterns: [
      /\b(sebi|rbi|amfi|irdai)\s+(approved|registered|certified|authorized|authorised)/i,
      /(approved|certified)\s+(by\s+)?\b(sebi|rbi|amfi|irdai)\b/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.UNOFFICIAL_CHANNEL,
    severity: 'high',
    description:
      'Investment advice delivered through informal social channels (WhatsApp, Telegram). ' +
      'Regulated entities communicate through official channels.',
    patterns: [
      /whatsapp\s+(group|channel|tip|signal|forward|invest)/i,
      /telegram\s+(group|channel|tip|signal|invest|vip)/i,
      /(private|secret|vip)\s+(group|channel).{0,50}invest/i,
      /dm\s+(admin|me|now)/i,
      /join\s+(our|the)\s+(group|channel)/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.UNVERIFIABLE_PERFORMANCE,
    severity: 'high',
    description:
      'Past performance claims that cannot be independently verified.',
    patterns: [
      /(\d+)\s*%\s*(accurate|accuracy|win\s+rate|success\s+rate)/i,
      /our\s+(last|past|previous)\s+\d+\s+(trade|tip|signal)s?\s+(gave|generated|returned)/i,
      /proven\s+(track\s+record|strategy|system)/i,
    ],
  },
  // ── MEDIUM signals ────────────────────────────────────────────────────────
  {
    signalType: SIGNAL_TYPES.URGENCY_TACTICS,
    severity: 'medium',
    description:
      'Urgency or time-pressure language detected to discourage independent verification.',
    patterns: [
      /limited\s+(time|offer|period)/i,
      /act\s+now/i,
      /today\s+only/i,
      /offer\s+(expire|end)s?\s+(today|tonight|soon)/i,
      /last\s+chance/i,
      /hurry/i,
      /don't\s+miss\s+(out|this)/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.SCARCITY_TACTICS,
    severity: 'medium',
    description:
      'Artificial scarcity ("only X slots left") to create urgency and bypass careful decision-making.',
    patterns: [
      /only\s+\d+\s+(slot|seat|spot|position|place)s?\s+(left|remaining|available)/i,
      /\d+\s+out\s+of\s+\d+\s+(slot|seat|spot)s?\s+(taken|filled)/i,
      /exclusive\s+(offer|opportunity|access)\s+for\s+(limited|select|few)/i,
    ],
  },
  {
    signalType: SIGNAL_TYPES.DOMAIN_REQUIRES_VERIFICATION,
    severity: 'medium',
    description:
      'Domain or URL present in message. Verify the domain is officially associated with claimed entities.',
    patterns: [
      /https?:\/\/[^\s]+/i,
      /www\.[^\s]+\.[a-z]{2,}/i,
      /click\s+(here|this\s+link)/i,
    ],
  },
  // ── LOW signals ───────────────────────────────────────────────────────────
  {
    signalType: SIGNAL_TYPES.MISSING_REGULATORY_ID,
    severity: 'low',
    description:
      'Regulatory body mentioned but no verifiable registration ID (e.g., SEBI code INH000xxxxxx) was found.',
    patterns: [
      /\b(sebi|rbi|amfi)\b(?!.*\b(?:inh|ina|inz|inv|ino)\d{6,}\b)/i,
    ],
  },
];

/**
 * Detects all risk signals in the given text.
 *
 * @param {string} text - Extracted text or input text
 * @returns {Array<{signalType, severity, description}>}
 */
export const detectRiskSignals = (text) => {
  if (!text || typeof text !== 'string') return [];

  const signals = [];
  const foundTypes = new Set();

  for (const rule of SIGNAL_RULES) {
    if (foundTypes.has(rule.signalType)) continue; // deduplicate

    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        signals.push({
          signalType: rule.signalType,
          severity: rule.severity,
          description: rule.description,
        });
        foundTypes.add(rule.signalType);
        break; // One match per signal type is enough
      }
    }
  }

  return signals;
};

/**
 * Computes an aggregated risk level from detected signals.
 * Returns: 'critical' | 'high' | 'medium' | 'low' | 'none'
 */
export const aggregateRiskLevel = (signals) => {
  if (!signals || signals.length === 0) return 'none';

  if (signals.some((s) => s.severity === 'critical')) return 'critical';
  if (signals.some((s) => s.severity === 'high')) return 'high';
  if (signals.some((s) => s.severity === 'medium')) return 'medium';
  return 'low';
};
