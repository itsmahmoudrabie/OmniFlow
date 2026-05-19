const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authMiddleware, DEV_TENANT } = require('../middleware/auth');
const { getShopToken, loadShops } = require('../shopify-oauth');

let Tenant = null;
try { Tenant = require('../models/Tenant'); } catch (_) {}

const SHOPIFY_API_VERSION = '2024-01';
const APP_URL = () => process.env.SHOPIFY_APP_URL || process.env.HOST || '';

const PLAN_PRICES = {
    starter: { name: 'OmniFlow Starter', price: '29.00' },
    growth:  { name: 'OmniFlow Growth',  price: '79.00' },
    pro:     { name: 'OmniFlow Pro',     price: '149.00' },
};

// GET /api/billing/status — returns current plan, status, trial days remaining
router.get('/status', authMiddleware, async (req, res) => {
    const t = req.tenant;
    const trialDaysLeft = t.trialEnds
        ? Math.max(0, Math.ceil((new Date(t.trialEnds) - Date.now()) / 86400000))
        : 0;
    res.json({
        plan: t.plan,
        status: t.status,
        trialEnds: t.trialEnds,
        trialDaysLeft,
        shopifyChargeId: t.shopifyChargeId,
        shopifyChargeStatus: t.shopifyChargeStatus,
    });
});

// POST /api/billing/create-charge — create Shopify recurring charge, return confirmation URL
router.post('/create-charge', authMiddleware, async (req, res) => {
    const { plan } = req.body;
    if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const t = req.tenant;
    // Get shop from tenant or from shops.json
    let shop = t.shopifyShop || t.config?.shopify_url?.replace('https://', '');
    if (!shop) {
        // Try to find from shops.json — pick first installed shop
        const shops = loadShops();
        shop = Object.keys(shops)[0];
    }
    if (!shop) return res.status(400).json({ error: 'No Shopify store connected' });

    const accessToken = getShopToken(shop);
    if (!accessToken) return res.status(400).json({ error: 'Shop not authenticated' });

    const returnUrl = `${APP_URL()}/api/billing/callback?tenant_id=${t._id}&plan=${plan}`;

    try {
        const { data } = await axios.post(
            `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/recurring_application_charges.json`,
            {
                recurring_application_charge: {
                    name: PLAN_PRICES[plan].name,
                    price: PLAN_PRICES[plan].price,
                    return_url: returnUrl,
                    trial_days: 7,
                    test: process.env.NODE_ENV !== 'production', // test mode in dev
                }
            },
            { headers: { 'X-Shopify-Access-Token': accessToken } }
        );
        const charge = data.recurring_application_charge;
        // Save pending charge to tenant
        if (Tenant && t._id !== 'dev-admin-001') {
            await Tenant.findByIdAndUpdate(t._id, {
                shopifyChargeId: String(charge.id),
                shopifyChargeStatus: 'pending',
                shopifyShop: shop,
            });
        }
        res.json({ confirmation_url: charge.confirmation_url, charge_id: charge.id });
    } catch (err) {
        console.error('[Billing] Create charge error:', err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data?.errors || 'Failed to create charge' });
    }
});

// GET /api/billing/callback — Shopify redirects here after merchant confirms
router.get('/callback', async (req, res) => {
    const { charge_id, tenant_id, plan } = req.query;
    if (!charge_id || !tenant_id || !plan) return res.status(400).send('Missing params');

    let tenant = null;
    if (Tenant) {
        tenant = await Tenant.findById(tenant_id).catch(() => null);
    }

    // Get shop
    let shop = tenant?.shopifyShop;
    if (!shop) {
        const shops = loadShops();
        shop = Object.keys(shops)[0];
    }
    if (!shop) return res.status(400).send('No shop found');

    const accessToken = getShopToken(shop);
    if (!accessToken) return res.status(400).send('Shop not authenticated');

    try {
        // Activate the charge
        const { data } = await axios.post(
            `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/recurring_application_charges/${charge_id}/activate.json`,
            { recurring_application_charge: { id: Number(charge_id) } },
            { headers: { 'X-Shopify-Access-Token': accessToken } }
        );
        const charge = data.recurring_application_charge;

        if (tenant && charge.status === 'active') {
            tenant.plan = plan;
            tenant.status = 'active';
            tenant.shopifyChargeId = String(charge_id);
            tenant.shopifyChargeStatus = 'active';
            tenant.applyPlanLimits();
            await tenant.save();
        }

        // Issue new JWT and redirect to dashboard
        const { signToken } = require('../middleware/auth');
        const jwt = tenant ? signToken(tenant._id) : signToken('dev-admin-001');
        res.redirect(`/#shopify_token=${encodeURIComponent(jwt)}&plan_activated=${plan}`);
    } catch (err) {
        console.error('[Billing] Activate charge error:', err.response?.data || err.message);
        res.redirect('/#billing_error=1');
    }
});

module.exports = router;
