const mongoose = require('mongoose');

const shopifyConfigSchema = new mongoose.Schema({
    shop:          { type: String, required: true, unique: true },
    access_token:  { type: String, required: true },
    token_expiry:  { type: Date,   default: null },
    scope:         { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ShopifyConfig', shopifyConfigSchema);
