// backend/src/services/compare/compareService.js
/**
 * Comparison Service — Stage 7
 *
 * Implements the core logic for Adaptive Compare:
 *   1. Verified statutory catalog retrieval
 *   2. Strict factual comparison generation without winner selection
 *   3. Authoritative source and uncertainty attribution
 *   4. UnderstandingProfile-adapted neutral explanations
 *   5. Cross-user session persistence and isolation
 */

import { COMPARISON_PRODUCTS, COMPARISON_CRITERIA } from '../../data/compareCatalog.js';
import ComparisonSession from '../../models/ComparisonSession.js';
import UnderstandingProfile from '../../models/UnderstandingProfile.js';

/**
 * Returns available products and comparison criteria.
 */
export const getCatalog = () => {
  const products = COMPARISON_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    shortName: p.shortName,
    category: p.category,
    regulatedBy: p.regulatedBy,
    isRegulated: p.isRegulated,
  }));

  return {
    products,
    criteria: COMPARISON_CRITERIA,
  };
};

/**
 * Performs a factual comparison between two items based on user-selected criteria.
 * Adapts the explanation depth to the user's UnderstandingProfile without altering any facts.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.productAId
 * @param {string} params.productBId
 * @param {string[]} [params.criteria]
 * @returns {Promise<object>}
 */
export const performComparison = async ({
  userId,
  productAId,
  productBId,
  criteria,
}) => {
  if (!productAId || !productBId) {
    throw new Error('Both Product A and Product B must be selected.');
  }

  if (productAId === productBId) {
    throw new Error('Please select two distinct products to compare.');
  }

  const productA = COMPARISON_PRODUCTS.find((p) => p.id === productAId);
  const productB = COMPARISON_PRODUCTS.find((p) => p.id === productBId);

  if (!productA) {
    throw new Error(`Product '${productAId}' not found in verified catalog.`);
  }
  if (!productB) {
    throw new Error(`Product '${productBId}' not found in verified catalog.`);
  }

  // Determine active criteria (default to all if not provided or empty)
  const validKeys = new Set(COMPARISON_CRITERIA.map((c) => c.key));
  let selectedKeys = Array.isArray(criteria) && criteria.length > 0
    ? criteria.filter((k) => validKeys.has(k))
    : COMPARISON_CRITERIA.map((c) => c.key);

  if (selectedKeys.length === 0) {
    selectedKeys = COMPARISON_CRITERIA.map((c) => c.key);
  }

  // Build factual comparison matrix with authoritative sources & uncertainty
  const comparisonMatrix = selectedKeys.map((key) => {
    const criterionDef = COMPARISON_CRITERIA.find((c) => c.key === key);
    const attrA = productA.attributes[key] || {
      value: 'Information not verified',
      source: 'Source unavailable',
      sourceType: 'UNVERIFIED',
      uncertainty: 'HIGH_UNCERTAINTY',
      lastVerifiedAt: null,
    };
    const attrB = productB.attributes[key] || {
      value: 'Information not verified',
      source: 'Source unavailable',
      sourceType: 'UNVERIFIED',
      uncertainty: 'HIGH_UNCERTAINTY',
      lastVerifiedAt: null,
    };

    return {
      criterionKey: key,
      criterionLabel: criterionDef?.label || key,
      itemA: {
        value: attrA.value,
        source: attrA.source,
        sourceType: attrA.sourceType,
        uncertainty: attrA.uncertainty,
        lastVerifiedAt: attrA.lastVerifiedAt,
      },
      itemB: {
        value: attrB.value,
        source: attrB.source,
        sourceType: attrB.sourceType,
        uncertainty: attrB.uncertainty,
        lastVerifiedAt: attrB.lastVerifiedAt,
      },
    };
  });

  // Load user's UnderstandingProfile to adapt explanation depth
  let profile = null;
  if (userId) {
    profile = await UnderstandingProfile.findOne({ user: userId }).lean();
  }

  const riskStatus = profile?.topics?.riskReturn?.status || 'Not Assessed';
  const sourceStatus = profile?.topics?.sourceVerification?.status || 'Not Assessed';

  // Adaptation parameters (Neutral explanation depth)
  let depth = 'standard';
  let jargon = 'moderate';

  if (riskStatus === 'Needs Attention' || sourceStatus === 'Needs Attention') {
    depth = 'simple';
    jargon = 'minimal';
  } else if (riskStatus === 'Strong' && sourceStatus === 'Strong') {
    depth = 'detailed';
    jargon = 'technical';
  }

  // Generate neutral explanation adapted to user profile
  const neutralExplanation = generateNeutralExplanation({
    productA,
    productB,
    depth,
    jargon,
    selectedKeys,
  });

  // Suggested contextual bridges
  const suggestedBridges = [];

  // Bridge 1: Validity Check if either product is unregulated or carries high uncertainty
  if (!productA.isRegulated || !productB.isRegulated) {
    suggestedBridges.push({
      type: 'VALIDITY_CHECK',
      label: 'Verify Unregistered Schemes with Validity Check',
      url: '/validity-check',
      description: 'Check suspicious offers, unregistered telegram groups, or claims against SEBI/RBI registries.',
    });
  }

  // Bridge 2: Decision Readiness Checklist
  suggestedBridges.push({
    type: 'DECISION_READINESS',
    label: 'Check Pre-Action Decision Readiness',
    url: '/decision-readiness',
    description: 'Ensure you have gathered all critical information and evaluated trade-offs before acting.',
  });

  // Bridge 3: Ask SANGYAN
  suggestedBridges.push({
    type: 'ASK_SANGYAN',
    label: 'Ask SANGYAN about these terms',
    url: '/ask',
    description: 'Get adaptive explanations on specific regulatory rules, tax clauses, or liquidity mechanisms.',
  });

  // Bridge 4: Learning module if user has learning gaps
  if (riskStatus === 'Needs Attention') {
    suggestedBridges.push({
      type: 'LEARN',
      label: 'Learn: Risk & Return Mechanics',
      url: '/learn/topic/recognizing-guaranteed-return-myths',
      description: 'Understand the fundamental trade-off between capital safety and market returns.',
    });
  }

  // Persist session if user is authenticated
  let sessionId = null;
  if (userId) {
    const session = await ComparisonSession.create({
      user: userId,
      productAId: productA.id,
      productBId: productB.id,
      productAName: productA.name,
      productBName: productB.name,
      selectedCriteria: selectedKeys,
      comparisonMatrix,
      neutralExplanation,
      adaptationMetadata: {
        depth,
        jargon,
        format: 'structured',
        profileTopicStatus: riskStatus,
      },
      suggestedBridges,
    });
    sessionId = session._id;
  }

  return {
    sessionId,
    productA: {
      id: productA.id,
      name: productA.name,
      shortName: productA.shortName,
      category: productA.category,
      regulatedBy: productA.regulatedBy,
      isRegulated: productA.isRegulated,
    },
    productB: {
      id: productB.id,
      name: productB.name,
      shortName: productB.shortName,
      category: productB.category,
      regulatedBy: productB.regulatedBy,
      isRegulated: productB.isRegulated,
    },
    selectedCriteria: selectedKeys,
    comparisonMatrix,
    neutralExplanation,
    adaptationMetadata: {
      depth,
      jargon,
      format: 'structured',
      profileTopicStatus: riskStatus,
    },
    suggestedBridges,
    guardrailNotice:
      'Neutral Fact Mandate: SANGYAN does not declare winners or rank investments. Every financial avenue has distinct trade-offs between risk, liquidity, and regulatory backing.',
  };
};

/**
 * Generates a neutral, factual comparison explanation tailored to the user's adaptation depth.
 * NEVER declares winners, best choices, or gives investment advice.
 */
function generateNeutralExplanation({ productA, productB, depth, jargon, selectedKeys }) {
  const parts = [];

  // Mandate header
  parts.push('### Factual Comparison Overview');

  if (depth === 'simple') {
    parts.push(
      `This comparison places **${productA.name}** side-by-side with **${productB.name}** across your chosen points of interest.`
    );
    parts.push(
      `**Core Structural Differences:**\n` +
      `- **${productA.name}:** Regulated by ${productA.regulatedBy}. Capital protection and withdrawal rules are set by statutory rules.\n` +
      `- **${productB.name}:** Regulated by ${productB.regulatedBy}. ${
        !productB.isRegulated
          ? 'Notice that this option does NOT have official regulatory oversight or investor protection.'
          : 'Terms and risks operate under a completely different regulatory framework.'
      }`
    );
    parts.push(
      `**Key Takeaway for Decision Making:** There is no single "best" option. Safe decisions depend on whether you need immediate access to your money, how much risk you can take, and whether the provider is officially registered with Indian authorities.`
    );
  } else if (depth === 'detailed') {
    parts.push(
      `Factual side-by-side analysis of statutory characteristics: **${productA.name}** vs. **${productB.name}**.`
    );
    parts.push(
      `**Regulatory & Custody Architecture:**\n` +
      `- **Primary Regulator:** ${productA.name} is governed under ${productA.regulatedBy}, whereas ${productB.name} falls under ${productB.regulatedBy}.\n` +
      `- **Statutory Protection:** ${
        productA.isRegulated ? 'Standard legal recourse and statutory grievance bodies apply.' : 'No statutory recourse.'
      } In contrast, ${
        productB.isRegulated ? 'Standard legal recourse and statutory grievance bodies apply.' : 'Absence of statutory registration means no protection under SEBI/RBI investor funds.'
      }\n` +
      `- **Risk vs. Liquidity Trade-off:** Review the tax treatment, lock-in provisions, and documented uncertainties listed in the matrix above before committing capital.`
    );
    parts.push(
      `**Mandate:** SANGYAN provides objective factual transparency. It is the investor's responsibility to verify official documentation and assess individual liquidity horizons.`
    );
  } else {
    // Standard
    parts.push(
      `Comparing **${productA.name}** and **${productB.name}** based on documented regulatory and contractual terms.`
    );
    parts.push(
      `**Key Factual Observations:**\n` +
      `- **Oversight:** ${productA.name} operates under ${productA.regulatedBy}; ${productB.name} operates under ${productB.regulatedBy}.\n` +
      `- **Risk Structure:** Factual differences exist across capital insurance, market volatility, liquidity access, and exit conditions.`
    );
    parts.push(
      `**Neutral Guidance:** Review the authoritative sources in the table to confirm these attributes on official government and regulatory portals.`
    );
  }

  return parts.join('\n\n');
}

/**
 * Retrieves a past comparison session by ID, enforcing user ownership.
 */
export const getComparisonSession = async (sessionId, userId) => {
  const session = await ComparisonSession.findOne({
    _id: sessionId,
    user: userId,
  }).lean();

  if (!session) {
    return null;
  }

  return session;
};

/**
 * Retrieves past comparison sessions for the user (most recent first).
 */
export const getComparisonHistory = async (userId) => {
  const sessions = await ComparisonSession.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('_id productAId productBId productAName productBName selectedCriteria createdAt')
    .lean();

  return sessions;
};
