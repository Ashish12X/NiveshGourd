// backend/src/services/learning/learningService.js
/**
 * Learning Service — Stage 6 Orchestrator
 *
 * Core Workflows:
 *   1. Initialise / Seed Curriculum in MongoDB
 *   2. Retrieve Topics with user progress & personalization
 *   3. Record User Interactions (comprehension check, practical scenario, confidence)
 *   4. Bounded incremental update to UnderstandingProfile
 *   5. AI-Assisted Explanations (reusing Stage 4 adaptation policy & LLM service)
 *
 * INVARIANTS:
 *   - No single lucky question jumps user score from 0 to 100
 *   - High-confidence wrong answers trigger explicit misconception signals
 *   - UnderstandingProfile retains historical context with bounded updates
 *   - AI explanations strictly interpret verified curriculum without inventing financial facts
 */

import LearningContent from '../../models/LearningContent.js';
import LearningProgress from '../../models/LearningProgress.js';
import UnderstandingProfile from '../../models/UnderstandingProfile.js';
import InteractionEvent from '../../models/InteractionEvent.js';
import { INITIAL_CURRICULUM } from '../../data/learningCurriculum.js';
import { buildAdaptationPlan } from '../adaptive/adaptationPolicy.js';
import { callLLM } from '../ai/llmService.js';
import { determineNextTopic, categorizeUserTopics } from './adaptiveLearningEngine.js';

/**
 * Ensures initial learning curriculum is seeded in MongoDB.
 */
export const seedCurriculumIfEmpty = async () => {
  const count = await LearningContent.countDocuments();
  if (count === 0) {
    console.log('[learningService] Seeding initial curriculum modules...');
    await LearningContent.insertMany(INITIAL_CURRICULUM);
    console.log(`[learningService] Seeded ${INITIAL_CURRICULUM.length} curriculum modules.`);
  }
};

/**
 * Retrieve all topics enriched with user progress & next recommendation.
 *
 * @param {string} userId
 * @param {string} [contextualSignal]
 */
export const getLearningDashboard = async (userId, contextualSignal = null) => {
  await seedCurriculumIfEmpty();

  const [allTopics, userProgressList, userProfile] = await Promise.all([
    LearningContent.find({ active: true }).lean(),
    LearningProgress.find({ user: userId }).lean(),
    UnderstandingProfile.findOne({ user: userId }).lean(),
  ]);

  const recommended = await determineNextTopic({
    userId,
    contextualRiskSignal: contextualSignal,
  });

  const categorized = categorizeUserTopics(allTopics, userProgressList, userProfile);

  return {
    recommended,
    categorized,
    totalTopics: allTopics.length,
    userCompletedCount: userProgressList.filter((p) => p.status === 'MASTERED').length,
  };
};

/**
 * Get a specific topic with adaptive explanation tailored to the user's profile.
 *
 * @param {string} topicId
 * @param {object} user - Authenticated User document
 */
export const getTopicForUser = async (topicId, user) => {
  await seedCurriculumIfEmpty();

  const [topicDoc, progressDoc, profileDoc] = await Promise.all([
    LearningContent.findOne({ topicId, active: true }).lean(),
    LearningProgress.findOne({ user: user._id, topicId }).lean(),
    UnderstandingProfile.findOne({ user: user._id }).lean(),
  ]);

  if (!topicDoc) return null;

  // Build Stage 4 adaptation plan
  let profileTopics = {};
  if (profileDoc && profileDoc.topics) {
    for (const [key, val] of Object.entries(profileDoc.topics)) {
      profileTopics[key] = { status: val.status, knowledgeScore: val.knowledgeScore };
    }
  }

  const adaptationPlan = buildAdaptationPlan({
    intent: 'learn',
    relevantTopics: [topicDoc.domain],
    understandingProfile: profileTopics,
    userPreferences: user.preferences || {},
    safetyLevel: 'normal',
    intentConfidence: 'high',
  });

  return {
    topic: topicDoc,
    progress: progressDoc || {
      status: 'NOT_STARTED',
      currentSection: 0,
      comprehensionScore: 0,
      practicalScore: 0,
      lastConfidence: null,
      misconceptionSignals: [],
    },
    adaptation: {
      depth: adaptationPlan.depth,
      jargon: adaptationPlan.jargon,
      format: adaptationPlan.format,
      language: adaptationPlan.language,
      summary: adaptationPlan.adaptationSummary,
    },
  };
};

/**
 * Start or resume a learning module.
 */
export const startTopic = async (topicId, userId) => {
  const topic = await LearningContent.findOne({ topicId, active: true });
  if (!topic) throw new Error('TOPIC_NOT_FOUND');

  let progress = await LearningProgress.findOne({ user: userId, topicId });
  if (!progress) {
    progress = await LearningProgress.create({
      user: userId,
      topicId,
      domain: topic.domain,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      lastAccessedAt: new Date(),
      currentSection: 0,
    });
  } else {
    progress.lastAccessedAt = new Date();
    if (progress.status === 'NOT_STARTED') {
      progress.status = 'IN_PROGRESS';
      progress.startedAt = new Date();
    }
    await progress.save();
  }

  // Telemetry log
  await InteractionEvent.create({
    user: userId,
    intent: 'learn',
    relevantTopics: [topic.domain],
    timestamp: new Date(),
  }).catch(() => {});

  return progress;
};

/**
 * Record a user interaction during learning (Comprehension question or Practical scenario).
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.topicId
 * @param {string} params.interactionType - 'comprehension_answer' | 'practical_attempt' | 'confidence_submit' | 'section_view'
 * @param {number} [params.sectionIndex]
 * @param {string} [params.questionId]
 * @param {string} [params.scenarioId]
 * @param {string} [params.selectedOption]
 * @param {string} [params.confidence] - 'LOW' | 'MEDIUM' | 'HIGH'
 */
export const recordLearningInteraction = async ({
  userId,
  topicId,
  interactionType,
  sectionIndex,
  questionId,
  scenarioId,
  selectedOption,
  confidence,
}) => {
  const topic = await LearningContent.findOne({ topicId, active: true });
  if (!topic) throw new Error('TOPIC_NOT_FOUND');

  let progress = await LearningProgress.findOne({ user: userId, topicId });
  if (!progress) {
    progress = await LearningProgress.create({
      user: userId,
      topicId,
      domain: topic.domain,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });
  }

  let evaluationResult = null;
  const isConfidenceSubmission = interactionType === 'confidence_submit' || Boolean(confidence);

  if (confidence) {
    progress.lastConfidence = confidence;
  }

  // ── Handle Comprehension Question ──────────────────────────────────────────
  if (interactionType === 'comprehension_answer' && questionId) {
    const qObj = topic.comprehensionQuestions.find((q) => q.questionId === questionId);
    if (qObj) {
      const chosenOpt = qObj.options.find((o) => o.id === selectedOption);
      const isCorrect = chosenOpt ? chosenOpt.isCorrect : false;

      evaluationResult = {
        questionId,
        isCorrect,
        explanation: chosenOpt ? chosenOpt.explanation : 'Evaluation completed.',
        learningTip: qObj.learningTip,
      };

      progress.attempts += 1;
      if (!isCorrect) {
        progress.mistakes += 1;
      }

      // Check for misconception option chosen
      if (chosenOpt && chosenOpt.misconceptionSignal) {
        progress.misconceptionSignals.push({
          type: chosenOpt.misconceptionSignal,
          questionId,
          details: `Chose option ${selectedOption}: ${chosenOpt.text}`,
        });
      }

      // Check for CRITICAL: WRONG + HIGH CONFIDENCE
      if (!isCorrect && confidence === 'HIGH') {
        progress.misconceptionSignals.push({
          type: 'HIGH_CONFIDENCE_ERROR',
          questionId,
          details: 'Answered comprehension question incorrectly with HIGH confidence.',
        });
        progress.status = 'NEEDS_REVIEW';
      }

      // Evidence-weighted comprehension scoring (prevents 0 → MASTERED in one answer)
      // If no prior score, start from 50 as baseline; then adjust by ±25/−15
      const prevComp = progress.comprehensionScore || 50;
      const compDelta = isCorrect ? 25 : -15;
      progress.comprehensionScore = Math.min(100, Math.max(0, prevComp + compDelta));

      // Log interaction
      progress.interactionLogs.push({
        type: 'comprehension_answer',
        questionId,
        selectedOption,
        isCorrect,
        confidence: confidence || null,
      });
    }
  }

  // ── Handle Practical Scenario Attempt ──────────────────────────────────────
  if (interactionType === 'practical_attempt' && scenarioId) {
    const sObj = topic.practicalScenarios.find((s) => s.scenarioId === scenarioId);
    if (sObj) {
      const chosenOpt = sObj.options.find((o) => o.id === selectedOption);
      const isCorrect = chosenOpt ? chosenOpt.isCorrect : false;

      evaluationResult = {
        scenarioId,
        isCorrect,
        explanation: chosenOpt ? chosenOpt.explanation : 'Scenario evaluated.',
        reflectionNote: sObj.reflectionNote,
      };

      progress.attempts += 1;
      if (!isCorrect) {
        progress.mistakes += 1;
      }

      // Misconception flags
      if (chosenOpt && chosenOpt.misconceptionSignal) {
        progress.misconceptionSignals.push({
          type: chosenOpt.misconceptionSignal,
          scenarioId,
          details: `Scenario mistake: ${chosenOpt.text}`,
        });
      }

      // HIGH CONFIDENCE MISTAKE in Practical
      if (!isCorrect && confidence === 'HIGH') {
        progress.misconceptionSignals.push({
          type: 'HIGH_CONFIDENCE_ERROR',
          scenarioId,
          details: 'Chose high-risk practical action with HIGH confidence.',
        });
        progress.status = 'NEEDS_REVIEW';
      }

      // Evidence-weighted practical scoring
      const prevPrac = progress.practicalScore || 50;
      const pracDelta = isCorrect ? 25 : -15;
      progress.practicalScore = Math.min(100, Math.max(0, prevPrac + pracDelta));

      progress.interactionLogs.push({
        type: 'practical_attempt',
        scenarioId,
        selectedOption,
        isCorrect,
        confidence: confidence || null,
      });
    }
  }

  // ── Handle Section Navigation ──────────────────────────────────────────────
  if (typeof sectionIndex === 'number') {
    progress.currentSection = Math.max(progress.currentSection, sectionIndex);
  }

  progress.lastAccessedAt = new Date();
  await progress.save();

  // ── Bounded update to UnderstandingProfile ─────────────────────────────────
  if (evaluationResult) {
    await updateUnderstandingProfileWithLearningEvidence({
      userId,
      domain: topic.domain,
      isCorrect: evaluationResult.isCorrect,
      isPractical: Boolean(scenarioId),
      confidence: confidence || progress.lastConfidence,
      hasMisconception: progress.misconceptionSignals.length > 0,
    });
  }

  return {
    progress,
    evaluation: evaluationResult,
  };
};

/**
 * Complete a learning module and determine adaptive next step.
 */
export const completeTopic = async (topicId, userId) => {
  const topic = await LearningContent.findOne({ topicId, active: true });
  if (!topic) throw new Error('TOPIC_NOT_FOUND');

  const progress = await LearningProgress.findOne({ user: userId, topicId });
  if (!progress) throw new Error('PROGRESS_NOT_FOUND');

  // Mastery criteria:
  // Comprehension >= 70 AND Practical >= 70 AND no unresolved HIGH_CONFIDENCE_ERROR
  const hasHighConfError = progress.misconceptionSignals.some(
    (m) => m.type === 'HIGH_CONFIDENCE_ERROR'
  );

  if (progress.comprehensionScore >= 70 && progress.practicalScore >= 70 && !hasHighConfError) {
    progress.status = 'MASTERED';
    progress.completedAt = new Date();
  } else {
    progress.status = 'NEEDS_REVIEW';
  }

  progress.lastAccessedAt = new Date();
  await progress.save();

  // Fetch adaptive next recommendation
  let nextRecommendation = await determineNextTopic({ userId });

  // If status is NEEDS_REVIEW, guarantee an explicit review recommendation
  if (progress.status === 'NEEDS_REVIEW') {
    if (!nextRecommendation || !nextRecommendation.topic) {
      nextRecommendation = {
        topic,
        topicId: topic.topicId,
        reasonCode: 'MISCONCEPTION_REVIEW',
        reason: 'Review this topic to address the misconception detected in your practice.',
        learningMode: 'MISCONCEPTION_REMEDIATION',
      };
    }
  }

  return {
    completedTopicId: topicId,
    status: progress.status,
    comprehensionScore: progress.comprehensionScore,
    practicalScore: progress.practicalScore,
    misconceptionCount: progress.misconceptionSignals.length,
    nextRecommendation,
  };
};

/**
 * Ask SANGYAN AI Tutor about this learning module.
 * Reuses Stage 4 AI infrastructure + adaptation plan.
 */
export const askAITutorAboutTopic = async ({ topicId, userQuestion, user }) => {
  const topic = await LearningContent.findOne({ topicId, active: true }).lean();
  if (!topic) throw new Error('TOPIC_NOT_FOUND');

  const profileDoc = await UnderstandingProfile.findOne({ user: user._id }).lean();
  let profileTopics = {};
  if (profileDoc && profileDoc.topics) {
    for (const [key, val] of Object.entries(profileDoc.topics)) {
      profileTopics[key] = { status: val.status };
    }
  }

  const adaptationPlan = buildAdaptationPlan({
    intent: 'learn',
    relevantTopics: [topic.domain],
    understandingProfile: profileTopics,
    userPreferences: user.preferences || {},
    safetyLevel: 'normal',
    intentConfidence: 'high',
  });

  // Fact-locked system prompt based strictly on verified curriculum
  const systemPrompt = `You are SANGYAN, an empathetic, authoritative Indian investor safety companion.
You are currently answering a learner's question inside the educational module: "${topic.title}".

CURRICULUM CONTEXT:
Domain: ${topic.domain}
Objective: ${topic.learningObjective}
Key Takeaways: ${topic.keyTakeaways.join(' | ')}
Official Regulatory Citations: ${topic.officialSources.map((s) => `${s.name} (${s.url})`).join(', ')}

ADAPTATION GUIDELINES:
- Explanation Depth: ${adaptationPlan.depth}
- Language / Jargon: ${adaptationPlan.jargon} (Explain technical concepts plainly)
- Format: ${adaptationPlan.format}
- Language: ${adaptationPlan.language}

STRICT SAFETY CONSTRAINTS:
- NEVER give buy, sell, or hold recommendations for any specific stock, fund, or crypto.
- NEVER guarantee or project future financial returns.
- NEVER fabricate regulatory laws or make up SEBI/RBI approval claims.
- Maintain a patient, encouraging, non-condescending educational tone.`;

  try {
    const aiResponse = await callLLM(systemPrompt, userQuestion);
    return {
      reply: aiResponse,
      adaptationSummary: adaptationPlan.adaptationSummary,
    };
  } catch (err) {
    // Graceful fallback to verified key takeaway
    return {
      reply: `In the Indian regulatory framework regarding ${topic.title}: ${topic.keyTakeaways[0]} Remember that legitimate intermediaries will always have verifiable credentials listed on official portals like sebi.gov.in or sachet.rbi.org.in.`,
      adaptationSummary: 'Deterministic curriculum fallback (AI offline).',
    };
  }
};

/**
 * Incremental, bounded update to UnderstandingProfile based on learning evidence.
 * Preserves baseline calibration history.
 */
async function updateUnderstandingProfileWithLearningEvidence({
  userId,
  domain,
  isCorrect,
  isPractical,
  confidence,
  hasMisconception,
}) {
  try {
    const profile = await UnderstandingProfile.findOne({ user: userId });
    if (!profile || !profile.topics || !profile.topics[domain]) return;

    const topicState = profile.topics[domain];
    const delta = isCorrect ? 4 : -4; // Small, bounded evidence adjustment

    if (isPractical) {
      topicState.practicalScore = Math.min(100, Math.max(0, (topicState.practicalScore || 50) + delta));
    } else {
      topicState.knowledgeScore = Math.min(100, Math.max(0, (topicState.knowledgeScore || 50) + delta));
    }

    if (hasMisconception) {
      topicState.misconceptionCount = (topicState.misconceptionCount || 0) + 1;
    }

    // Recalculate status based on bounded scores
    const avg = ((topicState.knowledgeScore || 0) + (topicState.practicalScore || 0)) / 2;
    if (avg >= 75 && topicState.misconceptionCount === 0) {
      topicState.status = 'Strong';
    } else if (avg >= 45) {
      topicState.status = 'Developing';
    } else {
      topicState.status = 'Needs Attention';
    }

    topicState.evidenceCount = (topicState.evidenceCount || 0) + 1;
    topicState.lastUpdated = new Date();

    await profile.save();
  } catch (err) {
    console.warn('[learningService] Error in bounded UnderstandingProfile update:', err.message);
  }
}
