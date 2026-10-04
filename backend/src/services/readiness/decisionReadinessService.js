// backend/src/services/readiness/decisionReadinessService.js
/**
 * Decision Readiness Service — Stage 7
 *
 * Implements self-assessed information completeness checks:
 *   1. Standard 10-item statutory checklist template
 *   2. Strict distinction between USER_REPORTED vs. FACTUALLY_VERIFIED
 *   3. Information completeness percentage calculation (NOT investment quality)
 *   4. Direct contextual action bridges for unresolved items
 *   5. UnderstandingProfile-adapted neutral explanations
 *   6. User ownership enforcement and history persistence
 */

import DecisionReadinessSession from '../../models/DecisionReadinessSession.js';
import UnderstandingProfile from '../../models/UnderstandingProfile.js';

export const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    id: 'q1_product',
    question: 'Do I understand how this product works and how returns/gains are generated?',
    category: 'Product Mechanics',
    description:
      'Understanding whether yields come from business revenues, interest payments, market capital appreciation, or speculative trading.',
  },
  {
    id: 'q2_risk',
    question: 'Do I understand the major risks and potential for capital loss or drawdown?',
    category: 'Risk Clarity',
    description:
      'Acknowledging what market volatility, credit default, or liquidation delays could mean for your invested capital.',
  },
  {
    id: 'q3_costs',
    question: 'Do I know all applicable entry fees, expense ratios, exit loads, and tax rules?',
    category: 'Costs & Taxation',
    description:
      'Total expense ratios, advisory commissions, premature penalty deductions, and applicable capital gains taxes.',
  },
  {
    id: 'q4_liquidity',
    question: 'Do I know the exact rules and penalties for premature withdrawals or lock-ins?',
    category: 'Liquidity & Lock-in',
    description:
      'Statutory minimum holding periods, settlement turnaround times (e.g. T+2), and conditions under which funds can be accessed.',
  },
  {
    id: 'q5_source',
    question: 'Do I know where this information originated (official portal vs social media / forward)?',
    category: 'Source Reliability',
    description:
      'Distinguishing between registered regulatory disclosures and unverified WhatsApp/Telegram groups or anonymous social media influencers.',
  },
  {
    id: 'q6_official_check',
    question: 'Have I independently verified the intermediary\'s active registration on SEBI / RBI?',
    category: 'Regulatory Verification',
    description:
      'Checking registration codes (INZ/INA/INH for SEBI, deposit license for RBI) directly on official government websites.',
  },
  {
    id: 'q7_terms',
    question: 'Have I read the official scheme document / contract rather than promotional summaries?',
    category: 'Statutory Documentation',
    description:
      'Reviewing Scheme Information Documents (SID), fixed deposit contracts, or official offer circulars.',
  },
  {
    id: 'q8_grievance',
    question: 'Do I know where to lodge a statutory complaint (SCORES / RBI Ombudsman) if an issue occurs?',
    category: 'Grievance Redressal',
    description:
      'Familiarity with SEBI SCORES, SMART ODR, or RBI Banking Ombudsman channels for formal dispute resolution.',
  },
  {
    id: 'q9_urgency',
    question: 'Am I deciding without artificial urgency, guaranteed promises, or pressure from others?',
    category: 'Independent Judgment',
    description:
      'Ensuring that you are not acting under artificial deadlines ("limited slots left", "pay in 2 hours") or guaranteed profit promises.',
  },
  {
    id: 'q10_contingency',
    question: 'Would a delay or loss in this investment leave my essential livelihood completely safe?',
    category: 'Capital Resilience',
    description:
      'Ensuring you have an emergency fund and are not investing money required for near-term rent, medical emergencies, or basic living expenses.',
  },
];

/**
 * Returns the default checklist template for the frontend.
 */
export const getChecklistTemplate = () => {
  return {
    template: DEFAULT_CHECKLIST_TEMPLATE,
    totalCount: DEFAULT_CHECKLIST_TEMPLATE.length,
    guardrailNotice:
      'Self-Assessment Mandate: This checklist evaluates your reported information completeness. It does not certify investment quality, profitability, or legal soundness. Always independently verify claims through official regulatory registries.',
  };
};

/**
 * Evaluates a user checklist submission, computes information completeness %,
 * assigns contextual action bridges, and persists the session.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.productName]
 * @param {Array<{ id: string, answer: 'YES'|'NO'|'NOT_SURE', notes?: string }>} params.checklist
 * @returns {Promise<object>}
 */
export const evaluateReadiness = async ({ userId, productName, checklist }) => {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    throw new Error('Checklist must be a non-empty array of items.');
  }

  // Map user answers with template questions
  const evaluatedItems = DEFAULT_CHECKLIST_TEMPLATE.map((templateItem) => {
    const userItem = checklist.find((item) => item.id === templateItem.id) || {};
    const rawAnswer = (userItem.answer || 'NOT_SURE').toUpperCase();
    const answer = ['YES', 'NO', 'NOT_SURE'].includes(rawAnswer) ? rawAnswer : 'NOT_SURE';

    let status = 'UNCERTAIN';
    if (answer === 'YES') {
      status = 'USER_REPORTED_COMPLETE';
    } else if (answer === 'NO') {
      status = 'NOT_CHECKED';
    }

    return {
      id: templateItem.id,
      question: templateItem.question,
      category: templateItem.category,
      description: templateItem.description,
      answer,
      status,
      notes: typeof userItem.notes === 'string' ? userItem.notes.slice(0, 500) : '',
    };
  });

  const totalCount = evaluatedItems.length;
  const completedCount = evaluatedItems.filter((i) => i.answer === 'YES').length;
  const unresolvedCount = totalCount - completedCount;
  const readinessPercentage = Math.round((completedCount / totalCount) * 100);

  let readinessLevel = 'Significant Information Gaps';
  if (readinessPercentage === 100) {
    readinessLevel = 'Comprehensive Understanding';
  } else if (readinessPercentage >= 50) {
    readinessLevel = 'Partially Informed — Pause on Gaps';
  }

  // Generate action bridges for unresolved items
  const unresolvedItems = evaluatedItems
    .filter((i) => i.answer !== 'YES')
    .map((item) => {
      const bridge = mapItemToBridge(item.id);
      return {
        id: item.id,
        question: item.question,
        category: item.category,
        status: item.status,
        actionType: bridge.type,
        actionLabel: bridge.label,
        actionUrl: bridge.url,
      };
    });

  // Load UnderstandingProfile to adapt explanation depth
  let profile = null;
  if (userId) {
    profile = await UnderstandingProfile.findOne({ user: userId }).lean();
  }

  const neutralExplanation = generateReadinessExplanation({
    completedCount,
    totalCount,
    readinessPercentage,
    unresolvedItems,
    profile,
  });

  // Persist session
  let session = null;
  if (userId) {
    session = await DecisionReadinessSession.create({
      user: userId,
      productName: productName || 'General Investment Decision',
      checklist: evaluatedItems,
      totalCount,
      completedCount,
      unresolvedCount,
      readinessPercentage,
      readinessLevel,
      unresolvedItems,
      neutralExplanation,
    });
  }

  return {
    sessionId: session?._id || null,
    productName: productName || 'General Investment Decision',
    checklist: evaluatedItems,
    totalCount,
    completedCount,
    unresolvedCount,
    readinessPercentage,
    readinessLevel,
    unresolvedItems,
    neutralExplanation,
    guardrailNotice:
      'Information Completeness Mandate: This score reflects how many informational checks you have completed. It is NOT an indicator of expected profit, return, or investment quality.',
  };
};

/**
 * Maps an unresolved checklist item to the appropriate SANGYAN tool or learning module.
 */
function mapItemToBridge(itemId) {
  switch (itemId) {
    case 'q5_source':
    case 'q6_official_check':
    case 'q9_urgency':
      return {
        type: 'VALIDITY_CHECK',
        label: 'Verify with Validity Check',
        url: '/validity-check',
      };
    case 'q2_risk':
    case 'q3_costs':
      return {
        type: 'LEARN',
        label: 'Learn: Risk & Return',
        url: '/learn/topic/recognizing-guaranteed-return-myths',
      };
    case 'q8_grievance':
      return {
        type: 'LEARN',
        label: 'Learn: Grievance Escalation',
        url: '/learn/topic/official-escalation-scores-smartodr',
      };
    case 'q1_product':
    case 'q4_liquidity':
    case 'q7_terms':
      return {
        type: 'COMPARE',
        label: 'Compare Factual Terms',
        url: '/compare',
      };
    default:
      return {
        type: 'ASK_NIVESHGUARD',
        label: 'Ask NiveshGuard',
        url: '/ask',
      };
  }
}

/**
 * Generates neutral adaptive explanation for Decision Readiness.
 */
function generateReadinessExplanation({
  completedCount,
  totalCount,
  readinessPercentage,
  unresolvedItems,
  profile,
}) {
  const isWeak =
    profile?.topics?.riskReturn?.status === 'Needs Attention' ||
    profile?.topics?.sourceVerification?.status === 'Needs Attention';

  const parts = [];

  if (isWeak) {
    parts.push(
      `You have completed **${completedCount} of ${totalCount}** information checks (${readinessPercentage}% information completeness).`
    );
    if (unresolvedItems.length > 0) {
      parts.push(
        `**Key Areas to Check Before Acting:** You marked ${unresolvedItems.length} area(s) as not yet checked or uncertain. Before committing any money, take a moment to verify these missing details through official channels.`
      );
    } else {
      parts.push(
        `**All Information Checks Reported Complete:** Remember that answering "Yes" is a self-assessment. Always ensure that the legal entity has an active license with SEBI or RBI.`
      );
    }
  } else {
    parts.push(
      `Information Readiness Assessment: **${completedCount}/${totalCount} points verified** (${readinessPercentage}% completeness).`
    );
    if (unresolvedItems.length > 0) {
      parts.push(
        `**Documented Information Deficits:** The following critical facets remain unresolved: ${unresolvedItems
          .map((i) => i.category)
          .join(', ')}. In financial decision-making, unverified parameters represent structural operational risk.`
      );
    } else {
      parts.push(
        `**Baseline Information Scope Completed:** All 10 pre-action checkpoints have been self-reported as reviewed. Maintain copies of statutory documentation and transaction UTR numbers.`
      );
    }
  }

  return parts.join('\n\n');
}

/**
 * Retrieves latest readiness session for the user.
 */
export const getLatestSession = async (userId) => {
  return await DecisionReadinessSession.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Retrieves a readiness session by ID, enforcing user ownership.
 */
export const getSessionById = async (sessionId, userId) => {
  return await DecisionReadinessSession.findOne({
    _id: sessionId,
    user: userId,
  }).lean();
};

/**
 * Updates an existing readiness session, recalculating metrics.
 */
export const updateSession = async ({ sessionId, userId, checklist, productName }) => {
  const session = await DecisionReadinessSession.findOne({
    _id: sessionId,
    user: userId,
  });

  if (!session) {
    return null;
  }

  const evaluation = await evaluateReadiness({ userId, productName, checklist });

  session.productName = evaluation.productName;
  session.checklist = evaluation.checklist;
  session.totalCount = evaluation.totalCount;
  session.completedCount = evaluation.completedCount;
  session.unresolvedCount = evaluation.unresolvedCount;
  session.readinessPercentage = evaluation.readinessPercentage;
  session.readinessLevel = evaluation.readinessLevel;
  session.unresolvedItems = evaluation.unresolvedItems;
  session.neutralExplanation = evaluation.neutralExplanation;

  await session.save();

  return session.toObject();
};

/**
 * Retrieves past readiness sessions for the user.
 */
export const getSessionHistory = async (userId) => {
  return await DecisionReadinessSession.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('_id productName totalCount completedCount readinessPercentage readinessLevel createdAt')
    .lean();
};
