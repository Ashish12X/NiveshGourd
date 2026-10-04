// backend/src/models/ComparisonSession.js
/**
 * ComparisonSession Model — Stage 7
 *
 * Persists an authenticated user's factual comparison between two financial instruments.
 * Strictly adheres to the Neutral Fact Mandate:
 *   - No "winner", "best", "recommended", or "top choice" fields.
 *   - Stores verified factual matrix, authoritative sources, and uncertainty ratings.
 *   - User ownership enforced via user index.
 */

import mongoose from 'mongoose';

const matrixItemSchema = new mongoose.Schema(
  {
    criterionKey: { type: String, required: true },
    criterionLabel: { type: String, required: true },
    itemA: {
      value: { type: String, required: true },
      source: { type: String, default: '' },
      sourceType: { type: String, default: 'OFFICIAL_STATUTORY' },
      uncertainty: { type: String, default: 'KNOWN' },
      lastVerifiedAt: { type: Date, default: null },
    },
    itemB: {
      value: { type: String, required: true },
      source: { type: String, default: '' },
      sourceType: { type: String, default: 'OFFICIAL_STATUTORY' },
      uncertainty: { type: String, default: 'KNOWN' },
      lastVerifiedAt: { type: Date, default: null },
    },
  },
  { _id: false }
);

const comparisonSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productAId: {
      type: String,
      required: true,
      trim: true,
    },
    productBId: {
      type: String,
      required: true,
      trim: true,
    },
    productAName: {
      type: String,
      required: true,
    },
    productBName: {
      type: String,
      required: true,
    },
    selectedCriteria: [
      {
        type: String,
        required: true,
      },
    ],
    comparisonMatrix: [matrixItemSchema],
    neutralExplanation: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    adaptationMetadata: {
      depth: { type: String, enum: ['simple', 'standard', 'detailed'], default: 'standard' },
      jargon: { type: String, enum: ['minimal', 'moderate', 'technical'], default: 'moderate' },
      format: { type: String, default: 'structured' },
      profileTopicStatus: { type: String, default: 'Not Assessed' },
    },
    suggestedBridges: [
      {
        type: { type: String, required: true },
        label: { type: String, required: true },
        url: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ComparisonSession = mongoose.model('ComparisonSession', comparisonSessionSchema);

export default ComparisonSession;
