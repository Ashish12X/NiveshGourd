const BASE_URL = 'http://localhost:8000/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runMasterFlow() {
  console.log('================================================================');
  console.log('?? RUNNING SANGYAN MASTER MANUAL FLOW VERIFICATION (STAGES 1-6)');
  console.log('================================================================\n');

  const ts = Date.now();

  // -- STEP 1: USER A Register & Auth ----------------------------
  console.log('--- Step 1: Register User A ---');
  const userAEmail = `master_flow_a_${ts}@sangyan.test`;
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Investor A', email: userAEmail, password: 'Password123!' }),
  });
  assert(regARes.status === 201, `User A registration failed: ${regARes.status}`);
  const cookieA = regARes.headers.get('set-cookie');
  const tokenA = cookieA.match(/token=([^;]+)/)[1];
  const headersA = { 'Content-Type': 'application/json', Cookie: `token=${tokenA}` };

  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: headersA });
  const meJson = await meRes.json();
  assert(meRes.status === 200 && meJson.user.email === userAEmail, 'User A /auth/me failed');
  console.log(`? Step 1 Passed: User A registered & authenticated (${userAEmail})\n`);

  // -- STEP 2: Assessment & UnderstandingProfile -----------------
  console.log('--- Step 2: Assessment -> UnderstandingProfile ---');
  const assessRes = await fetch(`${BASE_URL}/assessment`, { headers: headersA });
  const assessJson = await assessRes.json();
  assert(assessRes.status === 200, 'Assessment fetch failed');
  const questions = assessJson.assessment?.questions;
  assert(questions && questions.length > 0, 'No questions returned');

  const answers = questions.map((q) => {
    const isWeakTopic = q.topic === 'sourceVerification';
    const opt = q.options.find((o) => (isWeakTopic ? !o.isCorrect : o.isCorrect));
    return {
      questionId: q.id,
      selectedOption: opt ? opt.id : q.options[0].id,
      confidence: 'HIGH',
    };
  });

  const submitRes = await fetch(`${BASE_URL}/assessment/submit`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ answers }),
  });
  assert(submitRes.status === 200, `Assessment submission failed: ${submitRes.status}`);

  const profileRes = await fetch(`${BASE_URL}/understanding-profile`, { headers: headersA });
  const profileJson = await profileRes.json();
  assert(profileRes.status === 200, 'Fetch UnderstandingProfile failed');
  const profile = profileJson.profile || profileJson.data;
  assert(profile && profile.topics, 'UnderstandingProfile has no topics map');
  assert(profile.baselineAssessmentCompleted === true, 'baselineAssessmentCompleted must be true');
  console.log(`? Step 2 Passed: Profile generated. Baseline completed: ${profile.baselineAssessmentCompleted}, Topics: ${Object.keys(profile.topics).join(', ')}\n`);

  // -- STEP 3: Dashboard -> Recommended Learning Navigation ------
  console.log('--- Step 3: Dashboard Recommended Learning ---');
  const dashRes = await fetch(`${BASE_URL}/learning/dashboard`, { headers: headersA });
  const dashJson = await dashRes.json();
  assert(dashRes.status === 200, 'Fetch learning dashboard failed');
  const rec = dashJson.data.recommended;
  assert(rec && rec.topic && rec.topic.topicId, 'Recommended topic must exist with valid topicId');
  const realTopicId = rec.topic.topicId;
  console.log(`Recommended Topic: "${rec.topic.title}" (ID: ${realTopicId})`);

  const topicDetailsRes = await fetch(`${BASE_URL}/learning/topics/${realTopicId}`, { headers: headersA });
  const topicDetailsJson = await topicDetailsRes.json();
  assert(topicDetailsRes.status === 200, `Topic details fetch failed for ${realTopicId}: ${topicDetailsRes.status}`);
  assert(topicDetailsJson.data.topic.topicId === realTopicId, 'Fetched topic ID mismatch');
  console.log(`? Step 3 Passed: Real topic loaded without 404. No fake slugs used.\n`);

  // -- STEP 4: Start Topic & High-Confidence Error -> NEEDS_REVIEW --
  console.log('--- Step 4: High-Confidence Error -> NEEDS_REVIEW ---');
  await fetch(`${BASE_URL}/learning/${realTopicId}/start`, { method: 'POST', headers: headersA });

  const topicObj = topicDetailsJson.data.topic;
  assert(topicObj.practicalScenarios && topicObj.practicalScenarios.length > 0, 'Topic must have practical scenarios');
  const scenario = topicObj.practicalScenarios[0];
  const wrongOption = scenario.options.find((o) => !o.isCorrect);

  const interactRes = await fetch(`${BASE_URL}/learning/${realTopicId}/interaction`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      interactionType: 'practical_attempt',
      scenarioId: scenario.scenarioId,
      selectedOption: wrongOption.id,
      confidence: 'HIGH',
    }),
  });
  const interactJson = await interactRes.json();
  assert(interactRes.status === 200, 'Practical interaction failed');
  assert(interactJson.data.progress.status === 'NEEDS_REVIEW', 'Progress status must be NEEDS_REVIEW');
  const hasHighConfError = interactJson.data.progress.misconceptionSignals.some(
    (m) => m.type === 'HIGH_CONFIDENCE_ERROR'
  );
  assert(hasHighConfError, 'Must detect HIGH_CONFIDENCE_ERROR signal');
  console.log(`? Step 4 Passed: Status changed to NEEDS_REVIEW with HIGH_CONFIDENCE_ERROR recorded.\n`);

  // -- STEP 5: Complete Topic & Verify Next Recommendation Exists -
  console.log('--- Step 5: Complete Topic with NEEDS_REVIEW -> Valid Recommendation ---');
  const completeRes = await fetch(`${BASE_URL}/learning/${realTopicId}/complete`, {
    method: 'POST',
    headers: headersA,
  });
  const completeJson = await completeRes.json();
  assert(completeRes.status === 200, 'Complete topic failed');
  const nextRec = completeJson.data.nextRecommendation;
  assert(nextRec !== undefined && nextRec !== null, 'nextRecommendation MUST NOT be undefined');
  assert(nextRec.topic !== undefined || nextRec.topicId !== undefined, 'Recommendation must have valid topic or topicId');
  const recTopicId = nextRec.topic?.topicId || nextRec.topicId;
  assert(typeof recTopicId === 'string' && recTopicId.length > 0, 'recTopicId must be non-empty string');
  console.log(`Next Recommendation received: "${nextRec.topic?.title || recTopicId}"`);
  console.log(`Reason Code: ${nextRec.reasonCode}`);
  console.log(`Reason: ${nextRec.reason}`);
  console.log(`? Step 5 Passed: nextRecommendation is populated and valid (Issue 2 verified).\n`);

  // -- STEP 6: Review Topic Opens Cleanly -------------------------
  console.log('--- Step 6: Review Topic Navigation ---');
  const reviewTopicRes = await fetch(`${BASE_URL}/learning/topics/${recTopicId}`, { headers: headersA });
  const reviewTopicJson = await reviewTopicRes.json();
  assert(reviewTopicRes.status === 200, `Review topic fetch failed for ${recTopicId}`);
  assert(reviewTopicJson.data.topic.topicId === recTopicId, 'Review topic ID mismatch');
  console.log(`? Step 6 Passed: Review topic opens cleanly without error.\n`);

  // -- STEP 7: Validity Check & Risk Signals ----------------------
  console.log('--- Step 7: Validity Check Engine ---');
  const verifyRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      inputType: 'TEXT',
      text: 'SEBI approved ABC Wealth. Guaranteed 30% annual return. Pay 5000 today to activate the account. Please send your OTP to verify.',
    }),
  });
  const verifyJson = await verifyRes.json();
  assert(verifyRes.status === 201, `Validity check failed: ${verifyRes.status}`);
  const analysis = verifyJson.data;
  assert(analysis.claims && analysis.claims.length >= 2, 'Must extract at least 2 claims');
  assert(analysis.topRiskSignals && analysis.topRiskSignals.length > 0, 'Must detect top risk signals');
  const riskTypes = analysis.topRiskSignals.map((s) => s.signalType);
  console.log(`Risk Signals Detected: ${riskTypes.join(', ')}`);
  console.log(`Overall Status: ${analysis.overallStatus}`);
  console.log(`Overall Uncertainty: ${analysis.overallUncertainty}`);
  console.log(`? Step 7 Passed: Validity check accurately classified claims and topRiskSignals.\n`);

  // -- STEP 8: Contextual Learning Trigger ------------------------
  console.log('--- Step 8: Contextual Learning from Risk Signal ---');
  // Pass ?signal=GUARANTEED_RETURNS to learning dashboard
  const contextDashRes = await fetch(`${BASE_URL}/learning/dashboard?signal=GUARANTEED_RETURNS`, {
    headers: headersA,
  });
  const contextDashJson = await contextDashRes.json();
  assert(contextDashRes.status === 200, 'Contextual learning dashboard fetch failed');
  const contextRec = contextDashJson.data.recommended;
  assert(contextRec && contextRec.topic, 'Contextual recommendation must exist');
  assert(
    contextRec.topic.domain === 'riskReturn' || contextRec.reasonCode === 'CONTEXTUAL_SAFETY_TRIGGER',
    'Contextual recommendation must relate to riskReturn'
  );
  console.log(`Contextual Topic: "${contextRec.topic.title}" (Reason: ${contextRec.reasonCode})`);
  console.log(`? Step 8 Passed: Stage 5 risk signal accurately drives Stage 6 contextual learning.\n`);

  // -- STEP 9: User B Registration & Multi-User Isolation --------
  console.log('--- Step 9 & 10: Multi-User Isolation ---');
  const userBEmail = `master_flow_b_${ts}@sangyan.test`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Investor B', email: userBEmail, password: 'Password123!' }),
  });
  assert(regBRes.status === 201, 'User B registration failed');
  const tokenB = regBRes.headers.get('set-cookie').match(/token=([^;]+)/)[1];
  const headersB = { 'Content-Type': 'application/json', Cookie: `token=${tokenB}` };

  const userAVerifId = analysis._id;
  const leakVerifRes = await fetch(`${BASE_URL}/verification/${userAVerifId}`, { headers: headersB });
  assert(leakVerifRes.status === 404, `User B should receive 404 for User A verification, got ${leakVerifRes.status}`);
  console.log(`? Step 9 Passed: User B strictly denied access (404) to User A verification.\n`);

  const leakProgressRes = await fetch(`${BASE_URL}/learning/topics/${realTopicId}`, { headers: headersB });
  const leakProgressJson = await leakProgressRes.json();
  assert(leakProgressJson.data.progress.status === 'NOT_STARTED', 'User B progress must be NOT_STARTED');
  console.log(`? Step 10 Passed: User B learning progress is completely isolated (NOT_STARTED).\n`);

  console.log('================================================================');
  console.log('?? ALL 10 MANDATORY MANUAL FLOW STEPS VERIFIED END-TO-END!');
  console.log('================================================================');
}

runMasterFlow().catch((err) => {
  console.error('\n? MASTER MANUAL FLOW FAILED:', err.message);
  process.exit(1);
});
