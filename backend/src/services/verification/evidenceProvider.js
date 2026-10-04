// backend/src/services/verification/evidenceProvider.js
/**
 * Evidence Provider Abstraction
 *
 * Defines the interface and factory for evidence lookup.
 *
 * Provider states:
 *   LIVE        — a real search/regulatory API is configured and called
 *   LOCAL_TEST  — deterministic test fixtures (dev/staging only)
 *   UNAVAILABLE — no provider configured; results explicitly state this
 *
 * IMPORTANT INVARIANTS:
 *   1. LOCAL_TEST evidence is NEVER presented as real live evidence.
 *   2. Every evidence object carries verificationMode so the UI can
 *      display "Live verification unavailable" when appropriate.
 *   3. The AI engine CANNOT use provider output to invent evidence.
 *      Evidence is only what the provider actually returns.
 *
 * To plug in a real provider later:
 *   1. Set EVIDENCE_PROVIDER=live in backend/.env
 *   2. Set EVIDENCE_API_KEY=<your_key>
 *   3. Implement the live provider in this file following the interface below.
 */

export const PROVIDER_MODES = {
  LIVE: 'LIVE',
  LOCAL_TEST: 'LOCAL_TEST',
  UNAVAILABLE: 'UNAVAILABLE',
};

export const SOURCE_TYPES = {
  OFFICIAL: 'OFFICIAL',
  SECONDARY: 'SECONDARY',
  USER_PROVIDED: 'USER_PROVIDED',
  LOCAL_TEST: 'LOCAL_TEST',
};

// ── Authoritative Indian investor-safety source catalogue ────────────────────
// These are well-known sources. Their descriptions are factual statements
// about these sources' existence — NOT fabricated evidence about any specific claim.
const AUTHORITATIVE_SOURCES = {
  SEBI: {
    sourceName: 'SEBI (Securities and Exchange Board of India)',
    sourceDescription:
      'Primary securities regulator in India. Maintains the list of registered brokers, ' +
      'advisors, and intermediaries at sebi.gov.in. Issues regulatory orders and alerts.',
    sourceType: SOURCE_TYPES.OFFICIAL,
    checkUrl: 'https://www.sebi.gov.in',
    registryUrl: 'https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13',
  },
  RBI: {
    sourceName: 'RBI (Reserve Bank of India)',
    sourceDescription:
      'Central bank. Maintains Sachet portal (sachet.rbi.org.in) listing unauthorized ' +
      'deposit-taking entities and unregistered forex/trading platforms.',
    sourceType: SOURCE_TYPES.OFFICIAL,
    checkUrl: 'https://www.rbi.org.in',
    alertListUrl: 'https://sachet.rbi.org.in',
  },
  AMFI: {
    sourceName: 'AMFI (Association of Mutual Funds in India)',
    sourceDescription:
      'Industry body for mutual funds. Maintains the registered mutual fund distributor ' +
      'database at amfiindia.com.',
    sourceType: SOURCE_TYPES.OFFICIAL,
    checkUrl: 'https://www.amfiindia.com',
  },
  NSE: {
    sourceName: 'NSE (National Stock Exchange of India)',
    sourceDescription:
      'Stock exchange. Maintains list of SEBI-registered members at nseindia.com.',
    sourceType: SOURCE_TYPES.OFFICIAL,
    checkUrl: 'https://www.nseindia.com',
  },
  BSE: {
    sourceName: 'BSE (Bombay Stock Exchange)',
    sourceDescription:
      'Stock exchange. Maintains list of SEBI-registered members at bseindia.com.',
    sourceType: SOURCE_TYPES.OFFICIAL,
    checkUrl: 'https://www.bseindia.com',
  },
  CYBERCRIME: {
    sourceName: 'National Cybercrime Reporting Portal (cybercrime.gov.in)',
    sourceDescription:
      'Official portal for reporting online financial fraud. ' +
      'Helpline: 1930.',
    sourceType: SOURCE_TYPES.OFFICIAL,
    checkUrl: 'https://www.cybercrime.gov.in',
  },
};

// ── Local test fixtures ──────────────────────────────────────────────────────
// These are used ONLY in development/testing to produce consistent output.
// They are CLEARLY marked with verificationMode: 'LOCAL_TEST'.

const LOCAL_TEST_EVIDENCE_MAP = {
  GUARANTEED_RETURN: [
    {
      sourceType: SOURCE_TYPES.LOCAL_TEST,
      sourceName: 'SEBI Master Circular Reference (LOCAL TEST)',
      sourceDescription:
        '[LOCAL TEST DATA — Not a live check] SEBI Master Circular on Unsolicited Investment Advice ' +
        'explicitly prohibits claims of guaranteed or assured returns on market-linked securities.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
      relevance:
        'Guaranteed return claims directly violate SEBI circular provisions. ' +
        'This is a factual regulatory fact, not a claim-specific finding.',
      timestamp: null,
    },
  ],
  REGULATORY_APPROVAL: [
    {
      sourceType: SOURCE_TYPES.LOCAL_TEST,
      sourceName: 'SEBI Registered Intermediary Registry (LOCAL TEST)',
      sourceDescription:
        '[LOCAL TEST DATA — Not a live check] The SEBI intermediary registry can be used to verify ' +
        'whether an entity holds a valid SEBI registration. Live verification of the specific entity ' +
        'mentioned in the claim was not performed in this session.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
      relevance:
        'The claim asserts regulatory approval. This could not be independently verified ' +
        'without a live registry check.',
      timestamp: null,
    },
  ],
  PAYMENT_REQUEST: [
    {
      sourceType: SOURCE_TYPES.LOCAL_TEST,
      sourceName: 'RBI/I4C Advisory on Payment Requests (LOCAL TEST)',
      sourceDescription:
        '[LOCAL TEST DATA — Not a live check] RBI and Indian Cybercrime Coordination Centre (I4C) ' +
        'advisories warn against making payments to unverified entities via personal UPI IDs or ' +
        'informal channels.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
      relevance:
        'Payment requested through informal channel. This is a known fraud pattern per official advisories.',
      timestamp: null,
    },
  ],
  CREDENTIAL_REQUEST: [
    {
      sourceType: SOURCE_TYPES.LOCAL_TEST,
      sourceName: 'RBI Advisory on OTP/Credential Sharing (LOCAL TEST)',
      sourceDescription:
        '[LOCAL TEST DATA — Not a live check] RBI has repeatedly advised customers that no legitimate ' +
        'bank or financial institution will ever ask for OTP, PIN, or passwords.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
      relevance:
        'Credential request detected. This definitively contradicts legitimate financial service behaviour.',
      timestamp: null,
    },
  ],
  DEFAULT: [
    {
      sourceType: SOURCE_TYPES.LOCAL_TEST,
      sourceName: 'General Investor Safety Reference (LOCAL TEST)',
      sourceDescription:
        '[LOCAL TEST DATA — Not a live check] No specific evidence was found for this claim in the ' +
        'local test dataset. A live verification provider would need to be configured for ' +
        'claim-specific evidence retrieval.',
      verificationMode: PROVIDER_MODES.LOCAL_TEST,
      relevance: 'No specific evidence available in local test mode.',
      timestamp: null,
    },
  ],
};

// ── Unavailable provider ─────────────────────────────────────────────────────
const UNAVAILABLE_EVIDENCE = [
  {
    sourceType: SOURCE_TYPES.OFFICIAL,
    sourceName: 'Live Evidence Provider',
    sourceDescription:
      'Live web verification is not configured in this deployment. ' +
      'To enable live verification, configure EVIDENCE_PROVIDER in backend/.env.',
    verificationMode: PROVIDER_MODES.UNAVAILABLE,
    relevance: 'Live verification unavailable.',
    timestamp: null,
  },
];

// ── Provider factory ─────────────────────────────────────────────────────────

let _providerMode = null;

/**
 * Returns the current evidence provider mode.
 * Reads EVIDENCE_PROVIDER env var; defaults to UNAVAILABLE if not set.
 */
export const getProviderMode = () => {
  if (_providerMode) return _providerMode;

  const configured = (process.env.EVIDENCE_PROVIDER || 'unavailable').toLowerCase();
  if (configured === 'live') {
    _providerMode = PROVIDER_MODES.LIVE;
  } else if (configured === 'local_test' || configured === 'test') {
    _providerMode = PROVIDER_MODES.LOCAL_TEST;
  } else {
    _providerMode = PROVIDER_MODES.UNAVAILABLE;
  }

  return _providerMode;
};

/**
 * Retrieves evidence for a given claim type from the configured provider.
 *
 * @param {object} params
 * @param {string} params.claimType - CLAIM_TYPES value
 * @param {string} params.claimText - Raw claim text
 * @param {object} params.entities  - Extracted entities
 * @returns {Promise<{evidence: Array, providerMode: string, relevantSources: Array}>}
 */
export const getEvidenceForClaim = async ({ claimType, claimText, entities }) => {
  const mode = getProviderMode();

  if (mode === PROVIDER_MODES.LIVE) {
    return await getLiveEvidence({ claimType, claimText, entities });
  }

  if (mode === PROVIDER_MODES.LOCAL_TEST) {
    return getLocalTestEvidence({ claimType });
  }

  // UNAVAILABLE — return explicit unavailability notice + relevant authoritative sources
  return {
    evidence: UNAVAILABLE_EVIDENCE,
    providerMode: PROVIDER_MODES.UNAVAILABLE,
    relevantSources: getRelevantAuthoritativeSources(claimType, entities),
  };
};

/**
 * Live evidence provider placeholder.
 * Wire a real search/regulatory API here.
 *
 * @throws {Error} Currently not implemented — falls back to UNAVAILABLE
 */
async function getLiveEvidence({ claimType, claimText, entities }) {
  // LIVE PROVIDER NOT YET IMPLEMENTED
  // When implementing: use a search API (e.g., Google Custom Search, SEBI registry API)
  // to look up regulatory data for the specific claim.
  // Return evidence with sourceType: OFFICIAL and verificationMode: LIVE.

  console.warn('[evidenceProvider] LIVE provider requested but not implemented. Falling back to UNAVAILABLE.');

  return {
    evidence: UNAVAILABLE_EVIDENCE,
    providerMode: PROVIDER_MODES.UNAVAILABLE,
    relevantSources: getRelevantAuthoritativeSources(claimType, entities),
  };
}

/**
 * Returns local test evidence fixtures for a given claim type.
 */
function getLocalTestEvidence({ claimType }) {
  const evidence =
    LOCAL_TEST_EVIDENCE_MAP[claimType] ||
    LOCAL_TEST_EVIDENCE_MAP.DEFAULT;

  return {
    evidence,
    providerMode: PROVIDER_MODES.LOCAL_TEST,
    relevantSources: [],
  };
}

/**
 * Returns a list of relevant authoritative sources to check for a given claim type.
 * These are general guidance pointers, NOT claim-specific evidence.
 */
function getRelevantAuthoritativeSources(claimType, entities) {
  const sources = [];

  // Always suggest SEBI for regulatory/return claims
  if (
    ['REGULATORY_APPROVAL', 'REGISTRATION_STATUS', 'GUARANTEED_RETURN', 'PERFORMANCE_CLAIM'].includes(claimType)
  ) {
    sources.push(AUTHORITATIVE_SOURCES.SEBI);
  }

  // Suggest RBI for payment/banking related
  if (['PAYMENT_REQUEST', 'CREDENTIAL_REQUEST'].includes(claimType)) {
    sources.push(AUTHORITATIVE_SOURCES.RBI);
    sources.push(AUTHORITATIVE_SOURCES.CYBERCRIME);
  }

  // Suggest cybercrime for credential requests
  if (claimType === 'CREDENTIAL_REQUEST') {
    sources.push(AUTHORITATIVE_SOURCES.CYBERCRIME);
  }

  // If regulators mentioned in entities
  if (entities?.regulators?.includes('AMFI')) {
    sources.push(AUTHORITATIVE_SOURCES.AMFI);
  }
  if (entities?.regulators?.includes('NSE')) {
    sources.push(AUTHORITATIVE_SOURCES.NSE);
  }
  if (entities?.regulators?.includes('BSE')) {
    sources.push(AUTHORITATIVE_SOURCES.BSE);
  }

  // Deduplicate by sourceName
  const seen = new Set();
  return sources.filter((s) => {
    if (seen.has(s.sourceName)) return false;
    seen.add(s.sourceName);
    return true;
  });
}
