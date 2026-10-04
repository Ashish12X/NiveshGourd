// backend/src/models/Incident.js
/**
 * Incident Model
 * 
 * Provides structured documentation and official grievance routing when something has gone wrong.
 * NiveshGuard does NOT act as police, bank, or court. It organizes evidence and guides the user
 * to the appropriate statutory authority (1930 Cybercrime, SEBI SCORES 2.0, RBI CMS, etc.).
 * Scoped strictly to authenticated users.
 */

import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    incidentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'suspicious-message',
        'sent-money',
        'withdrawal-blocked',
        'account-issue',
        'think-scammed',
        'help-with-complaint',
        'something-else',
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['OPEN', 'DOCUMENTED', 'ACTION_RECOMMENDED', 'RESOLVED'],
      default: 'DOCUMENTED',
    },
    details: {
      amount: { type: String, maxlength: 100, default: '' },
      platform: { type: String, maxlength: 200, default: '' },
      occurredAt: { type: String, maxlength: 100, default: '' },
      utr: { type: String, maxlength: 100, default: '' },
      notes: { type: String, maxlength: 4000, default: '' },
    },
    immediateSafetyGuidance: [{
      type: String,
      maxlength: 500,
    }],
    officialChannels: [{
      name: { type: String, required: true },
      identifier: { type: String, required: true },
      action: { type: String, required: true },
      badge: { type: String, default: '' },
      urgency: { type: String, default: 'Standard' },
    }],
    evidenceIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EvidenceItem',
    }],
    verificationIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationAnalysis',
    }],
    safetyReceiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SafetyReceipt',
      default: null,
    },
    disclaimer: {
      type: String,
      default: 'NiveshGuard guides you to official authorities. Filing an incident here documents your case privately and does NOT automatically submit an official legal complaint.',
    },
  },
  {
    timestamps: true,
  }
);

incidentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Incident', incidentSchema);
