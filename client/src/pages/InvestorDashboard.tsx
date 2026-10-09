import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Pool, Investment } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.js';

export const InvestorDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [openPools, setOpenPools] = useState<Pool[]>([]);
  const [myInvestments, setMyInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Invest Modal State
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [investAmount, setInvestAmount] = useState<string>('1000');
  const [investLoading, setInvestLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poolsRes, invRes] = await Promise.all([
        api.getPools(),
        api.getMyInvestments(),
      ]);
      setOpenPools(poolsRes.pools.filter((p: Pool) => p.status === 'funding'));
      setMyInvestments(invRes.investments);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenInvestModal = (pool: Pool) => {
    setSelectedPool(pool);
    setInvestAmount('1000');
    setActionMessage(null);
  };

  const handleConfirmInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool) return;
    const amount = Number(investAmount);

    if (amount <= 0 || isNaN(amount)) {
      setActionMessage({ type: 'error', text: 'Enter a valid amount' });
      return;
    }

    setInvestLoading(true);
    setActionMessage(null);

    try {
      const res = await api.invest(selectedPool.id, amount);
      setActionMessage({
        type: 'success',
        text: `Successfully invested ₹${amount.toLocaleString()}! Received ${res.shares_received} shares.`,
      });
      await refreshUser();
      await fetchData();
      setTimeout(() => setSelectedPool(null), 1800);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setInvestLoading(false);
    }
  };

  const handleWithdraw = async (investmentId: string) => {
    if (!window.confirm('Redeem all shares in this position at the current NAV share price?')) {
      return;
    }

    setWithdrawLoading(investmentId);
    setActionMessage(null);

    try {
      const res = await api.withdraw(investmentId);
      alert(res.message);
      await refreshUser();
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setWithdrawLoading(null);
    }
  };

  const totalPortfolioValue = myInvestments.reduce((sum, inv) => sum + (inv.current_value || inv.amount_deposited), 0);
  const totalOriginalDeposited = myInvestments.reduce((sum, inv) => sum + inv.amount_deposited, 0);
  const totalNetGain = totalPortfolioValue - totalOriginalDeposited;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Portfolio Top Overview */}
      <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-subtleBorder dark:border-gray-800 gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutralDark dark:text-gray-100 tracking-tight">Investor Portfolio</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Logged in as <strong className="text-neutralDark dark:text-gray-200">{user?.name}</strong> • Fake Ledger Balance: ₹{user?.wallet_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Need demo funds?</span>
            <button
              onClick={async () => {
                await api.claimFaucet(5000);
                refreshUser();
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-neutralDark dark:text-gray-200 rounded border border-gray-300 dark:border-gray-700 transition"
            >
              + ₹5,000 Faucet
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Current Holdings</div>
            <div className="text-2xl font-bold text-neutralDark dark:text-gray-100 tabular-numbers mt-1">
              ₹{totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Across {myInvestments.filter((i) => i.shares_received > 0).length} active pool investments
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Principal Invested</div>
            <div className="text-2xl font-bold text-neutralDark dark:text-gray-100 tabular-numbers mt-1">
              ₹{totalOriginalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Total capital deployed</div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Net NAV Gain / Earnings</div>
            <div
              className={`text-2xl font-bold tabular-numbers mt-1 ${
                totalNetGain >= 0 ? 'text-primary dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {totalNetGain >= 0 ? '+' : ''}₹{totalNetGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Auto-proportional income accrual
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: My Investments List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutralDark dark:text-gray-100 tracking-tight">My Active Investments</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Holdings grow proportionally as assets log income and repay</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-8 text-center text-xs text-gray-400">
            Loading your holdings...
          </div>
        ) : myInvestments.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-8 text-center text-xs text-gray-500 dark:text-gray-400">
            You have not invested in any pools yet. Browse the open funding pools below!
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-subtleBorder dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pool & Asset</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Deposited</th>
                  <th className="py-3 px-4 text-right">Shares Owned</th>
                  <th className="py-3 px-4 text-right">Current NAV</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-right">Gain</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtleBorder dark:divide-gray-800">
                {myInvestments.map((inv) => {
                  const pool = inv.pool;
                  const isRedeemed = inv.shares_received === 0;

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/pools/${pool?.id}`}
                          className="font-semibold text-neutralDark dark:text-gray-100 hover:text-primary dark:hover:text-emerald-400 transition"
                        >
                          {pool?.title || 'Investment Pool'}
                        </Link>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {pool?.asset?.name || 'Asset acquisition pending'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={pool?.status || 'funding'} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-neutralDark dark:text-gray-200 tabular-numbers">
                        ₹{inv.amount_deposited.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-neutralDark dark:text-gray-200 tabular-numbers">
                        {isRedeemed ? (
                          <span className="text-gray-400">0 (Redeemed)</span>
                        ) : (
                          `${inv.shares_received.toLocaleString(undefined, { maximumFractionDigits: 2 })} shares`
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-primary dark:text-emerald-400 tabular-numbers">
                        ₹{inv.current_share_price?.toFixed(4) || '1.0000'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-neutralDark dark:text-gray-100 tabular-numbers">
                        ₹{(inv.current_value || inv.amount_deposited).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-numbers">
                        <span
                          className={`font-semibold ${(inv.profit_loss || 0) > 0 ? 'text-primary dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                          {(inv.profit_loss || 0) > 0 ? '+' : ''}₹{(inv.profit_loss || 0).toFixed(2)}
                        </span>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          ({(inv.profit_loss_percent || 0).toFixed(1)}%)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isRedeemed ? (
                          <span className="text-[11px] text-gray-400">Redeemed</span>
                        ) : inv.can_withdraw ? (
                          <button
                            onClick={() => handleWithdraw(inv.id)}
                            disabled={withdrawLoading === inv.id}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-700 dark:bg-emerald-600 text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 rounded transition disabled:opacity-50"
                          >
                            {withdrawLoading === inv.id ? 'Redeeming...' : 'Withdraw'}
                          </button>
                        ) : (
                          <span
                            className="text-[11px] text-gray-400 cursor-help"
                            title="Withdrawals unlock once the pool receives at least one repayment"
                          >
                            Locked (No repay yet)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Open Pools for Funding */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutralDark dark:text-gray-100 tracking-tight">Open Pools (Status = Funding)</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Deposit at ₹1.00 initial share parity to co-fund asset purchases</p>
          </div>
        </div>

        {openPools.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-8 text-center text-xs text-gray-500 dark:text-gray-400">
            No pools currently in open funding stage.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openPools.map((pool) => {
              const progress = Math.min(100, Math.round((pool.total_pool_value / pool.target_amount) * 100));

              return (
                <div
                  key={pool.id}
                  className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium capitalize">
                        {pool.asset?.type || 'Vehicle / Equipment'}
                      </span>
                      <StatusBadge status={pool.status} size="sm" />
                    </div>

                    <Link to={`/pools/${pool.id}`}>
                      <h3 className="font-semibold text-neutralDark dark:text-gray-100 text-base hover:text-primary dark:hover:text-emerald-400 transition mb-1">
                        {pool.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                      {pool.description}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between items-baseline text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Raised so far</span>
                        <span className="font-semibold text-neutralDark dark:text-gray-100 tabular-numbers">
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

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-subtleBorder dark:border-gray-800 text-center mb-4 text-xs">
                      <div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">Expected Yield</div>
                        <div className="font-bold text-neutralDark dark:text-gray-100 tabular-numbers">{pool.interest_rate_percent}% p.a.</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">Term Duration</div>
                        <div className="font-bold text-neutralDark dark:text-gray-100 tabular-numbers">{pool.duration_days} days</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/pools/${pool.id}`}
                      className="flex-1 text-center py-2 text-xs font-medium border border-subtleBorder dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleOpenInvestModal(pool)}
                      className="flex-1 py-2 text-xs font-semibold bg-primary dark:bg-emerald-600 text-white hover:bg-primary-600 dark:hover:bg-emerald-500 rounded transition"
                    >
                      Invest
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK INVEST MODAL */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start pb-4 border-b border-subtleBorder dark:border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutralDark dark:text-gray-100">Invest in Pool</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedPool.title}</p>
              </div>
              <button
                onClick={() => setSelectedPool(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {actionMessage && (
              <div
                className={`p-3 rounded mb-4 text-xs ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                }`}
              >
                {actionMessage.text}
              </div>
            )}

            <form onSubmit={handleConfirmInvest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Deposit Amount (₹)
                </label>
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
                <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  <span>Available Balance: ₹{user?.wallet_balance?.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => setInvestAmount(String(Math.min(user?.wallet_balance || 0, 5000)))}
                    className="text-primary dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Use ₹5,000
                  </button>
                </div>
              </div>

              {/* Real-time Math Preview */}
              <div className="p-3 bg-slate-50 dark:bg-gray-800/60 border border-subtleBorder dark:border-gray-800 rounded text-xs space-y-1.5">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Current Share Price:</span>
                  <span className="font-semibold text-neutralDark dark:text-gray-100">
                    ₹{selectedPool.current_share_price?.toFixed(4) || '1.0000'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Estimated Shares Minted:</span>
                  <span className="font-bold text-primary dark:text-emerald-400 tabular-numbers">
                    ~{(Number(investAmount) / (selectedPool.current_share_price || 1.0)).toFixed(2)} shares
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPool(null)}
                  className="flex-1 py-2 text-xs font-medium border border-subtleBorder dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={investLoading}
                  className="flex-1 py-2 text-xs font-semibold bg-primary dark:bg-emerald-600 text-white hover:bg-primary-600 dark:hover:bg-emerald-500 rounded disabled:opacity-50"
                >
                  {investLoading ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
