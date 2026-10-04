// src/components/cards/SafetyReceiptCard.jsx
import React from 'react';
import { ShieldCheck, Calendar, ArrowRight, Eye, AlertTriangle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SafetyReceiptCard({
  receiptNumber,
  date,
  situation,
  claim,
  verificationStatus,
  statusType = 'warning',
  riskSignalsCount = 0,
  sourcesChecked = 0,
  uncertaintyNote,
  nextSteps,
  onViewReceipt,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between ${className}`}>
      <div>
        {/* Receipt Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-slate-800">
                Safety Receipt #{receiptNumber}
              </span>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                {date}
              </div>
            </div>
          </div>
          <StatusBadge status={verificationStatus} type={statusType} />
        </div>

        {/* Structured Fields */}
        <div className="space-y-3 mb-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block mb-0.5">
              Situation:
            </span>
            <p className="text-slate-800 font-medium">
              {situation}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block mb-0.5">
              Claim Assessed:
            </span>
            <p className="text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2 italic">
              "{claim}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 py-1">
            <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-2">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Risk Signals</span>
              <span className="text-sm font-bold text-amber-900 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {riskSignalsCount} detected
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Sources Checked</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                {sourcesChecked} official lists
              </span>
            </div>
          </div>

          {uncertaintyNote && (
            <div>
              <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block mb-0.5">
                Uncertainty Boundary:
              </span>
              <p className="text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                {uncertaintyNote}
              </p>
            </div>
          )}

          {nextSteps && (
            <div>
              <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block mb-0.5">
                Recommended Next Step:
              </span>
              <p className="text-teal-900 font-medium bg-teal-50/50 p-2 rounded-lg border border-teal-100 text-[11px]">
                {nextSteps}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">Cryptographically Signed ID</span>
        <button
          type="button"
          onClick={onViewReceipt}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Full Receipt</span>
        </button>
      </div>
    </div>
  );
}
