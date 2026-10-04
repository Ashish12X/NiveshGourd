// src/components/common/LanguageSwitcher.jsx
/**
 * LanguageSwitcher Component
 *
 * Renders a dropdown to switch between 11 supported Indian languages.
 * Language change takes effect immediately across the entire app.
 * Preference is persisted in localStorage and can be synced to profile.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, switchLanguage } from '../../i18n/i18n';
import { useAuth } from '../../context/AuthContext';

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (code) => {
    switchLanguage(code);
    setIsOpen(false);
    if (user && updateProfile) {
      try {
        await updateProfile({ preferences: { language: code } });
      } catch (err) {
        console.warn('Could not sync language preference to profile:', err?.message);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium cursor-pointer ${
          compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm'
        }`}
        aria-label="Switch language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe className={`shrink-0 text-slate-500 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        <span className="font-semibold">
          {compact ? currentLang.code.toUpperCase() : currentLang.nativeName}
        </span>
        <ChevronDown className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          role="listbox"
          aria-label="Select language"
        >
          <div className="p-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1.5 mb-0.5">
              Select Language
            </div>
            <div className="max-h-72 overflow-y-auto space-y-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === i18n.language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm leading-none">{lang.nativeName}</span>
                      {!isSelected && (
                        <span className="text-[10px] text-slate-400">{lang.name}</span>
                      )}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
