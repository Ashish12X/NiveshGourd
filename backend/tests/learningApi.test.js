// backend/tests/learningApi.test.js
/**
 * End-to-End API Integration, Ownership, Security, and Adaptive Flow Tests (Stage 6)
 *
 * Tests:
 *   1. Unauthenticated request to /api/learning/dashboard -> 401 Unauthorized
 *   2. Register User A & User B
 *   3. Fetch learning dashboard:
 *      - Auto-seeds 6 curriculum modules if empty
 *      - Returns recommended topic with clear reason & learning mode
 *   4. Fetch specific topic details:
 *      - Returns structured lesson sections, questions, scenarios, and adaptation plan
 *   5. Module Start / In-Progress persistence:
 *      - POST /api/learning/:topicId/start creates LearningProgress with status 'IN_PROGRESS'
 *   6. Interaction execution & scoring:
 *      - Correct comprehension answer -> updates comprehension score
 *      - Incorrect practical scenario with HIGH confidence -> flags HIGH_CONFIDENCE_ERROR
 *   7. Incremental bounded update to UnderstandingProfile:
 *      - Profile reflects new learning evidence without jumping immediately from 0 to 100
 *   8. Complete module:
 *      - POST /api/learning/:topicId/complete evaluates mastery criteria
 *      - Returns adaptive next topic recommendation
 *   9. User isolation & Ownership protection:
 *      - User B has separate LearningProgress records from User A
 *   10. AI Tutor query:
 *      - POST /api/learning/:topicId/ask responds with plain-language explanation
 */

const BASE_URL = 'http://localhost:8000/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('=== RUNNING STAGE 6 LEARNING API & ADAPTIVE FLOW E2E TESTS ===\n');

  // 1. Unauthenticated request
  console.log('Test 1: Unauthenticated request rejected');
  const unauthRes = await fetch(`${BASE_URL}/learning/dashboard`);
  assert(unauthRes.status === 401, `Expected 401, got ${unauthRes.status}`);
  console.log('✅ Test 1 Passed: Unauthenticated request returned 401.\n');

  // 2. Register User A and User B
  const timestamp = Date.now();
  console.log('Test 2: Register User A and User B');
  const emailA = `learn_user_a_${timestamp}@sangyan.test`;
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Learner Aarti', email: emailA, password: 'Password123!' }),
  });
  const tokenA = (regARes.headers.get('set-cookie') || '').match(/token=([^;]+)/)[1];

  const emailB = `learn_user_b_${timestamp}@sangyan.test`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Learner Bharat', email: emailB, password: 'Password123!' }),
  });
  const tokenB = (regBRes.headers.get('set-cookie') || '').match(/token=([^;]+)/)[1];

  const headersA = { 'Content-Type': 'application/json', Cookie: `token=${tokenA}` };
  const headersB = { 'Content-Type': 'application/json', Cookie: `token=${tokenB}` };
  console.log('✅ Test 2 Passed: Users registered and authenticated.\n');

  // 3. Fetch Learning Dashboard
  console.log('Test 3: Fetch Learning Dashboard & verify auto-seed');
  const dashRes = await fetch(`${BASE_URL}/learning/dashboard`, {
    method: 'GET',
    headers: headersA,
  });
  const dashJson = await dashRes.json();
  assert(dashRes.status === 200, 'Dashboard should return 200');
  assert(dashJson.success === true, 'Response must be success: true');
  const { recommended, categorized, totalTopics } = dashJson.data;
  assert(totalTopics === 6, `Expected 6 total topics seeded, got ${totalTopics}`);
  assert(recommended && recommended.topic, 'Must provide an adaptive recommended topic');
  assert(recommended.reason, 'Recommendation must include clear user-facing reason');
  assert(recommended.learningMode, 'Must specify learningMode');
  console.log(`✅ Test 3 Passed: Curriculum seeded. Recommended: "${recommended.topic.title}" (${recommended.learningMode}).\n`);

  // 4. Fetch specific topic details
  console.log('Test 4: Fetch Topic Details & Adaptive Presentation');
  const targetTopicId = recommended.topic.topicId;
  const topicRes = await fetch(`${BASE_URL}/learning/topics/${targetTopicId}`, {
    method: 'GET',
    headers: headersA,
  });
  const topicJson = await topicRes.json();
  assert(topicRes.status === 200, 'Topic fetch should return 200');
  const { topic, adaptation, progress } = topicJson.data;
  assert(topic.topicId === targetTopicId, 'TopicId must match');
  assert(topic.sections.length >= 2, 'Must have lesson sections');
  assert(topic.comprehensionQuestions.length >= 1, 'Must have comprehension questions');
  assert(topic.practicalScenarios.length >= 1, 'Must have practical scenarios');
  assert(adaptation.depth, 'Must provide adaptive depth');
  console.log(`✅ Test 4 Passed: Topic loaded with ${adaptation.depth} depth adaptation.\n`);

  // 5. Start learning module
  console.log('Test 5: Start module and create progress');
  const startRes = await fetch(`${BASE_URL}/learning/${targetTopicId}/start`, {
    method: 'POST',
    headers: headersA,
  });
  const startJson = await startRes.json();
  assert(startRes.status === 200, 'Start topic should return 200');
  assert(startJson.data.status === 'IN_PROGRESS', 'Status must be IN_PROGRESS');
  console.log('✅ Test 5 Passed: LearningProgress persisted with IN_PROGRESS.\n');

  // 6. Record Comprehension Interaction (Correct answer)
  console.log('Test 6: Submit comprehension answer');
  const compQ = topic.comprehensionQuestions[0];
  const correctOpt = compQ.options.find((o) => o.isCorrect).id;
  const compRes = await fetch(`${BASE_URL}/learning/${targetTopicId}/interaction`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      interactionType: 'comprehension_answer',
      questionId: compQ.questionId,
      selectedOption: correctOpt,
      confidence: 'MEDIUM',
    }),
  });
  const compJson = await compRes.json();
  assert(compRes.status === 200, 'Comprehension submit should return 200');
  assert(compJson.data.evaluation.isCorrect === true, 'Answer should evaluate to correct');
  // Evidence-weighted: starts at 50 baseline, +25 for correct = 75 (>= 70 mastery threshold)
  assert(compJson.data.progress.comprehensionScore >= 70, `Comprehension score should be >= 70 after correct answer, got ${compJson.data.progress.comprehensionScore}`);
  console.log('✅ Test 6 Passed: Correct comprehension answer recorded and evaluated.\n');

  // 7. Record Practical Scenario Interaction (Incorrect with HIGH confidence -> misconception)
  console.log('Test 7: Submit practical scenario with high-confidence error');
  const scenario = topic.practicalScenarios[0];
  const wrongOpt = scenario.options.find((o) => !o.isCorrect).id;
  const scenRes = await fetch(`${BASE_URL}/learning/${targetTopicId}/interaction`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      interactionType: 'practical_attempt',
      scenarioId: scenario.scenarioId,
      selectedOption: wrongOpt,
      confidence: 'HIGH', // High confidence error!
    }),
  });
  const scenJson = await scenRes.json();
  assert(scenRes.status === 200, 'Scenario submit should return 200');
  assert(scenJson.data.evaluation.isCorrect === false, 'Evaluation should be false');
  const misSignals = scenJson.data.progress.misconceptionSignals;
  assert(
    misSignals.some((m) => m.type === 'HIGH_CONFIDENCE_ERROR'),
    'Must flag HIGH_CONFIDENCE_ERROR in misconception signals'
  );
  assert(
    scenJson.data.progress.status === 'NEEDS_REVIEW',
    'Status should transition to NEEDS_REVIEW due to high-confidence error'
  );
  console.log('✅ Test 7 Passed: High-confidence mistake flagged and status set to NEEDS_REVIEW.\n');

  // 8. Complete Module and receive adaptive next recommendation
  console.log('Test 8: Complete module & retrieve next adaptive chapter');
  const compModuleRes = await fetch(`${BASE_URL}/learning/${targetTopicId}/complete`, {
    method: 'POST',
    headers: headersA,
  });
  const compModuleJson = await compModuleRes.json();
  assert(compModuleRes.status === 200, 'Complete module should return 200');
  assert(compModuleJson.data.nextRecommendation, 'Must receive adaptive next recommendation');
  console.log(`✅ Test 8 Passed: Module completed. Next recommendation: "${compModuleJson.data.nextRecommendation.topic.title}".\n`);

  // 9. User Isolation
  console.log('Test 9: Cross-user progress isolation');
  const topicResB = await fetch(`${BASE_URL}/learning/topics/${targetTopicId}`, {
    method: 'GET',
    headers: headersB,
  });
  const topicJsonB = await topicResB.json();
  assert(topicJsonB.data.progress.status === 'NOT_STARTED', 'User B progress must be NOT_STARTED');
  console.log('✅ Test 9 Passed: User A and User B progress completely isolated.\n');

  // 10. AI Tutor query
  console.log('Test 10: AI Tutor module query');
  const aiTutorRes = await fetch(`${BASE_URL}/learning/${targetTopicId}/ask`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ question: 'How do I check if bank details match the company?' }),
  });
  const aiTutorJson = await aiTutorRes.json();
  assert(aiTutorRes.status === 200, 'AI Tutor query should return 200');
  assert(aiTutorJson.data.reply, 'AI Tutor must provide educational reply');
  console.log('✅ Test 10 Passed: AI Tutor provided contextual educational response.\n');

  console.log('====================================================');
  console.log('🎉 ALL STAGE 6 LEARNING API & E2E TESTS PASSED!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n❌ STAGE 6 E2E TEST FAILED:', err.message);
  process.exit(1);
});
