// backend/src/services/ai/transliterationService.js
/**
 * User Name Transliteration Service
 *
 * Localizes user display names across 12 Indian languages using phonetic transliteration.
 *
 * Requirements:
 *   - Canonical database name is NEVER mutated or destroyed.
 *   - This is TRANSLITERATION, NOT semantic translation (e.g. Ashish -> आशीष, not "Blessing").
 *   - Localized names are cached in user.localizedNames by language code.
 *   - If Gemini is unavailable, falls back gracefully to a deterministic dictionary or canonical name.
 *   - Never blocks login, registration, or language switching.
 *   - Prevents XSS / HTML injection in name values.
 */

import { getAIProvider, isGeminiConfigured } from './aiProvider.js';

// Language metadata with proper English and native names
export const LANGUAGE_SCRIPTS = {
  en: { name: 'English', native: 'English', script: 'Latin' },
  hi: { name: 'Hindi', native: 'हिन्दी', script: 'Devanagari' },
  bn: { name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
  mr: { name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
  te: { name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
  ta: { name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
  ml: { name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  or: { name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia' },
  as: { name: 'Assamese', native: 'অসমীয়া', script: 'Assamese' },
};

// High-confidence deterministic dictionary for common Indian names
const DETERMINISTIC_NAME_MAP = {
  ashish: {
    en: 'Ashish',
    hi: 'आशीष',
    bn: 'আশীষ',
    mr: 'आशीष',
    te: 'ఆశిష్',
    ta: 'ஆஷிஷ்',
    gu: 'આશિષ',
    kn: 'ಆಶಿಶ್',
    ml: 'ആശിഷ്',
    pa: 'ਆਸ਼ੀਸ਼',
    or: 'ଆଶିଷ',
    as: 'আশীষ',
  },
  rahul: {
    en: 'Rahul',
    hi: 'राहुल',
    bn: 'রাহুল',
    mr: 'राहुल',
    te: 'రాహుల్',
    ta: 'ராகுல்',
    gu: 'રાહુલ',
    kn: 'ರಾಹುಲ್',
    ml: 'രാഹുൽ',
    pa: 'ਰਾਹੁਲ',
    or: 'ରାହୁଲ',
    as: 'ৰাহুল',
  },
  priya: {
    en: 'Priya',
    hi: 'प्रिया',
    bn: 'প্রিয়া',
    mr: 'प्रिया',
    te: 'ప్రియ',
    ta: 'பிரியா',
    gu: 'પ્રિયા',
    kn: 'ಪ್ರಿಯಾ',
    ml: 'പ്രിയ',
    pa: 'ਪ੍ਰਿਆ',
    or: 'ପ୍ରିୟା',
    as: 'প্ৰিয়া',
  },
  amit: {
    en: 'Amit',
    hi: 'अमित',
    bn: 'অমিত',
    mr: 'अमित',
    te: 'అమిత్',
    ta: 'அமித்',
    gu: 'અમિત',
    kn: 'ಅಮಿತ್',
    ml: 'അമിത്',
    pa: 'ਅਮਿਤ',
    or: 'ଅମିତ',
    as: 'অমিত',
  },
  neha: {
    en: 'Neha',
    hi: 'नेहा',
    bn: 'নেহা',
    mr: 'नेहा',
    te: 'నేహా',
    ta: 'நேஹா',
    gu: 'નેહા',
    kn: 'ನೇಹಾ',
    ml: 'നേഹ',
    pa: 'ਨੇਹਾ',
    or: 'ନେହା',
    as: 'নেহা',
  },
  rohit: {
    en: 'Rohit',
    hi: 'रोहित',
    bn: 'রোহিত',
    mr: 'रोहित',
    te: 'రోహిత్',
    ta: 'ரோஹித்',
    gu: 'રોહિત',
    kn: 'ರೋಹಿತ್',
    ml: 'രോഹിത്',
    pa: 'ਰੋਹਿਤ',
    or: 'ରୋହିତ',
    as: 'ৰোহিত',
  },
  vikram: {
    en: 'Vikram',
    hi: 'विक्रम',
    bn: 'বিক্রম',
    mr: 'विक्रम',
    te: 'విక్రమ్',
    ta: 'விக்ரம்',
    gu: 'વિક્રમ',
    kn: 'ವಿಕ್ರಮ್',
    ml: 'വിക്രം',
    pa: 'ਵਿਕਰਮ',
    or: 'ବିକ୍ରମ',
    as: 'বিক্ৰম',
  },
  pooja: {
    en: 'Pooja',
    hi: 'पूजा',
    bn: 'পূজা',
    mr: 'पूजा',
    te: 'పూజా',
    ta: 'பூஜா',
    gu: 'પૂજા',
    kn: 'ಪೂಜಾ',
    ml: 'പൂജ',
    pa: 'ਪੂਜਾ',
    or: 'ପୂଜା',
    as: 'পূজা',
  },
  suresh: {
    en: 'Suresh',
    hi: 'सुरेश',
    bn: 'সুরেশ',
    mr: 'सुरेश',
    te: 'సురేష్',
    ta: 'சுரேஷ்',
    gu: 'સુરેશ',
    kn: 'ಸುರೇಶ್',
    ml: 'സുരേഷ്',
    pa: 'ਸੁਰੇਸ਼',
    or: 'ସୁରେଶ',
    as: 'সুৰেশ',
  },
  ramesh: {
    en: 'Ramesh',
    hi: 'रमेश',
    bn: 'রমেশ',
    mr: 'रमेश',
    te: 'రమేష్',
    ta: 'ரமேஷ்',
    gu: 'રમેશ',
    kn: 'ರಮೇಶ್',
    ml: 'രമേശ്',
    pa: 'ਰਮੇਸ਼',
    or: 'ରମେଶ',
    as: 'ৰমেশ',
  },
};

/**
 * Normalises an input language string into a standard 2-letter code.
 */
export const normalizeLanguageCode = (lang) => {
  if (!lang || typeof lang !== 'string') return 'en';
  const clean = lang.trim().toLowerCase();

  for (const [code, meta] of Object.entries(LANGUAGE_SCRIPTS)) {
    if (
      clean === code ||
      clean === meta.name.toLowerCase() ||
      clean === meta.native.toLowerCase() ||
      clean.includes(meta.name.toLowerCase()) ||
      clean.includes(meta.native.toLowerCase())
    ) {
      return code;
    }
  }

  // Handle common prefixes
  const twoLetter = clean.slice(0, 2);
  if (LANGUAGE_SCRIPTS[twoLetter]) return twoLetter;

  return 'en';
};

/**
 * Sanitises transliterated name string:
 * - strips HTML/control characters to prevent XSS
 * - removes quotes, periods, and markdown punctuation
 * - limits length to 60 characters
 */
function sanitizeName(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[<>'"`;={}\[\]\\]/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 60);
}

/**
 * Transliterates a name string into target language script.
 *
 * @param {string} canonicalName - The person's English/canonical name
 * @param {string} targetLang - Language code ('hi', 'bn', 'ta', etc.)
 * @returns {Promise<string>} Transliterated name in the target script
 */
export const transliterateName = async (canonicalName, targetLang) => {
  if (!canonicalName || typeof canonicalName !== 'string') return '';
  const trimmed = canonicalName.trim();
  const langCode = normalizeLanguageCode(targetLang);

  // English always returns the canonical name
  if (langCode === 'en') {
    return trimmed;
  }

  // 1. Fast deterministic dictionary check
  const lowerName = trimmed.toLowerCase();
  const dictMatch = DETERMINISTIC_NAME_MAP[lowerName]?.[langCode];
  if (dictMatch) {
    return dictMatch;
  }

  // If first name only matches dictionary, use it for composite names
  const nameParts = trimmed.split(/\s+/);
  if (nameParts.length > 1) {
    const transliteratedParts = [];
    let allPartsFound = true;
    for (const part of nameParts) {
      const partMatch = DETERMINISTIC_NAME_MAP[part.toLowerCase()]?.[langCode];
      if (partMatch) {
        transliteratedParts.push(partMatch);
      } else {
        allPartsFound = false;
        break;
      }
    }
    if (allPartsFound) {
      return transliteratedParts.join(' ');
    }
  }

  // 2. Gemini-based transliteration if configured
  if (isGeminiConfigured()) {
    try {
      const provider = getAIProvider();
      const langMeta = LANGUAGE_SCRIPTS[langCode] || { name: 'Hindi' };

      const prompt = `Transliterate this person's name into ${langMeta.name} script. Do not translate the meaning. Preserve pronunciation as closely as possible. Return only the name.\n\nName: ${trimmed}`;

      const response = await Promise.race([
        provider.client.models.generateContent({
          model: provider.model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.1,
            maxOutputTokens: 30,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TRANSLITERATION_TIMEOUT')), 5000)
        ),
      ]);

      let text = '';
      if (typeof response?.text === 'function') {
        text = response.text() || '';
      } else if (typeof response?.text === 'string') {
        text = response.text || '';
      } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text || '';
      }

      const cleaned = sanitizeName(text);
      if (cleaned && cleaned.length >= 1 && !cleaned.toLowerCase().includes('transliterat')) {
        return cleaned;
      }
    } catch (err) {
      // Gemini failed or timed out — log non-sensitive warning and proceed to fallback
      console.warn('[transliterationService] Gemini transliteration fallback:', err.message);
    }
  }

  // 3. Fallback: return deterministic match or canonical name
  return trimmed;
};

/**
 * Ensures a user document has a cached transliterated name for the requested language.
 * Updates user.localizedNames in place and saves if a new entry was generated.
 *
 * @param {object} user - Mongoose User document
 * @param {string} targetLang - Target language code or name
 * @returns {Promise<string>} Localized display name
 */
export const ensureUserLocalizedName = async (user, targetLang) => {
  if (!user || !user.name) return '';
  const langCode = normalizeLanguageCode(targetLang);

  if (langCode === 'en') {
    return user.name;
  }

  // Initialise localizedNames map if not present
  if (!user.localizedNames) {
    user.localizedNames = new Map();
  }

  // Check cache
  let cached = null;
  if (user.localizedNames instanceof Map) {
    cached = user.localizedNames.get(langCode);
  } else if (typeof user.localizedNames === 'object') {
    cached = user.localizedNames[langCode];
  }

  if (cached && typeof cached === 'string' && cached.trim()) {
    return cached.trim();
  }

  // Generate transliteration
  const transliterated = await transliterateName(user.name, langCode);

  if (transliterated && transliterated !== user.name) {
    if (user.localizedNames instanceof Map) {
      user.localizedNames.set(langCode, transliterated);
    } else {
      user.localizedNames[langCode] = transliterated;
    }

    try {
      // Persist localized name cache to user document without changing canonical name
      user.markModified?.('localizedNames');
      await user.save();
    } catch (saveErr) {
      console.warn('[transliterationService] Failed to cache localizedName:', saveErr.message);
    }
  }

  return transliterated || user.name;
};
