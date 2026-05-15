const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');

const JWT_SECRET = process.env.JWT_SECRET || 'omniflow-secret-change-in-prod';

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const tenant = await Tenant.findById(decoded.id).select('-password');
        if (!tenant) return res.status(401).json({ error: 'Tenant not found' });

        // Check if trial expired and not subscribed
        if (tenant.status === 'trial' && new Date() > tenant.trialEnds) {
            return res.status(402).json({ error: 'trial_expired', redirect: '/pricing' });
        }
        if (tenant.status === 'cancelled') {
            return res.status(402).json({ error: 'subscription_cancelled', redirect: '/pricing' });
        }

        req.tenant = tenant;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

module.exports = { authMiddleware, signToken, JWT_SECRET };
