// src/components/cards/LearningCard.jsx
import React from 'react';
import { Clock, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';

export default function LearningCard({
  id,
  title,
  category,
  readTime,
  difficulty,
  progress = 0,
  whyRecommended,
  summary,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="teal" size="xs">
            {category}
          </Badge>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            {difficulty && (
              <span className="font-medium text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                {difficulty}
              </span>
            )}
            {readTime && (
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {readTime}
              </span>
            )}
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug mb-2">
          {title}
        </h3>

        {summary && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {summary}
          </p>
        )}

        {whyRecommended && (
          <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-2.5 mb-4 text-[11px] text-teal-900 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
            <span>
              <strong>Why recommended:</strong> {whyRecommended}
            </span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100">
        <div className="mb-3">
          <ProgressBar value={progress} max={100} showLabel label="Module Progress" size="sm" color="teal" />
        </div>
        <div className="flex items-center justify-end">
          <Link
            to={`/learn/topic/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-teal-700 group transition-colors"
          >
            <span>{progress > 0 ? 'Continue Topic' : 'Start Topic'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
