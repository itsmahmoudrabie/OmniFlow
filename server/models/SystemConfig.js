const mongoose = require('mongoose');

// Single-document collection that stores all app config.
// Works for both dev-admin-001 and real tenants — completely auth-independent.
const systemConfigSchema = new mongoose.Schema({
    _id:                  { type: String, default: 'main' },
    business_name:        { type: String, default: '' },
    access_token:         { type: String, default: '' },
    phone_number_id:      { type: String, default: '' },
    verify_token:         { type: String, default: '' },
    catalog_id:           { type: String, default: '' },
    server_url:           { type: String, default: '' },
    groq_api_key:         { type: String, default: '' },
    gemini_api_key:       { type: String, default: '' },
    groq_model:           { type: String, default: 'llama-3.3-70b-versatile' },
    woo_url:              { type: String, default: '' },
    woo_consumer_key:     { type: String, default: '' },
    woo_consumer_secret:  { type: String, default: '' },
    webhook_url:          { type: String, default: '' },
    loyalty_points:       { type: Number, default: 10 },
    shopify_url:          { type: String, default: '' },
    shopify_access_token: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
