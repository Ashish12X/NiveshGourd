// backend/src/controllers/learningController.js
/**
 * Learning Controller — Stage 6
 *
 * Exposes endpoints for:
 *   - GET  /api/learning/dashboard (Recommended next, categorized lists)
 *   - GET  /api/learning/topics/:topicId (Topic content, user progress, adaptation)
 *   - POST /api/learning/:topicId/start (Start/resume module)
 *   - POST /api/learning/:topicId/interaction (Record comprehension or practical attempt)
 *   - POST /api/learning/:topicId/complete (Finalize module and get adaptive next recommendation)
 *   - POST /api/learning/:topicId/ask (Ask AI tutor with fact-locked prompt)
 *
 * SECURITY:
 *   - Enforces authentication & ownership (req.user._id)
 *   - Sanitizes input and validates parameters
 */

import {
  getLearningDashboard,
  getTopicForUser,
  startTopic,
  recordLearningInteraction,
  completeTopic,
  askAITutorAboutTopic,
} from '../services/learning/learningService.js';

export const getDashboard = async (req, res) => {
  try {
    const contextualSignal = req.query.signal || null;
    const data = await getLearningDashboard(req.user._id, contextualSignal);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[learningController] getDashboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to load learning curriculum.' });
  }
};

export const getTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'Topic ID is required.' });
    }

    const data = await getTopicForUser(topicId, req.user);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Learning topic not found.' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[learningController] getTopic error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to load learning topic.' });
  }
};

export const startTopicHandler = async (req, res) => {
  try {
    const { topicId } = req.params;
    const progress = await startTopic(topicId, req.user._id);
    return res.status(200).json({ success: true, data: progress });
  } catch (err) {
    if (err.message === 'TOPIC_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }
    console.error('[learningController] startTopic error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to start learning module.' });
  }
};

export const interactionHandler = async (req, res) => {
  try {
    const { topicId } = req.params;
    const {
      interactionType,
      sectionIndex,
      questionId,
      scenarioId,
      selectedOption,
      confidence,
    } = req.body;

    if (!interactionType) {
      return res.status(400).json({ success: false, message: 'interactionType is required.' });
    }

    const result = await recordLearningInteraction({
      userId: req.user._id,
      topicId,
      interactionType,
      sectionIndex,
      questionId,
      scenarioId,
      selectedOption,
      confidence,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.message === 'TOPIC_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }
    console.error('[learningController] interactionHandler error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to record interaction.' });
  }
};

export const completeTopicHandler = async (req, res) => {
  try {
    const { topicId } = req.params;
    const result = await completeTopic(topicId, req.user._id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.message === 'TOPIC_NOT_FOUND' || err.message === 'PROGRESS_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Learning record not found.' });
    }
    console.error('[learningController] completeTopic error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to complete topic.' });
  }
};

export const askAITutorHandler = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question text is required.' });
    }

    if (question.length > 500) {
      return res.status(400).json({ success: false, message: 'Question cannot exceed 500 characters.' });
    }

    const response = await askAITutorAboutTopic({
      topicId,
      userQuestion: question.trim(),
      user: req.user,
    });

    return res.status(200).json({ success: true, data: response });
  } catch (err) {
    if (err.message === 'TOPIC_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }
    console.error('[learningController] askAITutor error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to query AI tutor.' });
  }
};
