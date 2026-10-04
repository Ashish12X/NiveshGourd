// backend/src/models/LearningContent.js
/**
 * LearningContent Model — Stage 6 Adaptive Investor Learning Engine
 *
 * Stores structured, authoritative financial safety curriculum.
 * Each document represents a complete learning module with:
 *   - Domain mapping (matches 6 core UnderstandingProfile domains)
 *   - Progressive sections (explanation, example, warning)
 *   - Comprehension questions (with confidence tracking)
 *   - Practical scenarios (realistic investor situations)
 *   - Targeted misconceptions
 *   - Authoritative regulatory source citations
 *
 * INVARIANTS:
 *   - No fake AI-generated facts
 *   - Explicit official regulatory references (SEBI, RBI, AMFI, etc.)
 *   - Structured for deterministic assessment and Stage 4 AI explanation
 */

import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, maxlength: 200 },
    explanation: { type: String, required: true, maxlength: 3000 },
    example: { type: String, maxlength: 1000 },
    warning: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, required: true, maxlength: 1000 },
    misconceptionSignal: { type: String, default: null }, // e.g., 'BELIEVES_GUARANTEED_RETURNS_EXIST'
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true, maxlength: 500 },
    options: [optionSchema],
    learningTip: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const practicalScenarioSchema = new mongoose.Schema(
  {
    scenarioId: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    situation: { type: String, required: true, maxlength: 1500 },
    question: { type: String, required: true, maxlength: 500 },
    options: [optionSchema],
    reflectionNote: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

const officialSourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 200 },
    url: { type: String, required: true, maxlength: 500 },
    description: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const learningContentSchema = new mongoose.Schema(
  {
    topicId: {
      type: String,
      required: true,
      unique: true,
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
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 250,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 500,
    },
    learningObjective: {
      type: String,
      required: true,
      maxlength: 500,
    },
    difficulty: {
      type: String,
      enum: ['Fundamental', 'Intermediate', 'Advanced'],
      default: 'Fundamental',
    },
    estimatedMinutes: {
      type: Number,
      default: 5,
    },
    sections: [sectionSchema],
    keyTakeaways: [{ type: String, maxlength: 300 }],
    comprehensionQuestions: [questionSchema],
    practicalScenarios: [practicalScenarioSchema],
    misconceptionTargets: [{ type: String }],
    prerequisites: [{ type: String }],
    nextTopics: [{ type: String }],
    officialSources: [officialSourceSchema],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const LearningContent = mongoose.model('LearningContent', learningContentSchema);

export default LearningContent;
