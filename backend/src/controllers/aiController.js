// backend/src/controllers/aiController.js
/**
 * AI Controller
 *
 * Thin controller layer. All AI logic is in adaptiveEngine.js.
 *
 * Routes handled:
 *   POST   /api/ai/chat                     — send a message
 *   GET    /api/ai/conversations            — list user's conversations
 *   POST   /api/ai/conversations            — create a new conversation
 *   GET    /api/ai/conversations/:id        — get conversation messages
 *   DELETE /api/ai/conversations/:id        — soft-delete conversation
 *
 * SECURITY:
 *   - All routes require authentication (protect middleware)
 *   - Users can only access their own conversations
 *   - System prompts and AI API key are NEVER returned
 */

import { runAdaptiveEngine } from '../services/adaptive/adaptiveEngine.js';
import { checkGeminiHealth } from '../services/ai/llmService.js';
import Conversation from '../models/Conversation.js';
import InteractionEvent from '../models/InteractionEvent.js';

// Max message characters accepted from the client
const MAX_CLIENT_MESSAGE_LENGTH = 2000;
// Max conversations returned in list
const MAX_CONVERSATIONS_LIST = 20;

/**
 * @desc    Get Gemini AI health and diagnostics
 * @route   GET /api/ai/health
 * @access  Public (Safe diagnostics only - no secrets)
 */
export const getHealth = async (req, res) => {
  try {
    const health = await checkGeminiHealth();
    return res.status(200).json({
      success: true,
      ...health,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      provider: 'gemini',
      configured: false,
      reachable: false,
      status: 'PROVIDER_ERROR',
      message: error.message || 'Failed to check Gemini health.',
    });
  }
};

/**
 * @desc    Send a message to the adaptive AI engine
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const chat = async (req, res, next) => {
  try {
    const { message, conversationId, uiMode, language } = req.body;
    const user = req.user;

    // — Input validation —
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string.',
      });
    }

    if (message.length > MAX_CLIENT_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message is too long. Maximum ${MAX_CLIENT_MESSAGE_LENGTH} characters allowed.`,
      });
    }

    // Validate conversationId belongs to this user (if provided)
    let resolvedConversationId = null;
    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: user._id,
        isDeleted: false,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or does not belong to you.',
        });
      }
      resolvedConversationId = conversationId;
    }

    // — Run adaptive engine —
    const engineResult = await runAdaptiveEngine({
      user,
      message: message.trim(),
      conversationId: resolvedConversationId,
      uiMode: uiMode || null,
      language: language || user?.preferences?.language || 'en',
    });

    // — Persist conversation —
    // Create new conversation if not provided
    if (!conversation) {
      const title = generateConversationTitle(message.trim());
      conversation = await Conversation.create({
        user: user._id,
        title,
        intent: engineResult.metadata.intent,
        messages: [],
      });
    }

    // Append user message
    conversation.messages.push({
      role: 'user',
      content: message.trim(),
      metadata: {},
      timestamp: new Date(),
    });

    // Append assistant response with safe metadata
    conversation.messages.push({
      role: 'assistant',
      content: engineResult.response,
      metadata: {
        intent: engineResult.metadata.intent,
        relevantTopics: engineResult.metadata.relevantTopics,
        safetyLevel: engineResult.metadata.safetyLevel,
        adaptation: engineResult.metadata.adaptation,
        adaptationSummary: engineResult.metadata.adaptationSummary,
        isFallback: engineResult.isFallback,
      },
      timestamp: new Date(),
    });

    await conversation.save();

    // — Log interaction event (async, don't block response) —
    InteractionEvent.create({
      user: user._id,
      conversation: conversation._id,
      intent: engineResult.metadata.intent,
      relevantTopics: engineResult.metadata.relevantTopics,
      safetyLevel: engineResult.metadata.safetyLevel,
      adaptation: engineResult.metadata.adaptation,
      isFallback: engineResult.isFallback,
      errorCode: engineResult.errorCode || null,
    }).catch((err) => console.warn('[aiController] InteractionEvent log failed:', err.message));

    // — Return response —
    // SECURITY: system prompt, AI key, and chain-of-thought are NEVER returned
    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      message: engineResult.response,
      metadata: engineResult.metadata,  // Safe adaptive metadata only
      isFallback: engineResult.isFallback || false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List user's conversations (most recent first)
 * @route   GET /api/ai/conversations
 * @access  Private
 */
export const listConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      user: req.user._id,
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .limit(MAX_CONVERSATIONS_LIST)
      .select('_id title intent createdAt updatedAt')
      .lean();

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific conversation with messages
 * @route   GET /api/ai/conversations/:conversationId
 * @access  Private
 */
export const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      user: req.user._id,
      isDeleted: false,
    })
      .select('-__v')
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Filter out system messages before returning
    conversation.messages = conversation.messages.filter(
      (m) => m.role === 'user' || m.role === 'assistant'
    );

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new (empty) conversation
 * @route   POST /api/ai/conversations
 * @access  Private
 */
export const createConversation = async (req, res, next) => {
  try {
    const { title } = req.body;

    const conversation = await Conversation.create({
      user: req.user._id,
      title: title?.trim() || 'New Conversation',
      messages: [],
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft-delete a conversation
 * @route   DELETE /api/ai/conversations/:conversationId
 * @access  Private
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      user: req.user._id,
      isDeleted: false,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    conversation.isDeleted = true;
    await conversation.save();

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generates a short conversation title from the first message.
 */
function generateConversationTitle(message) {
  if (!message) return 'New Conversation';
  // Take first 60 chars, cut at last space to avoid mid-word cut
  const truncated = message.slice(0, 60);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 20 ? truncated.slice(0, lastSpace) + '…' : truncated;
}
