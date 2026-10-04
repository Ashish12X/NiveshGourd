// backend/src/services/adaptive/topicMapper.js
/**
 * Topic Relevance Mapper
 *
 * Maps user intent + message keywords to relevant UnderstandingProfile topic domains.
 * This is deterministic and inspectable — no LLM involved.
 *
 * Topic domains (from Stage 3):
 *   basicConcepts        — product types, deposits, liquidity
 *   riskReturn           — risk-return tradeoff, volatility, unrealistic claims
 *   fraudAwareness       — scam signals, red flags, pressure tactics
 *   sourceVerification   — SEBI registration, official portals, payment channels
 *   investorRights       — contract notes, statutory protections, account security
 *   grievanceAwareness   — SCORES, SMART ODR, complaint escalation
 */

export const TOPIC_DOMAINS = {
  BASIC_CONCEPTS: 'basicConcepts',
  RISK_RETURN: 'riskReturn',
  FRAUD_AWARENESS: 'fraudAwareness',
  SOURCE_VERIFICATION: 'sourceVerification',
  INVESTOR_RIGHTS: 'investorRights',
  GRIEVANCE_AWARENESS: 'grievanceAwareness',
};

// Keyword-to-topic mappings
const TOPIC_KEYWORD_MAP = [
  {
    topic: TOPIC_DOMAINS.BASIC_CONCEPTS,
    keywords: [
      'fixed deposit', 'fd', 'savings', 'liquid', 'liquidity', 'mutual fund',
      'equity', 'bond', 'debenture', 'nps', 'ppf', 'etf', 'index fund',
      'asset', 'capital', 'investment product', 'portfolio', 'diversif',
      'what is invest', 'types of invest', 'market linked',
    ],
  },
  {
    topic: TOPIC_DOMAINS.RISK_RETURN,
    keywords: [
      'risk', 'return', 'profit', 'loss', 'volatility', 'market crash',
      'guaranteed return', 'high return', '20%', '30%', '40%', '50%',
      'safe investment', 'secure investment', 'no risk', 'zero risk',
      'downside', 'upside', 'drawdown', 'interest rate',
    ],
  },
  {
    topic: TOPIC_DOMAINS.FRAUD_AWARENESS,
    keywords: [
      'fraud', 'scam', 'fake', 'suspicious', 'red flag', 'warn', 'scheme',
      'ponzi', 'chit fund', 'too good', 'promise', 'urgent', 'act now',
      'time sensitive', 'limited offer', 'whatsapp group', 'telegram group',
      'chat group', 'tip', 'inside info', 'secret formula',
    ],
  },
  {
    topic: TOPIC_DOMAINS.SOURCE_VERIFICATION,
    keywords: [
      'verify', 'genuine', 'authentic', 'real', 'legitimate', 'trustworthy',
      'registered', 'sebi', 'rbi', 'irda', 'amfi', 'nse', 'bse',
      'official', 'broker', 'advisor', 'platform', 'app', 'website',
      'payment', 'bank account', 'upi', 'personal account',
    ],
  },
  {
    topic: TOPIC_DOMAINS.INVESTOR_RIGHTS,
    keywords: [
      'rights', 'contract note', 'statement', 'account', 'demat',
      'password', 'otp', 'pin', 'credential', 'unauthorized trading',
      'power of attorney', 'poa', 'nomination', 'protection', 'dicgc',
      'insurance', 'statutory', 'obligation',
    ],
  },
  {
    topic: TOPIC_DOMAINS.GRIEVANCE_AWARENESS,
    keywords: [
      'complain', 'complaint', 'grievance', 'dispute', 'sebi scores', 'scores',
      'smart odr', 'odr', 'arbitration', 'escalat', 'lodge', 'file complaint',
      'resolve', 'investor grievance', 'helpline', '1930',
    ],
  },
];

/**
 * Returns the most relevant topic domains for a given message + intent.
 *
 * @param {string} message - User message
 * @param {string} intent - Detected intent
 * @returns {string[]} Ordered array of relevant topic IDs (most relevant first)
 */
export const mapToRelevantTopics = (message, intent) => {
  const lower = message.toLowerCase();
  const scores = {};

  // Initialise all domains at 0
  Object.values(TOPIC_DOMAINS).forEach((d) => { scores[d] = 0; });

  // Score each domain by keyword hits
  for (const mapping of TOPIC_KEYWORD_MAP) {
    for (const kw of mapping.keywords) {
      if (lower.includes(kw)) {
        scores[mapping.topic] = (scores[mapping.topic] || 0) + 1;
      }
    }
  }

  // Intent-based boosts (deterministic signals)
  const intentBoosts = {
    verify: [TOPIC_DOMAINS.SOURCE_VERIFICATION, TOPIC_DOMAINS.FRAUD_AWARENESS],
    incident: [TOPIC_DOMAINS.FRAUD_AWARENESS, TOPIC_DOMAINS.GRIEVANCE_AWARENESS, TOPIC_DOMAINS.INVESTOR_RIGHTS],
    guide: [TOPIC_DOMAINS.SOURCE_VERIFICATION, TOPIC_DOMAINS.GRIEVANCE_AWARENESS],
    explain: [],
    learn: [],
    compare: [TOPIC_DOMAINS.BASIC_CONCEPTS, TOPIC_DOMAINS.RISK_RETURN],
    general: [],
  };

  const boosts = intentBoosts[intent] || [];
  boosts.forEach((domain, i) => {
    scores[domain] = (scores[domain] || 0) + (2 - i); // +2 for first, +1 for second
  });

  // Sort by score descending, include only topics with at least one signal
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([topic]) => topic);

  // Always return at least a best-guess topic based on intent
  if (sorted.length === 0) {
    const fallbacks = {
      explain: [TOPIC_DOMAINS.BASIC_CONCEPTS],
      verify: [TOPIC_DOMAINS.SOURCE_VERIFICATION],
      guide: [TOPIC_DOMAINS.GRIEVANCE_AWARENESS],
      compare: [TOPIC_DOMAINS.BASIC_CONCEPTS, TOPIC_DOMAINS.RISK_RETURN],
      learn: [TOPIC_DOMAINS.BASIC_CONCEPTS],
      incident: [TOPIC_DOMAINS.FRAUD_AWARENESS],
      general: [],
    };
    return fallbacks[intent] || [];
  }

  // Return top 3 topics max (avoid bloating the AI context)
  return sorted.slice(0, 3);
};
