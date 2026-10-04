// backend/src/models/InteractionEvent.js
/**
 * InteractionEvent — Lightweight telemetry/evidence record
 *
 * Stage 4 only READS the UnderstandingProfile.
 * This model captures interaction signals for FUTURE use in Stage 6+
 * when evidence-based profile updates are defined.
 *
 * SECURITY:
 *   - Never stores system prompts, AI API keys, or chain-of-thought
 *   - Never stores passwords or auth tokens
 *   - Only stores safe, anonymisable signal metadata
 */

import mongoose from 'mongoose';

const interactionEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    intent: {
      type: String,
      enum: ['explain', 'verify', 'guide', 'compare', 'learn', 'incident', 'general'],
      required: true,
    },
    relevantTopics: [
      {
        type: String,
      },
    ],
    safetyLevel: {
      type: String,
      enum: ['normal', 'caution', 'high_attention', 'incident'],
      default: 'normal',
    },
    adaptation: {
      depth: { type: String, default: null },
      jargon: { type: String, default: null },
      format: { type: String, default: null },
      safetyEmphasis: { type: String, default: null },
    },
    isFallback: {
      type: Boolean,
      default: false,
    },
    errorCode: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // No timestamps (we have manual timestamp field)
    timestamps: false,
  }
);

// Index for user-level telemetry queries
interactionEventSchema.index({ user: 1, timestamp: -1 });

const InteractionEvent = mongoose.model('InteractionEvent', interactionEventSchema);

export default InteractionEvent;
