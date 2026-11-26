// Utilità cross-runtime (Cloudflare Workers + Node.js) basata esclusivamente su Web Crypto
// per generare Firebase Custom Tokens (autenticazione Pi Network -> Firebase Auth)
// e Google OAuth2 Access Tokens (accesso server-side a Firestore REST API).

export interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  database_id?: string;
}

export interface FirebaseTokenEnv {
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_DATABASE_ID?: string;
}

const DEFAULT_PROJECT_ID = 'gen-lang-client-0597053183';
const DEFAULT_DATABASE_ID = 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa';

const oauthTokenCache = new Map<string, { token: string; expiresAtMs: number }>();

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeText(text: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(text));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importRs256PrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    },
    false,
    ['sign']
  );
}

export function resolveFirebaseServiceAccount(
  env: FirebaseTokenEnv
): FirebaseServiceAccount | null {
  const rawJson =
    typeof env?.FIREBASE_SERVICE_ACCOUNT_JSON === 'string'
      ? env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()
      : '';
  if (rawJson && rawJson !== 'PLACEHOLDER') {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed?.client_email && parsed?.private_key) {
        return {
          project_id: parsed.project_id || env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID,
          client_email: String(parsed.client_email).trim(),
          private_key: String(parsed.private_key).trim(),
          database_id: env.FIREBASE_DATABASE_ID || DEFAULT_DATABASE_ID,
        };
      }
    } catch {
      return null;
    }
  }

  const clientEmail =
    typeof env?.FIREBASE_CLIENT_EMAIL === 'string' ? env.FIREBASE_CLIENT_EMAIL.trim() : '';
  const privateKey =
    typeof env?.FIREBASE_PRIVATE_KEY === 'string' ? env.FIREBASE_PRIVATE_KEY.trim() : '';

  if (
    clientEmail &&
    privateKey &&
    privateKey !== 'PLACEHOLDER' &&
    privateKey.includes('PRIVATE KEY')
  ) {
    return {
      project_id:
        (typeof env?.FIREBASE_PROJECT_ID === 'string' && env.FIREBASE_PROJECT_ID.trim()) ||
        DEFAULT_PROJECT_ID,
      client_email: clientEmail,
      private_key: privateKey,
      database_id:
        (typeof env?.FIREBASE_DATABASE_ID === 'string' && env.FIREBASE_DATABASE_ID.trim()) ||
        DEFAULT_DATABASE_ID,
    };
  }

  return null;
}

export function hasFirebaseServiceAccount(env: FirebaseTokenEnv): boolean {
  return resolveFirebaseServiceAccount(env) !== null;
}

/**
 * Normalizza un Pi UID in un Firebase UID / documento wallet sicuro (^[a-zA-Z0-9_-]{1,64}$).
 */
export function normalizePiFirebaseUid(rawUid: string): string {
  const cleaned = String(rawUid || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 64);
  return cleaned;
}

async function signJwtRs256(
  payload: Record<string, unknown>,
  privateKeyPem: string
): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncodeText(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await importRs256PrivateKey(privateKeyPem);
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const encodedSig = base64UrlEncodeBytes(new Uint8Array(sigBuf));
  return `${signingInput}.${encodedSig}`;
}

/**
 * Genera un Firebase Auth Custom Token ufficiale firmandolo con la chiave privata Service Account.
 * Il client lo scambia tramite `signInWithCustomToken(auth, customToken)`.
 */
export async function mintFirebaseCustomToken(
  serviceAccount: FirebaseServiceAccount,
  uid: string,
  claims?: Record<string, string | number | boolean>
): Promise<string> {
  const safeUid = normalizePiFirebaseUid(uid);
  if (!safeUid) {
    throw new Error('UID non valido per generazione Firebase Custom Token.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: nowSec,
    exp: nowSec + 3600,
    uid: safeUid,
  };
  if (claims && Object.keys(claims).length > 0) {
    payload.claims = claims;
  }

  return signJwtRs256(payload, serviceAccount.private_key);
}

/**
 * Genera (con caching in memoria fino a scadenza) un OAuth2 Access Token Google
 * per chiamate server-side verso Firestore REST API.
 */
export async function getGoogleDatastoreAccessToken(
  serviceAccount: FirebaseServiceAccount
): Promise<string> {
  const cacheKey = `${serviceAccount.project_id}:${serviceAccount.client_email}`;
  const cached = oauthTokenCache.get(cacheKey);
  if (cached && cached.expiresAtMs > Date.now() + 60_000) {
    return cached.token;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const assertion = await signJwtRs256(
    {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    },
    serviceAccount.private_key
  );

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    redirect: 'error',
  });
  if (!res.ok) {
    throw new Error(`Google OAuth2 token error HTTP ${res.status}`);
  }
  const data: any = await res.json();
  if (!data?.access_token) {
    throw new Error('Google OAuth2 access_token mancante nella risposta');
  }
  const expiresIn = Number(data.expires_in || 3600);
  oauthTokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAtMs: Date.now() + expiresIn * 1000,
  });
  return data.access_token;
}

export function resetFirebaseTokenCacheForTests() {
  oauthTokenCache.clear();
}
