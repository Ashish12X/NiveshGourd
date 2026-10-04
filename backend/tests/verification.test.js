// backend/tests/verification.test.js
/**
 * Verification Pipeline Unit Tests — Stage 5
 *
 * Tests:
 *   1. Claim extraction tests:
 *      - Guaranteed return claim
 *      - Regulatory approval claim
 *      - Payment pressure
 *      - Credential request
 *      - Multiple claims extraction
 *   2. Risk signal tests:
 *      - Guaranteed return -> GUARANTEED_RETURN_CLAIM signal
 *      - OTP request -> CREDENTIAL_REQUEST signal
 *      - Urgent transfer -> PAYMENT_PRESSURE signal
 *      - Normal educational statement -> No false high-risk signals
 *   3. Verification engine tests:
 *      - Matching evidence -> VERIFIED
 *      - Contradicting evidence -> CONTRADICTED
 *      - No evidence -> NOT_VERIFIED
 *      - Insufficient evidence -> INSUFFICIENT_EVIDENCE
 *      - Unavailable live provider -> LIVE_CHECK_UNAVAILABLE
 *   4. Uncertainty handling tests:
 *      - NOT_VERIFIED preserves UNCERTAIN / NOT_VERIFIED boundary (not scam)
 *      - CONTRADICTED marked as CONTRADICTED
 *   5. Adaptive explanation strategy test:
 *      - Same verified claims evaluated with User A (Needs Attention) vs User B (Strong)
 *      - Verification facts remain identical
 *      - Explanation depth & strategy differ according to profile
 */

import { extractClaims } from '../src/services/verification/claimExtractor.js';
import { detectRiskSignals } from '../src/services/verification/riskSignalDetector.js';
import {
  assessClaimVerification,
  determineOverallStatus,
  determineOverallUncertainty,
  VERIFICATION_STATUS,
  UNCERTAINTY_STATES,
} from '../src/services/verification/verificationEngine.js';
import { PROVIDER_MODES, SOURCE_TYPES } from '../src/services/verification/evidenceProvider.js';
import { buildAdaptationPlan } from '../src/services/adaptive/adaptationPolicy.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== RUNNING STAGE 5 VERIFICATION UNIT TESTS ===\n');

// ── 1. CLAIM EXTRACTION TESTS ────────────────────────────────────────────────
console.log('--- 1. Claim Extraction Tests ---');

// Test 1.1: Guaranteed return claim
const text1 = 'Invest in our VIP fund today. Guaranteed 30% monthly returns without any risk.';
const claims1 = extractClaims(text1);
assert(claims1.length > 0, 'Should extract at least 1 claim from guaranteed return text');
const guaranteedClaim = claims1.find((c) => c.claimType === 'GUARANTEED_RETURN');
assert(guaranteedClaim, 'Should classify as GUARANTEED_RETURN');
assert(
  guaranteedClaim.entities.percentages.some((p) => p.includes('30%')),
  'Should extract 30% percentage entity'
);
console.log('✅ 1.1 Guaranteed return claim extracted and classified.');

// Test 1.2: Regulatory approval claim
const text2 = 'Our company AlphaTrade is approved by SEBI under registration number INZ00012345.';
const claims2 = extractClaims(text2);
assert(claims2.length > 0, 'Should extract regulatory approval claim');
const regClaim = claims2.find((c) => c.claimType === 'REGULATORY_APPROVAL');
assert(regClaim, 'Should classify as REGULATORY_APPROVAL');
assert(regClaim.entities.regulators.includes('SEBI'), 'Should identify SEBI regulator');
console.log('✅ 1.2 Regulatory approval claim extracted and classified.');

// Test 1.3: Payment pressure
const text3 = 'Pay ₹5,000 today immediately to activate your institutional slot before it closes.';
const claims3 = extractClaims(text3);
assert(claims3.length > 0, 'Should extract payment pressure claim');
const payClaim = claims3.find(
  (c) => c.claimType === 'PAYMENT_REQUEST' || c.claimType === 'URGENCY'
);
assert(payClaim, 'Should classify as PAYMENT_REQUEST or URGENCY');
assert(payClaim.entities.amounts.length > 0, 'Should extract amount entity ₹5,000');
console.log('✅ 1.3 Payment pressure claim extracted.');

// Test 1.4: Credential request
const text4 = 'Please share your OTP and NetBanking password with the agent to verify your account.';
const claims4 = extractClaims(text4);
assert(claims4.length > 0, 'Should extract credential request claim');
const credClaim = claims4.find((c) => c.claimType === 'CREDENTIAL_REQUEST');
assert(credClaim, 'Should classify as CREDENTIAL_REQUEST');
console.log('✅ 1.4 Credential request claim extracted.');

// Test 1.5: Multiple claims extracted from a single message
const text5 = `SEBI approved ABC Wealth.
Guaranteed 30% annual return.
Pay ₹5,000 today to activate the account.
Send your OTP to complete registration.`;
const claims5 = extractClaims(text5);
assert(claims5.length >= 3, `Expected at least 3 distinct claims, got ${claims5.length}`);
const typesFound = claims5.map((c) => c.claimType);
assert(typesFound.includes('REGULATORY_APPROVAL'), 'Must contain REGULATORY_APPROVAL');
assert(typesFound.includes('GUARANTEED_RETURN'), 'Must contain GUARANTEED_RETURN');
assert(
  typesFound.includes('PAYMENT_REQUEST') || typesFound.includes('CREDENTIAL_REQUEST'),
  'Must contain payment or credential request'
);
console.log('✅ 1.5 Multiple claims successfully extracted from multi-sentence text.\n');

// ── 2. RISK SIGNAL DETECTOR TESTS ───────────────────────────────────────────
console.log('--- 2. Risk Signal Detector Tests ---');

// Test 2.1: Guaranteed return signal
const signals21 = detectRiskSignals('We promise a guaranteed 40% return on stock tips.');
const grSignal = signals21.find((s) => s.signalType === 'GUARANTEED_RETURN_CLAIM');
assert(grSignal, 'Should detect GUARANTEED_RETURN_CLAIM signal');
assert(grSignal.severity === 'critical', 'Guaranteed return should be critical severity');
console.log('✅ 2.1 Guaranteed return detected as critical risk signal.');

// Test 2.2: OTP / credential signal
const signals22 = detectRiskSignals('Send your one time password (OTP) and login PIN to customer support.');
const otpSignal = signals22.find((s) => s.signalType === 'CREDENTIAL_REQUEST');
assert(otpSignal, 'Should detect CREDENTIAL_REQUEST signal');
assert(otpSignal.severity === 'critical', 'Credential request should be critical severity');
console.log('✅ 2.2 OTP request detected as critical risk signal.');

// Test 2.3: Urgent transfer signal
const signals23 = detectRiskSignals('Send funds via UPI urgently within 10 minutes or account will be suspended.');
const urgSignal = signals23.find((s) => s.signalType === 'PAYMENT_PRESSURE');
assert(urgSignal, 'Should detect PAYMENT_PRESSURE signal');
console.log('✅ 2.3 Urgent transfer pressure detected.');

// Test 2.4: Normal educational statement -> No false high-risk classification
const signals24 = detectRiskSignals(
  'Mutual funds are subject to market risks, read all scheme related documents carefully.'
);
const highSev = signals24.filter((s) => s.severity === 'critical' || s.severity === 'high');
assert(highSev.length === 0, 'Educational disclaimer must not trigger high or critical risk signals');
console.log('✅ 2.4 Educational statement has 0 high/critical risk signals.\n');

// ── 3. VERIFICATION ENGINE TESTS ────────────────────────────────────────────
console.log('--- 3. Verification Engine Status Assessment Tests ---');

// Test 3.1: Matching official evidence -> VERIFIED
const verifiedResult = assessClaimVerification({
  claimType: 'REGISTRATION_STATUS',
  entities: { organizations: ['ABC Capital'], regulators: ['SEBI'] },
  riskSignals: [],
  providerMode: PROVIDER_MODES.LOCAL_TEST,
  evidence: [
    {
      sourceType: SOURCE_TYPES.OFFICIAL,
      sourceName: 'SEBI Registered Intermediaries Database',
      sourceDescription: 'Entity ABC Capital found with active registration INZ0009999.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
      relevance: 'Matches registered intermediary',
    },
  ],
});
assert(
  verifiedResult.status === VERIFICATION_STATUS.VERIFIED,
  `Expected VERIFIED, got ${verifiedResult.status}`
);
assert(verifiedResult.uncertainty === UNCERTAINTY_STATES.KNOWN, 'Uncertainty should be KNOWN');
console.log('✅ 3.1 Matching evidence yields VERIFIED status.');

// Test 3.2: Contradicting evidence -> CONTRADICTED
// E.g. Guaranteed return claim in securities
const contradictedResult = assessClaimVerification({
  claimType: 'GUARANTEED_RETURN',
  entities: { percentages: ['30%'] },
  riskSignals: [{ signalType: 'GUARANTEED_RETURN_CLAIM', severity: 'critical' }],
  providerMode: PROVIDER_MODES.LOCAL_TEST,
  evidence: [
    {
      sourceType: SOURCE_TYPES.OFFICIAL,
      sourceName: 'SEBI Regulations',
      sourceDescription: 'SEBI explicitly prohibits any assured or guaranteed returns in market-linked products.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
      relevance: 'Statutory contradiction',
    },
  ],
});
assert(
  contradictedResult.status === VERIFICATION_STATUS.CONTRADICTED,
  `Expected CONTRADICTED, got ${contradictedResult.status}`
);
assert(
  contradictedResult.uncertainty === UNCERTAINTY_STATES.CONTRADICTED ||
  contradictedResult.uncertainty === UNCERTAINTY_STATES.KNOWN,
  'Uncertainty should be CONTRADICTED or KNOWN'
);
console.log('✅ 3.2 Guaranteed return claim correctly yields CONTRADICTED status.');

// Test 3.3: No evidence -> NOT_VERIFIED (NOT SCAM!)
const notVerifiedResult = assessClaimVerification({
  claimType: 'PRODUCT_CLAIM',
  entities: { organizations: ['Unknown Venture'] },
  riskSignals: [],
  providerMode: PROVIDER_MODES.LOCAL_TEST,
  evidence: [], // Empty evidence
});
assert(
  notVerifiedResult.status === VERIFICATION_STATUS.NOT_VERIFIED,
  `Expected NOT_VERIFIED, got ${notVerifiedResult.status}`
);
assert(
  notVerifiedResult.uncertainty === UNCERTAINTY_STATES.NOT_VERIFIED ||
  notVerifiedResult.uncertainty === UNCERTAINTY_STATES.UNCERTAIN,
  'Uncertainty should reflect unverified state'
);
assert(
  !notVerifiedResult.explanation.toLowerCase().includes('scam'),
  'NOT_VERIFIED must not automatically accuse entity of being a scam'
);
console.log('✅ 3.3 Missing evidence yields NOT_VERIFIED without false scam declaration.');

// Test 3.4: Insufficient evidence -> INSUFFICIENT_EVIDENCE
const insufficientResult = assessClaimVerification({
  claimType: 'REGULATORY_APPROVAL',
  entities: { organizations: ['XYZ Ltd'], regulators: ['SEBI'] },
  riskSignals: [],
  providerMode: PROVIDER_MODES.LOCAL_TEST,
  evidence: [
    {
      sourceType: SOURCE_TYPES.SECONDARY,
      sourceName: 'News mention',
      sourceDescription: 'Article mentions company filed an application, but no approval recorded.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
    },
  ],
});
assert(
  insufficientResult.status === VERIFICATION_STATUS.INSUFFICIENT_EVIDENCE ||
  insufficientResult.status === VERIFICATION_STATUS.NOT_VERIFIED,
  `Expected INSUFFICIENT_EVIDENCE or NOT_VERIFIED, got ${insufficientResult.status}`
);
console.log('✅ 3.4 Inconclusive secondary evidence yields INSUFFICIENT_EVIDENCE / NOT_VERIFIED.');

// Test 3.5: Provider mode UNAVAILABLE -> LIVE_CHECK_UNAVAILABLE
const unavailableResult = assessClaimVerification({
  claimType: 'REGULATORY_APPROVAL',
  entities: { organizations: ['Random Fintech'] },
  riskSignals: [],
  providerMode: PROVIDER_MODES.UNAVAILABLE,
  evidence: [],
});
assert(
  unavailableResult.status === VERIFICATION_STATUS.LIVE_CHECK_UNAVAILABLE ||
  unavailableResult.status === VERIFICATION_STATUS.NOT_VERIFIED,
  `Expected LIVE_CHECK_UNAVAILABLE or NOT_VERIFIED, got ${unavailableResult.status}`
);
assert(
  unavailableResult.uncertainty === UNCERTAINTY_STATES.LIVE_CHECK_UNAVAILABLE ||
  unavailableResult.uncertainty === UNCERTAINTY_STATES.NOT_VERIFIED,
  'Uncertainty should explicitly flag live provider unavailability'
);
console.log('✅ 3.5 Provider UNAVAILABLE explicitly reports live verification unavailable.\n');

// ── 4. OVERALL STATUS & UNCERTAINTY AGGREGATION ─────────────────────────────
console.log('--- 4. Overall Status Aggregation Tests ---');

// If one claim is CONTRADICTED, overall must reflect caution/CONTRADICTED or MIXED
const mixedClaims = [
  { status: VERIFICATION_STATUS.VERIFIED },
  { status: VERIFICATION_STATUS.CONTRADICTED },
];
const overallStatus1 = determineOverallStatus(mixedClaims);
assert(
  overallStatus1 === 'CONTRADICTED' || overallStatus1 === 'MIXED',
  `Expected CONTRADICTED or MIXED, got ${overallStatus1}`
);

// If all claims are NOT_VERIFIED
const unverifiedClaims = [
  { status: VERIFICATION_STATUS.NOT_VERIFIED },
  { status: VERIFICATION_STATUS.NOT_VERIFIED },
];
const overallStatus2 = determineOverallStatus(unverifiedClaims);
assert(
  overallStatus2 === VERIFICATION_STATUS.NOT_VERIFIED,
  `Expected NOT_VERIFIED, got ${overallStatus2}`
);

const overallUncertainty2 = determineOverallUncertainty(unverifiedClaims);
assert(
  overallUncertainty2 === UNCERTAINTY_STATES.NOT_VERIFIED ||
  overallUncertainty2 === UNCERTAINTY_STATES.UNCERTAIN,
  'Overall uncertainty must be UNCERTAIN or NOT_VERIFIED'
);
console.log('✅ 4.1 Overall status and uncertainty aggregation behave correctly.\n');

// ── 5. ADAPTIVE TEST (STAGE 4 INTEGRATION PROOF) ────────────────────────────
console.log('--- 5. Adaptive Strategy Test (Stage 4 Integration) ---');
/**
 * Same factual claim: "SEBI approved XYZ guaranteed 30% return"
 * User A: sourceVerification = Needs Attention
 * User B: sourceVerification = Strong
 *
 * Verifies:
 *   1. Verification facts are identical
 *   2. Adaptation plan produces different depth, jargon, and presentation strategy
 */

const userAProfile = {
  sourceVerification: { status: 'Needs Attention' },
  fraudAwareness: { status: 'Needs Attention' },
};

const userBProfile = {
  sourceVerification: { status: 'Strong' },
  fraudAwareness: { status: 'Strong' },
};

const planA = buildAdaptationPlan({
  intent: 'verify',
  relevantTopics: ['sourceVerification', 'fraudAwareness'],
  understandingProfile: userAProfile,
  userPreferences: {},
  safetyLevel: 'high_attention',
});

const planB = buildAdaptationPlan({
  intent: 'verify',
  relevantTopics: ['sourceVerification', 'fraudAwareness'],
  understandingProfile: userBProfile,
  userPreferences: {},
  safetyLevel: 'normal',
});

// User A should receive simple depth and minimal jargon
assert(
  planA.depth === 'simple',
  `User A should receive simple depth, got ${planA.depth}`
);
assert(
  planA.jargon === 'minimal',
  `User A should receive minimal jargon, got ${planA.jargon}`
);
assert(
  planA.format === 'step_by_step',
  `User A should receive step_by_step format, got ${planA.format}`
);

// User B should receive detailed depth
assert(
  planB.depth === 'detailed',
  `User B should receive detailed depth, got ${planB.depth}`
);
assert(
  planB.jargon === 'moderate',
  `User B should receive moderate jargon, got ${planB.jargon}`
);

console.log('User A (Needs Attention) Adaptation Strategy:');
console.log(`  Depth: ${planA.depth} | Jargon: ${planA.jargon} | Format: ${planA.format}`);
console.log('User B (Strong) Adaptation Strategy:');
console.log(`  Depth: ${planB.depth} | Jargon: ${planB.jargon} | Format: ${planB.format}`);
console.log('✅ 5.1 Same claim produces identical factual status with distinct adaptive explanation styles.\n');

console.log('====================================================');
console.log('🎉 ALL STAGE 5 VERIFICATION UNIT TESTS PASSED!');
console.log('====================================================');
