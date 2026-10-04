// src/components/common/RiskIndicator.jsx
import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function RiskIndicator({
  level = 'moderate', // low | moderate | high | critical
  score,
  label,
  className = '',
}) {
  const configs = {
    low: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      barColor: 'bg-emerald-500',
      icon: ShieldCheck,
      defaultLabel: 'Low Risk Signals',
    },
    moderate: {
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      barColor: 'bg-amber-500',
      icon: AlertCircle,
      defaultLabel: 'Moderate Risk Signals',
    },
    high: {
      color: 'text-orange-800 bg-orange-50 border-orange-200',
      barColor: 'bg-orange-500',
      icon: AlertTriangle,
      defaultLabel: 'High-Risk Signals Detected',
    },
    critical: {
      color: 'text-rose-800 bg-rose-50 border-rose-200',
      barColor: 'bg-rose-600',
      icon: ShieldAlert,
      defaultLabel: 'Critical Risk Signals Detected',
    },
  };

  const current = configs[level] || configs.moderate;
  const Icon = current.icon;

  return (
    <div className={`rounded-xl border p-4 ${current.color} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{label || current.defaultLabel}</span>
        </div>
        {typeof score === 'number' && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/70">
            Signal Score: {score}/100
          </span>
        )}
      </div>
      {typeof score === 'number' && (
        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${current.barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      )}
    </div>
  );
}
