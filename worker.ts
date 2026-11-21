// Cloudflare Worker autonomo per Urbano3D / HAVE2WANT PLUS
// Gestisce le API /api/* senza esporre secret al frontend e mantenendo i contratti identici a server.ts

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
  resetMemoryIdempotencyForTests,
  resolveIdempotencyScope,
  type D1DatabaseLike,
  type IdempotencyEnv,
} from './server/idempotencyStore';
import {
  executeServerA2uPayout,
  getA2uSigningReadiness,
  type HorizonSignerFn,
  type PiA2uEnv,
} from './server/piA2uService';
import {
  executeServerWalletPointsSync,
  refundWithdrawalPoints,
  reserveAndDebitWithdrawalPoints,
  recordPiPayment,
  type WalletSyncEnv,
} from './server/firestoreWalletSync';
import { getGoogleDatastoreAccessToken } from './server/firebaseAuthToken';

export interface WorkerEnv extends FirebaseTokenEnv, IdempotencyEnv, PiA2uEnv, WalletSyncEnv {
  PI_API_KEY?: string;
  VITE_PI_SANDBOX?: string;
  ALLOWED_ORIGINS?: string;
  DB?: D1DatabaseLike;
}

// Rate limiting per Cloudflare Worker (usando Durable Objects o cache edge)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

async function checkWorkerRateLimit(request: Request, env: WorkerEnv): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const cache = getDefaultCache();
  const cacheKey = `ratelimit:${ip}`;
  
  if (cache) {
    try {
      const cached = await cache.match(new Request(`https://ratelimit.internal/${cacheKey}`));
      if (cached) {
        const data = await cached.json();
        const now = Date.now();
        if (now - data.windowStart < RATE_LIMIT_WINDOW_MS) {
          if (data.count >= RATE_LIMIT_MAX_REQUESTS) {
            return { allowed: false, remaining: 0, resetAt: data.windowStart + RATE_LIMIT_WINDOW_MS };
          }
          data.count++;
          const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
          });
          await cache.put(new Request(`https://ratelimit.internal/${cacheKey}`), response);
          return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - data.count, resetAt: data.windowStart + RATE_LIMIT_WINDOW_MS };
        }
      }
    } catch {
      // Ignora errori cache
    }
  }
  
  // Fallback in-memory (per isolate corrente)
  const now = Date.now();
  const data = { count: 1, windowStart: now };
  if (cache) {
    try {
      await cache.put(
        new Request(`https://ratelimit.internal/${cacheKey}`),
        new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } })
      );
    } catch {}
  }
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
}

export interface WorkerExecutionContext {
  waitUntil?: (promise: Promise<unknown>) => void;
}

export interface WorkerRequestHooks {
  horizonSigner?: HorizonSignerFn;
}

const VALIDATION_KEY =
  '41d098c27068bf811f67caeefe5dc094a6304c413d84b17e9e0c5ae364e3af4ac4086bc073ce287d5bdc3f21cdf45a09ea1f1a842d5a6ccd784777aae7a286b7';
const PI_API_BASE = 'https://api.minepi.com/v2';
const RAINVIEWER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json';

export function resetWorkerDeduplicationStateForTests() {
  resetMemoryIdempotencyForTests();
}

const PUBLIC_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-Firebase-Token',
};

const NO_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

function getConfiguredPiApiKey(env: WorkerEnv): string {
  const key = typeof env?.PI_API_KEY === 'string' ? env.PI_API_KEY.trim() : '';
  if (!key || key === 'MY_PI_API_KEY' || key === 'PLACEHOLDER') return '';
  return key;
}

function isSandboxMode(env: WorkerEnv): boolean {
  return String(env?.VITE_PI_SANDBOX || '').toLowerCase() === 'true';
}

function resolvePiCorsHeaders(
  request: Request,
  env: WorkerEnv
): { headers: Record<string, string>; blocked: boolean } {
  const rawList = typeof env?.ALLOWED_ORIGINS === 'string' ? env.ALLOWED_ORIGINS.trim() : '';
  if (!rawList) {
    return { headers: PUBLIC_CORS_HEADERS, blocked: false };
  }
  const allowed = rawList.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0) {
    return { headers: PUBLIC_CORS_HEADERS, blocked: false };
  }
  const reqOrigin = request.headers.get('Origin');
  if (reqOrigin && allowed.includes(reqOrigin)) {
    return {
      headers: {
        'Access-Control-Allow-Origin': reqOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, Idempotency-Key, X-Firebase-Token',
        Vary: 'Origin',
      },
      blocked: false,
    };
  }
  return {
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Idempotency-Key, X-Firebase-Token',
    },
    blocked: Boolean(reqOrigin),
  };
}

function jsonResponse(
  payload: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  corsHeaders: Record<string, string> = PUBLIC_CORS_HEADERS
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
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
    return (
      parsed.hostname === 'tilecache.rainviewer.com' ||
      parsed.hostname === 'api.rainviewer.com'
    );
  } catch {
    return false;
  }
}

async function parseJsonBody(request: Request): Promise<Record<string, any> | null> {
  try {
    const text = await request.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return null;
  }
}

function getDefaultCache(): Cache | null {
  try {
    if (typeof caches !== 'undefined' && (caches as any)?.default) {
      return (caches as any).default as Cache;
    }
  } catch {
    // non disponibile fuori dal runtime Cloudflare Worker
  }
  return null;
}

function extractBearerToken(request: Request, body: Record<string, any>): string {
  const auth = request.headers.get('Authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return typeof body?.accessToken === 'string' ? body.accessToken.trim() : '';
}

export async function handleWorkerRequest(
  request: Request,
  env: WorkerEnv = {},
  ctx?: WorkerExecutionContext,
  hooks?: WorkerRequestHooks
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();
  const isProtectedRoute =
    pathname.startsWith('/api/pi/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/wallet/');
  const piCors = isProtectedRoute
    ? resolvePiCorsHeaders(request, env)
    : { headers: PUBLIC_CORS_HEADERS, blocked: false };

  // CORS Preflight
  if (method === 'OPTIONS') {
    if (isProtectedRoute && piCors.blocked) {
      return jsonResponse({ error: 'Origine non autorizzata' }, 403, {}, piCors.headers);
    }
    return new Response(null, {
      status: 204,
      headers: piCors.headers,
    });
  }

  if (isProtectedRoute && piCors.blocked) {
    return jsonResponse(
      { error: 'Origine non autorizzata per API protette' },
      403,
      {},
      piCors.headers
    );
  }

  // Rate limiting per endpoint /api/pi/*
  if (pathname.startsWith('/api/pi/')) {
    const { allowed, remaining, resetAt } = await checkWorkerRateLimit(request, env);
    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
    };
    
    if (!allowed) {
      console.warn(`[RATE_LIMIT] Worker /api/pi/* blocked for IP ${request.headers.get('CF-Connecting-IP') || 'unknown'}`);
      return jsonResponse(
        { error: 'Rate limit superato: troppe richieste. Riprovare tra 60 secondi.', retryAfter: Math.ceil((resetAt - Date.now()) / 1000) },
        429,
        rateLimitHeaders,
        piCors.headers
      );
    }
    // Aggiungi header rate limit a tutte le risposte
    Object.entries(rateLimitHeaders).forEach(([k, v]) => {
      piCors.headers[k] = v;
    });
  }

  // Validazione richieste Pi endpoints (solo mutanti)
  if (pathname.startsWith('/api/pi/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return jsonResponse({ error: 'Content-Type application/json obbligatorio' }, 400, {}, piCors.headers);
    }
  }

  // Verifica dominio Pi Network (/.well-known/validation-key.txt & /validation-key.txt)
  if (
    method === 'GET' &&
    (pathname === '/validation-key.txt' || pathname === '/.well-known/validation-key.txt')
  ) {
    return new Response(VALIDATION_KEY, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...PUBLIC_CORS_HEADERS,
        ...NO_CACHE_HEADERS,
      },
    });
  }

  // 1. GET /api/health
  if (method === 'GET' && pathname === '/api/health') {
    const apiKey = getConfiguredPiApiKey(env);
    const a2uReadiness = getA2uSigningReadiness(env);
    return jsonResponse(
      {
        status: 'ok',
        runtime: 'cloudflare-worker',
        validationKeyAvailable: true,
        piApiConfigured: Boolean(apiKey),
        piMode: apiKey ? 'live_pi_api' : 'structured_fallback',
        sandbox: isSandboxMode(env),
        firebaseCustomAuthConfigured: hasFirebaseServiceAccount(env),
        idempotencyScope: resolveIdempotencyScope(env),
        a2uHorizonSigningConfigured: a2uReadiness.ready,
      },
      200,
      NO_CACHE_HEADERS
    );
  }

  // Bridge Pi Network -> Firebase Auth Custom Token (POST /api/auth/firebase-token)
  if (method === 'POST' && pathname === '/api/auth/firebase-token') {
    const body = await parseJsonBody(request);
    if (!body) {
      return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    }
    const accessToken = extractBearerToken(request, body);
    if (!accessToken) {
      return jsonResponse(
        { success: false, error: 'accessToken Pi Pioneer obbligatorio.' },
        401,
        {},
        piCors.headers
      );
    }

    const serviceAccount = resolveFirebaseServiceAccount(env);
    if (!serviceAccount) {
      return jsonResponse(
        {
          success: false,
          configured: false,
          error:
            'FIREBASE_SERVICE_ACCOUNT non configurata sul server: impossibile emettere Firebase Custom Token.',
        },
        503,
        {},
        piCors.headers
      );
    }

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: 'error',
      });
      if (!meRes.ok) {
        return jsonResponse(
          { success: false, error: 'Token Pi Pioneer non valido o scaduto (/v2/me).' },
          401,
          {},
          piCors.headers
        );
      }
      const meData: any = await meRes.json().catch(() => ({}));
      if (!meData?.uid) {
        return jsonResponse(
          { success: false, error: 'Risposta /v2/me priva di uid valido.' },
          401,
          {},
          piCors.headers
        );
      }

      const firebaseUid = normalizePiFirebaseUid(meData.uid);
      const customToken = await mintFirebaseCustomToken(serviceAccount, firebaseUid, {
        piUid: String(meData.uid),
        piUsername: String(meData.username || '@pioneer'),
        provider: 'pi_network',
      });

      return jsonResponse(
        {
          success: true,
          customToken,
          firebaseUid,
          piUid: meData.uid,
          username: meData.username || '@pioneer',
        },
        200,
        NO_CACHE_HEADERS,
        piCors.headers
      );
    } catch (err: any) {
      return jsonResponse(
        { success: false, error: err?.message || 'Errore verifica sessione Pi/Firebase' },
        502,
        {},
        piCors.headers
      );
    }
  }

  // 2. GET /api/weather/rainviewer
  if (method === 'GET' && pathname === '/api/weather/rainviewer') {
    const cache = getDefaultCache();
    const cacheKey = new Request(RAINVIEWER_MAPS_URL, { method: 'GET' });

    if (cache) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const clonedHeaders = new Headers(cached.headers);
        Object.entries(PUBLIC_CORS_HEADERS).forEach(([k, v]) => clonedHeaders.set(k, v));
        return new Response(cached.body, {
          status: cached.status,
          headers: clonedHeaders,
        });
      }
    }

    try {
      const upstream = await fetch(RAINVIEWER_MAPS_URL, { redirect: 'error' });
      if (!upstream.ok) {
        return jsonResponse({ error: `RainViewer HTTP ${upstream.status}` }, upstream.status);
      }
      const data = await upstream.json();
      const response = jsonResponse(data, 200, {
        'Cache-Control': 'public, max-age=120',
      });
      if (cache) {
        const putPromise = cache.put(cacheKey, response.clone());
        if (ctx?.waitUntil) {
          ctx.waitUntil(putPromise);
        } else {
          await putPromise;
        }
      }
      return response;
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Errore proxy RainViewer' }, 502);
    }
  }

  // 3. GET /api/weather/rainviewer/tile
  if (method === 'GET' && pathname === '/api/weather/rainviewer/tile') {
    const rawUrl = url.searchParams.get('url') || '';
    const rawPath = url.searchParams.get('path') || '';
    let targetUrl = rawUrl;
    if (!targetUrl && rawPath) {
      const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      targetUrl = `https://tilecache.rainviewer.com${cleanPath}`;
    }

    if (!targetUrl || !isAllowedRainViewerUrl(targetUrl)) {
      return jsonResponse({ error: 'URL tile RainViewer non valido' }, 400);
    }

    try {
      const upstream = await fetch(targetUrl, { redirect: 'error' });
      if (!upstream.ok) {
        return new Response(null, { status: upstream.status, headers: PUBLIC_CORS_HEADERS });
      }
      const contentType = upstream.headers.get('content-type') || 'image/png';
      const buffer = await upstream.arrayBuffer();
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=300',
          ...PUBLIC_CORS_HEADERS,
        },
      });
    } catch {
      return new Response(null, { status: 502, headers: PUBLIC_CORS_HEADERS });
    }
  }

  // 4. GET /api/pi/config
  if (method === 'GET' && pathname === '/api/pi/config') {
    const apiKey = getConfiguredPiApiKey(env);
    const a2uReadiness = getA2uSigningReadiness(env);
    return jsonResponse(
      {
        sandbox: isSandboxMode(env),
        serverConfigured: Boolean(apiKey),
        mode: apiKey ? 'live_pi_api' : 'structured_fallback',
        firebaseCustomAuthConfigured: hasFirebaseServiceAccount(env),
        idempotencyScope: resolveIdempotencyScope(env),
        a2uHorizonSigningConfigured: a2uReadiness.ready && Boolean(hooks?.horizonSigner),
      },
      200,
      NO_CACHE_HEADERS,
      piCors.headers
    );
  }

  // 5. POST /api/pi/approve
  if (method === 'POST' && pathname === '/api/pi/approve') {
    const body = await parseJsonBody(request);
    if (!body) {
      return jsonResponse({ approved: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    }
    const rawPaymentId = body.paymentId;
    if (!isValidPiIdentifier(rawPaymentId)) {
      return jsonResponse(
        { approved: false, error: 'paymentId mancante o non valido' },
        400,
        {},
        piCors.headers
      );
    }
    const paymentId = rawPaymentId.trim();

    // Audit log
    console.info(`[AUDIT] Worker /api/pi/approve requested`, { paymentId, ip: request.headers.get('CF-Connecting-IP') });

    if (await hasIdempotencyLock(`complete_pay:${paymentId}`, env)) {
      console.warn(`[AUDIT] Worker /api/pi/approve duplicate blocked`, { paymentId });
      return jsonResponse(
        {
          approved: false,
          duplicate: true,
          paymentId,
          error: 'Pagamento già completato: approvazione duplicata bloccata.',
        },
        409,
        {},
        piCors.headers
      );
    }

    const apiKey = getConfiguredPiApiKey(env);
    if (!apiKey) {
      console.error(`[AUDIT] Worker /api/pi/approve FAIL-CLOSED: PI_API_KEY not configured`);
      return jsonResponse(
        {
          approved: false,
          paymentId,
          mode: 'unconfigured',
          error: 'PI_API_KEY non configurata: approvazione server-side non disponibile. Configurare PI_API_KEY per operazioni reali.',
        },
        503,
        {},
        piCors.headers
      );
    }

    try {
      const upstream = await fetch(
        `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          redirect: 'error',
        }
      );
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        console.error(`[AUDIT] Worker /api/pi/approve upstream error`, { paymentId, status: upstream.status, data });
        return jsonResponse(
          {
            approved: false,
            paymentId,
            mode: 'live_pi_api',
            error: (data as any)?.message || `Pi API HTTP ${upstream.status}`,
            details: data,
          },
          upstream.status,
          {},
          piCors.headers
        );
      }
      if ((data as any)?.status?.cancelled || (data as any)?.status?.user_cancelled) {
        console.warn(`[AUDIT] Worker /api/pi/approve payment cancelled on Pi`, { paymentId });
        return jsonResponse(
          {
            approved: false,
            paymentId,
            mode: 'live_pi_api',
            error: 'Pagamento annullato su Pi Network.',
          },
          409,
          {},
          piCors.headers
        );
      }
      console.info(`[AUDIT] Worker /api/pi/approve SUCCESS`, { paymentId, data });

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

      return jsonResponse(
        {
          approved: true,
          paymentId,
          mode: 'live_pi_api',
          payment: data,
          timestamp: new Date().toISOString(),
        },
        200,
        {},
        piCors.headers
      );
    } catch (err: any) {
      console.error(`[AUDIT] Worker /api/pi/approve exception`, { paymentId, error: err?.message });
      return jsonResponse(
        {
          approved: false,
          paymentId,
          mode: 'live_pi_api',
          error: err?.message || 'Errore connessione server Pi Network',
        },
        502,
        {},
        piCors.headers
      );
    }
  }

  // 6. POST /api/pi/complete
  if (method === 'POST' && pathname === '/api/pi/complete') {
    const body = await parseJsonBody(request);
    if (!body) {
      return jsonResponse({ completed: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    }
    const rawPaymentId = body.paymentId;
    const rawTxid = body.txid;
    if (!isValidPiIdentifier(rawPaymentId) || !isValidPiIdentifier(rawTxid)) {
      return jsonResponse(
        { completed: false, error: 'paymentId e txid obbligatori e validi' },
        400,
        {},
        piCors.headers
      );
    }
    const paymentId = rawPaymentId.trim();
    const txid = rawTxid.trim();

    // Audit log
    console.info(`[AUDIT] Worker /api/pi/complete requested`, { paymentId, txid, ip: request.headers.get('CF-Connecting-IP') });

    const payLockKey = `complete_pay:${paymentId}`;
    const txLockKey = `complete_txid:${txid}`;

    const payClaim = await acquireIdempotencyLock(payLockKey, txid, env);
    if (!payClaim.acquired) {
      console.warn(`[AUDIT] Worker /api/pi/complete duplicate payment blocked`, { paymentId, txid });
      return jsonResponse(
        {
          completed: false,
          duplicate: true,
          paymentId,
          txid,
          idempotencyScope: payClaim.scope,
          error: 'Pagamento già completato o in elaborazione: operazione duplicata bloccata.',
        },
        409,
        {},
        piCors.headers
      );
    }

    const txClaim = await acquireIdempotencyLock(txLockKey, paymentId, env);
    if (!txClaim.acquired) {
      await releaseIdempotencyLock(payLockKey, env);
      console.warn(`[AUDIT] Worker /api/pi/complete duplicate txid blocked`, { paymentId, txid });
      return jsonResponse(
        {
          completed: false,
          duplicate: true,
          paymentId,
          txid,
          idempotencyScope: txClaim.scope,
          error: 'txid già utilizzato: operazione duplicata bloccata.',
        },
        409,
        {},
        piCors.headers
      );
    }

    const apiKey = getConfiguredPiApiKey(env);
    if (!apiKey) {
      await releaseIdempotencyLock(payLockKey, env);
      await releaseIdempotencyLock(txLockKey, env);
      console.error(`[AUDIT] Worker /api/pi/complete FAIL-CLOSED: PI_API_KEY not configured`);
      return jsonResponse(
        {
          completed: false,
          paymentId,
          txid,
          mode: 'unconfigured',
          error: 'PI_API_KEY non configurata: completamento server-side non disponibile. Configurare PI_API_KEY per operazioni reali.',
        },
        503,
        {},
        piCors.headers
      );
    }

    try {
      const upstream = await fetch(
        `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txid }),
          redirect: 'error',
        }
      );
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        await releaseIdempotencyLock(payLockKey, env);
        await releaseIdempotencyLock(txLockKey, env);
        console.error(`[AUDIT] Worker /api/pi/complete upstream error`, { paymentId, txid, status: upstream.status, data });
        return jsonResponse(
          {
            completed: false,
            paymentId,
            txid,
            mode: 'live_pi_api',
            error: (data as any)?.message || `Pi API HTTP ${upstream.status}`,
            details: data,
          },
          upstream.status,
          {},
          piCors.headers
        );
      }
      if ((data as any)?.status?.cancelled || (data as any)?.status?.user_cancelled) {
        await releaseIdempotencyLock(payLockKey, env);
        await releaseIdempotencyLock(txLockKey, env);
        console.warn(`[AUDIT] Worker /api/pi/complete payment cancelled on Pi`, { paymentId, txid });
        return jsonResponse(
          {
            completed: false,
            paymentId,
            txid,
            mode: 'live_pi_api',
            error: 'Pagamento annullato su Pi Network.',
          },
          409,
          {},
          piCors.headers
        );
      }
      console.info(`[AUDIT] Worker /api/pi/complete SUCCESS`, { paymentId, txid, data });

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

      return jsonResponse(
        {
          completed: true,
          paymentId,
          txid,
          mode: 'live_pi_api',
          idempotencyScope: payClaim.scope,
          payment: data,
          timestamp: new Date().toISOString(),
        },
        200,
        {},
        piCors.headers
      );
    } catch (err: any) {
      await releaseIdempotencyLock(payLockKey, env);
      await releaseIdempotencyLock(txLockKey, env);
      console.error(`[AUDIT] Worker /api/pi/complete exception`, { paymentId, txid, error: err?.message });
      return jsonResponse(
        {
          completed: false,
          paymentId,
          txid,
          mode: 'live_pi_api',
          error: err?.message || 'Errore completamento pagamento Pi Network',
        },
        502,
        {},
        piCors.headers
      );
    }
  }

  // 7. POST /api/pi/withdraw
  if (method === 'POST' && pathname === '/api/pi/withdraw') {
    const body = await parseJsonBody(request);
    if (!body) {
      return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    }
    const { requestedPi, walletAddress, pioneerUsername, uid } = body;
    const amountNum = Number(requestedPi);
    if (!Number.isFinite(amountNum) || amountNum < 0.5 || amountNum > 100) {
      return jsonResponse(
        {
          success: false,
          error: 'Importo non valido: consentito tra 0.50 π e 100.00 π per operazione.',
        },
        400,
        {},
        piCors.headers
      );
    }
    if (
      !walletAddress ||
      typeof walletAddress !== 'string' ||
      walletAddress.trim().length < 6 ||
      walletAddress.trim().length > 128
    ) {
      return jsonResponse(
        {
          success: false,
          error: 'Indirizzo Pi Wallet o Username Pioneer non valido (minimo 6 caratteri).',
        },
        400,
        {},
        piCors.headers
      );
    }

    const rawIdempotencyKey =
      request.headers.get('Idempotency-Key') ||
      (typeof body.idempotencyKey === 'string' ? body.idempotencyKey : '');
    const idempotencyKey = rawIdempotencyKey.trim();

    const feeDeducted = 0.01;
    const netPiSent = Number((amountNum - feeDeducted).toFixed(4));
    const apiKey = getConfiguredPiApiKey(env);

    if (apiKey) {
      if (!isValidPiIdentifier(uid)) {
        return jsonResponse(
          {
            success: false,
            mode: 'live_pi_api',
            error: 'uid e accessToken Pi Pioneer obbligatori quando PI_API_KEY è configurata.',
          },
          401,
          {},
          piCors.headers
        );
      }
      const accessToken = extractBearerToken(request, body);
      if (!accessToken) {
        return jsonResponse(
          {
            success: false,
            mode: 'live_pi_api',
            error: 'accessToken Pi Pioneer obbligatorio per autorizzare prelievi A2U.',
          },
          401,
          {},
          piCors.headers
        );
      }

      try {
        const meRes = await fetch(`${PI_API_BASE}/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
          redirect: 'error',
        });
        if (!meRes.ok) {
          return jsonResponse(
            {
              success: false,
              mode: 'live_pi_api',
              error: 'Sessione Pi Pioneer non valida o scaduta (/v2/me).',
            },
            401,
            {},
            piCors.headers
          );
        }
        const meData: any = await meRes.json().catch(() => ({}));
        if (!meData?.uid || meData.uid !== uid) {
          return jsonResponse(
            {
              success: false,
              mode: 'live_pi_api',
              error: 'Corrispondenza uid Pi Pioneer non valida.',
            },
            403,
            {},
            piCors.headers
          );
        }

        if (!idempotencyKey) {
          return jsonResponse(
            {
              success: false,
              mode: 'live_pi_api',
              error: 'Header Idempotency-Key obbligatorio per autorizzare prelievi A2U.',
            },
            400,
            {},
            piCors.headers
          );
        }

        const lockKey = `withdraw:${idempotencyKey}`;
        const claim = await acquireIdempotencyLock(lockKey, walletAddress.trim(), env);
        const acquiredScope = claim.scope;
        if (!claim.acquired) {
          return jsonResponse(
            {
              success: false,
              duplicate: true,
              idempotencyScope: claim.scope,
              error: 'Richiesta di prelievo duplicata (Idempotency-Key già processata).',
            },
            409,
            {},
            piCors.headers
          );
        }

        const releaseLock = async () => {
          await releaseIdempotencyLock(lockKey, env);
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
            return jsonResponse(
              {
                success: false,
                mode: 'live_pi_api',
                error: reserve.reason || 'Saldo punti Firestore insufficiente per il prelievo.',
              },
              reserve.status || 400,
              {},
              piCors.headers
            );
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
          sandbox: isSandboxMode(env),
          env,
          horizonSigner: hooks?.horizonSigner,
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

        return jsonResponse(
          {
            ...payoutResult.body,
            idempotencyScope: acquiredScope,
          },
          payoutResult.status,
          {},
          piCors.headers
        );
      } catch (err: any) {
        if (idempotencyKey) {
          await releaseIdempotencyLock(`withdraw:${idempotencyKey}`, env);
        }
        return jsonResponse(
          {
            success: false,
            mode: 'live_pi_api',
            error: err?.message || 'Errore rete Pi Platform API durante prelievo A2U',
          },
          502,
          {},
          piCors.headers
        );
      }
    }

    if (!idempotencyKey) {
      return jsonResponse(
        {
          success: false,
          mode: 'unconfigured',
          error: 'Header Idempotency-Key obbligatorio. Configurare PI_API_KEY per prelievi reali.',
        },
        400,
        {},
        piCors.headers
      );
    }

    // In assenza di PI_API_KEY: rifiuta esplicitamente invece di simulare successo
    console.warn(`[AUDIT] Worker /api/pi/withdraw REJECTED: PI_API_KEY not configured`);
    return jsonResponse(
      {
        success: false,
        mode: 'unconfigured',
        error: 'PI_API_KEY non configurata: prelievi A2U reali non disponibili. Configurare PI_API_KEY, PI_WALLET_SEED e PI_WALLET_PUBLIC_KEY per operazioni reali.',
      },
      501,
      {},
      piCors.headers
    );
  }

  // 8. POST /api/wallet/points (Sincronizzazione punti autenticata su Cloud Firestore)
  if (method === 'POST' && pathname === '/api/wallet/points') {
    const body = await parseJsonBody(request);
    if (!body) {
      return jsonResponse({ success: false, synced: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    }
    try {
      const firebaseIdToken =
        request.headers.get('X-Firebase-Token') ||
        (typeof body.firebaseIdToken === 'string' ? body.firebaseIdToken : '');
      const piAccessToken =
        extractBearerToken(request, body) ||
        (typeof body.piAccessToken === 'string' ? body.piAccessToken : '');

      const result = await executeServerWalletPointsSync({
        payload: {
          walletId: body.walletId,
          pointsDelta: Number(body.pointsDelta ?? 0),
          merchantPiDelta: Number(body.merchantPiDelta ?? 0),
          actionType: body.actionType,
          description: body.description,
          txId: body.txId,
          txHash: body.txHash,
          piEquivalent: body.piEquivalent,
          pioneerUsername: body.pioneerUsername,
          pioneerWalletAddress: body.pioneerWalletAddress,
          adStreamEnabled: body.adStreamEnabled,
          adCompletedStreakDelta: body.adCompletedStreakDelta,
          firebaseIdToken,
          piAccessToken,
        },
        env,
      });

      return jsonResponse(result.body, result.status, NO_CACHE_HEADERS, piCors.headers);
    } catch (err: any) {
      return jsonResponse(
        {
          success: false,
          synced: false,
          error: err?.message || 'Errore sincronizzazione punti wallet Firestore',
        },
        502,
        {},
        piCors.headers
      );
    }
  }

  // 9. GET / POST /api/testnet/query (parità edge senza FS locale)
  if ((method === 'GET' || method === 'POST') && pathname === '/api/testnet/query') {
    return jsonResponse({ success: true, data: [], runtime: 'cloudflare-worker' }, 200, NO_CACHE_HEADERS);
  }

  // ==================== CHAT API (Worker) ====================
  // Crea o recupera chat P2P
  if (method === 'POST' && pathname === '/api/chats') {
    const body = await parseJsonBody(request);
    if (!body) return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    const { participant2Uid, listingId } = body || {};
    const piAccessToken = extractBearerToken(request, body);
    if (!piAccessToken) return jsonResponse({ success: false, error: 'Token Pi Pioneer obbligatorio' }, 401, {}, piCors.headers);
    if (!participant2Uid || !isValidPiIdentifier(participant2Uid)) return jsonResponse({ success: false, error: 'participant2Uid mancante o non valido' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const callerUid = meData?.uid;
      if (!callerUid || callerUid === participant2Uid) return jsonResponse({ success: false, error: 'Utenti non validi' }, 400, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const chatId = [callerUid, participant2Uid].sort().join('_');
      const existingRes = await fetch(`${baseUrl}/chats/${encodeURIComponent(chatId)}`, {
        method: 'GET', headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error',
      });

      if (existingRes.ok) {
        const existing = await existingRes.json();
        return jsonResponse({ success: true, chatId, existing: true, chat: existing.fields }, 200, {}, piCors.headers);
      }

      const now = new Date().toISOString();
      const fieldsPayload = {
        id: { stringValue: chatId },
        participant1Uid: { stringValue: [callerUid, participant2Uid].sort()[0] },
        participant2Uid: { stringValue: [callerUid, participant2Uid].sort()[1] },
        createdAt: { timestampValue: now },
        lastMessageAt: { timestampValue: now },
        lastMessagePreview: { stringValue: 'Nuova chat' },
        unreadCount: { integerValue: '0' },
        ...(listingId ? { listingId: { stringValue: listingId } } : {}),
      };

      const createRes = await fetch(`${baseUrl}/chats?documentId=${encodeURIComponent(chatId)}`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsPayload }), redirect: 'error',
      });

      if (!createRes.ok) return jsonResponse({ success: false, error: 'Errore creazione chat' }, 500, {}, piCors.headers);

      return jsonResponse({ success: true, chatId, existing: false }, 201, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore creazione chat' }, 502, {}, piCors.headers);
    }
  }

  // Lista chat utente
  if (method === 'GET' && pathname === '/api/chats') {
    const piAccessToken = extractBearerToken(request, await parseJsonBody(request));
    if (!piAccessToken) return jsonResponse({ success: false, error: 'Token Pi Pioneer obbligatorio' }, 401, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const url1 = `${baseUrl}/chats?where=participant1Uid==${encodeURIComponent(uid)}&orderBy=lastMessageAt desc`;
      const url2 = `${baseUrl}/chats?where=participant2Uid==${encodeURIComponent(uid)}&orderBy=lastMessageAt desc`;

      const [res1, res2] = await Promise.all([
        fetch(url1, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(url2, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      const [data1, data2] = await Promise.all([res1.json().catch(() => ({})), res2.json().catch(() => ({}))]);
      const chats = [...(data1?.documents || []), ...(data2?.documents || [])].map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields }));

      return jsonResponse({ success: true, chats }, 200, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore recupero chat' }, 502, {}, piCors.headers);
    }
  }

  // Messaggi chat
  if (method === 'GET' && pathname.startsWith('/api/chats/') && pathname.endsWith('/messages')) {
    const chatId = pathname.split('/')[3];
    const piAccessToken = extractBearerToken(request, await parseJsonBody(request));
    if (!piAccessToken || !chatId) return jsonResponse({ success: false, error: 'Parametri mancanti' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const chatRes = await fetch(`${baseUrl}/chats/${encodeURIComponent(chatId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!chatRes.ok) return jsonResponse({ success: false, error: 'Chat non trovata' }, 404, {}, piCors.headers);
      const chat = await chatRes.json();
      const p1 = chat.fields?.participant1Uid?.stringValue;
      const p2 = chat.fields?.participant2Uid?.stringValue;
      if (p1 !== uid && p2 !== uid) return jsonResponse({ success: false, error: 'Accesso negato' }, 403, {}, piCors.headers);

      const msgRes = await fetch(`${baseUrl}/chats/${encodeURIComponent(chatId)}/messages?orderBy=timestamp desc`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!msgRes.ok) return jsonResponse({ success: true, messages: [] }, 200, {}, piCors.headers);
      const msgData = await msgRes.json();
      const messages = (msgData.documents || []).map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields }));

      return jsonResponse({ success: true, messages }, 200, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore recupero messaggi' }, 502, {}, piCors.headers);
    }
  }

  // Invia messaggio
  if (method === 'POST' && pathname.startsWith('/api/chats/') && pathname.endsWith('/messages')) {
    const chatId = pathname.split('/')[3];
    const body = await parseJsonBody(request);
    if (!body) return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    const { content, type = 'text', voiceNoteUrl, voiceDurationSec } = body || {};
    const piAccessToken = extractBearerToken(request, body);
    if (!piAccessToken || !chatId || !content) return jsonResponse({ success: false, error: 'Parametri mancanti' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const chatRes = await fetch(`${baseUrl}/chats/${encodeURIComponent(chatId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!chatRes.ok) return jsonResponse({ success: false, error: 'Chat non trovata' }, 404, {}, piCors.headers);
      const chat = await chatRes.json();
      const p1 = chat.fields?.participant1Uid?.stringValue;
      const p2 = chat.fields?.participant2Uid?.stringValue;
      if (p1 !== uid && p2 !== uid) return jsonResponse({ success: false, error: 'Accesso negato' }, 403, {}, piCors.headers);

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const msgFields = {
        id: { stringValue: messageId }, chatId: { stringValue: chatId }, senderUid: { stringValue: uid },
        content: { stringValue: content }, type: { stringValue: type }, timestamp: { timestampValue: now },
        ...(voiceNoteUrl ? { voiceNoteUrl: { stringValue: voiceNoteUrl } } : {}),
        ...(voiceDurationSec ? { voiceDurationSec: { integerValue: String(voiceDurationSec) } } : {}),
      };

      const msgRes = await fetch(`${baseUrl}/chats/${encodeURIComponent(chatId)}/messages?documentId=${encodeURIComponent(messageId)}`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: msgFields }), redirect: 'error',
      });

      if (!msgRes.ok) return jsonResponse({ success: false, error: 'Errore invio messaggio' }, 500, {}, piCors.headers);

      await fetch(`${baseUrl}/chats/${encodeURIComponent(chatId)}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { lastMessageAt: { timestampValue: now }, lastMessagePreview: { stringValue: content.slice(0, 200) } } }), redirect: 'error',
      });

      return jsonResponse({ success: true, messageId }, 201, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore invio messaggio' }, 502, {}, piCors.headers);
    }
  }

  // ==================== WEBRTC SIGNALING (Worker) ====================
  // Crea chiamata
  if (method === 'POST' && pathname === '/api/calls') {
    const body = await parseJsonBody(request);
    if (!body) return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    const { calleeUid, listingId } = body || {};
    const piAccessToken = extractBearerToken(request, body);
    if (!piAccessToken) return jsonResponse({ success: false, error: 'Token Pi Pioneer obbligatorio' }, 401, {}, piCors.headers);
    if (!calleeUid || !isValidPiIdentifier(calleeUid)) return jsonResponse({ success: false, error: 'calleeUid mancante o non valido' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const callerUid = meData?.uid;
      if (!callerUid || callerUid === calleeUid) return jsonResponse({ success: false, error: 'Utenti non validi' }, 400, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const fieldsPayload = {
        id: { stringValue: callId }, callerUid: { stringValue: callerUid }, calleeUid: { stringValue: calleeUid },
        status: { stringValue: 'ringing' }, createdAt: { timestampValue: now },
        ...(listingId ? { listingId: { stringValue: listingId } } : {}),
      };

      const createRes = await fetch(`${baseUrl}/calls?documentId=${encodeURIComponent(callId)}`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsPayload }), redirect: 'error',
      });

      if (!createRes.ok) return jsonResponse({ success: false, error: 'Errore creazione chiamata' }, 500, {}, piCors.headers);

      return jsonResponse({ success: true, callId }, 201, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore creazione chiamata' }, 502, {}, piCors.headers);
    }
  }

  // Signaling
  if (method === 'POST' && pathname.startsWith('/api/calls/') && pathname.endsWith('/signal')) {
    const callId = pathname.split('/')[3];
    const body = await parseJsonBody(request);
    if (!body) return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    const { type, payload } = body || {};
    const piAccessToken = extractBearerToken(request, body);
    if (!piAccessToken || !callId || !type || !payload) return jsonResponse({ success: false, error: 'Parametri mancanti' }, 400, {}, piCors.headers);
    if (!['offer', 'answer', 'ice-candidate'].includes(type)) return jsonResponse({ success: false, error: 'Type non valido' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const callRes = await fetch(`${baseUrl}/calls/${encodeURIComponent(callId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!callRes.ok) return jsonResponse({ success: false, error: 'Chiamata non trovata' }, 404, {}, piCors.headers);
      const call = await callRes.json();
      const caller = call.fields?.callerUid?.stringValue;
      const callee = call.fields?.calleeUid?.stringValue;
      if (caller !== uid && callee !== uid) return jsonResponse({ success: false, error: 'Accesso negato' }, 403, {}, piCors.headers);

      const signalId = `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const signalFields = {
        id: { stringValue: signalId }, callId: { stringValue: callId }, senderUid: { stringValue: uid },
        type: { stringValue: type }, payload: { mapValue: { fields: Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, { stringValue: String(v) }])) } },
        timestamp: { timestampValue: now },
      };

      const signalRes = await fetch(`${baseUrl}/calls/${encodeURIComponent(callId)}/signaling?documentId=${encodeURIComponent(signalId)}`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: signalFields }), redirect: 'error',
      });

      if (!signalRes.ok) return jsonResponse({ success: false, error: 'Errore invio signaling' }, 500, {}, piCors.headers);

      return jsonResponse({ success: true, signalId }, 201, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore signaling' }, 502, {}, piCors.headers);
    }
  }

  // Get signaling
  if (method === 'GET' && pathname.startsWith('/api/calls/') && pathname.endsWith('/signaling')) {
    const callId = pathname.split('/')[3];
    const piAccessToken = extractBearerToken(request, await parseJsonBody(request));
    if (!piAccessToken || !callId) return jsonResponse({ success: false, error: 'Parametri mancanti' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const callRes = await fetch(`${baseUrl}/calls/${encodeURIComponent(callId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!callRes.ok) return jsonResponse({ success: false, error: 'Chiamata non trovata' }, 404, {}, piCors.headers);
      const call = await callRes.json();
      const caller = call.fields?.callerUid?.stringValue;
      const callee = call.fields?.calleeUid?.stringValue;
      if (caller !== uid && callee !== uid) return jsonResponse({ success: false, error: 'Accesso negato' }, 403, {}, piCors.headers);

      const sigRes = await fetch(`${baseUrl}/calls/${encodeURIComponent(callId)}/signaling?orderBy=timestamp`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!sigRes.ok) return jsonResponse({ success: true, signals: [] }, 200, {}, piCors.headers);
      const sigData = await sigRes.json();
      const signals = (sigData.documents || []).map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields }));

      return jsonResponse({ success: true, signals }, 200, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore recupero signaling' }, 502, {}, piCors.headers);
    }
  }

  // Update call status
  if (method === 'PATCH' && pathname.startsWith('/api/calls/')) {
    const callId = pathname.split('/')[3];
    const body = await parseJsonBody(request);
    if (!body) return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    const { status, durationSec } = body || {};
    const piAccessToken = extractBearerToken(request, body);
    if (!piAccessToken || !callId || !status) return jsonResponse({ success: false, error: 'Parametri mancanti' }, 400, {}, piCors.headers);
    if (!['ringing', 'connected', 'ended', 'rejected', 'missed'].includes(status)) return jsonResponse({ success: false, error: 'Status non valido' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const callRes = await fetch(`${baseUrl}/calls/${encodeURIComponent(callId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!callRes.ok) return jsonResponse({ success: false, error: 'Chiamata non trovata' }, 404, {}, piCors.headers);
      const call = await callRes.json();
      const caller = call.fields?.callerUid?.stringValue;
      const callee = call.fields?.calleeUid?.stringValue;
      if (caller !== uid && callee !== uid) return jsonResponse({ success: false, error: 'Accesso negato' }, 403, {}, piCors.headers);

      const now = new Date().toISOString();
      const updateFields: any = { status: { stringValue: status } };
      if (status === 'ended' || status === 'rejected') {
        updateFields.endedAt = { timestampValue: now };
        if (durationSec) updateFields.durationSec = { integerValue: String(durationSec) };
      }

      const updateRes = await fetch(`${baseUrl}/calls/${encodeURIComponent(callId)}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: updateFields }), redirect: 'error',
      });

      if (!updateRes.ok) return jsonResponse({ success: false, error: 'Errore aggiornamento chiamata' }, 500, {}, piCors.headers);

      return jsonResponse({ success: true }, 200, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore aggiornamento chiamata' }, 502, {}, piCors.headers);
    }
  }

  // ==================== SALVAVATUTTO GUIDES (Worker) ====================
  // Crea guida
  if (method === 'POST' && pathname === '/api/guides') {
    const body = await parseJsonBody(request);
    if (!body) return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    const { title, category, content, steps, tags, author, readTimeMin } = body || {};
    const piAccessToken = extractBearerToken(request, body);
    if (!piAccessToken) return jsonResponse({ success: false, error: 'Token Pi Pioneer obbligatorio' }, 401, {}, piCors.headers);
    if (!title || !content || !steps || !Array.isArray(steps) || steps.length === 0) return jsonResponse({ success: false, error: 'Campi obbligatori mancanti' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const guideId = `salv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const fieldsPayload = {
        id: { stringValue: guideId }, authorUid: { stringValue: uid }, title: { stringValue: title },
        category: { stringValue: category || 'Generale' }, content: { stringValue: content },
        steps: { arrayValue: { values: steps.map(s => ({ stringValue: s })) } },
        tags: { arrayValue: { values: (tags || []).map(t => ({ stringValue: t })) } },
        author: { stringValue: author || meData?.username || 'Autore Locale' }, upvotes: { integerValue: '1' },
        readTimeMin: { integerValue: String(readTimeMin || Math.max(2, Math.round(content.length / 100))) },
        lastUpdated: { stringValue: now },
      };

      const createRes = await fetch(`${baseUrl}/guides?documentId=${encodeURIComponent(guideId)}`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsPayload }), redirect: 'error',
      });

      if (!createRes.ok) return jsonResponse({ success: false, error: 'Errore creazione guida' }, 500, {}, piCors.headers);

      return jsonResponse({ success: true, guideId }, 201, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore creazione guida' }, 502, {}, piCors.headers);
    }
  }

  // Lista guide
  if (method === 'GET' && pathname === '/api/guides') {
    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const res1 = await fetch(`${baseUrl}/guides?orderBy=lastUpdated desc&limit=50`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!res1.ok) return jsonResponse({ success: false, error: 'Errore recupero guide' }, 500, {}, piCors.headers);
      const data = await res1.json();
      const guides = (data.documents || []).map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields }));

      return jsonResponse({ success: true, guides }, 200, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore recupero guide' }, 502, {}, piCors.headers);
    }
  }

  // Upvote guida
  if (method === 'POST' && pathname.startsWith('/api/guides/') && pathname.endsWith('/upvote')) {
    const guideId = pathname.split('/')[3];
    const body = await parseJsonBody(request);
    if (!body) return jsonResponse({ success: false, error: 'Body JSON non valido' }, 400, {}, piCors.headers);
    const piAccessToken = extractBearerToken(request, body);
    if (!piAccessToken || !guideId) return jsonResponse({ success: false, error: 'Parametri mancanti' }, 400, {}, piCors.headers);

    const sa = resolveFirebaseServiceAccount(env);
    if (!sa) return jsonResponse({ success: false, error: 'FIREBASE_SERVICE_ACCOUNT non configurato' }, 503, {}, piCors.headers);

    try {
      const meRes = await fetch(`${PI_API_BASE}/me`, { method: 'GET', headers: { Authorization: `Bearer ${piAccessToken}` }, redirect: 'error' });
      if (!meRes.ok) return jsonResponse({ success: false, error: 'Token Pi non valido' }, 401, {}, piCors.headers);
      const meData: any = await meRes.json().catch(() => ({}));
      const uid = meData?.uid;
      if (!uid) return jsonResponse({ success: false, error: 'UID non valido' }, 401, {}, piCors.headers);

      const accessToken = await getGoogleDatastoreAccessToken(sa);
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/${encodeURIComponent(sa.database_id || 'ai-studio-have2want-09f05358-8731-443d-8237-790b65e889fa')}/documents`;

      const guideRes = await fetch(`${baseUrl}/guides/${encodeURIComponent(guideId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
      if (!guideRes.ok) return jsonResponse({ success: false, error: 'Guida non trovata' }, 404, {}, piCors.headers);
      const guide = await guideRes.json();
      if (guide.fields?.authorUid?.stringValue === uid) return jsonResponse({ success: false, error: 'Non puoi votare la tua guida' }, 403, {}, piCors.headers);

      for (let attempt = 0; attempt < 3; attempt++) {
        const getRes = await fetch(`${baseUrl}/guides/${encodeURIComponent(guideId)}`, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error' });
        if (!getRes.ok) return jsonResponse({ success: false, error: 'Errore lettura guida' }, 500, {}, piCors.headers);
        const existing = await getRes.json();
        const currentUpvotes = Number(existing.fields?.upvotes?.integerValue || '1');
        const updateTime = existing.updateTime;
        const patchRes = await fetch(`${baseUrl}/guides/${encodeURIComponent(guideId)}?currentDocument.updateTime=${encodeURIComponent(updateTime)}`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { upvotes: { integerValue: String(currentUpvotes + 1) } } }), redirect: 'error',
        });
        if (patchRes.ok) return jsonResponse({ success: true, upvotes: currentUpvotes + 1 }, 200, {}, piCors.headers);
        if (patchRes.status !== 409 && patchRes.status !== 412) return jsonResponse({ success: false, error: 'Errore upvote' }, 500, {}, piCors.headers);
      }

      return jsonResponse({ success: false, error: 'Conflitto upvote, riprova' }, 409, {}, piCors.headers);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Errore upvote' }, 502, {}, piCors.headers);
    }
  }

  // 9. GET / POST /api/testnet/query (parità edge senza FS locale)
  if ((method === 'GET' || method === 'POST') && pathname === '/api/testnet/query') {
    return jsonResponse({ success: true, data: [], runtime: 'cloudflare-worker' }, 200, NO_CACHE_HEADERS);
  }

  return jsonResponse({ error: 'Not Found' }, 404);
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: WorkerExecutionContext
  ): Promise<Response> {
    return handleWorkerRequest(request, env, ctx);
  },
};
