// src/i18n/i18n.js
/**
 * NiveshGuard i18n Configuration
 *
 * Supports 11 Indian languages:
 *   en, hi, bn, gu, kn, ml, mr, or, pa, ta, te
 *
 * Language preference is persisted in localStorage under 'ng_lang'
 * and synced with user's profile preferences.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all locale JSON files statically for Vite compatibility
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import gu from './locales/gu.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import or from './locales/or.json';
import pa from './locales/pa.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import as from './locales/as.json';

// Detect language from localStorage or fall back to 'en'
const savedLang = localStorage.getItem('ng_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      gu: { translation: gu },
      kn: { translation: kn },
      ml: { translation: ml },
      mr: { translation: mr },
      or: { translation: or },
      pa: { translation: pa },
      ta: { translation: ta },
      te: { translation: te },
      as: { translation: as },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

/**
 * All supported languages with metadata for UI display
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Assamese' },
];

/**
 * Normalizes any language name or code string to a supported 2-letter code
 */
export const resolveLangCode = (lang) => {
  if (!lang || typeof lang !== 'string') return 'en';
  const clean = lang.trim().toLowerCase();
  for (const item of SUPPORTED_LANGUAGES) {
    if (
      clean === item.code ||
      clean === item.name.toLowerCase() ||
      clean === item.nativeName.toLowerCase() ||
      clean.includes(item.name.toLowerCase()) ||
      clean.includes(item.nativeName.toLowerCase())
    ) {
      return item.code;
    }
  }
  const prefix = clean.slice(0, 2);
  if (SUPPORTED_LANGUAGES.some((l) => l.code === prefix)) return prefix;
  return 'en';
};

/**
 * Switch language globally — persists to localStorage
 */
export const switchLanguage = (langCode) => {
  const resolved = resolveLangCode(langCode);
  i18n.changeLanguage(resolved);
  localStorage.setItem('ng_lang', resolved);
  // Set HTML lang attribute for accessibility and screen readers
  document.documentElement.lang = resolved;
  return resolved;
};

