import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
const router = Router();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required' });
        }
        if (role !== 'investor' && role !== 'company') {
            return res.status(400).json({ error: 'Role must be either "investor" or "company"' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password_hash,
            role,
            wallet_balance: 10000.0, // Demo starting balance
        });
        const token = generateToken({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                wallet_balance: user.wallet_balance,
                created_at: user.created_at,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Server error during registration' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = generateToken({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                wallet_balance: user.wallet_balance,
                created_at: user.created_at,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error during login' });
    }
});
// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Me endpoint error:', error);
        return res.status(500).json({ error: 'Server error fetching user profile' });
    }
});
// GET /api/auth/demo-users (Useful for 1-click switch & demo testing)
router.get('/demo-users', async (_req, res) => {
    try {
        const users = await User.find().select('-password_hash').sort({ created_at: 1 });
        return res.json({ users });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to retrieve demo users' });
    }
});
export default router;
