import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  encodeStellarStrKey,
  decodeStellarStrKey,
  buildSignedPiPaymentEnvelopeXdr,
  executeServerA2uPayout,
} from '../server/piA2uService';
import { handleWorkerRequest } from '../worker';

describe('A2U Stellar/Horizon Ed25519 XDR Signer & Wallet Points Firestore Sync', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function generateEd25519StrKeyPair() {
    const keyPair = (await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    )) as CryptoKeyPair;
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey));
    // RFC 8410 Ed25519: PKCS#8 ultimi 32 byte = seed, SPKI ultimi 32 byte = pubkey
    const seed32 = pkcs8.slice(pkcs8.length - 32);
    const pub32 = spki.slice(spki.length - 32);
    return {
      publicKeyStr: encodeStellarStrKey('public', pub32),
      seedStr: encodeStellarStrKey('seed', seed32),
      publicKey: keyPair.publicKey,
      pub32,
      seed32,
    };
  }

  it('Decodifica StrKey con CRC16 e firma realmente TransactionV1 XDR verificabile con Ed25519', async () => {
    const sender = await generateEd25519StrKeyPair();
    const receiver = await generateEd25519StrKeyPair();

    expect(sender.publicKeyStr).toMatch(/^G[A-Z2-7]{55}$/);
    expect(sender.seedStr).toMatch(/^S[A-Z2-7]{55}$/);
    expect(decodeStellarStrKey(sender.publicKeyStr, 'public')).toEqual(sender.pub32);
    expect(decodeStellarStrKey(sender.seedStr, 'seed')).toEqual(sender.seed32);

    const signed = await buildSignedPiPaymentEnvelopeXdr({
      networkPassphrase: 'Pi Testnet',
      sourcePublicKey: sender.publicKeyStr,
      walletSeed: sender.seedStr,
      destinationAddress: receiver.publicKeyStr,
      amountPi: 1.49,
      memoPaymentId: 'a2u_pay_987',
      accountSequence: '1000',
      nowUnixSeconds: 1700000000,
    });

    expect(signed.txSeqNum).toBe('1001');
    expect(signed.amountStroops).toBe('14900000');
    expect(signed.txHashHex).toMatch(/^[0-9a-f]{64}$/);

    // Decodifica Base64 TransactionEnvelope XDR e verifica firma Ed25519 degli ultimi 64 byte
    const rawBin = atob(signed.envelopeBase64);
    const xdrBytes = new Uint8Array(rawBin.length);
    for (let i = 0; i < rawBin.length; i++) xdrBytes[i] = rawBin.charCodeAt(i);

    const view = new DataView(xdrBytes.buffer);
    expect(view.getUint32(0, false)).toBe(2); // ENVELOPE_TYPE_TX
    const signature64 = xdrBytes.slice(xdrBytes.length - 64);
    const txHashBytes = new Uint8Array(
      signed.txHashHex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
    );

    const isValidSig = await crypto.subtle.verify(
      { name: 'Ed25519' },
      sender.publicKey,
      signature64,
      txHashBytes
    );
    expect(isValidSig).toBe(true);
  });

  it('executeServerA2uPayout usa il signer Ed25519 XDR integrato di default verso Horizon e completa A2U', async () => {
    const sender = await generateEd25519StrKeyPair();
    const receiver = await generateEd25519StrKeyPair();
    const seenUrls: string[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init: any) => {
      const url = typeof input === 'string' ? input : input.url;
      seenUrls.push(`${init?.method || 'GET'} ${url}`);

      if (url.endsWith('/payments/incomplete_server_payments')) {
        return new Response(JSON.stringify({ incomplete_server_payments: [] }), { status: 200 });
      }
      if (url.endsWith('/v2/payments')) {
        return new Response(
          JSON.stringify({ identifier: 'pay_xdr_001', to_address: receiver.publicKeyStr }),
          { status: 200 }
        );
      }
      if (url.includes(`/accounts/${sender.publicKeyStr}`)) {
        return new Response(JSON.stringify({ sequence: '4200' }), { status: 200 });
      }
      if (url.endsWith('/transactions')) {
        expect(String(init?.body || '')).toMatch(/^tx=/);
        return new Response(
          JSON.stringify({ hash: 'horizon_real_ed25519_hash_4201', ledger: 99123 }),
          { status: 200 }
        );
      }
      if (url.endsWith('/payments/pay_xdr_001/complete')) {
        return new Response(JSON.stringify({ identifier: 'pay_xdr_001' }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    const result = await executeServerA2uPayout({
      apiKey: 'pi_live_secret_key',
      uid: 'uid_pioneer_1',
      walletAddress: receiver.publicKeyStr,
      netPiSent: 2.49,
      requestedPi: 2.5,
      feeDeducted: 0.01,
      pioneerUsername: '@pioneer_one',
      sandbox: true,
      env: {
        PI_WALLET_PUBLIC_KEY: sender.publicKeyStr,
        PI_WALLET_SEED: sender.seedStr,
      },
    });

    expect(result.status).toBe(200);
    expect(result.body.completed).toBe(true);
    expect(result.body.txHash).toBe('horizon_real_ed25519_hash_4201');
    expect(result.body.ledger).toBe(99123);
    expect(seenUrls.some((u) => u.includes('https://api.testnet.minepi.com/transactions'))).toBe(true);
  });

  it('POST /api/wallet/points autentica il Pioneer, impedisce spoofing UID e aggiorna atomicamente Firestore', async () => {
    const rsaKeyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', rsaKeyPair.privateKey));
    let bin = '';
    for (let i = 0; i < pkcs8.length; i++) bin += String.fromCharCode(pkcs8[i]);
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${btoa(bin)}\n-----END PRIVATE KEY-----`;

    const env = {
      FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        project_id: 'demo-proj',
        client_email: 'sa@demo-proj.iam.gserviceaccount.com',
        private_key: privateKeyPem,
      }),
    };

    // 1. Senza token -> 401
    const unauthRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/wallet/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: 'uid_abc', pointsDelta: 120, txId: 'rew_1' }),
      }),
      env
    );
    expect(unauthRes.status).toBe(401);

    let storedPoints = 120;
    const storedHistory: any[] = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any, init: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url === 'https://api.minepi.com/v2/me') {
        return new Response(JSON.stringify({ uid: 'uid_abc', username: '@pioneer_real' }), {
          status: 200,
        });
      }
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(JSON.stringify({ access_token: 'goog_sa_access', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes('/documents/wallets/uid_abc') && (init?.method || 'GET') === 'GET') {
        return new Response(
          JSON.stringify({
            updateTime: '2026-11-17T08:00:00Z',
            fields: {
              walletId: { stringValue: 'uid_abc' },
              pointsBalance: { integerValue: String(storedPoints) },
              totalPointsEarned: { integerValue: String(storedPoints) },
              merchantPiBalance: { integerValue: '0' },
              history: {
                arrayValue: {
                  values: storedHistory.map((h) => ({
                    mapValue: { fields: { id: { stringValue: h.id } } },
                  })),
                },
              },
            },
          }),
          { status: 200 }
        );
      }
      if (url.includes('/documents/wallets/uid_abc') && init?.method === 'PATCH') {
        const parsed = JSON.parse(String(init.body));
        storedPoints = Number(parsed.fields.pointsBalance.integerValue);
        storedHistory.unshift({ id: 'rew_verified_1' });
        return new Response(JSON.stringify({ fields: parsed.fields }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });

    // 2. Tentativo di aggiornare il wallet di un altro utente -> 403
    const spoofRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/wallet/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pi_token',
        },
        body: JSON.stringify({
          walletId: 'uid_victim',
          pointsDelta: 120,
          txId: 'rew_spoof',
        }),
      }),
      env
    );
    expect(spoofRes.status).toBe(403);

    // 3. Aggiornamento legittimo -> 200 e persistenza 120 + 120 = 240
    const syncRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/wallet/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pi_token',
        },
        body: JSON.stringify({
          walletId: 'uid_abc',
          pointsDelta: 120,
          actionType: 'REAL_LISTING_VERIFIED',
          description: 'Annuncio reale verificato',
          txId: 'rew_verified_1',
        }),
      }),
      env
    );
    const syncJson: any = await syncRes.json();
    expect(syncRes.status).toBe(200);
    expect(syncJson.synced).toBe(true);
    expect(syncJson.pointsBalance).toBe(240);

    // 4. Idempotenza su stessa txId -> deduplicated: true, nessun doppio accredito
    const replayRes = await handleWorkerRequest(
      new Request('https://urbano3d.example/api/wallet/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_pi_token',
        },
        body: JSON.stringify({
          walletId: 'uid_abc',
          pointsDelta: 120,
          actionType: 'REAL_LISTING_VERIFIED',
          txId: 'rew_verified_1',
        }),
      }),
      env
    );
    const replayJson: any = await replayRes.json();
    expect(replayRes.status).toBe(200);
    expect(replayJson.deduplicated).toBe(true);
    expect(replayJson.pointsBalance).toBe(240);
  });
});
