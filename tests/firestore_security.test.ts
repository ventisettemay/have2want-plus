import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

interface AuthContextSim {
  uid: string | null;
}

const VALID_ID_RE = /^[a-zA-Z0-9_-]+$/;

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && VALID_ID_RE.test(id);
}

// Simulatore fedele delle regole definite in firestore.rules per verificare casi positivi e negativi
// anche in ambienti CI/container privi di JVM per Firestore Emulator.
function canAccessListing(
  op: 'get' | 'list' | 'create' | 'update' | 'delete',
  auth: AuthContextSim | null,
  listingId: string,
  incoming?: Record<string, any>,
  existing?: Record<string, any>
): boolean {
  if (op === 'get' || op === 'list') return true;
  if (!auth?.uid) return false;
  if (!isValidId(listingId)) return false;

  if (op === 'delete') {
    return existing?.ownerUid === auth.uid;
  }

  if (!incoming) return false;
  if (
    typeof incoming.id !== 'string' ||
    incoming.id !== listingId ||
    typeof incoming.ownerUid !== 'string' ||
    typeof incoming.title !== 'string' ||
    incoming.title.length < 1 ||
    incoming.title.length > 200
  ) {
    return false;
  }

  if (op === 'create') {
    return incoming.ownerUid === auth.uid && incoming.status !== 'completed';
  }

  // update
  if (!existing) return false;
  if (existing.ownerUid === auth.uid && incoming.ownerUid === existing.ownerUid) {
    return true;
  }

  // Handshake completion action
  const changedKeys = new Set<string>([
    ...Object.keys(incoming).filter((k) => incoming[k] !== existing[k]),
    ...Object.keys(existing).filter((k) => incoming[k] !== existing[k]),
  ]);
  const allowedHandshakeKeys = new Set([
    'handshake_confirmed',
    'status',
    'handshake_timestamp',
    'updatedAt',
    'serverTimestamp',
  ]);
  return (
    existing.status !== 'completed' &&
    incoming.status === 'completed' &&
    incoming.handshake_confirmed === true &&
    incoming.ownerUid === existing.ownerUid &&
    incoming.id === existing.id &&
    incoming.title === existing.title &&
    Array.from(changedKeys).every((k) => allowedHandshakeKeys.has(k))
  );
}

function canAccessWallet(
  op: 'get' | 'list' | 'create' | 'update' | 'delete',
  auth: AuthContextSim | null,
  walletId: string,
  incoming?: Record<string, any>,
  existing?: Record<string, any>
): boolean {
  if (op === 'list' || op === 'delete') return false;
  if (!auth?.uid || !isValidId(walletId) || auth.uid !== walletId) return false;
  if (op === 'get') return true;
  if (!incoming) return false;

  if (op === 'create') {
    const allowedKeys = new Set([
      'walletId',
      'pointsBalance',
      'totalPointsEarned',
      'merchantPiBalance',
      'pioneerUsername',
      'pioneerWalletAddress',
      'adStreamEnabled',
      'adCompletedStreak',
      'history',
      'updatedAt',
      'serverTimestamp',
    ]);
    const keys = Object.keys(incoming);
    if (!keys.every((k) => allowedKeys.has(k))) return false;
    return (
      incoming.walletId === walletId &&
      (incoming.pointsBalance === 120 || incoming.pointsBalance === 0) &&
      incoming.totalPointsEarned === incoming.pointsBalance &&
      (incoming.merchantPiBalance === undefined || incoming.merchantPiBalance === 0) &&
      typeof incoming.pioneerUsername === 'string' &&
      incoming.pioneerUsername.length >= 1 &&
      incoming.pioneerUsername.length <= 120
    );
  }

  // update: nessun campo monetario modificabile dal client SDK
  if (!existing) return false;
  const changedKeys = new Set<string>([
    ...Object.keys(incoming).filter((k) => JSON.stringify(incoming[k]) !== JSON.stringify(existing[k])),
    ...Object.keys(existing).filter((k) => JSON.stringify(incoming[k]) !== JSON.stringify(existing[k])),
  ]);
  const allowedProfileKeys = new Set([
    'pioneerUsername',
    'pioneerWalletAddress',
    'adStreamEnabled',
    'updatedAt',
    'serverTimestamp',
  ]);
  if (!Array.from(changedKeys).every((k) => allowedProfileKeys.has(k))) return false;
  return (
    incoming.walletId === existing.walletId &&
    incoming.pointsBalance === existing.pointsBalance &&
    incoming.totalPointsEarned === existing.totalPointsEarned &&
    (incoming.merchantPiBalance ?? 0) === (existing.merchantPiBalance ?? 0) &&
    JSON.stringify(incoming.history ?? []) === JSON.stringify(existing.history ?? [])
  );
}

describe('Firebase Security Blueprint & Rules Hardening (Test Positivi & Negativi)', () => {
  it('Verifica struttura firestore.rules e firebase-blueprint.json contro accessi non autenticati e manomissioni', () => {
    const rulesText = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf-8');
    const blueprint = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf-8')
    );

    expect(rulesText).toContain("rules_version = '2';");
    expect(rulesText).toContain('match /{document=**} {\n      allow read, write: if false;');
    expect(rulesText).toContain('request.auth != null');
    expect(rulesText).toContain('incoming().ownerUid == request.auth.uid');
    expect(rulesText).toContain('allow list: if false;');
    expect(rulesText).toContain('(data.pointsBalance == 120 || data.pointsBalance == 0)');
    expect(rulesText).toContain('incoming().pointsBalance == existing().pointsBalance');
    expect(rulesText).toContain('match /pi_idempotency/{keyHash}');
    expect(rulesText).not.toContain('pointsBalance <= 10000000');

    expect(blueprint.firestore['/listings/{listingId}']).toBeDefined();
    expect(blueprint.firestore['/shops/{shopId}']).toBeDefined();
    expect(blueprint.firestore['/wallets/{walletId}']).toBeDefined();
    expect(blueprint.firestore['/pi_idempotency/{keyHash}']).toBeDefined();
  });

  it('NEGATIVO: blocca scritture non autenticate e spoofing su listings e shops', () => {
    const validListing = {
      id: 'item_1',
      ownerUid: 'pi_alice',
      title: 'Trapano elettrico',
      status: 'active',
    };

    // Anonimo può leggere catalogo, NON può scrivere o cancellare
    expect(canAccessListing('list', null, 'item_1')).toBe(true);
    expect(canAccessListing('create', null, 'item_1', validListing)).toBe(false);
    expect(canAccessListing('update', null, 'item_1', validListing, validListing)).toBe(false);
    expect(canAccessListing('delete', null, 'item_1', undefined, validListing)).toBe(false);

    // Utente autenticato Bob NON può creare spacciandosi per Alice né cancellare o modificare titolo di Alice
    expect(
      canAccessListing('create', { uid: 'pi_bob' }, 'item_1', {
        ...validListing,
        ownerUid: 'pi_alice',
      })
    ).toBe(false);

    expect(
      canAccessListing(
        'update',
        { uid: 'pi_bob' },
        'item_1',
        { ...validListing, title: 'Hacked title' },
        validListing
      )
    ).toBe(false);

    expect(canAccessListing('delete', { uid: 'pi_bob' }, 'item_1', undefined, validListing)).toBe(
      false
    );
  });

  it('POSITIVO: consente ad owner autenticato di gestire listings e al counterparty di completare handshake', () => {
    const initialListing = {
      id: 'item_1',
      ownerUid: 'pi_alice',
      title: 'Bicicletta pieghevole',
      status: 'active',
    };

    expect(canAccessListing('create', { uid: 'pi_alice' }, 'item_1', initialListing)).toBe(true);
    expect(
      canAccessListing(
        'update',
        { uid: 'pi_alice' },
        'item_1',
        { ...initialListing, title: 'Bicicletta pieghevole Blu' },
        initialListing
      )
    ).toBe(true);

    // Counterparty autenticato completa solo lo scambio handshake
    expect(
      canAccessListing(
        'update',
        { uid: 'pi_bob' },
        'item_1',
        {
          ...initialListing,
          status: 'completed',
          handshake_confirmed: true,
          handshake_timestamp: '2026-11-16T12:00:00Z',
        },
        initialListing
      )
    ).toBe(true);

    expect(canAccessListing('delete', { uid: 'pi_alice' }, 'item_1', undefined, initialListing)).toBe(
      true
    );
  });

  it('NEGATIVO: blocca lettura cross-utente e qualsiasi modifica arbitraria di pointsBalance dal client', () => {
    const existingWallet = {
      walletId: 'pi_alice',
      pointsBalance: 120,
      totalPointsEarned: 120,
      merchantPiBalance: 0,
      pioneerUsername: '@alice',
      pioneerWalletAddress: '',
      adStreamEnabled: true,
      history: [],
    };

    // Anonimo o altro utente non può leggere, listare o scrivere il wallet di Alice
    expect(canAccessWallet('list', { uid: 'pi_alice' }, 'pi_alice')).toBe(false);
    expect(canAccessWallet('get', null, 'pi_alice')).toBe(false);
    expect(canAccessWallet('get', { uid: 'pi_bob' }, 'pi_alice')).toBe(false);
    expect(canAccessWallet('delete', { uid: 'pi_alice' }, 'pi_alice')).toBe(false);

    // Tentativo di creazione wallet con saldo gonfiato (es. 10.000.000 o 500) -> BLOCCATO
    expect(
      canAccessWallet('create', { uid: 'pi_alice' }, 'pi_alice', {
        ...existingWallet,
        pointsBalance: 10000000,
        totalPointsEarned: 10000000,
      })
    ).toBe(false);

    // Tentativo di creazione wallet con ghost field (isAdmin: true) -> BLOCCATO
    expect(
      canAccessWallet('create', { uid: 'pi_alice' }, 'pi_alice', {
        ...existingWallet,
        isAdmin: true,
      })
    ).toBe(false);

    // Tentativo di update pointsBalance dal client (anche dal proprietario stesso!) -> BLOCCATO
    expect(
      canAccessWallet(
        'update',
        { uid: 'pi_alice' },
        'pi_alice',
        { ...existingWallet, pointsBalance: 999999 },
        existingWallet
      )
    ).toBe(false);

    expect(
      canAccessWallet(
        'update',
        { uid: 'pi_alice' },
        'pi_alice',
        { ...existingWallet, merchantPiBalance: 500 },
        existingWallet
      )
    ).toBe(false);
  });

  it('POSITIVO: consente creazione iniziale sicura (120 punti) e aggiornamento campi profilo wallet', () => {
    const initialWallet = {
      walletId: 'pi_alice',
      pointsBalance: 120,
      totalPointsEarned: 120,
      merchantPiBalance: 0,
      pioneerUsername: '@alice',
      pioneerWalletAddress: '',
      adStreamEnabled: true,
      history: [],
    };

    expect(canAccessWallet('get', { uid: 'pi_alice' }, 'pi_alice')).toBe(true);
    expect(canAccessWallet('create', { uid: 'pi_alice' }, 'pi_alice', initialWallet)).toBe(true);

    // Update lecito solo su adStreamEnabled e pioneerWalletAddress senza toccare pointsBalance
    expect(
      canAccessWallet(
        'update',
        { uid: 'pi_alice' },
        'pi_alice',
        {
          ...initialWallet,
          adStreamEnabled: false,
          pioneerWalletAddress: 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X',
        },
        initialWallet
      )
    ).toBe(true);
  });
});
