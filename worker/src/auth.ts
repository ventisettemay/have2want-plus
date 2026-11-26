import type { ExecutionContext } from './types';

export const WEBHOOK_SECRET = (typeof process !== 'undefined' && process.env.WEBHOOK_SECRET)
  ? process.env.WEBHOOK_SECRET.trim()
  : 'dev_secret_change_me';

export async function computeHmacSha256(secret: string, rawBody: string | ArrayBuffer): Promise<string> {
  const data = typeof rawBody === 'string' ? new TextEncoder().encode(rawBody) : new Uint8Array(rawBody);
  return crypto.subtle
    .importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then((key) => crypto.subtle.sign('HMAC', key, data))
    .then((sig) => {
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return hex;
    });
}

export async function verifyWebhookSignature(
  secret: string,
  signature: string | null,
  rawBody: string | ArrayBuffer
): Promise<boolean> {
  if (!signature) return false;
  const expected = await computeHmacSha256(secret, rawBody);
  // Confronto a tempo costante
  const sigBuf = hexToBytes(signature);
  const expBuf = hexToBytes(expected);
  if (sigBuf.length !== expBuf.length) return false;
  let diff = 0;
  for (let i = 0; i < sigBuf.length; i++) diff |= sigBuf[i] ^ expBuf[i];
  return diff === 0;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function generateId(): string {
  const buf = crypto.getRandomValues(new Uint8Array(4));
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${hex}`;
}

export function nowMs(): number {
  return Date.now();
}
