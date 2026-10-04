// src/pages/DecisionReadinessPage.jsx
// Stage 7C — Decision Readiness (Real backend-connected)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  ArrowRight,
  Sparkles,
  FileCheck,
  Loader2,
  AlertCircle,
  History,
  Search,
  BookOpen,
  MessageSquare,
  Scale,
  Send
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  fetchReadinessTemplate,
  submitReadinessSession,
  fetchReadinessHistory,
} from '../services/readinessApi';

// ── Answer option button ──────────────────────────────────────────────────────
function AnswerButton({ value, current, onClick, children, colorClass }) {
  const isActive = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
        isActive ? colorClass : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

// ── Bridge icon map ───────────────────────────────────────────────────────────
const BRIDGE_ICONS = {
  VALIDITY_CHECK: Search,
  COMPARE: Scale,
  LEARN: BookOpen,
  ASK_SANGYAN: MessageSquare,
  ASK_NIVESHGUARD: MessageSquare,
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DecisionReadinessPage() {
  const { t } = useTranslation();
  const [template, setTemplate] = useState(null);
  const [templateError, setTemplateError] = useState(null);

  // productName field
  const [productName, setProductName] = useState('');

  // answers: { [questionId]: 'YES' | 'NO' | 'NOT_SURE' }
  const [answers, setAnswers] = useState({});
  // notes: { [questionId]: string }
  const [notes, setNotes] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load template on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchReadinessTemplate();
        setTemplate(data);
        // Pre-fill answers as NOT_SURE
        const initial = {};
        (data.template || []).forEach((item) => { initial[item.id] = 'NOT_SURE'; });
        setAnswers(initial);
      } catch (err) {
        setTemplateError(err.message || 'Unable to load decision readiness template.');
      }
    })();
  }, []);

  // Load history (non-critical)
  useEffect(() => {
    (async () => {
      try {
        const h = await fetchReadinessHistory();
        if (Array.isArray(h)) setHistory(h);
      } catch { /* non-critical */ }
    })();
  }, []);

  const setAnswer = (itemId, value) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const setNote = (itemId, text) => {
    setNotes((prev) => ({ ...prev, [itemId]: text }));
  };

  const toggleNoteExpand = (itemId) => {
    setExpandedNotes((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const checklist = template?.template || [];
  const totalCount = checklist.length;
  const completedCount = checklist.filter((item) => answers[item.id] === 'YES').length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);
    setSubmitError(null);

    const payload = {
      productName: productName.trim() || undefined,
      checklist: checklist.map((item) => ({
        id: item.id,
        answer: answers[item.id] || 'NOT_SURE',
        notes: notes[item.id] || '',
      })),
    };

    try {
      const data = await submitReadinessSession(payload);
      setResult(data);
      // Refresh history
      fetchReadinessHistory().then((h) => { if (Array.isArray(h)) setHistory(h); }).catch(() => {});
    } catch (err) {
      setSubmitError(err.message || 'Failed to evaluate readiness. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Template loading/error
  if (templateError) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Unable to load readiness template</p>
            <p className="text-xs text-rose-700 mt-1">{templateError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm text-slate-500">Loading decision readiness checklist…</p>
      </div>
    );
  }

  // Readiness level styling
  const readinessLevelStyle = (level) => {
    if (!level) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (level.includes('Comprehensive')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (level.includes('Partially')) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  const liveReadinessLevel =
    completedCount === totalCount
      ? 'Comprehensive Understanding'
      : completedCount >= Math.floor(totalCount / 2)
      ? 'Partially Informed — Pause on Gaps'
      : 'Significant Information Gaps';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t('readiness.title')}
          subtitle={t('readiness.subtitle')}
          badge={
            <Badge variant="amber" size="sm">
              Pre-Action Information Check
            </Badge>
          }
        />
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            History ({history.length})
          </button>
        )}
      </div>

      {/* History */}
      {showHistory && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Past Readiness Checks</span>
            <button onClick={() => setShowHistory(false)} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
              Close
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((h) => (
              <div
                key={h._id}
                className="p-2 rounded-xl text-xs text-slate-700 flex items-center justify-between bg-white border border-slate-100"
              >
                <div>
                  <span className="font-medium">{h.productName}</span>
                  <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${readinessLevelStyle(h.readinessLevel)}`}>
                    {h.readinessPercentage}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                  {new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guardrail */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <Shield className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Mandatory Guardrail:</strong>{' '}
          {template.guardrailNotice || 'This checklist evaluates your self-reported information completeness only. It does not certify investment quality, suitability, or legal soundness.'}
        </div>
      </div>

      {/* Checklist Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Live progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Information Status
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {completedCount} of {totalCount} verified
            </h2>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-slate-500 block mb-1">Current Level</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${readinessLevelStyle(liveReadinessLevel)}`}>
              {liveReadinessLevel}
            </span>
          </div>
        </div>

        <ProgressBar
          value={completedCount}
          max={totalCount}
          color={completedCount === totalCount ? 'emerald' : 'amber'}
          size="md"
        />

        {/* Product name input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            What are you evaluating? (optional)
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. SBI FD, Mutual Fund Scheme, Telegram Investment Group"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-800 text-slate-800"
            maxLength={120}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Interactive Information Checklist
          </h3>

          <div className="space-y-3">
            {checklist.map((item) => {
              const answer = answers[item.id] || 'NOT_SURE';
              const noteExpanded = expandedNotes[item.id] || false;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-150 ${
                    answer === 'YES'
                      ? 'bg-teal-50/30 border-teal-200/80'
                      : answer === 'NO'
                      ? 'bg-rose-50/30 border-rose-200/60'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{item.question}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <AnswerButton
                        value="YES"
                        current={answer}
                        onClick={(v) => setAnswer(item.id, v)}
                        colorClass="bg-teal-700 text-white border-teal-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Yes
                      </AnswerButton>
                      <AnswerButton
                        value="NOT_SURE"
                        current={answer}
                        onClick={(v) => setAnswer(item.id, v)}
                        colorClass="bg-amber-100 text-amber-900 border-amber-300"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Unsure
                      </AnswerButton>
                      <AnswerButton
                        value="NO"
                        current={answer}
                        onClick={(v) => setAnswer(item.id, v)}
                        colorClass="bg-rose-100 text-rose-900 border-rose-300"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        No
                      </AnswerButton>
                    </div>
                  </div>

                  {/* Notes toggle */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => toggleNoteExpand(item.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {noteExpanded ? '− Hide note' : '+ Add note (optional)'}
                    </button>
                    {noteExpanded && (
                      <textarea
                        value={notes[item.id] || ''}
                        onChange={(e) => setNote(item.id, e.target.value)}
                        placeholder="Optional: What did you verify or find?"
                        maxLength={500}
                        rows={2}
                        className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-slate-400 resize-none"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-800">Evaluation failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/validity-check" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
            ← Check Another Claim
          </Link>
          <Button
            variant="primary"
            size="md"
            icon={isSubmitting ? Loader2 : Send}
            iconPosition="left"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Evaluating…' : 'Evaluate My Readiness'}
          </Button>
        </div>
      </div>

      {/* Results Card */}
      {result && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Score header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Readiness Result
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {result.completedCount}/{result.totalCount} verified
              </h2>
              {result.productName && (
                <p className="text-xs text-slate-500 mt-0.5">For: <strong>{result.productName}</strong></p>
              )}
            </div>
            <div className="sm:text-right">
              <div className="text-3xl font-black text-slate-900">{result.readinessPercentage}%</div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-1 ${readinessLevelStyle(result.readinessLevel)}`}>
                {result.readinessLevel}
              </span>
            </div>
          </div>

          <ProgressBar
            value={result.completedCount}
            max={result.totalCount}
            color={result.readinessPercentage === 100 ? 'emerald' : 'amber'}
            size="md"
          />

          {/* Neutral explanation */}
          {result.neutralExplanation && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Adaptive Analysis</span>
              </div>
              {result.neutralExplanation}
            </div>
          )}

          {/* Unresolved items with bridges */}
          {result.unresolvedItems?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Areas Needing Attention ({result.unresolvedItems.length})
              </h3>
              <div className="space-y-2">
                {result.unresolvedItems.map((item) => {
                  const Icon = BRIDGE_ICONS[item.actionType] || ArrowRight;
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl border border-amber-100 bg-amber-50/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{item.question}</p>
                        <span className="text-[10px] text-slate-500">{item.category}</span>
                      </div>
                      {item.actionUrl && (
                        <Link
                          to={item.actionUrl}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                        >
                          <Icon className="w-3 h-3" />
                          {item.actionLabel}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guardrail notice */}
          {result.guardrailNotice && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed">
              <strong>Mandatory Guardrail:</strong> {result.guardrailNotice}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← Start New Check
            </button>
            <Link to="/my-safety/receipts">
              <Button variant="primary" size="md" icon={FileCheck} iconPosition="left">
                View Safety Receipts
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

