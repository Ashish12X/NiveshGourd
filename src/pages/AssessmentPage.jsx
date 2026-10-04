// src/pages/AssessmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  FileText,
  Search,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import { useTranslation } from 'react-i18next';
import { fetchAssessment, submitAssessmentAnswers, fetchLatestAssessment } from '../services/assessmentApi';

export default function AssessmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [assessmentData, setAssessmentData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [confidenceRatings, setConfidenceRatings] = useState({});
  const [startedAt, setStartedAt] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Load questions on mount
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await fetchAssessment();
      setAssessmentData(data);
      setQuestions(data.questions || []);
      setStartedAt(new Date().toISOString());
    } catch (err) {
      setLoadError(err.message || 'Unable to connect to the safety calibration server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];

  const handleSelectOption = (optId) => {
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optId }));
  };

  const handleSelectConfidence = (level) => {
    if (!currentQ) return;
    setConfidenceRatings((prev) => ({ ...prev, [currentQ.id]: level }));
  };

  const handleNext = async () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Final question answered: Submit to backend
      await handleSubmitAssessment();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare answer payload mapping confidence values ('low', 'medium', 'high')
      const answersPayload = questions.map((q) => {
        const rawConf = confidenceRatings[q.id] || 'medium';
        let normalizedConf = 'medium';
        if (rawConf === 'not-sure' || rawConf === 'low') normalizedConf = 'low';
        else if (rawConf === 'very' || rawConf === 'high') normalizedConf = 'high';

        return {
          questionId: q.id,
          selectedOption: selectedAnswers[q.id],
          confidence: normalizedConf,
        };
      });

      const result = await submitAssessmentAnswers({
        assessmentVersion: assessmentData?.version || '1.0',
        answers: answersPayload,
        startedAt,
      });

      setAssessmentResult(result);
      setIsCompleted(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasAnsweredCurrent = currentQ && selectedAnswers[currentQ.id];
  const hasConfidenceCurrent = currentQ && confidenceRatings[currentQ.id];
  const canProceed = hasAnsweredCurrent && hasConfidenceCurrent && !submitting;

  // --- 1. Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto shadow-sm animate-pulse">
            <Sparkles className="w-6 h-6 text-teal-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Loading Safety Assessment</h2>
          <p className="text-xs text-slate-500">
            Retrieving calibrated scenario questions from the SANGYAN safety engine...
          </p>
        </div>
      </div>
    );
  }

  // --- 2. Error Loading State ---
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Unable to Load Assessment</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {loadError}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="primary" size="md" onClick={loadQuestions} icon={RefreshCw} iconPosition="left">
              Retry Loading
            </Button>
            <Link to="/dashboard">
              <Button variant="outline" size="md">
                Skip to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Skip Option */}
        <div className="text-center mb-8 relative">
          {!isCompleted && (
            <div className="mb-3 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">Stage 3 Calibration</span>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Skip for now →
              </button>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calibration Experience</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {t('assessment.title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            {t('assessment.subtitle')}
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {!isCompleted && currentQ ? (
          /* Multi-step Question View */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            {/* Progress Header */}
            <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t('assessment.question')} {currentIndex + 1} {t('assessment.of')} {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {currentQ.topicLabel || currentQ.topic}
                </span>
                <span className="text-[11px] font-mono uppercase text-teal-700 font-semibold px-2 py-0.5 rounded bg-teal-50">
                  {currentQ.type === 'practical' ? 'Real Situation' : 'Core Principle'}
                </span>
              </div>
            </div>

            <ProgressBar value={currentIndex + 1} max={totalQuestions} color="teal" size="sm" className="mb-8" />

            {/* Question Text */}
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug">
                {currentQ.question}
              </h2>
              {currentQ.description && (
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {currentQ.description}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-300 text-slate-500 bg-white'
                      }`}
                    >
                      {opt.id.toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 pt-0.5 leading-relaxed">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Confidence Check */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 mb-8">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                How confident are you about this answer?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { level: 'low', label: 'Not sure' },
                  { level: 'medium', label: 'Somewhat confident' },
                  { level: 'high', label: 'Very confident' },
                ].map((item) => {
                  const isConf = confidenceRatings[currentQ.id] === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => handleSelectConfidence(item.level)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        isConf
                          ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0 || submitting}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('assessment.back')}</span>
              </button>

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed}
                icon={currentIndex === totalQuestions - 1 ? Check : ArrowRight}
                iconPosition="right"
              >
                {submitting
                  ? t('assessment.submitting', 'Calibrating...')
                  : currentIndex === totalQuestions - 1
                  ? t('assessment.submit')
                  : t('assessment.next')}
              </Button>
            </div>
          </div>
        ) : isCompleted && assessmentResult ? (
          /* Calibration Result / Real Understanding Map */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 animate-fade-in">
            <div className="text-center pb-8 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Your Understanding Map is ready.
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
                NiveshGuard uses this baseline as a starting point and will continuously adapt explanations as you interact and verify claims.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Baseline Calibrated • Version {assessmentResult.assessmentVersion}</span>
              </div>
            </div>

            {/* Categories Overview (All 6 Real Topics) */}
            <div className="py-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Topic Understanding Breakdown
                </h3>
                <span className="text-[11px] text-slate-400">
                  6 Core Safety Domains
                </span>
              </div>

              <div className="space-y-3">
                {assessmentResult.topicResults?.map((topic) => {
                  const getStatusBadge = (status) => {
                    if (status === 'Strong') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    if (status === 'Developing') return 'bg-amber-50 text-amber-800 border-amber-200';
                    return 'bg-orange-50 text-orange-800 border-orange-200';
                  };

                  return (
                    <div
                      key={topic.topic}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 text-sm">
                            {topic.topicLabel}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(topic.status)}`}>
                            {topic.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {topic.explanation}
                        </p>
                      </div>

                      <div className="w-full sm:w-32 shrink-0">
                        <ProgressBar
                          value={topic.knowledgeScore}
                          max={100}
                          size="sm"
                          color={topic.status === 'Strong' ? 'emerald' : topic.status === 'Developing' ? 'amber' : 'slate'}
                          showLabel={false}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                          <span>Confidence</span>
                          <span>{topic.confidenceScore}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended First Topic Note */}
            {assessmentResult.recommendedFirstTopic && (
              <div className="bg-teal-50/60 border border-teal-200/70 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                      Recommended Focus Area
                    </h4>
                    <p className="text-sm font-bold text-teal-950 mt-0.5">
                      {assessmentResult.recommendedFirstTopic.label}
                    </p>
                    <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                      {assessmentResult.recommendedFirstTopic.action}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Continue to Dashboard */}
            <div className="text-center pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/dashboard')}
                icon={ArrowRight}
                iconPosition="right"
                className="w-full sm:w-auto px-8"
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
