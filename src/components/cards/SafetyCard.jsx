// src/components/cards/SafetyCard.jsx
import React from 'react';
import { ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function SafetyCard({
  title,
  claim,
  source,
  date,
  status,
  statusType = 'warning',
  riskSignalsCount = 0,
  link = '/validity-check/result',
  className = '',
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={status} type={statusType} />
          {date && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug mb-1.5">
          {title}
        </h3>

        {claim && (
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3 italic">
            "{claim}"
          </p>
        )}

        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mb-4">
          {source && (
            <span>
              Source: <strong className="text-slate-700 font-medium">{source}</strong>
            </span>
          )}
          {riskSignalsCount > 0 && (
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {riskSignalsCount} risk signals
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Verifiable Record</span>
        <Link
          to={link}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 group"
        >
          <span>View Analysis</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
