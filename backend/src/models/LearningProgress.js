// backend/src/models/LearningProgress.js
/**
 * LearningProgress Model — Stage 6
 *
 * Tracks granular user learning progress per topic:
 *   - Current section & completion status
 *   - Comprehension scores & practical scenario scores
 *   - Confidence calibration (low/medium/high)
 *   - Detected misconception signals (e.g. HIGH_CONFIDENCE_ERROR)
 *   - Help requests & attempts
 *
 * STATUS LIFECYCLE:
 *   NOT_STARTED -> IN_PROGRESS -> NEEDS_REVIEW / MASTERED
 *
 * INVARIANT:
 *   Mastery requires solid comprehension + practical success + zero active critical misconceptions.
 *   One lucky answer will NOT automatically set status to MASTERED.
 */

import mongoose from 'mongoose';

const misconceptionSignalSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., 'HIGH_CONFIDENCE_ERROR', 'MISCONCEPTION_OPTION_CHOSEN'
    questionId: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interactionLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['section_view', 'comprehension_answer', 'practical_attempt', 'confidence_submit', 'help_request'],
      required: true,
    },
    sectionIndex: { type: Number },
    questionId: { type: String },
    scenarioId: { type: String },
    selectedOption: { type: String },
    isCorrect: { type: Boolean },
    confidence: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', null], default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const learningProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: String,
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      enum: [
        'basicConcepts',
        'riskReturn',
        'fraudAwareness',
        'sourceVerification',
        'investorRights',
        'grievanceAwareness',
      ],
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'MASTERED'],
      default: 'NOT_STARTED',
    },
    currentSection: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Metrics
    comprehensionScore: {
      type: Number,
      default: 0, // 0 - 100
    },
    practicalScore: {
      type: Number,
      default: 0, // 0 - 100
    },
    lastConfidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', null],
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    mistakes: {
      type: Number,
      default: 0,
    },
    misconceptionSignals: [misconceptionSignalSchema],
    requestedHelpCount: {
      type: Number,
      default: 0,
    },
    interactionLogs: [interactionLogSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per user and topic
learningProgressSchema.index({ user: 1, topicId: 1 }, { unique: true });
learningProgressSchema.index({ user: 1, status: 1 });

const LearningProgress = mongoose.model('LearningProgress', learningProgressSchema);

export default LearningProgress;
