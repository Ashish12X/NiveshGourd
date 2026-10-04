// src/components/common/Badge.jsx
import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  icon: Icon,
}) {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-slate-900 text-white border-slate-900',
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const sizeStyles = {
    xs: 'text-[11px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size] || sizeStyles.sm} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
