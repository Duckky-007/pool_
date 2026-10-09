import { Router, Response } from 'express';
import { Pool, User, Investment, Repayment, Transaction, Asset } from '../models/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { calculateSharesToMint, calculateSharePrice, calculateWithdrawal } from '../services/math.js';

const router = Router();

// POST /api/pools/:id/invest - Investor deposits amount X into pool
router.post('/pools/:id/invest', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const poolId = req.params.id;
    const amount = Number(req.body.amount);

    if (user.role !== 'investor') {
      return res.status(403).json({ error: 'Only investors can deposit into pools' });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid investment amount greater than zero' });
    }

    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    /**
     * =========================================================================
     * ANTI-ABUSE RULE:
     * Deposits are strictly restricted to pools with status === "funding".
     * Once a pool transitions to "active", "repaying", or "completed", no further
     * deposits are allowed. This critical safeguard prevents predatory timing
     * attacks where a user deposits capital immediately prior to an anticipated
     * repayment, which would artificially capture immediate NAV appreciation
     * without having undertaken the risk of funding the initial asset acquisition.
     * =========================================================================
     */
    if (pool.status !== 'funding') {
      return res.status(400).json({
        error: `Deposits are not allowed. This pool is in "${pool.status}" status. Deposits are strictly restricted to "funding" status to prevent predatory repayment timing.`,
      });
    }

    const investor = await User.findById(user.id);
    if (!investor) {
      return res.status(404).json({ error: 'Investor account not found' });
    }

    if (investor.wallet_balance < amount) {
      return res.status(400).json({
        error: `Insufficient funds. Your wallet balance is ₹${investor.wallet_balance.toFixed(2)}, but you tried to deposit ₹${amount.toFixed(2)}.`,
      });
    }

    // CORE MATH: Calculate shares to mint
    const sharesToMint = calculateSharesToMint(amount, pool.total_shares, pool.total_pool_value);

    // Update pool share metrics
    pool.total_shares += sharesToMint;
    pool.total_pool_value += amount;

    // Check if target is achieved
    if (pool.total_pool_value >= pool.target_amount) {
      pool.status = 'active'; // Can now be borrowed by company
    }
    await pool.save();

    // Deduct amount from investor wallet balance
    investor.wallet_balance -= amount;
    await investor.save();

    // Record Investment row
    const investment = await Investment.create({
      pool_id: pool._id,
      investor_id: investor._id,
      amount_deposited: amount,
      shares_received: sharesToMint,
    });

    // Record Transaction of type "deposit"
    await Transaction.create({
      user_id: investor._id,
      pool_id: pool._id,
      type: 'deposit',
      amount: amount,
    });

    return res.status(201).json({
      message: 'Investment successful!',
      investment: investment.toJSON(),
      shares_received: Number(sharesToMint.toFixed(4)),
      current_share_price: Number(calculateSharePrice(pool.total_pool_value, pool.total_shares).toFixed(4)),
      new_wallet_balance: investor.wallet_balance,
      pool_status: pool.status,
    });
  } catch (error: any) {
    console.error('Investment error:', error);
    return res.status(500).json({ error: 'Failed to process investment' });
  }
});

// GET /api/investments/my - Investor's investments list
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const investments = await Investment.find({ investor_id: user.id })
      .populate({
        path: 'pool_id',
        populate: { path: 'company_id', select: 'name email' },
      })
      .sort({ created_at: -1 });

    const enrichedInvestments = await Promise.all(
      investments.map(async (invDoc) => {
        const inv = invDoc.toJSON();
        const pool: any = inv.pool_id;
        if (!pool) return inv;

        const asset = await Asset.findOne({ pool_id: pool._id });
        const repaymentCount = await Repayment.countDocuments({ pool_id: pool._id });

        const sharePrice = calculateSharePrice(pool.total_pool_value, pool.total_shares);
        const currentValue = inv.shares_received * sharePrice;
        const profitLoss = currentValue - inv.amount_deposited;
        const profitLossPercent = inv.amount_deposited > 0 ? (profitLoss / inv.amount_deposited) * 100 : 0;

        // Withdrawal is allowed ONLY after at least one repayment has been logged
        const canWithdraw = repaymentCount > 0 && inv.shares_received > 0;

        return {
          ...inv,
          pool: {
            ...pool,
            asset: asset ? asset.toJSON() : null,
          },
          current_share_price: Number(sharePrice.toFixed(4)),
          current_value: Number(currentValue.toFixed(2)),
          profit_loss: Number(profitLoss.toFixed(2)),
          profit_loss_percent: Number(profitLossPercent.toFixed(2)),
          can_withdraw: canWithdraw,
          repayment_count: repaymentCount,
        };
      })
    );

    return res.json({ investments: enrichedInvestments });
  } catch (error: any) {
    console.error('Fetch my investments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve investments' });
  }
});

// POST /api/investments/:id/withdraw - Redeem shares for cash payout
router.post('/:id/withdraw', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const investmentId = req.params.id;

    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (investment.investor_id.toString() !== user.id) {
      return res.status(403).json({ error: 'Unauthorized to withdraw this investment' });
    }

    if (investment.shares_received <= 0) {
      return res.status(400).json({ error: 'This investment has already been fully redeemed' });
    }

    const pool = await Pool.findById(investment.pool_id);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    // REQUIREMENT: Only allowed after the pool has received at least one repayment
    const repaymentCount = await Repayment.countDocuments({ pool_id: pool._id });
    if (repaymentCount === 0) {
      return res.status(400).json({
        error: 'Withdrawals are locked until the pool receives at least one repayment from income earnings.',
      });
    }

    // CORE MATH: Calculate payout and reduction in total shares and pool value
    const sharesToRedeem = investment.shares_received;
    const { payout, newTotalShares, newTotalPoolValue } = calculateWithdrawal(
      sharesToRedeem,
      pool.total_shares,
      pool.total_pool_value
    );

    // Update pool state
    pool.total_shares = newTotalShares;
    pool.total_pool_value = newTotalPoolValue;
    await pool.save();

    // Credit investor wallet balance
    const investor = await User.findById(user.id);
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    investor.wallet_balance += payout;
    await investor.save();

    // Record Transaction of type "withdraw"
    await Transaction.create({
      user_id: investor._id,
      pool_id: pool._id,
      type: 'withdraw',
      amount: Number(payout.toFixed(2)),
    });

    // Mark shares redeemed on the investment record (set to 0)
    investment.shares_received = 0;
    await investment.save();

    return res.json({
      message: `Withdrawal of ₹${payout.toFixed(2)} completed successfully!`,
      payout: Number(payout.toFixed(2)),
      investor_wallet_balance: investor.wallet_balance,
      remaining_pool_shares: pool.total_shares,
      remaining_pool_value: pool.total_pool_value,
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

export default router;
