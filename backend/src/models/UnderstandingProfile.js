// backend/src/models/UnderstandingProfile.js
import mongoose from 'mongoose';

const topicStateSchema = new mongoose.Schema(
  {
    topicId: { type: String, required: true },
    label: { type: String, required: true },
    knowledgeScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    practicalScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Strong', 'Developing', 'Needs Attention', 'Not Assessed'],
      default: 'Not Assessed',
    },
    evidenceCount: { type: Number, default: 0 },
    misconceptionCount: { type: Number, default: 0 },
    explanation: { type: String, default: '' },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const understandingProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    topics: {
      basicConcepts: { type: topicStateSchema, required: true },
      riskReturn: { type: topicStateSchema, required: true },
      fraudAwareness: { type: topicStateSchema, required: true },
      sourceVerification: { type: topicStateSchema, required: true },
      investorRights: { type: topicStateSchema, required: true },
      grievanceAwareness: { type: topicStateSchema, required: true },
    },
    baselineAssessmentCompleted: {
      type: Boolean,
      default: false,
    },
    assessmentVersion: {
      type: String,
      default: '1.0',
    },
    lastAssessmentAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      default: 'baseline_assessment',
    },
  },
  {
    timestamps: true,
  }
);

const UnderstandingProfile = mongoose.model(
  'UnderstandingProfile',
  understandingProfileSchema
);

export default UnderstandingProfile;
