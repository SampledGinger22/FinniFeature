import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Field-level PHI encryption (D39). AES-256-GCM with a per-value random IV; the stored token
// is base64(iv || authTag || ciphertext). Used only by the repository layer.

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;
const HEX_KEY_PATTERN = /^[0-9a-fA-F]{64}$/;

// Resolve the 32-byte key from PHI_ENCRYPTION_KEY (hex or base64); fail fast if absent/wrong.
function resolveKey(): Buffer {
  const raw = process.env.PHI_ENCRYPTION_KEY;
  if (!raw) throw new Error('PHI_ENCRYPTION_KEY is not set');
  const key = HEX_KEY_PATTERN.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) throw new Error('PHI_ENCRYPTION_KEY must decode to 32 bytes');
  return key;
}

export function encryptPhi(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, resolveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

export function decryptPhi(token: string): string {
  const data = Buffer.from(token, 'base64');
  const iv = data.subarray(0, IV_BYTES);
  const authTag = data.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = data.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, resolveKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// Null-passthrough variants for optional PHI columns (middle name, address lines, postal).
export function encryptNullablePhi(value: string | null): string | null {
  return value === null ? null : encryptPhi(value);
}

export function decryptNullablePhi(value: string | null): string | null {
  return value === null ? null : decryptPhi(value);
}
