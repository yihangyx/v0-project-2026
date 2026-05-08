import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const HMAC_ALGO = 'sha256'
const KEY = Buffer.from(process.env.API_ENCRYPTION_KEY!, 'hex') // 32 bytes = 256 bits
const HMAC_KEY = Buffer.from(process.env.API_HMAC_KEY!, 'hex')  // 32 bytes

// ─── Request Signature (HMAC-SHA256) ────────────────────────────────────────

/**
 * Sign a payload with HMAC-SHA256.
 * Client must send: signature=hmac_sha256(timestamp + "." + body, secret)
 */
export function signPayload(timestamp: string, body: string): string {
  const hmac = crypto.createHmac(HMAC_ALGO, HMAC_KEY)
  hmac.update(`${timestamp}.${body}`)
  return hmac.digest('hex')
}

/** Verify client request signature. Throws on mismatch. */
export function verifySignature(
  timestamp: string,
  body: string,
  signature: string
): void {
  const age = Date.now() - parseInt(timestamp, 10)
  // Reject requests older than 5 minutes (replay protection)
  if (age > 5 * 60 * 1000 || age < -60_000) {
    throw new Error('INVALID_TIMESTAMP')
  }
  const expected = signPayload(timestamp, body)
  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  ) {
    throw new Error('INVALID_SIGNATURE')
  }
}

// ─── Response Encryption (AES-256-GCM) ───────────────────────────────────────

interface EncryptResult {
  iv: string      // base64
  tag: string     // base64
  data: string    // base64
}

/**
 * Encrypt data with AES-256-GCM.
 * Returns { iv, tag, data } all base64-encoded.
 */
export function encrypt(plaintext: string): EncryptResult {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: enc.toString('base64'),
  }
}

/** Decrypt data produced by encrypt(). */
export function decrypt(payload: { iv: string; tag: string; data: string }): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(payload.iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'))
  return (
    decipher.update(Buffer.from(payload.data, 'base64')) +
    decipher.final('utf8')
  )
}

// ─── Convenience: sealed response wrapper ────────────────────────────────────

/** Wrap any JSON-serialisable value in an encrypted sealed envelope. */
export function sealedResponse<T>(data: T): {
  v: number      // protocol version
  enc: EncryptResult
} {
  return { v: 1, enc: encrypt(JSON.stringify(data)) }
}
