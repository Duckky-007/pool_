import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import poolRoutes from './routes/pools.js';
import investmentRoutes from './routes/investments.js';
import incomeRoutes from './routes/income.js';
import repaymentRoutes from './routes/repayments.js';
import transactionRoutes from './routes/transactions.js';
import { seedDatabase } from './seed.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
// Middlewares
app.use(cors({
    origin: '*', // Allow frontend requests
    credentials: true,
}));
app.use(express.json());
// Banner / Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        app: 'PoolFund API',
        database: 'MongoDB',
        version: '1.0.0',
        message: 'Demo prototype — not a real financial product. No real money is used.',
    });
});
// Seed API endpoint for instant reset during demos
app.post('/api/seed', async (_req, res) => {
    try {
        await seedDatabase();
        return res.json({ message: 'Database seeded successfully with demo data!' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Seed failed: ' + error.message });
    }
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/assets', incomeRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/transactions', transactionRoutes);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
// Start Server
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 PoolFund API server listening on http://localhost:${PORT}`);
            console.log(`📡 MongoDB Compass Connection: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/poolfund'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}
startServer();
