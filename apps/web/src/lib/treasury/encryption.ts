// AES-256-GCM encryption for Plaid access tokens
// SERVER-SIDE ONLY — never import this from client components

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Reads TREASURY_ENCRYPTION_KEY from env.
 * Accepts a 64-char hex string (raw 32-byte key) or any string
 * which gets hashed to 32 bytes via SHA-256.
 */
function getKey(): Buffer {
  const raw = process.env.TREASURY_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('TREASURY_ENCRYPTION_KEY is not set');
  }

  // 64-char hex = 32 raw bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  // Fallback: hash arbitrary string to 32 bytes
  return createHash('sha256').update(raw).digest();
}

/**
 * Encrypts a plaintext string.
 * Returns a Buffer with layout: IV(16) + authTag(16) + ciphertext
 */
export function encrypt(plaintext: string): Buffer {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypts a Buffer produced by `encrypt`.
 * Expects layout: IV(16) + authTag(16) + ciphertext
 */
export function decrypt(data: Buffer): string {
  const key = getKey();
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
