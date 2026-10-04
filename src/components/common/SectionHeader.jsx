// src/components/common/SectionHeader.jsx
import React from 'react';

export default function SectionHeader({
  title,
  description,
  badge,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 pb-1 ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {badge && <span>{badge}</span>}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 text-sm">
          {action}
        </div>
      )}
    </div>
  );
}
