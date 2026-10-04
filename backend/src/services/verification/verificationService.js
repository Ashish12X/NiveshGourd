// backend/src/services/verification/verificationService.js
/**
 * Verification Service — Main Orchestrator
 *
 * Coordinates the complete Stage 5 verification workflow:
 *
 *   1. Sanitise and validate input
 *   2. Extract claims from text
 *   3. For each claim:
 *      a. Classify claim type
 *      b. Extract entities
 *      c. Retrieve evidence (from configured provider)
 *      d. Detect risk signals
 *      e. Assess verification status
 *   4. Determine overall status + uncertainty
 *   5. Generate adaptive explanation (Stage 4 AI)
 *   6. Persist result to MongoDB
 *   7. Return structured result
 *
 * CRITICAL INVARIANTS:
 *   - UnderstandingProfile is READ-ONLY here (no score mutations)
 *   - AI cannot change verification status or invent evidence
 *   - Ownership is enforced at the controller level
 */

import { extractClaims } from './claimExtractor.js';
import { detectRiskSignals, aggregateRiskLevel } from './riskSignalDetector.js';
import { getEvidenceForClaim, getProviderMode, PROVIDER_MODES } from './evidenceProvider.js';
import { assessClaimVerification, determineOverallStatus, determineOverallUncertainty } from './verificationEngine.js';
import { generateAdaptiveExplanation } from './verificationFormatter.js';
import { analyseMessageSafety } from '../adaptive/safetyPolicy.js';
import VerificationAnalysis from '../../models/VerificationAnalysis.js';
import UnderstandingProfile from '../../models/UnderstandingProfile.js';

// Input length limits
const MAX_TEXT_LENGTH = 5000;
const MAX_URL_LENGTH = 2048;

// Verification-relevant topics for adaptation
const VERIFICATION_TOPICS = ['sourceVerification', 'fraudAwareness', 'investorRights'];

/**
 * Sanitises text input.
 */
function sanitiseText(text) {
  if (!text || typeof text !== 'string') return '';
  // Remove control characters (except newline/tab)
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

/**
 * Validates URL input.
 */
function sanitiseUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim().slice(0, MAX_URL_LENGTH);
  try {
    const parsed = new URL(trimmed);
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    // Strip credentials from URL
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Main verification analysis function.
 *
 * @param {object} params
 * @param {object}  params.user        - Authenticated User document (req.user)
 * @param {string}  params.inputType   - 'TEXT' | 'IMAGE' | 'URL' | 'PDF'
 * @param {string}  [params.text]      - Raw text input
 * @param {string}  [params.url]       - URL to analyse
 * @param {object}  [params.imageFile] - Image file metadata { filename, mimeType, sizeBytes }
 * @param {string}  [params.extractedImageText] - Text extracted from image (if OCR was performed externally)
 * @returns {Promise<VerificationAnalysis>} - Saved MongoDB document
 */
export const analyseVerification = async ({
  user,
  inputType,
  text,
  url,
  imageFile,
  extractedImageText,
}) => {
  // ── 1. Prepare input text ────────────────────────────────────────────────
  let extractedText = '';
  let originalInputMetadata = {};
  let ocrMode = 'NOT_APPLICABLE';

  if (inputType === 'TEXT') {
    extractedText = sanitiseText(text);
  } else if (inputType === 'URL') {
    const safeUrl = sanitiseUrl(url);
    if (!safeUrl) throw new Error('INVALID_URL');
    // For Stage 5, we extract text from the URL field itself as a claim
    // (Full URL content fetching is deferred to a future live provider)
    extractedText = sanitiseText(`URL submitted for verification: ${safeUrl}`);
    originalInputMetadata = { urlSubmitted: safeUrl };
  } else if (inputType === 'IMAGE') {
    ocrMode = 'UNAVAILABLE'; // OCR provider not configured in Stage 5
    if (extractedImageText) {
      // User provided extracted text alongside the image
      extractedText = sanitiseText(extractedImageText);
      ocrMode = 'AVAILABLE'; // Treat user-provided text as extracted
    } else {
      // Image uploaded without extracted text
      extractedText = '';
    }
    if (imageFile) {
      originalInputMetadata = {
        filename: (imageFile.filename || '').slice(0, 255),
        mimeType: (imageFile.mimeType || '').slice(0, 100),
        sizeBytes: imageFile.sizeBytes,
      };
    }
  } else if (inputType === 'PDF') {
    // PDF extraction not supported in Stage 5
    throw new Error('PDF_NOT_SUPPORTED');
  }

  if (!extractedText) {
    throw new Error('NO_EXTRACTABLE_TEXT');
  }

  // ── 2. Safety analysis ───────────────────────────────────────────────────
  const safetyResult = analyseMessageSafety(extractedText);
  const safetyLevel = safetyResult.safetyLevel;

  // ── 3. Claim extraction ──────────────────────────────────────────────────
  const rawClaims = extractClaims(extractedText);

  // ── 4. Determine evidence provider mode ─────────────────────────────────
  const providerMode = getProviderMode();

  // ── 5. For each claim: evidence + risk + assessment ─────────────────────
  const processedClaims = [];

  for (const rawClaim of rawClaims) {
    // Get evidence
    const evidenceResult = await getEvidenceForClaim({
      claimType: rawClaim.claimType,
      claimText: rawClaim.claimText,
      entities: rawClaim.entities,
    });

    // Detect risk signals specifically for this claim
    const claimRiskSignals = detectRiskSignals(rawClaim.claimText);

    // Assess verification status
    const assessment = assessClaimVerification({
      claimType: rawClaim.claimType,
      entities: rawClaim.entities,
      riskSignals: claimRiskSignals,
      providerMode: evidenceResult.providerMode,
      evidence: evidenceResult.evidence,
    });

    processedClaims.push({
      claimText: rawClaim.claimText,
      claimType: rawClaim.claimType,
      entities: {
        organizations: rawClaim.entities.organizations || [],
        regulators: rawClaim.entities.regulators || [],
        products: rawClaim.entities.products || [],
        amounts: rawClaim.entities.amounts || [],
        percentages: rawClaim.entities.percentages || [],
        urls: rawClaim.entities.urls || [],
      },
      status: assessment.status,
      uncertainty: assessment.uncertainty,
      evidence: evidenceResult.evidence.slice(0, 5),
      riskSignals: claimRiskSignals.slice(0, 5),
      explanation: assessment.explanation,
      nextStep: assessment.nextStep,
    });
  }

  // ── 6. Aggregate overall signals ─────────────────────────────────────────
  // Run risk detection on the full text for holistic signal view
  const allRiskSignals = detectRiskSignals(extractedText);

  // Determine overall status + uncertainty
  const overallStatus = determineOverallStatus(processedClaims);
  const overallUncertainty = determineOverallUncertainty(processedClaims);

  // Deduplicate top risk signals
  const topRiskSignalMap = new Map();
  for (const signal of allRiskSignals) {
    if (!topRiskSignalMap.has(signal.signalType)) {
      topRiskSignalMap.set(signal.signalType, signal);
    }
  }
  const topRiskSignals = [...topRiskSignalMap.values()].slice(0, 6);

  // ── 7. Load UnderstandingProfile for adaptive explanation ─────────────────
  let understandingProfileTopics = {};
  try {
    const profileDoc = await UnderstandingProfile.findOne({ user: user._id });
    if (profileDoc) {
      // Build the topics map in the format expected by adaptationPolicy
      understandingProfileTopics = {};
      for (const [key, val] of Object.entries(profileDoc.topics.toObject())) {
        understandingProfileTopics[key] = { status: val.status };
      }
    }
  } catch (err) {
    console.warn('[verificationService] Could not load UnderstandingProfile for adaptation:', err.message);
  }

  // ── 8. Generate adaptive explanation ─────────────────────────────────────
  const { overallExplanation, safeNextStep, adaptation } = await generateAdaptiveExplanation({
    extractedText,
    claims: processedClaims,
    overallStatus,
    topRiskSignals,
    verificationMode: providerMode,
    safetyLevel,
    understandingProfile: understandingProfileTopics,
    userPreferences: user.preferences || {},
  });

  // ── 9. Persist to MongoDB ─────────────────────────────────────────────────
  const verificationDoc = await VerificationAnalysis.create({
    user: user._id,
    inputType,
    originalInputMetadata,
    extractedText,
    claims: processedClaims,
    overallStatus,
    overallUncertainty,
    topRiskSignals,
    overallExplanation,
    safeNextStep,
    verificationMode: providerMode,
    safetyLevel,
    relevantTopics: VERIFICATION_TOPICS,
    adaptation,
    ocrMode,
  });

  return verificationDoc;
};

/**
 * Get verification history for a user (paginated).
 *
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 */
export const getUserVerificationHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    VerificationAnalysis.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('inputType overallStatus overallUncertainty topRiskSignals verificationMode safetyLevel createdAt extractedText')
      .lean(),
    VerificationAnalysis.countDocuments({ user: userId }),
  ]);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get a specific verification analysis (with ownership check).
 *
 * @param {string} analysisId
 * @param {string} userId
 */
export const getVerificationById = async (analysisId, userId) => {
  const doc = await VerificationAnalysis.findById(analysisId).lean();
  if (!doc) return null;
  // Ownership check — user A must not access user B's analysis
  if (doc.user.toString() !== userId.toString()) return null;
  return doc;
};

/**
 * Delete a verification analysis (with ownership check).
 *
 * @param {string} analysisId
 * @param {string} userId
 * @returns {boolean} true if deleted, false if not found / not owned
 */
export const deleteVerification = async (analysisId, userId) => {
  const doc = await VerificationAnalysis.findById(analysisId).select('user');
  if (!doc) return false;
  if (doc.user.toString() !== userId.toString()) return false;
  await doc.deleteOne();
  return true;
};
