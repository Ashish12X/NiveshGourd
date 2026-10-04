// src/pages/ValidityCheckPage.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Image,
  Link2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { analyzeInput } from '../services/verificationApi';

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

export default function ValidityCheckPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  const [inputText, setInputText] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageExtractedText, setImageExtractedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');

  const handleFileDrop = (e) => {
    e.preventDefault();
    setFileError('');
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;

    // MIME type validation
    if (!ALLOWED_IMAGE_MIMES.includes(file.type.toLowerCase())) {
      setFileError('Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or BMP image.');
      setUploadedFile(null);
      return;
    }

    // Size validation (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setFileError('File size must not exceed 20MB.');
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setIsAnalyzing(true);

    try {
      let result;

      if (activeTab === 'text') {
        if (!inputText.trim() || inputText.trim().length < 10) {
          setError('Please enter at least 10 characters of text to analyze.');
          setIsAnalyzing(false);
          return;
        }
        result = await analyzeInput({ inputType: 'TEXT', text: inputText });

      } else if (activeTab === 'link') {
        if (!linkInput.trim()) {
          setError('Please enter a URL to analyze.');
          setIsAnalyzing(false);
          return;
        }
        result = await analyzeInput({ inputType: 'URL', url: linkInput });

      } else if (activeTab === 'upload') {
        // For image upload: pass file metadata + any user-provided extracted text
        const imageFile = uploadedFile
          ? { filename: uploadedFile.name, mimeType: uploadedFile.type, sizeBytes: uploadedFile.size }
          : null;

        if (!uploadedFile && !imageExtractedText.trim()) {
          setError('Please upload an image or paste the message text from the screenshot.');
          setIsAnalyzing(false);
          return;
        }

        result = await analyzeInput({
          inputType: 'IMAGE',
          imageFile,
          extractedImageText: imageExtractedText || undefined,
        });
      }

      // Navigate to result page with analysis ID
      navigate(`/validity-check/result?id=${result._id}`);

    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isSubmitDisabled = isAnalyzing || (
    (activeTab === 'text' && !inputText.trim()) ||
    (activeTab === 'link' && !linkInput.trim()) ||
    (activeTab === 'upload' && !uploadedFile && !imageExtractedText.trim())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={t('validity.title')}
        subtitle={t('validity.subtitle')}
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Live Verification Engine
          </span>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        {/* Input Format Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 overflow-x-auto">
          <button
            type="button"
            id="tab-text"
            onClick={() => { setActiveTab('text'); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('validity.tabText')}</span>
          </button>

          <button
            type="button"
            id="tab-upload"
            onClick={() => { setActiveTab('upload'); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t('validity.tabImage')}</span>
          </button>

          <button
            type="button"
            id="tab-link"
            onClick={() => { setActiveTab('link'); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'link'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>{t('validity.tabUrl')}</span>
          </button>
        </div>

        {/* Tab 1: Paste Text */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="message-text" className="text-xs font-semibold text-slate-700">
                  Message, Claim, or Description
                </label>
                <span className="text-xs text-slate-400">{inputText.length}/5000</span>
              </div>
              <textarea
                id="message-text"
                rows={7}
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 5000))}
                placeholder={
                  'Paste the investment message, WhatsApp forward, or describe the claim...\n\nExample:\n"Hi sir, join our SEBI approved VIP group today! Guaranteed 25% profit every month with 100% capital protection. Only 3 slots left. Click here to deposit via UPI or DM admin directly."'
                }
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 leading-relaxed text-slate-800 resize-none"
              />
            </div>
            <p className="text-xs text-slate-500">
              SANGYAN will extract individual claims from your text and analyze each one separately.
            </p>
          </div>
        )}

        {/* Tab 2: Upload Screenshot */}
        {activeTab === 'upload' && (
          <div className="space-y-5">
            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer relative"
            >
              <input
                type="file"
                onChange={handleFileDrop}
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Upload message screenshot"
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-teal-700 mx-auto mb-4">
                {uploadedFile ? <CheckCircle2 className="w-7 h-7 text-teal-600" /> : <UploadCloud className="w-7 h-7" />}
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {uploadedFile ? uploadedFile.name : 'Drag & drop your screenshot, or browse'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                JPEG, PNG, WebP, GIF, BMP — up to 20MB
              </p>
              {fileError && (
                <p className="mt-3 text-xs text-rose-600 font-semibold">{fileError}</p>
              )}
            </div>

            {/* OCR unavailability notice + text extraction field */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-1">Automatic text extraction (OCR) is not yet configured.</p>
                  <p className="text-xs text-amber-700">
                    Please paste the message text from your screenshot below so SANGYAN can analyze it.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="image-text" className="text-xs font-semibold text-slate-700">
                  Message text from your screenshot
                </label>
                <span className="text-xs text-slate-400">{imageExtractedText.length}/5000</span>
              </div>
              <textarea
                id="image-text"
                rows={5}
                value={imageExtractedText}
                onChange={(e) => setImageExtractedText(e.target.value.slice(0, 5000))}
                placeholder="Paste the exact text visible in your screenshot here..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 leading-relaxed text-slate-800 resize-none"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Paste Link */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="target-link" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Website or Investment Platform URL
              </label>
              <input
                id="target-link"
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value.slice(0, 2048))}
                placeholder="https://exclusive-alpha-invest.trade/join"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 text-slate-800"
              />
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> URL analysis checks the URL structure and domain for risk signals.
                  Full website content scanning requires a live evidence provider to be configured.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 font-medium">{error}</p>
          </div>
        )}

        {/* Analyzing state */}
        {isAnalyzing && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{t('validity.analyzing')}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Extracting claims, detecting risk signals, and assessing verification status.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isAnalyzing && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Private & encrypted check. Your data is never shared externally.</span>
            </div>

            <Button
              id="analyze-btn"
              variant="primary"
              size="lg"
              onClick={handleAnalyze}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full sm:w-auto px-8"
              disabled={isSubmitDisabled}
            >
              {t('validity.analyzeBtn')}
            </Button>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">How SANGYAN verifies claims</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: '1', label: 'Extract Claims', desc: 'Identifies individual claims in your text' },
            { step: '2', label: 'Classify & Analyse', desc: 'Categorizes each claim and detects risk signals' },
            { step: '3', label: 'Assess Status', desc: 'Determines: Verified, Contradicted, Not Verified, etc.' },
            { step: '4', label: 'Personalized Guidance', desc: 'Adapts explanation to your understanding level' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-teal-600 block mb-1">Step {step}</span>
              <span className="text-xs font-bold text-slate-800 block mb-1">{label}</span>
              <span className="text-xs text-slate-500 leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400 italic">
          SANGYAN does not automatically classify claims as "scam" or "not scam". 
          Risk signals are warning indicators — not verdicts.
        </p>
      </div>
    </div>
  );
}
