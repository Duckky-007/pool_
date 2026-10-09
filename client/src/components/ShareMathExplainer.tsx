import React from 'react';
import { Pool } from '../types.js';
import { Calculator, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  pool: Pool;
}

export const ShareMathExplainer: React.FC<Props> = ({ pool }) => {
  const sharePrice = pool.total_shares > 0 ? pool.total_pool_value / pool.total_shares : 1.0;
  const isAppreciated = sharePrice > 1.0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-subtleBorder dark:border-gray-800 rounded-lg p-6 my-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-subtleBorder dark:border-gray-800 gap-2">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-primary dark:text-emerald-400" />
          <h3 className="font-semibold text-neutralDark dark:text-gray-100 text-base">
            Share-Based Net Asset Value (NAV) Accounting Engine
          </h3>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-md text-xs font-semibold">
          <span>Live Share Price:</span>
          <span className="text-sm font-bold tabular-numbers">
            ₹{sharePrice.toFixed(4)}
          </span>
          <span className="text-gray-500 dark:text-gray-400 font-normal">
            ({sharePrice === 1.0 ? 'Started at ₹1.0000' : `+${((sharePrice - 1) * 100).toFixed(2)}% return`})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
        {/* Step 1: Minting Shares */}
        <div className="bg-slate-50 dark:bg-gray-800/50 border border-subtleBorder dark:border-gray-800 rounded-md p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              1. Share Minting (Deposits)
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              When an investor deposits ₹X during funding, shares are minted based on the initial parity or NAV:
            </p>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs font-mono text-gray-800 dark:text-gray-200">
              Shares = Deposit ÷ Current NAV
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/60 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Total Shares Minted:</span>{' '}
            <span className="font-bold tabular-numbers text-neutralDark dark:text-gray-100">
              {pool.total_shares.toLocaleString(undefined, { maximumFractionDigits: 2 })} shares
            </span>
          </div>
        </div>

        {/* Step 2: Income Repayment NAV Increment */}
        <div className="bg-slate-50 dark:bg-gray-800/50 border border-subtleBorder dark:border-gray-800 rounded-md p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              2. Repayment Value Injection
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              Income logged from the asset is repaid back into the pool. This increases <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-neutralDark dark:text-gray-200">total_pool_value</code> while share count stays constant:
            </p>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs font-mono text-gray-800 dark:text-gray-200">
              New NAV = Total Value ÷ Total Shares
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/60 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Recorded Pool Value:</span>{' '}
            <span className="font-bold tabular-numbers text-neutralDark dark:text-gray-100">
              ₹{pool.total_pool_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Step 3: Proportional Redemption */}
        <div className="bg-slate-50 dark:bg-gray-800/50 border border-subtleBorder dark:border-gray-800 rounded-md p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              3. Investor Withdrawal
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              Investors redeem their shares at the appreciated NAV. No manual per-investor splits are required in the codebase:
            </p>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs font-mono text-gray-800 dark:text-gray-200">
              Payout = Shares Owned × NAV
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/60 text-xs flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Early Investor Gain:</span>
            <span className={`font-semibold tabular-numbers ${isAppreciated ? 'text-primary dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {isAppreciated ? `+₹${(sharePrice - 1.0).toFixed(4)} / share` : 'At Par (₹1.00)'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Equation Banner */}
      <div className="mt-5 p-3 bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-300 dark:border-gray-700 rounded-md flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm text-gray-700 dark:text-gray-200 font-mono">
        <span className="font-semibold text-neutralDark dark:text-gray-100">Share Price</span>
        <span>=</span>
        <div className="inline-flex flex-col items-center">
          <span className="border-b border-gray-400 dark:border-gray-600 px-2 font-bold text-neutralDark dark:text-gray-100">
            ₹{pool.total_pool_value.toLocaleString()} (Pool Value)
          </span>
          <span className="px-2 font-bold text-neutralDark dark:text-gray-100">
            {pool.total_shares.toLocaleString()} (Shares)
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-base font-bold text-primary dark:text-emerald-400 font-mono tabular-numbers">
          ₹{sharePrice.toFixed(4)} / share
        </span>
      </div>

      {/* Anti abuse protection explanation note */}
      <div className="mt-4 flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded border border-blue-100 dark:border-blue-900/40">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-900 dark:text-blue-300">Anti-Abuse Rule Enforced: </span>
          New investments are permanently locked when status moves to <em>active</em> or <em>repaying</em>. This prevents late deposits right before repayments to game share appreciation without funding asset purchase.
        </div>
      </div>
    </div>
  );
};
