// backend/src/services/assessmentService.js
import {
  ASSESSMENT_VERSION,
  ASSESSMENT_QUESTIONS,
  TOPIC_DOMAINS,
  getSanitizedQuestions,
} from '../data/assessmentQuestions.js';
import {
  evaluateAnswers,
  calculateTopicScores,
  calculateOverallMetadata,
} from './scoringService.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import UnderstandingProfile from '../models/UnderstandingProfile.js';

// Pre-index questions by ID for O(1) lookup
const QUESTIONS_MAP = ASSESSMENT_QUESTIONS.reduce((acc, q) => {
  acc[q.id] = q;
  return acc;
}, {});

/**
 * Returns sanitized assessment payload for the frontend
 */
export const getAssessmentForUser = async () => {
  return {
    version: ASSESSMENT_VERSION,
    estimatedMinutes: 5,
    totalQuestions: ASSESSMENT_QUESTIONS.length,
    domains: Object.values(TOPIC_DOMAINS),
    questions: getSanitizedQuestions(),
  };
};

/**
 * Validates and submits assessment answers, calculates scores,
 * and saves both AssessmentAttempt and UnderstandingProfile.
 */
export const submitAssessmentAttempt = async (userId, submissionData) => {
  const { assessmentVersion, answers, startedAt } = submissionData;

  // 1. Basic format validation
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    const error = new Error('Answers must be provided as a non-empty array.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate version
  if (assessmentVersion && assessmentVersion !== ASSESSMENT_VERSION) {
    const error = new Error(`Unsupported assessment version: ${assessmentVersion}. Expected: ${ASSESSMENT_VERSION}.`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Check for duplicates and validate questions
  const seenIds = new Set();
  const validConfidences = new Set(['low', 'medium', 'high']);

  for (const item of answers) {
    if (!item.questionId || !item.selectedOption || !item.confidence) {
      const error = new Error('Each answer must contain questionId, selectedOption, and confidence.');
      error.statusCode = 400;
      throw error;
    }

    if (seenIds.has(item.questionId)) {
      const error = new Error(`Duplicate answer submitted for question ID: ${item.questionId}.`);
      error.statusCode = 400;
      throw error;
    }
    seenIds.add(item.questionId);

    const questionDef = QUESTIONS_MAP[item.questionId];
    if (!questionDef) {
      const error = new Error(`Invalid question ID: ${item.questionId}.`);
      error.statusCode = 400;
      throw error;
    }

    const optionExists = questionDef.options.some(
      (opt) => String(opt.id).toLowerCase() === String(item.selectedOption).toLowerCase()
    );
    if (!optionExists) {
      const error = new Error(`Invalid option '${item.selectedOption}' for question ID: ${item.questionId}.`);
      error.statusCode = 400;
      throw error;
    }

    const normalizedConfidence = String(item.confidence).toLowerCase();
    if (!validConfidences.has(normalizedConfidence)) {
      const error = new Error(`Invalid confidence level '${item.confidence}'. Must be 'low', 'medium', or 'high'.`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Ensure all assessment questions were answered
  if (answers.length < ASSESSMENT_QUESTIONS.length) {
    const error = new Error(`Incomplete assessment. Answered ${answers.length} of ${ASSESSMENT_QUESTIONS.length} required questions.`);
    error.statusCode = 400;
    throw error;
  }

  // 5. Evaluate answers against server answer key
  const evaluatedAnswers = evaluateAnswers(answers, QUESTIONS_MAP);

  // 6. Calculate topic metrics & overall scores
  const topicResults = calculateTopicScores(evaluatedAnswers);
  const overallMetadata = calculateOverallMetadata(evaluatedAnswers, topicResults);

  // 7. Persist AssessmentAttempt (historical raw record)
  const attempt = await AssessmentAttempt.create({
    user: userId,
    assessmentVersion: ASSESSMENT_VERSION,
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    completedAt: new Date(),
    answers: evaluatedAnswers,
    topicResults,
    overallMetadata,
  });

  // 8. Build topics object for UnderstandingProfile
  const topicsState = {};
  topicResults.forEach((t) => {
    topicsState[t.topic] = {
      topicId: t.topic,
      label: t.topicLabel,
      knowledgeScore: t.knowledgeScore,
      confidenceScore: t.confidenceScore,
      practicalScore: t.practicalScore,
      status: t.status,
      evidenceCount: t.totalQuestions,
      misconceptionCount: t.misconceptionCount,
      explanation: t.explanation,
      lastUpdated: new Date(),
    };
  });

  // 9. Upsert UnderstandingProfile (current derived state)
  const understandingProfile = await UnderstandingProfile.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      topics: topicsState,
      baselineAssessmentCompleted: true,
      assessmentVersion: ASSESSMENT_VERSION,
      lastAssessmentAt: new Date(),
      source: 'baseline_assessment',
    },
    { new: true, upsert: true, runValidators: true }
  );

  // Identify prioritized learning focus (topics that need attention or have misconceptions)
  const needsAttentionTopics = topicResults.filter((t) => t.status === 'Needs Attention');
  const developingTopics = topicResults.filter((t) => t.status === 'Developing');
  const recommendedFirstTopic = needsAttentionTopics[0] || developingTopics[0] || topicResults[0];

  return {
    attemptId: attempt._id,
    assessmentVersion: ASSESSMENT_VERSION,
    completedAt: attempt.completedAt,
    topicResults,
    overallMetadata,
    recommendedFirstTopic: {
      topic: recommendedFirstTopic.topic,
      label: recommendedFirstTopic.topicLabel,
      status: recommendedFirstTopic.status,
      action: recommendedFirstTopic.explanation,
    },
    understandingProfile,
  };
};

/**
 * Returns latest completed assessment attempt for user
 */
export const getLatestAttemptForUser = async (userId) => {
  return await AssessmentAttempt.findOne({ user: userId })
    .sort({ completedAt: -1 })
    .select('-__v');
};

/**
 * Returns current UnderstandingProfile for user
 */
export const getUnderstandingProfileForUser = async (userId) => {
  let profile = await UnderstandingProfile.findOne({ user: userId }).select('-__v');

  // If no profile exists yet, return empty unassessed structure without creating fake DB scores
  if (!profile) {
    const unassessedTopics = {};
    Object.keys(TOPIC_DOMAINS).forEach((tId) => {
      unassessedTopics[tId] = {
        topicId: tId,
        label: TOPIC_DOMAINS[tId].label,
        knowledgeScore: 0,
        confidenceScore: 0,
        practicalScore: 0,
        status: 'Not Assessed',
        evidenceCount: 0,
        misconceptionCount: 0,
        explanation: 'Baseline assessment has not been completed yet.',
        lastUpdated: null,
      };
    });

    return {
      user: userId,
      topics: unassessedTopics,
      baselineAssessmentCompleted: false,
      assessmentVersion: ASSESSMENT_VERSION,
      lastAssessmentAt: null,
      source: 'unassessed',
    };
  }

  return profile;
};
