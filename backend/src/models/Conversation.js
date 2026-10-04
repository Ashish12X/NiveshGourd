// backend/src/models/Conversation.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [8000, 'Message content exceeds maximum length'],
    },
    // Safe adaptive metadata — NOT system prompts, NOT chain-of-thought
    metadata: {
      intent: { type: String, default: null },
      relevantTopics: [{ type: String }],
      safetyLevel: { type: String, default: null },
      adaptation: { type: mongoose.Schema.Types.Mixed, default: null },
      adaptationSummary: { type: String, default: null },
      isFallback: { type: Boolean, default: false },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      maxlength: [200, 'Title too long'],
    },
    intent: {
      type: String,
      default: null,
    },
    messages: [messageSchema],
    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user conversation listing
conversationSchema.index({ user: 1, createdAt: -1 });
// Filter out deleted conversations by default
conversationSchema.index({ user: 1, isDeleted: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
