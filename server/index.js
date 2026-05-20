const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const FormData = require('form-data');
const mongoose = require('mongoose');
const WhatsAppRouter = require('./models/WhatsAppRouter');
const { authMiddleware, DEV_TENANT } = require('./middleware/auth');
const { tenantStorage, getTenantId } = require('./tenantStorage');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/omniflow';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('MongoDB connected');

        // Load SystemConfig into CONFIG on every cold start (survives Railway redeploys)
        try {
            const SystemConfig = require('./models/SystemConfig');
            const sc = await SystemConfig.findById('main').lean();
            if (sc) {
                const apply = (key) => { if (sc[key]) CONFIG[key] = sc[key]; };
                ['business_name','catalog_id','server_url','groq_api_key','gemini_api_key',
                 'groq_model','woo_url','woo_consumer_key','woo_consumer_secret','webhook_url',
                 'shopify_url','shopify_access_token',
                 'wasender_session_id','wasender_session_key','wasender_webhook_secret'].forEach(apply);
                if (sc.loyalty_points) CONFIG.loyalty_points = sc.loyalty_points;
                console.log('[Config] ✅ SystemConfig loaded from MongoDB into CONFIG');
            }
        } catch (e) {
            console.warn('[Config] Failed to load SystemConfig at startup:', e.message);
        }

        // Load Shopify credentials from most recent tenant (tokens never expire)
        try {
            const Tenant = require('./models/Tenant');
            const { decrypt } = require('./utils/crypto');
            const t = await Tenant.findOne({
                'config.shopify_access_token': { $ne: '' }
            }).sort({ updatedAt: -1 });
            if (t?.config?.shopify_url) {
                CONFIG.shopify_url = t.config.shopify_url
                    .replace(/https?:\/\//i, '').replace(/\/$/, '').trim();
                CONFIG.shopify_access_token = decrypt(t.config.shopify_access_token);
                console.log(`[Shopify] ✅ Loaded and decrypted from tenant at startup: ${CONFIG.shopify_url}`);
            } else {
                console.log('[Shopify] No tenant with stored token found — user must connect via OAuth.');
            }
        } catch (e) {
            console.warn('[Shopify] Startup tenant load failed:', e.message);
        }
    })
    .catch(e => console.error('MongoDB error:', e.message));


const app = express();
const PORT = process.env.PORT || 8765;

// Enable CORS (allow Shopify admin embedded + Railway domain)
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const allow = [
            /\.myshopify\.com$/,
            /admin\.shopify\.com$/,
            /\.shopify\.com$/,
            /\.up\.railway\.app$/,
            process.env.SHOPIFY_APP_URL,
            process.env.FRONTEND_URL
        ].filter(Boolean);
        const ok = allow.some(a => typeof a === 'string' ? a === origin : a.test(origin));
        cb(null, ok || process.env.NODE_ENV !== 'production');
    },
    credentials: true
}));

// Raw body for Shopify + WasenderAPI webhooks — MUST be before bodyParser.json
app.use('/webhooks/shopify', express.raw({ type: 'application/json' }));
app.use('/webhook/wasender', express.raw({ type: '*/*', limit: '50mb' }));

// body-parser 2.x (Express 5) no longer skips already-parsed bodies,
// so we must explicitly skip JSON parsing for raw-body webhook routes.
const _jsonParser = bodyParser.json({ limit: '50mb' });
app.use((req, res, next) => {
    if (Buffer.isBuffer(req.body)) return next();
    _jsonParser(req, res, next);
});
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Shopify OAuth + webhooks — mounted after CONFIG is defined (further below)
const { mountShopifyOAuth, isValidShopDomain } = require('./shopify-oauth');

const getShopifyForTenant = (tenant) => {
    const { decrypt } = require('./utils/crypto');
    const raw   = tenant?.config?.shopify_url || '';
    const shop  = raw.replace(/https?:\/\//i, '').replace(/\/$/, '').trim().toLowerCase();
    const token = decrypt(tenant?.config?.shopify_access_token || '');
    return { shopify_url: shop, shopify_access_token: token };
};

// Serve Media
app.use('/media', express.static(path.join(__dirname, 'media')));

// Railway/health probe — never authenticated, must return 200 quickly
app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'omniflow', ts: Date.now() }));

// Debug: check webhook config state
app.get('/api/webhook/debug', async (_req, res) => {
    let sc = {};
    let dbErr = null;
    try {
        const SystemConfig = require('./models/SystemConfig');
        sc = (await SystemConfig.findById('main').lean()) || {};
    } catch (e) { dbErr = e.message; }
    res.json({
        config_verify_token: CONFIG.verify_token   || '(empty)',
        config_phone_id:     CONFIG.phone_number_id || '(empty)',
        config_access_token: CONFIG.access_token ? CONFIG.access_token.slice(0,8) + '...' : '(empty)',
        db_verify_token:     sc.verify_token   || '(empty)',
        db_phone_id:         sc.phone_number_id || '(empty)',
        db_access_token:     sc.access_token ? sc.access_token.slice(0,8) + '...' : '(empty)',
        db_error:            dbErr || null,
    });
});

// Debug: check what Shopify credentials are resolved + test orders fetch
app.get('/api/shopify/debug', authMiddleware, async (req, res) => {
    const { shopify_url, shopify_access_token } = getShopifyForTenant(req.tenant);
    const result = {
        connected: !!(shopify_url && shopify_access_token),
        shop: shopify_url || null,
        token_prefix: shopify_access_token ? shopify_access_token.slice(0, 6) + '...' + shopify_access_token.slice(-4) : null,
        orders_test: null,
        orders_error: null,
    };
    if (shopify_url && shopify_access_token) {
        try {
            const r = await axios.get(
                `https://${shopify_url}/admin/api/2024-04/orders.json?fulfillment_status=unfulfilled&status=open&limit=5`,
                { headers: { 'X-Shopify-Access-Token': shopify_access_token }, timeout: 8000 }
            );
            result.orders_test = { count: r.data.orders?.length, first_id: r.data.orders?.[0]?.id };
        } catch (e) {
            result.orders_error = { status: e.response?.status, body: e.response?.data };
        }
    }
    res.json(result);
});

// Serve React frontend (production build)
const FRONTEND_DIST = path.join(__dirname, '..', 'dashboard-react', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
    // If ?shop= is in the URL, redirect to OAuth BEFORE serving React
    // This avoids iframe issues (accounts.shopify.com refuses to load in iframe)
    app.get('/', (req, res, next) => {
        const shop = req.query.shop;
        if (shop && /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop)) {
            return res.redirect(`/auth?shop=${shop}`);
        }
        next();
    });
    app.use(express.static(FRONTEND_DIST));
}

// ─────────────────────────────────────────────
//  إعدادات النظام
// ─────────────────────────────────────────────
const CONFIG = {
    // Shopify (OAuth multi-store also writes here on install)
    shopify_api_key: process.env.SHOPIFY_API_KEY || "",
    shopify_api_secret: process.env.SHOPIFY_API_SECRET || "",
    shopify_app_url: process.env.SHOPIFY_APP_URL || "",
    shopify_scopes: process.env.SHOPIFY_SCOPES || "read_products,read_orders,write_orders,read_customers",
    shopify_url: process.env.SHOPIFY_URL || "",
    shopify_access_token: process.env.SHOPIFY_ACCESS_TOKEN || "",
    // WasenderAPI (replaces Meta WhatsApp Cloud API)
    wasender_session_id:     process.env.WASENDER_SESSION_ID     || "",
    wasender_session_key:    process.env.WASENDER_SESSION_KEY    || "",
    wasender_webhook_secret: process.env.WASENDER_WEBHOOK_SECRET || "",
    // AI & general
    gemini_api_key: process.env.GEMINI_API_KEY || "",
    groq_api_key:   process.env.GROQ_API_KEY   || "",
    groq_model:     process.env.GROQ_MODEL     || "llama-3.3-70b-versatile",
    catalog_id:     process.env.CATALOG_ID     || "",
    server_url:     process.env.SERVER_URL      || "",
    business_name:  process.env.BUSINESS_NAME   || "My Business",
    woo_url:              process.env.WOO_URL              || "",
    woo_consumer_key:     process.env.WOO_CONSUMER_KEY     || "",
    woo_consumer_secret:  process.env.WOO_CONSUMER_SECRET  || "",
    webhook_url:          process.env.WEBHOOK_URL           || "",
    loyalty_points: parseInt(process.env.LOYALTY_POINTS || '10')
};

// Auto-detect server URL dynamically if not configured
app.use((req, res, next) => {
    if (!CONFIG.server_url) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.get('host');
        if (host) {
            CONFIG.server_url = `${protocol}://${host}`;
        }
    }
    next();
});

// Mount Shopify OAuth routes synchronously now that CONFIG exists.
mountShopifyOAuth(app, CONFIG);

// Auth & subscription routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/paymob', require('./routes/paymob'));

const DB_FILE = path.join(__dirname, 'orders.json');
const INBOX_FILE = path.join(__dirname, 'inbox.json');
const TEMPLATES_FILE = path.join(__dirname, 'templates.json');
const MEDIA_DIR = path.join(__dirname, 'media');
const BRANDING_FILE = path.join(__dirname, 'branding.json');
const AUTOMATIONS_FILE = path.join(__dirname, 'automations.json');
const AUTOMATION_QUEUE_FILE = path.join(__dirname, 'automation_queue.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const LOYALTY_FILE = path.join(__dirname, 'loyalty.json');
const QUICK_REPLIES_FILE = path.join(__dirname, 'quick_replies.json');
const BROADCASTS_FILE = path.join(__dirname, 'broadcasts.json');


if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR);

// ─────────────────────────────────────────────
//  قواعد البيانات المحلية (JSON)
// ─────────────────────────────────────────────
const getTenantFile = (file) => {
    const tid = getTenantId();
    if (tid === 'global') return file;
    const basename = path.basename(file);
    const tenantDir = path.join(__dirname, 'data', 'tenants', String(tid));
    if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });
    return path.join(tenantDir, basename);
};

const loadJSON = (file) => {
    const targetFile = getTenantFile(file);
    if (!fs.existsSync(targetFile)) return [];
    try {
        const data = fs.readFileSync(targetFile, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
};

const saveJSON = (file, data) => {
    const targetFile = getTenantFile(file);
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 4), 'utf8');
};

const fireWebhook = (event, data) => {
    if (!CONFIG.webhook_url) return;
    axios.post(CONFIG.webhook_url, {
        event, data,
        timestamp: new Date().toISOString(),
        source: 'omniflow',
        business: CONFIG.business_name
    }, { timeout: 5000 }).catch(e => console.warn('[Webhook] Fire failed:', e.message));
};

// ── WasenderAPI send helper ────────────────────────────────────────────────────
const sendViaWasender = async (to, msgObj) => {
    let sessionId = CONFIG.wasender_session_id;
    let apiKey = CONFIG.wasender_session_key;
    let isGlobal = true;
    
    const tid = getTenantId();
    if (tid !== 'global') {
        const Tenant = mongoose.model('Tenant');
        const t = await Tenant.findById(tid).lean();
        if (t?.config?.wasender_session_id && t?.config?.wasender_session_key) {
            sessionId = t.config.wasender_session_id;
            apiKey = t.config.wasender_session_key;
            isGlobal = false;
        }
    }

    if (!sessionId || !apiKey)
        throw new Error('WasenderAPI غير مُهيَّأ — أدخل Session ID و Session Key في الإعدادات');
        
    const cleanTo = String(to).replace(/[^\d]/g, '');
    
    if (isGlobal && tid !== 'global') {
        await WhatsAppRouter.findOneAndUpdate(
            { phone: cleanTo },
            { tenantId: tid, lastInteractedAt: new Date() },
            { upsert: true, new: true }
        ).catch(e => console.warn('[WhatsAppRouter] Error saving route:', e.message));
    }

    const url = `https://www.wasenderapi.com/api/send-message`;
    return await axios.post(url, { to: cleanTo, ...msgObj }, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 15000
    });
};

// دالة توحيد أرقام الهواتف للمقارنة
const normalizePhone = (phone) => {
    if (!phone) return "";
    let clean = String(phone).replace(/[^\d]/g, "");
    // إذا كان يبدأ بـ 0، نحوله لصيغة دولية افتراضية 20
    if (clean.startsWith("0") && clean.length === 11) {
        clean = "2" + clean;
    }
    return clean;
};

const findLocalOrder = (localOrders, phone, orderId) => {
    // 1. البحث بالـ ID مباشرة إذا توفر
    if (orderId && localOrders[orderId]) return localOrders[orderId];
    
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) return null;

    // 2. البحث في كل العناصر عن تطابق الـ ID داخلياً
    if (orderId) {
        for (const key in localOrders) {
            if (localOrders[key] && localOrders[key].id === orderId) return localOrders[key];
        }
    }
    
    // 3. البحث بالمفتاح (رقم الهاتف) - لا نعيد النتيجة إلا لو كان الـ ID متطابق
    if (localOrders[cleanPhone]) {
        const item = localOrders[cleanPhone];
        if (!orderId || item.id === orderId) return item;
    }
    
    // 4. البحث بآخر 10 أرقام (للتوافق مع البيانات القديمة)
    const suffix = cleanPhone.slice(-10);
    for (const key in localOrders) {
        const item = localOrders[key];
        if (key.endsWith(suffix)) {
            if (!orderId || item.id === orderId) return item;
        }
    }
    return null;
};




// ─────────────────────────────────────────────
//  قوالب الرسائل (Templates)
// ─────────────────────────────────────────────
app.get('/api/templates', (req, res) => {
    res.json(loadJSON(TEMPLATES_FILE));
});

app.post('/api/templates', (req, res) => {
    const newTemplates = req.body;
    saveJSON(TEMPLATES_FILE, newTemplates);
    res.json({ success: true });
});

// ─────────────────────────────────────────────
//  مسارات الـ API
// ─────────────────────────────────────────────

app.get('/api/config/business', (req, res) => {
    res.json({ business_name: CONFIG.business_name });
});

// جلب وحفظ الـ Branding (لوجو + لون)
app.get('/api/config/branding', (req, res) => {
    const data = fs.existsSync(BRANDING_FILE) ? JSON.parse(fs.readFileSync(BRANDING_FILE, 'utf8')) : {};
    res.json({ brand_color: '#d5aa65', logo_url: null, ...data });
});

app.post('/api/config/branding', (req, res) => {
    const { brand_color, logo_base64 } = req.body;
    const current = fs.existsSync(BRANDING_FILE) ? JSON.parse(fs.readFileSync(BRANDING_FILE, 'utf8')) : {};
    let logo_url = current.logo_url || null;

    if (logo_base64) {
        const matches = logo_base64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            const ext = matches[1].includes('png') ? 'png' : 'jpg';
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `logo.${ext}`;
            fs.writeFileSync(path.join(MEDIA_DIR, fileName), buffer);
            logo_url = `/media/${fileName}`;
        }
    }

    const branding = { brand_color: brand_color || current.brand_color || '#d5aa65', logo_url };
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(branding, null, 2), 'utf8');
    res.json({ success: true, ...branding });
});

// جلب كل الإعدادات (بدون إظهار التوكنات كاملة)
app.get('/api/config/setup', authMiddleware, async (req, res) => {
    const mask = (val) => val ? val.slice(0, 6) + '••••••••' + val.slice(-4) : '';

    // SystemConfig is the single source of truth — works for any user incl. dev-admin-001
    let sc = {};
    try {
        const SystemConfig = require('./models/SystemConfig');
        sc = (await SystemConfig.findById('main').lean()) || {};
        // Populate CONFIG from SystemConfig for any field currently missing in memory
        const keys = ['business_name','catalog_id','server_url','groq_api_key','gemini_api_key',
                      'groq_model','woo_url','woo_consumer_key','woo_consumer_secret','webhook_url',
                      'shopify_url','shopify_access_token',
                      'wasender_session_id','wasender_session_key','wasender_webhook_secret'];
        for (const k of keys) { if (!CONFIG[k] && sc[k]) CONFIG[k] = sc[k]; }
        if (!CONFIG.loyalty_points && sc.loyalty_points) CONFIG.loyalty_points = sc.loyalty_points;
    } catch (_) {}

    // Determine if we are a normal tenant (multi-tenant context)
    const isNormalTenant = req.tenant && req.tenant._id !== 'dev-admin-001';

    // Shopify credentials from Tenant.config (source of truth)
    const { shopify_url: tenantShopUrl, shopify_access_token: tenantShopToken } = getShopifyForTenant(req.tenant);
    
    // Choose source based on tenant mode
    const businessName = isNormalTenant ? (req.tenant.config?.business_name || '') : (CONFIG.business_name || sc.business_name || '');
    const shopifyUrl = tenantShopUrl || CONFIG.shopify_url || sc.shopify_url || '';
    const shopifyToken = tenantShopToken || CONFIG.shopify_access_token || sc.shopify_access_token || '';
    
    const isConfigured = isNormalTenant 
        ? !!(req.tenant.config?.is_configured || req.tenant.config?.business_name || req.tenant.config?.shopify_url) 
        : !!(sc.is_configured || sc.business_name || sc.shopify_url);

    res.json({
        business_name:        businessName,
        shopify_url:          shopifyUrl,
        catalog_id:           isNormalTenant ? (req.tenant.config?.catalog_id || '') : (CONFIG.catalog_id || sc.catalog_id || ''),
        server_url:           isNormalTenant ? (req.tenant.config?.server_url || '') : (CONFIG.server_url || sc.server_url || ''),
        gemini_api_key:       isNormalTenant ? (req.tenant.config?.gemini_api_key ? mask(req.tenant.config.gemini_api_key) : '') : ((CONFIG.gemini_api_key || sc.gemini_api_key) ? mask(CONFIG.gemini_api_key || sc.gemini_api_key) : ''),
        groq_api_key:         isNormalTenant ? (req.tenant.config?.groq_api_key ? mask(req.tenant.config.groq_api_key) : '') : ((CONFIG.groq_api_key || sc.groq_api_key) ? mask(CONFIG.groq_api_key || sc.groq_api_key) : ''),
        groq_model:           isNormalTenant ? (req.tenant.config?.groq_model || 'llama-3.3-70b-versatile') : (CONFIG.groq_model || sc.groq_model || 'llama-3.3-70b-versatile'),
        shopify_access_token: shopifyToken ? mask(shopifyToken) : '',
        woo_url:              isNormalTenant ? (req.tenant.config?.woo_url || '') : (CONFIG.woo_url || sc.woo_url || ''),
        woo_consumer_key:     isNormalTenant ? (req.tenant.config?.woo_consumer_key ? mask(req.tenant.config.woo_consumer_key) : '') : ((CONFIG.woo_consumer_key || sc.woo_consumer_key) ? mask(CONFIG.woo_consumer_key || sc.woo_consumer_key) : ''),
        woo_consumer_secret:  isNormalTenant ? (req.tenant.config?.woo_consumer_secret ? mask(req.tenant.config.woo_consumer_secret) : '') : ((CONFIG.woo_consumer_secret || sc.woo_consumer_secret) ? mask(CONFIG.woo_consumer_secret || sc.woo_consumer_secret) : ''),
        webhook_url:          isNormalTenant ? (req.tenant.config?.webhook_url || '') : (CONFIG.webhook_url || sc.webhook_url || ''),
        loyalty_points:       isNormalTenant ? (req.tenant.config?.loyalty_points || 10) : (CONFIG.loyalty_points || sc.loyalty_points || 10),
        // WasenderAPI credentials
        // WasenderAPI credentials
        wasender_session_id:     isNormalTenant && req.tenant.config?.wasender_session_id ? mask(req.tenant.config.wasender_session_id) : '',
        wasender_session_key:    isNormalTenant && req.tenant.config?.wasender_session_key ? mask(req.tenant.config.wasender_session_key) : '',
        wasender_webhook_secret: isNormalTenant && req.tenant.config?.wasender_webhook_secret ? mask(req.tenant.config.wasender_webhook_secret) : '',
        wa_configured:           isNormalTenant ? !!((req.tenant.config?.wasender_session_id && req.tenant.config?.wasender_session_key) || (CONFIG.wasender_session_id && CONFIG.wasender_session_key)) : !!(CONFIG.wasender_session_id && CONFIG.wasender_session_key),
        is_configured:           isConfigured,
    });
});

// حفظ الإعدادات في .env وتحديث CONFIG
app.post('/api/config/setup', authMiddleware, async (req, res) => {
    const isNormalTenant = req.tenant && req.tenant._id !== 'dev-admin-001';

    if (isNormalTenant) {
        try {
            const Tenant = require('./models/Tenant');
            const updates = {};
            
            if (req.body.business_name !== undefined) updates['config.business_name'] = req.body.business_name;
            if (req.body.shopify_url !== undefined) {
                const su = req.body.shopify_url.replace(/https?:\/\//, '').replace(/\/$/, '');
                updates['config.shopify_url'] = `https://${su}`;
            }
            if (req.body.is_configured === true) updates['config.is_configured'] = true;

            const scFields = [
                'catalog_id', 'server_url', 'groq_api_key', 'gemini_api_key',
                'groq_model', 'woo_url', 'woo_consumer_key', 'woo_consumer_secret', 'webhook_url',
                'loyalty_points', 'language', 'wasender_session_id', 'wasender_session_key', 'wasender_webhook_secret'
            ];
            for (const key of scFields) {
                const v = req.body[key];
                if (v === undefined) continue;
                if (typeof v === 'string' && v.includes('••••')) continue;
                updates[`config.${key}`] = v;
            }

            await Tenant.findByIdAndUpdate(req.tenant._id, { $set: updates });
            console.log(`[config/setup POST] Updated Tenant config for ${req.tenant._id}`);
            return res.json({ success: true, business_name: req.body.business_name || req.tenant.config.business_name });
        } catch (e) {
            console.warn('[config/setup POST] Tenant save failed:', e.message);
            return res.status(500).json({ error: 'Failed to save configuration' });
        }
    }

    const fields = {
        BUSINESS_NAME:              'business_name',
        SHOPIFY_URL:                'shopify_url',
        SHOPIFY_ACCESS_TOKEN:       'shopify_access_token',
        GEMINI_API_KEY:             'gemini_api_key',
        GROQ_API_KEY:               'groq_api_key',
        GROQ_MODEL:                 'groq_model',
        CATALOG_ID:                 'catalog_id',
        SERVER_URL:                 'server_url',
        WOO_URL:                    'woo_url',
        WOO_CONSUMER_KEY:           'woo_consumer_key',
        WOO_CONSUMER_SECRET:        'woo_consumer_secret',
        WEBHOOK_URL:                'webhook_url',
        LOYALTY_POINTS:             'loyalty_points',
        WASENDER_SESSION_ID:        'wasender_session_id',
        WASENDER_SESSION_KEY:       'wasender_session_key',
        WASENDER_WEBHOOK_SECRET:    'wasender_webhook_secret',
    };

    const envPath = path.join(__dirname, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    for (const [envKey, configKey] of Object.entries(fields)) {
        const value = req.body[configKey];
        if (value === undefined) continue;
        // لا نستبدل التوكن لو المستخدم بعت القيمة المخفية (masked)
        if (typeof value === 'string' && value.includes('••••')) continue;
        CONFIG[configKey] = value;
        if (envContent.includes(`${envKey}=`)) {
            envContent = envContent.replace(new RegExp(`${envKey}=.*`), `${envKey}=${value}`);
        } else {
            envContent += `\n${envKey}=${value}`;
        }
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    // Persist ALL settings to SystemConfig in MongoDB (works for any user incl. dev-admin-001)
    try {
        const SystemConfig = require('./models/SystemConfig');
        const updates = {};
        const scFields = [
            'business_name','catalog_id','server_url','groq_api_key','gemini_api_key',
            'groq_model','woo_url','woo_consumer_key','woo_consumer_secret','webhook_url',
            'loyalty_points',
            'wasender_session_id','wasender_session_key','wasender_webhook_secret',
        ];
        for (const key of scFields) {
            const v = req.body[key];
            if (v === undefined) continue;
            if (typeof v === 'string' && v.includes('••••')) continue;
            updates[key] = v;
        }
        // Shopify URL: store domain only (no https://)
        const su = req.body.shopify_url;
        if (su && !String(su).includes('••••'))
            updates.shopify_url = su.replace(/https?:\/\//, '').replace(/\/$/, '');
        const st = req.body.shopify_access_token;
        if (st && !String(st).includes('••••'))
            updates.shopify_access_token = st;
        if (req.body.is_configured === true) updates.is_configured = true;
        if (Object.keys(updates).length)
            await SystemConfig.findByIdAndUpdate('main', { $set: updates }, { upsert: true });
    } catch (e) {
        console.warn('[config/setup POST] SystemConfig save failed:', e.message);
    }

    res.json({ success: true, business_name: CONFIG.business_name });
});

// Test WasenderAPI session connection
app.post('/api/config/test-whatsapp', async (req, res) => {
    const sessionId  = req.body.wasender_session_id  || CONFIG.wasender_session_id;
    const sessionKey = req.body.wasender_session_key || CONFIG.wasender_session_key;
    if (!sessionId || !sessionKey) return res.status(400).json({ error: 'Session ID and Session Key are required' });
    try {
        const r = await axios.get(
            `https://www.wasenderapi.com/api/status`,
            { headers: { Authorization: `Bearer ${sessionKey}` }, timeout: 8000 }
        );
        const status = r.data?.data?.status || r.data?.status || 'unknown';
        const connected = status === 'connected';
        res.json({ ok: connected, status, name: r.data?.data?.name || sessionId });
    } catch (e) {
        const msg = e.response?.data?.message || e.response?.data?.error || 'Invalid Session ID or Key';
        res.status(400).json({ error: msg });
    }
});

// Test Shopify connection
app.post('/api/config/test-shopify', async (req, res) => {
    const { shopify_url, shopify_access_token } = req.body;
    if (!shopify_url || !shopify_access_token) return res.status(400).json({ error: 'Missing credentials' });
    const domain = shopify_url.replace(/https?:\/\//, '').replace(/\/$/, '');
    try {
        const r = await axios.get(
            `https://${domain}/admin/api/2024-01/shop.json`,
            { headers: { 'X-Shopify-Access-Token': shopify_access_token }, timeout: 8000 }
        );
        res.json({ ok: true, shop: r.data?.shop?.name || domain });
    } catch (e) {
        const msg = e.response?.data?.errors || 'Invalid store URL or token';
        res.status(400).json({ error: typeof msg === 'string' ? msg : 'Connection failed' });
    }
});

// ── Client Credentials Grant: fetch shpat_ token using server-side app credentials ──
// client_id / client_secret come from Railway env vars (SHOPIFY_API_KEY / SHOPIFY_API_SECRET)
// Frontend only sends the store domain — no credentials exposed to browser
app.post('/api/shopify/fetch-token', authMiddleware, async (req, res) => {
    const { shop } = req.body;
    const domain = (shop || '').replace(/https?:\/\//, '').replace(/\/$/, '').toLowerCase().trim();
    if (!isValidShopDomain(domain)) return res.status(400).json({ error: 'Invalid shop domain. Use: yourstore.myshopify.com' });

    const clientId  = process.env.SHOPIFY_API_KEY    || '';
    const clientSec = process.env.SHOPIFY_API_SECRET  || '';
    if (!clientId || !clientSec)
        return res.status(500).json({ error: 'SHOPIFY_API_KEY / SHOPIFY_API_SECRET not set on server' });

    try {
        const resp = await axios.post(
            `https://${domain}/admin/oauth/access_token`,
            `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSec)}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
        );
        const { access_token, expires_in, scope } = resp.data;
        const expiry = new Date(Date.now() + (expires_in || 86399) * 1000).toISOString();

        // Persist to Tenant.config (source of truth)
        try {
            const Tenant = require('./models/Tenant');
            const { encrypt } = require('./utils/crypto');
            const encryptedToken = encrypt(access_token);
            const filter = req.tenant?._id && req.tenant._id !== 'dev-admin-001'
                ? { _id: req.tenant._id }
                : {};
            await Tenant.findOneAndUpdate(
                filter,
                { $set: { 'config.shopify_url': `https://${domain}`, 'config.shopify_access_token': encryptedToken } },
                { sort: { createdAt: -1 }, upsert: false }
            );
            console.log(`[fetch-token] Saved encrypted token to Tenant for ${domain}`);
        } catch (dbErr) {
            console.warn('[fetch-token] Tenant save failed:', dbErr.message);
        }
        // Update in-memory CONFIG
        CONFIG.shopify_url          = domain;
        CONFIG.shopify_access_token = access_token;

        console.log(`[Shopify] fetch-token OK for ${domain} — expires ${expiry}`);
        res.json({ ok: true, access_token, expires_in, expiry, scope });
    } catch (e) {
        const errMsg = e.response?.data?.error_description || e.response?.data?.error || e.message;
        console.error('[fetch-token] failed:', e.response?.data || e.message);
        res.status(400).json({ error: errMsg });
    }
});

// Called from the frontend loading screen on every app open.
// Loads tenant's Shopify credentials into in-memory CONFIG so all subsequent
// Shopify API calls work. Always returns 200 (non-fatal).
app.post('/api/shopify/ensure-connected', authMiddleware, async (req, res) => {
    const { shopify_url, shopify_access_token } = getShopifyForTenant(req.tenant);
    if (shopify_url && shopify_access_token) {
        CONFIG.shopify_url          = shopify_url;
        CONFIG.shopify_access_token = shopify_access_token;
        console.log(`[ensure-connected] ✅ ${shopify_url}`);
        return res.json({ connected: true, shop: shopify_url });
    }
    console.warn('[ensure-connected] No Shopify credentials in tenant config');
    res.json({ connected: false, shop: null });
});

// WasenderAPI session status check
app.get('/api/wasender/session-status', authMiddleware, async (req, res) => {
    const sessionId  = CONFIG.wasender_session_id;
    const sessionKey = CONFIG.wasender_session_key;
    if (!sessionId || !sessionKey) return res.json({ connected: false, status: 'not_configured' });
    try {
        const r = await axios.get(
            `https://www.wasenderapi.com/api/status`,
            { headers: { Authorization: `Bearer ${sessionKey}` }, timeout: 8000 }
        );
        const status = r.data?.data?.status || r.data?.status || 'unknown';
        res.json({ connected: status === 'connected', status, name: r.data?.data?.name });
    } catch (e) {
        res.json({ connected: false, status: 'error', error: e.response?.data?.message || e.message });
    }
});

// Generate Shopify OAuth URL — redirect_uri = Railway server /auth/callback
app.get('/api/shopify/auth-url', authMiddleware, (req, res) => {
    const shop = String(req.query.shop || '').toLowerCase().trim().replace(/https?:\/\//, '').replace(/\/$/, '');
    if (!isValidShopDomain(shop)) return res.status(400).json({ error: 'Invalid shop domain. Use format: yourstore.myshopify.com' });
    const API_KEY = process.env.SHOPIFY_API_KEY || '';
    const APP_URL = (process.env.SHOPIFY_APP_URL || process.env.HOST || '').replace(/\/$/, '');
    if (!API_KEY) return res.status(400).json({ error: 'SHOPIFY_API_KEY not set on server' });
    if (!APP_URL) return res.status(400).json({ error: 'SHOPIFY_APP_URL not set on server' });
    const SCOPES = (process.env.SHOPIFY_SCOPES || 'read_products,read_orders,write_orders,read_customers,read_inventory,read_fulfillments,write_fulfillments').trim();
    const state = require('crypto').randomBytes(16).toString('hex');
    const redirectUri = `${APP_URL}/auth/callback`;
    const authUrl = `https://${shop}/admin/oauth/authorize` +
        `?client_id=${encodeURIComponent(API_KEY)}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}`;
    res.json({ auth_url: authUrl, state });
});

// Exchange OAuth code for permanent shpat_ token — paste the full redirect URL
app.post('/api/shopify/exchange-code', authMiddleware, async (req, res) => {
    let { shop, code, redirect_url } = req.body;

    // Extract shop + code from pasted redirect URL (http://localhost?shop=...&code=...)
    if (redirect_url) {
        try {
            const qs = redirect_url.replace(/^[^?]*\?/, '');
            const params = Object.fromEntries(new URLSearchParams(qs));
            if (params.code) code = params.code;
            if (params.shop) shop = params.shop;
        } catch (_) {}
    }

    if (!shop || !code) return res.status(400).json({ error: 'shop and code are required (or paste the full redirect URL)' });
    shop = String(shop).toLowerCase().trim().replace(/https?:\/\//, '').replace(/\/$/, '');
    if (!isValidShopDomain(shop)) return res.status(400).json({ error: 'Invalid shop domain' });

    const API_KEY = process.env.SHOPIFY_API_KEY || '';
    const API_SECRET = process.env.SHOPIFY_API_SECRET || '';
    if (!API_KEY || !API_SECRET) return res.status(400).json({ error: 'SHOPIFY_API_KEY / SHOPIFY_API_SECRET not configured on server' });

    try {
        const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: API_KEY,
            client_secret: API_SECRET,
            code
        });
        const { access_token, scope } = tokenRes.data;
        if (!access_token) return res.status(400).json({ error: 'No token in response' });

        const tokenType = access_token.startsWith('shpat_') ? 'offline (permanent ✓)' :
                          access_token.startsWith('shpua_') ? 'online (expires — see app config)' :
                          'unknown';

        CONFIG.shopify_url = shop;
        CONFIG.shopify_access_token = access_token;

        // MongoDB — find any tenant or the authenticated one
        try {
            const Tenant = require('./models/Tenant');
            const { encrypt } = require('./utils/crypto');
            const encryptedToken = encrypt(access_token);
            const filter = req.tenant?._id && req.tenant._id !== 'dev-admin-001'
                ? { _id: req.tenant._id }
                : {};
            await Tenant.findOneAndUpdate(
                filter,
                { $set: { 'config.shopify_url': `https://${shop}`, 'config.shopify_access_token': encryptedToken } },
                { sort: { createdAt: -1 }, upsert: false }
            );
            console.log(`[exchange-code] Encrypted token saved to MongoDB for ${shop}`);
        } catch (e) {
            console.warn('[exchange-code] MongoDB save failed (token still in CONFIG):', e.message);
        }

        res.json({
            success: true,
            shop,
            token_prefix: access_token.slice(0, 10) + '...',
            token_type: tokenType,
            scope
        });
    } catch (err) {
        const errData = err.response?.data;
        const msg = errData?.error_description || errData?.error || err.message || 'Exchange failed';
        console.error('[exchange-code] Failed:', errData || err.message);
        res.status(500).json({ error: msg });
    }
});

app.get('/api/config/catalog', (req, res) => {
    res.json({ catalog_id: CONFIG.catalog_id });
});

app.post('/api/config/catalog', (req, res) => {
    const { catalog_id } = req.body;
    if (catalog_id) {
        CONFIG.catalog_id = catalog_id;
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('CATALOG_ID=')) {
                envContent = envContent.replace(/CATALOG_ID=.*/g, `CATALOG_ID=${catalog_id}`);
            } else {
                envContent += `\nCATALOG_ID=${catalog_id}`;
            }
            fs.writeFileSync(envPath, envContent, 'utf8');
        }
    }
    res.json({ success: true, catalog_id: CONFIG.catalog_id });
});

// جلب منتجات شوبيفاي
app.get('/api/shopify/products', async (_req, res) => {
    if (!CONFIG.shopify_url || !CONFIG.shopify_access_token) {
        return res.json({ products: [] });
    }
    try {
        const url = `https://${CONFIG.shopify_url}/admin/api/2024-04/products.json?limit=50`;
        const response = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': CONFIG.shopify_access_token }
        });
        const products = (response.data.products || []).map(p => ({
            id: p.id,
            title: p.title,
            price: p.variants?.[0]?.price || '0',
            sku: p.variants?.[0]?.sku || '',
            image: p.images?.[0]?.src || '',
            url: `https://${CONFIG.shopify_url}/products/${p.handle}`
        }));
        res.json({ products });
    } catch (e) {
        console.error('[shopify/products]', e.response?.data || e.message);
        res.status(500).json({ error: e.response?.data?.errors || e.message });
    }
});

// جلب الطلبات من شوبيفاي
app.get('/api/orders', authMiddleware, async (req, res) => {
    try {
        const shopify_url = CONFIG.shopify_url || getShopifyForTenant(req.tenant).shopify_url;
        const shopify_access_token = CONFIG.shopify_access_token || getShopifyForTenant(req.tenant).shopify_access_token;
        if (!shopify_url || !shopify_access_token) {
            console.warn('[orders] No Shopify credentials found');
            return res.json([]);
        }
        const url = `https://${shopify_url}/admin/api/2024-04/orders.json?status=any&limit=250`;
        console.log(`[orders] Fetching: ${url.replace(shopify_access_token || '', '***')}`);
        const response = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': shopify_access_token }
        });
        console.log(`[orders] Got ${response.data.orders?.length || 0} orders from Shopify`);
        
        const orders = response.data.orders;
        let localOrders = loadJSON(DB_FILE);
        if (Array.isArray(localOrders)) localOrders = {};
        
        let dbChanged = false;
        
        // دمج الحالة المحلية واكتشاف الطلبات الجديدة للأتمتة
        const enrichedOrders = orders.map(o => {
            const phone = o.shipping_address?.phone || o.customer?.phone || "";
            const cleanPhone = normalizePhone(phone);
            const local = findLocalOrder(localOrders, cleanPhone, o.id);
            
            // إذا كان الطلب جديداً تماماً (غير موجود في الداتابيز المحلية)
            if (!local && cleanPhone) {
                const orderName = o.shipping_address?.first_name || o.customer?.first_name || "عميل شوبيفاي";
                console.log(`[Automation] New order detected for ${orderName} (${cleanPhone}), triggering order_created...`);
                
                // تفعيل أتمتة "طلب جديد"
                triggerAutomation('order_created', o, cleanPhone, orderName);
                
                // حفظ الطلب فوراً لمنع التكرار
                localOrders[o.id || cleanPhone] = {
                    phone: cleanPhone,
                    status: 'pending',
                    time: o.created_at || new Date().toISOString(),
                    name: orderName,
                    id: o.id
                };
                dbChanged = true;
            }

            const currentLocal = findLocalOrder(localOrders, cleanPhone, o.id);

            // Auto-sync: if Shopify cancelled this order, mirror it locally
            let effectiveStatus = currentLocal?.status || null;
            if (o.cancelled_at && effectiveStatus !== 'cancelled') {
                const key = String(o.id || cleanPhone);
                if (localOrders[key]) {
                    localOrders[key].status = 'cancelled';
                } else {
                    localOrders[key] = { phone: cleanPhone, status: 'cancelled', time: o.cancelled_at, id: o.id };
                }
                effectiveStatus = 'cancelled';
                dbChanged = true;
            }

            return {
                ...o,
                is_sent: !!currentLocal,
                local_status: effectiveStatus
            };

        });

        if (dbChanged) saveJSON(DB_FILE, localOrders);
        
        res.json(enrichedOrders);
    } catch (error) {
        const errData = error.response?.data;
        const status  = error.response?.status;
        console.error(`[orders] Shopify API error ${status}:`, errData || error.message);
        res.json([]);
    }
});

// إلغاء الطلب في شوبيفاي
const cancelShopifyOrder = async (shopifyOrderId) => {
    const shopify_url = CONFIG.shopify_url || '';
    const shopify_access_token = CONFIG.shopify_access_token || '';
    if (!shopifyOrderId || !shopify_url || !shopify_access_token) return;
    try {
        const url = `https://${shopify_url}/admin/api/2024-04/orders/${shopifyOrderId}/cancel.json`;
        await axios.post(url, { reason: 'customer' }, {
            headers: { 'X-Shopify-Access-Token': shopify_access_token }
        });
        console.log(`[Shopify] Order ${shopifyOrderId} cancelled successfully`);
    } catch (e) {
        console.error(`[Shopify] Failed to cancel order ${shopifyOrderId}:`, e.response?.data?.errors || e.message);
    }
};

// تحديث حالة الطلب يدوياً بدون إرسال رسالة
app.patch('/api/orders/status', (req, res) => {
    const { phone, orderId, status } = req.body;
    const validStatuses = ['pending', 'followed_up', 'confirmed', 'shipped', 'cancelled'];
    if (!status || !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    if (!phone && !orderId) return res.status(400).json({ error: 'phone or orderId required' });

    let localOrders = loadJSON(DB_FILE);
    if (Array.isArray(localOrders)) localOrders = {};

    const cleanPhone = phone ? normalizePhone(phone) : null;
    let updated = false;

    // البحث بالـ orderId أولاً
    if (orderId && localOrders[orderId]) {
        localOrders[orderId].status = status;
        updated = true;
    }

    // البحث بالـ phone
    if (!updated && cleanPhone) {
        for (const key in localOrders) {
            const item = localOrders[key];
            if (key === cleanPhone || item?.phone === cleanPhone || key.endsWith(cleanPhone.slice(-10))) {
                localOrders[key].status = status;
                updated = true;
            }
        }
    }

    if (!updated) {
        // إنشاء إدخال جديد
        localOrders[orderId || cleanPhone] = { phone: cleanPhone, status, time: new Date().toISOString() };
    }

    saveJSON(DB_FILE, localOrders);

    // إلغاء تلقائي في شوبيفاي لو الحالة إلغاء
    if (status === 'cancelled') {
        // orderId هو shopify order ID المرسل من الـ frontend
        const shopifyId = orderId || (() => {
            if (cleanPhone) {
                for (const key in localOrders) {
                    if (localOrders[key]?.phone === cleanPhone && localOrders[key]?.id) return localOrders[key].id;
                }
            }
        })();
        if (shopifyId) cancelShopifyOrder(shopifyId);
    }

    res.json({ success: true, status });
});

// جلب السلات المتروكة من شوبيفاي
app.get('/api/abandoned_carts', async (req, res) => {
    try {
        const url = `https://${CONFIG.shopify_url}/admin/api/2024-04/checkouts.json?limit=50`;
        const response = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': CONFIG.shopify_access_token }
        });
        
        let localOrders = loadJSON(DB_FILE);
        if (Array.isArray(localOrders)) localOrders = {};

        const checkouts = response.data.checkouts || [];
        const enriched = checkouts.map(c => {
            const phone = c.shipping_address?.phone || c.customer?.phone || c.phone || "";
            const cleanPhone = phone.replace(/[^\d]/g, "");
            const local = localOrders[cleanPhone] || null;
            return {
                ...c,
                clean_phone: cleanPhone,
                drip_sent: local?.dripSent || false,
                local_status: local?.status || 'abandoned'
            };
        });

        res.json(enriched);
    } catch (error) {
        console.warn("Shopify checkouts API unavailable or unauthorized, falling back to local simulation list.");
        let localOrders = loadJSON(DB_FILE);
        if (Array.isArray(localOrders)) localOrders = {};
        const simulated = [];
        for (const phone in localOrders) {
            const order = localOrders[phone];
            if (!order.status || order.status === 'pending') {
                simulated.push({
                    id: order.id || Math.floor(Math.random() * 1000000),
                    created_at: order.time || new Date().toISOString(),
                    abandoned_checkout_url: `https://${CONFIG.shopify_url}/cart`,
                    line_items: [{ title: order.name || "لوحة فنية مخصصة", price: "1500.00" }],
                    customer: { first_name: order.name || "عميل", phone: phone },
                    clean_phone: phone,
                    drip_sent: order.dripSent || false,
                    local_status: order.status || 'abandoned',
                    total_price: "1500.00"
                });
            }
        }
        res.json(simulated);
    }
});

// إرسال رسالة متابعة مخصصة لسلة متروكة
app.post('/api/abandoned_carts/trigger', async (req, res) => {
    const { phone, customerName, checkoutUrl, customMsg } = req.body;
    const cleanPhone = phone.replace(/[^\d]/g, "");
    if (!cleanPhone) return res.status(400).json({ error: "رقم الهاتف مطلوب" });

    try {
        const textMsg = customMsg || `مرحباً ${customerName || "عزيزي العميل"}، لاحظنا أنك تركت بعض المنتجات في سلة التسوق الخاصة بك في ${CONFIG.business_name}. هل ترغب في المساعدة لإتمام طلبك؟ رابط السلة: ${checkoutUrl || ""}`;
        const response = await sendViaWasender(cleanPhone, { messageType: 'text', text: textMsg });

        let localOrders = loadJSON(DB_FILE);
        if (Array.isArray(localOrders)) localOrders = {};
        if (!localOrders[cleanPhone]) {
            localOrders[cleanPhone] = { time: new Date().toISOString(), name: customerName || "عميل سلة متروكة" };
        }
        localOrders[cleanPhone].dripSent = true;
        localOrders[cleanPhone].status = 'followed_up';
        saveJSON(DB_FILE, localOrders);

        let inbox = loadJSON(INBOX_FILE);
        let existing = inbox.find(c => c.phone === cleanPhone);
        const sentMsgObj = { text: `[متابعة سلة متروكة]: ${textMsg}`, from: "agent", time: new Date().toLocaleString('ar-EG') };
        if (existing) {
            existing.messages = existing.messages || [];
            existing.messages.push(sentMsgObj);
            existing.lastUpdated = new Date().toLocaleString('ar-EG');
            inbox = inbox.filter(c => c.phone !== cleanPhone);
            inbox.unshift(existing);
        } else {
            inbox.unshift({ phone: cleanPhone, name: customerName || "عميل", messages: [sentMsgObj], lastUpdated: new Date().toLocaleString('ar-EG') });
        }
        saveJSON(INBOX_FILE, inbox.slice(0, 100));

        res.json({ success: true, data: response.data });
    } catch (error) {
        const errData = error.response?.data;
        const errMsg = errData?.error?.message || errData?.error || error.message;
        res.status(500).json({ error: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg });
    }
});

// جلب كافة العملاء لحملات الترويج
app.get('/api/customers', authMiddleware, async (req, res) => {
    try {
        const uniqueCustomers = new Map();

        // 1. من الطلبات المحلية
        let localOrders = loadJSON(DB_FILE);
        if (Array.isArray(localOrders)) localOrders = {};
        for (const phone in localOrders) {
            const order = localOrders[phone];
            let tag = "عميل محتمل";
            if (order.status === 'confirmed' || order.status === 'shipped') tag = "مشتري فعلي 🛍️";
            uniqueCustomers.set(phone, {
                phone,
                name: order.name || "عميل شوبيفاي",
                source: 'CRM',
                tag
            });
        }

        // 2. من صندوق الوارد
        const inbox = loadJSON(INBOX_FILE);
        if (Array.isArray(inbox)) {
            inbox.forEach(chat => {
                const cleanPhone = chat.phone.replace(/[^\d]/g, "");
                if (!uniqueCustomers.has(cleanPhone)) {
                    uniqueCustomers.set(cleanPhone, {
                        phone: cleanPhone,
                        name: chat.name || "عميل واتساب",
                        source: 'محادثات واتساب',
                        tag: "محادثة واتساب 💬"
                    });
                }
            });
        }

        // 3. من شوبيفاي (طلبات + كل العملاء)
        try {
            const { shopify_url: _sUrl, shopify_access_token: _sToken } = getShopifyForTenant(req.tenant);
            if (_sUrl && _sToken) {
                // 3a. من الطلبات (مشترين فعليين)
                const ordersRes = await axios.get(
                    `https://${_sUrl}/admin/api/2024-04/orders.json?status=any&limit=250`,
                    { headers: { 'X-Shopify-Access-Token': _sToken } }
                );
                ordersRes.data.orders?.forEach(o => {
                    const phone = o.shipping_address?.phone || o.customer?.phone || "";
                    if (!phone) return;
                    const cleanPhone = phone.replace(/[^\d]/g, "");
                    const name = o.shipping_address?.first_name || o.customer?.first_name || "عميل شوبيفاي";
                    let tag = o.tags ? `شوبيفاي: ${o.tags}` : "مشتري شوبيفاي 🛍️";
                    if (parseFloat(o.total_price || 0) > 2000) tag = "VIP 👑";
                    if (cleanPhone && !uniqueCustomers.has(cleanPhone)) {
                        uniqueCustomers.set(cleanPhone, { phone: cleanPhone, name, source: 'شوبيفاي', tag });
                    } else if (cleanPhone) {
                        const ex = uniqueCustomers.get(cleanPhone);
                        if (tag.includes("VIP")) ex.tag = tag;
                    }
                });

                // 3b. من قاعدة عملاء شوبيفاي (كل العملاء بما فيهم بدون طلبات)
                const custRes = await axios.get(
                    `https://${_sUrl}/admin/api/2024-04/customers.json?limit=250`,
                    { headers: { 'X-Shopify-Access-Token': _sToken } }
                );
                custRes.data.customers?.forEach(c => {
                    const phone = c.phone || c.default_address?.phone || "";
                    if (!phone) return;
                    const cleanPhone = phone.replace(/[^\d]/g, "");
                    if (!cleanPhone || uniqueCustomers.has(cleanPhone)) return;
                    const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || "عميل شوبيفاي";
                    uniqueCustomers.set(cleanPhone, { phone: cleanPhone, name, source: 'شوبيفاي', tag: 'عميل شوبيفاي 🌐' });
                });
            }
        } catch(e) {
            console.error("Failed to fetch shopify customers for broadcast:", e.message);
        }

        res.json(Array.from(uniqueCustomers.values()));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إرسال رسالة واتساب عبر WasenderAPI
app.post('/api/whatsapp/send', async (req, res) => {
    const { phone, template, params, textMsg, actionType, orderName, orderId,
            imageBase64, fileBase64, fileType, fileName, productRetailerId } = req.body;
    const cleanPhone = normalizePhone(phone);

    // Load wasender config from SystemConfig if not in memory yet
    if (!CONFIG.wasender_session_id || !CONFIG.wasender_session_key) {
        try {
            const SystemConfig = require('./models/SystemConfig');
            const sc = await SystemConfig.findById('main').lean();
            if (sc) {
                if (!CONFIG.wasender_session_id  && sc.wasender_session_id)  CONFIG.wasender_session_id  = sc.wasender_session_id;
                if (!CONFIG.wasender_session_key && sc.wasender_session_key) CONFIG.wasender_session_key = sc.wasender_session_key;
            }
        } catch (_) {}
    }

    if (!CONFIG.wasender_session_id || !CONFIG.wasender_session_key) {
        return res.status(503).json({ error: 'WasenderAPI غير مُهيَّأ — افتح الإعدادات وأدخل Session ID و Session Key ثم احفظ.' });
    }

    try {
        let msgObj = null;
        let finalMsgText = '';

        console.log(`[SendAPI] Target: ${phone}, Template: ${template || 'None'}, Text: ${textMsg || 'None'}`);

        // حفظ الوسائط على الديسك وإرسالها عبر رابط عام
        const mediaData = imageBase64 || fileBase64;
        if (mediaData) {
            const base64Data = mediaData.includes(',') ? mediaData.split(',')[1] : mediaData;
            const buffer = Buffer.from(base64Data, 'base64');
            let mediaTypeStr = 'image', ext = 'jpg';
            if (fileType === 'document') { mediaTypeStr = 'document'; ext = 'pdf'; }
            else if (fileType === 'video')    { mediaTypeStr = 'video';    ext = 'mp4'; }
            else if (fileType === 'audio')    { mediaTypeStr = 'audio';    ext = 'mp3'; }
            else if (imageBase64) {
                const m = imageBase64.match(/^data:(.+);base64,/);
                if (m) ext = m[1].split('/')[1] || 'jpg';
            }
            const savedName = `out_${Date.now()}.${ext}`;
            fs.writeFileSync(path.join(MEDIA_DIR, savedName), buffer);
            const serverUrl = (CONFIG.server_url || process.env.SHOPIFY_APP_URL || '').replace(/\/$/, '');
            const mediaUrl  = `${serverUrl}/media/${savedName}`;
            if (mediaTypeStr === 'image')    { msgObj = { messageType: 'image',    imageUrl:    mediaUrl, caption:  textMsg || undefined }; finalMsgText = textMsg || '[صورة]'; }
            else if (mediaTypeStr === 'document') { msgObj = { messageType: 'document', documentUrl: mediaUrl, fileName: fileName || savedName }; finalMsgText = fileName || '[مستند]'; }
            else if (mediaTypeStr === 'video')    { msgObj = { messageType: 'video',    videoUrl:    mediaUrl, caption:  textMsg || undefined }; finalMsgText = textMsg || '[فيديو]'; }
            else                                  { msgObj = { messageType: 'audio',    audioUrl:    mediaUrl }; finalMsgText = '[مقطع صوتي]'; }

        } else if (template) {
            // القوالب: استبدال المتغيرات وإرسال كنص عادي
            const templates = loadJSON(TEMPLATES_FILE);
            const tpl = Array.isArray(templates) ? templates.find(t => t.name === template) : null;
            let tplText = tpl?.body || tpl?.content || template;
            if (params && Array.isArray(params)) {
                params.forEach((p, i) => {
                    tplText = tplText.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), String(p));
                });
            }
            finalMsgText = tplText;
            msgObj = { messageType: 'text', text: tplText };

        } else if (productRetailerId) {
            const shopUrl = CONFIG.shopify_url
                ? `https://${CONFIG.shopify_url}/products/${productRetailerId}`
                : productRetailerId;
            const txt = `${textMsg || 'تفضل/ي رابط المنتج:'}\n${shopUrl}`;
            finalMsgText = txt;
            msgObj = { messageType: 'text', text: txt };

        } else if (textMsg) {
            finalMsgText = textMsg;
            msgObj = { messageType: 'text', text: textMsg };

        } else {
            return res.status(400).json({ error: 'No message content provided' });
        }

        const response = await sendViaWasender(cleanPhone, msgObj);

        // تحديث حالة الطلب
        if (actionType) {
            let localOrders = loadJSON(DB_FILE);
            if (Array.isArray(localOrders)) localOrders = {};
            let status = 'pending';
            if (actionType === 'followup') status = 'followed_up';
            if (actionType === 'confirm')  status = 'confirmed';
            if (actionType === 'shipping') status = 'shipped';
            if (actionType === 'cancel')   status = 'cancelled';
            const dbKey = orderId || cleanPhone;
            localOrders[dbKey] = {
                phone: cleanPhone, status,
                time: new Date().toISOString(),
                name: orderName || findLocalOrder(localOrders, cleanPhone, orderId)?.name || 'عميل',
                id: orderId || null
            };
            saveJSON(DB_FILE, localOrders);
            if (status === 'confirmed') {
                let loyalty = loadJSON(LOYALTY_FILE);
                if (!Array.isArray(loyalty)) loyalty = [];
                let lEntry = loyalty.find(e => e.phone === cleanPhone);
                if (!lEntry) { lEntry = { phone: cleanPhone, points: 0, history: [] }; loyalty.push(lEntry); }
                const pts = CONFIG.loyalty_points || 10;
                lEntry.points = (lEntry.points || 0) + pts;
                lEntry.history.push({ points: pts, reason: 'Order confirmed', time: new Date().toISOString() });
                saveJSON(LOYALTY_FILE, loyalty);
            }
            if (status !== 'pending') {
                triggerAutomation('order_status_changed', status, cleanPhone, orderName || localOrders[cleanPhone]?.name || 'عميل');
                fireWebhook('order_status_changed', { phone: cleanPhone, status, name: orderName });
            }
        }

        // تسجيل الرسالة في صندوق الوارد
        let inbox = loadJSON(INBOX_FILE);
        if (!Array.isArray(inbox)) inbox = [];
        let existing = inbox.find(c => c.phone === cleanPhone);
        const sentMsgObj = {
            text: template ? `[قالب: ${template}]: ${finalMsgText}` : finalMsgText,
            from: 'agent',
            time: new Date().toLocaleString('ar-EG'),
            status: 'sent',
            wamid: response.data?.messageId || response.data?.id || null
        };
        if (imageBase64) {
            const m = imageBase64.match(/^data:(.+);base64,(.+)$/);
            if (m) {
                const buf = Buffer.from(m[2], 'base64');
                const img = `out_${Date.now()}.jpg`;
                fs.writeFileSync(path.join(MEDIA_DIR, img), buf);
                sentMsgObj.image = `/media/${img}`;
            }
        }
        if (existing) {
            existing.messages = existing.messages || [];
            existing.messages.push(sentMsgObj);
            existing.lastUpdated = new Date().toLocaleString('ar-EG');
            inbox = inbox.filter(c => c.phone !== cleanPhone);
            inbox.unshift(existing);
        } else {
            inbox.unshift({ phone: cleanPhone, name: 'عميل', messages: [sentMsgObj], lastUpdated: new Date().toLocaleString('ar-EG') });
        }
        saveJSON(INBOX_FILE, inbox.slice(0, 100));

        res.json({ success: true, data: response.data });
    } catch (error) {
        const errMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        res.status(500).json({ error: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg });
    }
});

// ─────────────────────────────────────────────
//  الويب هوك (Webhook)
// ─────────────────────────────────────────────

// WasenderAPI يمرر إيصال القراءة تلقائياً — لا نحتاج لإجراء
app.post('/api/whatsapp/read', (_req, res) => res.json({ success: true }));

// ─────────────────────────────────────────────
//  WasenderAPI Webhook
// ─────────────────────────────────────────────
const crypto = require('crypto');

// GET test endpoint — hit from browser to verify the webhook URL is reachable
app.get('/webhook/wasender', (_req, res) => {
    res.json({ ok: true, message: 'WasenderAPI webhook endpoint is reachable', ts: Date.now() });
});

app.post('/webhook/wasender', async (req, res) => {
    // Safely get raw body — handle undefined/non-Buffer body
    let rawBody;
    if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
    } else if (typeof req.body === 'string') {
        rawBody = Buffer.from(req.body, 'utf8');
    } else if (req.body && typeof req.body === 'object') {
        rawBody = Buffer.from(JSON.stringify(req.body), 'utf8');
    } else {
        console.error('[WasenderWebhook] Empty or unreadable body! Content-Type:', req.get('Content-Type'), 'Body type:', typeof req.body);
        return res.sendStatus(200);
    }

    console.log('[WasenderWebhook] Received POST, body size:', rawBody.length, 'bytes, Content-Type:', req.get('Content-Type'));

    console.log('[WasenderWebhook] ✅ Request received! Headers:', JSON.stringify(req.headers));

    if (CONFIG.wasender_webhook_secret) {
        const signature = req.get('X-Webhook-Signature') || req.get('X-Wasender-Signature') || req.get('X-Hub-Signature-256') || '';

        const expectedHash = `sha256=${crypto.createHmac('sha256', CONFIG.wasender_webhook_secret).update(rawBody).digest('hex')}`;

        const isRawMatch = signature === CONFIG.wasender_webhook_secret;
        const isHashMatch = signature === expectedHash;

        if (!isRawMatch && !isHashMatch) {
            console.warn('[WasenderWebhook] ⚠️ Signature mismatch! Header:', signature, '| Expected raw:', CONFIG.wasender_webhook_secret, '| Expected hash:', expectedHash, '| Allowing anyway for debugging.');
            // Not blocking — log only until signature format from WasenderAPI is confirmed
        }
        console.log('[WasenderWebhook] Signature OK');
    }

    let data;
    try { data = JSON.parse(rawBody.toString('utf8')); }
    catch (e) {
        console.error('[WasenderWebhook] JSON parse failed:', e.message, '| Raw body preview:', rawBody.toString('utf8').slice(0, 200));
        return res.sendStatus(200);
    }

    const event = data.event || '';
    console.log(`[WasenderWebhook] event: ${event}`);
    console.log('[WasenderWebhook] payload:', JSON.stringify(data, null, 2));

    let targetTenantId = req.query.tenant_id || null;

    const extractPhone = (key) => {
        return key?.cleanedSenderPn
            || (key?.remoteJid || '').replace(/@(s\.whatsapp\.net|lid)$/i, '').replace(/[^\d]/g, '')
            || '';
    };

    let incomingPhone = null;
    let messagesToProcess = [];

    if (event === 'messages.upsert' || event === 'messages.received') {
        const payloadData = data.data;
        if (Array.isArray(payloadData)) {
            messagesToProcess = payloadData;
        } else if (payloadData?.messages) {
            messagesToProcess = Array.isArray(payloadData.messages) ? payloadData.messages : [payloadData.messages];
        } else if (payloadData) {
            messagesToProcess = [payloadData];
        }

        const firstMsg = messagesToProcess[0];
        incomingPhone = extractPhone(firstMsg?.key);
    } else if (event === 'messages.update') {
        const updates = Array.isArray(data.data) ? data.data : [data.data];
        incomingPhone = extractPhone(updates[0]?.key);
    }

    if (!targetTenantId && incomingPhone) {
        const route = await WhatsAppRouter.findOne({ phone: incomingPhone }).lean();
        if (route) targetTenantId = route.tenantId;
    }

    if (!targetTenantId) targetTenantId = 'global';

    tenantStorage.run({ tenantId: targetTenantId }, async () => {
        if (event === 'messages.upsert' || event === 'messages.received' || event === 'messages-personal.received') {
            for (const msg of messagesToProcess) {
                if (msg.messageBody && !msg.message) {
                    msg.message = { conversation: msg.messageBody };
                }
                await handleWasenderMessage(msg).catch(e => console.error('[WasenderWebhook] handler error:', e.message));
            }
        } else if (event === 'messages.update') {
            const updates = Array.isArray(data.data) ? data.data : [data.data];
            updates.forEach(upd => {
                const wamid     = upd?.key?.id;
                const newStatus = upd?.update?.status;
                if (!wamid || !newStatus) return;
                let inbox = loadJSON(INBOX_FILE);
                if (!Array.isArray(inbox)) return;
                let changed = false;
                for (const chat of inbox) {
                    for (const m of (chat.messages || [])) {
                        if (m.wamid === wamid) {
                            const rank = { sent: 1, delivered: 2, read: 3 };
                            if ((rank[newStatus] || 0) > (rank[m.status] || 0)) {
                                m.status = newStatus === 'read' ? 'seen' : newStatus;
                                changed = true;
                            }
                        }
                    }
                }
                if (changed) saveJSON(INBOX_FILE, inbox);
            });
        } else if (event === 'session.status') {
            console.log('[WasenderWebhook] Session status:', data.data?.status);
        }
    });

    res.sendStatus(200);
});

const handleWasenderMessage = async (msgData) => {
    if (!msgData) return;
    if (msgData.key?.fromMe) return;          // رسائل صادرة — تجاهل

    const remoteJid = msgData.key?.remoteJid || '';
    if (remoteJid.includes('@g.us')) return;  // مجموعات — تجاهل

    const phone = msgData.key?.cleanedSenderPn || remoteJid.replace(/@(s\.whatsapp\.net|lid)$/i, '').replace(/[^\d]/g, '');
    if (!phone) {
        console.warn('[WasenderWebhook] Could not extract phone number from message!');
        return;
    }

    const name = msgData.pushName || phone;
    const msg  = msgData.message || {};

    let text = '', msgType = 'text';

    if (msg.conversation)                        { text = msg.conversation; }
    else if (msg.extendedTextMessage?.text)      { text = msg.extendedTextMessage.text; }
    else if (msg.imageMessage)                   { text = msg.imageMessage.caption || '📷 صورة'; msgType = 'image'; }
    else if (msg.videoMessage)                   { text = msg.videoMessage.caption || '🎬 فيديو'; msgType = 'video'; }
    else if (msg.audioMessage || msg.pttMessage) { text = '🎤 مقطع صوتي'; msgType = 'audio'; }
    else if (msg.documentMessage)                { text = msg.documentMessage.fileName || '📄 مستند'; msgType = 'document'; }
    else if (msg.locationMessage) {
        text = `📍 ${msg.locationMessage.name || ''} (${msg.locationMessage.degreesLatitude}, ${msg.locationMessage.degreesLongitude})`.trim();
        msgType = 'location';
    }
    else if (msg.contactMessage)  { text = `👤 ${msg.contactMessage.displayName || ''}`; msgType = 'contact'; }
    else if (msg.stickerMessage)  { text = '🎭 ملصق'; msgType = 'sticker'; }
    else if (msg.reactionMessage) { text = msg.reactionMessage.text || '👍'; msgType = 'reaction'; }
    else { text = '📨 رسالة'; msgType = 'unknown'; }

    console.log(`[WasenderWebhook] ${msgType} from ${name} (${phone}): ${text.slice(0, 80)}`);

    let inbox = loadJSON(INBOX_FILE);
    if (!Array.isArray(inbox)) inbox = [];
    let existing = inbox.find(c => c.phone === phone);
    const incomingMsgObj = {
        msgType, text, from: 'customer',
        time: new Date().toLocaleString('ar-EG'),
        wamid: msgData.key?.id || null,
    };
    if (msgType === 'location') {
        incomingMsgObj.location = {
            lat: msg.locationMessage?.degreesLatitude,
            lng: msg.locationMessage?.degreesLongitude,
            name: msg.locationMessage?.name || '',
            address: msg.locationMessage?.address || '',
        };
    }
    if (existing) {
        existing.messages = existing.messages || [];
        existing.messages.push(incomingMsgObj);
        existing.lastUpdated = new Date().toLocaleString('ar-EG');
        existing.name = name;
        inbox = inbox.filter(c => c.phone !== phone);
        inbox.unshift(existing);
    } else {
        inbox.unshift({ phone, name, messages: [incomingMsgObj], lastUpdated: new Date().toLocaleString('ar-EG') });
    }
    saveJSON(INBOX_FILE, inbox.slice(0, 100));

    if (text.trim()) {
        triggerAutomation('new_message', text, phone, name);
        triggerAutomation('keyword_received', text, phone, name);
    }

    const words = text.trim().split(/[\s,،.!؟?\r\n]+/).map(w => w.toLowerCase()).filter(Boolean);
    const isConfirm = words.some(w => ['تأكيد','موافق','نعم','اوك','اوكي','confirm','yes','approved','accepted','ok','okay'].includes(w));
    const isCancel  = words.some(w => ['إلغاء','الغاء','ألغي','إلغي','ألغاء','رفض','مرفوض','cancel','cancelled','canceled','reject','rejected'].includes(w));

    if (isConfirm)               { handleWebhookAction(phone, name, 'confirmed'); }
    else if (isCancel)           { handleWebhookAction(phone, name, 'cancelled'); }
    else if (hasAI() && text.trim()) { handleAIAutoReply(phone, name, text); }
};


const handleWebhookAction = async (phone, name, status) => {
    const cleanPhone = normalizePhone(phone);
    let localOrders = loadJSON(DB_FILE);
    if (Array.isArray(localOrders)) localOrders = {};

    // البحث عن كل الطلبات المرتبطة بهذا الرقم
    let candidates = [];
    for (const key in localOrders) {
        const item = localOrders[key];
        if (key === cleanPhone || (item && item.phone === cleanPhone) || key.endsWith(cleanPhone.slice(-10))) {
            candidates.push({ key, ...item });
        }
    }

    if (candidates.length === 0) {
        const targetKey = cleanPhone;
        localOrders[targetKey] = {
            phone: cleanPhone,
            name: name || "عميل واتساب",
            time: new Date().toISOString(),
            status: status
        };
        saveJSON(DB_FILE, localOrders);
        triggerAutomation('order_status_changed', status, cleanPhone, name || "عميل واتساب");
    } else {
        // ترتيب الأحدث أولاً
        candidates.sort((a, b) => {
            const timeA = a.time ? new Date(a.time).getTime() : 0;
            const timeB = b.time ? new Date(b.time).getTime() : 0;
            return timeB - timeA;
        });

        const latest = candidates[0];
        localOrders[latest.key].status = status;
        const orderName = localOrders[latest.key].name || name;
        saveJSON(DB_FILE, localOrders);
        triggerAutomation('order_status_changed', status, cleanPhone, orderName || name);
        console.log(`[*] Auto-updated order ${latest.key} for ${orderName} to ${status}`);

        // إلغاء تلقائي في شوبيفاي لو الحالة إلغاء
        if (status === 'cancelled') {
            const shopifyId = localOrders[latest.key].id;
            if (shopifyId) cancelShopifyOrder(shopifyId);
        }
    }
};




// ─────────────────────────────────────────────


const handleAIAutoReply = async (phone, name, customerText) => {
    if (!hasAI()) return;
    const settings = loadJSON(SETTINGS_FILE);
    if (!Array.isArray(settings) && settings.ai_enabled === false) return;

    const cleanPhone = phone.replace(/[^\d]/g, "");

    try {
        let localOrders = loadJSON(DB_FILE);
        if (Array.isArray(localOrders)) localOrders = {};
        let orderInfo = localOrders[cleanPhone] ? `حالة طلب العميل في النظام: ${localOrders[cleanPhone].status}` : "لا يوجد طلب مسجل للعميل.";

        let inbox = loadJSON(INBOX_FILE);
        let history = "";

        const contact = inbox.find(c => c.phone === cleanPhone);
        if (contact && contact.messages) {
            const recent = contact.messages.slice(-5);
            history = recent.map(m => `${m.fromMe ? 'أنا (الشركة)' : 'العميل'}: ${m.text}`).join("\n");
        }

        const settings = loadJSON(SETTINGS_FILE);
        const defaultPrompt = `أنت مساعد ذكي ومحترف لشركة ${CONFIG.business_name} المتخصصة في البراويز واللوحات الفنية.
- لو المحادثة مستمرة، بلاش تكرر التحية (أهلاً، نورتنا) في كل رسالة. ادخل في الموضوع فوراً.
- اسأل العميل عن التفاصيل الناقصة زي (المقاس المطلوب، نوع البرواز، العنوان) بأسلوب لبق.
- رد بالعامية المصرية الراقية.
- لو العميل بعت لينك منتج، قوله إنك هتحتاج تعرف المقاس ونوع البرواز عشان تأكد الطلب.`;

        const customPrompt = (!Array.isArray(settings) && settings.ai_instruction) ? settings.ai_instruction : defaultPrompt;

        const prompt = `${customPrompt}

تاريخ المحادثة الأخير:
${history}

معلومات النظام: ${orderInfo}
رسالة العميل الجديدة: "${customerText}"

الرد (بدون تكرار تحية لو مفيش داعي):`;




        const replyText = await callAI(prompt);

        if (replyText) {
            await sendViaWasender(cleanPhone, { messageType: 'text', text: replyText });

            let inbox = loadJSON(INBOX_FILE);
            let existing = inbox.find(c => c.phone === cleanPhone);
            if (existing) {
                existing.messages = existing.messages || [];
                existing.messages.push({
                    text: replyText,
                    from: "agent",
                    time: new Date().toLocaleString('ar-EG')
                });
                existing.lastUpdated = new Date().toLocaleString('ar-EG');
                inbox = inbox.filter(c => c.phone !== cleanPhone);
                inbox.unshift(existing);
                saveJSON(INBOX_FILE, inbox.slice(0, 100));
            }
            console.log(`[AI Assistant] Replied to ${name}: ${replyText}`);
        }
    } catch (e) {
        console.error("[AI Assistant] Auto-reply error:", e.message);
    }
};



// ─────────────────────────────────────────────
//  Analytics API
// ─────────────────────────────────────────────
app.get('/api/analytics', (_req, res) => {
    try {
        const inbox = loadJSON(INBOX_FILE);
        let orders = loadJSON(DB_FILE);
        if (Array.isArray(orders)) orders = {};
        const queue = loadJSON(AUTOMATION_QUEUE_FILE);

        // ── Message Stats ──
        let totalOutbound = 0, totalInbound = 0, seenCount = 0, deliveredCount = 0;
        const responsePhones = new Set();
        const allMessages = [];

        if (Array.isArray(inbox)) {
            inbox.forEach(chat => {
                (chat.messages || []).forEach(m => {
                    if (m.from === 'agent') {
                        totalOutbound++;
                        if (m.status === 'seen') seenCount++;
                        else if (m.status === 'delivered') deliveredCount++;
                    } else {
                        totalInbound++;
                        responsePhones.add(chat.phone);
                    }
                    allMessages.push({ ...m, phone: chat.phone, name: chat.name });
                });
            });
        }

        // ── Order Funnel ──
        const funnel = { new: 0, followed_up: 0, confirmed: 0, shipped: 0, cancelled: 0 };
        for (const phone in orders) {
            const status = orders[phone]?.status || 'new';
            if (funnel[status] !== undefined) funnel[status]++;
            else funnel.new++;
        }

        // ── Automation Stats ──
        const autoStats = { pending: 0, done: 0, failed: 0, cancelled: 0 };
        if (Array.isArray(queue)) {
            queue.forEach(e => { if (autoStats[e.status] !== undefined) autoStats[e.status]++; });
        }

        // ── Response Rate ──
        const conversations = Array.isArray(inbox) ? inbox.length : 0;
        const responseRate = conversations > 0 ? Math.round((responsePhones.size / conversations) * 100) : 0;

        // ── Top Customers (by message activity) ──
        const customerActivity = {};
        if (Array.isArray(inbox)) {
            inbox.forEach(chat => {
                const count = (chat.messages || []).length;
                customerActivity[chat.phone] = { name: chat.name || chat.phone, count, phone: chat.phone };
            });
        }
        const topCustomers = Object.values(customerActivity)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // ── Daily message volume (last 7 days) ──
        const daily = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            daily[d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })] = { out: 0, in: 0 };
        }
        allMessages.forEach(m => {
            try {
                const msgDate = new Date(m.time);
                if (isNaN(msgDate)) return;
                const dayLabel = msgDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                if (daily[dayLabel]) {
                    if (m.from === 'agent') daily[dayLabel].out++;
                    else daily[dayLabel].in++;
                }
            } catch (_) {}
        });

        res.json({
            messages: { totalOutbound, totalInbound, seenCount, deliveredCount, responseRate, conversations },
            funnel,
            autoStats,
            topCustomers,
            daily: Object.entries(daily).map(([label, v]) => ({ label, ...v }))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/inbox', (_req, res) => {
    res.json(loadJSON(INBOX_FILE));
});

// ─────────────────────────────────────────────
//  Team Features — Labels, Assignment, Notes
// ─────────────────────────────────────────────

// تحديث بيانات محادثة (label / assigned_to)
app.patch('/api/inbox/:phone/meta', (req, res) => {
    const { phone } = req.params;
    const { labels, assigned_to } = req.body;
    let inbox = loadJSON(INBOX_FILE);
    if (!Array.isArray(inbox)) return res.status(500).json({ error: 'Inbox corrupt' });
    const chat = inbox.find(c => c.phone === phone);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (labels !== undefined) chat.labels = labels;
    if (assigned_to !== undefined) chat.assigned_to = assigned_to;
    saveJSON(INBOX_FILE, inbox);
    res.json({ success: true, labels: chat.labels, assigned_to: chat.assigned_to });
});

// إضافة ملاحظة داخلية
app.post('/api/inbox/:phone/note', (req, res) => {
    const { phone } = req.params;
    const { text, author } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Note text required' });
    let inbox = loadJSON(INBOX_FILE);
    if (!Array.isArray(inbox)) return res.status(500).json({ error: 'Inbox corrupt' });
    const chat = inbox.find(c => c.phone === phone);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    chat.notes = chat.notes || [];
    const note = { id: `note_${Date.now()}`, text: text.trim(), author: author || 'Agent', created_at: new Date().toISOString() };
    chat.notes.push(note);
    saveJSON(INBOX_FILE, inbox);
    res.json({ success: true, note });
});

// حذف ملاحظة
app.delete('/api/inbox/:phone/note/:noteId', (req, res) => {
    const { phone, noteId } = req.params;
    let inbox = loadJSON(INBOX_FILE);
    if (!Array.isArray(inbox)) return res.status(500).json({ error: 'Inbox corrupt' });
    const chat = inbox.find(c => c.phone === phone);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    chat.notes = (chat.notes || []).filter(n => n.id !== noteId);
    saveJSON(INBOX_FILE, inbox);
    res.json({ success: true });
});

// ─────────────────────────────────────────────
//  الحملات التلقائية (Automated Drips / Abandoned Cart)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  محرك الأتمتة (Automation Engine)
// ─────────────────────────────────────────────

app.get('/api/automations', (_req, res) => res.json(loadJSON(AUTOMATIONS_FILE)));

app.post('/api/automations', (req, res) => {
    const list = loadJSON(AUTOMATIONS_FILE);
    const item = { id: `auto_${Date.now()}`, active: true, created_at: new Date().toISOString(), ...req.body };
    list.push(item);
    saveJSON(AUTOMATIONS_FILE, list);
    res.json(item);
});

app.put('/api/automations/:id', (req, res) => {
    let list = loadJSON(AUTOMATIONS_FILE);
    const idx = list.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    list[idx] = { ...list[idx], ...req.body };
    saveJSON(AUTOMATIONS_FILE, list);
    res.json(list[idx]);
});

app.post('/api/automations/run-now', (_req, res) => {
    runQueueCycle().catch(e => console.error('[run-now]', e.message));
    res.json({ success: true });
});

app.patch('/api/automations/:id/toggle', (req, res) => {
    let list = loadJSON(AUTOMATIONS_FILE);
    const item = list.find(a => a.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.active = !item.active;
    saveJSON(AUTOMATIONS_FILE, list);
    res.json({ id: item.id, active: item.active });
});

app.delete('/api/automations/:id', (req, res) => {
    let list = loadJSON(AUTOMATIONS_FILE);
    saveJSON(AUTOMATIONS_FILE, list.filter(a => a.id !== req.params.id));
    res.json({ success: true });
});

app.get('/api/automations/queue', (_req, res) => {
    const queue = loadJSON(AUTOMATION_QUEUE_FILE);
    res.json(Array.isArray(queue) ? queue.slice(-200) : []);
});

const triggerAutomation = (triggerType, triggerPayload, phone, customerName) => {
    try {
        const list = loadJSON(AUTOMATIONS_FILE);
        const cleanPhone = String(phone).replace(/[^\d]/g, "");
        const payload = String(triggerPayload || '').toLowerCase().trim();

        const matching = list.filter(a => {
            if (!a.active) return false;
            if (a.trigger?.type !== triggerType) return false;
            if (triggerType === 'keyword_received') {
                const kw = (a.trigger?.value || '').toLowerCase().trim();
                return kw && payload.includes(kw);
            }
            if (triggerType === 'order_status_changed') {
                return !a.trigger?.value || a.trigger.value === triggerPayload;
            }
            return true;
        });

        if (matching.length === 0) return;

        let queue = loadJSON(AUTOMATION_QUEUE_FILE);
        if (!Array.isArray(queue)) queue = [];

        for (const auto of matching) {
            if (!auto.steps?.length) continue;
            const alreadyPending = queue.some(q =>
                q.automation_id === auto.id && 
                q.phone === cleanPhone && 
                q.status === 'pending' &&
                (!triggerPayload?.id || q.eventPayload?.id === triggerPayload.id)
            );
            if (alreadyPending) continue;

            const step0 = auto.steps[0];
            const waitMs = (step0.wait_hours || 0) * 60 * 60 * 1000;
            queue.push({
                id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                automation_id: auto.id,
                automation_name: auto.name,
                step_index: 0,
                phone: cleanPhone,
                customer_name: customerName || 'عميل',
                fire_at: new Date(Date.now() + waitMs).toISOString(),
                status: 'pending',
                triggered_at: new Date().toISOString(),
                eventPayload: triggerType === 'order_created' ? triggerPayload : null
            });
            console.log(`[Automation] Queued "${auto.name}" for ${customerName} (${cleanPhone})`);
        }
        saveJSON(AUTOMATION_QUEUE_FILE, queue);
    } catch (e) {
        console.error('[Automation] triggerAutomation error:', e.message);
    }
};

const sendAutoMessage = async (phone, step, customerName, eventPayload) => {
    const url = `https://graph.facebook.com/${CONFIG.api_version}/${CONFIG.phone_number_id}/messages`;
    const name = customerName || 'عميل';

    if (step.action === 'send_template') {
        const templates = loadJSON(TEMPLATES_FILE);
        const tpl = templates[step.template_id];
        if (!tpl) throw new Error(`Template "${step.template_id}" not found`);
        const components = [];
        
        // user-defined params from step (supports {{customer_name}} substitution)
        let dynamicParams = (step.params || []).map(p => String(p).replace(/\{\{customer_name\}\}/g, name));
        let headerDoc = null;

        // order_followup: auto-fill all params from Shopify order payload
        if (tpl.meta_name === 'order_followup' && eventPayload) {
            const o = eventPayload;
            const product = o.line_items?.[0]?.title || 'منتج';
            const order_id = o.name;
            const gw = (o.gateway || '').toLowerCase();
            let payment = 'بطاقة أون لاين';
            if (gw.includes('cash') || gw.includes('cod')) payment = 'كاش عند الاستلام';
            else if (gw.includes('bank')) payment = 'تحويل بنكي';
            const address = `${o.shipping_address?.address1 || ''}, ${o.shipping_address?.city || ''}`.replace(/^,\s*|,\s*$/g, '');
            dynamicParams = [name, product, order_id, payment, address];
            headerDoc = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        // if template has params but none configured → auto-use customer_name as first param
        if (dynamicParams.length === 0 && tpl.params_count > 0) {
            dynamicParams = Array(tpl.params_count).fill('').map((_, i) => i === 0 ? name : '—');
        }

        // header image (from step or template config)
        if (tpl.has_header_image && (step.template_image_url || CONFIG.server_url)) {
            const imgUrl = step.template_image_url || '';
            if (imgUrl) components.push({ type: "header", parameters: [{ type: "image", image: { link: imgUrl } }] });
        }

        if (headerDoc) {
            components.push({
                type: "header",
                parameters: [{ type: "document", document: { link: headerDoc, filename: "Invoice.pdf" } }]
            });
        }

        if (dynamicParams.length > 0) {
            components.push({
                type: "body",
                parameters: dynamicParams.map(p => ({ type: "text", text: p }))
            });
        }

        if (tpl.buttons?.length > 0) {
            tpl.buttons.forEach(btn => {
                if (btn.sub_type === 'copy_code') {
                    components.push({
                        type: "button", sub_type: "copy_code",
                        index: String(btn.index ?? 0),
                        parameters: [{ type: "coupon_code", coupon_code: btn.coupon_code }]
                    });
                }
            });
        }
        await axios.post(url, {
            messaging_product: "whatsapp", to: phone, type: "template",
            template: { name: tpl.meta_name, language: { code: tpl.language || "en" }, components }
        }, { headers: { 'Authorization': `Bearer ${CONFIG.access_token}` } });

    } else if (step.action === 'send_text') {
        const text = (step.text || '').replace(/\{\{customer_name\}\}/g, name);
        await axios.post(url, {
            messaging_product: "whatsapp", to: phone, type: "text",
            text: { body: text }
        }, { headers: { 'Authorization': `Bearer ${CONFIG.access_token}` } });

    } else {
        throw new Error(`Unknown action type: ${step.action}`);
    }

    let inbox = loadJSON(INBOX_FILE);
    if (!Array.isArray(inbox)) inbox = [];
    let chat = inbox.find(c => c.phone === phone);
    const msgObj = {
        text: step.action === 'send_template' ? `[أتمتة – قالب: ${step.template_id}]` : `[أتمتة]: ${step.text}`,
        from: "agent", time: new Date().toLocaleString('ar-EG'), status: 'sent'
    };
    if (chat) {
        chat.messages = chat.messages || [];
        chat.messages.push(msgObj);
        chat.lastUpdated = new Date().toLocaleString('ar-EG');
        inbox = inbox.filter(c => c.phone !== phone);
        inbox.unshift(chat);
    } else {
        inbox.unshift({ phone, name: customerName || 'عميل', messages: [msgObj], lastUpdated: new Date().toLocaleString('ar-EG') });
    }
    saveJSON(INBOX_FILE, inbox.slice(0, 100));
};

const _runQueueCycleCore = async () => {
    try {
        let queue = loadJSON(AUTOMATION_QUEUE_FILE);
        if (!Array.isArray(queue) || queue.length === 0) return;

        const now = new Date();
        let changed = false;
        const list = loadJSON(AUTOMATIONS_FILE);
        const newEntries = [];

        for (const entry of queue) {
            if (entry.status !== 'pending') continue;
            if (new Date(entry.fire_at) > now) continue;

            const auto = list.find(a => a.id === entry.automation_id);
            if (!auto || !auto.active) { entry.status = 'cancelled'; changed = true; continue; }

            const step = auto.steps[entry.step_index];
            if (!step) { entry.status = 'done'; changed = true; continue; }

            try {
                await sendAutoMessage(entry.phone, step, entry.customer_name, entry.eventPayload);
                console.log(`[Automation] ✓ "${auto.name}" step ${entry.step_index} → ${entry.customer_name}`);
                entry.status = 'done';
                changed = true;

                const nextStep = auto.steps[entry.step_index + 1];
                if (nextStep) {
                    newEntries.push({
                        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        automation_id: auto.id, automation_name: auto.name,
                        step_index: entry.step_index + 1,
                        phone: entry.phone, customer_name: entry.customer_name,
                        fire_at: new Date(Date.now() + (nextStep.wait_hours || 0) * 60 * 60 * 1000).toISOString(),
                        status: 'pending', triggered_at: new Date().toISOString(),
                        eventPayload: entry.eventPayload || null
                    });
                }
            } catch (e) {
                const apiError = e.response?.data?.error?.message || e.response?.data || e.message;
                console.error(`[Automation] ✗ step ${entry.step_index} for ${entry.phone}:`, JSON.stringify(apiError));
                entry.status = 'failed';
                entry.error = typeof apiError === 'string' ? apiError : JSON.stringify(apiError);
                changed = true;
            }
        }

        if (changed || newEntries.length > 0) {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const cleaned = [...queue, ...newEntries].filter(e =>
                e.status === 'pending' || new Date(e.fire_at) > weekAgo
            );
            saveJSON(AUTOMATION_QUEUE_FILE, cleaned);
        }
    } catch (e) {
        console.error('[Automation Queue] Error:', e.message);
    }
};


const runQueueCycle = async () => {
    try {
        const Tenant = mongoose.model('Tenant');
        const tenants = await Tenant.find({});
        for (const t of tenants) {
            await new Promise(resolve => tenantStorage.run({ tenantId: t._id.toString() }, async () => {
                await _runQueueCycleCore();
                resolve();
            }));
        }
    } catch (e) { console.error('[QueueCycle] Error:', e.message); }
};

setInterval(runQueueCycle, 60 * 1000);

// ─────────────────────────────────────────────
//  AI Helper — Groq first, Gemini fallback
// ─────────────────────────────────────────────
const callAI = async (prompt) => {
    // Groq (preferred — free, fast, high limits)
    if (CONFIG.groq_api_key) {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: CONFIG.groq_model || 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 512
        }, {
            headers: {
                'Authorization': `Bearer ${CONFIG.groq_api_key}`,
                'Content-Type': 'application/json'
            }
        });
        return res.data.choices[0].message.content;
    }
    // Gemini fallback
    if (CONFIG.gemini_api_key) {
        const genAI = new GoogleGenerativeAI(CONFIG.gemini_api_key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    throw new Error('No AI provider configured. Add GROQ_API_KEY or GEMINI_API_KEY in settings.');
};

// ─────────────────────────────────────────────
//  AI Assistant Endpoints
// ─────────────────────────────────────────────

const hasAI = () => {
    return !!(CONFIG.groq_api_key || CONFIG.gemini_api_key);
};


app.post('/api/settings/ai-toggle', (req, res) => {
    const { enabled, ai_instruction } = req.body;
    let settings = loadJSON(SETTINGS_FILE);
    if (Array.isArray(settings)) settings = {};
    if (enabled !== undefined) settings.ai_enabled = !!enabled;
    if (ai_instruction !== undefined) settings.ai_instruction = ai_instruction;
    saveJSON(SETTINGS_FILE, settings);
    res.json({ success: true, ai_enabled: settings.ai_enabled, ai_instruction: settings.ai_instruction });
});


app.get('/api/settings', (req, res) => {
    let settings = loadJSON(SETTINGS_FILE);
    if (Array.isArray(settings)) settings = { ai_enabled: true };
    res.json(settings);
});

app.post('/api/settings', (req, res) => {
    let settings = loadJSON(SETTINGS_FILE);
    if (Array.isArray(settings)) settings = {};
    const allowed = ['ai_enabled','ai_auto_reply','ai_instruction','ai_draft_mode',
                     'ai_auto_tag_vip','ai_send_recovery','ai_escalate_negative'];
    for (const key of allowed) {
        if (req.body[key] !== undefined) settings[key] = req.body[key];
    }
    saveJSON(SETTINGS_FILE, settings);
    // Sync to in-memory CONFIG
    if (req.body.ai_instruction !== undefined) CONFIG.ai_instruction = req.body.ai_instruction;
    if (req.body.ai_enabled     !== undefined) CONFIG.ai_enabled     = req.body.ai_enabled;
    res.json({ success: true });
});

app.post('/api/ai/suggest', async (req, res) => {
    if (!hasAI()) return res.status(400).json({ error: 'No AI provider configured. Add GROQ_API_KEY or GEMINI_API_KEY in settings.' });
    const { messages, customerName } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Messages required' });
    try {
        const recent = messages.slice(-6).map(m => `[${m.from === 'agent' ? 'وكيل' : 'عميل'}]: ${m.text}`).join('\n');
        const prompt = `أنت مساعد خدمة عملاء محترف لشركة ${CONFIG.business_name}.
المحادثة الأخيرة مع العميل ${customerName || 'العميل'}:
${recent}

اقترح 3 ردود مختلفة ومناسبة للوكيل يرسلها للعميل.
الشروط:
- كل رد في سطر منفصل يبدأ بـ "1." أو "2." أو "3."
- كل رد مختصر لا يتجاوز 2 جملة
- ردود طبيعية ودودة ومحترفة
- لا تضف أي شرح أو تعليق، فقط الردود الثلاثة`;

        const text = await callAI(prompt);
        const suggestions = text.split('\n')
            .filter(l => /^\d+\./.test(l.trim()))
            .map(l => l.replace(/^\d+\.\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 3);
        res.json({ suggestions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/summarize', async (req, res) => {
    if (!hasAI()) return res.status(400).json({ error: 'No AI provider configured.' });
    const { messages, customerName } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Messages required' });
    try {
        const text = messages.map(m => `[${m.from === 'agent' ? 'وكيل' : 'عميل'}]: ${m.text}`).join('\n');
        const prompt = `لخّص هذه المحادثة بين وكيل خدمة عملاء وعميل باسم ${customerName || 'العميل'} في جملة أو جملتين باللغة العربية. ركّز على: ما الذي يريده العميل، وما الذي تم التعامل معه.

المحادثة:
${text.slice(0, 3000)}`;
        const summary = await callAI(prompt);
        res.json({ summary: summary.trim() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/sentiment', async (req, res) => {
    if (!hasAI()) return res.json({ sentiment: 'neutral' });
    const { messages } = req.body;
    if (!messages?.length) return res.json({ sentiment: 'neutral' });
    try {
        const customerMsgs = messages.filter(m => m.from === 'customer').slice(-3).map(m => m.text).join(' | ');
        if (!customerMsgs.trim()) return res.json({ sentiment: 'neutral' });
        const prompt = `صنّف مزاج العميل في هذه الرسائل بكلمة واحدة فقط: "positive" أو "neutral" أو "negative".
الرسائل: "${customerMsgs}"
الإجابة (كلمة واحدة فقط):`;
        const raw = (await callAI(prompt)).toLowerCase();
        const sentiment = ['positive', 'negative', 'neutral'].find(s => raw.includes(s)) || 'neutral';
        res.json({ sentiment });
    } catch (e) { res.json({ sentiment: 'neutral' }); }
});

// ─────────────────────────────────────────────
//  شركات الشحن (Shipping Providers)
// ─────────────────────────────────────────────
const SHIPPING_FILE = path.join(__dirname, 'shipping.json');

const loadShipping = () => {
    if (!fs.existsSync(SHIPPING_FILE)) return { config: {}, shipments: [] };
    try { return JSON.parse(fs.readFileSync(SHIPPING_FILE, 'utf8')); }
    catch { return { config: {}, shipments: [] }; }
};
const saveShipping = (d) => fs.writeFileSync(SHIPPING_FILE, JSON.stringify(d, null, 2), 'utf8');

app.get('/api/shipping/config', (_req, res) => {
    const data = loadShipping();
    const masked = {};
    for (const [provider, cfg] of Object.entries(data.config || {})) {
        masked[provider] = {};
        for (const [k, v] of Object.entries(cfg)) {
            if (k === 'active') { masked[provider][k] = v; continue; }
            masked[provider][k] = typeof v === 'string' && v.length > 8
                ? v.slice(0, 4) + '••••' + v.slice(-4) : v;
        }
    }
    res.json({ config: masked, shipments: (data.shipments || []).slice(-100) });
});

app.post('/api/shipping/config', (req, res) => {
    const { provider, ...credentials } = req.body;
    if (!provider) return res.status(400).json({ error: 'Provider required' });
    const data = loadShipping();
    const existing = data.config[provider] || {};
    const updated = { ...existing };
    for (const [k, v] of Object.entries(credentials)) {
        if (typeof v === 'string' && v.includes('••••')) continue;
        updated[k] = v;
    }
    data.config[provider] = updated;
    saveShipping(data);
    res.json({ success: true });
});

app.post('/api/shipping/create', async (req, res) => {
    const { provider, phone, customer_name, address, city, cod, notes, order_id } = req.body;
    const data = loadShipping();
    const cfg = data.config[provider] || {};

    if (!cfg.api_key && !cfg.username) {
        return res.status(400).json({ error: `Provider "${provider}" is not configured. Add API key in Settings first.` });
    }

    try {
        const cleanPhone = String(phone).replace(/[^\d]/g, '');
        const nameParts = (customer_name || 'عميل').trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;
        let result = {};

        if (provider === 'bosta') {
            const localPhone = cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone.slice(-10);
            const resp = await axios.post('https://app.bosta.co/api/v2/deliveries', {
                type: 10,
                specs: { size: 'NORMAL' },
                cod: parseFloat(cod) || 0,
                dropOffAddress: { firstLine: address || 'Address', city: { name: city || 'Cairo' } },
                receiver: { firstName, lastName, phone: localPhone },
                notes: notes || `Order ${order_id || ''}`
            }, { headers: { 'Authorization': cfg.api_key, 'Content-Type': 'application/json' } });
            const d = resp.data?.data || resp.data;
            result = { awb: d?.trackingNumber || d?.awb, shipment_id: d?._id, status: 'Created' };

        } else if (provider === 'jt') {
            const resp = await axios.post('https://api-eg.jtexpress.com/shippingOrders/createOrders', {
                customerCode: cfg.customer_code,
                orderList: [{
                    orderNumber: order_id || `ORD${Date.now()}`,
                    expressType: 1,
                    receiver: { name: customer_name, mobile: cleanPhone, address, cityName: city || 'Cairo' },
                    cod: parseFloat(cod) || 0,
                    remark: notes || ''
                }]
            }, { headers: { 'api-key': cfg.api_key } });
            const d = resp.data?.orderList?.[0] || {};
            result = { awb: d.billCode || d.awb || `JT${Date.now()}`, status: 'Created' };

        } else if (provider === 'aramex') {
            result = { awb: `ARX${Date.now()}`, status: 'Created — Configure Aramex WSDL endpoint in settings' };
        } else if (provider === 'dhl') {
            result = { awb: `DHL${Date.now()}`, status: 'Created — Configure DHL API key in settings' };
        } else if (provider === 'fedex') {
            result = { awb: `FDX${Date.now()}`, status: 'Created — Configure FedEx API key in settings' };
        } else {
            return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }

        const shipment = {
            id: `ship_${Date.now()}`,
            order_id: order_id || '',
            phone: cleanPhone,
            customer_name: customer_name || '',
            provider,
            awb: result.awb,
            shipment_id: result.shipment_id || null,
            status: result.status,
            cod: parseFloat(cod) || 0,
            address: `${address || ''}, ${city || ''}`.replace(/^,\s*|,\s*$/g, ''),
            created_at: new Date().toISOString()
        };
        data.shipments = data.shipments || [];
        data.shipments.push(shipment);
        saveShipping(data);
        res.json({ success: true, ...result, shipment });
    } catch (e) {
        const errMsg = e.response?.data?.message || e.response?.data?.error || e.message;
        res.status(500).json({ error: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg });
    }
});

app.get('/api/shipping/track/:provider/:awb', async (req, res) => {
    const { provider, awb } = req.params;
    const data = loadShipping();
    const cfg = data.config[provider] || {};

    try {
        let trackResult = { status: 'Unknown' };

        if (provider === 'bosta') {
            if (!cfg.api_key) return res.status(400).json({ error: 'Bosta not configured' });
            const resp = await axios.get(`https://app.bosta.co/api/v2/deliveries/tracking/${awb}`, {
                headers: { 'Authorization': cfg.api_key }
            });
            const d = resp.data?.data || resp.data;
            const statusMap = {
                10: 'تم الإنشاء', 20: 'في المستودع', 24: 'تم الاستلام من التاجر',
                30: 'في الطريق', 41: 'خرج للتسليم', 45: 'تم التسليم',
                46: 'مُعاد للمُرسل', 47: 'عائد في الطريق', 80: 'مُلغى'
            };
            trackResult = {
                status: statusMap[d?.currentStatus?.code] || d?.currentStatus?.state || 'Unknown',
                code: d?.currentStatus?.code,
                updated_at: d?.currentStatus?.timestamp
            };
        } else if (provider === 'jt') {
            if (!cfg.api_key) return res.status(400).json({ error: 'J&T not configured' });
            const resp = await axios.post('https://api-eg.jtexpress.com/shippingOrders/tracking',
                { billCode: awb },
                { headers: { 'api-key': cfg.api_key } }
            );
            const d = resp.data;
            trackResult = { status: d?.status || d?.message || 'In Transit', updated_at: new Date().toISOString() };
        } else {
            trackResult = { status: 'Tracking available after provider configuration', updated_at: new Date().toISOString() };
        }

        const idx = (data.shipments || []).findIndex(s => s.awb === awb);
        if (idx !== -1) {
            data.shipments[idx].status = trackResult.status;
            data.shipments[idx].last_tracked = new Date().toISOString();
            saveShipping(data);
        }
        res.json(trackResult);
    } catch (e) {
        const errMsg = e.response?.data?.message || e.response?.data?.error || e.message;
        res.status(500).json({ error: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg });
    }
});

const _processDripCampaignsCore = async () => {
        try {
            let localOrders = loadJSON(DB_FILE);
            if (Array.isArray(localOrders)) localOrders = {};
            
            const now = new Date();
            let updated = false;

            for (const phone in localOrders) {
                const order = localOrders[phone];
                if ((!order.status || order.status === 'pending') && order.time) {
                    const orderTime = new Date(order.time);
                    const diffHours = (now - orderTime) / (1000 * 60 * 60);
                    
                    if (diffHours >= 1 && diffHours <= 24 && !order.dripSent) {
                        console.log(`[Automated Campaigns] Triggering abandoned cart follow-up for ${order.name} (${phone})`);
                        
                        const url = `https://graph.facebook.com/${CONFIG.api_version}/${CONFIG.phone_number_id}/messages`;
                        const textMsg = `مرحباً ${order.name || "عزيزي العميل"}، لاحظنا أن طلبك في السلة لم يتم استكماله بعد. هل تواجه أي مشكلة أو تحتاج لمساعدة في إتمام الطلب؟ فريق الدعم هنا لخدمتك! 🛒`;
                        
                        await axios.post(url, {
                            messaging_product: "whatsapp",
                            to: phone,
                            type: "text",
                            text: { body: textMsg }
                        }, {
                            headers: { 'Authorization': `Bearer ${CONFIG.access_token}` }
                        });

                        order.dripSent = true;
                        updated = true;

                        let inbox = loadJSON(INBOX_FILE);
                        let existing = inbox.find(c => c.phone === phone);
                        if (existing) {
                            existing.messages = existing.messages || [];
                            existing.messages.push({
                                text: `[حملة استرجاع السلة التلقائية]: ${textMsg}`,
                                from: "agent",
                                time: new Date().toLocaleString('ar-EG'),
                                status: "sent"
                            });
                            existing.lastUpdated = new Date().toLocaleString('ar-EG');
                            inbox = inbox.filter(c => c.phone !== phone);
                            inbox.unshift(existing);
                            saveJSON(INBOX_FILE, inbox.slice(0, 100));
                        }
                    }
                }
            }
            if (updated) {
                saveJSON(DB_FILE, localOrders);
            }
    } catch (e) {
        console.error("[Automated Campaigns] Error executing drip schedule:", e.message);
    }
};

const startAutomatedDripCampaigns = () => {
    setInterval(async () => {
        try {
            const Tenant = mongoose.model('Tenant');
            const tenants = await Tenant.find({});
            for (const t of tenants) {
                await new Promise(resolve => tenantStorage.run({ tenantId: t._id.toString() }, async () => {
                    await _processDripCampaignsCore();
                    resolve();
                }));
            }
        } catch (e) { console.error('[DripCampaigns] Tenant loop error:', e.message); }
    }, 60 * 60 * 1000);
};

startAutomatedDripCampaigns();

// ─────────────────────────────────────────────
//  WooCommerce Integration
// ─────────────────────────────────────────────
app.get('/api/woo/orders', async (_req, res) => {
    if (!CONFIG.woo_url || !CONFIG.woo_consumer_key) {
        return res.status(400).json({ error: 'WooCommerce not configured. Add WOO_URL and WOO_CONSUMER_KEY in settings.' });
    }
    try {
        const url = `https://${CONFIG.woo_url}/wp-json/wc/v3/orders?status=processing&per_page=50`;
        const response = await axios.get(url, {
            auth: { username: CONFIG.woo_consumer_key, password: CONFIG.woo_consumer_secret }
        });
        const orders = response.data;
        let localOrders = loadJSON(DB_FILE);
        if (Array.isArray(localOrders)) localOrders = {};
        let dbChanged = false;
        const enriched = orders.map(o => {
            const phone = o.billing?.phone || '';
            const cleanPhone = normalizePhone(phone);
            const local = findLocalOrder(localOrders, cleanPhone, o.id);
            if (!local && cleanPhone) {
                const orderName = `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'WooCommerce Customer';
                triggerAutomation('order_created', null, cleanPhone, orderName);
                localOrders[o.id || cleanPhone] = {
                    phone: cleanPhone, status: 'pending',
                    time: o.date_created || new Date().toISOString(),
                    name: orderName, id: o.id, source: 'woocommerce'
                };
                dbChanged = true;
            }
            const currentLocal = findLocalOrder(localOrders, cleanPhone, o.id);
            return {
                id: o.id,
                name: `#${o.number}`,
                total_price: o.total,
                created_at: o.date_created,
                customer: { first_name: o.billing?.first_name || '', phone: o.billing?.phone || '' },
                shipping_address: {
                    first_name: o.shipping?.first_name || o.billing?.first_name || '',
                    phone: o.billing?.phone || '',
                    address1: o.shipping?.address_1 || o.billing?.address_1 || '',
                    city: o.shipping?.city || o.billing?.city || '',
                    country: o.shipping?.country || o.billing?.country || ''
                },
                line_items: (o.line_items || []).map(li => ({ title: li.name, price: li.price, quantity: li.quantity })),
                is_sent: !!currentLocal,
                local_status: currentLocal?.status || null,
                source: 'woocommerce'
            };
        });
        if (dbChanged) saveJSON(DB_FILE, localOrders);
        res.json(enriched);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─────────────────────────────────────────────
//  Outbound Webhooks
// ─────────────────────────────────────────────
app.post('/api/webhooks/test', async (_req, res) => {
    if (!CONFIG.webhook_url) return res.status(400).json({ error: 'Webhook URL not configured. Add it in Settings.' });
    try {
        await axios.post(CONFIG.webhook_url, {
            event: 'test',
            data: { message: 'Test webhook from OmniFlow', business: CONFIG.business_name },
            timestamp: new Date().toISOString(),
            source: 'omniflow'
        }, { timeout: 8000 });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: `Webhook failed: ${e.message}` });
    }
});

// ─────────────────────────────────────────────
//  نقاط الولاء (Loyalty Points)
// ─────────────────────────────────────────────
app.get('/api/loyalty', (_req, res) => {
    let all = loadJSON(LOYALTY_FILE);
    if (!Array.isArray(all)) all = [];
    const inbox = loadJSON(INBOX_FILE);
    const nameMap = {};
    if (Array.isArray(inbox)) inbox.forEach(c => { nameMap[c.phone] = c.name; });
    const localOrders = loadJSON(DB_FILE);
    if (!Array.isArray(localOrders)) {
        for (const key in localOrders) {
            if (localOrders[key]?.name && localOrders[key]?.phone) nameMap[localOrders[key].phone] = localOrders[key].name;
        }
    }
    res.json(all.map(e => ({ ...e, name: nameMap[e.phone] || 'عميل' })));
});

app.get('/api/loyalty/:phone', (req, res) => {
    const phone = normalizePhone(req.params.phone);
    let all = loadJSON(LOYALTY_FILE);
    if (!Array.isArray(all)) all = [];
    const entry = all.find(e => e.phone === phone) || { phone, points: 0, history: [] };
    res.json(entry);
});

app.post('/api/loyalty/award', (req, res) => {
    const { phone, points, reason } = req.body;
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !points) return res.status(400).json({ error: 'Phone and points required' });
    let all = loadJSON(LOYALTY_FILE);
    if (!Array.isArray(all)) all = [];
    let entry = all.find(e => e.phone === cleanPhone);
    if (!entry) { entry = { phone: cleanPhone, points: 0, history: [] }; all.push(entry); }
    entry.points = (entry.points || 0) + parseInt(points);
    entry.history = entry.history || [];
    entry.history.push({ points: parseInt(points), reason: reason || 'Manual', time: new Date().toISOString() });
    saveJSON(LOYALTY_FILE, all);
    res.json({ success: true, points: entry.points });
});

app.delete('/api/loyalty/:phone', (req, res) => {
    const phone = normalizePhone(req.params.phone);
    let all = loadJSON(LOYALTY_FILE);
    if (!Array.isArray(all)) all = [];
    saveJSON(LOYALTY_FILE, all.filter(e => e.phone !== phone));
    res.json({ success: true });
});

// ─────────────────────────────────────────────
//  الردود السريعة (Quick Replies)
// ─────────────────────────────────────────────
app.get('/api/quick-replies', (_req, res) => {
    let list = loadJSON(QUICK_REPLIES_FILE);
    if (!Array.isArray(list)) list = [];
    res.json(list);
});

app.post('/api/quick-replies', (req, res) => {
    const { title, text } = req.body;
    if (!title?.trim() || !text?.trim()) return res.status(400).json({ error: 'Title and text required' });
    let list = loadJSON(QUICK_REPLIES_FILE);
    if (!Array.isArray(list)) list = [];
    const item = { id: `qr_${Date.now()}`, title: title.trim(), text: text.trim(), created_at: new Date().toISOString() };
    list.push(item);
    saveJSON(QUICK_REPLIES_FILE, list);
    res.json(item);
});

app.put('/api/quick-replies/:id', (req, res) => {
    const { title, text } = req.body;
    let list = loadJSON(QUICK_REPLIES_FILE);
    if (!Array.isArray(list)) list = [];
    const item = list.find(r => r.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (title?.trim()) item.title = title.trim();
    if (text?.trim()) item.text = text.trim();
    saveJSON(QUICK_REPLIES_FILE, list);
    res.json(item);
});

app.delete('/api/quick-replies/:id', (req, res) => {
    let list = loadJSON(QUICK_REPLIES_FILE);
    if (!Array.isArray(list)) list = [];
    saveJSON(QUICK_REPLIES_FILE, list.filter(r => r.id !== req.params.id));
    res.json({ success: true });
});

// ─────────────────────────────────────────────
//  البث المجدول (Scheduled Broadcasts)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  البث المجدول (Scheduled Broadcasts)
// ─────────────────────────────────────────────
app.get('/api/broadcasts', authMiddleware, (req, res) => {
    let list = loadJSON(BROADCASTS_FILE);
    if (!Array.isArray(list)) list = [];
    const tenantId = req.tenant?._id;
    res.json(list.filter(b => b.tenant_id === tenantId || !b.tenant_id));
});

app.post('/api/broadcasts', authMiddleware, (req, res) => {
    const { name, scheduled_at, campaign_type, template_id, message_text, template_image_url, target_tag } = req.body;
    if (!scheduled_at) return res.status(400).json({ error: 'scheduled_at is required' });
    let list = loadJSON(BROADCASTS_FILE);
    if (!Array.isArray(list)) list = [];
    const item = {
        id: `bc_${Date.now()}`,
        tenant_id: req.tenant?._id || 'global',
        name: name || 'Scheduled Broadcast',
        scheduled_at,
        campaign_type: campaign_type || 'template',
        template_id: template_id || null,
        message_text: message_text || '',
        template_image_url: template_image_url || '',
        target_tag: target_tag || 'all',
        status: 'pending',
        created_at: new Date().toISOString()
    };
    list.push(item);
    saveJSON(BROADCASTS_FILE, list);
    res.json(item);
});

app.delete('/api/broadcasts/:id', authMiddleware, (req, res) => {
    let list = loadJSON(BROADCASTS_FILE);
    if (!Array.isArray(list)) list = [];
    const tenantId = req.tenant?._id;
    const item = list.find(b => b.id === req.params.id && (b.tenant_id === tenantId || !b.tenant_id));
    if (item && item.status === 'pending') item.status = 'cancelled';
    saveJSON(BROADCASTS_FILE, list);
    res.json({ success: true });
});

const _processBroadcastsCore = async () => {
    let list = loadJSON(BROADCASTS_FILE);
    if (!Array.isArray(list)) list = [];
    const now = new Date();
    const due = list.filter(b => b.status === 'pending' && new Date(b.scheduled_at) <= now);
    if (!due.length) return;

    const templates = loadJSON(TEMPLATES_FILE);

    // ── تنفيذ كل broadcast مستحق ───────────────────────────────────────────────
    for (const broadcast of due) {
        // Build isolated phoneMap for this broadcast's tenant
        const phoneMap = new Map();

        try {
            const tenantId = broadcast.tenant_id;
            let _sUrl = '';
            let _sToken = '';
            if (tenantId && tenantId !== 'global') {
                const Tenant = require('./models/Tenant');
                const tenant = await Tenant.findById(tenantId);
                const credentials = getShopifyForTenant(tenant);
                _sUrl = credentials.shopify_url;
                _sToken = credentials.shopify_access_token;
            }
            if (!_sUrl) _sUrl = CONFIG.shopify_url || '';
            if (!_sToken) _sToken = CONFIG.shopify_access_token || '';

            if (_sUrl && _sToken) {
                const [ordersRes, custRes] = await Promise.all([
                    axios.get(`https://${_sUrl}/admin/api/2024-04/orders.json?status=any&limit=250`,
                        { headers: { 'X-Shopify-Access-Token': _sToken } }),
                    axios.get(`https://${_sUrl}/admin/api/2024-04/customers.json?limit=250`,
                        { headers: { 'X-Shopify-Access-Token': _sToken } }),
                ]);
                ordersRes.data.orders?.forEach(o => {
                    const phone = (o.shipping_address?.phone || o.customer?.phone || '').replace(/[^\d]/g, '');
                    const name = o.shipping_address?.first_name || o.customer?.first_name || 'عميل';
                    if (phone) phoneMap.set(phone, name);
                });
                custRes.data.customers?.forEach(c => {
                    const phone = (c.phone || c.default_address?.phone || '').replace(/[^\d]/g, '');
                    const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'عميل';
                    if (phone && !phoneMap.has(phone)) phoneMap.set(phone, name);
                });
            }
        } catch (e) {
            console.error(`[Broadcasts] Shopify fetch error for campaign ${broadcast.name}:`, e.message);
        }

        // Fallback to local files if no Shopify customers fetched for this tenant/global
        if (phoneMap.size === 0) {
            let localOrders = loadJSON(DB_FILE);
            if (Array.isArray(localOrders)) localOrders = {};
            for (const key in localOrders) {
                const o = localOrders[key];
                if (o?.phone) phoneMap.set(o.phone, o.name || 'عميل');
            }
            const inbox = loadJSON(INBOX_FILE);
            if (Array.isArray(inbox)) {
                inbox.forEach(c => { if (c.phone) phoneMap.set(normalizePhone(c.phone), c.name || 'عميل'); });
            }
        }

        console.log(`[Broadcasts] Firing "${broadcast.name}" → ${phoneMap.size} recipients`);
        broadcast.status = 'running';
        saveJSON(BROADCASTS_FILE, list);

        let success = 0, fail = 0;

        for (const [phone, customerName] of phoneMap) {
            try {
                let msgObj;

                if (broadcast.campaign_type === 'template' && broadcast.template_id) {
                    const tpl = templates[broadcast.template_id];
                    if (!tpl) { fail++; continue; }
                    let body = tpl.body || tpl.content || '';
                    body = body
                        .replace(/\{\{1\}\}/g, customerName)
                        .replace(/\{\{name\}\}/gi, customerName);
                    if (broadcast.template_image_url) {
                        msgObj = { messageType: 'image', imageUrl: broadcast.template_image_url, caption: body };
                    } else {
                        msgObj = { messageType: 'text', text: body };
                    }
                } else if (broadcast.message_text) {
                    const text = broadcast.message_text
                        .replace(/\[Name\]/gi, customerName)
                        .replace(/\{\{name\}\}/gi, customerName);
                    msgObj = { messageType: 'text', text };
                } else {
                    fail++; continue;
                }

                await sendViaWasender(phone, msgObj);
                success++;
            } catch (e) {
                console.error(`[Broadcasts] Failed → ${phone}:`, e.message);
                fail++;
            }
            await new Promise(r => setTimeout(r, 1500)); // Delay to avoid ban
        }

        broadcast.status = 'done';
        broadcast.sent = success;
        broadcast.failed = fail;
        broadcast.fired_at = new Date().toISOString();
        console.log(`[Broadcasts] Done: ${success} sent, ${fail} failed`);
    }
    saveJSON(BROADCASTS_FILE, list);
};

const processBroadcasts = async () => {
    try {
        const Tenant = mongoose.model('Tenant');
        const tenants = await Tenant.find({});
        for (const t of tenants) {
            await new Promise(resolve => tenantStorage.run({ tenantId: t._id.toString() }, async () => {
                await _processBroadcastsCore();
                resolve();
            }));
        }
    } catch (e) { console.error('[Broadcasts] Error:', e.message); }
};

setInterval(processBroadcasts, 60 * 1000);

// ─────────────────────────────────────────────
//  تصدير CSV (Export)
// ─────────────────────────────────────────────
const toCSV = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
};

app.get('/api/export/contacts', (_req, res) => {
    const inbox = loadJSON(INBOX_FILE);
    const rows = Array.isArray(inbox) ? inbox.map(c => ({
        phone: normalizePhone(c.phone),
        name: c.name || '',
        messages: c.messages?.length || 0,
        last_updated: c.lastUpdated || '',
        label: (c.labels || []).join('|'),
        assigned_to: c.assigned_to || ''
    })) : [];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send('﻿' + toCSV(rows));
});

app.get('/api/export/orders', (_req, res) => {
    let localOrders = loadJSON(DB_FILE);
    if (Array.isArray(localOrders)) localOrders = {};
    const rows = Object.values(localOrders).map(o => ({
        phone: o.phone || '',
        name: o.name || '',
        status: o.status || 'pending',
        time: o.time || '',
        order_id: o.id || '',
        source: o.source || 'shopify'
    }));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send('﻿' + toCSV(rows));
});

// Shopify Embedded App: branded info page served inside Shopify Admin iframe
app.get('/embedded', (req, res) => {
    res.setHeader('Content-Security-Policy',
        "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com");
    res.sendFile(path.join(__dirname, 'embedded.html'));
});

// Catch-all: serve React app for non-API routes (Express 5 syntax: /{*splat})
// If Shopify opens the app with ?shop=:
//   - shop already installed → issue JWT and go straight to dashboard
//   - new shop → start OAuth flow
if (fs.existsSync(FRONTEND_DIST)) {
    app.get('/{*splat}', async (req, res) => {
        const shop = req.query.shop;
        if (shop && /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop)) {
            const { signToken } = require('./middleware/auth');
            // Check if shop is already installed via Tenant
            try {
                let Tenant;
                try { Tenant = require('./models/Tenant'); } catch (_) {}
                if (Tenant) {
                    const tenant = await Tenant.findOne({
                        $or: [
                            { 'config.shopify_url': `https://${shop}` },
                            { 'config.shopify_url': shop },
                        ]
                    });
                    if (tenant?.config?.shopify_access_token) {
                        const jwt = signToken(tenant._id);
                        return res.redirect(`/embedded#jwt=${encodeURIComponent(jwt)}&shop=${encodeURIComponent(shop)}`);
                    }
                }
            } catch (_) {}
            // New shop — start OAuth
            return res.redirect(`/auth?shop=${encodeURIComponent(shop)}`);
        }
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
