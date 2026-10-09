import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Transaction } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { History } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [myRes, allRes] = await Promise.all([
        api.getMyTransactions(),
        api.getAllTransactions(),
      ]);
      setMyTransactions(myRes.transactions);
      setAllTransactions(allRes.transactions);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const displayedList = activeTab === 'my' ? myTransactions : allTransactions;

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
      case 'borrow':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
      case 'repay':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      case 'withdraw':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-subtleBorder dark:border-gray-800 gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-primary dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-neutralDark dark:text-gray-100 tracking-tight">Financial Ledger</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Immutable log of all capital movements across PoolFund
          </p>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-md text-xs font-medium">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'my'
                ? 'bg-white dark:bg-gray-900 text-neutralDark dark:text-gray-100 shadow-sm font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-neutralDark dark:hover:text-gray-200'
            }`}
          >
            My Transactions ({myTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'all'
                ? 'bg-white dark:bg-gray-900 text-neutralDark dark:text-gray-100 shadow-sm font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-neutralDark dark:hover:text-gray-200'
            }`}
          >
            Public Platform Ledger ({allTransactions.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-12 text-center text-xs text-gray-400">
          Loading transaction log...
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-12 text-center text-xs text-gray-500 dark:text-gray-400">
          No transactions found.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-subtleBorder dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                {activeTab === 'all' && <th className="py-3 px-4">User</th>}
                <th className="py-3 px-4">Pool Reference</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtleBorder dark:divide-gray-800">
              {displayedList.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition">
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 tabular-numbers">
                    {new Date(tx.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${getTypeBadge(
                        tx.type
                      )}`}
                    >
                      {tx.type}
                    </span>
                  </td>

                  {activeTab === 'all' && (
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutralDark dark:text-gray-200">{tx.user?.name || 'Anonymous'}</div>
                      <div className="text-[10px] text-gray-400 capitalize">{tx.user?.role}</div>
                    </td>
                  )}

                  <td className="py-3.5 px-4 font-medium text-neutralDark dark:text-gray-200">
                    {tx.pool?.title || 'General Account / Faucet'}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold tabular-numbers text-neutralDark dark:text-gray-100">
                    ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
