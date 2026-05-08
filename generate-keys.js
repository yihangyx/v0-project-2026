// Run once: node generate-keys.js
// Output two hex strings (64 hex chars each = 32 bytes)
// Add these to your Vercel/hosting environment variables
const crypto = require('crypto')
console.log('API_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'))
console.log('API_HMAC_KEY=' + crypto.randomBytes(32).toString('hex'))
