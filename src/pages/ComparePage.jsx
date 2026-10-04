// src/pages/ComparePage.jsx
// Stage 7B — Adaptive Compare (Real backend-connected)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  History,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
  Search,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { fetchCompareCatalog, submitComparison, fetchComparisonHistory } from '../services/compareApi';


// ── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ sourceType }) {
  if (!sourceType) return null;
  const map = {
    STATUTORY: { label: 'Statutory', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    REGULATORY: { label: 'Regulatory', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
    OFFICIAL_PORTAL: { label: 'Official Portal', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    DOCUMENTED: { label: 'Documented', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    UNVERIFIED: { label: 'Unverified', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  };
  const m = map[sourceType] || map.DOCUMENTED;
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border ${m.cls}`}>
      {m.label}
    </span>
  );
}

// ── Uncertainty badge ─────────────────────────────────────────────────────────
function UncertaintyBadge({ uncertainty }) {
  if (!uncertainty || uncertainty === 'VERIFIED') return null;
  const map = {
    HIGH_UNCERTAINTY: 'bg-rose-50 text-rose-700',
    MODERATE_UNCERTAINTY: 'bg-amber-50 text-amber-700',
    LOW_UNCERTAINTY: 'bg-slate-100 text-slate-500',
  };
  const label = uncertainty.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${map[uncertainty] || 'bg-slate-100 text-slate-500'}`}>
      ⚠ {label}
    </span>
  );
}

// ── Bridge action links ───────────────────────────────────────────────────────
const BRIDGE_ICONS = {
  VALIDITY_CHECK: Search,
  DECISION_READINESS: FileCheck,
  ASK_SANGYAN: MessageSquare,
  ASK_NIVESHGUARD: MessageSquare,
  LEARN: BookOpen,
};

function BridgeCard({ bridge }) {
  const Icon = BRIDGE_ICONS[bridge.type] || ArrowRight;
  return (
    <Link
      to={bridge.url}
      className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all group"
    >
      <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
        <Icon className="w-3.5 h-3.5 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">{bridge.label}</p>
        {bridge.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{bridge.description}</p>
        )}
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 group-hover:text-slate-600 transition-colors" />
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);

  const [selectedProductA, setSelectedProductA] = useState('');
  const [selectedProductB, setSelectedProductB] = useState('');
  const [activeCriteria, setActiveCriteria] = useState([]);

  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [compareError, setCompareError] = useState(null);

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Load catalog on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCompareCatalog();
        setCatalog(data);
        if (data?.products?.length >= 2) {
          setSelectedProductA(data.products[0].id);
          setSelectedProductB(data.products[1].id);
        }
        if (data?.criteria?.length) {
          setActiveCriteria(data.criteria.map((c) => c.key));
        }
      } catch (err) {
        setCatalogError(err.message || 'Unable to load comparison catalog.');
      }
    })();
  }, []);

  // Load history on mount (non-critical)
  useEffect(() => {
    (async () => {
      try {
        const h = await fetchComparisonHistory();
        if (Array.isArray(h)) setHistory(h);
      } catch { /* non-critical */ }
    })();
  }, []);

  const toggleCriteria = (key) => {
    if (activeCriteria.includes(key)) {
      if (activeCriteria.length > 2) {
        setActiveCriteria(activeCriteria.filter((k) => k !== key));
      }
    } else {
      setActiveCriteria([...activeCriteria, key]);
    }
  };

  const handleCompare = async () => {
    if (!selectedProductA || !selectedProductB) return;
    setIsComparing(true);
    setComparisonResult(null);
    setCompareError(null);
    try {
      const result = await submitComparison({
        productAId: selectedProductA,
        productBId: selectedProductB,
        criteria: activeCriteria,
      });
      setComparisonResult(result);
      // Refresh history non-critically
      fetchComparisonHistory().then((h) => { if (Array.isArray(h)) setHistory(h); }).catch(() => {});
    } catch (err) {
      setCompareError(err.message || 'Failed to perform comparison. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  // Catalog error state
  if (catalogError) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Unable to load comparison catalog</p>
            <p className="text-xs text-rose-700 mt-1">{catalogError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading catalog state
  if (!catalog) {
    return (
      <div className="max-w-5xl mx-auto py-20 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm text-slate-500">Loading comparison catalog…</p>
      </div>
    );
  }

  const products = catalog.products || [];
  const criteria = catalog.criteria || [];
  const productA = products.find((p) => p.id === selectedProductA);
  const productB = products.find((p) => p.id === selectedProductB);

  const displayedMatrix = comparisonResult?.comparisonMatrix?.filter(
    (row) => activeCriteria.includes(row.criterionKey)
  ) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t('compare.title')}
          subtitle={t('compare.subtitle')}
          badge={
            <Badge variant="neutral" size="sm">
              Adaptive Factual Comparison
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

      {/* History dropdown */}
      {showHistory && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Recent Comparisons</span>
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
                <span className="font-medium">{h.productAName} vs {h.productBName}</span>
                <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                  {new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guardrail Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <Scale className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Neutral Fact Mandate:</strong> We do not label any product "Best", "Winner",
          or "Recommended". Every financial instrument has distinct trade-offs between risk, liquidity, and regulatory backing.
        </div>
      </div>

      {/* Selector + Criteria */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Select Two Items to Compare
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector A */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Item A:</label>
            <select
              value={selectedProductA}
              onChange={(e) => setSelectedProductA(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:border-slate-800"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === selectedProductB}>
                  {p.name} ({p.regulatedBy})
                </option>
              ))}
            </select>
            {productA && (
              <p className="mt-1 text-[11px] text-slate-500">
                Category: <strong>{productA.category}</strong>
                {productA.isRegulated
                  ? <span className="ml-2 text-emerald-700 font-semibold">✓ Regulated</span>
                  : <span className="ml-2 text-rose-600 font-semibold">✗ Unregulated</span>}
              </p>
            )}
          </div>

          {/* Selector B */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Item B:</label>
            <select
              value={selectedProductB}
              onChange={(e) => setSelectedProductB(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:border-slate-800"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === selectedProductA}>
                  {p.name} ({p.regulatedBy})
                </option>
              ))}
            </select>
            {productB && (
              <p className="mt-1 text-[11px] text-slate-500">
                Category: <strong>{productB.category}</strong>
                {productB.isRegulated
                  ? <span className="ml-2 text-emerald-700 font-semibold">✓ Regulated</span>
                  : <span className="ml-2 text-rose-600 font-semibold">✗ Unregulated</span>}
              </p>
            )}
          </div>
        </div>

        {/* Criteria Filters */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2">
            Filter Comparison Criteria (min. 2):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {criteria.map((c) => {
              const isChecked = activeCriteria.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleCriteria(c.key)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compare Button */}
        <div className="pt-2 flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={isComparing ? Loader2 : Scale}
            iconPosition="left"
            disabled={isComparing || !selectedProductA || !selectedProductB || selectedProductA === selectedProductB}
            onClick={handleCompare}
          >
            {isComparing ? 'Comparing…' : 'Compare Now'}
          </Button>
          {selectedProductA === selectedProductB && (
            <p className="text-xs text-rose-600">Please select two different products.</p>
          )}
        </div>
      </div>

      {/* Compare Error */}
      {compareError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-rose-800">Comparison failed</p>
            <p className="text-xs text-rose-700 mt-0.5">{compareError}</p>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* Result header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {comparisonResult.productA?.name} vs {comparisonResult.productB?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Adaptation depth:{' '}
                <strong className="text-slate-700 capitalize">
                  {comparisonResult.adaptationMetadata?.depth || 'standard'}
                </strong>
                {' '}· Tailored to your Understanding Profile
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompare}
              disabled={isComparing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isComparing ? 'animate-spin' : ''}`} />
              Re-run
            </button>
          </div>

          {/* Guardrail notice */}
          {comparisonResult.guardrailNotice && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-xs text-blue-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{comparisonResult.guardrailNotice}</span>
            </div>
          )}

          {/* Neutral Explanation (collapsible) */}
          {comparisonResult.neutralExplanation && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Adapted Factual Overview
                </span>
                {showExplanation
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showExplanation && (
                <div className="px-5 pb-5 text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100">
                  {comparisonResult.neutralExplanation}
                </div>
              )}
            </div>
          )}

          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-700 w-1/4">Criteria</th>
                  <th className="p-4 font-bold text-slate-900 border-l border-slate-200 w-[37.5%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{comparisonResult.productA?.name}</span>
                      {comparisonResult.productA?.isRegulated ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Regulated</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Unregulated</span>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">{comparisonResult.productA?.regulatedBy}</div>
                  </th>
                  <th className="p-4 font-bold text-slate-900 border-l border-slate-200 w-[37.5%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{comparisonResult.productB?.name}</span>
                      {comparisonResult.productB?.isRegulated ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Regulated</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Unregulated</span>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">{comparisonResult.productB?.regulatedBy}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedMatrix.map((row) => (
                  <tr key={row.criterionKey} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-600 align-top bg-slate-50/30 text-xs">
                      {row.criterionLabel}
                    </td>
                    <td className="p-4 text-slate-700 align-top border-l border-slate-100 leading-relaxed">
                      <div className="text-xs sm:text-sm">{row.itemA?.value || '—'}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <SourceBadge sourceType={row.itemA?.sourceType} />
                        <UncertaintyBadge uncertainty={row.itemA?.uncertainty} />
                      </div>
                      {row.itemA?.source && (
                        <div className="mt-1 text-[10px] text-slate-400">Source: {row.itemA.source}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 align-top border-l border-slate-100 leading-relaxed">
                      <div className="text-xs sm:text-sm">{row.itemB?.value || '—'}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <SourceBadge sourceType={row.itemB?.sourceType} />
                        <UncertaintyBadge uncertainty={row.itemB?.uncertainty} />
                      </div>
                      {row.itemB?.source && (
                        <div className="mt-1 text-[10px] text-slate-400">Source: {row.itemB.source}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Suggested Next Steps */}
          {comparisonResult.suggestedBridges?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recommended Next Steps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {comparisonResult.suggestedBridges.map((bridge, idx) => (
                  <BridgeCard key={idx} bridge={bridge} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!comparisonResult && !isComparing && !compareError && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-10 text-center">
          <Scale className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Select two products above and click Compare Now.</p>
          <p className="text-xs text-slate-400 mt-1">
            Factual side-by-side data from our authoritative regulatory catalog.
          </p>
        </div>
      )}
    </div>
  );
}
