// src/components/cards/EvidenceCard.jsx
import React from 'react';
import { FileText, Image, Link2, MessageSquare, Shield, Calendar, Download } from 'lucide-react';
import Badge from '../common/Badge';

export default function EvidenceCard({
  name,
  category,
  size,
  uploadedDate,
  relatedIncident,
  relatedAnalysis,
  description,
  tag,
  onView,
  className = '',
}) {
  const getIcon = () => {
    switch (category?.toLowerCase()) {
      case 'screenshots':
        return Image;
      case 'messages':
        return MessageSquare;
      case 'links':
        return Link2;
      default:
        return FileText;
    }
  };

  const Icon = getIcon();

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 truncate max-w-[200px]" title={name}>
                {name}
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">{size}</span>
            </div>
          </div>
          {tag && (
            <Badge variant="neutral" size="xs">
              {tag}
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 mb-4 text-[11px] text-slate-500">
          {relatedIncident && (
            <div className="truncate">
              <strong>Incident:</strong> {relatedIncident}
            </div>
          )}
          {relatedAnalysis && (
            <div className="truncate">
              <strong>Receipt:</strong> {relatedAnalysis}
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-400 pt-0.5">
            <Calendar className="w-3 h-3" />
            <span>Preserved on {uploadedDate}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
          <Shield className="w-3 h-3" /> Tamper-Sealed
        </span>
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Proof</span>
        </button>
      </div>
    </div>
  );
}
