// backend/src/services/verification/verificationEngine.js
/**
 * Verification Engine
 *
 * Compares each extracted claim with retrieved evidence and produces
 * a structured verification result for that claim.
 *
 * VERIFICATION STATUS SEMANTICS:
 *
 *   VERIFIED                — evidence supports the claim's factual basis
 *   CONTRADICTED            — evidence directly contradicts the claim
 *   NOT_VERIFIED            — could not find supporting evidence (≠ false)
 *   INSUFFICIENT_EVIDENCE   — partial evidence but not conclusive
 *   MANUAL_CHECK_REQUIRED   — claim needs human expert review
 *   LIVE_CHECK_UNAVAILABLE  — live provider not configured; cannot assess
 *
 * CRITICAL INVARIANT:
 *   "Not found" ≠ "False"
 *   "Risky signals" ≠ "Confirmed scam"
 *   Uncertainty is always preserved and communicated.
 */

import { CLAIM_TYPES } from './claimClassifier.js';
import { PROVIDER_MODES } from './evidenceProvider.js';

export const VERIFICATION_STATUS = {
  VERIFIED: 'VERIFIED',
  CONTRADICTED: 'CONTRADICTED',
  NOT_VERIFIED: 'NOT_VERIFIED',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  MANUAL_CHECK_REQUIRED: 'MANUAL_CHECK_REQUIRED',
  LIVE_CHECK_UNAVAILABLE: 'LIVE_CHECK_UNAVAILABLE',
};

export const UNCERTAINTY_STATES = {
  KNOWN: 'KNOWN',
  SUPPORTED: 'SUPPORTED',
  CONTRADICTED: 'CONTRADICTED',
  UNCERTAIN: 'UNCERTAIN',
  NOT_VERIFIED: 'NOT_VERIFIED',
  LIVE_CHECK_UNAVAILABLE: 'LIVE_CHECK_UNAVAILABLE',
};

// ── Per claim-type assessment rules ─────────────────────────────────────────

/**
 * Determines verification status for a single claim.
 *
 * These rules are deterministic and based on established regulatory facts,
 * not LLM output.
 *
 * @param {object} params
 * @param {string} params.claimType
 * @param {object} params.entities
 * @param {Array}  params.riskSignals
 * @param {string} params.providerMode
 * @param {Array}  params.evidence
 * @returns {{ status, uncertainty, explanation, nextStep }}
 */
export const assessClaimVerification = ({
  claimType,
  entities,
  riskSignals,
  providerMode,
  evidence,
}) => {
  // If live check is unavailable, mark most claims accordingly
  if (providerMode === PROVIDER_MODES.UNAVAILABLE) {
    return assessWithoutLiveProvider({ claimType, entities, riskSignals });
  }

  // LOCAL_TEST or LIVE — apply deterministic rules
  return assessWithRules({ claimType, entities, riskSignals, evidence });
};

/**
 * Deterministic assessment when no live provider is configured.
 * Some claims can still be assessed against known regulatory facts.
 */
function assessWithoutLiveProvider({ claimType, entities, riskSignals }) {
  switch (claimType) {
    case CLAIM_TYPES.GUARANTEED_RETURN:
      return {
        status: VERIFICATION_STATUS.CONTRADICTED,
        uncertainty: UNCERTAINTY_STATES.KNOWN,
        explanation:
          'Guaranteeing investment returns on market-linked products is prohibited under Indian securities law. ' +
          'SEBI regulations explicitly forbid claims of assured or guaranteed returns. ' +
          'This regulatory fact can be verified at sebi.gov.in.',
        nextStep:
          'Do not rely on guaranteed return promises. Verify entity registration at sebi.gov.in before proceeding.',
      };

    case CLAIM_TYPES.CREDENTIAL_REQUEST:
      return {
        status: VERIFICATION_STATUS.CONTRADICTED,
        uncertainty: UNCERTAINTY_STATES.KNOWN,
        explanation:
          'No legitimate bank, SEBI-registered entity, or financial institution will ever ask ' +
          'for your OTP, PIN, or password. This is a known fraud pattern confirmed by RBI advisories.',
        nextStep:
          'Never share OTP, PIN, or passwords with anyone. If shared, contact your bank immediately to block access.',
      };

    case CLAIM_TYPES.REGULATORY_APPROVAL:
      return {
        status: VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE,
        uncertainty: UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE,
        explanation:
          'A regulatory approval claim was detected. ' +
          'Live verification of the specific entity against SEBI/RBI registries was not performed. ' +
          'You can independently verify at sebi.gov.in using the entity name or registration number.',
        nextStep:
          'Verify the SEBI registration number (format: INH/INA/INZ followed by 9 digits) at sebi.gov.in/sebiweb.',
      };

    case CLAIM_TYPES.REGISTRATION_STATUS:
      return {
        status: VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE,
        uncertainty: UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE,
        explanation:
          'A registration status claim was detected. ' +
          'Live verification of the entity against official registries was not performed in this session.',
        nextStep:
          'Verify entity registration at sebi.gov.in, mca.gov.in (company registry), or amfiindia.com.',
      };

    case CLAIM_TYPES.PAYMENT_REQUEST:
      return {
        status: VERIFICATION_STATUS.MANUAL_CHECK_REQUIRED,
        uncertainty: UNCERTAINTY_STATES.UNCERTAIN,
        explanation:
          'A payment or deposit request was detected. Whether this is legitimate depends on ' +
          'whether the requesting entity is verified and the payment channel is official.',
        nextStep:
          'Only make payments to verified entities through official registered payment channels. ' +
          'Verify registration before any payment.',
      };

    case CLAIM_TYPES.URGENCY:
      return {
        status: VERIFICATION_STATUS.NOT_VERIFIED,
        uncertainty: UNCERTAINTY_STATES.UNCERTAIN,
        explanation:
          'Urgency or pressure language detected. ' +
          'Legitimate investment opportunities do not use artificial time pressure to bypass careful decision-making.',
        nextStep:
          'Take time to independently verify all claims before acting. Urgency is often a tactic to prevent verification.',
      };

    case CLAIM_TYPES.PERFORMANCE_CLAIM:
      return {
        status: VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE,
        uncertainty: UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE,
        explanation:
          'A performance or return claim was detected. ' +
          'Verification of specific historical performance data requires access to live data sources, which are not configured.',
        nextStep:
          'Request audited performance records from the entity. Past performance does not guarantee future results.',
      };

    default:
      return {
        status: VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE,
        uncertainty: UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE,
        explanation:
          'This claim could not be verified because live evidence retrieval is not currently configured. ' +
          'The claim content has been analysed for risk signals.',
        nextStep:
          'Exercise caution. Independently verify all claims through official regulatory sources.',
      };
  }
}

/**
 * Assessment with rule-based logic using available evidence.
 * Used when LOCAL_TEST or LIVE provider is active.
 */
function assessWithRules({ claimType, entities, riskSignals, evidence }) {
  // Credential requests are ALWAYS contradicted — this is established regulatory fact
  if (claimType === CLAIM_TYPES.CREDENTIAL_REQUEST) {
    return {
      status: VERIFICATION_STATUS.CONTRADICTED,
      uncertainty: UNCERTAINTY_STATES.KNOWN,
      explanation:
        'Requesting OTP, PIN, or passwords is explicitly contradicted by RBI consumer protection advisories. ' +
        'No legitimate financial institution engages in this behaviour.',
      nextStep:
        'Never share OTP, PIN, or passwords. If already shared, contact your bank immediately.',
    };
  }

  // Guaranteed returns are ALWAYS contradicted — established regulatory fact
  if (claimType === CLAIM_TYPES.GUARANTEED_RETURN) {
    return {
      status: VERIFICATION_STATUS.CONTRADICTED,
      uncertainty: UNCERTAINTY_STATES.KNOWN,
      explanation:
        'Guaranteed return claims on market-linked products are prohibited under SEBI regulations. ' +
        'Evidence from the SEBI regulatory framework directly contradicts this claim type.',
      nextStep:
        'Do not invest based on guaranteed return promises. Verify entity credentials at sebi.gov.in.',
    };
  }

  // If evidence explicitly confirms the claim (official positive record)
  const officialMatch = evidence && evidence.find(
    (e) => e.sourceType === 'OFFICIAL' && e.relevance && e.relevance.toLowerCase().includes('match')
  );
  if (officialMatch) {
    return {
      status: VERIFICATION_STATUS.VERIFIED,
      uncertainty: UNCERTAINTY_STATES.KNOWN,
      explanation:
        `Claim is consistent with official regulatory records: ${officialMatch.sourceDescription}`,
      nextStep:
        'Even with a verified registered entity, always confirm that payment details match the official bank accounts of the entity.',
    };
  }

  // If empty evidence provided, mark as NOT_VERIFIED
  if (!evidence || evidence.length === 0) {
    return {
      status: VERIFICATION_STATUS.NOT_VERIFIED,
      uncertainty: UNCERTAINTY_STATES.NOT_VERIFIED,
      explanation:
        'No supporting evidence was found in available records. This does not confirm fraud, but independent verification is missing.',
      nextStep:
        'Do not commit funds or share credentials until the platform and claim are independently verified.',
    };
  }

  // For other types, use insufficient evidence status (LOCAL_TEST doesn't have live specifics)
  return {
    status: VERIFICATION_STATUS.INSUFFICIENT_EVIDENCE,
    uncertainty: UNCERTAINTY_STATES.UNCERTAIN,
    explanation:
      `The claim was analysed but sufficient evidence to confirm or contradict the specific assertion ` +
      `was not available. Risk signals detected may indicate concern areas requiring further verification.`,
    nextStep:
      'Independently verify claims through official sources before making any financial decision.',
  };
}

/**
 * Determines the overall verification status across all claim results.
 *
 * Priority:
 *   CONTRADICTED > NOT_VERIFIED > INSUFFICIENT_EVIDENCE >
 *   MANUAL_CHECK_REQUIRED > LIVE_CHECK_UNAVAILABLE > VERIFIED > MIXED
 */
export const determineOverallStatus = (claimResults) => {
  if (!claimResults || claimResults.length === 0) return VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE;

  const statuses = claimResults.map((c) => c.status);
  const unique = [...new Set(statuses)];

  // Single status — straightforward
  if (unique.length === 1) return unique[0];

  // Priority hierarchy
  if (statuses.includes(VERIFICATION_STATUS.CONTRADICTED)) {
    // If any are contradicted but others are not all contradicted, it's MIXED
    if (statuses.some((s) => s !== VERIFICATION_STATUS.CONTRADICTED)) {
      return 'MIXED';
    }
    return VERIFICATION_STATUS.CONTRADICTED;
  }

  if (statuses.includes(VERIFICATION_STATUS.NOT_VERIFIED)) return VERIFICATION_STATUS.NOT_VERIFIED;
  if (statuses.includes(VERIFICATION_STATUS.INSUFFICIENT_EVIDENCE)) return VERIFICATION_STATUS.INSUFFICIENT_EVIDENCE;
  if (statuses.includes(VERIFICATION_STATUS.MANUAL_CHECK_REQUIRED)) return VERIFICATION_STATUS.MANUAL_CHECK_REQUIRED;
  if (statuses.includes(VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE)) return VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE;

  return VERIFICATION_STATUS.VERIFIED;
};

/**
 * Determines the overall uncertainty state across all claim results.
 */
export const determineOverallUncertainty = (claimResults) => {
  if (!claimResults || claimResults.length === 0) return UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE;

  const uncertainties = claimResults.map((c) => c.uncertainty);

  // KNOWN takes highest precedence if all agree
  if (uncertainties.every((u) => u === UNCERTAINTY_STATES.KNOWN)) return UNCERTAINTY_STATES.KNOWN;
  if (uncertainties.includes(UNCERTAINTY_STATES.CONTRADICTED)) return UNCERTAINTY_STATES.CONTRADICTED;
  if (uncertainties.includes(UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE)) return UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE;
  if (uncertainties.includes(UNCERTAINTY_STATES.UNCERTAIN)) return UNCERTAINTY_STATES.UNCERTAIN;
  if (uncertainties.includes(UNCERTAINTY_STATES.NOT_VERIFIED)) return UNCERTAINTY_STATES.NOT_VERIFIED;

  return UNCERTAINTY_STATES.UNCERTAIN;
};
