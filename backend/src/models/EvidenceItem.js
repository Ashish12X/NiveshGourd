// backend/src/models/EvidenceItem.js
/**
 * EvidenceItem Model
 * 
 * Securely stores user-preserved evidence related to investor safety events.
 * Scoped strictly to authenticated users.
 * Sensitive credentials (OTP, PIN, passwords, cookies) are NEVER stored.
 */

import mongoose from 'mongoose';

const evidenceItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    category: {
      type: String,
      enum: ['Screenshots', 'Documents', 'Messages', 'Links', 'Transaction records', 'Other'],
      default: 'Documents',
    },
    size: {
      type: String,
      default: 'Unknown',
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    tag: {
      type: String,
      default: 'User Preserved',
      maxlength: 50,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['RECORDED', 'VERIFIED_LINKED', 'UNDER_REVIEW', 'ARCHIVED'],
      default: 'RECORDED',
    },
    uncertaintyNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: 'Self-reported evidence preserved for factual reference.',
    },
    relatedAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationAnalysis',
      default: null,
    },
    relatedIncidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    metadata: {
      url: { type: String, maxlength: 500, default: null },
      platform: { type: String, maxlength: 100, default: null },
      riskSignals: [{ type: String, maxlength: 100 }],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user query isolation
evidenceItemSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('EvidenceItem', evidenceItemSchema);
