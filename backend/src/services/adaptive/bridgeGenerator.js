// backend/src/services/adaptive/bridgeGenerator.js
/**
 * Stage 7 Contextual Bridge Generator
 *
 * Bridges Ask SANGYAN conversations directly to:
 *   1. Stage 5: Validity Check (/validity-check)
 *   2. Stage 6: Adaptive Learning (/learn/topic/:topicId)
 *   3. Stage 7: Adaptive Compare (/compare)
 *   4. Stage 7: Decision Readiness (/decision-readiness)
 *
 * All suggestions are strictly contextual and non-intrusive.
 * Never recommends buying, selling, or specific investment choices.
 */

import { INTENTS } from './intentDetector.js';
import { SAFETY_LEVELS } from './safetyPolicy.js';

// Domain to primary Stage 6 topic ID mapping
const DOMAIN_TO_TOPIC = {
  sourceVerification: {
    topicId: 'verify-before-you-trust',
    title: 'Verify Financial Intermediaries',
  },
  riskReturn: {
    topicId: 'recognizing-guaranteed-return-myths',
    title: 'Risk & Return Mechanics',
  },
  fraudAwareness: {
    topicId: 'spotting-telegram-task-scams',
    title: 'Recognizing Fraud Schemes',
  },
  investorRights: {
    topicId: 'investor-charter-and-rights',
    title: 'Investor Rights & Protections',
  },
  grievanceAwareness: {
    topicId: 'official-escalation-scores-smartodr',
    title: 'Official Grievance Redressal (SCORES)',
  },
  basicConcepts: {
    topicId: 'basic-investment-building-blocks',
    title: 'Investment Building Blocks',
  },
};

/**
 * Generates structured, contextual action bridges based on the conversation context.
 *
 * @param {object} params
 * @param {string} params.intent
 * @param {string[]} params.relevantTopics
 * @param {string} params.safetyLevel
 * @param {string} params.message
 * @param {object} params.userContext
 * @returns {Array<{ type: string, label: string, url: string, description: string }>}
 */
export const generateContextualBridges = ({
  intent,
  relevantTopics = [],
  safetyLevel,
  message = '',
  userContext = {},
}) => {
  const lowerMsg = (message || '').toLowerCase();
  const bridges = [];
  const addedTypes = new Set();

  // ── 1. VALIDITY CHECK BRIDGE (Stage 5) ─────────────────────────
  // Trigger when verifying claims, checking genuineness, or detecting elevated risk signals
  const isVerifyIntent = intent === INTENTS.VERIFY;
  const hasSuspiciousSignals =
    safetyLevel === SAFETY_LEVELS.HIGH_ATTENTION ||
    safetyLevel === SAFETY_LEVELS.INCIDENT ||
    lowerMsg.includes('guarantee') ||
    lowerMsg.includes('telegram') ||
    lowerMsg.includes('whatsapp') ||
    lowerMsg.includes('promised') ||
    lowerMsg.includes('real or fake') ||
    lowerMsg.includes('is it genuine') ||
    lowerMsg.includes('sebi approved') ||
    lowerMsg.includes('licensed');

  if ((isVerifyIntent || hasSuspiciousSignals) && !addedTypes.has('VALIDITY_CHECK')) {
    bridges.push({
      type: 'VALIDITY_CHECK',
      label: 'Verify this claim with Validity Check',
      url: '/validity-check',
      description: 'Run claim extraction and check against authoritative regulatory records.',
    });
    addedTypes.add('VALIDITY_CHECK');
  }

  // ── 2. COMPARE BRIDGE (Stage 7) ────────────────────────────────
  // Trigger when comparing instruments or options
  const isCompareIntent = intent === INTENTS.COMPARE;
  const hasComparePhrases =
    lowerMsg.includes(' vs ') ||
    lowerMsg.includes(' versus ') ||
    lowerMsg.includes('compare') ||
    lowerMsg.includes('difference between') ||
    lowerMsg.includes('which is better') ||
    lowerMsg.includes('fd vs') ||
    lowerMsg.includes('mutual fund vs');

  if ((isCompareIntent || hasComparePhrases) && !addedTypes.has('COMPARE')) {
    bridges.push({
      type: 'COMPARE',
      label: 'Compare factual attributes side-by-side',
      url: '/compare',
      description: 'Neutral comparison of fees, liquidity, risks, and regulatory backing without declaring winners.',
    });
    addedTypes.add('COMPARE');
  }

  // ── 3. DECISION READINESS BRIDGE (Stage 7) ─────────────────────
  // Trigger when user asks about what to check, whether to buy, or preparing for an investment
  const hasDecisionPhrases =
    lowerMsg.includes('should i invest') ||
    lowerMsg.includes('should i buy') ||
    lowerMsg.includes('should i sell') ||
    lowerMsg.includes('what should i check') ||
    lowerMsg.includes('before investing') ||
    lowerMsg.includes('how to decide') ||
    lowerMsg.includes('ready to invest') ||
    lowerMsg.includes('checklist') ||
    intent === INTENTS.GUIDE;

  if (hasDecisionPhrases && !addedTypes.has('DECISION_READINESS')) {
    bridges.push({
      type: 'DECISION_READINESS',
      label: 'Check your Decision Readiness',
      url: '/decision-readiness',
      description: 'Self-assess whether you have verified all critical facts before committing money.',
    });
    addedTypes.add('DECISION_READINESS');
  }

  // ── 4. ADAPTIVE LEARNING BRIDGE (Stage 6) ──────────────────────
  // Trigger when intent is LEARN, EXPLAIN, or when user has a topic marked 'Needs Attention'
  const isLearnOrExplain = intent === INTENTS.LEARN || intent === INTENTS.EXPLAIN;
  const profileTopics = userContext?.rawUnderstandingProfile?.topics || {};

  // Check relevant topics for gaps
  for (const domain of relevantTopics) {
    const topicInfo = DOMAIN_TO_TOPIC[domain];
    if (!topicInfo) continue;

    const topicState = profileTopics[domain];
    const isWeak = topicState && (topicState.status === 'Needs Attention' || topicState.misconceptionCount > 0);

    if ((isLearnOrExplain || isWeak) && !addedTypes.has('LEARN')) {
      bridges.push({
        type: 'LEARN',
        label: `Learn: ${topicInfo.title}`,
        url: `/learn/topic/${topicInfo.topicId}`,
        description: 'Interactive adaptive module with scenarios and authoritative statutory sources.',
      });
      addedTypes.add('LEARN');
      break; // Keep maximum 1 learning bridge to avoid cluttering UI
    }
  }

  // Return at most 3 bridges to keep UI focused and clean
  return bridges.slice(0, 3);
};
