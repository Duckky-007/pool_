import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { Pool } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ShareMathExplainer } from '../components/ShareMathExplainer.js';
import {
  Car,
  Users,
  TrendingUp,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

export const PoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  // Invest Form State
  const [investAmount, setInvestAmount] = useState('1000');
  const [investLoading, setInvestLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPool = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getPool(id);
      setPool(res.pool);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, [id]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pool) return;
    const amount = Number(investAmount);

    if (amount <= 0 || isNaN(amount)) {
      setFeedback({ type: 'error', text: 'Please enter a valid deposit amount' });
      return;
    }

    setInvestLoading(true);
    setFeedback(null);

    try {
      const res = await api.invest(pool.id, amount);
      setFeedback({
        type: 'success',
        text: `Successfully invested ₹${amount.toLocaleString()}! Minted ${res.shares_received} shares.`,
      });
      await refreshUser();
      await fetchPool();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setInvestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-sm text-gray-400">
        Loading pool details...
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Pool not found.{' '}
        <Link to="/pools" className="text-primary dark:text-emerald-400 font-semibold underline">
          Return to browse pools
        </Link>
      </div>
    );
  }

  const progress = Math.min(100, Math.round((pool.total_pool_value / pool.target_amount) * 100));
  const sharePrice = pool.total_shares > 0 ? pool.total_pool_value / pool.total_shares : 1.0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-subtleBorder dark:border-gray-800 gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Link to="/pools" className="hover:text-neutralDark dark:hover:text-gray-200 transition">
              Pools
            </Link>
            <span>/</span>
            <span className="capitalize">{pool.asset?.type || 'Real Asset'}</span>
            <span>/</span>
            <span className="text-neutralDark dark:text-gray-200 font-medium truncate max-w-xs">{pool.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-neutralDark dark:text-gray-100 tracking-tight">{pool.title}</h1>
            <StatusBadge status={pool.status} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Initiated by <strong className="text-neutralDark dark:text-gray-200">{pool.company?.name || 'Authorized Company'}</strong>
          </p>
        </div>

        {/* Prominent Share Price Card */}
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-lg p-3 text-right">
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider">
            Current Share Price (NAV)
          </div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 tabular-numbers">
            ₹{sharePrice.toFixed(4)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
            {sharePrice > 1.0
              ? `Started at ₹1.0000 (+${((sharePrice - 1.0) * 100).toFixed(2)}% gain)`
              : 'Started at ₹1.0000 (At par)'}
          </div>
        </div>
      </div>

      {/* Grid: Main Info + Investment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pool Overview Card */}
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 space-y-4 transition-colors">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Asset & Funding Strategy
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{pool.description}</p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-subtleBorder dark:border-gray-800">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Target Capital</div>
                <div className="text-lg font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
                  ₹{pool.target_amount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Target Return Rate</div>
                <div className="text-lg font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
                  {pool.interest_rate_percent}% p.a.
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Loan Duration</div>
                <div className="text-lg font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
                  {pool.duration_days} days
                </div>
              </div>
            </div>
          </div>

          {/* Asset Info Card (Scope rule: Exactly ONE asset per pool) */}
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Funded Physical Asset
              </h2>
              {pool.asset && <StatusBadge status={pool.asset.status} size="sm" />}
            </div>

            {pool.asset ? (
              <div className="space-y-2">
                <div className="text-base font-bold text-neutralDark dark:text-gray-100 flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary dark:text-emerald-400" />
                  <span>{pool.asset.name}</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {pool.asset.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{pool.asset.description}</p>
                <div className="text-[11px] text-gray-400 dark:text-gray-500">
                  Registered: {new Date(pool.asset.registered_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-4 rounded border border-dashed border-gray-200 dark:border-gray-700">
                Asset will be registered as soon as the pool reaches 100% funding and the company executes borrow.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Funding Progress & Deposit Box */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 space-y-5 transition-colors">
            <h3 className="font-bold text-neutralDark dark:text-gray-100 text-base">Funding Status</h3>

            <div>
              <div className="flex justify-between items-baseline text-xs mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">Capital Raised</span>
                <span className="font-semibold text-neutralDark dark:text-gray-100 tabular-numbers">
                  ₹{pool.total_pool_value.toLocaleString()} / ₹{pool.target_amount.toLocaleString()} ({progress}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary dark:bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 pt-2 border-t border-subtleBorder dark:border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Shares Issued:</span>
                <span className="font-semibold text-neutralDark dark:text-gray-100 tabular-numbers">
                  {pool.total_shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Repayments Made:</span>
                <span className="font-semibold text-neutralDark dark:text-gray-100 tabular-numbers">
                  ₹{pool.total_repayments_made?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Target Principal + Return:</span>
                <span className="font-semibold text-neutralDark dark:text-gray-100 tabular-numbers">
                  ₹{pool.target_return?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            {/* Deposit Box (Only when status === 'funding') */}
            {pool.status === 'funding' ? (
              <div className="pt-4 border-t border-subtleBorder dark:border-gray-800">
                <h4 className="text-xs font-bold text-neutralDark dark:text-gray-100 mb-2">Deposit into Pool</h4>

                {feedback && (
                  <div
                    className={`p-2.5 rounded text-xs mb-3 ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}

                {user?.role === 'investor' ? (
                  <form onSubmit={handleInvest} className="space-y-3">
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-400 dark:text-gray-500">₹</span>
                        <input
                          type="number"
                          min="100"
                          step="100"
                          required
                          value={investAmount}
                          onChange={(e) => setInvestAmount(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 text-xs font-semibold focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                        />
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Wallet Balance: ₹{user.wallet_balance.toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={investLoading}
                      className="w-full py-2.5 px-4 bg-primary dark:bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-primary-600 dark:hover:bg-emerald-500 transition disabled:opacity-50"
                    >
                      {investLoading ? 'Processing...' : 'Confirm Deposit'}
                    </button>
                  </form>
                ) : user?.role === 'company' ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-3 rounded">
                    You are logged in as a <strong>Company</strong>. Switch to an investor account via the top navbar to deposit.
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-3 rounded">
                    <Link to="/login" className="text-primary dark:text-emerald-400 font-semibold underline">
                      Sign in
                    </Link>{' '}
                    to co-fund this asset.
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-4 border-t border-subtleBorder dark:border-gray-800">
                <div className="p-3 bg-slate-50 dark:bg-gray-800/60 border border-subtleBorder dark:border-gray-800 rounded text-xs text-gray-600 dark:text-gray-300">
                  <div className="font-semibold text-neutralDark dark:text-gray-100 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-primary dark:text-emerald-400" />
                    <span>Funding Closed (Anti-Abuse Rule)</span>
                  </div>
                  Deposits are locked because this asset is actively operating and generating revenues.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CORE MATH SECTION: Interactive Visual Breakdown */}
      <ShareMathExplainer pool={pool} />

      {/* TABS: Investors List, Income Logs History, Repayment History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Transparent Investors List */}
        <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-5 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-subtleBorder dark:border-gray-800 mb-3">
            <h3 className="font-bold text-neutralDark dark:text-gray-100 text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Pool Investors</span>
            </h3>
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              {pool.investments?.length || 0} backers
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
            {pool.investments && pool.investments.length > 0 ? (
              pool.investments.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-50/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800"
                >
                  <div>
                    <div className="font-semibold text-neutralDark dark:text-gray-200">{inv.investor?.name || 'Investor'}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      {inv.shares_received.toLocaleString(undefined, { maximumFractionDigits: 1 })} shares minted
                    </div>
                  </div>
                  <div className="text-right font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
                    ₹{inv.amount_deposited.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 dark:text-gray-500 text-xs py-4 text-center">No investors yet.</div>
            )}
          </div>
        </div>

        {/* 2. Asset Income Logs */}
        <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-5 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-subtleBorder dark:border-gray-800 mb-3">
            <h3 className="font-bold text-neutralDark dark:text-gray-100 text-sm flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Asset Revenues Logged</span>
            </h3>
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              {pool.asset?.income_logs?.length || 0} entries
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
            {pool.asset?.income_logs && pool.asset.income_logs.length > 0 ? (
              pool.asset.income_logs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-50/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800"
                >
                  <div>
                    <div className="font-semibold text-neutralDark dark:text-gray-200">{log.period_label}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {log.converted_to_repayment ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Converted to Repayment</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">Pending Conversion</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
                    ₹{log.amount_earned.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 dark:text-gray-500 text-xs py-4 text-center">No income logged yet.</div>
            )}
          </div>
        </div>

        {/* 3. Repayment History */}
        <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-5 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-subtleBorder dark:border-gray-800 mb-3">
            <h3 className="font-bold text-neutralDark dark:text-gray-100 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary dark:text-emerald-400" />
              <span>Repayments to Pool</span>
            </h3>
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              {pool.repayments?.length || 0} repayments
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-xs">
            {pool.repayments && pool.repayments.length > 0 ? (
              pool.repayments.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40"
                >
                  <div>
                    <div className="font-semibold text-emerald-900 dark:text-emerald-300">Repayment Injected</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right font-bold text-emerald-900 dark:text-emerald-300 tabular-numbers">
                    +₹{r.amount.toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 dark:text-gray-500 text-xs py-4 text-center">No repayments yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
