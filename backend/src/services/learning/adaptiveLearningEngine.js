// backend/src/services/learning/adaptiveLearningEngine.js
/**
 * Adaptive Next Topic Engine — Stage 6
 *
 * Core Decision Logic:
 *   Inputs:
 *     - UnderstandingProfile (topics, knowledgeScores, misconceptionCount, status)
 *     - LearningProgress records for this user (comprehensionScore, practicalScore, mistakes, misconceptions, status)
 *     - Contextual triggers (e.g. from recent Stage 5 verification risk signals)
 *
 * POLICY PRIORITY:
 *   1. CONTEXTUAL REMEDIATION (e.g., user just checked a guaranteed return claim in Stage 5)
 *   2. ACTIVE MISCONCEPTIONS (e.g., user made high-confidence mistakes in recent interactions)
 *   3. WEAK TOPICS ('Needs Attention' in UnderstandingProfile)
 *   4. DEVELOPING TOPICS ('Developing' in UnderstandingProfile)
 *   5. INCOMPLETE IN-PROGRESS TOPICS
 *   6. UNATTEMPTED PREREQUISITES
 *   7. MASTERED EXTENSIONS / DEEPER APPLICATIONS
 *
 * INVARIANTS:
 *   - Topic recommendations are deterministic and explainable
 *   - No hidden chain-of-thought leaked to client
 *   - User model is per-domain, never generic "Beginner/Advanced"
 */

import LearningContent from '../../models/LearningContent.js';
import LearningProgress from '../../models/LearningProgress.js';
import UnderstandingProfile from '../../models/UnderstandingProfile.js';

export const LEARNING_MODES = {
  CONTEXTUAL_SAFETY: 'CONTEXTUAL_SAFETY',
  MISCONCEPTION_REMEDIATION: 'MISCONCEPTION_REMEDIATION',
  FOUNDATIONAL_REMEDIATION: 'FOUNDATIONAL_REMEDIATION',
  PRACTICAL_APPLICATION: 'PRACTICAL_APPLICATION',
  MASTERY_EXTENSION: 'MASTERY_EXTENSION',
  CURRICULUM_CONTINUATION: 'CURRICULUM_CONTINUATION',
};

/**
 * Determine the next recommended topic for a user.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.contextualRiskSignal] - Optional signal from Stage 5 verification (e.g., GUARANTEED_RETURN_CLAIM)
 * @returns {Promise<object>} Recommendation metadata { topic, reasonCode, reason, learningMode }
 */
export const determineNextTopic = async ({ userId, contextualRiskSignal = null }) => {
  // 1. Fetch user's UnderstandingProfile & all LearningProgress
  const [profile, progressList, allTopics] = await Promise.all([
    UnderstandingProfile.findOne({ user: userId }).lean(),
    LearningProgress.find({ user: userId }).lean(),
    LearningContent.find({ active: true }).lean(),
  ]);

  if (!allTopics || allTopics.length === 0) {
    return null;
  }

  const progressMap = new Map();
  progressList.forEach((p) => progressMap.set(p.topicId, p));

  // ── RULE 1: Contextual Trigger from Stage 5 Verification ───────────────────
  if (contextualRiskSignal) {
    let targetDomain = null;
    let targetTopicId = null;

    if (
      contextualRiskSignal.includes('GUARANTEED_RETURN') ||
      contextualRiskSignal.includes('HIGH_RETURN')
    ) {
      targetTopicId = 'recognizing-guaranteed-return-myths';
      targetDomain = 'riskReturn';
    } else if (
      contextualRiskSignal.includes('REGULATORY') ||
      contextualRiskSignal.includes('UNOFFICIAL_CHANNEL') ||
      contextualRiskSignal.includes('DOMAIN')
    ) {
      targetTopicId = 'verify-before-you-trust';
      targetDomain = 'sourceVerification';
    } else if (
      contextualRiskSignal.includes('CREDENTIAL') ||
      contextualRiskSignal.includes('PAYMENT_PRESSURE') ||
      contextualRiskSignal.includes('WITHDRAWAL')
    ) {
      targetTopicId = 'spotting-telegram-task-scams';
      targetDomain = 'fraudAwareness';
    }

    if (targetTopicId) {
      const matchedTopic = allTopics.find((t) => t.topicId === targetTopicId);
      if (matchedTopic) {
        return {
          topic: matchedTopic,
          reasonCode: 'CONTEXTUAL_SAFETY_TRIGGER',
          reason: `Recommended based on risk signals detected in your recent claim verification (${contextualRiskSignal.replace(/_/g, ' ')}).`,
          learningMode: LEARNING_MODES.CONTEXTUAL_SAFETY,
        };
      }
    }
  }

  // ── RULE 2: Active Misconceptions / High-Confidence Errors ─────────────────
  // Find topics where user has unresolved misconception signals
  const topicsWithMisconceptions = progressList.filter(
    (p) =>
      p.status === 'NEEDS_REVIEW' ||
      (p.misconceptionSignals && p.misconceptionSignals.length > 0 && p.status !== 'MASTERED')
  );

  if (topicsWithMisconceptions.length > 0) {
    // Sort by recent misconception timestamp
    topicsWithMisconceptions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const targetProgress = topicsWithMisconceptions[0];
    const matchedTopic = allTopics.find((t) => t.topicId === targetProgress.topicId);

    if (matchedTopic) {
      const hasHighConf = targetProgress.misconceptionSignals?.some(
        (m) => m.type === 'HIGH_CONFIDENCE_ERROR'
      );
      return {
        topic: matchedTopic,
        reasonCode: 'ACTIVE_MISCONCEPTION_DETECTED',
        reason: hasHighConf
          ? 'You recently answered a scenario with high confidence but chose an incorrect option. Let\'s review this misconception.'
          : 'Your previous practice revealed a misconception in this area. Reviewing will solidify your foundation.',
        learningMode: LEARNING_MODES.MISCONCEPTION_REMEDIATION,
      };
    }
  }

  // ── RULE 3: Weak Domain in UnderstandingProfile ('Needs Attention') ────────
  if (profile && profile.topics) {
    const profileTopics = profile.topics;
    // Ordered list of priority domains
    const domainPriority = [
      'sourceVerification',
      'fraudAwareness',
      'riskReturn',
      'investorRights',
      'grievanceAwareness',
      'basicConcepts',
    ];

    // Check for "Needs Attention"
    for (const d of domainPriority) {
      const domainState = profileTopics[d];
      if (domainState && (domainState.status === 'Needs Attention' || domainState.misconceptionCount > 0)) {
        // Find an uncompleted topic in this domain
        const candidate = allTopics.find(
          (t) => t.domain === d && progressMap.get(t.topicId)?.status !== 'MASTERED'
        );
        if (candidate) {
          return {
            topic: candidate,
            reasonCode: `WEAK_DOMAIN_${d.toUpperCase()}`,
            reason: `Your Understanding Map indicates that ${domainState.label} needs attention (${domainState.knowledgeScore}% calibrated score).`,
            learningMode: LEARNING_MODES.FOUNDATIONAL_REMEDIATION,
          };
        }
      }
    }

    // Check for "Developing"
    for (const d of domainPriority) {
      const domainState = profileTopics[d];
      if (domainState && domainState.status === 'Developing') {
        const candidate = allTopics.find(
          (t) => t.domain === d && progressMap.get(t.topicId)?.status !== 'MASTERED'
        );
        if (candidate) {
          return {
            topic: candidate,
            reasonCode: `DEVELOPING_DOMAIN_${d.toUpperCase()}`,
            reason: `Strengthen your practical decision-making in ${domainState.label}.`,
            learningMode: LEARNING_MODES.PRACTICAL_APPLICATION,
          };
        }
      }
    }
  }

  // ── RULE 4: Continue In-Progress Topic ─────────────────────────────────────
  const inProgress = progressList.find((p) => p.status === 'IN_PROGRESS');
  if (inProgress) {
    const candidate = allTopics.find((t) => t.topicId === inProgress.topicId);
    if (candidate) {
      return {
        topic: candidate,
        reasonCode: 'CONTINUE_IN_PROGRESS',
        reason: 'Pick up right where you left off in your ongoing module.',
        learningMode: LEARNING_MODES.CURRICULUM_CONTINUATION,
      };
    }
  }

  // ── RULE 5: Next Uncompleted Topic in Natural Curriculum ──────────────────
  const uncompleted = allTopics.find((t) => progressMap.get(t.topicId)?.status !== 'MASTERED');
  if (uncompleted) {
    return {
      topic: uncompleted,
      reasonCode: 'NEXT_CURRICULUM_TOPIC',
      reason: 'Continue building your complete investor safety baseline.',
      learningMode: LEARNING_MODES.CURRICULUM_CONTINUATION,
    };
  }

  // ── RULE 6: All Mastered -> Review or Deepen ──────────────────────────────
  const firstTopic = allTopics[0];
  return {
    topic: firstTopic,
    reasonCode: 'ALL_MODULES_COMPLETED',
    reason: 'Outstanding work! All modules are mastered. Review key topics anytime to keep skills sharp.',
    learningMode: LEARNING_MODES.MASTERY_EXTENSION,
  };
};

/**
 * Categorize topics for the Learn overview dashboard.
 */
export const categorizeUserTopics = (allTopics, progressList, profile) => {
  const progressMap = new Map();
  progressList.forEach((p) => progressMap.set(p.topicId, p));

  const continueLearning = [];
  const needsReview = [];
  const mastered = [];
  const available = [];

  allTopics.forEach((topic) => {
    const prog = progressMap.get(topic.topicId);
    const domainState = profile?.topics?.[topic.domain];

    const enriched = {
      ...topic,
      userProgress: prog
        ? {
            status: prog.status,
            currentSection: prog.currentSection,
            comprehensionScore: prog.comprehensionScore,
            practicalScore: prog.practicalScore,
            lastConfidence: prog.lastConfidence,
            hasMisconceptions: prog.misconceptionSignals?.length > 0,
          }
        : {
            status: 'NOT_STARTED',
            currentSection: 0,
            comprehensionScore: 0,
            practicalScore: 0,
            lastConfidence: null,
            hasMisconceptions: false,
          },
      domainStatus: domainState?.status || 'Not Assessed',
      domainScore: domainState?.knowledgeScore || 0,
    };

    if (prog?.status === 'IN_PROGRESS') {
      continueLearning.push(enriched);
    } else if (prog?.status === 'NEEDS_REVIEW' || prog?.misconceptionSignals?.length > 0) {
      needsReview.push(enriched);
    } else if (prog?.status === 'MASTERED') {
      mastered.push(enriched);
    } else {
      available.push(enriched);
    }
  });

  return {
    continueLearning,
    needsReview,
    mastered,
    available,
  };
};
