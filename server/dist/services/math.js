/**
 * ============================================================================
 * POOLFUND CORE SHARE-BASED ACCOUNTING ENGINE
 * ============================================================================
 *
 * Traditional crowdfunding systems track fixed debts or manual cuts per investor.
 * PoolFund operates like an open-end mutual fund / Net Asset Value (NAV) engine:
 *
 * 1. Shares are minted when investors fund the pool.
 * 2. NAV per share starts at 1.00 (1 currency unit = 1 share).
 * 3. Repayments inject capital into the pool, increasing `total_pool_value`.
 * 4. Since `total_shares` stays constant during repayments, the share price
 *    (`total_pool_value / total_shares`) rises automatically.
 * 5. Every investor's holdings grow proportionally without iterating over investors!
 *
 * ============================================================================
 */
/**
 * Calculates the current Net Asset Value (NAV) / share price of a pool.
 *
 * @param totalPoolValue Total value in the pool (capital + repayments accrued)
 * @param totalShares Total minted shares
 * @returns Current price per share (defaults to 1.0 if no shares exist yet)
 */
export function calculateSharePrice(totalPoolValue, totalShares) {
    if (totalShares <= 0 || totalPoolValue <= 0) {
        return 1.0;
    }
    return totalPoolValue / totalShares;
}
/**
 * Calculates how many shares an investor should receive for a deposit amount X.
 *
 * ANTI-DILUTION FORMULA:
 * - If first deposit (total_shares == 0): 1 currency unit = 1 share.
 * - For subsequent deposits: shares_to_mint = depositAmount * (total_shares / total_pool_value)
 *   Notice: (total_shares / total_pool_value) is 1 / share_price.
 *   So: shares_to_mint = depositAmount / current_share_price.
 *
 * @param depositAmount Amount of currency being deposited (X)
 * @param totalShares Current total shares in the pool
 * @param totalPoolValue Current total pool value
 * @returns Number of new shares to mint
 */
export function calculateSharesToMint(depositAmount, totalShares, totalPoolValue) {
    if (totalShares === 0 || totalPoolValue === 0) {
        // Initial parity: 1 unit of currency = 1 unit of share
        return depositAmount;
    }
    // Mint proportional to the current share price
    // shares = deposit / (totalPoolValue / totalShares)
    return depositAmount * (totalShares / totalPoolValue);
}
/**
 * Calculates payout and state changes when an investor withdraws (redeems shares).
 *
 * @param sharesToRedeem Number of shares the investor is redeeming
 * @param totalShares Current total pool shares
 * @param totalPoolValue Current total pool value
 * @returns { payout, newTotalShares, newTotalPoolValue }
 */
export function calculateWithdrawal(sharesToRedeem, totalShares, totalPoolValue) {
    if (totalShares <= 0 || sharesToRedeem <= 0) {
        return { payout: 0, newTotalShares: totalShares, newTotalPoolValue: totalPoolValue };
    }
    // Current share price = total_pool_value / total_shares
    const currentSharePrice = calculateSharePrice(totalPoolValue, totalShares);
    // Investor payout is proportional to their shares * current NAV
    const payout = sharesToRedeem * currentSharePrice;
    // Proportional reduction in pool state
    const newTotalShares = Math.max(0, totalShares - sharesToRedeem);
    const newTotalPoolValue = Math.max(0, totalPoolValue - payout);
    return {
        payout,
        newTotalShares,
        newTotalPoolValue,
    };
}
/**
 * Checks if a pool's repayments have met or exceeded the full loan return target.
 *
 * Target return = original borrowed amount * (1 + interest_rate_percent / 100)
 *
 * @param targetAmount Original borrowed amount (principal target)
 * @param interestRatePercent Agreed interest rate (e.g. 8 for 8%)
 * @param cumulativeRepayments Total sum of all repayments made so far
 * @returns boolean true if fully satisfied
 */
export function isPoolFullyRepaid(targetAmount, interestRatePercent, cumulativeRepayments) {
    const totalDue = targetAmount * (1 + interestRatePercent / 100);
    // Using a small epsilon for floating point safety
    return cumulativeRepayments >= (totalDue - 0.0001);
}
