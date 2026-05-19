const mongoose = require('mongoose');

const WhatsAppRouterSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true },
    lastInteractedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WhatsAppRouter', WhatsAppRouterSchema);
