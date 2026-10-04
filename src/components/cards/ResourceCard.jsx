// src/components/cards/ResourceCard.jsx
import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export default function ResourceCard({
  title,
  subtitle,
  description,
  badge,
  actionText = 'Visit Official Portal',
  url = '#',
  color = 'slate',
  className = '',
}) {
  const colorStyles = {
    rose: 'border-rose-200 bg-rose-50/30 text-rose-900',
    blue: 'border-blue-200 bg-blue-50/30 text-blue-900',
    teal: 'border-teal-200 bg-teal-50/30 text-teal-900',
    slate: 'border-slate-200 bg-white text-slate-900',
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-xs flex flex-col justify-between ${colorStyles[color] || colorStyles.slate} ${className}`}>
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          {badge && (
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-900/5 border border-slate-900/10">
              {badge}
            </span>
          )}
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
        </div>

        <h3 className="text-sm font-bold text-slate-900 mb-1">
          {title}
        </h3>

        {subtitle && (
          <div className="text-xs font-mono font-semibold text-slate-700 mb-2">
            {subtitle}
          </div>
        )}

        {description && (
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200/60">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-teal-700 transition-colors"
        >
          <span>{actionText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
