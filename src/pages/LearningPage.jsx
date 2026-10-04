// src/pages/LearningPage.jsx
/**
 * LearningPage — Stage 6 Real Adaptive Learning Dashboard
 *
 * Fully connected to the backend Adaptive Learning Engine:
 *   - Dynamically recommended topic tailored to user's UnderstandingProfile
 *   - "Why recommended" transparent reason badge
 *   - "Continue Learning" (in-progress modules)
 *   - "Needs Review" (modules with active misconceptions or lower scores)
 *   - Filterable catalog across all 6 investor protection domains
 *   - Contextual banner when redirected from Stage 5 verification
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Compass,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SectionHeader from '../components/common/SectionHeader';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import { fetchLearningDashboard } from '../services/learningApi';

const DOMAIN_LABELS = {
  All: 'All Domains',
  sourceVerification: 'Source Verification',
  riskReturn: 'Risk & Return',
  fraudAwareness: 'Fraud Awareness',
  investorRights: 'Investor Rights',
  grievanceAwareness: 'Grievance Awareness',
  basicConcepts: 'Basic Concepts',
};

export default function LearningPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const contextualSignal = searchParams.get('signal') || null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDomain, setFilterDomain] = useState('All');

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchLearningDashboard(contextualSignal);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load learning curriculum.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [contextualSignal]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <h2 className="text-base font-semibold text-slate-800">
          {t('learning.title')}
        </h2>
        <p className="text-xs text-slate-500">
          Analyzing your Understanding Map and recent verification signals.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold">Learning Curriculum Unavailable</h2>
          </div>
          <p className="text-sm">{error || 'Could not load your curriculum at this moment.'}</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { recommended, categorized, totalTopics, userCompletedCount } = data;
  const recommendedTopic = recommended?.topic;

  // Flatten available topics for filtered catalog view
  const allCurriculumTopics = [
    ...(categorized.continueLearning || []),
    ...(categorized.needsReview || []),
    ...(categorized.available || []),
    ...(categorized.mastered || []),
  ];

  // Deduplicate by topicId
  const uniqueTopicsMap = new Map();
  allCurriculumTopics.forEach((t) => {
    if (!uniqueTopicsMap.has(t.topicId)) {
      uniqueTopicsMap.set(t.topicId, t);
    }
  });
  const uniqueTopics = Array.from(uniqueTopicsMap.values());

  const filteredTopics = filterDomain === 'All'
    ? uniqueTopics
    : uniqueTopics.filter((t) => t.domain === filterDomain);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      <PageHeader
        title={t('learning.title')}
        subtitle={t('learning.subtitle')}
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {userCompletedCount} {t('assessment.of')} {totalTopics} {t('learning.completed')}
          </span>
        }
      />

      {/* Contextual Warning Banner from Stage 5 (if triggered) */}
      {contextualSignal && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Contextual Learning Suggestion:</strong> SANGYAN detected potential risk signals in your recent claim check (<em>{contextualSignal.replace(/_/g, ' ')}</em>). We’ve adjusted your recommended module to address this topic first.
          </div>
        </div>
      )}

      {/* Featured Adaptive Recommendation Box */}
      {recommendedTopic && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Recommended for You
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {recommendedTopic.estimatedMinutes} min read
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                  {recommended.learningMode}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {recommendedTopic.title}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {recommendedTopic.shortDescription}
              </p>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-teal-300 inline-block">
                <strong>Why SANGYAN recommended this:</strong> {recommended.reason}
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3">
              <Link to={`/learn/topic/${recommendedTopic.topicId}`}>
                <Button size="lg" variant="teal" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto">
                  Start Learning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Continue Learning (In-Progress) */}
      {categorized.continueLearning?.length > 0 && (
        <div>
          <SectionHeader
            title="Continue Learning"
            description="Modules you have started and can resume right now"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categorized.continueLearning.map((item) => (
              <div
                key={item.topicId}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      In Progress
                    </span>
                    <span>{item.estimatedMinutes} mins</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.shortDescription}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Section {item.userProgress.currentSection + 1}</span>
                  <Link
                    to={`/learn/topic/${item.topicId}`}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
                  >
                    Resume <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Review / Misconceptions */}
      {categorized.needsReview?.length > 0 && (
        <div>
          <SectionHeader
            title="Needs Review"
            description="Topics where misconceptions or incorrect practical decisions were detected"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categorized.needsReview.map((item) => (
              <div
                key={item.topicId}
                className="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" /> Review Needed
                    </span>
                    {item.userProgress.hasMisconceptions && (
                      <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded text-[10px]">
                        Misconception Flagged
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.shortDescription}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-amber-200/60 flex items-center justify-between">
                  <span className="text-xs text-amber-900 font-medium">Revisit core concept</span>
                  <Link
                    to={`/learn/topic/${item.topicId}`}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
                  >
                    Review Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filterable All Topics Catalog */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Complete Investor Protection Curriculum"
            description="Curated regulatory modules across the 6 core investor protection domains"
          />

          {/* Domain Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterDomain(key)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                  filterDomain === key
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((topic) => {
            const isMastered = topic.userProgress?.status === 'MASTERED';
            return (
              <div
                key={topic.topicId}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isMastered ? 'border-emerald-200/80 bg-emerald-50/20' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                      {DOMAIN_LABELS[topic.domain] || topic.domain}
                    </span>
                    {isMastered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Mastered
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">
                        {topic.estimatedMinutes} mins
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {topic.shortDescription}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Level: {topic.difficulty}
                  </span>
                  <Link
                    to={`/learn/topic/${topic.topicId}`}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
                  >
                    {isMastered ? 'Revisit' : 'Start'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
