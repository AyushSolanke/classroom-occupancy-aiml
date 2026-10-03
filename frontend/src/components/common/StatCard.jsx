import React from 'react';

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'neutral', // 'positive', 'warning', 'negative', 'neutral'
  loading = false,
  error = null,
  onClick
}) {
  const badgeColors = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-campus-400 hover:shadow-card' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-campus-50 text-campus-700 flex items-center justify-center border border-campus-100/80">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            {title}
          </span>
        </div>
        {badgeText && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeColors[badgeType]}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded my-1" />
        ) : error ? (
          <span className="text-xs text-rose-600 font-medium">{error}</span>
        ) : (
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        )}

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
