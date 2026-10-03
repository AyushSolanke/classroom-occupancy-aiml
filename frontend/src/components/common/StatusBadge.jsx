import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const normStatus = (status || 'EMPTY').toUpperCase();

  let config = {
    label: 'Empty',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400'
  };

  if (normStatus === 'LOW OCCUPANCY' || normStatus === 'LOW') {
    config = {
      label: 'Low Occupancy',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    };
  } else if (normStatus === 'MODERATE OCCUPANCY' || normStatus === 'MODERATE') {
    config = {
      label: 'Moderate',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    };
  } else if (normStatus === 'FULL' || normStatus === 'FULL OCCUPANCY') {
    config = {
      label: 'Full',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-500'
    };
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'lg' 
      ? 'px-3.5 py-1.5 text-sm font-semibold' 
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
}
