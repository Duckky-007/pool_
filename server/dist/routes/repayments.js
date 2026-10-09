import { Router } from 'express';
import { Pool, User, Asset, IncomeLog, Repayment, Transaction } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { isPoolFullyRepaid, calculateSharePrice } from '../services/math.js';
const router = Router();
// POST /api/pools/:id/repay - Convert pending income logs into a pool repayment
router.post('/:id/repay', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const poolId = req.params.id;
        if (user.role !== 'company') {
            return res.status(403).json({ error: 'Only companies can make repayments' });
        }
        const pool = await Pool.findById(poolId);
        if (!pool) {
            return res.status(404).json({ error: 'Pool not found' });
        }
        if (pool.company_id.toString() !== user.id) {
            return res.status(403).json({ error: 'Unauthorized to repay this pool' });
        }
        const asset = await Asset.findOne({ pool_id: pool._id });
        if (!asset) {
            return res.status(400).json({ error: 'No asset registered for this pool yet' });
        }
        // Find all pending income logs for this asset
        const pendingLogs = await IncomeLog.find({
            asset_id: asset._id,
            converted_to_repayment: false,
        });
        if (pendingLogs.length === 0) {
            return res.status(400).json({ error: 'No pending income logs to convert into repayment' });
        }
        // Calculate total amount Y
        const repaymentAmount = pendingLogs.reduce((sum, log) => sum + log.amount_earned, 0);
        const companyUser = await User.findById(user.id);
        if (!companyUser) {
            return res.status(404).json({ error: 'Company user account not found' });
        }
        if (companyUser.wallet_balance < repaymentAmount) {
            return res.status(400).json({
                error: `Insufficient company wallet balance. You need ₹${repaymentAmount.toFixed(2)}, but have ₹${companyUser.wallet_balance.toFixed(2)}.`,
            });
        }
        /**
         * =========================================================================
         * CORE SHARE-BASED REPAYMENT LOGIC:
         * 1. Add repayment amount Y to total_pool_value.
         *    Because total_shares remains unchanged, share price = total_pool_value / total_shares
         *    increases automatically! Every investor's holdings grow proportionally without
         *    iterating through individual investor rows.
         * 2. Deduct Y from company's wallet_balance.
         * 3. Record Repayment document linking source IncomeLog ids.
         * 4. Mark all converted IncomeLogs as converted_to_repayment = true.
         * 5. Record Transaction of type "repay".
         * 6. If cumulative repayments >= target * (1 + interest_rate_percent/100),
         *    mark pool status = "completed" and asset status = "sold".
         * =========================================================================
         */
        // 1. Update pool NAV
        pool.total_pool_value += repaymentAmount;
        if (pool.status === 'active') {
            pool.status = 'repaying';
        }
        // 2. Deduct company wallet
        companyUser.wallet_balance -= repaymentAmount;
        await companyUser.save();
        // 3. Record Repayment
        const sourceIds = pendingLogs.map((l) => l._id);
        const repayment = await Repayment.create({
            pool_id: pool._id,
            amount: repaymentAmount,
            source_income_log_ids: sourceIds,
        });
        // 4. Mark income logs as converted
        await IncomeLog.updateMany({ _id: { $in: sourceIds } }, { $set: { converted_to_repayment: true } });
        // 5. Record Transaction
        await Transaction.create({
            user_id: companyUser._id,
            pool_id: pool._id,
            type: 'repay',
            amount: repaymentAmount,
        });
        // 6. Check if loan term is fully satisfied
        const allRepayments = await Repayment.find({ pool_id: pool._id });
        const cumulativeRepayments = allRepayments.reduce((acc, r) => acc + r.amount, 0);
        const isFullyPaid = isPoolFullyRepaid(pool.target_amount, pool.interest_rate_percent, cumulativeRepayments);
        if (isFullyPaid) {
            pool.status = 'completed';
            asset.status = 'sold';
            await asset.save();
        }
        await pool.save();
        const newSharePrice = calculateSharePrice(pool.total_pool_value, pool.total_shares);
        return res.json({
            message: `Repayment of ₹${repaymentAmount.toFixed(2)} converted successfully!`,
            repayment: repayment.toJSON(),
            new_pool_value: pool.total_pool_value,
            new_share_price: Number(newSharePrice.toFixed(4)),
            pool_status: pool.status,
            asset_status: asset.status,
            company_wallet_balance: companyUser.wallet_balance,
            is_fully_repaid: isFullyPaid,
        });
    }
    catch (error) {
        console.error('Repayment error:', error);
        return res.status(500).json({ error: 'Failed to process repayment' });
    }
});
export default router;
