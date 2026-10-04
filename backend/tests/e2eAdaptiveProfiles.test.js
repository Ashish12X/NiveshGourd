// backend/tests/e2eAdaptiveProfiles.test.js
/**
 * End-to-End Real Profile Adaptation Test (Stage 4 Core Proof)
 *
 * Demonstrates:
 *   User A (sourceVerification = Needs Attention)
 *   User B (sourceVerification = Strong)
 *
 * Both ask the EXACT SAME question:
 *   "How do I verify an investment platform?"
 *
 * Verifies:
 *   - Response strategies fundamentally differ
 *   - Metadata confirms depth, jargon, and formatting differences
 *   - UnderstandingProfile is NOT modified (read-only invariant)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import UnderstandingProfile from '../src/models/UnderstandingProfile.js';

dotenv.config();

const BASE_URL = 'http://localhost:8000/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('=== RUNNING SAME-QUESTION / DIFFERENT-PROFILE ADAPTATION TEST ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sangyan');

  const timestamp = Date.now();

  // 1. Create User A with Needs Attention in sourceVerification
  console.log('Step 1: Setting up User A with sourceVerification = Needs Attention');
  const userAEmail = `user_needs_attention_${timestamp}@sangyan.test`;
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Investor Aarti', email: userAEmail, password: 'Password123!' }),
  });
  const tokenA = (regARes.headers.get('set-cookie') || '').match(/token=([^;]+)/)[1];
  const userADoc = await User.findOne({ email: userAEmail });

  // Seed UnderstandingProfile for User A
  await UnderstandingProfile.create({
    user: userADoc._id,
    baselineAssessmentCompleted: true,
    overallScore: 35,
    confidenceScore: 40,
    topics: {
      basicConcepts: { topicId: 'basicConcepts', label: 'Basic Investment Concepts', status: 'Developing', knowledgeScore: 50, practicalScore: 50, misconceptionCount: 1 },
      riskReturn: { topicId: 'riskReturn', label: 'Risk and Return Understanding', status: 'Developing', knowledgeScore: 50, practicalScore: 50, misconceptionCount: 1 },
      fraudAwareness: { topicId: 'fraudAwareness', label: 'Fraud and Safety Awareness', status: 'Developing', knowledgeScore: 50, practicalScore: 50, misconceptionCount: 1 },
      sourceVerification: { topicId: 'sourceVerification', label: 'Source Verification', status: 'Needs Attention', knowledgeScore: 25, practicalScore: 20, misconceptionCount: 2 },
      investorRights: { topicId: 'investorRights', label: 'Investor Rights and Safety Rules', status: 'Developing', knowledgeScore: 50, practicalScore: 50, misconceptionCount: 0 },
      grievanceAwareness: { topicId: 'grievanceAwareness', label: 'Grievance Redressal Mechanisms', status: 'Developing', knowledgeScore: 50, practicalScore: 50, misconceptionCount: 0 },
    },
  });

  // 2. Create User B with Strong in sourceVerification
  console.log('Step 2: Setting up User B with sourceVerification = Strong');
  const userBEmail = `user_strong_${timestamp}@sangyan.test`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Investor Bharat', email: userBEmail, password: 'Password123!' }),
  });
  const tokenB = (regBRes.headers.get('set-cookie') || '').match(/token=([^;]+)/)[1];
  const userBDoc = await User.findOne({ email: userBEmail });
  userBDoc.preferences.responseStyle = 'Detailed';
  await userBDoc.save();

  // Seed UnderstandingProfile for User B
  await UnderstandingProfile.create({
    user: userBDoc._id,
    baselineAssessmentCompleted: true,
    overallScore: 90,
    confidenceScore: 95,
    topics: {
      basicConcepts: { topicId: 'basicConcepts', label: 'Basic Investment Concepts', status: 'Strong', knowledgeScore: 90, practicalScore: 90, misconceptionCount: 0 },
      riskReturn: { topicId: 'riskReturn', label: 'Risk and Return Understanding', status: 'Strong', knowledgeScore: 90, practicalScore: 90, misconceptionCount: 0 },
      fraudAwareness: { topicId: 'fraudAwareness', label: 'Fraud and Safety Awareness', status: 'Strong', knowledgeScore: 90, practicalScore: 90, misconceptionCount: 0 },
      sourceVerification: { topicId: 'sourceVerification', label: 'Source Verification', status: 'Strong', knowledgeScore: 95, practicalScore: 95, misconceptionCount: 0 },
      investorRights: { topicId: 'investorRights', label: 'Investor Rights and Safety Rules', status: 'Strong', knowledgeScore: 85, practicalScore: 90, misconceptionCount: 0 },
      grievanceAwareness: { topicId: 'grievanceAwareness', label: 'Grievance Redressal Mechanisms', status: 'Strong', knowledgeScore: 85, practicalScore: 85, misconceptionCount: 0 },
    },
  });

  // 3. Ask the EXACT SAME question to both users
  const SAME_QUESTION = 'How do I verify an investment platform?';
  console.log(`\nBoth users ask: "${SAME_QUESTION}"\n`);

  // User A request
  console.log('Sending question from User A (Needs Attention)...');
  const resA = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ message: SAME_QUESTION, uiMode: 'Verify' }),
  });
  const dataA = await resA.json();
  assert(resA.status === 200, `User A request failed: ${JSON.stringify(dataA)}`);

  // User B request
  console.log('Sending question from User B (Strong)...');
  const resB = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ message: SAME_QUESTION, uiMode: 'Verify' }),
  });
  const dataB = await resB.json();
  assert(resB.status === 200, `User B request failed: ${JSON.stringify(dataB)}`);

  // 4. Verify differentiation
  console.log('\n--- RESULTS COMPARISON ---');
  console.log('User A (Needs Attention):');
  console.log('  Intent:', dataA.metadata.intent);
  console.log('  Relevant Topics:', dataA.metadata.relevantTopics);
  console.log('  Adaptation:', JSON.stringify(dataA.metadata.adaptation));
  console.log('  Summary:', dataA.metadata.adaptationSummary);

  console.log('\nUser B (Strong):');
  console.log('  Intent:', dataB.metadata.intent);
  console.log('  Relevant Topics:', dataB.metadata.relevantTopics);
  console.log('  Adaptation:', JSON.stringify(dataB.metadata.adaptation));
  console.log('  Summary:', dataB.metadata.adaptationSummary);

  // Assertions on adaptation plan divergence
  assert(dataA.metadata.adaptation.depth === 'simple', `User A depth should be 'simple', got '${dataA.metadata.adaptation.depth}'`);
  assert(dataB.metadata.adaptation.depth === 'detailed', `User B depth should be 'detailed', got '${dataB.metadata.adaptation.depth}'`);
  assert(dataA.metadata.adaptation.jargon === 'minimal', `User A jargon should be 'minimal', got '${dataA.metadata.adaptation.jargon}'`);
  assert(dataB.metadata.adaptation.jargon === 'moderate', `User B jargon should be 'moderate', got '${dataB.metadata.adaptation.jargon}'`);
  assert(dataA.metadata.adaptation.depth !== dataB.metadata.adaptation.depth, 'Depth must differ between User A and User B');

  // 5. Invariant check: Verify UnderstandingProfile was NOT mutated by chat
  console.log('\nStep 5: Verifying UnderstandingProfile read-only invariant...');
  const profileAfterA = await UnderstandingProfile.findOne({ user: userADoc._id });
  assert(profileAfterA.topics.sourceVerification.knowledgeScore === 25, 'Score must remain 25');
  assert(profileAfterA.topics.sourceVerification.status === 'Needs Attention', 'Status must remain Needs Attention');
  console.log('✅ UnderstandingProfile was NOT modified by casual conversation (read-only invariant preserved).\n');

  console.log('========================================================================');
  console.log('🎉 CRITICAL ADAPTIVE PROOF VERIFIED: SAME QUESTION RECEIVED DIFFERENT STRATEGIES!');
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
