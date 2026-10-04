// backend/src/models/DecisionReadinessSession.js
/**
 * DecisionReadinessSession Model — Stage 7
 *
 * Persists an authenticated user's self-assessed information completeness check.
 * Strictly enforces that:
 *   - The score measures INFORMATION COMPLETENESS, NOT investment quality or suitability.
 *   - YES answers are categorized as USER_REPORTED, not certified or factually verified.
 *   - Each session is owned by a single user with strict ownership isolation.
 */

import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    answer: {
      type: String,
      enum: ['YES', 'NO', 'NOT_SURE'],
      default: 'NOT_SURE',
    },
    status: {
      type: String,
      enum: ['USER_REPORTED_COMPLETE', 'NOT_CHECKED', 'UNCERTAIN'],
      default: 'UNCERTAIN',
    },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { _id: false }
);

const unresolvedItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true },
    actionType: { type: String, required: true },
    actionLabel: { type: String, required: true },
    actionUrl: { type: String, required: true },
  },
  { _id: false }
);

const decisionReadinessSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      default: 'General Investment Decision',
      maxlength: 200,
    },
    checklist: [checklistItemSchema],
    totalCount: {
      type: Number,
      required: true,
      default: 10,
    },
    completedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    unresolvedCount: {
      type: Number,
      required: true,
      default: 10,
    },
    readinessPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    readinessLevel: {
      type: String,
      enum: [
        'Comprehensive Understanding',
        'Partially Informed — Pause on Gaps',
        'Significant Information Gaps',
      ],
      default: 'Significant Information Gaps',
    },
    unresolvedItems: [unresolvedItemSchema],
    neutralExplanation: {
      type: String,
      default: '',
      maxlength: 3000,
    },
    guardrailNotice: {
      type: String,
      default:
        'Self-Assessment Mandate: This score reflects your reported information completeness. It does not certify investment quality, profitability, or legal soundness. Always independently verify claims through official regulatory registries.',
    },
  },
  {
    timestamps: true,
  }
);

const DecisionReadinessSession = mongoose.model(
  'DecisionReadinessSession',
  decisionReadinessSessionSchema
);

export default DecisionReadinessSession;
