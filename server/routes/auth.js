const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const { signToken, authMiddleware } = require('../middleware/auth');

const PLANS = {
    starter:    { price: 29,  nameAr: 'المبتدئ',  nameEn: 'Starter'    },
    growth:     { price: 79,  nameAr: 'النمو',    nameEn: 'Growth'     },
    pro:        { price: 149, nameAr: 'الاحترافي', nameEn: 'Pro'        },
    enterprise: { price: 0,   nameAr: 'المؤسسات', nameEn: 'Enterprise' },
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, plan = 'starter' } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email and password are required' });
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const exists = await Tenant.findOne({ email });
        if (exists) return res.status(409).json({ error: 'Email already registered' });

        const tenant = new Tenant({ name, email, password, plan, status: 'trial' });
        tenant.applyPlanLimits();
        await tenant.save();

        const token = signToken(tenant._id);
        res.status(201).json({
            token,
            tenant: {
                id: tenant._id, name: tenant.name, email: tenant.email,
                plan: tenant.plan, status: tenant.status,
                trialEnds: tenant.trialEnds, limits: tenant.limits,
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const tenant = await Tenant.findOne({ email });
        if (!tenant || !(await tenant.comparePassword(password)))
            return res.status(401).json({ error: 'Invalid email or password' });

        const token = signToken(tenant._id);
        res.json({
            token,
            tenant: {
                id: tenant._id, name: tenant.name, email: tenant.email,
                plan: tenant.plan, status: tenant.status,
                trialEnds: tenant.trialEnds, limits: tenant.limits,
                config: tenant.config,
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    const t = req.tenant;
    res.json({
        id: t._id, name: t.name, email: t.email,
        plan: t.plan, status: t.status,
        trialEnds: t.trialEnds, limits: t.limits,
        cardLastFour: t.cardLastFour, nextBillingDate: t.nextBillingDate,
        config: t.config,
    });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
    const { current, newPassword } = req.body;
    const tenant = await Tenant.findById(req.tenant._id);
    if (!(await tenant.comparePassword(current)))
        return res.status(401).json({ error: 'Current password incorrect' });
    tenant.password = newPassword;
    await tenant.save();
    res.json({ success: true });
});

module.exports = router;
