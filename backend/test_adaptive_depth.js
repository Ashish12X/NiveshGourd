// backend/test_adaptive_depth.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import UnderstandingProfile from './src/models/UnderstandingProfile.js';
import { runAdaptiveEngine } from './src/services/adaptive/adaptiveEngine.js';

async function testProfiles() {
  await connectDB();

  let user = await User.findOne({ email: 'ashish.test@niveshguard.in' });

  const makeTopics = (basicStatus) => ({
    basicConcepts: { topicId: 'basicConcepts', label: 'Basic Concepts', status: basicStatus, knowledgeScore: basicStatus === 'Strong' ? 95 : 30, confidenceScore: 50, practicalScore: 50, misconceptionCount: basicStatus === 'Needs Attention' ? 2 : 0 },
    riskReturn: { topicId: 'riskReturn', label: 'Risk & Return', status: 'Not Assessed', knowledgeScore: 0, confidenceScore: 0, practicalScore: 0, misconceptionCount: 0 },
    fraudAwareness: { topicId: 'fraudAwareness', label: 'Fraud Awareness', status: 'Not Assessed', knowledgeScore: 0, confidenceScore: 0, practicalScore: 0, misconceptionCount: 0 },
    sourceVerification: { topicId: 'sourceVerification', label: 'Source Verification', status: 'Not Assessed', knowledgeScore: 0, confidenceScore: 0, practicalScore: 0, misconceptionCount: 0 },
    investorRights: { topicId: 'investorRights', label: 'Investor Rights', status: 'Not Assessed', knowledgeScore: 0, confidenceScore: 0, practicalScore: 0, misconceptionCount: 0 },
    grievanceAwareness: { topicId: 'grievanceAwareness', label: 'Grievance Awareness', status: 'Not Assessed', knowledgeScore: 0, confidenceScore: 0, practicalScore: 0, misconceptionCount: 0 },
  });

  // Use findOneAndUpdate to avoid subdocument validation issues
  const setTopicsAndSave = async (topics) => {
    const result = await UnderstandingProfile.findOneAndUpdate(
      { user: user._id },
      { $set: { topics, baselineAssessmentCompleted: true } },
      { upsert: true, new: true, runValidators: true }
    );
    return result;
  };

  // 1. Test with Needs Attention
  await setTopicsAndSave(makeTopics('Needs Attention'));

  console.log('\n========================================');
  console.log('TEST ADAPTIVE DEPTH: Needs Attention');
  const resNeeds = await runAdaptiveEngine({
    user,
    message: 'What is diversification?',
    language: 'en',
  });
  console.log('Adaptation Depth:', resNeeds.metadata.adaptation.depth);
  console.log('Adaptation Jargon:', resNeeds.metadata.adaptation.jargon);
  console.log('Adaptation Format:', resNeeds.metadata.adaptation.format);
  console.log('Response preview:\n', resNeeds.response.slice(0, 350));

  // 2. Test with Strong
  await setTopicsAndSave(makeTopics('Strong'));

  console.log('\n========================================');
  console.log('TEST ADAPTIVE DEPTH: Strong');
  const resStrong = await runAdaptiveEngine({
    user,
    message: 'What is diversification?',
    language: 'en',
  });
  console.log('Adaptation Depth:', resStrong.metadata.adaptation.depth);
  console.log('Adaptation Jargon:', resStrong.metadata.adaptation.jargon);
  console.log('Adaptation Format:', resStrong.metadata.adaptation.format);
  console.log('Response preview:\n', resStrong.response.slice(0, 350));

  await mongoose.disconnect();
  process.exit(0);
}

testProfiles().catch(console.error);
