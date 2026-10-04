// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  AlertOctagon,
  ArrowRight,
  Search,
  CheckSquare,
  Lock,
  Layers,
  Sparkles,
  Users,
  Compass,
  FileCheck
} from 'lucide-react';
import UniversalInput from '../components/input/UniversalInput';
import Button from '../components/common/Button';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-200/80">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-50/50 via-slate-50/20 to-transparent pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>{t('brand.name')} — {t('brand.edition')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
            {t('brand.tagline')}
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            {t('dashboard.heroSubtitle')}
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
            <Link to="/register">
              <Button size="lg" variant="primary" icon={ArrowRight} iconPosition="right">
                {t('nav.register')}
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="secondary">
                {t('nav.howItWorks')}
              </Button>
            </a>
          </div>

          {/* Universal Input Component - Prominent on Hero */}
          <div className="max-w-2xl mx-auto text-left shadow-lg rounded-2xl bg-white p-2 sm:p-3 border border-slate-200">
            <UniversalInput
              label="What's happening?"
              buttonText="Check Now"
              placeholder="Tell me what's happening or paste a claim..."
            />
          </div>
        </div>
      </section>

      {/* Four Primary Actions */}
      <section className="py-16 sm:py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Four Primary Safeguards
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every financial interaction carries distinct needs. Select the action tailored to where you are right now.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Understand */}
            <Link
              to="/learn"
              className="group p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 mb-4 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  1. Understand
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Break down complex financial terms, product risks, and jargon into plain, contextual language.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-teal-700 gap-1 group-hover:gap-1.5 transition-all">
                <span>Explore topics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* 2. Verify */}
            <Link
              to="/validity-check"
              className="group p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 mb-4 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  2. Verify
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Check suspicious messages, guaranteed returns, links, or documents against regulatory patterns.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-blue-700 gap-1 group-hover:gap-1.5 transition-all">
                <span>Run a check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* 3. Before I Act */}
            <Link
              to="/decision-readiness"
              className="group p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-4 group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3. Before I Act
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Evaluate your decision readiness with a structured fact checklist before transferring money.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-amber-700 gap-1 group-hover:gap-1.5 transition-all">
                <span>Review checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* 4. Something Went Wrong */}
            <Link
              to="/incident"
              className="group p-6 rounded-2xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50 hover:border-rose-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-800 mb-4 group-hover:scale-105 transition-transform">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  4. Something Went Wrong
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Immediate, non-judgmental guidance if you transferred funds, got blocked, or suspect a scam.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-rose-700 gap-1 group-hover:gap-1.5 transition-all">
                <span>Emergency protocol</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Visual Product Loop Section */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-wider uppercase text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              The NiveshGuard Cycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-4">
              Adaptive Protection That Evolves With You
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              The same information does not work equally well for every investor. NiveshGuard closes the loop between understanding, verification, and reflection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs mb-3">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Understand</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clarify the economic fundamentals, risk bounds, and statutory rights in accessible terms.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white font-bold flex items-center justify-center text-xs mb-3">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Verify</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect claims against official regulatory registries, alert lists, and behavioral red flags.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-xs mb-3">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Learn</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive targeted bite-sized scenarios to reinforce areas that showed uncertainty.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs mb-3">
                04
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Act Safely</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Proceed only through authorized banking and exchange channels with preserved proof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guardrail Section */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Built Strictly for Protection, Never for Speculation
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            <strong>NiveshGuard does not give stock tips or make investment decisions for you.</strong> We do not recommend hot stocks, predict market movements, or replace official statutory regulatory portals.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <h4 className="font-semibold text-white text-sm mb-1">No Commercial Bias</h4>
              <p className="text-xs text-slate-400">Zero commission partnerships, no promoted brokers, and no hidden affiliate links.</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <h4 className="font-semibold text-white text-sm mb-1">Uncertainty Modeling</h4>
              <p className="text-xs text-slate-400">When facts are inconclusive, we transparently state what could not be independently verified.</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <h4 className="font-semibold text-white text-sm mb-1">Official Redressal</h4>
              <p className="text-xs text-slate-400">Direct integration of official helpline 1930, SEBI SCORES 2.0, and RBI Sachet channels.</p>
            </div>
          </div>

          <div className="mt-10">
            <Link to="/assessment">
              <Button size="lg" variant="teal" icon={ArrowRight} iconPosition="right">
                Calibrate Your SANGYAN Map
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
