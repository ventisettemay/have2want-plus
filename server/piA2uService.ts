// Orchestratore e signer Ed25519/XDR ufficiale per il ciclo App-to-User (A2U) Pi Platform API v2.
// Implementa tutte le 5 fasi reali richieste da Pi Network in Mainnet/Testnet:
//  1. Verifica identità utente: GET /v2/me (Authorization: Bearer <accessToken>)
//  2. Controllo pagamenti pendenti: GET /v2/payments/incomplete_server_payments
//  3. Creazione pagamento A2U: POST /v2/payments (Authorization: Key <PI_API_KEY>)
//  4. Firma Stellar/Horizon TransactionV1 XDR con Ed25519 WebCrypto (PI_WALLET_SEED + PI_WALLET_PUBLIC_KEY) ed invio POST /transactions
//  5. Completamento su Pi Platform API: POST /v2/payments/<paymentId>/complete con reale txid on-chain

const PI_API_BASE = 'https://api.minepi.com/v2';
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STRKEY_VERSION_PUBLIC_KEY = 6 << 3; // 'G' (0x30)
const STRKEY_VERSION_SEED = 18 << 3; // 'S' (0x90)
// Prefix DER RFC 8410 per chiave privata Ed25519 a 32 byte (PKCS#8)
const ED25519_PKCS8_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
  0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);

export interface PiA2uEnv {
  PI_API_KEY?: string;
  PI_WALLET_SEED?: string;
  PI_WALLET_PUBLIC_KEY?: string;
  VITE_PI_SANDBOX?: string;
}

export interface HorizonSubmitResult {
  txid: string;
  ledger?: number;
}

export type HorizonSignerFn = (params: {
  horizonUrl: string;
  networkPassphrase: string;
  sourcePublicKey: string;
  walletSeed: string;
  destinationAddress: string;
  amountPi: number;
  memoPaymentId: string;
}) => Promise<HorizonSubmitResult>;

export function getPiHorizonUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://api.testnet.minepi.com'
    : 'https://api.mainnet.minepi.com';
}

export function getPiNetworkPassphrase(sandbox: boolean): string {
  return sandbox ? 'Pi Testnet' : 'Pi Network';
}

function crc16Xmodem(bytes: Uint8Array): number {
  let crc = 0x0000;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(encoded: string): Uint8Array {
  const clean = encoded.trim().toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error(`Carattere StrKey Base32 non valido: ${clean[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function encodeStellarStrKey(
  type: 'public' | 'seed',
  raw32: Uint8Array
): string {
  if (raw32.length !== 32) {
    throw new Error('La chiave Ed25519 StrKey deve essere lunga esattamente 32 byte.');
  }
  const version = type === 'public' ? STRKEY_VERSION_PUBLIC_KEY : STRKEY_VERSION_SEED;
  const payload = new Uint8Array(35);
  payload[0] = version;
  payload.set(raw32, 1);
  const checksum = crc16Xmodem(payload.subarray(0, 33));
  payload[33] = checksum & 0xff;
  payload[34] = (checksum >>> 8) & 0xff;
  return base32Encode(payload);
}

export function decodeStellarStrKey(
  strKey: string,
  expectedType: 'public' | 'seed'
): Uint8Array {
  const clean = strKey.trim();
  const expectedPrefix = expectedType === 'public' ? 'G' : 'S';
  if (!clean.startsWith(expectedPrefix) || clean.length !== 56) {
    throw new Error(`Chiave Stellar/Pi non valida: atteso prefisso ${expectedPrefix} a 56 caratteri.`);
  }
  const decoded = base32Decode(clean);
  if (decoded.length !== 35) {
    throw new Error('Lunghezza binaria StrKey non valida (attesi 35 byte).');
  }
  const expectedVersion =
    expectedType === 'public' ? STRKEY_VERSION_PUBLIC_KEY : STRKEY_VERSION_SEED;
  if (decoded[0] !== expectedVersion) {
    throw new Error(`Version byte StrKey non valido per tipo ${expectedType}.`);
  }
  const expectedCrc = crc16Xmodem(decoded.subarray(0, 33));
  const actualCrc = decoded[33] | (decoded[34] << 8);
  if (expectedCrc !== actualCrc) {
    throw new Error(`Checksum CRC16 StrKey (${expectedPrefix}...) non valido.`);
  }
  return decoded.slice(1, 33);
}

class XdrWriter {
  private chunks: Uint8Array[] = [];

  writeUint32(val: number) {
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setUint32(0, val >>> 0, false);
    this.chunks.push(buf);
  }

  writeInt64(val: bigint) {
    const buf = new Uint8Array(8);
    new DataView(buf.buffer).setBigInt64(0, val, false);
    this.chunks.push(buf);
  }

  writeUint64(val: bigint) {
    const buf = new Uint8Array(8);
    new DataView(buf.buffer).setBigUint64(0, val, false);
    this.chunks.push(buf);
  }

  writeFixedBytes(bytes: Uint8Array) {
    this.chunks.push(bytes);
  }

  writeOpaqueVar(bytes: Uint8Array) {
    this.writeUint32(bytes.length);
    this.chunks.push(bytes);
    const pad = (4 - (bytes.length % 4)) % 4;
    if (pad > 0) {
      this.chunks.push(new Uint8Array(pad));
    }
  }

  writeString(str: string) {
    this.writeOpaqueVar(new TextEncoder().encode(str));
  }

  toUint8Array(): Uint8Array {
    const total = this.chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return new Uint8Array(digest);
}

async function importEd25519PrivateKey(seed32: Uint8Array): Promise<CryptoKey> {
  const pkcs8 = new Uint8Array(ED25519_PKCS8_PREFIX.length + seed32.length);
  pkcs8.set(ED25519_PKCS8_PREFIX, 0);
  pkcs8.set(seed32, ED25519_PKCS8_PREFIX.length);
  return crypto.subtle.importKey(
    'pkcs8',
    pkcs8 as unknown as BufferSource,
    { name: 'Ed25519' },
    false,
    ['sign']
  );
}

export async function buildSignedPiPaymentEnvelopeXdr(params: {
  networkPassphrase: string;
  sourcePublicKey: string;
  walletSeed: string;
  destinationAddress: string;
  amountPi: number;
  memoPaymentId: string;
  accountSequence: string | bigint;
  baseFeeStroops?: number;
  nowUnixSeconds?: number;
}): Promise<{
  envelopeBase64: string;
  txHashHex: string;
  txSeqNum: string;
  amountStroops: string;
}> {
  const sourcePub32 = decodeStellarStrKey(params.sourcePublicKey, 'public');
  const seed32 = decodeStellarStrKey(params.walletSeed, 'seed');
  const destPub32 = decodeStellarStrKey(params.destinationAddress, 'public');

  const stroops = BigInt(Math.round(Number(params.amountPi) * 10_000_000));
  if (stroops <= 0n) {
    throw new Error('Importo pagamento Stellar/Pi non valido (stroops <= 0).');
  }

  const nextSeq = BigInt(params.accountSequence) + 1n;
  const fee = Math.max(100000, Math.round(Number(params.baseFeeStroops || 100000)));
  const nowSec = Math.floor(params.nowUnixSeconds ?? Date.now() / 1000);
  const memoText = String(params.memoPaymentId || '').slice(0, 28);

  // Costruzione TransactionV1 body XDR
  const txWriter = new XdrWriter();
  // sourceAccount (MuxedAccount KEY_TYPE_ED25519 = 0)
  txWriter.writeUint32(0);
  txWriter.writeFixedBytes(sourcePub32);
  // fee
  txWriter.writeUint32(fee);
  // seqNum
  txWriter.writeInt64(nextSeq);
  // cond: PRECOND_TIME (1) con validità 5 minuti
  txWriter.writeUint32(1);
  txWriter.writeUint64(0n);
  txWriter.writeUint64(BigInt(nowSec + 300));
  // memo: MEMO_TEXT (1)
  txWriter.writeUint32(1);
  txWriter.writeString(memoText);
  // operations (1 PaymentOp)
  txWriter.writeUint32(1);
  txWriter.writeUint32(0); // operation sourceAccount = none
  txWriter.writeUint32(1); // OperationType.PAYMENT = 1
  txWriter.writeUint32(0); // destination KEY_TYPE_ED25519 = 0
  txWriter.writeFixedBytes(destPub32);
  txWriter.writeUint32(0); // AssetType.ASSET_TYPE_NATIVE = 0 (Pi)
  txWriter.writeInt64(stroops);
  // TransactionExt v0
  txWriter.writeUint32(0);

  const txBody = txWriter.toUint8Array();

  // Calcolo hash da firmare: SHA256(SHA256(networkPassphrase) || ENVELOPE_TYPE_TX(2) || txBody)
  const networkId = await sha256(new TextEncoder().encode(params.networkPassphrase));
  const taggedWriter = new XdrWriter();
  taggedWriter.writeFixedBytes(networkId);
  taggedWriter.writeUint32(2); // ENVELOPE_TYPE_TX
  taggedWriter.writeFixedBytes(txBody);
  const txHashBytes = await sha256(taggedWriter.toUint8Array());

  const privateKey = await importEd25519PrivateKey(seed32);
  const sigBuf = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    txHashBytes as unknown as BufferSource
  );
  const signature64 = new Uint8Array(sigBuf);
  const hint4 = sourcePub32.slice(28, 32);

  // TransactionEnvelope (ENVELOPE_TYPE_TX = 2)
  const envWriter = new XdrWriter();
  envWriter.writeUint32(2);
  envWriter.writeFixedBytes(txBody);
  envWriter.writeUint32(1); // 1 signature
  envWriter.writeFixedBytes(hint4);
  envWriter.writeOpaqueVar(signature64);

  const txHashHex = Array.from(txHashBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    envelopeBase64: bytesToBase64(envWriter.toUint8Array()),
    txHashHex,
    txSeqNum: nextSeq.toString(),
    amountStroops: stroops.toString(),
  };
}

/**
 * Signer Horizon integrato cross-runtime (Node 22 + Cloudflare Workers):
 * legge il sequence number corrente da Horizon, firma la TransactionV1 XDR con Ed25519
 * e invia POST /transactions ottenendo il txid reale on-chain.
 */
export const submitPiHorizonPayment: HorizonSignerFn = async (params) => {
  const baseHorizon = params.horizonUrl.replace(/\/+$/, '');

  const accountRes = await fetch(
    `${baseHorizon}/accounts/${encodeURIComponent(params.sourcePublicKey.trim())}`,
    {
      method: 'GET',
      redirect: 'error',
    }
  );
  if (!accountRes.ok) {
    throw new Error(
      `Impossibile recuperare sequence account mittente da Horizon (HTTP ${accountRes.status}).`
    );
  }
  const accountData: any = await accountRes.json().catch(() => ({}));
  if (!accountData?.sequence) {
    throw new Error('Risposta Horizon /accounts priva del campo sequence.');
  }

  const signed = await buildSignedPiPaymentEnvelopeXdr({
    networkPassphrase: params.networkPassphrase,
    sourcePublicKey: params.sourcePublicKey.trim(),
    walletSeed: params.walletSeed.trim(),
    destinationAddress: params.destinationAddress.trim(),
    amountPi: params.amountPi,
    memoPaymentId: params.memoPaymentId,
    accountSequence: String(accountData.sequence),
  });

  const submitRes = await fetch(`${baseHorizon}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${encodeURIComponent(signed.envelopeBase64)}`,
    redirect: 'error',
  });
  const submitJson: any = await submitRes.json().catch(() => ({}));

  if (!submitRes.ok || !submitJson?.hash) {
    const resultCodes = submitJson?.extras?.result_codes
      ? ` (${JSON.stringify(submitJson.extras.result_codes)})`
      : '';
    throw new Error(
      submitJson?.title || submitJson?.detail
        ? `Horizon TX rifiutata: ${submitJson.title || submitJson.detail}${resultCodes}`
        : `Horizon /transactions errore HTTP ${submitRes.status}${resultCodes}`
    );
  }

  return {
    txid: String(submitJson.hash),
    ledger: typeof submitJson.ledger === 'number' ? submitJson.ledger : undefined,
  };
};

export function getA2uSigningReadiness(env: PiA2uEnv): {
  ready: boolean;
  hasPublicKey: boolean;
  hasWalletSeed: boolean;
  missingRequirements: string[];
} {
  const pub = typeof env?.PI_WALLET_PUBLIC_KEY === 'string' ? env.PI_WALLET_PUBLIC_KEY.trim() : '';
  const seed = typeof env?.PI_WALLET_SEED === 'string' ? env.PI_WALLET_SEED.trim() : '';

  const hasPublicKey = /^G[A-Z2-7]{55}$/.test(pub);
  const hasWalletSeed = /^S[A-Z2-7]{55}$/.test(seed);

  const missingRequirements: string[] = [];
  if (!hasPublicKey) missingRequirements.push('PI_WALLET_PUBLIC_KEY (chiave pubblica G... Stellar/Pi)');
  if (!hasWalletSeed) missingRequirements.push('PI_WALLET_SEED (chiave segreta S... Stellar/Pi per firma Ed25519)');

  return {
    ready: hasPublicKey && hasWalletSeed,
    hasPublicKey,
    hasWalletSeed,
    missingRequirements,
  };
}

/**
 * Esegue il ciclo A2U live senza mai inventare hash blockchain.
 * Se mancano PI_WALLET_PUBLIC_KEY / PI_WALLET_SEED, interrompe in sicurezza con HTTP 501
 * prima di creare pagamenti orfani; quando configurati, utilizza il signer Ed25519/XDR integrato
 * (o il signer personalizzato passato nei test/hook).
 */
export async function executeServerA2uPayout(params: {
  apiKey: string;
  uid: string;
  walletAddress: string;
  netPiSent: number;
  requestedPi: number;
  feeDeducted: number;
  pioneerUsername?: string;
  sandbox: boolean;
  env: PiA2uEnv;
  horizonSigner?: HorizonSignerFn;
}): Promise<{
  status: number;
  body: Record<string, unknown>;
  createdRemotePayment: boolean;
}> {
  const readiness = getA2uSigningReadiness(params.env);

  // Non inventare MAI hash blockchain fittizi se il seed o la chiave pubblica mancano in modalità live
  if (!readiness.ready) {
    return {
      status: 501,
      createdRemotePayment: false,
      body: {
        success: false,
        completed: false,
        mode: 'live_pi_api',
        stage: 'horizon_signing_unconfigured',
        txHash: null,
        missingRequirements: readiness.missingRequirements,
        error:
          'Completamento A2U Mainnet NON COMPLETATO: mancano PI_WALLET_PUBLIC_KEY / PI_WALLET_SEED per firma Horizon Ed25519. Nessun hash simulato restituito.',
      },
    };
  }

  const signer: HorizonSignerFn = params.horizonSigner || submitPiHorizonPayment;

  // 1. Verifica eventuali pagamenti server-to-user incompleti su Pi Platform API
  const incompleteRes = await fetch(`${PI_API_BASE}/payments/incomplete_server_payments`, {
    method: 'GET',
    headers: { Authorization: `Key ${params.apiKey}` },
    redirect: 'error',
  });
  if (!incompleteRes.ok) {
    return {
      status: 502,
      createdRemotePayment: false,
      body: {
        success: false,
        mode: 'live_pi_api',
        stage: 'incomplete_check_failed',
        error: `Impossibile verificare incomplete_server_payments (HTTP ${incompleteRes.status}).`,
      },
    };
  }
  const incompleteJson: any = await incompleteRes.json().catch(() => ({}));
  const pendingList = Array.isArray(incompleteJson?.incomplete_server_payments)
    ? incompleteJson.incomplete_server_payments
    : [];
  if (pendingList.length > 0) {
    return {
      status: 409,
      createdRemotePayment: false,
      body: {
        success: false,
        mode: 'live_pi_api',
        stage: 'pending_incomplete_server_payment',
        pendingCount: pendingList.length,
        error:
          'Esiste già un pagamento A2U server pendente non completato su Pi Network. Completarlo o annullarlo prima di crearne uno nuovo.',
      },
    };
  }

  // 2. Crea l'oggetto pagamento A2U su Pi Platform API
  const createRes = await fetch(`${PI_API_BASE}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment: {
        amount: params.netPiSent,
        memo: `HAVE2WANT Rewards Payout (${params.pioneerUsername || params.walletAddress})`,
        metadata: {
          walletAddress: params.walletAddress,
          requestedPi: params.requestedPi,
          feePi: params.feeDeducted,
          pioneerUsername: params.pioneerUsername || '@pioneer',
        },
        uid: params.uid,
      },
    }),
    redirect: 'error',
  });
  const createData: any = await createRes.json().catch(() => ({}));
  if (!createRes.ok || !createData?.identifier) {
    return {
      status: createRes.status || 502,
      createdRemotePayment: false,
      body: {
        success: false,
        mode: 'live_pi_api',
        stage: 'pi_payment_create_failed',
        error: createData?.message || 'Errore creazione pagamento A2U su Pi Platform API',
      },
    };
  }

  const paymentId = String(createData.identifier);
  const destination = String(createData.to_address || params.walletAddress);

  // 3. Firma Ed25519 XDR e trasmissione sulla blockchain Pi (Horizon) con memo = paymentId
  const horizonUrl = getPiHorizonUrl(params.sandbox);
  const networkPassphrase = getPiNetworkPassphrase(params.sandbox);
  const horizonResult = await signer({
    horizonUrl,
    networkPassphrase,
    sourcePublicKey: String(params.env.PI_WALLET_PUBLIC_KEY).trim(),
    walletSeed: String(params.env.PI_WALLET_SEED).trim(),
    destinationAddress: destination,
    amountPi: params.netPiSent,
    memoPaymentId: paymentId,
  });

  if (!horizonResult?.txid) {
    return {
      status: 502,
      createdRemotePayment: true,
      body: {
        success: false,
        mode: 'live_pi_api',
        stage: 'horizon_submit_failed',
        paymentId,
        error: 'Trasmissione blockchain Horizon fallita: nessun txid reale ricevuto.',
      },
    };
  }

  // 4. Completamento ufficiale A2U su Pi Platform API con il txid reale
  const completeRes = await fetch(
    `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`,
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid: horizonResult.txid }),
      redirect: 'error',
    }
  );
  const completeData: any = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    return {
      status: completeRes.status || 502,
      createdRemotePayment: true,
      body: {
        success: false,
        mode: 'live_pi_api',
        stage: 'pi_payment_complete_failed',
        paymentId,
        txHash: horizonResult.txid,
        error: completeData?.message || 'Errore completamento A2U su Pi Platform API',
      },
    };
  }

  return {
    status: 200,
    createdRemotePayment: true,
    body: {
      success: true,
      completed: true,
      mode: 'live_pi_api',
      stage: 'a2u_completed_on_chain',
      paymentId,
      txHash: horizonResult.txid,
      ledger: horizonResult.ledger,
      netPiSent: params.netPiSent,
      feeDeducted: params.feeDeducted,
      walletAddress: destination,
      timestamp: new Date().toISOString(),
    },
  };
}
