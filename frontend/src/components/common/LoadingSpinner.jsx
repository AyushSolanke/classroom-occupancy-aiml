import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className={`${iconSizes[size]} animate-spin text-campus-600 mb-2`} />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
}
