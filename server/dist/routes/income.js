import { Router } from 'express';
import { Asset, IncomeLog, Pool } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
// POST /api/assets/:id/income - Company logs income for an asset
router.post('/:id/income', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const assetId = req.params.id;
        const { amount_earned, period_label } = req.body;
        if (user.role !== 'company') {
            return res.status(403).json({ error: 'Only companies can log income' });
        }
        const amount = Number(amount_earned);
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Please enter a valid earned amount greater than zero' });
        }
        if (!period_label || !period_label.trim()) {
            return res.status(400).json({ error: 'Period label is required (e.g. "Week of Oct 6")' });
        }
        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        // Verify company ownership via Pool
        const pool = await Pool.findById(asset.pool_id);
        if (!pool || pool.company_id.toString() !== user.id) {
            return res.status(403).json({ error: 'You are not authorized to log income for this asset' });
        }
        const log = await IncomeLog.create({
            asset_id: asset._id,
            amount_earned: amount,
            period_label: period_label.trim(),
            logged_by: user.id,
            converted_to_repayment: false,
        });
        return res.status(201).json({
            message: 'Income logged successfully',
            income_log: log.toJSON(),
        });
    }
    catch (error) {
        console.error('Log income error:', error);
        return res.status(500).json({ error: 'Failed to log income' });
    }
});
// GET /api/assets/:id/income - Get all income logs for an asset
router.get('/:id/income', async (req, res) => {
    try {
        const assetId = req.params.id;
        const logs = await IncomeLog.find({ asset_id: assetId })
            .populate('logged_by', 'id name email')
            .sort({ created_at: -1 });
        return res.json({ income_logs: logs.map((l) => l.toJSON()) });
    }
    catch (error) {
        console.error('Fetch income logs error:', error);
        return res.status(500).json({ error: 'Failed to retrieve income logs' });
    }
});
export default router;
