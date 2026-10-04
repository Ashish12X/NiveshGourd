// backend/src/services/verification/claimExtractor.js
/**
 * Claim Extractor
 *
 * Extracts individual investment-related claims from user-submitted text.
 *
 * Strategy:
 *   1. Segment text into candidate sentences.
 *   2. Filter sentences relevant to investment/safety claims.
 *   3. For each relevant sentence, classify and extract entities.
 *   4. Merge very short fragments into logical claim units.
 *
 * This is deterministic — no AI involved in extraction.
 * AI may later generate user-facing explanations for extracted claims.
 */

import { classifyClaim } from './claimClassifier.js';
import { extractEntities } from './entityExtractor.js';

// Maximum claims to extract per submission
const MAX_CLAIMS = 10;

// Minimum character length for a claim to be worth extracting
const MIN_CLAIM_LENGTH = 15;

/**
 * Patterns that indicate investment/safety relevance.
 * A sentence must match at least one to be considered a claim candidate.
 */
const RELEVANCE_PATTERNS = [
  /\b(return|profit|income|yield|gain|earn|pay|deposit|transfer|invest|trade|fund)\b/i,
  /\b(sebi|rbi|amfi|irdai|nse|bse|pfrda|government|regulator)\b/i,
  /\b(approved|registered|certified|authorized|licensed)\b/i,
  /\b(guaranteed|assured|risk[\s-]free|safe|protect)\b/i,
  /\b(otp|pin|password|account|bank|upi|neft|imps)\b/i,
  /\b(urgent|hurry|limited|exclusive|vip|today\s+only|last\s+chance)\b/i,
  /\b(join|group|channel|dm|admin|whatsapp|telegram)\b/i,
  /₹\s*[\d,]+/i,
  /\b\d+\s*%/i,
  /\b(scam|fraud|fake|genuine|legitimate|authentic)\b/i,
  /\b(withdraw|withdrawal|lock|block|freeze)\b/i,
  /\b(company|platform|app|broker|advisor|scheme)\b/i,
];

/**
 * Splits text into logical segments (sentences or clause groups).
 */
function segmentText(text) {
  // Split on sentence-ending punctuation, pipe, and newline
  const raw = text
    .replace(/\r\n/g, '\n')
    .split(/[.!?\n|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_CLAIM_LENGTH);

  // Return distinct sentences directly — no over-aggressive merging
  return raw;
}

/**
 * Checks whether a text segment is relevant to investor-safety claims.
 */
function isRelevantSegment(segment) {
  return RELEVANCE_PATTERNS.some((p) => p.test(segment));
}

/**
 * Extracts structured claims from a given text.
 *
 * @param {string} text - Sanitised input text (already length-limited)
 * @returns {Array<{claimText, claimType, entities}>}
 */
export const extractClaims = (text) => {
  if (!text || typeof text !== 'string') return [];

  const segments = segmentText(text);

  // Filter to relevant segments only
  const relevantSegments = segments.filter(isRelevantSegment);

  // If nothing is relevant, treat the whole text as a single claim
  if (relevantSegments.length === 0 && text.trim().length >= MIN_CLAIM_LENGTH) {
    const claimText = text.trim().slice(0, 500);
    return [
      {
        claimText,
        claimType: classifyClaim(claimText),
        entities: extractEntities(claimText),
      },
    ];
  }

  // Deduplicate by normalized text
  const seen = new Set();
  const claims = [];

  for (const segment of relevantSegments) {
    if (claims.length >= MAX_CLAIMS) break;

    const normalized = segment.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const claimText = segment.slice(0, 500); // Cap individual claim length
    const claimType = classifyClaim(claimText);
    const entities = extractEntities(claimText);

    claims.push({ claimText, claimType, entities });
  }

  return claims;
};
