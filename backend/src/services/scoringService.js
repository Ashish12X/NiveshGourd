// backend/src/services/scoringService.js
import { TOPIC_DOMAINS } from '../data/assessmentQuestions.js';

export const SCORING_THRESHOLDS = {
  STRONG_MIN: 75,
  DEVELOPING_MIN: 50,
};

export const CONFIDENCE_VALUES = {
  low: 33,
  medium: 66,
  high: 100,
};

/**
 * Predefined, deterministic explanation templates per topic and status.
 * Zero AI / LLM generation.
 */
const EXPLANATION_TEMPLATES = {
  basicConcepts: {
    Strong: 'Demonstrates clear grasp of capital preservation, asset liquidity, and core deposit protections.',
    Developing: 'Understands basic terms, but could benefit from clarifying lock-in periods and product suitability.',
    'Needs Attention': 'Would benefit from exploring fundamental product differences between assured deposits and market-linked assets.',
  },
  riskReturn: {
    Strong: 'Recognizes that high returns inherently carry downside market uncertainty and rejects unrealistic linearity.',
    Developing: 'Understands basic risk concepts; review how volatility and drawdown cycles affect long-term holdings.',
    'Needs Attention': 'Shows susceptibility to promises of risk-free high gains; worth reviewing the risk-return relationship.',
  },
  fraudAwareness: {
    Strong: 'Quickly spots warning signals including guaranteed returns, unverified chat groups, and high-pressure urgency.',
    Developing: 'Spots common scams, but should stay vigilant against subtle psychological urgency and private chat offers.',
    'Needs Attention': 'High priority learning opportunity: review SEBI rules against guaranteed returns and artificial pressure tactics.',
  },
  sourceVerification: {
    Strong: 'Rigorously checks official SEBI directories and rejects non-institutional personal account payments.',
    Developing: 'Aware of verification steps; ensure you always confirm entity registration on sebi.gov.in before depositing funds.',
    'Needs Attention': 'Critical safety step: learn to identify official broker payment channels and verify regulatory registrations.',
  },
  investorRights: {
    Strong: 'Well aware of contract note delivery timelines, statutory protections, and account credential confidentiality.',
    Developing: 'Understands general rights; remember that brokers and advisors are legally barred from asking for passwords or OTPs.',
    'Needs Attention': 'Important safety area: review statutory rights regarding transaction receipts, account security, and authorized trading.',
  },
  grievanceAwareness: {
    Strong: 'Knows official escalation mechanisms including SEBI SCORES 2.0 and SMART ODR dispute resolution.',
    Developing: 'Familiar with basic complaints; review the 30-day escalation timeline to SCORES if a broker does not resolve an issue.',
    'Needs Attention': 'Valuable safety knowledge: learn how to formally lodge complaints via SEBI SCORES and SMART ODR.',
  },
};

/**
 * Evaluates raw question submissions against trusted questions
 */
export const evaluateAnswers = (answers, trustedQuestionsMap) => {
  return answers.map((ans) => {
    const question = trustedQuestionsMap[ans.questionId];
    if (!question) {
      throw new Error(`Invalid question ID: ${ans.questionId}`);
    }

    const isCorrect = String(ans.selectedOption).toLowerCase() === String(question.correctOption).toLowerCase();
    const confidence = String(ans.confidence).toLowerCase();

    // Misconception: Confidently wrong answer
    const misconceptionFlag = !isCorrect && confidence === 'high';

    return {
      questionId: question.id,
      topic: question.topic,
      type: question.type,
      selectedOption: ans.selectedOption,
      isCorrect,
      confidence,
      misconceptionFlag,
      weight: question.weight || 1,
    };
  });
};

/**
 * Calculates topic scores and status deterministically
 */
export const calculateTopicScores = (evaluatedAnswers) => {
  const topicsMap = {};

  // Initialize all 6 standard domains
  Object.keys(TOPIC_DOMAINS).forEach((topicId) => {
    topicsMap[topicId] = {
      topic: topicId,
      topicLabel: TOPIC_DOMAINS[topicId].label,
      totalWeight: 0,
      earnedWeight: 0,
      practicalTotal: 0,
      practicalEarned: 0,
      confidenceTotal: 0,
      questionsCount: 0,
      correctAnswers: 0,
      misconceptionCount: 0,
    };
  });

  // Aggregate evaluated answers
  evaluatedAnswers.forEach((ans) => {
    const t = topicsMap[ans.topic];
    if (!t) return;

    t.questionsCount += 1;
    t.totalWeight += ans.weight;
    t.confidenceTotal += CONFIDENCE_VALUES[ans.confidence] || 50;

    if (ans.isCorrect) {
      t.correctAnswers += 1;
      t.earnedWeight += ans.weight;
    }

    if (ans.type === 'practical') {
      t.practicalTotal += ans.weight;
      if (ans.isCorrect) {
        t.practicalEarned += ans.weight;
      }
    }

    if (ans.misconceptionFlag) {
      t.misconceptionCount += 1;
    }
  });

  // Derive scores and qualitative statuses
  const topicResults = Object.keys(topicsMap).map((topicId) => {
    const t = topicsMap[topicId];

    if (t.questionsCount === 0) {
      return {
        topic: topicId,
        topicLabel: t.topicLabel,
        knowledgeScore: 0,
        practicalScore: 0,
        confidenceScore: 0,
        status: 'Not Assessed',
        explanation: 'No assessment questions completed for this topic.',
        correctAnswers: 0,
        totalQuestions: 0,
        misconceptionCount: 0,
      };
    }

    const knowledgeScore = Math.round((t.earnedWeight / t.totalWeight) * 100);
    const practicalScore = t.practicalTotal > 0
      ? Math.round((t.practicalEarned / t.practicalTotal) * 100)
      : knowledgeScore;
    const confidenceScore = Math.round(t.confidenceTotal / t.questionsCount);

    // Qualitative status determination
    let status = 'Developing';
    if (knowledgeScore >= SCORING_THRESHOLDS.STRONG_MIN) {
      // If the user has a confident misconception in this topic, temper to Developing
      status = t.misconceptionCount > 0 ? 'Developing' : 'Strong';
    } else if (knowledgeScore < SCORING_THRESHOLDS.DEVELOPING_MIN) {
      status = 'Needs Attention';
    } else {
      status = 'Developing';
    }

    // Explanation
    let explanation = EXPLANATION_TEMPLATES[topicId]?.[status] || 'Assessment baseline recorded.';
    if (t.misconceptionCount > 0) {
      explanation += ' One of your answers suggests an important topic area worth reviewing.';
    }

    return {
      topic: topicId,
      topicLabel: t.topicLabel,
      knowledgeScore,
      practicalScore,
      confidenceScore,
      status,
      explanation,
      correctAnswers: t.correctAnswers,
      totalQuestions: t.questionsCount,
      misconceptionCount: t.misconceptionCount,
    };
  });

  return topicResults;
};

/**
 * Calculates overall metadata
 */
export const calculateOverallMetadata = (evaluatedAnswers, topicResults) => {
  const totalQuestions = evaluatedAnswers.length;
  const correctAnswers = evaluatedAnswers.filter((a) => a.isCorrect).length;
  const misconceptionCount = evaluatedAnswers.filter((a) => a.misconceptionFlag).length;

  const totalConfidence = evaluatedAnswers.reduce(
    (sum, a) => sum + (CONFIDENCE_VALUES[a.confidence] || 50),
    0
  );
  const confidenceScore = totalQuestions > 0 ? Math.round(totalConfidence / totalQuestions) : 0;

  const practicalAnswers = evaluatedAnswers.filter((a) => a.type === 'practical');
  const practicalCorrect = practicalAnswers.filter((a) => a.isCorrect).length;
  const practicalScore = practicalAnswers.length > 0
    ? Math.round((practicalCorrect / practicalAnswers.length) * 100)
    : 0;

  const totalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    correctAnswers,
    practicalScore,
    confidenceScore,
    misconceptionCount,
    totalScore,
  };
};
