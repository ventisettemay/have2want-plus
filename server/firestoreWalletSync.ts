// Sincronizzazione atomica e sicura del saldo Punti / Wallet su Firestore via Google Service Account REST API
// Usata sia dal server Express (server.ts) che dal Cloudflare Worker (worker.ts)
// Garantisce che nessun client possa falsificare i propri punti e nessuna doppia transazione venga accreditata/addebitata.

const DEFAULT_FIRESTORE_DATABASE_ID = 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa';

export interface WalletSyncEnv {
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_DATABASE_ID?: string;
  FIREBASE_FIRESTORE_DATABASE_ID?: string;
  FIREBASE_WEB_API_KEY?: string;
}

export interface FirestoreServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface WalletSyncInput {
  walletId: string;
  pioneerUsername?: string;
  pointsDelta: number;
  merchantPiDelta?: number;
  actionType: string;
  description: string;
  txId: string;
  piPaymentId?: string;
}

export interface WalletSyncResult {
  synced: boolean;
  deduplicated?: boolean;
  pointsBalance: number;
  totalPointsEarned: number;
  merchantPiBalance: number;
  appliedPointsDelta: number;
  reason?: string;
}

// Tariffe canoniche esclusivamente server-side (mai fidarsi del client pointsDelta positivo)
export const SERVER_EARN_ACTION_RATES: Record<string, number> = {
  WELCOME_BONUS: 120,
  QUICK_SPONSOR_AD: 4,
  BANNER_CLICK: 2,
  COMMUNITY_SHARING: 5,
  REAL_LISTING_BASIC: 60,
  REAL_LISTING_VERIFIED: 120,
  REAL_EXCHANGE_CONCLUDED: 250,
  AD_REWARD_EARN: 4,
};

const POINTS_PER_PI = 1000;
const MIN_WITHDRAWAL_PI = 0.5;

const TOKEN_CACHE: { accessToken: string; expiresAt: number; clientEmail: string } = {
  accessToken: '',
  expiresAt: 0,
  clientEmail: '',
};

function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function pemToPkcs8Bytes(pem: string): Uint8Array {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function parseServiceAccount(env: Record<string, any>): FirestoreServiceAccount | null {
  const rawJson =
    typeof env?.FIREBASE_SERVICE_ACCOUNT_JSON === 'string'
      ? env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()
      : '';
  if (rawJson && rawJson !== 'PLACEHOLDER') {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed?.client_email && parsed?.private_key) {
        return {
          project_id: parsed.project_id || env.FIREBASE_PROJECT_ID || 'gen-lang-client-0597053183',
          client_email: String(parsed.client_email).trim(),
          private_key: String(parsed.private_key).trim(),
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
        'gen-lang-client-0597053183',
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
}

export async function getGoogleAccessToken(sa: FirestoreServiceAccount): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    TOKEN_CACHE.accessToken &&
    TOKEN_CACHE.clientEmail === sa.client_email &&
    TOKEN_CACHE.expiresAt > nowSec + 60
  ) {
    return TOKEN_CACHE.accessToken;
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    })
  );

  const signingInput = `${header}.${claimSet}`;
  const pkcs8Bytes = pemToPkcs8Bytes(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8Bytes.buffer as ArrayBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(sigBuffer))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(jwt)}`,
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => 'unknown');
    throw new Error(`Google OAuth token exchange fallito: ${tokenRes.status} ${errText}`);
  }

  const tokenJson: any = await tokenRes.json();
  TOKEN_CACHE.accessToken = tokenJson.access_token;
  TOKEN_CACHE.clientEmail = sa.client_email;
  TOKEN_CACHE.expiresAt = nowSec + Number(tokenJson.expires_in || 3600);
  return TOKEN_CACHE.accessToken;
}

function getDocBaseUrl(projectId: string, env?: Record<string, any>): string {
  const dbId =
    env?.FIREBASE_FIRESTORE_DATABASE_ID ||
    env?.FIREBASE_DATABASE_ID ||
    DEFAULT_FIRESTORE_DATABASE_ID ||
    '(default)';
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(dbId)}/documents`;
}

function readNumField(fields: any, key: string, fallback = 0): number {
  const f = fields?.[key];
  if (!f) return fallback;
  if (f.integerValue !== undefined) return Number(f.integerValue);
  if (f.doubleValue !== undefined) return Number(f.doubleValue);
  return fallback;
}

function readStrField(fields: any, key: string, fallback = ''): string {
  return fields?.[key]?.stringValue ?? fallback;
}

function readBoolField(fields: any, key: string, fallback = true): boolean {
  return fields?.[key]?.booleanValue !== undefined ? Boolean(fields[key].booleanValue) : fallback;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((v) => toFirestoreValue(v)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values.map(fromFirestoreValue)
      : [];
  }
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

async function resolveAuthoritativePointsDelta(
  input: WalletSyncInput,
  accessToken: string,
  baseUrl: string
): Promise<{ ok: true; pointsDelta: number; merchantPiDelta: number } | { ok: false; reason: string }> {
  const actionType = String(input.actionType || '').trim().toUpperCase();
  const rawPointsDelta = Number(input.pointsDelta || 0);
  const rawMerchantPiDelta = Number(input.merchantPiDelta || 0);

  if (!Number.isFinite(rawPointsDelta) || !Number.isFinite(rawMerchantPiDelta)) {
    return { ok: false, reason: 'Importi numerici non validi.' };
  }

  let authoritativePointsDelta = 0;

  if (actionType in SERVER_EARN_ACTION_RATES) {
    authoritativePointsDelta = SERVER_EARN_ACTION_RATES[actionType];
  } else if (actionType === 'SPEND_LISTING_FEATURE') {
    // Addebito sicuro lato server solo valori consentiti (2 o 4 punti o fino a -50)
    const debit = rawPointsDelta < 0 ? Math.max(-50, Math.round(rawPointsDelta)) : -Math.min(50, Math.max(1, Math.round(rawPointsDelta)));
    authoritativePointsDelta = debit;
  } else if (actionType === 'EARN_COMMUNITY_ENGAGE') {
    // Cap rigoroso server-side per micro-azioni comunitarie non tabellate
    if (rawPointsDelta < 0 || rawPointsDelta > 5) {
      return { ok: false, reason: 'Importo punti per EARN_COMMUNITY_ENGAGE oltre la soglia consentita (max 5 pt).' };
    }
    authoritativePointsDelta = Math.round(rawPointsDelta);
  } else if (actionType === 'MERCHANT_REWARD_DEPOSIT' || actionType === 'MERCHANT_PI_ADJUST') {
    authoritativePointsDelta = 0;
  } else {
    return { ok: false, reason: `Azione reward non riconosciuta o non autorizzata: ${actionType || 'MISSING'}` };
  }

  // Accredito Pi commerciante consentito ONLY se accompagnato da un piPaymentId completato e registrato server-side in pi_idempotency
  // Addebito (< 0) consentito lato server fino al saldo esistente
  let authoritativeMerchantPiDelta = 0;
  if (rawMerchantPiDelta !== 0) {
    if (Math.abs(rawMerchantPiDelta) > 1000) {
      return { ok: false, reason: 'merchantPiDelta fuori dai limiti consentiti.' };
    }
    if (rawMerchantPiDelta < 0) {
      authoritativeMerchantPiDelta = Number(rawMerchantPiDelta.toFixed(4));
    } else {
      const piPaymentId = String(input.piPaymentId || '').trim();
      if (!piPaymentId) {
        return { ok: false, reason: 'Accredito merchantPiDelta rifiutato: manca piPaymentId verificato.' };
      }
      const idempDocId = await sha256Hex(`complete_pay:${piPaymentId}`);
      const checkRes = await fetch(`${baseUrl}/pi_idempotency/${encodeURIComponent(idempDocId)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!checkRes.ok) {
        return { ok: false, reason: 'Pagamento Pi di riferimento non verificato su server (pi_idempotency).' };
      }
      const idempDoc: any = await checkRes.json().catch(() => null);
      const verifiedAmount = Number(idempDoc?.fields?.amount?.doubleValue ?? idempDoc?.fields?.amount?.integerValue ?? 0);
      if (verifiedAmount > 0 && rawMerchantPiDelta > verifiedAmount + 0.0001) {
        return { ok: false, reason: 'merchantPiDelta eccede l’importo del pagamento Pi verificato.' };
      }
      authoritativeMerchantPiDelta = Number(rawMerchantPiDelta.toFixed(4));
    }
  }

  return {
    ok: true,
    pointsDelta: authoritativePointsDelta,
    merchantPiDelta: authoritativeMerchantPiDelta,
  };
}

/**
 * Sincronizza in modo atomico (con optimistic concurrency `currentDocument.updateTime`)
 * il documento `wallets/{walletId}` su Firestore usando solo valori autorevoli lato server.
 */
export async function syncWalletPointsAtomically(
  input: WalletSyncInput,
  env: Record<string, any>
): Promise<WalletSyncResult> {
  const sa = parseServiceAccount(env);
  if (!sa) {
    return {
      synced: false,
      pointsBalance: 0,
      totalPointsEarned: 0,
      merchantPiBalance: 0,
      appliedPointsDelta: 0,
      reason: 'FIREBASE_SERVICE_ACCOUNT_JSON non configurato sul server.',
    };
  }

  const walletId = String(input.walletId || '').replace(/[^a-zA-Z0-9_\\-]/g, '');
  if (!walletId) {
    return {
      synced: false,
      pointsBalance: 0,
      totalPointsEarned: 0,
      merchantPiBalance: 0,
      appliedPointsDelta: 0,
      reason: 'walletId non valido.',
    };
  }

  const accessToken = await getGoogleAccessToken(sa);
  const baseUrl = getDocBaseUrl(sa.project_id, env);

  const authDeltas = await resolveAuthoritativePointsDelta(input, accessToken, baseUrl);
  if (authDeltas.ok === false || 'reason' in authDeltas) {
    const failedReason = (authDeltas as { reason?: string }).reason || 'Azione non autorizzata.';
    return {
      synced: false,
      pointsBalance: 0,
      totalPointsEarned: 0,
      merchantPiBalance: 0,
      appliedPointsDelta: 0,
      reason: failedReason,
    };
  }

  const safeDelta = authDeltas.pointsDelta;
  const safePiDelta = authDeltas.merchantPiDelta;
  const docUrl = `${baseUrl}/wallets/${encodeURIComponent(walletId)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const getRes = await fetch(docUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let exists = false;
    let updateTime: string | undefined;
    let currentPoints = 120;
    let currentEarned = 120;
    let currentMerchantPi = 0;
    let currentUsername = input.pioneerUsername || '@pioniere';
    let currentWalletAddr = '';
    let adStreamEnabled = true;
    let currentHistory: any[] = [];

    if (getRes.ok) {
      const existingDoc: any = await getRes.json();
      exists = true;
      updateTime = existingDoc.updateTime;
      const f = existingDoc.fields || {};
      currentPoints = readNumField(f, 'pointsBalance', 120);
      currentEarned = readNumField(f, 'totalPointsEarned', currentPoints);
      currentMerchantPi = readNumField(f, 'merchantPiBalance', 0);
      currentUsername = readStrField(f, 'pioneerUsername', currentUsername);
      currentWalletAddr = readStrField(f, 'pioneerWalletAddress', '');
      adStreamEnabled = readBoolField(f, 'adStreamEnabled', true);
      const rawHist = fromFirestoreValue(f.history);
      if (Array.isArray(rawHist)) currentHistory = rawHist;

      if (input.txId && currentHistory.some((h) => h && h.id === input.txId)) {
        return {
          synced: true,
          deduplicated: true,
          pointsBalance: currentPoints,
          totalPointsEarned: currentEarned,
          merchantPiBalance: currentMerchantPi,
          appliedPointsDelta: 0,
        };
      }
    } else if (getRes.status !== 404) {
      const errBody = await getRes.text().catch(() => '');
      throw new Error(`Firestore GET wallet fallito (${getRes.status}): ${errBody}`);
    }

    const nextPoints = Math.max(0, currentPoints + safeDelta);
    if (safeDelta < 0 && currentPoints + safeDelta < 0) {
      return {
        synced: false,
        pointsBalance: currentPoints,
        totalPointsEarned: currentEarned,
        merchantPiBalance: currentMerchantPi,
        appliedPointsDelta: 0,
        reason: 'Saldo punti insufficiente su Firestore.',
      };
    }

    const nextEarned = safeDelta > 0 ? currentEarned + safeDelta : currentEarned;
    const nextMerchantPi = Math.max(0, Number((currentMerchantPi + safePiDelta).toFixed(4)));

    const newTx = {
      id: input.txId || `tx_${Date.now()}`,
      type: safeDelta >= 0 ? 'EARN' : 'SPEND',
      actionType: input.actionType || 'REWARD',
      pointsDelta: safeDelta,
      piDelta: safePiDelta,
      description: String(input.description || 'Attività Have2Want').slice(0, 180),
      timestamp: Date.now(),
      serverVerified: true,
    };

    const nextHistory = [newTx, ...currentHistory].slice(0, 50);

    const fieldsPayload: Record<string, any> = {
      walletId: toFirestoreValue(walletId),
      pointsBalance: toFirestoreValue(nextPoints),
      totalPointsEarned: toFirestoreValue(nextEarned),
      merchantPiBalance: toFirestoreValue(nextMerchantPi),
      pioneerUsername: toFirestoreValue(input.pioneerUsername || currentUsername),
      pioneerWalletAddress: toFirestoreValue(currentWalletAddr),
      adStreamEnabled: toFirestoreValue(adStreamEnabled),
      history: toFirestoreValue(nextHistory),
      updatedAt: toFirestoreValue(Date.now()),
    };

    const conditionParam = exists && updateTime
      ? `currentDocument.updateTime=${encodeURIComponent(updateTime)}`
      : `currentDocument.exists=false`;

    const patchRes = await fetch(`${docUrl}?${conditionParam}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: fieldsPayload }),
    });

    if (patchRes.ok) {
      return {
        synced: true,
        pointsBalance: nextPoints,
        totalPointsEarned: nextEarned,
        merchantPiBalance: nextMerchantPi,
        appliedPointsDelta: safeDelta,
      };
    }

    if (patchRes.status === 400 || patchRes.status === 409 || patchRes.status === 412) {
      continue;
    }

    const errText = await patchRes.text().catch(() => '');
    throw new Error(`Firestore PATCH wallet fallito (${patchRes.status}): ${errText}`);
  }

  return {
    synced: false,
    pointsBalance: 0,
    totalPointsEarned: 0,
    merchantPiBalance: 0,
    appliedPointsDelta: 0,
    reason: 'Conflitto di concorrenza su Firestore dopo 3 tentativi.',
  };
}

/**
 * Addebita atomicamente punti su Firestore PRIMA di emettere un prelievo Pi A2U.
 * In caso di errore di rete/API Pi A2U prima della creazione, ripristina via refund.
 */
export async function reserveAndDebitWithdrawalPoints(
  params: {
    walletId: string;
    requestedPi: number;
    targetWalletAddress: string;
    pioneerUsername?: string;
    txId: string;
  },
  env: Record<string, any>
): Promise<{
  ok: boolean;
  reason?: string;
  status?: number;
  pointsDebited?: number;
  pointsBalanceAfter?: number;
}> {
  const sa = parseServiceAccount(env);
  if (!sa) {
    return { ok: false, status: 503, reason: 'Firestore Service Account non configurato per verifica saldo server-side.' };
  }
  const walletId = String(params.walletId || '').replace(/[^a-zA-Z0-9_\\-]/g, '');
  if (!walletId) {
    return { ok: false, status: 400, reason: 'walletId non valido.' };
  }
  const requestedPi = Number(params.requestedPi);
  if (!Number.isFinite(requestedPi) || requestedPi < MIN_WITHDRAWAL_PI) {
    return { ok: false, status: 400, reason: `Soglia minima prelievo: ${MIN_WITHDRAWAL_PI} π.` };
  }

  const requiredPoints = Math.round(requestedPi * POINTS_PER_PI);
  const accessToken = await getGoogleAccessToken(sa);
  const baseUrl = getDocBaseUrl(sa.project_id, env);
  const docUrl = `${baseUrl}/wallets/${encodeURIComponent(walletId)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const getRes = await fetch(docUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (getRes.status === 404) {
      return { ok: false, status: 400, reason: 'Wallet Pioneer inesistente su Firestore.' };
    }
    if (!getRes.ok) {
      const errBody = await getRes.text().catch(() => '');
      return { ok: false, status: 503, reason: `Errore lettura saldo Firestore (${getRes.status}): ${errBody}` };
    }

    const existingDoc: any = await getRes.json();
    const updateTime = existingDoc.updateTime;
    const f = existingDoc.fields || {};
    const currentPoints = readNumField(f, 'pointsBalance', 0);
    const currentEarned = readNumField(f, 'totalPointsEarned', currentPoints);
    const currentMerchantPi = readNumField(f, 'merchantPiBalance', 0);
    const currentUsername = readStrField(f, 'pioneerUsername', params.pioneerUsername || '@pioniere');
    const adStreamEnabled = readBoolField(f, 'adStreamEnabled', true);
    const rawHist = fromFirestoreValue(f.history);
    const currentHistory: any[] = Array.isArray(rawHist) ? rawHist : [];

    if (currentHistory.some((h) => h && h.id === params.txId)) {
      return {
        ok: true,
        pointsDebited: 0,
        pointsBalanceAfter: currentPoints,
      };
    }

    if (currentPoints < requiredPoints) {
      return {
        ok: false,
        status: 400,
        reason: `Saldo insufficiente su server: richiesti ${requiredPoints} pt (${requestedPi} π), disponibili ${currentPoints} pt.`,
      };
    }

    const nextPoints = currentPoints - requiredPoints;
    const newTx = {
      id: params.txId,
      type: 'WITHDRAW_PI',
      actionType: 'WITHDRAW_PI',
      pointsDelta: -requiredPoints,
      piDelta: -requestedPi,
      description: `Prelievo Pi Network verso ${params.targetWalletAddress.slice(0, 12)}...`,
      timestamp: Date.now(),
      serverVerified: true,
    };

    const fieldsPayload: Record<string, any> = {
      walletId: toFirestoreValue(walletId),
      pointsBalance: toFirestoreValue(nextPoints),
      totalPointsEarned: toFirestoreValue(currentEarned),
      merchantPiBalance: toFirestoreValue(currentMerchantPi),
      pioneerUsername: toFirestoreValue(params.pioneerUsername || currentUsername),
      pioneerWalletAddress: toFirestoreValue(params.targetWalletAddress),
      adStreamEnabled: toFirestoreValue(adStreamEnabled),
      history: toFirestoreValue([newTx, ...currentHistory].slice(0, 50)),
      updatedAt: toFirestoreValue(Date.now()),
    };

    const patchRes = await fetch(
      `${docUrl}?currentDocument.updateTime=${encodeURIComponent(updateTime)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: fieldsPayload }),
      }
    );

    if (patchRes.ok) {
      return {
        ok: true,
        pointsDebited: requiredPoints,
        pointsBalanceAfter: nextPoints,
      };
    }
    if (patchRes.status === 400 || patchRes.status === 409 || patchRes.status === 412) {
      continue;
    }
    return { ok: false, status: 503, reason: 'Errore addebito saldo Firestore.' };
  }

  return { ok: false, status: 409, reason: 'Conflitto concorrenza saldo durante prelievo.' };
}

export async function refundWithdrawalPoints(
  params: {
    walletId: string;
    pointsToRefund: number;
    refundTxId: string;
    reason: string;
  },
  env: Record<string, any>
): Promise<boolean> {
  const sa = parseServiceAccount(env);
  if (!sa || params.pointsToRefund <= 0) return false;
  const walletId = String(params.walletId || '').replace(/[^a-zA-Z0-9_\\-]/g, '');
  if (!walletId) return false;

  const accessToken = await getGoogleAccessToken(sa);
  const baseUrl = getDocBaseUrl(sa.project_id, env);
  const docUrl = `${baseUrl}/wallets/${encodeURIComponent(walletId)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const getRes = await fetch(docUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!getRes.ok) return false;
    const existingDoc: any = await getRes.json();
    const updateTime = existingDoc.updateTime;
    const f = existingDoc.fields || {};
    const currentPoints = readNumField(f, 'pointsBalance', 0);
    const currentEarned = readNumField(f, 'totalPointsEarned', currentPoints);
    const currentMerchantPi = readNumField(f, 'merchantPiBalance', 0);
    const currentUsername = readStrField(f, 'pioneerUsername', '@pioniere');
    const currentWalletAddr = readStrField(f, 'pioneerWalletAddress', '');
    const adStreamEnabled = readBoolField(f, 'adStreamEnabled', true);
    const rawHist = fromFirestoreValue(f.history);
    const currentHistory: any[] = Array.isArray(rawHist) ? rawHist : [];

    if (currentHistory.some((h) => h && h.id === params.refundTxId)) return true;

    const nextPoints = currentPoints + Math.round(params.pointsToRefund);
    const refundTx = {
      id: params.refundTxId,
      type: 'WITHDRAW_REFUND',
      actionType: 'WITHDRAW_REFUND',
      pointsDelta: Math.round(params.pointsToRefund),
      description: `Rimborso automatico prelievo fallito: ${params.reason}`.slice(0, 180),
      timestamp: Date.now(),
      serverVerified: true,
    };

    const fieldsPayload: Record<string, any> = {
      walletId: toFirestoreValue(walletId),
      pointsBalance: toFirestoreValue(nextPoints),
      totalPointsEarned: toFirestoreValue(currentEarned),
      merchantPiBalance: toFirestoreValue(currentMerchantPi),
      pioneerUsername: toFirestoreValue(currentUsername),
      pioneerWalletAddress: toFirestoreValue(currentWalletAddr),
      adStreamEnabled: toFirestoreValue(adStreamEnabled),
      history: toFirestoreValue([refundTx, ...currentHistory].slice(0, 50)),
      updatedAt: toFirestoreValue(Date.now()),
    };

    const patchRes = await fetch(
      `${docUrl}?currentDocument.updateTime=${encodeURIComponent(updateTime)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: fieldsPayload }),
      }
    );
    if (patchRes.ok) return true;
    if (patchRes.status !== 400 && patchRes.status !== 409 && patchRes.status !== 412) return false;
  }
  return false;
}

export async function executeServerWalletPointsSync(params: {
  payload: Record<string, any>;
  env: WalletSyncEnv;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const { payload = {}, env = {} } = params;
  const piAccessToken = typeof payload.piAccessToken === 'string' ? payload.piAccessToken.trim() : '';
  const firebaseIdToken = typeof payload.firebaseIdToken === 'string' ? payload.firebaseIdToken.trim() : '';

  if (!piAccessToken && !firebaseIdToken) {
    return {
      status: 401,
      body: {
        success: false,
        synced: false,
        error: 'Token di autenticazione Pi o Firebase obbligatorio per sincronizzare il wallet.',
      },
    };
  }

  let verifiedUid = '';
  let verifiedUsername = typeof payload.pioneerUsername === 'string' ? payload.pioneerUsername : '@pioniere';

  if (piAccessToken) {
    const meRes = await fetch('https://api.minepi.com/v2/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${piAccessToken}` },
      redirect: 'error',
    });
    if (!meRes.ok) {
      return {
        status: 401,
        body: {
          success: false,
          synced: false,
          error: 'Sessione Pi Pioneer non valida o scaduta (/v2/me).',
        },
      };
    }
    const meData: any = await meRes.json().catch(() => ({}));
    if (!meData?.uid) {
      return {
        status: 401,
        body: {
          success: false,
          synced: false,
          error: 'Risposta Pi /v2/me priva di uid valido.',
        },
      };
    }
    verifiedUid = String(meData.uid).trim();
    if (meData.username) verifiedUsername = String(meData.username);
  } else if (firebaseIdToken) {
    const webApiKey = (env.FIREBASE_WEB_API_KEY || '').trim();
    if (!webApiKey) {
      return {
        status: 401,
        body: {
          success: false,
          synced: false,
          error: 'Autenticazione Firebase ID token non verificabile (FIREBASE_WEB_API_KEY assente).',
        },
      };
    }
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(webApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseIdToken }),
        redirect: 'error',
      }
    );
    if (!lookupRes.ok) {
      return {
        status: 401,
        body: {
          success: false,
          synced: false,
          error: 'Firebase ID token non valido o scaduto.',
        },
      };
    }
    const lookupData: any = await lookupRes.json().catch(() => ({}));
    const fbUser = Array.isArray(lookupData?.users) ? lookupData.users[0] : null;
    if (!fbUser?.localId) {
      return {
        status: 401,
        body: {
          success: false,
          synced: false,
          error: 'Utente Firebase non trovato dal token fornito.',
        },
      };
    }
    verifiedUid = String(fbUser.localId).trim();
  }

  const requestedWalletId = String(payload.walletId || verifiedUid).trim();
  const normalizedPiWalletId = verifiedUid.startsWith('pi_') ? verifiedUid : `pi_${verifiedUid}`;
  if (
    requestedWalletId &&
    requestedWalletId !== verifiedUid &&
    requestedWalletId !== normalizedPiWalletId
  ) {
    return {
      status: 403,
      body: {
        success: false,
        synced: false,
        error: 'Accesso negato: tentativo di modifica wallet di un altro utente.',
      },
    };
  }

  const sa = parseServiceAccount(env);
  if (!sa) {
    return {
      status: 503,
      body: {
        success: false,
        synced: false,
        error: 'FIREBASE_SERVICE_ACCOUNT_JSON non configurato sul server.',
      },
    };
  }

  const result = await syncWalletPointsAtomically(
    {
      walletId: requestedWalletId || verifiedUid,
      pioneerUsername: verifiedUsername,
      pointsDelta: Number(payload.pointsDelta ?? 0),
      merchantPiDelta: Number(payload.merchantPiDelta ?? 0),
      actionType: String(payload.actionType || ''),
      description: String(payload.description || 'Sincronizzazione Wallet Have2Want'),
      txId: String(payload.txId || `tx_${Date.now()}`),
      piPaymentId: typeof payload.piPaymentId === 'string' ? payload.piPaymentId : undefined,
    },
    env
  );

  if (!result.synced) {
    return {
      status: 400,
      body: {
        success: false,
        synced: false,
        error: result.reason || 'Sincronizzazione punti rifiutata dal server.',
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      ...result,
    },
  };
}

/**
 * Registra un pagamento Pi Network nella collezione server-only pi_payments.
 * Chiamato da /api/pi/approve e /api/pi/complete dopo operazioni riuscite.
 */
export async function recordPiPayment(
  paymentData: {
    paymentId: string;
    txid?: string;
    amountPi: number;
    status: 'approved' | 'completed' | 'cancelled' | 'failed';
    uid: string;
    walletAddress?: string;
    metadata?: Record<string, any>;
  },
  env: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const sa = parseServiceAccount(env);
  if (!sa) {
    return { success: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON non configurato.' };
  }

  const accessToken = await getGoogleAccessToken(sa);
  const baseUrl = getDocBaseUrl(sa.project_id, env);
  const docUrl = `${baseUrl}/pi_payments/${encodeURIComponent(paymentData.paymentId)}`;

  // Controlla se esiste già (idempotenza)
  const existingRes = await fetch(docUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (existingRes.ok) {
    const existing = await existingRes.json().catch(() => null);
    const existingStatus = existing?.fields?.status?.stringValue;
    // Se già completato, non sovrascrivere
    if (existingStatus === 'completed' && paymentData.status !== 'completed') {
      return { success: true };
    }
    // Se stesso status, ok (idempotente)
    if (existingStatus === paymentData.status) {
      return { success: true };
    }
  }

  const fieldsPayload: Record<string, any> = {
    paymentId: toFirestoreValue(paymentData.paymentId),
    amountPi: toFirestoreValue(paymentData.amountPi),
    status: toFirestoreValue(paymentData.status),
    uid: toFirestoreValue(paymentData.uid),
    createdAt: toFirestoreValue(new Date().toISOString()),
    updatedAt: toFirestoreValue(new Date().toISOString()),
  };

  if (paymentData.txid) {
    fieldsPayload.txid = toFirestoreValue(paymentData.txid);
  }
  if (paymentData.walletAddress) {
    fieldsPayload.walletAddress = toFirestoreValue(paymentData.walletAddress);
  }
  if (paymentData.metadata) {
    fieldsPayload.metadata = toFirestoreValue(paymentData.metadata);
  }

  // Usa PATCH con merge per aggiornamenti parziali, o create se non esiste
  const method = existingRes.ok ? 'PATCH' : 'POST';
  const url = method === 'PATCH' ? docUrl : `${baseUrl}/pi_payments?documentId=${encodeURIComponent(paymentData.paymentId)}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: fieldsPayload }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[PI_PAYMENTS] Errore registrazione ${paymentData.paymentId}:`, errText);
    return { success: false, error: `Firestore error ${res.status}: ${errText}` };
  }

  return { success: true };
}

// Funzioni economiche per Quota X, tariffari, Ecoquota, conversioni USDT

export const ECONOMIC_CONSTANTS = {
  POINTS_PER_PI: 1000,
  PI_PER_USDT: 1.0, // 1 π = 1 USDT (peg teorico, aggiornabile via oracle)
  QUOTA_X_PERCENT: 0.10, // 10% Quota X su transazioni commerciali
  ECOQUOTA_PERCENT: 0.02, // 2% Ecoquota su transazioni
  MERCHANT_FEE_PERCENT: 0.025, // 2.5% fee esercenti
  MIN_WITHDRAWAL_PI: 0.5,
  MAX_WITHDRAWAL_PI: 100,
  WELCOME_BONUS_POINTS: 120,
} as const;

/**
 * Calcola la ripartizione economica di una transazione commerciale.
 * Restituisce gli importi per: Quota X, Ecoquota, Fee Esercente, Netto Merchant.
 */
export function calculateCommercialSplit(amountPi: number): {
  quotaX: number;
  ecoquota: number;
  merchantFee: number;
  netMerchant: number;
  totalFees: number;
} {
  const quotaX = Number((amountPi * ECONOMIC_CONSTANTS.QUOTA_X_PERCENT).toFixed(4));
  const ecoquota = Number((amountPi * ECONOMIC_CONSTANTS.ECOQUOTA_PERCENT).toFixed(4));
  const merchantFee = Number((amountPi * ECONOMIC_CONSTANTS.MERCHANT_FEE_PERCENT).toFixed(4));
  const totalFees = Number((quotaX + ecoquota + merchantFee).toFixed(4));
  const netMerchant = Number((amountPi - totalFees).toFixed(4));

  return { quotaX, ecoquota, merchantFee, netMerchant, totalFees };
}

/**
 * Converte π in USDT (usando peg 1:1 o oracle se disponibile).
 */
export function convertPiToUsdt(amountPi: number): number {
  return Number((amountPi * ECONOMIC_CONSTANTS.PI_PER_USDT).toFixed(4));
}

/**
 * Converte USDT in π.
 */
export function convertUsdtToPi(amountUsdt: number): number {
  return Number((amountUsdt / ECONOMIC_CONSTANTS.PI_PER_USDT).toFixed(4));
}

/**
 * Accredita crediti esercenti (merchantPiBalance) con verifica idempotenza.
 * Usata per pagamenti ricevuti da commercianti.
 */
export async function creditMerchantPi(
  walletId: string,
  amountPi: number,
  piPaymentId: string,
  description: string,
  env: Record<string, any>
): Promise<{ success: boolean; merchantPiBalance?: number; error?: string }> {
  // Verifica che il paymentId sia completato in pi_idempotency
  const sa = parseServiceAccount(env);
  if (!sa) {
    return { success: false, error: 'Service Account non configurato.' };
  }

  const accessToken = await getGoogleAccessToken(sa);
  const baseUrl = getDocBaseUrl(sa.project_id, env);
  const idempDocId = await sha256Hex(`complete_pay:${piPaymentId}`);
  const checkRes = await fetch(`${baseUrl}/pi_idempotency/${encodeURIComponent(idempDocId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!checkRes.ok) {
    return { success: false, error: 'Pagamento Pi non verificato (pi_idempotency).' };
  }

  const idempDoc: any = await checkRes.json().catch(() => null);
  const verifiedAmount = Number(idempDoc?.fields?.amount?.doubleValue ?? idempDoc?.fields?.amount?.integerValue ?? 0);
  if (verifiedAmount <= 0 || amountPi > verifiedAmount + 0.0001) {
    return { success: false, error: 'Importo eccede pagamento verificato.' };
  }

  // Usa syncWalletPointsAtomically con MERCHANT_REWARD_DEPOSIT
  const result = await syncWalletPointsAtomically({
    walletId,
    pioneerUsername: '', // verrà letto da wallet esistente
    pointsDelta: 0,
    merchantPiDelta: amountPi,
    actionType: 'MERCHANT_REWARD_DEPOSIT',
    description,
    txId: `merchant_credit_${piPaymentId}`,
    piPaymentId,
  }, env);

  if (!result.synced) {
    return { success: false, error: result.reason };
  }

  return { success: true, merchantPiBalance: result.merchantPiBalance };
}

/**
 * Addebita crediti esercenti per fee, prelievi, ecc.
 */
export async function debitMerchantPi(
  walletId: string,
  amountPi: number,
  description: string,
  txId: string,
  env: Record<string, any>
): Promise<{ success: boolean; merchantPiBalance?: number; error?: string }> {
  const result = await syncWalletPointsAtomically({
    walletId,
    pioneerUsername: '',
    pointsDelta: 0,
    merchantPiDelta: -amountPi,
    actionType: 'MERCHANT_PI_ADJUST',
    description,
    txId,
  }, env);

  if (!result.synced) {
    return { success: false, error: result.reason };
  }

  return { success: true, merchantPiBalance: result.merchantPiBalance };
}

/**
 * Gestione donazioni / Pasto Sospeso / Pro-Tools.
 * Queste operazioni usano punti comunitari, non Pi.
 */
export async function processCommunityDonation(
  fromWalletId: string,
  toWalletId: string,
  pointsAmount: number,
  type: 'DONATION' | 'SUSPENDED_MEAL' | 'PRO_TOOLS' | 'BADGE',
  description: string,
  env: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (pointsAmount <= 0) return { success: false, error: 'Importo punti non valido.' };

  // Addebita donatore
  const debitResult = await syncWalletPointsAtomically({
    walletId: fromWalletId,
    pioneerUsername: '',
    pointsDelta: -pointsAmount,
    merchantPiDelta: 0,
    actionType: `COMMUNITY_${type}`,
    description: `Donazione ${type}: ${description}`,
    txId: `${type.toLowerCase()}_${Date.now()}_${fromWalletId}`,
  }, env);

  if (!debitResult.synced) {
    return { success: false, error: `Addebito donatore fallito: ${debitResult.reason}` };
  }

  // Accredita beneficiario (se toWalletId diverso)
  if (toWalletId !== fromWalletId) {
    const creditResult = await syncWalletPointsAtomically({
      walletId: toWalletId,
      pioneerUsername: '',
      pointsDelta: pointsAmount,
      merchantPiDelta: 0,
      actionType: `COMMUNITY_${type}_RECEIVED`,
      description: `Ricevuto ${type}: ${description}`,
      txId: `${type.toLowerCase()}_${Date.now()}_${toWalletId}`,
    }, env);

    if (!creditResult.synced) {
      // Rollback donatore se accredito fallisce (in produzione usare transazione)
      await syncWalletPointsAtomically({
        walletId: fromWalletId,
        pioneerUsername: '',
        pointsDelta: pointsAmount,
        merchantPiDelta: 0,
        actionType: 'DONATION_ROLLBACK',
        description: `Rollback donazione fallita: ${description}`,
        txId: `rollback_${Date.now()}_${fromWalletId}`,
      }, env);
      return { success: false, error: `Accredito beneficiario fallito: ${creditResult.reason}` };
    }
  }

  return { success: true };
}

/**
 * Assegnazione distintivi (badge) - solo punti, nessun valore monetario.
 */
export async function awardBadge(
  walletId: string,
  badgeId: string,
  pointsReward: number,
  description: string,
  env: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (pointsReward < 0) return { success: false, error: 'Punti badge non validi.' };

  const result = await syncWalletPointsAtomically({
    walletId,
    pioneerUsername: '',
    pointsDelta: pointsReward,
    merchantPiDelta: 0,
    actionType: 'BADGE_AWARD',
    description: `Badge ${badgeId}: ${description}`,
    txId: `badge_${badgeId}_${Date.now()}_${walletId}`,
  }, env);

  if (!result.synced) {
    return { success: false, error: result.reason };
  }

  return { success: true };
}

