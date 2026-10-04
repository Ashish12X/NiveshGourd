// src/pages/SafetyReceiptsPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SafetyReceiptCard from '../components/cards/SafetyReceiptCard';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { fetchSafetyReceipts } from '../services/safetyApi';

export default function SafetyReceiptsPage() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSafetyReceipts();
      setReceipts(res.receipts || []);
    } catch (err) {
      console.warn('Failed to load receipts:', err.message);
      setError(err.message || 'Unable to retrieve safety receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title={t('receipts.title')}
        subtitle={t('receipts.subtitle')}
        backUrl="/my-safety"
        backLabel="Back to My Safety Hub"
        badge={
          <Badge variant="amber" size="sm">
            {receipts.length} Generated Receipts
          </Badge>
        }
        actions={
          <button
            type="button"
            onClick={loadReceipts}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh receipts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your safety receipts...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadReceipts}>
            Retry
          </Button>
        </div>
      ) : receipts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {receipts.map((receipt) => {
            const formattedDate = receipt.createdAt
              ? new Date(receipt.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            const nextStepsText = Array.isArray(receipt.nextSteps)
              ? receipt.nextSteps.join(' • ')
              : receipt.nextSteps || 'Verify regulatory credentials before proceeding.';

            return (
              <SafetyReceiptCard
                key={receipt._id || receipt.id}
                receiptNumber={receipt.receiptNumber}
                date={formattedDate}
                situation={receipt.situation}
                claim={receipt.claim}
                verificationStatus={receipt.verificationStatus}
                statusType={receipt.statusType || 'warning'}
                riskSignalsCount={receipt.riskSignalsCount || 0}
                sourcesChecked={receipt.sourcesChecked || 0}
                uncertaintyNote={receipt.uncertaintyNote}
                nextSteps={nextStepsText}
                onViewReceipt={() => setSelectedReceipt(receipt)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Safety Receipts yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Safety receipts are generated when you verify suspicious investment claims or document incidents.
          </p>
          <Button variant="primary" size="md" href="/validity-check">
            Check an Investment Claim
          </Button>
        </div>
      )}

      {/* View Full Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Safety Receipt #${selectedReceipt.receiptNumber}`}
          subtitle={`Issued on ${
            selectedReceipt.createdAt
              ? new Date(selectedReceipt.createdAt).toLocaleString()
              : 'Recent'
          } • Verifiable Audit Record`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Status Assessment:</span>
              <StatusBadge
                status={selectedReceipt.verificationStatus}
                type={selectedReceipt.statusType || 'warning'}
              />
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Situation Evaluated:
                </span>
                <p className="font-semibold text-slate-800">{selectedReceipt.situation}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Promised Claim:
                </span>
                <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  "{selectedReceipt.claim}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Risk Signals</span>
                <span className="text-base font-bold text-amber-950 mt-1 block">
                  {selectedReceipt.riskSignalsCount} Signals Detected
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Regulatory Sources</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {selectedReceipt.sourcesChecked} Checked Sources
                </span>
              </div>
            </div>

            {selectedReceipt.uncertaintyNote && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Forensic Uncertainty Boundary:
                </span>
                <p className="text-slate-600 bg-slate-100/70 p-3 rounded-xl border border-slate-200 text-xs leading-relaxed">
                  {selectedReceipt.uncertaintyNote}
                </p>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Recommended Safe Next Steps:
              </span>
              <div className="text-teal-950 font-medium bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs leading-relaxed space-y-1">
                {Array.isArray(selectedReceipt.nextSteps) ? (
                  selectedReceipt.nextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-teal-700 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))
                ) : (
                  <p>{selectedReceipt.nextSteps}</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
              {selectedReceipt.disclaimer ||
                'This receipt records what was checked and known at this timestamp. It is NOT financial advice, an endorsement, or a certificate of safety.'}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
                Close Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
