const crypto = require('crypto');

// Derive 32-byte key from SHOPIFY_API_SECRET or fallback
const getSecretKey = () => {
    const secret = process.env.SHOPIFY_API_SECRET || process.env.COOKIE_SECRET || 'fallback-secret-for-omniflow-app';
    return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts clear text using AES-256-CBC.
 * Returns IV and Ciphertext separated by a colon.
 */
const encrypt = (text) => {
    if (!text) return '';
    // If it's already encrypted (starts with a 32-hex IV followed by a colon), don't encrypt again
    if (/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(text)) return text;
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', getSecretKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (e) {
        console.error('[Crypto] Encryption failed:', e.message);
        return text; // fallback to plain text if encryption fails
    }
};

/**
 * Decrypts ciphertext formatted as "iv:ciphertext" using AES-256-CBC.
 * If text doesn't match the encrypted pattern, returns it as-is.
 */
const decrypt = (encryptedText) => {
    if (!encryptedText) return '';
    if (!encryptedText.includes(':')) return encryptedText; // not encrypted
    try {
        const parts = encryptedText.split(':');
        const ivHex = parts.shift();
        const encryptedHex = parts.join(':');
        if (ivHex.length !== 32) return encryptedText; // invalid IV format, assume raw text
        
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', getSecretKey(), iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('[Crypto] Decryption failed:', e.message);
        return encryptedText; // return as-is
    }
};

module.exports = {
    encrypt,
    decrypt
};
