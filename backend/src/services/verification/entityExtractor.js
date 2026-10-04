// backend/src/services/verification/entityExtractor.js
/**
 * Entity Extractor
 *
 * Extracts relevant financial/regulatory entities from claim text.
 * Deterministic regex-based extraction — no AI.
 *
 * IMPORTANT: Phone numbers and email addresses are extracted for
 * classification purposes only and are NOT persisted to the database
 * (minimising PII retention).
 *
 * Extracted entity categories:
 *   organizations   — company/platform names
 *   regulators      — SEBI, RBI, AMFI, etc.
 *   products        — financial product types
 *   amounts         — monetary amounts (₹, Rs, INR)
 *   percentages     — return/profit percentages
 *   urls            — web domains/links
 */

// Known Indian financial regulators
const KNOWN_REGULATORS = [
  'SEBI', 'RBI', 'AMFI', 'IRDAI', 'PFRDA', 'NHB', 'SIDBI',
  'NSE', 'BSE', 'NSDL', 'CDSL', 'NABARD',
];

// Financial product keywords
const PRODUCT_KEYWORDS = [
  'mutual fund', 'equity', 'stock', 'derivative', 'option', 'futures',
  'bond', 'debenture', 'NCD', 'fixed deposit', 'FD', 'ULIP', 'IPO',
  'SIP', 'PMS', 'portfolio management', 'algorithmic trading', 'algo trading',
  'signal service', 'advisory service', 'VIP group', 'Telegram channel',
  'WhatsApp group',
];

/**
 * Extracts entities from a text string.
 *
 * @param {string} text - Raw or extracted text
 * @returns {object} { organizations, regulators, products, amounts, percentages, urls, hasCredentialRequest, hasPhoneOrEmail }
 */
export const extractEntities = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      organizations: [],
      regulators: [],
      products: [],
      amounts: [],
      percentages: [],
      urls: [],
      hasCredentialRequest: false,
      hasPhoneOrEmail: false,
    };
  }

  const result = {
    organizations: [],
    regulators: [],
    products: [],
    amounts: [],
    percentages: [],
    urls: [],
    hasCredentialRequest: false,
    hasPhoneOrEmail: false,
  };

  // 1. Extract regulators
  for (const reg of KNOWN_REGULATORS) {
    const pattern = new RegExp(`\\b${reg}\\b`, 'i');
    if (pattern.test(text) && !result.regulators.includes(reg)) {
      result.regulators.push(reg);
    }
  }

  // 2. Extract monetary amounts (₹ or Rs or INR + number)
  const amountPattern = /(?:₹|rs\.?|inr)\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|lac|crore|thousand|million|k))?/gi;
  const amounts = text.match(amountPattern) || [];
  result.amounts = [...new Set(amounts.map((a) => a.trim()))].slice(0, 10);

  // 3. Extract percentages
  const percentPattern = /\b(\d+(?:\.\d+)?)\s*%(?:\s*(monthly|annually|yearly|weekly|daily|per\s+month|per\s+year|p\.?a\.?))?/gi;
  let pm;
  while ((pm = percentPattern.exec(text)) !== null) {
    const entry = pm[2] ? `${pm[1]}% ${pm[2]}` : `${pm[1]}%`;
    if (!result.percentages.includes(entry)) {
      result.percentages.push(entry);
    }
    if (result.percentages.length >= 10) break;
  }

  // 4. Extract URLs/domains (safe extraction — strip credentials from URL)
  const urlPattern = /https?:\/\/[^\s<>"]+|www\.[^\s<>"]+|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s<>"]*)?/gi;
  const rawUrls = text.match(urlPattern) || [];
  result.urls = [...new Set(rawUrls
    .map((u) => {
      // Strip any embedded credentials (user:pass@)
      return u.replace(/\/\/[^@]+@/, '//');
    })
    .filter((u) => u.length <= 500)
  )].slice(0, 10);

  // 5. Extract financial product mentions
  for (const product of PRODUCT_KEYWORDS) {
    const productPattern = new RegExp(`\\b${product.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (productPattern.test(text) && !result.products.includes(product)) {
      result.products.push(product);
    }
  }

  // 6. Extract organization/company names heuristically
  // Look for capitalized sequences followed by Pvt/Ltd/LLP/Inc etc.
  const orgPattern = /\b([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){0,4})\s+(?:Pvt\.?|Ltd\.?|LLP|Inc\.?|Corp\.?|Limited|Private)\b/g;
  let om;
  while ((om = orgPattern.exec(text)) !== null) {
    const name = om[1].trim();
    if (!result.organizations.includes(name)) {
      result.organizations.push(name);
    }
    if (result.organizations.length >= 10) break;
  }

  // 7. Detect credential requests (boolean flag — PII not extracted/stored)
  const credentialPattern = /\b(otp|one[\s-]time[\s-]password|pin|mpin|password|passcode|bank\s+details|account\s+number|cvv|card\s+number)\b/i;
  result.hasCredentialRequest = credentialPattern.test(text);

  // 8. Detect presence of phone or email (boolean flag only — NOT stored)
  const phoneEmailPattern = /\b\d{10}\b|\+91\s?\d{10}|[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i;
  result.hasPhoneOrEmail = phoneEmailPattern.test(text);

  return result;
};
