// backend/src/models/AssessmentAttempt.js
import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    topic: { type: String, required: true },
    type: { type: String, enum: ['theory', 'practical'], required: true },
    selectedOption: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    confidence: { type: String, enum: ['low', 'medium', 'high'], required: true },
    misconceptionFlag: { type: Boolean, default: false },
    weight: { type: Number, default: 1 },
  },
  { _id: false }
);

const topicResultSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    topicLabel: { type: String, required: true },
    knowledgeScore: { type: Number, required: true },
    practicalScore: { type: Number, required: true },
    confidenceScore: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Strong', 'Developing', 'Needs Attention', 'Not Assessed'],
      required: true,
    },
    explanation: { type: String, default: '' },
    correctAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    misconceptionCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentVersion: {
      type: String,
      required: true,
      default: '1.0',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    answers: [answerSchema],
    topicResults: [topicResultSchema],
    overallMetadata: {
      totalQuestions: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      practicalScore: { type: Number, default: 0 },
      confidenceScore: { type: Number, default: 0 },
      misconceptionCount: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

export default AssessmentAttempt;
