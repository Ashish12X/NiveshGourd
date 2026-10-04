// backend/src/models/SafetyReceipt.js
/**
 * SafetyReceipt Model
 * 
 * Secure, audit-ready summary of an investor safety verification or incident triage.
 * Summarizes observed signals, verification status, uncertainties, and next safe actions.
 * A receipt is NOT a certificate of investment approval or financial endorsement.
 */

import mongoose from 'mongoose';

const safetyReceiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    situation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    claim: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: [
        'VERIFIED',
        'CONTRADICTED',
        'NOT_VERIFIED',
        'INSUFFICIENT_EVIDENCE',
        'MANUAL_CHECK_REQUIRED',
        'LIVE_CHECK_UNAVAILABLE',
        'MIXED',
        'DOCUMENTED',
        'UNDER_TRIAGE'
      ],
      default: 'NOT_VERIFIED',
    },
    statusType: {
      type: String,
      enum: ['success', 'warning', 'danger', 'info', 'neutral'],
      default: 'warning',
    },
    riskSignalsCount: {
      type: Number,
      default: 0,
    },
    riskSignals: [{
      type: String,
      maxlength: 100,
    }],
    sourcesChecked: {
      type: Number,
      default: 0,
    },
    sources: [{
      type: String,
      maxlength: 255,
    }],
    uncertaintyNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: 'Record represents automated heuristic & contextual analysis at time of check.',
    },
    nextSteps: [{
      type: String,
      maxlength: 500,
    }],
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
    disclaimer: {
      type: String,
      default: 'This safety receipt records what was checked and known at this timestamp. It is NOT financial advice, endorsement, or certificate of safety.',
    },
  },
  {
    timestamps: true,
  }
);

safetyReceiptSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('SafetyReceipt', safetyReceiptSchema);
