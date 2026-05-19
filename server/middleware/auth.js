const jwt = require('jsonwebtoken');
const { tenantStorage } = require('../tenantStorage');

const JWT_SECRET = process.env.JWT_SECRET || 'omniflow-secret-change-in-prod';
const DEV_MODE = process.env.DEV_MODE === 'true' || process.env.NODE_ENV !== 'production';

// Dev-mode admin tenant (works without MongoDB)
const DEV_TENANT = {
    _id: 'dev-admin-001',
    id:  'dev-admin-001',
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@omniflow.app',
    plan: 'enterprise',
    status: 'active',
    trialEnds: new Date('2099-01-01'),
    nextBillingDate: new Date('2099-01-01'),
    cardLastFour: '4242',
    limits: { conversations: 999999999, numbers: 999, members: 999 },
    config: {
        business_name: '', access_token: '', phone_number_id: '',
        verify_token: '', shopify_url: '', shopify_access_token: '',
        server_url: '', catalog_id: '', ai_enabled: false,
        ai_auto_reply: true, ai_instruction: '', language: 'ar',
    },
    applyPlanLimits() {},
    save: async () => {},
    comparePassword: async () => true,
};

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Admin bypass: always works regardless of DEV_MODE
        if (decoded.id === 'dev-admin-001') {
            req.tenant = DEV_TENANT;
            return tenantStorage.run({ tenantId: DEV_TENANT._id.toString() }, () => next());
        }

        // Production: look up in MongoDB
        const Tenant = require('../models/Tenant');
        const tenant = await Tenant.findById(decoded.id).select('-password');
        if (!tenant) return res.status(401).json({ error: 'Tenant not found' });

        if (tenant.status === 'trial' && new Date() > tenant.trialEnds) {
            return res.status(402).json({ error: 'trial_expired', redirect: '/pricing' });
        }
        if (tenant.status === 'cancelled') {
            return res.status(402).json({ error: 'subscription_cancelled', redirect: '/pricing' });
        }

        req.tenant = tenant;
        tenantStorage.run({ tenantId: tenant._id.toString() }, () => next());
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

module.exports = { authMiddleware, signToken, JWT_SECRET, DEV_TENANT, DEV_MODE };
