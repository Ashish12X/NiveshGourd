// src/components/common/ProgressBar.jsx
import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'teal', // teal | blue | amber | emerald
  showLabel = false,
  label = '',
  size = 'md',
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorStyles = {
    teal: 'bg-teal-600',
    blue: 'bg-blue-600',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-600',
    slate: 'bg-slate-700',
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-medium">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeStyles[size] || sizeStyles.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorStyles[color] || colorStyles.teal}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin="0"
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
