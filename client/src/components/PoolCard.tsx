import React from 'react';
import { Link } from 'react-router-dom';
import { Pool } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { Car, Home, Layers, Calendar, ArrowUpRight } from 'lucide-react';

interface Props {
  pool: Pool;
  onQuickInvest?: (pool: Pool) => void;
}

export const PoolCard: React.FC<Props> = ({ pool, onQuickInvest }) => {
  const getAssetIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'vehicle':
        return <Car className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
      case 'property':
        return <Home className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
      default:
        return <Layers className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const progress = Math.min(100, Math.round((pool.total_pool_value / pool.target_amount) * 100));

  return (
    <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-5 flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-700 transition-all">
      <div>
        {/* Top meta & badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
            {getAssetIcon(pool.asset?.type)}
            <span className="capitalize">{pool.asset?.type || 'Real Asset'}</span>
            <span>•</span>
            <span className="truncate max-w-[140px]">{pool.company?.name || 'Verified Company'}</span>
          </div>
          <StatusBadge status={pool.status} size="sm" />
        </div>

        {/* Title & description */}
        <Link to={`/pools/${pool.id}`} className="group block">
          <h3 className="font-semibold text-neutralDark dark:text-gray-100 text-base mb-1.5 group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
            <span>{pool.title}</span>
            <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
          </h3>
        </Link>
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed">
          {pool.description}
        </p>

        {/* Funding Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className="text-gray-500 dark:text-gray-400">Raised so far</span>
            <span className="font-semibold text-neutralDark dark:text-gray-200 tabular-numbers">
              ₹{pool.total_pool_value.toLocaleString()} / ₹{pool.target_amount.toLocaleString()} ({progress}%)
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary dark:bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Financial metrics */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-subtleBorder dark:border-gray-800 text-center mb-4 bg-slate-50/60 dark:bg-gray-800/40 rounded">
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Annual Return</div>
            <div className="text-sm font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
              {pool.interest_rate_percent}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Duration</div>
            <div className="text-sm font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
              {pool.duration_days}d
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Share Price</div>
            <div className="text-sm font-bold text-primary dark:text-emerald-400 tabular-numbers">
              ₹{pool.current_share_price?.toFixed(2) || '1.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          to={`/pools/${pool.id}`}
          className="flex-1 text-center py-2 px-3 text-xs font-medium border border-subtleBorder dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          View Details
        </Link>
        {pool.status === 'funding' && onQuickInvest && (
          <button
            onClick={() => onQuickInvest(pool)}
            className="flex-1 py-2 px-3 text-xs font-semibold bg-primary dark:bg-emerald-600 text-white hover:bg-primary-600 dark:hover:bg-emerald-500 rounded-md transition"
          >
            Invest
          </button>
        )}
      </div>
    </div>
  );
};
