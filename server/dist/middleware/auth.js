import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'poolfund_secret_key_demo_2026';
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
}
export function generateToken(user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    }, JWT_SECRET, { expiresIn: '7d' });
}
