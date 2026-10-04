// backend/src/models/VerificationAnalysis.js
/**
 * VerificationAnalysis Model
 *
 * Persists the result of a Stage 5 claim verification workflow.
 * Each document is owned by a single authenticated user.
 * Sensitive credentials (OTP, PIN, passwords) are NEVER stored.
 */

import mongoose from 'mongoose';

// ── Claim sub-document ───────────────────────────────────────────────────────
const claimSchema = new mongoose.Schema(
  {
    claimText: { type: String, required: true, maxlength: 2000 },
    claimType: {
      type: String,
      enum: [
        'REGULATORY_APPROVAL',
        'REGISTRATION_STATUS',
        'GUARANTEED_RETURN',
        'PERFORMANCE_CLAIM',
        'PAYMENT_REQUEST',
        'URGENCY',
        'CREDENTIAL_REQUEST',
        'COMPANY_IDENTITY',
        'PRODUCT_CLAIM',
        'GRIEVANCE_OR_AUTHORITY_CLAIM',
        'GENERAL_INFORMATION',
        'UNKNOWN',
      ],
      default: 'UNKNOWN',
    },
    entities: {
      organizations: [{ type: String, maxlength: 200 }],
      regulators: [{ type: String, maxlength: 200 }],
      products: [{ type: String, maxlength: 200 }],
      amounts: [{ type: String, maxlength: 100 }],
      percentages: [{ type: String, maxlength: 50 }],
      urls: [{ type: String, maxlength: 500 }],
      // NOTE: Phone/email are NOT stored to minimise PII retention
    },
    status: {
      type: String,
      enum: [
        'VERIFIED',
        'CONTRADICTED',
        'NOT_VERIFIED',
        'INSUFFICIENT_EVIDENCE',
        'MANUAL_CHECK_REQUIRED',
        'LIVE_CHECK_UNAVAILABLE',
      ],
      required: true,
    },
    uncertainty: {
      type: String,
      enum: ['KNOWN', 'SUPPORTED', 'CONTRADICTED', 'UNCERTAIN', 'NOT_VERIFIED', 'LIVE_CHECK_UNAVAILABLE'],
      default: 'UNCERTAIN',
    },
    evidence: [
      {
        sourceType: {
          type: String,
          enum: ['OFFICIAL', 'SECONDARY', 'USER_PROVIDED', 'LOCAL_TEST'],
          required: true,
        },
        sourceName: { type: String, maxlength: 300 },
        sourceDescription: { type: String, maxlength: 1000 },
        verificationMode: {
          type: String,
          enum: ['LIVE', 'LOCAL_TEST', 'UNAVAILABLE'],
          required: true,
        },
        relevance: { type: String, maxlength: 500 },
        timestamp: { type: Date, default: null },
      },
    ],
    riskSignals: [
      {
        signalType: { type: String, required: true, maxlength: 100 },
        description: { type: String, maxlength: 500 },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium',
        },
      },
    ],
    explanation: { type: String, maxlength: 2000 },
    nextStep: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

// ── Top-level VerificationAnalysis schema ────────────────────────────────────
const verificationAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    inputType: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'URL', 'PDF'],
      required: true,
    },
    // Metadata about original input — no raw file binary stored here
    originalInputMetadata: {
      filename: { type: String, maxlength: 255 },
      mimeType: { type: String, maxlength: 100 },
      sizeBytes: { type: Number },
      urlSubmitted: { type: String, maxlength: 2048 },
    },
    // Sanitised text extracted from input (max 5000 chars)
    extractedText: { type: String, maxlength: 5000 },
    // Per-claim breakdown
    claims: [claimSchema],
    // Overall summary across all claims
    overallStatus: {
      type: String,
      enum: [
        'VERIFIED',
        'CONTRADICTED',
        'NOT_VERIFIED',
        'INSUFFICIENT_EVIDENCE',
        'MANUAL_CHECK_REQUIRED',
        'LIVE_CHECK_UNAVAILABLE',
        'MIXED',
      ],
      required: true,
    },
    overallUncertainty: {
      type: String,
      enum: ['KNOWN', 'SUPPORTED', 'CONTRADICTED', 'UNCERTAIN', 'NOT_VERIFIED', 'LIVE_CHECK_UNAVAILABLE'],
      default: 'UNCERTAIN',
    },
    // Aggregated risk signals across all claims
    topRiskSignals: [
      {
        signalType: { type: String, maxlength: 100 },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        description: { type: String, maxlength: 500 },
      },
    ],
    // Human-readable overall explanation
    overallExplanation: { type: String, maxlength: 3000 },
    // Safe next step recommendation
    safeNextStep: { type: String, maxlength: 1000 },
    // Verification mode used in this analysis
    verificationMode: {
      type: String,
      enum: ['LIVE', 'LOCAL_TEST', 'UNAVAILABLE'],
      default: 'UNAVAILABLE',
    },
    // Safety level detected in input
    safetyLevel: {
      type: String,
      enum: ['normal', 'caution', 'high_attention', 'incident'],
      default: 'normal',
    },
    // Topics relevant to this verification (maps to UnderstandingProfile)
    relevantTopics: [{ type: String, maxlength: 100 }],
    // Adaptation metadata from Stage 4 (safe to store — no system prompt)
    adaptation: {
      depth: { type: String },
      jargon: { type: String },
      format: { type: String },
      language: { type: String },
      safetyEmphasis: { type: String },
      adaptationSummary: { type: String, maxlength: 500 },
    },
    // OCR state if image was submitted
    ocrMode: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'NOT_APPLICABLE'],
      default: 'NOT_APPLICABLE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user history queries
verificationAnalysisSchema.index({ user: 1, createdAt: -1 });

const VerificationAnalysis = mongoose.model(
  'VerificationAnalysis',
  verificationAnalysisSchema
);

export default VerificationAnalysis;
