// backend/src/services/verification/claimClassifier.js
/**
 * Claim Classifier
 *
 * Deterministic classification of claim text into structured categories.
 * All classification is rule-based — no AI involved.
 * Each category corresponds to a known investor-safety risk pattern.
 */

export const CLAIM_TYPES = {
  REGULATORY_APPROVAL: 'REGULATORY_APPROVAL',
  REGISTRATION_STATUS: 'REGISTRATION_STATUS',
  GUARANTEED_RETURN: 'GUARANTEED_RETURN',
  PERFORMANCE_CLAIM: 'PERFORMANCE_CLAIM',
  PAYMENT_REQUEST: 'PAYMENT_REQUEST',
  URGENCY: 'URGENCY',
  CREDENTIAL_REQUEST: 'CREDENTIAL_REQUEST',
  COMPANY_IDENTITY: 'COMPANY_IDENTITY',
  PRODUCT_CLAIM: 'PRODUCT_CLAIM',
  GRIEVANCE_OR_AUTHORITY_CLAIM: 'GRIEVANCE_OR_AUTHORITY_CLAIM',
  GENERAL_INFORMATION: 'GENERAL_INFORMATION',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Classification rules — ordered by priority (more specific first).
 * Each rule has:
 *   type: CLAIM_TYPES value
 *   patterns: array of RegExp
 */
const CLASSIFICATION_RULES = [
  {
    type: CLAIM_TYPES.CREDENTIAL_REQUEST,
    patterns: [
      /\b(otp|one[\s-]time[\s-]password|pin|mpin|password|passcode)\b/i,
      /share\s+(your\s+)?(otp|password|pin|mpin)/i,
      /enter\s+(your\s+)?(otp|pin|password)/i,
      /verification\s+code/i,
    ],
  },
  {
    type: CLAIM_TYPES.GUARANTEED_RETURN,
    patterns: [
      /guaranteed?\s+(return|profit|income|yield)/i,
      /risk[\s-]free\s+(return|investment|profit)/i,
      /assured\s+(return|profit|income)/i,
      /\b(100|1000)%\s+capital\s+protect/i,
      /sure[\s-]shot\s+(return|profit)/i,
      /double\s+(your\s+)?(money|investment)\s+in/i,
      /triple\s+(your\s+)?(money|investment)/i,
      /fixed\s+return/i,
      /\b(30|40|50|60|70|80|90|100|25|20)\s*%\s*(monthly|weekly|daily|annual)\s+(return|profit|yield)/i,
    ],
  },
  {
    type: CLAIM_TYPES.REGULATORY_APPROVAL,
    patterns: [
      /\b(sebi|rbi|amfi|irdai|pfrda)\s+(approved|registered|certified|authorized|authorised|verified)/i,
      /(approved|certified|authorized)\s+(by\s+)?\b(sebi|rbi|amfi|irdai|pfrda)\b/i,
      /sebi[\s-]registered\s+(broker|advisor|intermediary)/i,
      /rbi[\s-]approved/i,
    ],
  },
  {
    type: CLAIM_TYPES.REGISTRATION_STATUS,
    patterns: [
      /\b(registered|licensed|certified)\s+(entity|company|firm|platform|broker|advisor)/i,
      /registration\s+(number|no\.?|code|id)/i,
      /(inh|ina|inz|inv)\d{6}/i,   // SEBI registration number pattern
      /cin\s*:?\s*[ul]\d{5}/i,      // MCA CIN pattern
      /\b(listed|regulated)\s+(on|by|with)\s+(nse|bse|sebi|rbi)/i,
    ],
  },
  {
    type: CLAIM_TYPES.PAYMENT_REQUEST,
    patterns: [
      /(pay|deposit|transfer|send)\s+(₹|\$|rs\.?|inr)?\s*[\d,]+/i,
      /\b(upi|neft|imps|rtgs)\s+(id|payment|transfer)/i,
      /(wallet|account)\s+(number|id|details)/i,
      /activate\s+(your\s+)?account/i,
      /registration\s+fee/i,
      /joining\s+fee/i,
      /membership\s+fee/i,
      /deposit\s+(money|funds|amount)/i,
    ],
  },
  {
    type: CLAIM_TYPES.URGENCY,
    patterns: [
      /limited\s+(time|offer|seats|slots|spots)/i,
      /only\s+\d+\s+(slot|seat|spot)s?\s+(left|remaining|available)/i,
      /act\s+now/i,
      /today\s+only/i,
      /offer\s+(expire|end)s?\s+(today|tonight|soon)/i,
      /last\s+chance/i,
      /exclusive\s+opportunity/i,
      /hurry/i,
      /don't\s+miss/i,
      /dm\s+(admin|now|immediately)/i,
    ],
  },
  {
    type: CLAIM_TYPES.PERFORMANCE_CLAIM,
    patterns: [
      /\b(\d+)\s*%\s*(return|profit|gain|yield|growth)/i,
      /\bprofit\s+of\s+(₹|\$|rs\.?)?\s*[\d,]+/i,
      /\b(beat|outperform)\s+(the\s+)?market/i,
      /\b(nifty|sensex)\s*(beating|outperform)/i,
      /track\s+record/i,
      /past\s+(performance|return|result)/i,
    ],
  },
  {
    type: CLAIM_TYPES.GRIEVANCE_OR_AUTHORITY_CLAIM,
    patterns: [
      /\b(sebi|rbi|cybercrime|police|court|tribunal)\s+(has\s+)?(ordered|directed|approved|authorized)/i,
      /\b(legal|court|judicial)\s+(action|notice|order)/i,
      /\b(government|ministry|income\s+tax)\s+(approved|verified)/i,
      /arbitration\s+award/i,
      /sebi\s+scores/i,
    ],
  },
  {
    type: CLAIM_TYPES.COMPANY_IDENTITY,
    patterns: [
      /\b(company|firm|platform|app)\s+(named?|called|known\s+as)/i,
      /established\s+in\s+\d{4}/i,
      /founded\s+by/i,
      /headquartered\s+(in|at)/i,
      /\b(pvt\.?|ltd\.?|llp|inc\.?)\b/i,
    ],
  },
  {
    type: CLAIM_TYPES.PRODUCT_CLAIM,
    patterns: [
      /\b(mutual\s+fund|stock|equity|derivative|option|future|bond|debenture|ncd|fd|fixed\s+deposit|ulip|ipo)\b/i,
      /algorithmic\s+(trading|investment|fund)/i,
      /portfolio\s+management/i,
      /advisory\s+service/i,
      /signal\s+service/i,
      /telegram\s+channel.*invest/i,
    ],
  },
  {
    type: CLAIM_TYPES.GENERAL_INFORMATION,
    patterns: [
      /\b(invest|investment|market|trading|finance)\b/i,
    ],
  },
];

/**
 * Classifies a single claim text into its CLAIM_TYPE.
 *
 * @param {string} claimText
 * @returns {string} CLAIM_TYPES value
 */
export const classifyClaim = (claimText) => {
  if (!claimText || typeof claimText !== 'string') return CLAIM_TYPES.UNKNOWN;

  for (const rule of CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(claimText)) {
        return rule.type;
      }
    }
  }

  return CLAIM_TYPES.UNKNOWN;
};
