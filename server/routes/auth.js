const express = require('express');
const router = express.Router();
const { signToken, authMiddleware, DEV_TENANT } = require('../middleware/auth');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@omniflow.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

// ── Helper: try to load Mongoose Tenant (won't exist if MongoDB is down) ──────
let Tenant = null;
try { Tenant = require('../models/Tenant'); } catch (_) {}

// ── Admin bypass: always works regardless of MongoDB ─────────────────────────
function isAdminCreds(email, password) {
    return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, plan = 'starter' } = req.body;

    // Admin shortcut
    if (isAdminCreds(email, password)) {
        const token = signToken('dev-admin-001');
        return res.status(201).json({ token, tenant: { ...DEV_TENANT, id: DEV_TENANT._id } });
    }

    if (!Tenant) return res.status(503).json({ error: 'Database not available' });
    try {
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        const exists = await Tenant.findOne({ email });
        if (exists) return res.status(409).json({ error: 'Email already registered' });
        const tenant = new Tenant({ name, email, password, plan, status: 'trial' });
        tenant.applyPlanLimits();
        await tenant.save();
        const token = signToken(tenant._id);
        res.status(201).json({ token, tenant: { id: tenant._id, name: tenant.name, email: tenant.email, plan: tenant.plan, status: tenant.status, trialEnds: tenant.trialEnds, limits: tenant.limits } });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Registration failed' }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};

    // Admin bypass — always works
    if (isAdminCreds(email, password)) {
        const token = signToken('dev-admin-001');
        return res.json({ token, tenant: { ...DEV_TENANT, id: DEV_TENANT._id } });
    }

    if (!Tenant) return res.status(503).json({ error: 'Database not available' });
    try {
        const tenant = await Tenant.findOne({ email });
        if (!tenant || !(await tenant.comparePassword(password)))
            return res.status(401).json({ error: 'Invalid email or password' });
        const token = signToken(tenant._id);
        res.json({ token, tenant: { id: tenant._id, name: tenant.name, email: tenant.email, plan: tenant.plan, status: tenant.status, trialEnds: tenant.trialEnds, limits: tenant.limits, config: tenant.config } });
    } catch (e) { res.status(500).json({ error: 'Login failed' }); }
});

// POST /api/auth/auto-reconnect — silently re-issue JWT using stored shpat_ token
router.post('/auto-reconnect', async (req, res) => {
    if (!Tenant) return res.status(503).json({ error: 'Database not available' });

    let { shop } = req.body || {};
    if (!shop || typeof shop !== 'string')
        return res.status(400).json({ error: 'shop is required' });

    shop = shop.replace(/https?:\/\//i, '').replace(/\/$/, '').trim().toLowerCase();
    if (!shop.includes('.myshopify.com'))
        return res.status(400).json({ error: 'Invalid shop domain' });

    try {
        const tenant = await Tenant.findOne({
            $or: [
                { 'config.shopify_url': `https://${shop}` },
                { 'config.shopify_url': shop },
            ]
        });

        if (!tenant)
            return res.status(401).json({ error: 'reconnect_failed', reason: 'shop_not_found' });

        const storedToken = tenant.config?.shopify_access_token || '';
        if (!storedToken || !storedToken.startsWith('shpat_'))
            return res.status(401).json({ error: 'reconnect_failed', reason: 'no_shpat_token' });

        // Validate token is still accepted by Shopify
        const axiosLib = require('axios');
        try {
            await axiosLib.get(`https://${shop}/admin/api/2024-01/shop.json`, {
                headers: { 'X-Shopify-Access-Token': storedToken },
                timeout: 8000,
            });
        } catch (shopifyErr) {
            const status = shopifyErr.response?.status;
            if (status === 401 || status === 403)
                return res.status(401).json({ error: 'reconnect_failed', reason: 'token_invalid' });
            // Network blips are non-fatal — still issue JWT
            console.warn(`[auto-reconnect] Shopify check non-fatal (${status}):`, shopifyErr.message);
        }

        const token = signToken(tenant._id);
        const tenantData = {
            id: tenant._id, name: tenant.name, email: tenant.email,
            plan: tenant.plan, status: tenant.status, trialEnds: tenant.trialEnds,
            limits: tenant.limits, config: tenant.config,
            shopifyChargeId: tenant.shopifyChargeId,
            shopifyChargeStatus: tenant.shopifyChargeStatus,
        };
        console.log(`[auto-reconnect] Issued fresh JWT for ${shop} / tenant ${tenant._id}`);
        res.json({ token, tenant: tenantData });

    } catch (e) {
        console.error('[auto-reconnect] Error:', e.message);
        res.status(500).json({ error: 'reconnect_failed', reason: 'server_error' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    const t = req.tenant;
    res.json({ id: t._id, name: t.name, email: t.email, plan: t.plan, status: t.status, trialEnds: t.trialEnds, limits: t.limits, cardLastFour: t.cardLastFour, nextBillingDate: t.nextBillingDate, config: t.config, shopifyChargeId: t.shopifyChargeId, shopifyChargeStatus: t.shopifyChargeStatus });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
    if (req.tenant._id === 'dev-admin-001') return res.json({ success: true });
    if (!Tenant) return res.status(503).json({ error: 'Database not available' });
    const { current, newPassword } = req.body;
    const tenant = await Tenant.findById(req.tenant._id);
    if (!(await tenant.comparePassword(current))) return res.status(401).json({ error: 'Current password incorrect' });
    tenant.password = newPassword;
    await tenant.save();
    res.json({ success: true });
});

module.exports = router;
