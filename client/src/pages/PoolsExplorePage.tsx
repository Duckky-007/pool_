import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Pool } from '../types.js';
import { PoolCard } from '../components/PoolCard.js';

export const PoolsExplorePage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [filter, setFilter] = useState<'all' | 'funding' | 'repaying' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPools()
      .then((res) => setPools(res.pools))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPools = pools.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'funding') return p.status === 'funding';
    if (filter === 'repaying') return p.status === 'active' || p.status === 'repaying';
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-subtleBorder dark:border-gray-800 gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-neutralDark dark:text-gray-100 tracking-tight">Explore Asset Pools</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real commercial assets co-funded by community investors
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs">
          {(['all', 'funding', 'repaying', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition ${
                filter === tab
                  ? 'bg-neutralDark text-white dark:bg-emerald-600 dark:text-white'
                  : 'bg-white dark:bg-gray-800 border border-subtleBorder dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'funding' ? 'Open Funding' : tab === 'repaying' ? 'Active / Repaying' : tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400">Loading pools...</div>
      ) : filteredPools.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-12 text-center text-xs text-gray-500 dark:text-gray-400">
          No pools found matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
};
