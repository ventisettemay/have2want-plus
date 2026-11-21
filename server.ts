import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  hasFirebaseServiceAccount,
  mintFirebaseCustomToken,
  normalizePiFirebaseUid,
  resolveFirebaseServiceAccount,
  type FirebaseTokenEnv,
} from './server/firebaseAuthToken';
import {
  acquireIdempotencyLock,
  hasIdempotencyLock,
  releaseIdempotencyLock,
  resolveIdempotencyScope,
  type LocalFilePersistenceHooks,
} from './server/idempotencyStore';
import {
  executeServerA2uPayout,
  getA2uSigningReadiness,
  type PiA2uEnv,
} from './server/piA2uService';
import {
  executeServerWalletPointsSync,
  refundWithdrawalPoints,
  reserveAndDebitWithdrawalPoints,
  recordPiPayment,
  type WalletSyncEnv,
} from './server/firestoreWalletSync';
import {
  loadTestnetFlatDb,
  parseMultipartTestnetBody,
  publishTestnetRecord,
  queryTestnetProducts,
  TESTNET_UPLOADS_DIR,
} from './server/testnetFlatDb';

const VALIDATION_KEY =
  '41d098c27068bf811f67caeefe5dc094a6304c413d84b17e9e0c5ae364e3af4ac4086bc073ce287d5bdc3f21cdf45a09ea1f1a842d5a6ccd784777aae7a286b7';
const PI_API_BASE = 'https://api.minepi.com/v2';
const MAX_LOCAL_ENTRIES = 10000;
const LOCAL_IDEMPOTENCY_FILE = path.join(process.cwd(), '.runtime-idempotency.json');

// Rate limiting store (in-memory per server instance)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now - record.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: record.windowStart + RATE_LIMIT_WINDOW_MS };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetAt: record.windowStart + RATE_LIMIT_WINDOW_MS };
}

function createLocalFileHooks(): LocalFilePersistenceHooks {
  const store = new Map<string, string>();
  try {
    if (fs.existsSync(LOCAL_IDEMPOTENCY_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_IDEMPOTENCY_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') store.set(k, v);
        }
      }
    }
  } catch {
    // avvio pulito se file assente/corrotto
  }

  const persist = () => {
    try {
      while (store.size > MAX_LOCAL_ENTRIES) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
        else break;
      }
      const tmp = `${LOCAL_IDEMPOTENCY_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(store.entries())), 'utf-8');
      fs.renameSync(tmp, LOCAL_IDEMPOTENCY_FILE);
    } catch {
      // ignore filesystem errors in read-only runtimes
    }
  };

  return {
    hasKey: (k: string) => store.has(k),
    setKey: (k: string, v: string) => {
      store.set(k, v);
      persist();
    },
    deleteKey: (k: string) => {
      if (store.delete(k)) persist();
    },
  };
}

const localFileHooks = createLocalFileHooks();

function getServerEnv(): FirebaseTokenEnv & PiA2uEnv & WalletSyncEnv {
  return {
    PI_API_KEY: process.env.PI_API_KEY,
    PI_WALLET_SEED: process.env.PI_WALLET_SEED,
    PI_WALLET_PUBLIC_KEY: process.env.PI_WALLET_PUBLIC_KEY,
    VITE_PI_SANDBOX: process.env.VITE_PI_SANDBOX,
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_DATABASE_ID: process.env.FIREBASE_DATABASE_ID,
    FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY,
  };
}

function getConfiguredPiApiKey(): string {
  const key = (process.env.PI_API_KEY || '').trim();
  if (!key || key === 'MY_PI_API_KEY' || key === 'PLACEHOLDER') return '';
  return key;
}

function isValidPiIdentifier(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= 3 && trimmed.length <= 128 && /^[A-Za-z0-9_.:-]+$/.test(trimmed);
}

function isAllowedRainViewerUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    return parsed.hostname === 'tilecache.rainviewer.com' || parsed.hostname === 'api.rainviewer.com';
  } catch {
    return false;
  }
}

function resolvePiCorsOrigin(reqOrigin: string | undefined): string | null {
  const rawList = (process.env.ALLOWED_ORIGINS || '').trim();
  if (!rawList) return '*';
  const allowed = rawList.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0) return '*';
  if (reqOrigin && allowed.includes(reqOrigin)) return reqOrigin;
  return null;
}

function extractBearerToken(req: express.Request): string {
  const auth = req.headers.authorization || '';
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const bodyToken = req.body?.accessToken;
  return typeof bodyToken === 'string' ? bodyToken.trim() : '';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const args = process.argv.slice(2);
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
  const nginxPort = process.env.NGINX_PORT ? parseInt(process.env.NGINX_PORT, 10) : NaN;
  const defaultAppPort = process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : NaN;
  let parsedPort =
    Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort
      ? envPort
      : (Number.isFinite(defaultAppPort) && defaultAppPort > 0 ? defaultAppPort : 3000);
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
      parsedPort = parseInt(args[i + 1], 10);
    }
  }
  const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

  // 1. CORS gestito per rotte pubbliche vs API /api/pi/*, /api/auth/* e /api/wallet/*
  app.use((req, res, next) => {
    const isProtectedEndpoint =
      req.path.startsWith('/api/pi/') ||
      req.path.startsWith('/api/auth/') ||
      req.path.startsWith('/api/wallet/');
    const reqOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

    if (isProtectedEndpoint) {
      const allowedOrigin = resolvePiCorsOrigin(reqOrigin);
      if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        if (allowedOrigin !== '*') res.setHeader('Vary', 'Origin');
      } else if (reqOrigin) {
        return res.status(403).json({ error: 'Origine non autorizzata per API protette' });
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Idempotency-Key, X-Firebase-Token'
    );

    const ua = (req.headers['user-agent'] || '').toLowerCase();
    if (ua.includes('pibrowser') || ua.includes('pinetwork') || req.url === '/' || req.url.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Rate limiting middleware per endpoint Pi sensibili
  app.use('/api/pi/', (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { allowed, remaining, resetAt } = checkRateLimit(ip);
    
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
    
    if (!allowed) {
      console.warn(`[RATE_LIMIT] /api/pi/* blocked for IP ${ip}`);
      return res.status(429).json({
        error: 'Rate limit superato: troppe richieste. Riprovare tra 60 secondi.',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      });
    }
    next();
  });

  // Validazione richieste Pi endpoints
  app.use('/api/pi/', (req, res, next) => {
    // Solo per metodi che modificano stato
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        return res.status(400).json({ error: 'Content-Type application/json obbligatorio' });
      }
    }
    next();
  });

  // 2. Rotta GET esplicita per /validation-key.txt (Massima Priorità Assoluta)
  const sendValidationKey = (_req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Length', '128');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(VALIDATION_KEY);
  };

  app.get('/validation-key.txt', sendValidationKey);
  app.get('/.well-known/validation-key.txt', sendValidationKey);

  app.get(['/privacy', '/privacy.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'privacy.html'));
  });
  app.get(['/terms', '/terms.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'terms.html'));
  });
  app.get(['/specifiche', '/specifiche_tecniche_progetto', '/specifiche_tecniche_progetto.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'specifiche_tecniche_progetto.html'));
  });

  // 3. Cartelle statiche pubbliche esplicite con supporto MIME .txt
  const publicDir = path.join(process.cwd(), 'public');
  const distDir = path.join(process.cwd(), 'dist');

  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.txt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      },
    }));
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    const apiKey = getConfiguredPiApiKey();
    const env = getServerEnv();
    const a2uReadiness = getA2uSigningReadiness(env);
    res.json({
      status: 'ok',
      validationKeyAvailable: true,
      piApiConfigured: Boolean(apiKey),
      piMode: apiKey ? 'live_pi_api' : 'structured_fallback',
      firebaseCustomAuthConfigured: hasFirebaseServiceAccount(env),
      idempotencyScope: resolveIdempotencyScope(env),
      a2uHorizonSigningConfigured: a2uReadiness.ready,
    });
  });

  // Bridge Pi Network -> Firebase Auth Custom Token (/api/auth/firebase-token)
  app.post('/api/auth/firebase-token', async (req, res) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'accessToken Pi Pioneer obbligatorio.',
      });
    }

    const env = getServerEnv();
    const serviceAccount = resolveFirebaseServiceAccount(env);
    if (!serviceAccount) {
      return res.status(503).json({
        success: false,
        configured: false,
        error:
          'FIREBASE_SERVICE_ACCOUNT non configurata sul server: impossibile emettere Firebase Custom Token.',
      });
    }

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: 'error',
      });
      if (!meRes.ok) {
        return res.status(401).json({
          success: false,
          error: 'Token Pi Pioneer non valido o scaduto (/v2/me).',
        });
      }
      const meData: any = await meRes.json().catch(() => ({}));
      if (!meData?.uid) {
        return res.status(401).json({
          success: false,
          error: 'Risposta /v2/me priva di uid valido.',
        });
      }

      const firebaseUid = normalizePiFirebaseUid(meData.uid);
      const customToken = await mintFirebaseCustomToken(serviceAccount, firebaseUid, {
        piUid: String(meData.uid),
        piUsername: String(meData.username || '@pioneer'),
        provider: 'pi_network',
      });

      return res.status(200).json({
        success: true,
        customToken,
        firebaseUid,
        piUid: meData.uid,
        username: meData.username || '@pioneer',
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: err?.message || 'Errore verifica sessione Pi/Firebase',
      });
    }
  });

  // RainViewer CORS Proxy (/api/weather/rainviewer & /api/weather/rainviewer/tile)
  let rainViewerJsonCache: { data: any; timestamp: number } | null = null;
  app.get('/api/weather/rainviewer', async (_req, res) => {
    try {
      const now = Date.now();
      if (rainViewerJsonCache && now - rainViewerJsonCache.timestamp < 2 * 60 * 1000) {
        return res.status(200).json(rainViewerJsonCache.data);
      }
      const upstream = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
        redirect: 'error',
      });
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: `RainViewer HTTP ${upstream.status}` });
      }
      const data = await upstream.json();
      rainViewerJsonCache = { data, timestamp: now };
      res.setHeader('Cache-Control', 'public, max-age=120');
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(502).json({ error: err?.message || 'Errore proxy RainViewer' });
    }
  });

  app.get('/api/weather/rainviewer/tile', async (req, res) => {
    try {
      const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
      const rawPath = typeof req.query.path === 'string' ? req.query.path : '';
      let targetUrl = rawUrl;
      if (!targetUrl && rawPath) {
        const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        targetUrl = `https://tilecache.rainviewer.com${cleanPath}`;
      }

      if (!targetUrl || !isAllowedRainViewerUrl(targetUrl)) {
        return res.status(400).json({ error: 'URL tile RainViewer non valido' });
      }

      const upstream = await fetch(targetUrl, { redirect: 'error' });
      if (!upstream.ok) {
        return res.status(upstream.status).end();
      }

      const contentType = upstream.headers.get('content-type') || 'image/png';
      const arrayBuf = await upstream.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).send(Buffer.from(arrayBuf));
    } catch {
      return res.status(502).end();
    }
  });

  // Pi Network SDK Backend Config
  app.get('/api/pi/config', (_req, res) => {
    const apiKey = getConfiguredPiApiKey();
    const env = getServerEnv();
    const a2uReadiness = getA2uSigningReadiness(env);
    res.json({
      sandbox: process.env.VITE_PI_SANDBOX === 'true',
      serverConfigured: Boolean(apiKey),
      mode: apiKey ? 'live_pi_api' : 'structured_fallback',
      a2uHorizonSigningConfigured: a2uReadiness.ready,
      firebaseCustomAuthConfigured: hasFirebaseServiceAccount(env),
      idempotencyScope: resolveIdempotencyScope(env),
    });
  });

  // Pi Network Payment Server-Side Approval (/api/pi/approve)
  app.post('/api/pi/approve', async (req, res) => {
    const rawPaymentId = req.body?.paymentId;
    if (!isValidPiIdentifier(rawPaymentId)) {
      return res.status(400).json({ approved: false, error: 'paymentId mancante o non valido' });
    }
    const paymentId = rawPaymentId.trim();
    const env = getServerEnv();

    // Audit log: approvazione richiesta
    console.info(`[AUDIT] /api/pi/approve requested`, { paymentId, ip: req.ip, ua: req.get('user-agent') });

    if (await hasIdempotencyLock(`complete_pay:${paymentId}`, env, localFileHooks)) {
      console.warn(`[AUDIT] /api/pi/approve duplicate blocked`, { paymentId });
      return res.status(409).json({
        approved: false,
        duplicate: true,
        paymentId,
        error: 'Pagamento già completato: approvazione duplicata bloccata.',
      });
    }

    const apiKey = getConfiguredPiApiKey();
    if (!apiKey) {
      console.error(`[AUDIT] /api/pi/approve FAIL-CLOSED: PI_API_KEY not configured`);
      return res.status(503).json({
        approved: false,
        paymentId,
        mode: 'unconfigured',
        error: 'PI_API_KEY non configurata: approvazione server-side non disponibile. Configurare PI_API_KEY per operazioni reali.',
      });
    }

    try {
      const upstream = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        redirect: 'error',
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        console.error(`[AUDIT] /api/pi/approve upstream error`, { paymentId, status: upstream.status, data });
        return res.status(upstream.status).json({
          approved: false,
          paymentId,
          mode: 'live_pi_api',
          error: data?.message || `Pi API HTTP ${upstream.status}`,
          details: data,
        });
      }
      if (data?.status?.cancelled || data?.status?.user_cancelled) {
        console.warn(`[AUDIT] /api/pi/approve payment cancelled on Pi`, { paymentId });
        return res.status(409).json({
          approved: false,
          paymentId,
          mode: 'live_pi_api',
          error: 'Pagamento annullato su Pi Network.',
        });
      }
      console.info(`[AUDIT] /api/pi/approve SUCCESS`, { paymentId, data });

      // Registra in pi_payments (server-only)
      const paymentAmount = Number(data?.payment?.amount ?? data?.amount ?? 0);
      const paymentUid = data?.payment?.uid ?? data?.uid ?? '';
      const paymentWalletAddress = data?.payment?.to_address ?? data?.to_address ?? '';
      const paymentMetadata = data?.payment?.metadata ?? data?.metadata ?? {};

      await recordPiPayment({
        paymentId,
        amountPi: paymentAmount,
        status: 'approved',
        uid: paymentUid,
        walletAddress: paymentWalletAddress,
        metadata: paymentMetadata,
      }, env);

      return res.status(200).json({
        approved: true,
        paymentId,
        mode: 'live_pi_api',
        payment: data,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(`[AUDIT] /api/pi/approve exception`, { paymentId, error: err?.message });
      return res.status(502).json({
        approved: false,
        paymentId,
        mode: 'live_pi_api',
        error: err?.message || 'Errore connessione server Pi Network',
      });
    }
  });

  // Pi Network Payment Server-Side Completion (/api/pi/complete)
  app.post('/api/pi/complete', async (req, res) => {
    const rawPaymentId = req.body?.paymentId;
    const rawTxid = req.body?.txid;
    if (!isValidPiIdentifier(rawPaymentId) || !isValidPiIdentifier(rawTxid)) {
      return res.status(400).json({ completed: false, error: 'paymentId e txid obbligatori e validi' });
    }
    const paymentId = rawPaymentId.trim();
    const txid = rawTxid.trim();
    const env = getServerEnv();

    // Audit log: completamento richiesto
    console.info(`[AUDIT] /api/pi/complete requested`, { paymentId, txid, ip: req.ip, ua: req.get('user-agent') });

    const payLockKey = `complete_pay:${paymentId}`;
    const txLockKey = `complete_txid:${txid}`;

    const payClaim = await acquireIdempotencyLock(payLockKey, txid, env, localFileHooks);
    if (!payClaim.acquired) {
      console.warn(`[AUDIT] /api/pi/complete duplicate payment blocked`, { paymentId, txid });
      return res.status(409).json({
        completed: false,
        duplicate: true,
        paymentId,
        txid,
        idempotencyScope: payClaim.scope,
        error: 'Pagamento già completato o in elaborazione: operazione duplicata bloccata.',
      });
    }

    const txClaim = await acquireIdempotencyLock(txLockKey, paymentId, env, localFileHooks);
    if (!txClaim.acquired) {
      await releaseIdempotencyLock(payLockKey, env, localFileHooks);
      console.warn(`[AUDIT] /api/pi/complete duplicate txid blocked`, { paymentId, txid });
      return res.status(409).json({
        completed: false,
        duplicate: true,
        paymentId,
        txid,
        idempotencyScope: txClaim.scope,
        error: 'txid già utilizzato: operazione duplicata bloccata.',
      });
    }

    const apiKey = getConfiguredPiApiKey();
    if (!apiKey) {
      await releaseIdempotencyLock(payLockKey, env, localFileHooks);
      await releaseIdempotencyLock(txLockKey, env, localFileHooks);
      console.error(`[AUDIT] /api/pi/complete FAIL-CLOSED: PI_API_KEY not configured`);
      return res.status(503).json({
        completed: false,
        paymentId,
        txid,
        mode: 'unconfigured',
        error: 'PI_API_KEY non configurata: completamento server-side non disponibile. Configurare PI_API_KEY per operazioni reali.',
      });
    }

    try {
      const upstream = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
        redirect: 'error',
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        await releaseIdempotencyLock(payLockKey, env, localFileHooks);
        await releaseIdempotencyLock(txLockKey, env, localFileHooks);
        console.error(`[AUDIT] /api/pi/complete upstream error`, { paymentId, txid, status: upstream.status, data });
        return res.status(upstream.status).json({
          completed: false,
          paymentId,
          txid,
          mode: 'live_pi_api',
          error: data?.message || `Pi API HTTP ${upstream.status}`,
          details: data,
        });
      }
      if (data?.status?.cancelled || data?.status?.user_cancelled) {
        await releaseIdempotencyLock(payLockKey, env, localFileHooks);
        await releaseIdempotencyLock(txLockKey, env, localFileHooks);
        console.warn(`[AUDIT] /api/pi/complete payment cancelled on Pi`, { paymentId, txid });
        return res.status(409).json({
          completed: false,
          paymentId,
          txid,
          mode: 'live_pi_api',
          error: 'Pagamento annullato su Pi Network.',
        });
      }
      console.info(`[AUDIT] /api/pi/complete SUCCESS`, { paymentId, txid, data });

      // Registra in pi_payments (server-only) - status completed con txid
      await recordPiPayment({
        paymentId,
        txid,
        amountPi: Number(data?.payment?.amount ?? data?.amount ?? 0),
        status: 'completed',
        uid: data?.payment?.uid ?? data?.uid ?? '',
        walletAddress: data?.payment?.to_address ?? data?.to_address ?? '',
        metadata: { ...(data?.payment?.metadata ?? data?.metadata ?? {}), completedAt: new Date().toISOString() },
      }, env);

      return res.status(200).json({
        completed: true,
        paymentId,
        txid,
        mode: 'live_pi_api',
        idempotencyScope: payClaim.scope,
        payment: data,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      await releaseIdempotencyLock(payLockKey, env, localFileHooks);
      await releaseIdempotencyLock(txLockKey, env, localFileHooks);
      console.error(`[AUDIT] /api/pi/complete exception`, { paymentId, txid, error: err?.message });
      return res.status(502).json({
        completed: false,
        paymentId,
        txid,
        mode: 'live_pi_api',
        error: err?.message || 'Errore completamento pagamento Pi Network',
      });
    }
  });

  // Pi Network App-to-User (A2U) Withdrawal Endpoint (/api/pi/withdraw)
  app.post('/api/pi/withdraw', async (req, res) => {
    const { requestedPi, walletAddress, pioneerUsername, uid } = req.body || {};
    const amountNum = Number(requestedPi);
    if (!Number.isFinite(amountNum) || amountNum < 0.5 || amountNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Importo non valido: consentito tra 0.50 π e 100.00 π per operazione.',
      });
    }
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim().length < 6 || walletAddress.trim().length > 128) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo Pi Wallet o Username Pioneer non valido (minimo 6 caratteri).',
      });
    }

    const rawIdempotencyKey =
      (typeof req.headers['idempotency-key'] === 'string' && req.headers['idempotency-key']) ||
      (typeof req.body?.idempotencyKey === 'string' && req.body.idempotencyKey) ||
      '';
    const idempotencyKey = rawIdempotencyKey.trim();
    const env = getServerEnv();
    const feeDeducted = 0.01;
    const netPiSent = Number((amountNum - feeDeducted).toFixed(4));
    const apiKey = getConfiguredPiApiKey();

    if (apiKey) {
      if (!isValidPiIdentifier(uid)) {
        return res.status(401).json({
          success: false,
          mode: 'live_pi_api',
          error: 'uid e accessToken Pi Pioneer obbligatori quando PI_API_KEY è configurata.',
        });
      }
      const accessToken = extractBearerToken(req);
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          mode: 'live_pi_api',
          error: 'accessToken Pi Pioneer obbligatorio per autorizzare prelievi A2U.',
        });
      }

      try {
        const meRes = await fetch(`${PI_API_BASE}/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
          redirect: 'error',
        });
        if (!meRes.ok) {
          return res.status(401).json({
            success: false,
            mode: 'live_pi_api',
            error: 'Sessione Pi Pioneer non valida o scaduta (/v2/me).',
          });
        }
        const meData: any = await meRes.json().catch(() => ({}));
        if (!meData?.uid || meData.uid !== uid) {
          return res.status(403).json({
            success: false,
            mode: 'live_pi_api',
            error: 'Corrispondenza uid Pi Pioneer non valida.',
          });
        }

        if (!idempotencyKey) {
          return res.status(400).json({
            success: false,
            mode: 'live_pi_api',
            error: 'Header Idempotency-Key obbligatorio per autorizzare prelievi A2U.',
          });
        }

        const lockKey = `withdraw:${idempotencyKey}`;
        const claim = await acquireIdempotencyLock(lockKey, walletAddress.trim(), env, localFileHooks);
        const acquiredScope = claim.scope;
        if (!claim.acquired) {
          return res.status(409).json({
            success: false,
            duplicate: true,
            idempotencyScope: claim.scope,
            error: 'Richiesta di prelievo duplicata (Idempotency-Key già processata).',
          });
        }

        const releaseLock = async () => {
          await releaseIdempotencyLock(lockKey, env, localFileHooks);
        };

        let debitedPoints = 0;
        if (hasFirebaseServiceAccount(env)) {
          const reserve = await reserveAndDebitWithdrawalPoints(
            {
              walletId: uid,
              requestedPi: amountNum,
              targetWalletAddress: walletAddress.trim(),
              pioneerUsername,
              txId: `wth_${idempotencyKey}`,
            },
            env
          );
          if (!reserve.ok) {
            await releaseLock();
            return res.status(reserve.status || 400).json({
              success: false,
              mode: 'live_pi_api',
              error: reserve.reason || 'Saldo punti Firestore insufficiente per il prelievo.',
            });
          }
          debitedPoints = reserve.pointsDebited || 0;
        }

        const payoutResult = await executeServerA2uPayout({
          apiKey,
          uid,
          walletAddress: walletAddress.trim(),
          netPiSent,
          requestedPi: amountNum,
          feeDeducted,
          pioneerUsername,
          sandbox: process.env.VITE_PI_SANDBOX === 'true',
          env,
        });

        if (!payoutResult.createdRemotePayment && payoutResult.status >= 400) {
          if (debitedPoints > 0) {
            await refundWithdrawalPoints(
              {
                walletId: uid,
                pointsToRefund: debitedPoints,
                refundTxId: `refund_wth_${idempotencyKey}`,
                reason: String(payoutResult.body?.error || 'Errore prelievo A2U'),
              },
              env
            );
          }
          await releaseLock();
        }

        // Registra prelievo A2U in pi_payments se completato on-chain
        if (payoutResult.body?.completed && typeof payoutResult.body?.txHash === 'string') {
          await recordPiPayment({
            paymentId: `a2u_${idempotencyKey}`,
            txid: payoutResult.body.txHash,
            amountPi: netPiSent,
            status: 'completed',
            uid,
            walletAddress: walletAddress.trim(),
            metadata: {
              type: 'a2u_withdrawal',
              requestedPi: amountNum,
              feeDeducted,
              pioneerUsername,
              idempotencyKey,
            },
          }, env);
        }

        return res.status(payoutResult.status).json({
          ...payoutResult.body,
          idempotencyScope: acquiredScope,
        });
      } catch (err: any) {
        if (idempotencyKey) {
          await releaseIdempotencyLock(`withdraw:${idempotencyKey}`, env, localFileHooks);
        }
        return res.status(502).json({
          success: false,
          mode: 'live_pi_api',
          error: err?.message || 'Errore rete Pi Platform API durante prelievo A2U',
        });
      }
    }

    if (process.env.NODE_ENV === 'production') {
      console.error(`[AUDIT] /api/pi/withdraw FAIL-CLOSED production: PI_API_KEY not configured`);
      return res.status(503).json({
        success: false,
        mode: 'unconfigured',
        error: 'PI_API_KEY non configurata in produzione: prelievi A2U sospesi.',
      });
    }

    // In sviluppo/senza PI_API_KEY: rifiuta esplicitamente invece di simulare successo
    console.warn(`[AUDIT] /api/pi/withdraw REJECTED: PI_API_KEY not configured (dev mode)`);
    return res.status(501).json({
      success: false,
      mode: 'unconfigured',
      error: 'PI_API_KEY non configurata: prelievi A2U reali non disponibili. Configurare PI_API_KEY, PI_WALLET_SEED e PI_WALLET_PUBLIC_KEY per operazioni reali.',
    });
  });

  // Sincronizzazione server-side autenticata punti wallet su Cloud Firestore (/api/wallet/points)
  app.post('/api/wallet/points', async (req, res) => {
    try {
      const body = req.body || {};
      const firebaseIdToken =
        (typeof req.headers['x-firebase-token'] === 'string' && req.headers['x-firebase-token']) ||
        (typeof body.firebaseIdToken === 'string' ? body.firebaseIdToken : '');
      const piAccessToken = extractBearerToken(req) || (typeof body.piAccessToken === 'string' ? body.piAccessToken : '');

      const result = await executeServerWalletPointsSync({
        payload: {
          ...body,
          firebaseIdToken,
          piAccessToken,
        },
        env: getServerEnv(),
      });
      return res.status(result.status).json(result.body);
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        synced: false,
        error: err?.message || 'Errore sincronizzazione punti wallet Firestore',
      });
    }
  });

  // 3b. Endpoint Testnet Flat DB & Upload anche in produzione (/api/testnet/query, /api/testnet/publish, /uploads)
  if (!fs.existsSync(TESTNET_UPLOADS_DIR)) {
    fs.mkdirSync(TESTNET_UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(TESTNET_UPLOADS_DIR));

  app.get('/api/testnet/query', (req, res) => {
    try {
      const hasFilters = req.query?.lat || req.query?.lng || req.query?.q || req.query?.category;
      if (hasFilters) {
        const data = queryTestnetProducts({
          user_lat: req.query.lat,
          user_lng: req.query.lng,
          q: req.query.q,
          category: req.query.category,
        });
        return res.status(200).json({ success: true, data });
      }
      const data = loadTestnetFlatDb();
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Errore lettura flat_database.json' });
    }
  });

  app.post('/api/testnet/query', (req, res) => {
    try {
      const payload = queryTestnetProducts({
        user_lat: req.body?.user_lat,
        user_lng: req.body?.user_lng,
        q: req.body?.q,
        category: req.body?.category,
      });
      return res.status(200).json(payload);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Errore query testnet' });
    }
  });

  app.post(
    '/api/testnet/publish',
    express.raw({ type: 'multipart/form-data', limit: '6mb' }),
    (req, res) => {
      try {
        const contentType = String(req.headers['content-type'] || '');
        const input =
          contentType.includes('multipart/form-data') && Buffer.isBuffer(req.body)
            ? parseMultipartTestnetBody(req.body, contentType)
            : req.body || {};
        const result = publishTestnetRecord(input);
        return res.status(200).json(result);
      } catch (err: any) {
        const msg = err?.message || 'Errore publish testnet';
        const statusCode = /estensione|mime|dimensione|payload/i.test(msg) ? 400 : 500;
        return res.status(statusCode).json({ success: false, error: msg });
      }
    }
  );

  // 4. Integrazione Vite (dev) o Dist (produzione)
  const isRunningCompiledServer = Boolean(process.argv[1] && process.argv[1].endsWith('server.cjs'));
  const hasBuiltDist = fs.existsSync(path.join(distDir, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || (isRunningCompiledServer && hasBuiltDist);

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.txt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      },
    }));

    app.get('*', (req, res) => {
      const cleanPath = req.path.replace(/\/$/, '');
      if (cleanPath === '/validation-key.txt' || req.url.includes('validation-key.txt')) {
        return sendValidationKey(req, res);
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} already in use, exiting for supervisor restart...`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
