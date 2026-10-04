// src/components/common/StatusBadge.jsx
import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

export default function StatusBadge({
  status,
  type = 'warning', // warning | alert | verified | info | neutral
  className = '',
}) {
  const configs = {
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertCircle,
      text: status || 'Needs verification',
    },
    alert: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: AlertTriangle,
      text: status || 'High risk signals',
    },
    verified: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      text: status || 'Consistent with standard facts',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      text: status || 'Informational',
    },
    neutral: {
      bg: 'bg-slate-100 border-slate-200 text-slate-700',
      icon: HelpCircle,
      text: status || 'Unreviewed',
    }
  };

  const config = configs[type] || configs.warning;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{config.text}</span>
    </span>
  );
}
