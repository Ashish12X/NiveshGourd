// src/components/input/UniversalInput.jsx
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceInputButton from './VoiceInputButton';
import UploadButton from './UploadButton';
import { analyzeInput } from '../../services/verificationApi';
import { useAuth } from '../../context/AuthContext';

const rotatingExamples = [
  "Someone sent me this investment message promising 25% monthly return...",
  "Is this claim about guaranteed IPO allotment trustworthy?",
  "Explain the difference between mutual funds and bank fixed deposits...",
  "I received a suspicious APK link asking for trading login...",
  "Help me verify if this research analyst is registered with SEBI...",
];

export default function UniversalInput({
  label = "What's happening?",
  buttonText = "Analyze",
  targetRoute = "/validity-check/result",
  placeholder = "Describe what you received, paste a link, or ask a question...",
  className = "",
  autoRotate = true,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [value, setValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % rotatingExamples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const queryText = value.trim() || rotatingExamples[placeholderIndex];

    if (isAuthenticated) {
      try {
        setIsSubmitting(true);
        const isUrl = /^https?:\/\//i.test(queryText) || /^www\./i.test(queryText);
        const result = await analyzeInput({
          inputType: isUrl ? 'URL' : 'TEXT',
          text: isUrl ? undefined : queryText,
          url: isUrl ? queryText : undefined,
        });
        navigate(`/validity-check/result?id=${result._id}`);
      } catch (err) {
        // Fallback: navigate with state if backend call fails
        navigate(targetRoute, { state: { query: queryText, file: attachedFile } });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      navigate('/login', { state: { query: queryText } });
    }
  };

  const handleQuickPrompt = (prompt) => {
    setValue(prompt);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          {label}
        </label>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative bg-white border-2 border-slate-200/90 hover:border-slate-300 focus-within:border-slate-800 rounded-2xl shadow-xs transition-all duration-200"
      >
        <div className="p-3 sm:p-4">
          <textarea
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={rotatingExamples[placeholderIndex]}
            aria-label={label}
            disabled={isSubmitting}
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm sm:text-base focus:outline-none resize-none leading-relaxed disabled:opacity-60"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 bg-slate-50/70 rounded-b-2xl border-t border-slate-100">
          <div className="flex items-center gap-1">
            <UploadButton onFileSelected={(fileName) => setAttachedFile(fileName)} />
            <VoiceInputButton />
            <span className="text-[11px] text-slate-400 hidden sm:inline ml-1">
              Supports screenshots, PDFs, links or text
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>{buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Subtle quick prompts for demo exploration */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          Try asking:
        </span>
        {rotatingExamples.slice(0, 3).map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickPrompt(prompt)}
            className="text-[11px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors truncate max-w-[260px] text-left cursor-pointer"
          >
            "{prompt.slice(0, 34)}..."
          </button>
        ))}
      </div>
    </div>
  );
}
