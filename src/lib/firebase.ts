import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  doc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Inizializzazione Firebase Applet
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

function createFirestoreInstance(firebaseApp: FirebaseApp): Firestore {
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const isBrowser = typeof window !== 'undefined';
  const hasIndexedDb = isBrowser && typeof window.indexedDB !== 'undefined';

  if (hasIndexedDb) {
    try {
      return initializeFirestore(
        firebaseApp,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        databaseId
      );
    } catch (err) {
      // Fallback sicuro per Pi Browser WebView in modalità restrittiva / privata o ri-inizializzazioni HMR
      console.warn('[Firebase] persistentLocalCache non disponibile, uso fallback sicuro:', err);
      try {
        return initializeFirestore(
          firebaseApp,
          { localCache: memoryLocalCache() },
          databaseId
        );
      } catch {
        return firebaseConfig.firestoreDatabaseId
          ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
          : getFirestore(firebaseApp);
      }
    }
  }

  return firebaseConfig.firestoreDatabaseId
    ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(firebaseApp);
}

// Inizializzazione Firestore con databaseId dedicato e cache persistente sicura per Pi Browser
export const db: Firestore = createFirestoreInstance(app);

export function createFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  options: { silentReturn?: boolean } = {}
): FirestoreErrorInfo {
  const errInfo = createFirestoreErrorInfo(error, operationType, path);
  if (options.silentReturn) {
    console.warn('Firestore Error:', JSON.stringify(errInfo));
    return errInfo;
  }
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithFirebaseCustomToken(customToken: string): Promise<string | null> {
  if (!customToken) return null;
  const credential = await signInWithCustomToken(auth, customToken);
  return credential.user?.uid ?? null;
}

export async function signOutFirebase(): Promise<void> {
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch {
    // ignore sign-out failures in offline preview
  }
}

// Validazione connessione iniziale a Firestore (solo in browser, evita chiamate di rete in Node test runner)
async function testConnection() {
  if (typeof window === 'undefined') return;
  try {
    if (typeof process !== 'undefined' && process.env?.VITEST) return;
  } catch {
    // ignore in pure browser
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore in modalità offline o connessione in corso.');
    }
  }
}
void testConnection();
