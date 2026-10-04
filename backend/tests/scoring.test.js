// backend/tests/scoring.test.js
import {
  evaluateAnswers,
  calculateTopicScores,
  calculateOverallMetadata,
} from '../src/services/scoringService.js';
import { ASSESSMENT_QUESTIONS, TOPIC_DOMAINS } from '../src/data/assessmentQuestions.js';

const QUESTIONS_MAP = ASSESSMENT_QUESTIONS.reduce((acc, q) => {
  acc[q.id] = q;
  return acc;
}, {});

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== RUNNING SCORING SERVICE UNIT TESTS ===\n');

// --- Test A: All correct + high confidence ---
console.log('Test A: All correct + high confidence');
const answersA = ASSESSMENT_QUESTIONS.map((q) => ({
  questionId: q.id,
  selectedOption: q.correctOption,
  confidence: 'high',
}));
const evaluatedA = evaluateAnswers(answersA, QUESTIONS_MAP);
const scoresA = calculateTopicScores(evaluatedA);
const metaA = calculateOverallMetadata(evaluatedA, scoresA);

assert(metaA.correctAnswers === 12, 'All 12 should be correct');
assert(metaA.misconceptionCount === 0, 'Misconceptions should be 0');
assert(metaA.confidenceScore === 100, 'Confidence score should be 100');
scoresA.forEach((s) => {
  assert(s.status === 'Strong', `Topic ${s.topic} should be Strong, got ${s.status}`);
  assert(s.knowledgeScore === 100, `Topic ${s.topic} knowledgeScore should be 100`);
});
console.log('✅ Test A Passed: All topics Strong, 100% knowledge, 0 misconceptions.\n');

// --- Test B: All incorrect + high confidence (Extreme misconception test) ---
console.log('Test B: All incorrect + high confidence');
const answersB = ASSESSMENT_QUESTIONS.map((q) => {
  const wrongOpt = q.options.find((o) => o.id !== q.correctOption).id;
  return {
    questionId: q.id,
    selectedOption: wrongOpt,
    confidence: 'high',
  };
});
const evaluatedB = evaluateAnswers(answersB, QUESTIONS_MAP);
const scoresB = calculateTopicScores(evaluatedB);
const metaB = calculateOverallMetadata(evaluatedB, scoresB);

assert(metaB.correctAnswers === 0, 'Correct answers should be 0');
assert(metaB.misconceptionCount === 12, 'Misconceptions should be 12');
scoresB.forEach((s) => {
  assert(s.status === 'Needs Attention', `Topic ${s.topic} should be Needs Attention, got ${s.status}`);
  assert(s.misconceptionCount === 2, `Topic ${s.topic} should have 2 misconceptions`);
});
console.log('✅ Test B Passed: All topics Needs Attention, 12 misconceptions flagged.\n');

// --- Test C: Mixed correctness + medium confidence ---
console.log('Test C: Mixed correctness + medium confidence');
const answersC = ASSESSMENT_QUESTIONS.map((q, idx) => {
  const isCorrect = idx % 2 === 0;
  const opt = isCorrect ? q.correctOption : q.options.find((o) => o.id !== q.correctOption).id;
  return {
    questionId: q.id,
    selectedOption: opt,
    confidence: 'medium',
  };
});
const evaluatedC = evaluateAnswers(answersC, QUESTIONS_MAP);
const scoresC = calculateTopicScores(evaluatedC);
const metaC = calculateOverallMetadata(evaluatedC, scoresC);

assert(metaC.misconceptionCount === 0, 'No misconceptions for medium confidence');
console.log('✅ Test C Passed: Mixed correctness, 0 misconceptions.\n');

// --- Test D: Correct but low confidence ---
console.log('Test D: Correct but low confidence');
const answersD = ASSESSMENT_QUESTIONS.map((q) => ({
  questionId: q.id,
  selectedOption: q.correctOption,
  confidence: 'low',
}));
const evaluatedD = evaluateAnswers(answersD, QUESTIONS_MAP);
const scoresD = calculateTopicScores(evaluatedD);
const metaD = calculateOverallMetadata(evaluatedD, scoresD);

assert(metaD.correctAnswers === 12, 'All 12 should be correct');
assert(metaD.misconceptionCount === 0, 'Misconceptions must NOT trigger for correct answers');
assert(metaD.confidenceScore === 33, 'Confidence score should be 33');
console.log('✅ Test D Passed: Correct knowledge with low certainty, 0 misconceptions.\n');

// --- Test E & F: Theory vs Practical Divergence ---
console.log('Test E: Strong Theory + Weak Practical');
const answersE = ASSESSMENT_QUESTIONS.map((q) => ({
  questionId: q.id,
  selectedOption: q.type === 'theory' ? q.correctOption : q.options.find((o) => o.id !== q.correctOption).id,
  confidence: 'medium',
}));
const evaluatedE = evaluateAnswers(answersE, QUESTIONS_MAP);
const scoresE = calculateTopicScores(evaluatedE);
const metaE = calculateOverallMetadata(evaluatedE, scoresE);

assert(metaE.practicalScore === 0, 'Practical score should be 0');
scoresE.forEach((s) => {
  assert(s.practicalScore === 0, 'Practical score per topic should be 0');
  assert(s.knowledgeScore < 60, 'Weighted knowledge score reflects practical loss');
});
console.log('✅ Test E Passed: Practical weakness clearly separated from theoretical knowledge.\n');

// --- Product Test: USER A Specific Scenario ---
console.log('Important Product Test: USER A Scenario');
// USER A:
// Risk & Return: mostly correct answers, medium/high confidence
// Fraud Awareness: mostly correct practical answers
// Source Verification: multiple wrong answers, HIGH confidence
const answersUserA = ASSESSMENT_QUESTIONS.map((q) => {
  if (q.topic === 'riskReturn') {
    return { questionId: q.id, selectedOption: q.correctOption, confidence: 'high' };
  }
  if (q.topic === 'fraudAwareness') {
    return { questionId: q.id, selectedOption: q.correctOption, confidence: 'medium' };
  }
  if (q.topic === 'sourceVerification') {
    // Both wrong + HIGH confidence
    const wrongOpt = q.options.find((o) => o.id !== q.correctOption).id;
    return { questionId: q.id, selectedOption: wrongOpt, confidence: 'high' };
  }
  // Others normal
  return { questionId: q.id, selectedOption: q.correctOption, confidence: 'medium' };
});

const evaluatedUserA = evaluateAnswers(answersUserA, QUESTIONS_MAP);
const scoresUserA = calculateTopicScores(evaluatedUserA);

const rr = scoresUserA.find((s) => s.topic === 'riskReturn');
const fa = scoresUserA.find((s) => s.topic === 'fraudAwareness');
const sv = scoresUserA.find((s) => s.topic === 'sourceVerification');

console.log('User A - Risk & Return Status:', rr.status, '| Score:', rr.knowledgeScore);
console.log('User A - Fraud Awareness Status:', fa.status, '| Score:', fa.knowledgeScore);
console.log('User A - Source Verification Status:', sv.status, '| Score:', sv.knowledgeScore, '| Misconceptions:', sv.misconceptionCount);

assert(rr.status === 'Strong', 'Risk & Return must be Strong');
assert(fa.status === 'Strong', 'Fraud Awareness must be Strong');
assert(sv.status === 'Needs Attention', 'Source Verification must be Needs Attention');
assert(sv.misconceptionCount > 0, 'Source Verification must have misconception evidence');

console.log('\n🎉 ALL DETERMINISTIC SCORING TESTS PASSED PERFECTLY!\n');
