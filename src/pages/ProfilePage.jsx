// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import {
  User,
  Globe,
  Sliders,
  Eye,
  Volume2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { mockUser } from '../data/mockUser';
import { SUPPORTED_LANGUAGES, switchLanguage } from '../i18n/i18n';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();

  const [name, setName] = useState(user?.name || mockUser.name);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [preferences, setPreferences] = useState({
    responseStyle: user?.preferences?.responseStyle || mockUser.preferences.responseStyle,
    textSize: user?.preferences?.textSize || mockUser.preferences.textSize,
    voicePrompt: user?.preferences?.voicePrompt || (user?.preferences?.voiceEnabled ? 'On' : 'Off') || mockUser.preferences.voicePrompt,
    highContrast: user?.preferences?.highContrast ?? mockUser.preferences.highContrast,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPreferences({
        responseStyle: user.preferences?.responseStyle || 'Simple, Jargon-Free',
        textSize: user.preferences?.textSize || 'Standard',
        voicePrompt: user.preferences?.voicePrompt || (user.preferences?.voiceEnabled ? 'On' : 'Off'),
        highContrast: !!user.preferences?.highContrast,
      });
      // Sync saved lang if user has it set
      if (user.preferences?.language) {
        setSelectedLang(user.preferences.language);
      }
    }
  }, [user]);

  // When language changes in the switcher, keep local state in sync
  useEffect(() => {
    setSelectedLang(i18n.language);
  }, [i18n.language]);

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, val) => {
    setPreferences((prev) => ({ ...prev, [key]: val }));
  };

  const handleLangChange = (code) => {
    setSelectedLang(code);
    switchLanguage(code); // Instantly apply globally
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaving(true);

    try {
      await updateProfile({
        name,
        preferences: {
          ...preferences,
          language: selectedLang,
          voiceEnabled: preferences.voicePrompt === 'On',
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  // Helper to extract initials
  const getInitials = (fullName) => {
    if (!fullName) return 'IN';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const userDisplayName = user?.displayName || user?.name || name;
  const userDisplayEmail = user?.email || mockUser.email;
  const userAvatar = getInitials(user?.name || userDisplayName);

  const currentLangMeta = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        badge={
          <Badge variant="teal" size="sm">
            Adaptive Profile
          </Badge>
        }
      />

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-extrabold shadow-sm shrink-0">
            {userAvatar}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{userDisplayName}</span>
              {user?.displayName && user?.displayName !== user?.name && (
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  ({user.name})
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">{userDisplayEmail} • Active Verified Session</p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Persona: {mockUser.persona}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Level: {mockUser.understandingLevel}
              </span>
              {currentLangMeta && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  🌐 {currentLangMeta.nativeName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Adaptive Explanation Profile Callout */}
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-teal-950 space-y-0.5">
            <strong className="block font-bold">
              {t('profile.languageSection')}
            </strong>
            <p className="text-teal-900 text-xs leading-relaxed">
              {t('profile.langNotice')}
            </p>
          </div>
        </div>

        {/* Language Selection - Prominent Full Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-bold text-slate-900">
              {t('profile.languageSection')}
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t('profile.langNotice')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === selectedLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLangChange(lang.code)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-base font-bold leading-tight mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {lang.nativeName}
                  </div>
                  <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {lang.name}
                  </div>
                  {isSelected && (
                    <div className="mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 mt-1">
            {t('profile.transliterationNotice')}
          </p>
        </div>

        {/* Preferences Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Interface & Response Customization
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
            {/* Response Style */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>{t('profile.styleSection')}</span>
              </label>
              <select
                value={preferences.responseStyle}
                onChange={(e) => handleSelectChange('responseStyle', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-slate-800"
              >
                <option value="Simple, Jargon-Free">{t('profile.styleSimple')}</option>
                <option value="Balanced with Legal Details">{t('profile.styleBalanced')}</option>
                <option value="Institutional & Regulatory">{t('profile.styleTechnical')}</option>
              </select>
            </div>

            {/* Text Size Accessibility */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>{t('profile.textSizeSection')}</span>
              </label>
              <select
                value={preferences.textSize}
                onChange={(e) => handleSelectChange('textSize', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-slate-800"
              >
                <option value="Standard">{t('profile.textStandard')}</option>
                <option value="Comfortable">{t('profile.textComfortable')}</option>
                <option value="Large (Elder Friendly)">{t('profile.textLarge')}</option>
              </select>
            </div>

            {/* Voice Prompts */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span>Voice Prompts</span>
              </label>
              <select
                value={preferences.voicePrompt}
                onChange={(e) => handleSelectChange('voicePrompt', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-slate-800"
              >
                <option value="Off">Off (Text Only)</option>
                <option value="On">On (Voice UI preview)</option>
              </select>
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Privacy & Local Storage
            </h4>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Private Session Mode
                </span>
                <span className="text-[11px] text-slate-500">
                  Do not log temporary message checks to Recent Checks history
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={() => handleToggle('highContrast')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700">
                <CheckCircle2 className="w-4 h-4" /> {t('profile.saveSuccess')}
              </span>
            ) : (
              <span className="text-xs text-slate-400">SANGYAN 2026</span>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              iconPosition="left"
              disabled={saving}
            >
              {saving ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
