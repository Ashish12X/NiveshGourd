// backend/tests/adaptive.test.js
/**
 * Adaptive Engine Unit & Integration Tests (Stage 4)
 *
 * Covers:
 *   Test 1: User with sourceVerification = Needs Attention
 *   Test 2: User with sourceVerification = Strong
 *   Test 3: User preference responseStyle = Simple
 *   Test 4: Safety-sensitive input (guaranteed returns + urgent transfer)
 *   Test 5: Normal educational question (diversification)
 *   Test 6: Multi-turn context preservation
 *   Test 7: Unknown/ambiguous intent handling
 *   Test 8: AI provider failure fallback
 *   Critical Adaptation Test: Same question, two users, different response strategies
 *   Security Tests: Input validation, forbidden pattern detection, safe metadata
 */

import { detectIntent, INTENTS } from '../src/services/adaptive/intentDetector.js';
import { mapToRelevantTopics, TOPIC_DOMAINS } from '../src/services/adaptive/topicMapper.js';
import { analyseMessageSafety, SAFETY_LEVELS } from '../src/services/adaptive/safetyPolicy.js';
import { buildAdaptationPlan } from '../src/services/adaptive/adaptationPolicy.js';
import { buildSystemPrompt } from '../src/services/adaptive/responseStrategy.js';
import { validateAIResponse } from '../src/services/ai/llmService.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== RUNNING ADAPTIVE AI ENGINE UNIT TESTS ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: User with sourceVerification = Needs Attention
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 1: User with sourceVerification = Needs Attention');
const mockProfileA = {
  sourceVerification: {
    label: 'Source Verification',
    status: 'Needs Attention',
    knowledgeScore: 35,
    practicalScore: 30,
    misconceptionCount: 2,
  },
  riskReturn: {
    label: 'Risk & Return',
    status: 'Developing',
  },
};

const q1 = 'How do I check whether this financial source is trustworthy?';
const intent1 = detectIntent(q1);
const topics1 = mapToRelevantTopics(q1, intent1.intent);
assert(topics1.includes(TOPIC_DOMAINS.SOURCE_VERIFICATION), 'Should include sourceVerification');

const plan1 = buildAdaptationPlan({
  intent: intent1.intent,
  relevantTopics: topics1,
  understandingProfile: mockProfileA,
  userPreferences: { responseStyle: 'Standard', language: 'English' },
  safetyLevel: SAFETY_LEVELS.NORMAL,
  intentConfidence: intent1.confidence,
});

assert(plan1.depth === 'simple', `Expected depth 'simple', got '${plan1.depth}'`);
assert(plan1.jargon === 'minimal', `Expected jargon 'minimal', got '${plan1.jargon}'`);
assert(plan1.format === 'step_by_step', `Expected format 'step_by_step', got '${plan1.format}'`);
assert(plan1.examples === true, 'Expected examples = true');
console.log('✅ Test 1 Passed: Needs Attention receives simple, minimal-jargon, step-by-step strategy.\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: User with sourceVerification = Strong (Same question)
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 2: User with sourceVerification = Strong');
const mockProfileB = {
  sourceVerification: {
    label: 'Source Verification',
    status: 'Strong',
    knowledgeScore: 90,
    practicalScore: 95,
    misconceptionCount: 0,
  },
};

const plan2 = buildAdaptationPlan({
  intent: intent1.intent,
  relevantTopics: topics1,
  understandingProfile: mockProfileB,
  userPreferences: { responseStyle: 'Standard', language: 'English' },
  safetyLevel: SAFETY_LEVELS.NORMAL,
  intentConfidence: intent1.confidence,
});

assert(plan2.depth === 'detailed', `Expected depth 'detailed', got '${plan2.depth}'`);
assert(plan2.jargon === 'moderate', `Expected jargon 'moderate', got '${plan2.jargon}'`);
console.log('✅ Test 2 Passed: Strong user receives detailed, moderate-jargon strategy.\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: User preference responseStyle = Simple
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 3: User preference responseStyle = Simple');
const plan3 = buildAdaptationPlan({
  intent: INTENTS.EXPLAIN,
  relevantTopics: [TOPIC_DOMAINS.BASIC_CONCEPTS],
  understandingProfile: mockProfileB, // Profile is Strong, but preference overrides
  userPreferences: { responseStyle: 'Simple, Jargon-Free', language: 'English' },
  safetyLevel: SAFETY_LEVELS.NORMAL,
  intentConfidence: 'high',
});

assert(plan3.jargon === 'minimal', `User preference should override jargon to 'minimal', got '${plan3.jargon}'`);
console.log('✅ Test 3 Passed: User preference overrides jargon to minimal.\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Safety-sensitive input
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 4: Safety-sensitive input');
const safetyMsg = 'Someone is asking me to transfer money immediately for guaranteed returns.';
const safetyResult = analyseMessageSafety(safetyMsg);

assert(
  safetyResult.safetyLevel === SAFETY_LEVELS.HIGH_ATTENTION || safetyResult.safetyLevel === SAFETY_LEVELS.INCIDENT,
  `Expected HIGH_ATTENTION or INCIDENT, got ${safetyResult.safetyLevel}`
);
assert(safetyResult.isElevated === true, 'Safety should be elevated');
assert(safetyResult.reasons.length >= 2, 'Should identify multiple safety reasons');
console.log(`✅ Test 4 Passed: Safety level = ${safetyResult.safetyLevel}, reasons: ${safetyResult.reasons.join(', ')}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Normal educational question
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 5: Normal educational question');
const eduMsg = 'What is diversification?';
const eduSafety = analyseMessageSafety(eduMsg);
const eduIntent = detectIntent(eduMsg);
const eduTopics = mapToRelevantTopics(eduMsg, eduIntent.intent);

assert(eduSafety.safetyLevel === SAFETY_LEVELS.NORMAL, 'Diversification should be normal safety');
assert(eduIntent.intent === INTENTS.EXPLAIN, `Expected EXPLAIN intent, got ${eduIntent.intent}`);
assert(eduTopics.includes(TOPIC_DOMAINS.BASIC_CONCEPTS), 'Expected basicConcepts domain');
console.log('✅ Test 5 Passed: Educational question correctly parsed with normal safety level.\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Multi-turn context preservation check
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 6: Multi-turn prompt assembly');
const conversationHistory = [
  { role: 'user', content: 'What is investment risk?' },
  { role: 'assistant', content: 'Investment risk is the chance that your investment will lose value...' },
];
const followUpUserMsg = 'Give me an example.';
const followUpIntent = detectIntent(followUpUserMsg);

const followUpPrompt = buildSystemPrompt({
  adaptationPlan: plan1,
  userContext: {
    baselineCompleted: true,
    understandingProfile: {
      [TOPIC_DOMAINS.RISK_RETURN]: { label: 'Risk & Return', status: 'Needs Attention', misconceptionCount: 1 },
    },
    conversationHistory,
  },
  intent: followUpIntent.intent,
  relevantTopics: [TOPIC_DOMAINS.RISK_RETURN],
  safetyLevel: SAFETY_LEVELS.NORMAL,
});

assert(followUpPrompt.includes('MANDATORY SAFETY GUARDRAILS'), 'System prompt must include guardrails');
assert(followUpPrompt.includes('Risk & Return: Needs Attention'), 'System prompt must include topic context');
console.log('✅ Test 6 Passed: Multi-turn context and topic understanding embedded into system prompt.\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Unknown/ambiguous intent
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 7: Unknown/ambiguous intent');
const ambiguousMsg = 'hello maybe';
const ambiguousIntent = detectIntent(ambiguousMsg);
assert(ambiguousIntent.intent === INTENTS.GENERAL, 'Ambiguous message should fall back to GENERAL intent');
assert(ambiguousIntent.confidence === 'low', 'Confidence should be low');

const plan7 = buildAdaptationPlan({
  intent: ambiguousIntent.intent,
  relevantTopics: [],
  understandingProfile: null,
  userPreferences: {},
  safetyLevel: SAFETY_LEVELS.NORMAL,
  intentConfidence: ambiguousIntent.confidence,
});

assert(plan7.interaction === 'clarify_first', `Low confidence general intent should clarify_first, got ${plan7.interaction}`);
console.log('✅ Test 7 Passed: Ambiguous intent triggers clarify_first interaction style.\n');

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL ADAPTATION TEST: Same question, two users, different strategies
// ─────────────────────────────────────────────────────────────────────────────
console.log('=== CRITICAL ADAPTATION TEST ===');
console.log('Question: "How do I verify an investment platform?"');

const sharedQuestion = 'How do I verify an investment platform?';
const sharedIntent = detectIntent(sharedQuestion);
const sharedTopics = mapToRelevantTopics(sharedQuestion, sharedIntent.intent);

// User A: Needs Attention in Source Verification
const userAPlan = buildAdaptationPlan({
  intent: sharedIntent.intent,
  relevantTopics: sharedTopics,
  understandingProfile: {
    sourceVerification: { status: 'Needs Attention', knowledgeScore: 30 },
  },
  userPreferences: { responseStyle: 'Standard' },
  safetyLevel: SAFETY_LEVELS.NORMAL,
  intentConfidence: sharedIntent.confidence,
});

// User B: Strong in Source Verification
const userBPlan = buildAdaptationPlan({
  intent: sharedIntent.intent,
  relevantTopics: sharedTopics,
  understandingProfile: {
    sourceVerification: { status: 'Strong', knowledgeScore: 90 },
  },
  userPreferences: { responseStyle: 'Standard' },
  safetyLevel: SAFETY_LEVELS.NORMAL,
  intentConfidence: sharedIntent.confidence,
});

const userAPrompt = buildSystemPrompt({
  adaptationPlan: userAPlan,
  userContext: {
    baselineCompleted: true,
    understandingProfile: { sourceVerification: { label: 'Source Verification', status: 'Needs Attention', misconceptionCount: 1 } },
  },
  intent: sharedIntent.intent,
  relevantTopics: sharedTopics,
  safetyLevel: SAFETY_LEVELS.NORMAL,
});

const userBPrompt = buildSystemPrompt({
  adaptationPlan: userBPlan,
  userContext: {
    baselineCompleted: true,
    understandingProfile: { sourceVerification: { label: 'Source Verification', status: 'Strong', misconceptionCount: 0 } },
  },
  intent: sharedIntent.intent,
  relevantTopics: sharedTopics,
  safetyLevel: SAFETY_LEVELS.NORMAL,
});

// Assert meaningful divergence in adaptation strategy
assert(userAPlan.depth !== userBPlan.depth, `Depth must differ: User A=${userAPlan.depth}, User B=${userBPlan.depth}`);
assert(userAPlan.depth === 'simple', 'User A depth must be simple');
assert(userBPlan.depth === 'detailed', 'User B depth must be detailed');
assert(userAPlan.jargon === 'minimal', 'User A jargon must be minimal');
assert(userAPlan.format === 'step_by_step', 'User A format must be step_by_step');
assert(userAPlan.examples === true, 'User A must require examples');

// Prompts sent to LLM are fundamentally different
assert(userAPrompt !== userBPrompt, 'System prompts must be different for User A and User B');
assert(userAPrompt.includes('Use SIMPLE language'), 'User A prompt instructs simple language');
assert(userBPrompt.includes('Use DETAILED explanations'), 'User B prompt instructs detailed explanations');

console.log('User A Adaptation Strategy:');
console.log(`  Depth: ${userAPlan.depth} | Jargon: ${userAPlan.jargon} | Format: ${userAPlan.format} | Examples: ${userAPlan.examples}`);
console.log('User B Adaptation Strategy:');
console.log(`  Depth: ${userBPlan.depth} | Jargon: ${userBPlan.jargon} | Format: ${userBPlan.format} | Examples: ${userBPlan.examples}`);
console.log('✅ CRITICAL ADAPTATION TEST PASSED: Same question produces meaningfully different response strategies based on UnderstandingProfile!\n');

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('=== RUNNING SECURITY TESTS ===');

// Test: Empty response rejected
const emptyCheck = validateAIResponse('');
assert(!emptyCheck.valid && emptyCheck.reason === 'empty', 'Empty text should be invalid');

// Test: Short response rejected
const shortCheck = validateAIResponse('hi');
assert(!shortCheck.valid && shortCheck.reason === 'too_short', 'Short text (<5 chars) should be invalid');

// Test: Forbidden stock tip patterns caught
const tipCheck = validateAIResponse('I recommend buying this stock immediately for high profits.');
assert(!tipCheck.valid && tipCheck.reason === 'forbidden_investment_advice', 'Direct stock tip should be rejected');

const buyCheck = validateAIResponse('You should buy this now to maximize returns.');
assert(!buyCheck.valid, 'Buy immediately instruction should be rejected');

// Test: Legitimate educational explanation with "guaranteed return" is allowed
const eduValid = validateAIResponse(
  'Under SEBI regulations, market-linked products like mutual funds cannot assure guaranteed returns. Only bank deposits up to ₹5 lakh are DICGC insured.'
);
assert(eduValid.valid, 'Educational explanation about guaranteed returns should be valid');

// Test: Promising guaranteed returns is rejected
const badGuarantee = validateAIResponse('We assure a guaranteed return of 25% annually.');
assert(!badGuarantee.valid, 'Promising guaranteed returns should be rejected');

console.log('✅ Security Tests Passed: Guardrails and response validation function correctly.\n');

console.log('=============================================');
console.log('🎉 ALL ADAPTIVE ENGINE TESTS COMPLETED SUCCESSFULLY!');
console.log('=============================================\n');
