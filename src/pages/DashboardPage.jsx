import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Scale,
  CheckSquare,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FolderLock,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Compass
} from 'lucide-react';
import UniversalInput from '../components/input/UniversalInput';
import Card from '../components/common/Card';
import SectionHeader from '../components/common/SectionHeader';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchUnderstandingProfile } from '../services/assessmentApi';
import { fetchLearningDashboard } from '../services/learningApi';
import { mockUser } from '../data/mockUser';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [learningData, setLearningData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchUnderstandingProfile();
        setProfile(data);
      } catch (err) {
        console.warn('Dashboard profile load:', err.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    const loadLearning = async () => {
      try {
        const data = await fetchLearningDashboard();
        setLearningData(data);
      } catch (err) {
        console.warn('Dashboard learning load:', err.message);
      }
    };

    loadProfile();
    loadLearning();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 17) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  const displayName = (user?.displayName || user?.name)
    ? (user.displayName || user.name).split(' ')[0]
    : mockUser.name.split(' ')[0];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Top Greeting & Universal Input Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-sm border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-teal-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{t('dashboard.badge')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {getGreeting()}, {displayName}.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6 font-normal">
            {t('dashboard.heroSubtitle')}
          </p>
        </div>

        {/* Large Universal Input in White Box */}
        <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-md">
          <UniversalInput
            label=""
            buttonText={t('dashboard.checkNow')}
            placeholder={t('dashboard.inputPlaceholder')}
            targetRoute="/validity-check/result"
          />
        </div>
      </div>

      {/* Primary Action Cards (6 Cards) */}
      <div>
        <SectionHeader
          title={t('dashboard.coreActionsTitle')}
          description={t('dashboard.coreActionsSubtitle')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. Check Something */}
          <Link
            to="/validity-check"
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 mb-3 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                {t('dashboard.cardVerifyTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('dashboard.cardVerifyDesc')}
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-blue-700 gap-1 group-hover:gap-1.5 transition-all">
              <span>{t('dashboard.quickCheck')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 2. Learn */}
          <Link
            to="/learn"
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                {t('dashboard.cardLearnTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('dashboard.cardLearnDesc')}
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-teal-700 gap-1 group-hover:gap-1.5 transition-all">
              <span>{t('learning.startTopic')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 3. Ask NiveshGuard */}
          <Link
            to="/ask"
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 mb-3 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                {t('dashboard.cardAskTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('dashboard.cardAskDesc')}
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-indigo-700 gap-1 group-hover:gap-1.5 transition-all">
              <span>{t('ask.send')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 4. Compare */}
          <Link
            to="/compare"
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 mb-3 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                {t('dashboard.cardCompareTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('dashboard.cardCompareDesc')}
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-slate-800 gap-1 group-hover:gap-1.5 transition-all">
              <span>{t('compare.compareBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 5. Before I Act */}
          <Link
            to="/decision-readiness"
            className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-3 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                {t('dashboard.cardReadinessTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('dashboard.cardReadinessDesc')}
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-amber-700 gap-1 group-hover:gap-1.5 transition-all">
              <span>{t('readiness.title')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* 6. Something Went Wrong */}
          <Link
            to="/incident"
            className="group p-5 rounded-2xl bg-rose-50/40 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-800 mb-3 group-hover:scale-105 transition-transform">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-rose-900 text-base mb-1">
                {t('incident.title')}
              </h3>
              <p className="text-xs text-rose-800/80 leading-relaxed">
                {t('incident.subtitle')}
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-rose-700 gap-1 group-hover:gap-1.5 transition-all">
              <span>{t('sidebar.incident')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* Understanding Snapshot or Calibration Callout */}
      {!loadingProfile && (
        <div>
          {profile?.baselineAssessmentCompleted ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Understanding Snapshot
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calibrated baseline across 6 safety domains
                    </p>
                  </div>
                </div>

                <Link
                  to="/my-safety"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View Full Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {Object.values(profile.topics || {}).map((top) => {
                  const getBadge = (st) => {
                    if (st === 'Strong') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    if (st === 'Developing') return 'bg-amber-50 text-amber-800 border-amber-200';
                    return 'bg-orange-50 text-orange-800 border-orange-200';
                  };

                  return (
                    <div
                      key={top.topicId}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-bold text-slate-800 line-clamp-1 mb-1.5" title={top.label}>
                        {top.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border self-start ${getBadge(top.status)}`}>
                        {top.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-teal-50/80 via-slate-50 to-white rounded-2xl border border-teal-200/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Help NiveshGuard understand you.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                    Take the short 5-minute calibration assessment so NiveshGuard can adapt its language, highlight specific risks, and guide you without generic advice.
                  </p>
                </div>
              </div>

              <Link to="/assessment" className="shrink-0 self-start sm:self-auto">
                <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                  Start Assessment
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2-Column Section: Recommended For You & Continue Learning (real Stage 6 data) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended For You — real adaptive engine */}
        {(() => {
          const rec = learningData?.recommended;
          const recTopic = rec?.topic;
          if (recTopic) {
            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" /> Recommended For You
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                      {rec.learningMode?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {recTopic.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {recTopic.shortDescription}
                  </p>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 mb-4">
                    <strong>Why NiveshGuard recommended this:</strong> {rec.reason}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{recTopic.estimatedMinutes} mins</span>
                  <Link
                    to={`/learn/topic/${recTopic.topicId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors"
                  >
                    <span>Explore Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          }
          // Fallback: link to /learn when recommendation unavailable
          return (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-3">
                  <Sparkles className="w-3 h-3 text-teal-600" /> Adaptive Learning
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2 mt-3">
                  Your learning curriculum is ready
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  NiveshGuard will calibrate topic recommendations once your understanding profile is complete.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">6 core domains</span>
                <Link
                  to="/learn"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors"
                >
                  <span>Open Learning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Continue Learning — real in-progress topic, or fallback to /learn */}
        {(() => {
          const continueTopic = learningData?.categorized?.continueLearning?.[0];
          if (continueTopic) {
            const prog = continueTopic.userProgress;
            const progressPct = prog
              ? Math.round(((prog.comprehensionScore || 0) + (prog.practicalScore || 0)) / 2)
              : 0;
            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Continue Learning
                    </span>
                    <Link to="/learn" className="text-xs font-semibold text-teal-700 hover:underline">
                      View all topics
                    </Link>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {continueTopic.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {continueTopic.shortDescription}
                  </p>

                  <div className="space-y-1.5 mb-5">
                    <ProgressBar value={progressPct} max={100} showLabel label="Progress" color="teal" size="sm" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Section {(prog?.currentSection ?? 0) + 1} of {continueTopic.sections?.length || 3}
                  </span>
                  <Link
                    to={`/learn/topic/${continueTopic.topicId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors"
                  >
                    <span>Resume Topic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          }
          // Fallback when nothing in progress
          return (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Investor Safety Curriculum
                  </span>
                  <Link to="/learn" className="text-xs font-semibold text-teal-700 hover:underline">
                    View all topics
                  </Link>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  6 Regulatory Domains
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Start any topic to begin adaptive learning calibrated to your understanding map.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{learningData?.totalTopics ?? '—'} modules</span>
                <Link
                  to="/learn"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors"
                >
                  <span>Explore All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Your Safety & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Safety (Recent Check) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Safety</h2>
              <p className="text-xs text-slate-500">Most recent claim analyzed</p>
            </div>
            <Link to="/my-safety" className="text-xs font-semibold text-teal-700 hover:underline">
              Safety Overview
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status="Needs verification" type="warning" />
                <span className="text-[11px] text-slate-400 font-mono">Today, 19:42 IST</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Investment message verification
              </h4>
              <p className="text-xs text-slate-600 mt-1 italic">
                "Guaranteed 25% monthly return via exclusive algorithmic pool"
              </p>
            </div>

            <Link
              to="/validity-check/result"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            >
              <span>View Analysis</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Quick Access</h3>
            <p className="text-xs text-slate-500 mb-4">Your personal safety records</p>

            <div className="space-y-2.5">
              <Link
                to="/my-safety"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>My Safety</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/my-safety/evidence"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <FolderLock className="w-4 h-4 text-blue-700" />
                  <span>Evidence Vault</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/my-safety/receipts"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-amber-700" />
                  <span>Safety Receipts</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Encrypted tamper-evident records
          </div>
        </div>
      </div>
    </div>
  );
}
