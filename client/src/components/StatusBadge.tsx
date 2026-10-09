import React from 'react';

interface StatusBadgeProps {
  status: 'funding' | 'active' | 'repaying' | 'completed' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      case 'funding':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
      case 'active':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      case 'repaying':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60';
      case 'completed':
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
      case 'sold':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getLabel = () => {
    switch (status.toLowerCase()) {
      case 'funding':
        return 'Funding Open';
      case 'active':
        return 'Active / Borrowed';
      case 'repaying':
        return 'Earning & Repaying';
      case 'completed':
        return 'Term Completed';
      case 'sold':
        return 'Asset Sold';
      default:
        return status;
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase font-semibold ${sizeClass} ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {getLabel()}
    </span>
  );
};
