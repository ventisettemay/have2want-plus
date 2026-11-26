import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getApiBaseUrl, resolveApiUrl, buildApiUrl } from '../src/lib/apiConfig';
import {
  handleWorkerRequest,
  resetWorkerDeduplicationStateForTests,
} from '../worker';
import Urbano3D from '../src/components/have2want/Urbano3D';
import { classifyMerchantPin } from '../src/lib/merchantPinClassifier';

describe('Cloudflare Pages + Worker + Urbano3D Security & TDZ Suite', () => {
  beforeEach(() => {
    resetWorkerDeduplicationStateForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('apiConfig risolve correttamente URL relativi e remoti per Workers', () => {
    expect(getApiBaseUrl('')).toBe('');
    expect(getApiBaseUrl('https://urbano3d-api.example.workers.dev/')).toBe(
      'https://urbano3d-api.example.workers.dev'
    );
    expect(resolveApiUrl('/api/health')).toBe('/api/health');
    expect(buildApiUrl('api/pi/approve', 'https://urbano3d-api.example.workers.dev/')).toBe(
      'https://urbano3d-api.example.workers.dev/api/pi/approve'
    );
  });

  it('Urbano3D renderizza in modo sincrono senza errore TDZ su allMerchants', () => {
    const html = renderToStaticMarkup(React.createElement(Urbano3D));
    expect(html).toContain('btn-urbano-toggle-route');
    expect(html).not.toContain('urbano-route-transport-bar');

    const pinTypes = new Set(INITIAL_PI_MERCHANTS.map((m) => classifyMerchantPin(m).type));
    expect(pinTypes.has('PI_ACCEPTED')).toBe(true);
    expect(pinTypes.has('AD_ONLY')).toBe(true);
    expect(pinTypes.has('DOUBLE_RING')).toBe(true);
  });

  it('Worker gestisce OPTIONS preflight, validation-key.txt/.well-known e ALLOWED_ORIGINS', async () => {
    const optRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/health', { method: 'OPTIONS' })
    );
    expect(optRes.status).toBe(204);
    expect(optRes.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const rootKeyRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/validation-key.txt', { method: 'GET' })
    );
    expect(rootKeyRes.status).toBe(200);
    expect(rootKeyRes.headers.get('Content-Type')).toContain('text/plain');
    expect((await rootKeyRes.text()).length).toBe(128);

    const wellKnownRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/.well-known/validation-key.txt', { method: 'GET' })
    );
    expect(wellKnownRes.status).toBe(200);
    expect((await wellKnownRes.text()).length).toBe(128);

    const blockedCors = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/config', {
        method: 'GET',
        headers: { Origin: 'https://evil-site.example' },
      }),
      { ALLOWED_ORIGINS: 'https://urbano3d.pages.dev' }
    );
    expect(blockedCors.status).toBe(403);

    const allowedCors = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/config', {
        method: 'GET',
        headers: { Origin: 'https://urbano3d.pages.dev' },
      }),
      { ALLOWED_ORIGINS: 'https://urbano3d.pages.dev' }
    );
    expect(allowedCors.status).toBe(200);
    expect(allowedCors.headers.get('Access-Control-Allow-Origin')).toBe('https://urbano3d.pages.dev');
  });

  it('Worker /api/health e /api/pi/config rispettano secrets e Mainnet/Testnet', async () => {
    const fallbackHealth = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/health'),
      {}
    );
    const fallbackJson: any = await fallbackHealth.json();
    expect(fallbackHealth.status).toBe(200);
    expect(fallbackJson.runtime).toBe('cloudflare-worker');
    expect(fallbackJson.piApiConfigured).toBe(false);
    expect(fallbackJson.piMode).toBe('structured_fallback');

    const liveConfig = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/config'),
      { PI_API_KEY: 'secret_live_key', VITE_PI_SANDBOX: 'false' }
    );
    const liveConfigJson: any = await liveConfig.json();
    expect(liveConfig.status).toBe(200);
    expect(liveConfigJson.sandbox).toBe(false);
    expect(liveConfigJson.serverConfigured).toBe(true);
    expect(liveConfigJson.mode).toBe('live_pi_api');

    const sandboxConfig = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/config'),
      { VITE_PI_SANDBOX: 'true' }
    );
    const sandboxJson: any = await sandboxConfig.json();
    expect(sandboxJson.sandbox).toBe(true);
  });

  it('Worker /api/weather/rainviewer e /api/weather/rainviewer/tile prevengono SSRF e redirect', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init: any) => {
      expect(init?.redirect).toBe('error');
      const target = typeof input === 'string' ? input : input.url;
      if (target === 'https://api.rainviewer.com/public/weather-maps.json') {
        return new Response(
          JSON.stringify({ host: 'https://tilecache.rainviewer.com', radar: { past: [] } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (target.startsWith('https://tilecache.rainviewer.com/')) {
        return new Response(new Uint8Array([137, 80, 78, 71]), {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        });
      }
      return new Response('Forbidden', { status: 403 });
    });

    const radarRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/weather/rainviewer')
    );
    expect(radarRes.status).toBe(200);
    expect(radarRes.headers.get('Cache-Control')).toContain('max-age=120');

    const validTileRes = await handleWorkerRequest(
      new Request(
        'https://urbano3d.example/api/weather/rainviewer/tile?url=' +
          encodeURIComponent('https://tilecache.rainviewer.com/v2/radar/1/256/3/4/2/2/1_1.png')
      )
    );
    expect(validTileRes.status).toBe(200);
    expect(validTileRes.headers.get('Content-Type')).toBe('image/png');

    const validPathRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/weather/rainviewer/tile?path=/v2/radar/1/tile.png')
    );
    expect(validPathRes.status).toBe(200);

    const ssrfUrls = [
      'https://evil.com/secret.png',
      'https://tilecache.rainviewer.com.evil.com/tile.png',
      'https://tilecache.rainviewer.com@evil.com/tile.png',
      'http://tilecache.rainviewer.com/tile.png',
    ];
    for (const bad of ssrfUrls) {
      const badRes = await handleWorkerRequest(
        new Request(
          'https://urbano3d.example/api/weather/rainviewer/tile?url=' + encodeURIComponent(bad)
        )
      );
      expect(badRes.status).toBe(400);
    }

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('Worker blocca pagamenti duplicati, txid riutilizzati e prelievi A2U non autenticati', async () => {
    const badApprove = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'bad id with spaces' }),
      })
    );
    expect(badApprove.status).toBe(400);

    // Fallback complete + protezione duplicati
    const firstComplete = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'pay_fb_1', txid: 'tx_fb_1' }),
      })
    );
    expect(firstComplete.status).toBe(200);

    const dupTxid = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'pay_fb_2', txid: 'tx_fb_1' }),
      })
    );
    expect(dupTxid.status).toBe(409);

    const reApproveCompleted = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'pay_fb_1' }),
      })
    );
    expect(reApproveCompleted.status).toBe(409);

    // Limite importo prelievo
    const lowWithdraw = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedPi: 0.25, walletAddress: 'GC4QNJHVWYXOJ5' }),
      })
    );
    expect(lowWithdraw.status).toBe(400);

    const highWithdraw = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedPi: 250, walletAddress: 'GC4QNJHVWYXOJ5' }),
      })
    );
    expect(highWithdraw.status).toBe(400);

    const env = { PI_API_KEY: 'pi_secret_xyz' };

    // Live A2U senza uid deve fallire 401 (nessun bypass verso fallback)
    const missingUidWithdraw = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedPi: 1.5,
          walletAddress: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
        }),
      }),
      env
    );
    expect(missingUidWithdraw.status).toBe(401);

    // Live A2U senza accessToken deve fallire 401
    const unauthWithdraw = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedPi: 1.5,
          walletAddress: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
          uid: 'uid_abc',
        }),
      }),
      env
    );
    expect(unauthWithdraw.status).toBe(401);

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.endsWith('/v2/me')) {
        expect(init?.headers?.Authorization).toBe('Bearer valid_pioneer_token');
        return new Response(JSON.stringify({ uid: 'uid_abc', username: 'pioniere' }), {
          status: 200,
        });
      }
      expect(init?.headers?.Authorization).toBe('Key pi_secret_xyz');
      if (url.endsWith('/approve')) {
        return new Response(
          JSON.stringify({ identifier: 'pay_live_1', status: { developer_approved: true } }),
          { status: 200 }
        );
      }
      if (url.endsWith('/payments/pay_live_1/complete')) {
        return new Response(
          JSON.stringify({ identifier: 'pay_live_1', transaction: { txid: 'tx_999' } }),
          { status: 200 }
        );
      }
      if (url.endsWith('/incomplete_server_payments')) {
        return new Response(JSON.stringify({ incomplete_server_payments: [] }), { status: 200 });
      }
      if (url.endsWith('/v2/payments')) {
        return new Response(
          JSON.stringify({
            identifier: 'a2u_123',
            to_address: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
            transaction: null,
          }),
          { status: 200 }
        );
      }
      if (url.endsWith('/payments/a2u_123/complete')) {
        return new Response(
          JSON.stringify({
            identifier: 'a2u_123',
            transaction: { txid: 'real_horizon_tx_a2u_123' },
          }),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 404 });
    });

    // Live A2U con uid diverso da /v2/me -> 403
    const spoofedUidWithdraw = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pioneer_token',
        },
        body: JSON.stringify({
          requestedPi: 1.5,
          walletAddress: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
          uid: 'uid_victim',
        }),
      }),
      env
    );
    expect(spoofedUidWithdraw.status).toBe(403);

    // Live A2U senza PI_WALLET_SEED / firma Horizon -> 501 (nessun hash inventato) e rilascia lock Idempotency-Key
    const unseededWithdraw = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pioneer_token',
          'Idempotency-Key': 'wth_unique_1',
        },
        body: JSON.stringify({
          requestedPi: 1.5,
          walletAddress: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
          uid: 'uid_abc',
        }),
      }),
      env
    );
    const unseededJson: any = await unseededWithdraw.json();
    expect(unseededWithdraw.status).toBe(501);
    expect(unseededJson.txHash).toBeNull();
    expect(unseededJson.stage).toBe('horizon_signing_unconfigured');

    const liveApprove = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'pay_live_1' }),
      }),
      env
    );
    expect(liveApprove.status).toBe(200);

    const liveComplete = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'pay_live_1', txid: 'tx_999' }),
      }),
      env
    );
    expect(liveComplete.status).toBe(200);

    // Mock D1 condiviso tra due isolate distinti
    const d1Rows = new Map<string, string>();
    const sharedD1 = {
      prepare(sql: string) {
        return {
          bind(...vals: unknown[]) {
            return {
              async run() {
                if (sql.includes('INSERT OR IGNORE')) {
                  const k = String(vals[0]);
                  if (d1Rows.has(k)) return { success: true, meta: { changes: 0 } };
                  d1Rows.set(k, String(vals[1]));
                  return { success: true, meta: { changes: 1 } };
                }
                if (sql.includes('DELETE')) {
                  d1Rows.delete(String(vals[0]));
                }
                return { success: true, meta: { changes: 1 } };
              },
              async first<T>() {
                const k = String(vals[0]);
                return d1Rows.has(k) ? ({ lock_key: k } as T) : null;
              },
            };
          },
        };
      },
    };

    const fullA2uEnv = {
      ...env,
      PI_WALLET_PUBLIC_KEY: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
      PI_WALLET_SEED: 'SBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      DB: sharedD1,
    };

    const liveWithdraw = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pioneer_token',
          'Idempotency-Key': 'wth_unique_1',
        },
        body: JSON.stringify({
          requestedPi: 1.5,
          walletAddress: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
          pioneerUsername: '@pioniere',
          uid: 'uid_abc',
        }),
      }),
      fullA2uEnv,
      undefined,
      {
        horizonSigner: async () => ({ txid: 'real_horizon_tx_a2u_123', ledger: 42 }),
      }
    );
    const liveWithdrawJson: any = await liveWithdraw.json();
    expect(liveWithdraw.status).toBe(200);
    expect(liveWithdrawJson.mode).toBe('live_pi_api');
    expect(liveWithdrawJson.stage).toBe('a2u_completed_on_chain');
    expect(liveWithdrawJson.netPiSent).toBe(1.49);
    expect(liveWithdrawJson.txHash).toBe('real_horizon_tx_a2u_123');
    expect(liveWithdrawJson.idempotencyScope).toBe('d1_global');

    // Simula un NUOVO isolate Cloudflare Worker (reset memoria locale) con stesso DB condiviso -> deve bloccare 409!
    resetWorkerDeduplicationStateForTests();

    const crossIsolateReplay = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/pi/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pioneer_token',
          'Idempotency-Key': 'wth_unique_1',
        },
        body: JSON.stringify({
          requestedPi: 1.5,
          walletAddress: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
          uid: 'uid_abc',
        }),
      }),
      fullA2uEnv,
      undefined,
      {
        horizonSigner: async () => ({ txid: 'should_never_run' }),
      }
    );
    expect(crossIsolateReplay.status).toBe(409);

    expect(fetchMock).toHaveBeenCalledTimes(9);
  });

  it('POST /api/auth/firebase-token autentica token Pi e firma Custom Token RS256 valido', async () => {
    const missingTokenRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/auth/firebase-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(missingTokenRes.status).toBe(401);

    const noServiceAccRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/auth/firebase-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer any_token',
        },
        body: JSON.stringify({}),
      }),
      {}
    );
    expect(noServiceAccRes.status).toBe(503);

    // Genera coppia chiavi RSA effimera solo per il test
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
    const b64 = Buffer.from(pkcs8).toString('base64');
    const pem = `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.endsWith('/v2/me')) {
        return new Response(JSON.stringify({ uid: 'PiUser.001', username: 'marco_pi' }), {
          status: 200,
        });
      }
      return new Response('{}', { status: 404 });
    });

    const authRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/auth/firebase-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pi_jwt',
        },
        body: JSON.stringify({}),
      }),
      {
        FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk-test@gen-lang-client-0597053183.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: pem,
        FIREBASE_PROJECT_ID: 'gen-lang-client-0597053183',
      }
    );

    expect(authRes.status).toBe(200);
    const json: any = await authRes.json();
    expect(json.success).toBe(true);
    expect(json.firebaseUid).toBe('piuser_001');
    expect(typeof json.customToken).toBe('string');

    // Verifica firma RS256 del Custom Token con chiave pubblica
    const [hdr, pay, sig] = json.customToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(pay, 'base64url').toString('utf-8'));
    expect(decodedPayload.uid).toBe('piuser_001');
    expect(decodedPayload.claims.provider).toBe('pi_network');
    expect(decodedPayload.aud).toBe(
      'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'
    );

    const validSig = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      keyPair.publicKey,
      Buffer.from(sig, 'base64url'),
      new TextEncoder().encode(`${hdr}.${pay}`)
    );
    expect(validSig).toBe(true);
  });

  it('Worker /api/webcams/nearby e /api/satellites/omm gestiscono validazione, fallback e header sicuri', async () => {
    const badWebcam = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/webcams/nearby?lat=0&lng=0')
    );
    expect(badWebcam.status).toBe(400);

    const unconfiguredWebcam = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/webcams/nearby?lat=41.89&lng=12.49'),
      {}
    );
    expect(unconfiguredWebcam.status).toBe(200);
    const unconfJson: any = await unconfiguredWebcam.json();
    expect(unconfJson.configured).toBe(false);
    expect(unconfJson.webcams).toEqual([]);

    const badNorad = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/satellites/omm?noradId=invalid_abc')
    );
    expect(badNorad.status).toBe(400);

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init: any) => {
      expect(init?.redirect).toBe('error');
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith('https://api.windy.com/webcams/api/v3/webcams')) {
        expect(init?.headers?.['x-windy-api-key']).toBe('windy_secret_key');
        return new Response(
          JSON.stringify({
            webcams: [
              {
                webcamId: 101,
                title: 'Piazza Venezia Live',
                status: 'active',
                location: { latitude: 41.895, longitude: 12.482, city: 'Roma', country: 'Italia' },
                images: { current: { preview: 'https://images.windy.com/preview.jpg' } },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.startsWith('https://celestrak.org/NORAD/elements/gp.php?CATNR=40697')) {
        return new Response(
          JSON.stringify([{ NORAD_CAT_ID: 40697, OBJECT_NAME: 'SENTINEL-2A' }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not found', { status: 404 });
    });

    const liveWebcam = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/webcams/nearby?lat=41.89&lng=12.49&radiusKm=30'),
      { WINDY_WEBCAMS_API_KEY: 'windy_secret_key' }
    );
    expect(liveWebcam.status).toBe(200);
    const webcamJson: any = await liveWebcam.json();
    expect(webcamJson.configured).toBe(true);
    expect(webcamJson.webcams).toHaveLength(1);
    expect(webcamJson.webcams[0].title).toBe('Piazza Venezia Live');

    const ommRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/satellites/omm?noradId=40697')
    );
    expect(ommRes.status).toBe(200);
    expect(ommRes.headers.get('Cache-Control')).toContain('max-age=900');
    const ommJson: any = await ommRes.json();
    expect(ommJson[0].NORAD_CAT_ID).toBe(40697);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
