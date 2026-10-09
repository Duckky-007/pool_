import { Router, Response } from 'express';
import { Transaction, User } from '../models/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/transactions/my - Get current logged-in user's transactions
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const transactions = await Transaction.find({ user_id: user.id })
      .populate('pool_id', 'title status target_amount')
      .sort({ created_at: -1 });

    return res.json({
      transactions: transactions.map((t) => ({
        ...t.toJSON(),
        pool: t.pool_id,
      })),
    });
  } catch (error: any) {
    console.error('Fetch my transactions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

// GET /api/transactions/all - All transactions for transparent ledger demo
router.get('/all', async (_req, res): Promise<any> => {
  try {
    const transactions = await Transaction.find()
      .populate('user_id', 'name email role')
      .populate('pool_id', 'title status')
      .sort({ created_at: -1 })
      .limit(100);

    return res.json({
      transactions: transactions.map((t) => ({
        ...t.toJSON(),
        user: t.user_id,
        pool: t.pool_id,
      })),
    });
  } catch (error: any) {
    console.error('Fetch all transactions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve ledger transactions' });
  }
});

// POST /api/transactions/faucet - Top up wallet balance for easy demo testing
router.post('/faucet', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const topupAmount = Number(req.body.amount) || 5000;

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    userDoc.wallet_balance += topupAmount;
    await userDoc.save();

    return res.json({
      message: `Added ₹${topupAmount.toLocaleString()} demo funds to your wallet!`,
      wallet_balance: userDoc.wallet_balance,
    });
  } catch (error: any) {
    console.error('Faucet error:', error);
    return res.status(500).json({ error: 'Failed to top up balance' });
  }
});

export default router;

