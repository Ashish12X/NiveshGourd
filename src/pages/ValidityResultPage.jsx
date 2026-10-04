// src/pages/ValidityResultPage.jsx
/**
 * ValidityResultPage — Stage 5 Real Verification Results
 *
 * Displays the complete forensic verification outcome for a submitted claim:
 *   - Overall verification status & uncertainty boundary
 *   - Per-claim breakdown with deterministic classification & extracted entities
 *   - Evidence checked (with explicit verificationMode and sourceType)
 *   - Deterministic risk signals detected
 *   - Stage 4 adaptive explanations tailored to user's UnderstandingProfile
 *   - Safe, non-prescriptive next steps
 *   - Transparent disclaimers (e.g. "Not verified != Scam", "Live check unavailable")
 *
 * Persisted in MongoDB via VerificationAnalysis.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  CheckSquare,
  Shield,
  Search,
  ExternalLink,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Clock,
  Layers,
  Sparkles,
  ShieldAlert,
  Database
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import RiskIndicator from '../components/common/RiskIndicator';
import Button from '../components/common/Button';
import { useTranslation } from 'react-i18next';
import { getVerificationById, analyzeInput, deleteVerification } from '../services/verificationApi';
import { createSafetyReceipt, createEvidenceItem } from '../services/safetyApi';

// Helper to map backend verification status to StatusBadge type and user-friendly label
function getStatusBadgeConfig(status) {
  switch (status) {
    case 'VERIFIED':
      return {
        type: 'verified',
        label: 'Verified Official Record',
        cardBorder: 'border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      };
    case 'CONTRADICTED':
      return {
        type: 'alert',
        label: 'Contradicted by Official Record',
        cardBorder: 'border-rose-200',
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200'
      };
    case 'NOT_VERIFIED':
      return {
        type: 'warning',
        label: 'Not Verified (Does Not Mean False)',
        cardBorder: 'border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    case 'INSUFFICIENT_EVIDENCE':
      return {
        type: 'warning',
        label: 'Insufficient Evidence',
        cardBorder: 'border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    case 'MANUAL_CHECK_REQUIRED':
      return {
        type: 'info',
        label: 'Manual Verification Required',
        cardBorder: 'border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
      };
    case 'LIVE_CHECK_UNAVAILABLE':
      return {
        type: 'neutral',
        label: 'Live Check Unavailable',
        cardBorder: 'border-slate-200',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
      };
    case 'MIXED':
      return {
        type: 'warning',
        label: 'Mixed Verification Signals',
        cardBorder: 'border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    default:
      return {
        type: 'neutral',
        label: status || 'Under Review',
        cardBorder: 'border-slate-200',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
      };
  }
}

// Compute aggregate risk indicator level and score based on signals
function computeRiskLevel(riskSignals = [], overallStatus = 'NOT_VERIFIED') {
  if (riskSignals.some((s) => s.severity === 'critical') || overallStatus === 'CONTRADICTED') {
    return { level: 'critical', score: 85, label: 'Critical Risk Signals Flagged' };
  }
  if (riskSignals.some((s) => s.severity === 'high')) {
    return { level: 'high', score: 68, label: 'High-Attention Signals Detected' };
  }
  if (riskSignals.length > 0 || overallStatus === 'NOT_VERIFIED') {
    return { level: 'moderate', score: 45, label: 'Caution: Unverified Elements Present' };
  }
  return { level: 'low', score: 15, label: 'Low Risk Observable Signals' };
}

export default function ValidityResultPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const stateQuery = location.state?.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedReceipt, setSavedReceipt] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Per-claim expandable states
  const [expandedClaims, setExpandedClaims] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);

        let analysis;
        if (id) {
          analysis = await getVerificationById(id);
        } else if (stateQuery) {
          const isUrl = /^https?:\/\//i.test(stateQuery) || /^www\./i.test(stateQuery);
          analysis = await analyzeInput({
            inputType: isUrl ? 'URL' : 'TEXT',
            text: isUrl ? undefined : stateQuery,
            url: isUrl ? stateQuery : undefined,
          });
          if (isMounted && analysis?._id) {
            navigate(`/validity-check/result?id=${analysis._id}`, { replace: true });
          }
        } else {
          setError('No verification analysis ID or text query provided.');
          setLoading(false);
          return;
        }

        if (isMounted && analysis) {
          setData(analysis);
          // Default all claims to open if 3 or fewer
          if (analysis.claims && analysis.claims.length <= 3) {
            const initialExpanded = {};
            analysis.claims.forEach((_, idx) => {
              initialExpanded[idx] = true;
            });
            setExpandedClaims(initialExpanded);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load verification analysis.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, [id, stateQuery, navigate]);

  const toggleClaim = (idx) => {
    setExpandedClaims((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSaveToMySafety = async () => {
    try {
      setSavedReceipt(true);
      await Promise.all([
        createSafetyReceipt({
          analysisId: id,
          situationNote: `Validity check verified on ${new Date().toLocaleDateString('en-IN')}`,
        }),
        createEvidenceItem({
          name: `Analysis_${data?.overallStatus || 'RECORD'}_${new Date().toISOString().slice(0, 10)}.json`,
          category: 'Documents',
          description: `Verification report for input: "${(data?.inputText || '').slice(0, 150)}"`,
          source: 'NiveshGuard Validity Check Engine',
          relatedAnalysisId: id,
        }),
      ]);
      setTimeout(() => {
        navigate('/my-safety/receipts');
      }, 1000);
    } catch (err) {
      console.warn('Saving receipt/evidence error:', err.message);
      // Fallback navigate to my-safety anyway
      navigate('/my-safety');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this verification record?')) return;
    try {
      setIsDeleting(true);
      await deleteVerification(id);
      navigate('/validity-check');
    } catch (err) {
      alert(err.message || 'Failed to delete verification record.');
      setIsDeleting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <h2 className="text-base font-semibold text-slate-800">
          Loading verification analysis...
        </h2>
        <p className="text-xs text-slate-500">
          Retrieving verified evidence and adaptive insights.
        </p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200/90 text-rose-900 space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <h2 className="text-base font-bold">Analysis Not Found</h2>
          </div>
          <p className="text-sm leading-relaxed text-rose-800">
            {error || 'The requested verification analysis could not be located or you do not have permission to view it.'}
          </p>
          <div className="pt-2">
            <Link to="/validity-check">
              <Button variant="secondary" size="sm">
                Run New Validity Check
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badgeConfig = getStatusBadgeConfig(data.overallStatus);
  const riskInfo = computeRiskLevel(data.topRiskSignals || [], data.overallStatus);
  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recently';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title={t('validity.title')}
        subtitle={t('validity.subtitle')}
        backUrl="/validity-check"
        backLabel={t('validity.title')}
        badge={
          <StatusBadge
            status={badgeConfig.label}
            type={badgeConfig.type}
          />
        }
      />

      {/* Main Analysis Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Top Risk Indicator Banner */}
        <RiskIndicator
          level={riskInfo.level}
          score={riskInfo.score}
          label={riskInfo.label}
        />

        {/* Input Details & Mode Card */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Input Analyzed ({data.inputType})
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formattedDate}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">
                MODE: {data.verificationMode}
              </span>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-800 italic bg-white p-3.5 rounded-xl border border-slate-200/60">
            "{data.extractedText}"
          </p>

          {data.ocrMode === 'UNAVAILABLE' && (
            <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Image Notice:</strong> Live OCR was not configured in this environment. Text provided was analyzed.
              </span>
            </div>
          )}

          {data.verificationMode === 'LOCAL_TEST' && (
            <div className="text-xs text-indigo-900 bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Local Test Mode:</strong> Authoritative regulatory records were checked against deterministic test fixtures. Live external APIs were not hit.
              </span>
            </div>
          )}
        </div>

        {/* Adaptive Explanation Card (Stage 4 Integration) */}
        <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200/70 space-y-3">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>SANGYAN Adaptive Analysis</span>
            {data.adaptation?.depth && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono">
                {data.adaptation.depth} explanation
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {data.overallExplanation}
          </p>
        </div>

        {/* Observable Risk Signals Grid */}
        {data.topRiskSignals && data.topRiskSignals.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Observable Risk Signals ({data.topRiskSignals.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.topRiskSignals.map((signal, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        signal.severity === 'critical'
                          ? 'bg-rose-600'
                          : signal.severity === 'high'
                          ? 'bg-orange-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-slate-900">
                      {signal.signalType.replace(/_/g, ' ')}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Claims Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Extracted Claims Breakdown ({data.claims?.length || 0})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Each claim is verified independently
            </span>
          </div>

          <div className="space-y-3">
            {data.claims?.map((claimItem, idx) => {
              const claimBadge = getStatusBadgeConfig(claimItem.status);
              const isOpen = expandedClaims[idx] !== false; // Default true

              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs"
                >
                  {/* Claim Header / Accordion Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleClaim(idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Claim #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {claimItem.claimType}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${claimBadge.badgeBg}`}
                        >
                          {claimBadge.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        "{claimItem.claimText}"
                      </p>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Claim Details (Expanded) */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 text-xs text-slate-600 space-y-4 border-t border-slate-100 bg-slate-50/40">
                      
                      {/* Extracted Entities */}
                      {(claimItem.entities?.regulators?.length > 0 ||
                        claimItem.entities?.organizations?.length > 0 ||
                        claimItem.entities?.amounts?.length > 0 ||
                        claimItem.entities?.percentages?.length > 0) && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Identified Entities:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {claimItem.entities.regulators?.map((r, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-medium">
                                Regulator: {r}
                              </span>
                            ))}
                            {claimItem.entities.organizations?.map((o, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                                Entity: {o}
                              </span>
                            ))}
                            {claimItem.entities.percentages?.map((p, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                                Yield Claim: {p}
                              </span>
                            ))}
                            {claimItem.entities.amounts?.map((a, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-medium">
                                Amount: {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation & Reason */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                        <strong className="text-slate-900 block font-semibold text-xs">
                          Why this status was assigned:
                        </strong>
                        <p className="leading-relaxed text-slate-700">
                          {claimItem.explanation}
                        </p>
                      </div>

                      {/* Evidence Consulted */}
                      {claimItem.evidence && claimItem.evidence.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                            Evidence & Regulatory Records Consulted:
                          </span>
                          <div className="space-y-2">
                            {claimItem.evidence.map((ev, evIdx) => (
                              <div
                                key={evIdx}
                                className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <strong className="text-slate-900 font-semibold">
                                    {ev.sourceName}
                                  </strong>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                    {ev.sourceType}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                  {ev.sourceDescription}
                                </p>
                                {ev.relevance && (
                                  <p className="text-[11px] text-teal-800 font-medium">
                                    Relevance: {ev.relevance}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safe Next Step for this claim */}
                      {claimItem.nextStep && (
                        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200/80 flex items-start gap-2.5">
                          <CheckSquare className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                          <div className="text-xs text-teal-950">
                            <strong className="block font-semibold">Safe Next Step:</strong>
                            <p className="leading-relaxed">{claimItem.nextStep}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transparent Uncertainty Statement (Mandatory Guardrail) */}
        <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Uncertainty & Safety Boundary</span>
          </div>
          <p className="leading-relaxed">
            NiveshGuard evaluates observable regulatory, structural, and linguistic signals. 
            A status of <strong>NOT_VERIFIED</strong> does not prove fraud, but indicates that independent proof is absent. 
            Conversely, absence of a risk signal does not guarantee financial safety. 
            Never transfer money, share OTPs, or authorize transactions based solely on preliminary communications.
          </p>
        </div>

        {/* Global Safe Next Step Banner */}
        {data.safeNextStep && (
          <div className="p-5 rounded-2xl bg-teal-800 text-white space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-teal-200">
              <Shield className="w-4 h-4" />
              <span>Recommended Safe Action</span>
            </div>
            <p className="text-xs sm:text-sm text-teal-50 leading-relaxed">
              {data.safeNextStep}
            </p>
          </div>
        )}

        {/* Stage 5 -> Stage 6 Contextual Learning Bridge */}
        {data.topRiskSignals && data.topRiskSignals.length > 0 && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-slate-50 to-white border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Learn More About This Risk Pattern</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700">
                Want to learn why claims involving <strong>{data.topRiskSignals[0].signalType.replace(/_/g, ' ')}</strong> are strictly regulated under Indian financial law?
              </p>
            </div>
            <Link
              to={`/learn?signal=${encodeURIComponent(data.topRiskSignals[0].signalType)}`}
              className="shrink-0"
            >
              <Button variant="teal" size="sm" icon={ArrowRight} iconPosition="right">
                Explore Module
              </Button>
            </Link>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveToMySafety}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              {savedReceipt ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Saved to My Safety!</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-slate-600" />
                  <span>Save to My Safety</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              title="Delete this record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link to="/validity-check" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" className="w-full">
                Check Another Claim
              </Button>
            </Link>

            <Link to="/decision-readiness" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={CheckSquare}
                iconPosition="left"
              >
                Before I Act
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
