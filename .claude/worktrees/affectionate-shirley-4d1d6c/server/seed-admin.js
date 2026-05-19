require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/omniflow';

async function seedAdmin() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@omniflow.app';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existing = await Tenant.findOne({ email });
    if (existing) {
        // Update to enterprise + active
        existing.plan = 'enterprise';
        existing.status = 'active';
        existing.trialEnds = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10); // 10 years
        existing.nextBillingDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10);
        existing.applyPlanLimits();
        await existing.save();
        console.log(`✅ Updated existing admin: ${email}`);
    } else {
        const admin = new Tenant({
            name: 'Admin',
            email,
            password,
            plan: 'enterprise',
            status: 'active',
            trialEnds: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10),
            nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10),
        });
        admin.applyPlanLimits();
        await admin.save();
        console.log(`✅ Created admin account: ${email}`);
    }

    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    await mongoose.disconnect();
}

seedAdmin().catch(e => { console.error(e); process.exit(1); });
