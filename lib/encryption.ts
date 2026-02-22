// lib/encryption.ts
// AES-256-GCM encryption for sensitive data like OAuth tokens
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // Recommended for GCM
const TAG_LENGTH = 16
const SALT_LENGTH = 16

// Get encryption key from environment
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  // Ensure key is exactly 32 bytes (256 bits)
  return crypto.scryptSync(key, 'salt', 32)
}

/**
 * Encrypt data using AES-256-GCM
 * Output format: base64(salt + iv + tag + ciphertext)
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  // Derive a unique key for each encryption using salt
  const derivedKey = crypto.scryptSync(key, salt, 32)

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: TAG_LENGTH,
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  // Combine all components: salt + iv + tag + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted])

  return combined.toString('base64')
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const combined = Buffer.from(ciphertext, 'base64')

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

  // Derive the same key using the salt
  const derivedKey = crypto.scryptSync(key, salt, 32)

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: TAG_LENGTH,
  })

  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

/**
 * Hash sensitive data (one-way, for verification)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Compare two strings in constant time (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Encrypt OAuth tokens before storing
 */
export function encryptTokens(tokens: {
  access_token: string
  refresh_token?: string
}): {
  access_token: string
  refresh_token?: string
} {
  return {
    access_token: encrypt(tokens.access_token),
    refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
  }
}

/**
 * Decrypt OAuth tokens after retrieving
 */
export function decryptTokens(tokens: {
  access_token: string
  refresh_token?: string | null
}): {
  access_token: string
  refresh_token?: string
} {
  return {
    access_token: decrypt(tokens.access_token),
    refresh_token: tokens.refresh_token ? decrypt(tokens.refresh_token) : undefined,
  }
}
