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
  type WalletSyncEnv,
} from './server/firestoreWalletSync';

export interface WorkerEnv extends FirebaseTokenEnv, IdempotencyEnv, PiA2uEnv, WalletSyncEnv {
  PI_API_KEY?: string;
  VITE_PI_SANDBOX?: string;
  ALLOWED_ORIGINS?: string;
  WINDY_WEBCAMS_API_KEY?: string;
  DB?: D1DatabaseLike;
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

  // 3b. GET /api/webcams/nearby (Windy Webcams API v3 proxy)
  if (method === 'GET' && pathname === '/api/webcams/nearby') {
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const radiusParam = url.searchParams.get('radius');
    const rawRadius = radiusParam !== null ? Number(radiusParam) : 35;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      (lat === 0 && lng === 0)
    ) {
      return jsonResponse({ error: 'Coordinate lat/lng non valide per webcam nearby.' }, 400);
    }
    const radiusKm = Number.isFinite(rawRadius) ? Math.min(100, Math.max(1, Math.round(rawRadius))) : 35;

    const windyKey = typeof env?.WINDY_WEBCAMS_API_KEY === 'string' ? env.WINDY_WEBCAMS_API_KEY.trim() : '';
    if (!windyKey || windyKey === 'PLACEHOLDER' || windyKey === 'MY_WINDY_API_KEY') {
      return jsonResponse(
        {
          configured: false,
          source: 'Windy Webcams API v3',
          webcams: [],
          message: 'WINDY_WEBCAMS_API_KEY non configurata sul server: integrazione pronta, nessun costo attivo.',
        },
        200
      );
    }

    const windyUrl = `https://api.windy.com/webcams/api/v3/webcams?nearby=${encodeURIComponent(
      `${lat.toFixed(4)},${lng.toFixed(4)},${radiusKm}`
    )}&include=images,location,player,urls&limit=12`;

    const cache = getDefaultCache();
    const cacheKey = new Request(windyUrl, { method: 'GET' });
    if (cache) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const clonedHeaders = new Headers(cached.headers);
        Object.entries(PUBLIC_CORS_HEADERS).forEach(([k, v]) => clonedHeaders.set(k, v));
        return new Response(cached.body, { status: cached.status, headers: clonedHeaders });
      }
    }

    try {
      const upstream = await fetch(windyUrl, {
        method: 'GET',
        headers: {
          'x-windy-api-key': windyKey,
          Accept: 'application/json',
        },
        redirect: 'error',
      });
      if (!upstream.ok) {
        return jsonResponse(
          {
            configured: true,
            source: 'Windy Webcams API v3',
            webcams: [],
            error: `Windy Webcams HTTP ${upstream.status}`,
          },
          upstream.status
        );
      }
      const rawJson: any = await upstream.json().catch(() => ({}));
      const rawList = Array.isArray(rawJson?.webcams) ? rawJson.webcams : [];
      const webcams = rawList
        .map((w: any) => {
          const wLat = Number(w?.location?.latitude);
          const wLng = Number(w?.location?.longitude);
          const previewImageUrl =
            w?.images?.current?.preview || w?.images?.daylight?.preview || w?.images?.current?.thumbnail || '';
          if (!previewImageUrl || !Number.isFinite(wLat) || !Number.isFinite(wLng) || (wLat === 0 && wLng === 0)) {
            return null;
          }
          return {
            id: String(w.webcamId ?? w.id ?? ''),
            title: String(w.title || 'Webcam Live'),
            status: String(w.status || 'active'),
            lat: wLat,
            lng: wLng,
            city: String(w?.location?.city || ''),
            region: String(w?.location?.region || ''),
            country: String(w?.location?.country || ''),
            previewImageUrl: String(previewImageUrl),
            playerUrl: typeof w?.player?.day === 'string' ? w.player.day : typeof w?.player?.live === 'string' ? w.player.live : null,
            windyPageUrl: String(w?.urls?.detail || `https://www.windy.com/webcams/${encodeURIComponent(String(w.webcamId ?? ''))}`),
            lastUpdatedIso: w?.lastUpdatedOn ? String(w.lastUpdatedOn) : null,
          };
        })
        .filter(Boolean);

      const response = jsonResponse(
        { configured: true, source: 'Windy Webcams API v3', webcams },
        200,
        { 'Cache-Control': 'public, max-age=300' }
      );
      if (cache) {
        const putPromise = cache.put(cacheKey, response.clone());
        if (ctx?.waitUntil) ctx.waitUntil(putPromise);
        else await putPromise;
      }
      return response;
    } catch (err: any) {
      return jsonResponse(
        {
          configured: true,
          source: 'Windy Webcams API v3',
          webcams: [],
          error: err?.message || 'Errore proxy Windy Webcams',
        },
        502
      );
    }
  }

  // 3c. GET /api/satellites/omm (CelesTrak GP/OMM proxy)
  if (method === 'GET' && pathname === '/api/satellites/omm') {
    const rawId = (url.searchParams.get('noradId') || url.searchParams.get('catnr') || '').trim();
    if (!/^\d{1,9}$/.test(rawId) || Number(rawId) <= 0) {
      return jsonResponse({ error: 'Parametro noradId numerico non valido' }, 400);
    }

    const celestrakUrl = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${encodeURIComponent(rawId)}&FORMAT=json`;
    const cache = getDefaultCache();
    const cacheKey = new Request(celestrakUrl, { method: 'GET' });
    if (cache) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const clonedHeaders = new Headers(cached.headers);
        Object.entries(PUBLIC_CORS_HEADERS).forEach(([k, v]) => clonedHeaders.set(k, v));
        return new Response(cached.body, { status: cached.status, headers: clonedHeaders });
      }
    }

    try {
      const upstream = await fetch(celestrakUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'error',
      });
      if (!upstream.ok) {
        return jsonResponse({ error: `CelesTrak HTTP ${upstream.status}` }, upstream.status);
      }
      const data = await upstream.json();
      const response = jsonResponse(data, 200, { 'Cache-Control': 'public, max-age=900' });
      if (cache) {
        const putPromise = cache.put(cacheKey, response.clone());
        if (ctx?.waitUntil) ctx.waitUntil(putPromise);
        else await putPromise;
      }
      return response;
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Errore proxy CelesTrak OMM' }, 502);
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

    if (await hasIdempotencyLock(`complete_pay:${paymentId}`, env)) {
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
      return jsonResponse(
        {
          approved: true,
          paymentId,
          mode: 'structured_fallback',
          message: 'PI_API_KEY non configurata: approvazione strutturata Testnet/Preview completata.',
          timestamp: new Date().toISOString(),
        },
        200,
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

    const payLockKey = `complete_pay:${paymentId}`;
    const txLockKey = `complete_txid:${txid}`;

    const payClaim = await acquireIdempotencyLock(payLockKey, txid, env);
    if (!payClaim.acquired) {
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
      return jsonResponse(
        {
          completed: true,
          paymentId,
          txid,
          mode: 'structured_fallback',
          idempotencyScope: payClaim.scope,
          message: 'PI_API_KEY non configurata: completamento strutturato Testnet/Preview registrato.',
          timestamp: new Date().toISOString(),
        },
        200,
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
          mode: 'structured_fallback',
          error: 'Header Idempotency-Key obbligatorio anche in modalità preview.',
        },
        400,
        {},
        piCors.headers
      );
    }

    const lockKey = `withdraw:${idempotencyKey}`;
    const claim = await acquireIdempotencyLock(lockKey, walletAddress.trim(), env);
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

    const txHash = `pi_testnet_preview_${Math.random().toString(36).substring(2, 12)}_a2u`;
    return jsonResponse(
      {
        success: true,
        mode: 'structured_fallback',
        idempotencyScope: claim.scope,
        txHash,
        netPiSent,
        feeDeducted,
        walletAddress: walletAddress.trim(),
        pioneerUsername: pioneerUsername || '@pioneer_user',
        message: 'PI_API_KEY assente: prelievo A2U registrato in modalità fallback strutturato.',
        timestamp: new Date().toISOString(),
      },
      200,
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
