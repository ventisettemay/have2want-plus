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

/* ------------------------------------------------------------------ */
/* Token azione monouso (JWT-like firmato HMAC-SHA256)                */
/* ------------------------------------------------------------------ */

function base64urlEncode(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface ActionTokenPayload {
  sub: string;      // user_id
  act: string;      // action_type
  cid: string;      // campaign_id
  iid: string;      // impression_id
  exp: number;      // scadenza ms
  iat: number;      // emissione ms
  jti: string;      // id univoco del token
}

export async function signActionToken(
  payload: ActionTokenPayload,
  secret: string = WEBHOOK_SECRET
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const sigB64 = base64urlEncode(new Uint8Array(sig));

  return `${signingInput}.${sigB64}`;
}

export interface VerifyActionTokenResult {
  valid: boolean;
  payload?: ActionTokenPayload;
  error?: string;
}

export async function verifyActionToken(
  token: string,
  secret: string = WEBHOOK_SECRET,
  expectedAction?: string,
  expectedUserId?: string
): Promise<VerifyActionTokenResult> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Token malformato' };
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  // Verifica firma
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = base64urlDecode(sigB64);
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(signingInput)
    );
    if (!ok) {
      return { valid: false, error: 'Firma non valida' };
    }
  } catch {
    return { valid: false, error: 'Errore verifica firma' };
  }

  // Decodifica payload
  let payload: ActionTokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64))) as ActionTokenPayload;
  } catch {
    return { valid: false, error: 'Payload non decodificabile' };
  }

  // Scadenza
  if (!payload.exp || Date.now() > payload.exp) {
    return { valid: false, error: 'Token scaduto' };
  }

  // Azione attesa
  if (expectedAction && payload.act !== expectedAction) {
    return { valid: false, error: `Azione non corrispondente: attesa ${expectedAction}, trovata ${payload.act}` };
  }

  // Utente atteso
  if (expectedUserId && payload.sub !== expectedUserId) {
    return { valid: false, error: 'Utente non corrispondente' };
  }

  return { valid: true, payload };
}
