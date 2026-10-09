import { Router } from 'express';
import { Pool, User, Asset, Investment, Repayment, Transaction, IncomeLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateSharePrice } from '../services/math.js';
const router = Router();
// GET /api/pools - List all pools
router.get('/', async (_req, res) => {
    try {
        const pools = await Pool.find()
            .populate('company_id', 'id name email')
            .sort({ created_at: -1 });
        // Fetch related asset and investment counts for each pool
        const enrichedPools = await Promise.all(pools.map(async (poolDoc) => {
            const pool = poolDoc.toJSON();
            const asset = await Asset.findOne({ pool_id: pool.id });
            const investmentCount = await Investment.countDocuments({ pool_id: pool.id });
            const sharePrice = calculateSharePrice(pool.total_pool_value, pool.total_shares);
            const progressPercent = Math.min(100, Math.round((pool.total_pool_value / pool.target_amount) * 100));
            return {
                ...pool,
                company: pool.company_id,
                asset: asset ? asset.toJSON() : null,
                current_share_price: Number(sharePrice.toFixed(4)),
                progress_percent: progressPercent,
                investor_count: investmentCount,
            };
        }));
        return res.json({ pools: enrichedPools });
    }
    catch (error) {
        console.error('Fetch pools error:', error);
        return res.status(500).json({ error: 'Failed to retrieve pools' });
    }
});
// GET /api/pools/:id - Detailed pool view
router.get('/:id', async (req, res) => {
    try {
        const poolDoc = await Pool.findById(req.params.id).populate('company_id', 'id name email');
        if (!poolDoc) {
            return res.status(404).json({ error: 'Pool not found' });
        }
        const pool = poolDoc.toJSON();
        // 1 pool funds exactly 1 asset
        const assetDoc = await Asset.findOne({ pool_id: pool.id });
        let asset = null;
        let incomeLogs = [];
        if (assetDoc) {
            asset = assetDoc.toJSON();
            const logs = await IncomeLog.find({ asset_id: assetDoc._id })
                .populate('logged_by', 'id name email')
                .sort({ created_at: -1 });
            incomeLogs = logs.map((l) => l.toJSON());
        }
        // Investments in this pool
        const investments = await Investment.find({ pool_id: pool.id })
            .populate('investor_id', 'id name email')
            .sort({ created_at: -1 });
        // Repayments in this pool
        const repayments = await Repayment.find({ pool_id: pool.id })
            .populate('source_income_log_ids')
            .sort({ created_at: -1 });
        // Transactions associated with this pool
        const transactions = await Transaction.find({ pool_id: pool.id })
            .populate('user_id', 'id name email')
            .sort({ created_at: -1 });
        const sharePrice = calculateSharePrice(pool.total_pool_value, pool.total_shares);
        const progressPercent = Math.min(100, Math.round((pool.total_pool_value / pool.target_amount) * 100));
        const totalRepayments = repayments.reduce((acc, curr) => acc + curr.amount, 0);
        const targetReturn = pool.target_amount * (1 + pool.interest_rate_percent / 100);
        return res.json({
            pool: {
                ...pool,
                company: pool.company_id,
                asset: asset ? { ...asset, income_logs: incomeLogs } : null,
                investments: investments.map((inv) => ({
                    ...inv.toJSON(),
                    investor: inv.investor_id,
                })),
                repayments: repayments.map((r) => r.toJSON()),
                transactions: transactions.map((t) => ({
                    ...t.toJSON(),
                    user: t.user_id,
                })),
                current_share_price: Number(sharePrice.toFixed(4)),
                progress_percent: progressPercent,
                total_repayments_made: totalRepayments,
                target_return: targetReturn,
                can_borrow: (pool.status === 'funding' && pool.total_pool_value >= pool.target_amount) ||
                    (pool.status === 'active' && !pool.borrowed_at),
            },
        });
    }
    catch (error) {
        console.error('Get pool details error:', error);
        return res.status(500).json({ error: 'Failed to retrieve pool details' });
    }
});
// POST /api/pools - Company creates a new funding request
router.post('/', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'company') {
            return res.status(403).json({ error: 'Only companies can create funding pools' });
        }
        const { title, description, target_amount, interest_rate_percent, duration_days, } = req.body;
        if (!title || !description || !target_amount || !interest_rate_percent || !duration_days) {
            return res.status(400).json({ error: 'Missing required pool fields' });
        }
        const target = Number(target_amount);
        const interest = Number(interest_rate_percent);
        const duration = Number(duration_days);
        if (target <= 0 || interest < 0 || duration <= 0) {
            return res.status(400).json({
                error: 'Target amount, interest rate, and duration must be positive values',
            });
        }
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        const pool = await Pool.create({
            company_id: user.id,
            title: title.trim(),
            description: description.trim(),
            target_amount: target,
            interest_rate_percent: interest,
            duration_days: duration,
            status: 'funding',
            total_shares: 0.0,
            total_pool_value: 0.0,
            funding_deadline: deadline,
        });
        return res.status(201).json({
            message: 'Pool created successfully',
            pool: pool.toJSON(),
        });
    }
    catch (error) {
        console.error('Create pool error:', error);
        return res.status(500).json({ error: 'Failed to create pool' });
    }
});
// POST /api/pools/:id/borrow - Company triggers borrow & registers asset
router.post('/:id/borrow', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const poolId = req.params.id;
        const { asset_name, asset_type, asset_description } = req.body;
        if (!asset_name || !asset_type || !asset_description) {
            return res.status(400).json({
                error: 'Asset name, type (vehicle, property, other), and description are required',
            });
        }
        const pool = await Pool.findById(poolId);
        if (!pool) {
            return res.status(404).json({ error: 'Pool not found' });
        }
        if (pool.company_id.toString() !== user.id) {
            return res.status(403).json({ error: 'Only the pool owner company can borrow funds' });
        }
        if (pool.borrowed_at) {
            return res.status(400).json({ error: 'Funds have already been borrowed for this pool' });
        }
        if (pool.total_pool_value < pool.target_amount) {
            return res.status(400).json({
                error: `Pool target of ₹${pool.target_amount.toLocaleString()} has not been reached yet (Raised: ₹${pool.total_pool_value.toLocaleString()})`,
            });
        }
        // SCOPE RULE: One pool funds exactly ONE asset
        const existingAsset = await Asset.findOne({ pool_id: pool._id });
        if (existingAsset) {
            return res.status(400).json({ error: 'An asset has already been registered for this pool' });
        }
        const borrowAmount = pool.total_pool_value;
        // 1. Ledger transfer: credit company wallet
        const companyUser = await User.findById(user.id);
        if (!companyUser) {
            return res.status(404).json({ error: 'Company account not found' });
        }
        companyUser.wallet_balance += borrowAmount;
        await companyUser.save();
        // 2. Record Transaction of type "borrow"
        await Transaction.create({
            user_id: user.id,
            pool_id: pool._id,
            type: 'borrow',
            amount: borrowAmount,
        });
        // 3. Register the single Asset
        const asset = await Asset.create({
            pool_id: pool._id,
            type: asset_type,
            name: asset_name.trim(),
            description: asset_description.trim(),
            status: 'active',
        });
        // 4. Update Pool status to "active" and mark borrowed_at
        // IMPORTANT: total_pool_value stays as a recorded number used for share price calculations
        pool.status = 'active';
        pool.borrowed_at = new Date();
        await pool.save();
        return res.json({
            message: 'Funds borrowed successfully and asset registered',
            pool: pool.toJSON(),
            asset: asset.toJSON(),
            company_wallet_balance: companyUser.wallet_balance,
        });
    }
    catch (error) {
        console.error('Borrow error:', error);
        return res.status(500).json({ error: 'Failed to process borrow request' });
    }
});
export default router;
