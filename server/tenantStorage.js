const { AsyncLocalStorage } = require('async_hooks');

// Create a storage instance to hold the tenant context for the current async execution tree
const tenantStorage = new AsyncLocalStorage();

// Retrieve the current tenantId from the async context, fallback to 'global'
const getTenantId = () => tenantStorage.getStore()?.tenantId || 'global';

module.exports = { tenantStorage, getTenantId };
