const express = require('express');
const router = express.Router();
const axios = require('axios');
const Tenant = require('../models/Tenant');
const { authMiddleware } = require('../middleware/auth');

const PAYMOB_API_KEY   = process.env.PAYMOB_API_KEY   || '';
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || '';
const PAYMOB_INT_ID    = process.env.PAYMOB_INTEGRATION_ID || '';
const PAYMOB_HMAC      = process.env.PAYMOB_HMAC_SECRET || '';
const BASE_URL         = process.env.SERVER_URL || 'http://localhost:8765';

const PLANS = {
    starter:    { price_cents: 2900  * 100, nameEn: 'Starter',    nameAr: 'المبتدئ'  },
    growth:     { price_cents: 7900  * 100, nameEn: 'Growth',     nameAr: 'النمو'    },
    pro:        { price_cents: 14900 * 100, nameEn: 'Pro',        nameAr: 'الاحترافي'},
};

// Step 1: Auth token from PayMob
async function getAuthToken() {
    const r = await axios.post('https://accept.paymob.com/api/auth/tokens', { api_key: PAYMOB_API_KEY });
    return r.data.token;
}

// Step 2: Create order
async function createOrder(authToken, amountCents, tenantId, plan) {
    const r = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        merchant_order_id: `${tenantId}-${plan}-${Date.now()}`,
        items: [{ name: `OmniFlow ${plan}`, amount_cents: amountCents, description: `OmniFlow ${plan} monthly`, quantity: 1 }],
    });
    return r.data.id;
}

// Step 3: Payment key
async function getPaymentKey(authToken, orderId, amountCents, tenant, plan) {
    const r = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
            first_name: tenant.name.split(' ')[0] || 'User',
            last_name:  tenant.name.split(' ')[1] || 'Client',
            email: tenant.email,
            phone_number: '+201000000000',
            country: 'EG',
            city: 'Cairo',
            street: 'NA',
            floor: 'NA',
            building: 'NA',
            apartment: 'NA',
        },
        currency: 'EGP',
        integration_id: Number(PAYMOB_INT_ID),
        lock_order_when_paid: false,
    });
    return r.data.token;
}

// POST /api/paymob/checkout  — initiate payment (trial card registration)
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const { plan } = req.body;
        const planData = PLANS[plan];
        if (!planData) return res.status(400).json({ error: 'Invalid plan' });

        const authToken = await getAuthToken();
        // For trial: charge 1 EGP to verify card, refund later — or use 0 amount with recurring
        const amountCents = planData.price_cents;
        const orderId = await createOrder(authToken, amountCents, req.tenant._id, plan);
        const paymentKey = await getPaymentKey(authToken, orderId, amountCents, req.tenant, plan);

        // Update tenant with selected plan (pending payment)
        await Tenant.findByIdAndUpdate(req.tenant._id, { plan });

        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
        res.json({ iframeUrl, paymentKey, orderId });
    } catch (e) {
        console.error('PayMob checkout error:', e.response?.data || e.message);
        res.status(500).json({ error: 'Payment initiation failed' });
    }
});

// POST /api/paymob/webhook  — PayMob callback
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
    try {
        const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const obj = data.obj || data;

        if (obj.success && obj.order?.merchant_order_id) {
            const [tenantId, plan] = obj.order.merchant_order_id.split('-');
            const tenant = await Tenant.findById(tenantId);
            if (tenant) {
                tenant.plan = plan;
                tenant.status = 'active';
                tenant.cardLastFour = obj.source_data?.pan?.slice(-4) || '';
                tenant.cardToken = obj.token || '';
                tenant.paymobSubId = String(obj.id);
                tenant.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                tenant.applyPlanLimits();
                await tenant.save();
            }
        }
        res.json({ received: true });
    } catch (e) {
        console.error('PayMob webhook error:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/paymob/cancel — cancel subscription
router.post('/cancel', authMiddleware, async (req, res) => {
    await Tenant.findByIdAndUpdate(req.tenant._id, { status: 'cancelled' });
    res.json({ success: true, message: 'Subscription cancelled' });
});

// GET /api/paymob/plans — return plan info
router.get('/plans', (req, res) => {
    res.json({
        starter:    { price: 29,  priceEGP: 1450, nameEn: 'Starter',    nameAr: 'المبتدئ',   conversations: 1000,   numbers: 1,  members: 2   },
        growth:     { price: 79,  priceEGP: 3950, nameEn: 'Growth',     nameAr: 'النمو',     conversations: 5000,   numbers: 3,  members: 10  },
        pro:        { price: 149, priceEGP: 7450, nameEn: 'Pro',        nameAr: 'الاحترافي', conversations: 999999, numbers: 10, members: 999 },
        enterprise: { price: 0,   priceEGP: 0,    nameEn: 'Enterprise', nameAr: 'المؤسسات', conversations: -1,     numbers: -1, members: -1  },
    });
});

module.exports = router;
