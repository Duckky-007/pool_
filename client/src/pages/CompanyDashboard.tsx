import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Pool } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  Building2,
  Plus,
  CheckCircle2,
} from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: Create Pool
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('15000');
  const [interestRate, setInterestRate] = useState('10');
  const [durationDays, setDurationDays] = useState('180');
  const [createLoading, setCreateLoading] = useState(false);

  // Modal 2: Borrow Funds & Register Asset
  const [borrowPool, setBorrowPool] = useState<Pool | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<'vehicle' | 'property' | 'other'>('vehicle');
  const [assetDescription, setAssetDescription] = useState('');
  const [borrowLoading, setBorrowLoading] = useState(false);

  // Modal 3: Log Income
  const [incomePool, setIncomePool] = useState<Pool | null>(null);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [periodLabel, setPeriodLabel] = useState('Week of Oct 12');
  const [incomeLoading, setIncomeLoading] = useState(false);

  // Repayment converting state
  const [repayLoading, setRepayLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCompanyPools = async () => {
    try {
      setLoading(true);
      const res = await api.getPools();
      // Filter pools where company_id matches current user
      const myPools = res.pools.filter(
        (p: any) => (p.company_id?._id || p.company_id?.id || p.company_id) === user?.id
      );
      setPools(myPools);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyPools();
  }, [user]);

  // Create Pool
  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setFeedback(null);

    try {
      await api.createPool({
        title,
        description,
        target_amount: Number(targetAmount),
        interest_rate_percent: Number(interestRate),
        duration_days: Number(durationDays),
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await fetchCompanyPools();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setCreateLoading(false);
    }
  };

  // Trigger Borrow & Register Asset
  const handleConfirmBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowPool) return;
    setBorrowLoading(true);
    setFeedback(null);

    try {
      await api.borrowPool(borrowPool.id, {
        asset_name: assetName,
        asset_type: assetType,
        asset_description: assetDescription,
      });
      setBorrowPool(null);
      setAssetName('');
      setAssetDescription('');
      await refreshUser();
      await fetchCompanyPools();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBorrowLoading(false);
    }
  };

  // Log Income
  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomePool || !incomePool.asset) return;
    setIncomeLoading(true);
    setFeedback(null);

    try {
      await api.logIncome(incomePool.asset.id, {
        amount_earned: Number(incomeAmount),
        period_label: periodLabel,
      });
      setIncomePool(null);
      setIncomeAmount('');
      await fetchCompanyPools();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setIncomeLoading(false);
    }
  };

  // Convert Pending Income Logs to Repayment
  const handleConvertRepayment = async (poolId: string) => {
    if (!window.confirm('Convert all pending income logs into a repayment to the pool? This will deduct the sum from your company wallet and raise the pool share price.')) {
      return;
    }
    setRepayLoading(poolId);
    setFeedback(null);

    try {
      const res = await api.repayPool(poolId);
      alert(res.message);
      await refreshUser();
      await fetchCompanyPools();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRepayLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-primary dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-neutralDark dark:text-gray-100 tracking-tight">Company Dashboard</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Company: <strong className="text-neutralDark dark:text-gray-200">{user?.name}</strong> • Wallet Balance:{' '}
            <span className="font-semibold tabular-numbers text-neutralDark dark:text-gray-100">
              ₹{user?.wallet_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setFeedback(null);
          }}
          className="px-4 py-2.5 bg-primary dark:bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-primary-600 dark:hover:bg-emerald-500 transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Funding Request</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
              : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Pools Management List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-neutralDark dark:text-gray-100 tracking-tight">My Funding Pools</h2>

        {loading ? (
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-8 text-center text-xs text-gray-400">
            Loading your pools...
          </div>
        ) : pools.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-8 text-center text-xs text-gray-500 dark:text-gray-400">
            You have not created any funding pools yet. Click "Create Funding Request" above to launch a new pool!
          </div>
        ) : (
          pools.map((pool) => {
            const isFullyFunded = pool.total_pool_value >= pool.target_amount;
            const progress = Math.min(100, Math.round((pool.total_pool_value / pool.target_amount) * 100));
            const hasAsset = !!pool.asset;

            return (
              <div
                key={pool.id}
                className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 space-y-5 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-subtleBorder dark:border-gray-800 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/pools/${pool.id}`}
                        className="font-bold text-neutralDark dark:text-gray-100 text-base hover:text-primary dark:hover:text-emerald-400 transition"
                      >
                        {pool.title}
                      </Link>
                      <StatusBadge status={pool.status} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pool.description}</p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="text-right">
                      <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase">Current NAV</div>
                      <div className="font-bold text-primary dark:text-emerald-400 tabular-numbers">
                        ₹{pool.current_share_price?.toFixed(4) || '1.0000'}
                      </div>
                    </div>
                    <Link
                      to={`/pools/${pool.id}`}
                      className="px-3 py-1.5 border border-subtleBorder dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      View Full Details &rarr;
                    </Link>
                  </div>
                </div>

                {/* Funding Progress Bar */}
                <div>
                  <div className="flex justify-between items-baseline text-xs mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Funding Progress</span>
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

                {/* Action Row / Asset Status */}
                <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Asset info or borrow notice */}
                  <div>
                    {hasAsset ? (
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-semibold text-neutralDark dark:text-gray-200">Asset Registered:</span>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300 font-medium">
                          {pool.asset?.name} ({pool.asset?.type})
                        </span>
                        <StatusBadge status={pool.asset?.status || 'active'} size="sm" />
                      </div>
                    ) : isFullyFunded && !pool.borrowed_at ? (
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 px-3 py-1.5 rounded flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pool 100% funded! Ready to borrow funds and register asset.</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Awaiting funding completion before borrowing unlocks.
                      </div>
                    )}
                  </div>

                  {/* Right: Operational Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Trigger Borrow button */}
                    {!pool.borrowed_at && (
                      <button
                        onClick={() => {
                          setBorrowPool(pool);
                          setAssetName('');
                          setAssetDescription('');
                          setFeedback(null);
                        }}
                        disabled={!isFullyFunded}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition ${
                          isFullyFunded
                            ? 'bg-primary dark:bg-emerald-600 text-white hover:bg-primary-600 dark:hover:bg-emerald-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        Trigger Borrow
                      </button>
                    )}

                    {/* Log Income button (once asset exists) */}
                    {hasAsset && pool.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setIncomePool(pool);
                          setIncomeAmount('');
                          setFeedback(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-neutralDark dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded transition"
                      >
                        Log Income
                      </button>
                    )}

                    {/* Convert to Repayment button */}
                    {hasAsset && pool.status !== 'completed' && (
                      <button
                        onClick={() => handleConvertRepayment(pool.id)}
                        disabled={repayLoading === pool.id}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 dark:bg-emerald-600 text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 rounded transition disabled:opacity-50"
                      >
                        {repayLoading === pool.id ? 'Converting...' : 'Convert to Repayment'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Create Funding Request */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-start pb-4 border-b border-subtleBorder dark:border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutralDark dark:text-gray-100">Create Funding Request</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Co-fund an income-generating asset with investors</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Pool Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Airport Taxi Fleet #2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description & Business Plan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain how this asset generates steady income (e.g. airport routes, corporate transit, rental yield)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="30"
                    step="30"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 text-xs font-medium border border-subtleBorder dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2 text-xs font-semibold bg-primary dark:bg-emerald-600 text-white hover:bg-primary-600 dark:hover:bg-emerald-500 rounded disabled:opacity-50"
                >
                  {createLoading ? 'Publishing...' : 'Publish Funding Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Borrow Funds & Register Asset */}
      {borrowPool && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-start pb-4 border-b border-subtleBorder dark:border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutralDark dark:text-gray-100">Borrow Capital & Register Asset</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Transfers ₹{borrowPool.total_pool_value.toLocaleString()} to your company wallet to purchase the asset
                </p>
              </div>
              <button
                onClick={() => setBorrowPool(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded text-xs text-amber-900 dark:text-amber-300 mb-4">
              <strong>Scope Rule:</strong> Exactly ONE asset can be funded and registered per pool.
            </div>

            <form onSubmit={handleConfirmBorrow} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Asset Type
                </label>
                <select
                  value={assetType}
                  onChange={(e: any) => setAssetType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                >
                  <option value="vehicle">Vehicle (Taxi, Van, Delivery Fleet)</option>
                  <option value="property">Property (Rental Apartment, Studio)</option>
                  <option value="other">Other Commercial Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Asset Name / Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Innova - Taxi #4"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Asset Details / Specs
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Registration number, mileage, operating route..."
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBorrowPool(null)}
                  className="flex-1 py-2 text-xs font-medium border border-subtleBorder dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={borrowLoading}
                  className="flex-1 py-2 text-xs font-semibold bg-primary dark:bg-emerald-600 text-white hover:bg-primary-600 dark:hover:bg-emerald-500 rounded disabled:opacity-50"
                >
                  {borrowLoading ? 'Processing...' : 'Borrow & Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Log Asset Income */}
      {incomePool && incomePool.asset && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start pb-4 border-b border-subtleBorder dark:border-gray-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutralDark dark:text-gray-100">Log Asset Income</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Asset: {incomePool.asset.name}</p>
              </div>
              <button
                onClick={() => setIncomePool(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Amount Earned (₹)
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  placeholder="e.g. 500"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Period Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week of Oct 12"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-subtleBorder dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-neutralDark dark:text-gray-100 focus:outline-none focus:border-primary dark:focus:border-emerald-500"
                />
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Logged incomes stay in pending status until converted into a repayment, at which point the full sum increases pool share price.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIncomePool(null)}
                  className="flex-1 py-2 text-xs font-medium border border-subtleBorder dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={incomeLoading}
                  className="flex-1 py-2 text-xs font-semibold bg-primary dark:bg-emerald-600 text-white hover:bg-primary-600 dark:hover:bg-emerald-500 rounded disabled:opacity-50"
                >
                  {incomeLoading ? 'Logging...' : 'Save Income Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
