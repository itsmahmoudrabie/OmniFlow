/**
 * Shopify OAuth + Webhooks module for OmniFlow
 * ----------------------------------------------
 * Handles OAuth install flow, webhook verification, and HMAC validation.
 * Tokens are stored in Tenant.config.shopify_access_token (MongoDB) — the single source of truth.
 */
const crypto = require('crypto');
const axios = require('axios');
const { encrypt, decrypt } = require('./utils/crypto');

// ─── HMAC verification ───
const verifyOAuthHmac = (query, secret) => {
    const { hmac, signature, ...rest } = query;
    if (!hmac) return false;
    const message = Object.keys(rest)
        .sort()
        .map(k => `${k}=${Array.isArray(rest[k]) ? rest[k].join(',') : rest[k]}`)
        .join('&');
    const generated = crypto.createHmac('sha256', secret).update(message).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmac, 'utf8'), Buffer.from(generated, 'utf8'));
};

const verifyShopifyWebhook = (rawBody, hmacHeader, secret) => {
    if (!hmacHeader) return false;
    const generated = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');
    try {
        return crypto.timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(generated));
    } catch { return false; }
};

const isValidShopDomain = (shop) =>
    typeof shop === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);

// ─── Mount OAuth routes onto Express app ───
const mountShopifyOAuth = (app, CONFIG = {}) => {
    const API_KEY    = process.env.SHOPIFY_API_KEY || '';
    const API_SECRET = process.env.SHOPIFY_API_SECRET || '';
    const APP_URL    = (process.env.SHOPIFY_APP_URL || process.env.HOST || '').replace(/\/$/, '');
    const SCOPES     = (process.env.SHOPIFY_SCOPES ||
        'read_products,read_orders,write_orders,read_customers,read_inventory,read_fulfillments,write_fulfillments').trim();

    if (!API_KEY || !API_SECRET || !APP_URL) {
        console.warn('[Shopify OAuth] Missing SHOPIFY_API_KEY / SHOPIFY_API_SECRET / SHOPIFY_APP_URL — OAuth disabled.');
    }

    // 1) Install entry: /auth?shop=YOUR-SHOP.myshopify.com
    app.get('/auth', (req, res) => {
        const shop = String(req.query.shop || '').toLowerCase();
        if (!isValidShopDomain(shop)) return res.status(400).send('Invalid shop domain');
        const state = crypto.randomBytes(16).toString('hex');
        res.cookie?.('shopify_oauth_state', state, { httpOnly: true, sameSite: 'none', secure: true });

        const redirectUri = `${APP_URL}/auth/callback`;
        const installUrl =
            `https://${shop}/admin/oauth/authorize` +
            `?client_id=${encodeURIComponent(API_KEY)}` +
            `&scope=${encodeURIComponent(SCOPES)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${encodeURIComponent(state)}`; // offline access token (no grant_options)

        res.redirect(installUrl);
    });

    // 2) Callback: Shopify redirects here after merchant approves
    app.get('/auth/callback', async (req, res) => {
        const { shop, hmac, code, state } = req.query;

        if (!isValidShopDomain(shop)) return res.status(400).send('Invalid shop');
        if (!hmac || !code) return res.status(400).send('Missing hmac/code');
        if (!verifyOAuthHmac(req.query, API_SECRET)) return res.status(400).send('HMAC verification failed');

        // State validation
        const parseCookies = (cookieHeader) => {
            const list = {};
            if (!cookieHeader) return list;
            cookieHeader.split(';').forEach(cookie => {
                let parts = cookie.split('=');
                list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
            });
            return list;
        };
        const cookies = parseCookies(req.headers.cookie);
        const cookieState = cookies.shopify_oauth_state;

        if (!state || state !== cookieState) {
            console.warn('[Shopify OAuth] State mismatch or expired. Query state:', state, 'Cookie state:', cookieState);
            return res.status(400).send('State validation failed. Please try installing again.');
        }

        try {
            // Exchange code for access token
            const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
                client_id: API_KEY,
                client_secret: API_SECRET,
                code
            });
            const { access_token, scope } = tokenRes.data;

            // Encrypt token for database storage
            const encryptedToken = encrypt(access_token);

            // Always persist to MongoDB so token survives Railway redeploys
            try {
                const Tenant = require('./models/Tenant');
                await Tenant.findOneAndUpdate(
                    {},
                    { $set: { 'config.shopify_url': `https://${shop}`, 'config.shopify_access_token': encryptedToken } },
                    { sort: { createdAt: -1 }, upsert: false }
                );
                console.log(`[Shopify OAuth] Encrypted token saved to MongoDB for ${shop}`);
            } catch (e) {
                console.warn('[Shopify OAuth] MongoDB save failed:', e.message);
            }

            // Register mandatory webhooks (best-effort)
            await registerWebhooks(shop, access_token, APP_URL).catch(e =>
                console.warn('[Shopify] Webhook registration warning:', e.message)
            );

            // Create or find Tenant by Shopify shop domain, issue JWT
            let jwtToken = null;
            try {
                const { signToken } = require('./middleware/auth');
                let Tenant;
                try { Tenant = require('./models/Tenant'); } catch (_) {}

                if (Tenant) {
                    // Fetch shop info from Shopify to get business name/email
                    let shopName = shop.replace('.myshopify.com', '');
                    let shopEmail = `${shopName}@shopify.com`;
                    try {
                        const shopInfo = await axios.get(`https://${shop}/admin/api/2024-01/shop.json`, {
                            headers: { 'X-Shopify-Access-Token': access_token }
                        });
                        shopName  = shopInfo.data.shop?.name  || shopName;
                        shopEmail = shopInfo.data.shop?.email || shopEmail;
                    } catch (_) {}

                    let tenant = await Tenant.findOne({ 'config.shopify_url': `https://${shop}` });
                    if (!tenant) {
                        tenant = new Tenant({
                            name: shopName,
                            email: shopEmail,
                            password: `shopify-${Date.now()}-${Math.random()}`,
                            plan: 'starter',
                            status: 'trial',
                            config: {
                                shopify_url: `https://${shop}`,
                                shopify_access_token: encryptedToken,
                            }
                        });
                        tenant.applyPlanLimits();
                        await tenant.save();
                    } else {
                        tenant.config.shopify_access_token = encryptedToken;
                        await tenant.save();
                    }
                    jwtToken = signToken(tenant._id);
                } else {
                    // Dev mode — no MongoDB
                    const { signToken: sign } = require('./middleware/auth');
                    jwtToken = sign('dev-admin-001');
                }
            } catch (tenantErr) {
                console.warn('[Shopify OAuth] Tenant upsert failed:', tenantErr.message);
                const { signToken: sign } = require('./middleware/auth');
                jwtToken = sign('dev-admin-001');
            }

            // Redirect to embedded page (shown inside Shopify Admin iframe)
            if (jwtToken) {
                res.redirect(`/embedded#jwt=${encodeURIComponent(jwtToken)}&shop=${encodeURIComponent(shop)}&app_url=${encodeURIComponent(APP_URL)}`);
            } else {
                res.redirect('/');
            }
        } catch (err) {
            console.error('[Shopify OAuth] Token exchange failed:', err.response?.data || err.message);
            res.status(500).send('OAuth token exchange failed');
        }
    });

    // 3) Webhook receiver (raw body required for HMAC).
    //    IMPORTANT: mount `app.use('/webhooks/shopify', express.raw({ type: 'application/json' }))`
    //    BEFORE bodyParser.json in your main file — see index.js patch in setup guide.
    app.post('/webhooks/shopify/:topic', async (req, res) => {
        const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
        const shop = req.get('X-Shopify-Shop-Domain');
        const topic = req.params.topic;

        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        if (!verifyShopifyWebhook(rawBody, hmacHeader, API_SECRET)) {
            return res.status(401).send('Invalid HMAC');
        }
        const payload = JSON.parse(rawBody.toString('utf8'));

        // GDPR mandatory webhooks
        if (['customers/data_request', 'customers/redact', 'shop/redact'].includes(topic)) {
            console.log(`[GDPR] ${topic} from ${shop}`);
            return res.sendStatus(200);
        }

        // App uninstalled — clear token from Tenant
        if (topic === 'app/uninstalled') {
            try {
                const Tenant = require('./models/Tenant');
                await Tenant.findOneAndUpdate(
                    { $or: [{ 'config.shopify_url': `https://${shop}` }, { 'config.shopify_url': shop }] },
                    { $set: { 'config.shopify_access_token': '' } }
                );
                console.log(`[Shopify] Uninstalled + token cleared: ${shop}`);
            } catch (_) {}
            return res.sendStatus(200);
        }

        // Order created → forward to OmniFlow's internal handler if defined
        console.log(`[Webhook] ${topic} from ${shop} (id=${payload.id})`);
        try { app.emit('shopify:webhook', { topic, shop, payload }); } catch {}
        res.sendStatus(200);
    });

    // 4) Helper: shop status (for the dashboard) — reads from Tenant
    app.get('/api/shopify/connection', async (req, res) => {
        try {
            const Tenant = require('./models/Tenant');
            const tenant = await Tenant.findOne({
                'config.shopify_access_token': { $ne: '' }
            }).sort({ updatedAt: -1 }).select('config.shopify_url').lean();
            const shop = tenant?.config?.shopify_url
                ? tenant.config.shopify_url.replace(/https?:\/\//i, '').replace(/\/$/, '')
                : null;
            res.json({ connected: !!shop, shop });
        } catch (_) {
            res.json({ connected: false, shop: null });
        }
    });

    console.log(`[Shopify OAuth] Routes mounted. Install URL: ${APP_URL}/auth?shop=YOUR-STORE.myshopify.com`);
};

// ─── Webhook auto-registration ───
async function registerWebhooks(shop, token, appUrl) {
    const topics = [
        'orders/create',
        'orders/updated',
        'orders/fulfilled',
        'orders/cancelled',
        'checkouts/create',
        'checkouts/update',
        'customers/create',
        'app/uninstalled',
        'customers/data_request',
        'customers/redact',
        'shop/redact'
    ];
    const url = `https://${shop}/admin/api/2024-10/webhooks.json`;
    for (const topic of topics) {
        try {
            await axios.post(url, {
                webhook: {
                    topic,
                    address: `${appUrl}/webhooks/shopify/${topic.replace('/', '_')}`,
                    format: 'json'
                }
            }, {
                headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
            });
        } catch (e) {
            // 422 = already exists; ignore
            if (e.response?.status !== 422) {
                console.warn(`[Webhook] Failed to register ${topic}: ${e.response?.data?.errors || e.message}`);
            }
        }
    }
}

module.exports = {
    mountShopifyOAuth,
    verifyShopifyWebhook,
    verifyOAuthHmac,
    isValidShopDomain,
};
