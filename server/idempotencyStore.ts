// Persistenza condivisa e atomica per chiavi di idempotenza, pagamenti completati e txid usati.
// Compatibile con l'architettura a costo zero:
//  1) Cloudflare D1 free-tier SQLite (`env.DB`) -> atomico su tutto il network Cloudflare
//  2) Firebase Spark Firestore REST (`FIREBASE_SERVICE_ACCOUNT_JSON`) -> atomico cross-isolate e condiviso con server.ts
//  3) File JSON locale (`.runtime-idempotency.json` per server.ts) -> persistente su riavvii locali
//  4) Edge Cache (`caches.default`) + fallback in-memory -> persistenza per singolo PoP Cloudflare

import {
  getGoogleDatastoreAccessToken,
  resolveFirebaseServiceAccount,
  type FirebaseTokenEnv,
} from './firebaseAuthToken';

export type IdempotencyScope =
  | 'd1_global'
  | 'firestore_global'
  | 'local_file'
  | 'edge_cache_pop'
  | 'in_memory';

export interface D1StatementLike {
  bind: (...values: unknown[]) => {
    run: () => Promise<{ success?: boolean; meta?: { changes?: number } }>;
    first: <T = Record<string, unknown>>() => Promise<T | null>;
  };
}

export interface D1DatabaseLike {
  prepare: (query: string) => D1StatementLike;
}

export interface IdempotencyEnv extends FirebaseTokenEnv {
  DB?: D1DatabaseLike;
}

export interface ClaimResult {
  acquired: boolean;
  scope: IdempotencyScope;
}

const MAX_IN_MEMORY = 10000;
const memoryLocks = new Map<string, string>();
let d1Initialized = false;

function rememberInMemory(key: string, value: string) {
  if (memoryLocks.size >= MAX_IN_MEMORY) {
    const oldest = memoryLocks.keys().next().value;
    if (oldest !== undefined) memoryLocks.delete(oldest);
  }
  memoryLocks.set(key, value);
}

export function resetMemoryIdempotencyForTests() {
  memoryLocks.clear();
  d1Initialized = false;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getEdgeCache(): Cache | null {
  try {
    if (typeof caches !== 'undefined' && (caches as any)?.default) {
      return (caches as any).default as Cache;
    }
  } catch {
    // non disponibile fuori da Cloudflare Workers
  }
  return null;
}

async function ensureD1Table(db: D1DatabaseLike): Promise<void> {
  if (d1Initialized) return;
  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS pi_idempotency (lock_key TEXT PRIMARY KEY, value TEXT NOT NULL, created_at TEXT NOT NULL)'
    )
    .bind()
    .run();
  d1Initialized = true;
}

export function resolveIdempotencyScope(env: IdempotencyEnv = {}): IdempotencyScope {
  if (env?.DB) return 'd1_global';
  if (resolveFirebaseServiceAccount(env)) return 'firestore_global';
  if (typeof process !== 'undefined' && process.versions?.node && typeof caches === 'undefined') {
    return 'local_file';
  }
  if (getEdgeCache()) return 'edge_cache_pop';
  return 'in_memory';
}

export interface LocalFilePersistenceHooks {
  hasKey: (compositeKey: string) => boolean;
  setKey: (compositeKey: string, value: string) => void;
  deleteKey: (compositeKey: string) => void;
}

/**
 * Controlla se una chiave è già registrata senza bloccarla (es. pre-check /api/pi/approve).
 */
export async function hasIdempotencyLock(
  compositeKey: string,
  env: IdempotencyEnv = {},
  localHooks?: LocalFilePersistenceHooks
): Promise<boolean> {
  if (memoryLocks.has(compositeKey)) return true;

  if (env?.DB) {
    try {
      await ensureD1Table(env.DB);
      const row = await env.DB.prepare('SELECT lock_key FROM pi_idempotency WHERE lock_key = ?')
        .bind(compositeKey)
        .first<{ lock_key: string }>();
      if (row?.lock_key) return true;
    } catch {
      // fall through
    }
  }

  const serviceAccount = resolveFirebaseServiceAccount(env);
  if (serviceAccount) {
    try {
      const accessToken = await getGoogleDatastoreAccessToken(serviceAccount);
      const docId = await sha256Hex(compositeKey);
      const databaseId = serviceAccount.database_id || '(default)';
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        serviceAccount.project_id
      )}/databases/${encodeURIComponent(databaseId)}/documents/pi_idempotency/${docId}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: 'error',
      });
      if (res.ok) return true;
    } catch {
      // fall through
    }
  }

  if (localHooks?.hasKey(compositeKey)) return true;

  const cache = getEdgeCache();
  if (cache) {
    try {
      const docId = await sha256Hex(compositeKey);
      const hit = await cache.match(new Request(`https://idempotency.urbano3d.internal/${docId}`));
      if (hit) return true;
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Tenta di acquisire un lock atomico per prevenire doppi pagamenti / doppi prelievi anche tra isolate diversi.
 */
export async function acquireIdempotencyLock(
  compositeKey: string,
  value: string,
  env: IdempotencyEnv = {},
  localHooks?: LocalFilePersistenceHooks
): Promise<ClaimResult> {
  if (memoryLocks.has(compositeKey)) {
    return { acquired: false, scope: resolveIdempotencyScope(env) };
  }

  // 1. Cloudflare D1 (globale edge atomico tramite PRIMARY KEY)
  if (env?.DB) {
    await ensureD1Table(env.DB);
    const res = await env.DB.prepare(
      'INSERT OR IGNORE INTO pi_idempotency (lock_key, value, created_at) VALUES (?, ?, ?)'
    )
      .bind(compositeKey, value, new Date().toISOString())
      .run();
    const changes = Number(res?.meta?.changes ?? 0);
    if (changes === 0) {
      return { acquired: false, scope: 'd1_global' };
    }
    rememberInMemory(compositeKey, value);
    return { acquired: true, scope: 'd1_global' };
  }

  // 2. Firebase Spark Firestore REST API (globale atomico tramite createDocument con documentId)
  const serviceAccount = resolveFirebaseServiceAccount(env);
  if (serviceAccount) {
    const accessToken = await getGoogleDatastoreAccessToken(serviceAccount);
    const docId = await sha256Hex(compositeKey);
    const databaseId = serviceAccount.database_id || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      serviceAccount.project_id
    )}/databases/${encodeURIComponent(databaseId)}/documents/pi_idempotency?documentId=${docId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          key: { stringValue: compositeKey.slice(0, 160) },
          value: { stringValue: value.slice(0, 256) },
          createdAt: { stringValue: new Date().toISOString() },
        },
      }),
      redirect: 'error',
    });
    if (res.status === 409) {
      return { acquired: false, scope: 'firestore_global' };
    }
    if (res.ok) {
      rememberInMemory(compositeKey, value);
      return { acquired: true, scope: 'firestore_global' };
    }
    // Se errore transitorio non-409, fallback controllato
  }

  // 3. Persistenza su file locale (Node.js server.ts)
  if (localHooks) {
    if (localHooks.hasKey(compositeKey)) {
      return { acquired: false, scope: 'local_file' };
    }
    localHooks.setKey(compositeKey, value);
    rememberInMemory(compositeKey, value);
    return { acquired: true, scope: 'local_file' };
  }

  // 4. Cloudflare Edge Cache API (per-PoP)
  const cache = getEdgeCache();
  if (cache) {
    const docId = await sha256Hex(compositeKey);
    const cacheReq = new Request(`https://idempotency.urbano3d.internal/${docId}`);
    const existing = await cache.match(cacheReq);
    if (existing) {
      return { acquired: false, scope: 'edge_cache_pop' };
    }
    await cache.put(
      cacheReq,
      new Response(JSON.stringify({ key: compositeKey, value }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    );
    rememberInMemory(compositeKey, value);
    return { acquired: true, scope: 'edge_cache_pop' };
  }

  // 5. Fallback in-memory limitato
  rememberInMemory(compositeKey, value);
  return { acquired: true, scope: 'in_memory' };
}

/**
 * Rilascia un lock acquisito in-flight se l'operazione è fallita prima di creare pagamenti remoti (400/401/403/501).
 */
export async function releaseIdempotencyLock(
  compositeKey: string,
  env: IdempotencyEnv = {},
  localHooks?: LocalFilePersistenceHooks
): Promise<void> {
  memoryLocks.delete(compositeKey);

  if (env?.DB) {
    try {
      await ensureD1Table(env.DB);
      await env.DB.prepare('DELETE FROM pi_idempotency WHERE lock_key = ?').bind(compositeKey).run();
    } catch {
      // ignore cleanup errors
    }
  }

  const serviceAccount = resolveFirebaseServiceAccount(env);
  if (serviceAccount) {
    try {
      const accessToken = await getGoogleDatastoreAccessToken(serviceAccount);
      const docId = await sha256Hex(compositeKey);
      const databaseId = serviceAccount.database_id || '(default)';
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        serviceAccount.project_id
      )}/databases/${encodeURIComponent(databaseId)}/documents/pi_idempotency/${docId}`;
      await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: 'error',
      });
    } catch {
      // ignore cleanup errors
    }
  }

  if (localHooks) {
    localHooks.deleteKey(compositeKey);
  }

  const cache = getEdgeCache();
  if (cache) {
    try {
      const docId = await sha256Hex(compositeKey);
      await cache.delete(new Request(`https://idempotency.urbano3d.internal/${docId}`));
    } catch {
      // ignore
    }
  }
}
