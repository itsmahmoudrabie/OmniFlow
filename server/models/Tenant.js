const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tenantSchema = new mongoose.Schema({
    // Auth
    email:        { type: String, required: true, unique: true, lowercase: true },
    password:     { type: String, required: true },
    name:         { type: String, required: true },

    // Plan
    plan:         { type: String, enum: ['trial', 'starter', 'growth', 'pro', 'enterprise'], default: 'trial' },
    trialEnds:    { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status:       { type: String, enum: ['trial', 'active', 'past_due', 'cancelled'], default: 'trial' },

    // Shopify Billing
    shopifyChargeId:     { type: String },
    shopifyChargeStatus: { type: String }, // pending/active/declined/expired/cancelled
    shopifyShop:         { type: String }, // store domain e.g. my-store.myshopify.com

    // PayMob
    paymobSubId:      { type: String },
    paymobToken:      { type: String },
    cardToken:        { type: String },  // masked card token for recurring
    cardLastFour:     { type: String },
    nextBillingDate:  { type: Date },

    // WhatsApp config (per tenant)
    config: {
        business_name:       { type: String, default: '' },
        access_token:        { type: String, default: '' },
        phone_number_id:     { type: String, default: '' },
        verify_token:        { type: String, default: '' },
        shopify_url:          { type: String, default: '' },
        shopify_access_token: { type: String, default: '' },
        shopify_client_id:    { type: String, default: '' },
        shopify_client_secret:{ type: String, default: '' },
        shopify_token_expiry: { type: Date,   default: null },
        server_url:           { type: String, default: '' },
        catalog_id:          { type: String, default: '' },
        groq_api_key:        { type: String, default: '' },
        gemini_api_key:      { type: String, default: '' },
        groq_model:          { type: String, default: 'llama-3.3-70b-versatile' },
        woo_url:             { type: String, default: '' },
        woo_consumer_key:    { type: String, default: '' },
        woo_consumer_secret: { type: String, default: '' },
        webhook_url:         { type: String, default: '' },
        loyalty_points:      { type: Number, default: 10 },
        ai_enabled:          { type: Boolean, default: false },
        ai_auto_reply:       { type: Boolean, default: true },
        ai_instruction:      { type: String, default: '' },
        language:            { type: String, default: 'ar' },
        is_configured:       { type: Boolean, default: false },
    },

    // Limits per plan
    limits: {
        conversations: { type: Number, default: 1000 },
        numbers:       { type: Number, default: 1 },
        members:       { type: Number, default: 2 },
    },

    // Usage this month
    usage: {
        conversations: { type: Number, default: 0 },
        resetDate:     { type: Date, default: () => new Date() },
    },

    createdAt: { type: Date, default: Date.now },
});

// Hash password before save
tenantSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

tenantSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

// Set limits based on plan
tenantSchema.methods.applyPlanLimits = function () {
    const limits = {
        trial:      { conversations: 500,       numbers: 1,  members: 2  },
        starter:    { conversations: 1000,      numbers: 1,  members: 2  },
        growth:     { conversations: 5000,      numbers: 3,  members: 10 },
        pro:        { conversations: 999999,    numbers: 10, members: 999 },
        enterprise: { conversations: 999999999, numbers: 999,members: 999 },
    };
    this.limits = limits[this.plan] || limits.starter;
};

module.exports = mongoose.model('Tenant', tenantSchema);
