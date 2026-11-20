import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  limit,
  orderBy,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { HaveWantListing } from '../types';

const LISTINGS_COLLECTION = 'listings';
const SHOPS_COLLECTION = 'shops';
const WALLETS_COLLECTION = 'wallets';
const GUIDES_COLLECTION = 'guides';
const ABUSE_REPORTS_COLLECTION = 'abuse_reports';

const knownExistingCloudWallets = new Set<string>();

// Helper per rimuovere campi undefined (Firestore non accetta valori undefined)
function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanData);

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanData(val);
    }
  }
  return cleaned;
}

/**
 * Normalizza un ID utente/username per usarlo in sicurezza come ID documento Firestore
 */
export function normalizeWalletId(rawId?: string | null): string {
  const cleaned = (rawId || 'pioneer_default')
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 64);
  return cleaned || 'pioneer_default';
}

/**
 * Ascolta in tempo reale tutti gli annunci pubblicati sul Cloud Firestore
 */
export function subscribeToCloudListings(
  onUpdate: (cloudListings: HaveWantListing[]) => void
): () => void {
  try {
    const q = query(collection(db, LISTINGS_COLLECTION), limit(150));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: HaveWantListing[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.title) {
            items.push({
              id: docSnap.id,
              ...data,
            } as HaveWantListing);
          }
        });
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, LISTINGS_COLLECTION, {
          silentReturn: true,
        });
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Errore inizializzazione listener Firestore:', err);
    return () => {};
  }
}

/**
 * Salva e pubblica un annuncio sul Cloud Firebase Firestore in tempo reale.
 * Richiede autenticazione Firebase (`request.auth.uid`) lato firestore.rules.
 */
export async function publishListingToCloud(listing: HaveWantListing): Promise<boolean> {
  const authenticatedUid = auth.currentUser?.uid;
  const docId = listing.id || `h2w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `${LISTINGS_COLLECTION}/${docId}`;

  if (!authenticatedUid) {
    console.warn('[Firestore] Utente non autenticato su Firebase Auth: annuncio salvato solo in locale.');
    return false;
  }

  try {
    const docRef = doc(db, LISTINGS_COLLECTION, docId);
    const isDiscrete = Boolean((listing as any).privacy_mode_active || (listing as any).is_discrete_mode);
    const sanitized: Record<string, any> = {
      ...listing,
      id: docId,
      ownerUid: authenticatedUid,
      cloudSynced: true,
      updatedAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    };
    if (isDiscrete) {
      sanitized.lat = (listing as any).displayLat ?? listing.lat;
      sanitized.lng = (listing as any).displayLng ?? listing.lng;
      delete sanitized.exact_lat;
      delete sanitized.exact_lng;
    }

    const payload = cleanData(sanitized);
    if (isDiscrete) {
      payload.exact_lat = deleteField();
      payload.exact_lng = deleteField();
    }

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, { silentReturn: true });
    return false;
  }
}

/**
 * Aggiorna campi parziali di un annuncio su Firestore (es. handshake, visibilità, sospensione)
 */
export async function updateListingInCloud(
  listingId: string,
  updates: Record<string, any>
): Promise<boolean> {
  if (!listingId) return false;
  if (!auth.currentUser?.uid) {
    return false;
  }
  const path = `${LISTINGS_COLLECTION}/${listingId}`;
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, listingId);
    const payload = cleanData({
      ...updates,
      updatedAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    });
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path, { silentReturn: true });
    return false;
  }
}

/**
 * Persiste e ascolta i negozi / attività sponsorizzate su Cloud Firestore
 */
export async function publishShopToCloud(shop: Record<string, any>): Promise<boolean> {
  if (!shop || !shop.name) return false;
  const authenticatedUid = auth.currentUser?.uid;
  if (!authenticatedUid) {
    console.warn('[Firestore] Utente non autenticato su Firebase Auth: negozio salvato solo in locale.');
    return false;
  }
  const shopId = shop.id || `biz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `${SHOPS_COLLECTION}/${shopId}`;
  try {
    const docRef = doc(db, SHOPS_COLLECTION, shopId);
    await setDoc(
      docRef,
      cleanData({
        ...shop,
        id: shopId,
        ownerUid: authenticatedUid,
        updatedAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, { silentReturn: true });
    return false;
  }
}

export function subscribeToCloudShops(
  onUpdate: (shops: any[]) => void
): () => void {
  try {
    const q = query(collection(db, SHOPS_COLLECTION), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.name) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, SHOPS_COLLECTION, { silentReturn: true });
      }
    );
  } catch {
    return () => {};
  }
}

export interface CloudWalletPayload {
  walletId: string;
  pointsBalance: number;
  totalPointsEarned: number;
  merchantPiBalance?: number;
  pioneerUsername: string;
  pioneerWalletAddress?: string;
  adStreamEnabled?: boolean;
  adCompletedStreak?: number;
  history: any[];
  updatedAt: number;
}

/**
 * Sincronizza in sicurezza il profilo wallet dell'utente autenticato su Cloud Firestore:
 * - In creazione iniziale rispetta il bonus iniziale fisso (120 o 0) imposto dalle regole.
 * - In aggiornamento successivo aggiorna solo metadati di profilo (pioneerUsername, wallet address, adStreamEnabled)
 *   senza tentare modifiche arbitrarie ai saldi monetari dal client SDK.
 */
export async function saveWalletToCloud(
  walletId: string,
  walletData: CloudWalletPayload
): Promise<boolean> {
  const safeId = normalizeWalletId(walletId);
  const authenticatedUid = auth.currentUser?.uid;
  if (!authenticatedUid || authenticatedUid !== safeId) {
    return false;
  }

  const path = `${WALLETS_COLLECTION}/${safeId}`;
  try {
    const docRef = doc(db, WALLETS_COLLECTION, safeId);
    let existsRemotely = knownExistingCloudWallets.has(safeId);

    if (!existsRemotely) {
      const snap = await getDoc(docRef);
      existsRemotely = snap.exists();
      if (existsRemotely) knownExistingCloudWallets.add(safeId);
    }

    if (existsRemotely) {
      await updateDoc(
        docRef,
        cleanData({
          pioneerUsername: String(walletData.pioneerUsername || '@pioneer_user').slice(0, 120),
          pioneerWalletAddress: String(walletData.pioneerWalletAddress || '').slice(0, 128),
          adStreamEnabled: Boolean(walletData.adStreamEnabled ?? true),
          updatedAt: walletData.updatedAt || Date.now(),
          serverTimestamp: serverTimestamp(),
        })
      );
    } else {
      const initialPoints = Number(walletData.pointsBalance) === 0 ? 0 : 120;
      const initialPayload = cleanData({
        walletId: safeId,
        pointsBalance: initialPoints,
        totalPointsEarned: initialPoints,
        merchantPiBalance: 0,
        pioneerUsername: String(walletData.pioneerUsername || '@pioneer_user').slice(0, 120),
        pioneerWalletAddress: String(walletData.pioneerWalletAddress || '').slice(0, 128),
        adStreamEnabled: Boolean(walletData.adStreamEnabled ?? true),
        adCompletedStreak: 0,
        history: Array.isArray(walletData.history) ? walletData.history.slice(0, 5) : [],
        updatedAt: walletData.updatedAt || Date.now(),
        serverTimestamp: serverTimestamp(),
      });
      await setDoc(docRef, initialPayload);
      knownExistingCloudWallets.add(safeId);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, { silentReturn: true });
    return false;
  }
}

/**
 * Carica il saldo wallet dell'utente autenticato da Cloud Firestore
 */
export async function loadWalletFromCloud(
  walletId: string
): Promise<CloudWalletPayload | null> {
  const safeId = normalizeWalletId(walletId);
  if (!auth.currentUser?.uid || auth.currentUser.uid !== safeId) {
    return null;
  }
  const path = `${WALLETS_COLLECTION}/${safeId}`;
  try {
    const docRef = doc(db, WALLETS_COLLECTION, safeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    knownExistingCloudWallets.add(safeId);
    const data = snap.data();
    return {
      walletId: safeId,
      pointsBalance: Number(data.pointsBalance ?? 0),
      totalPointsEarned: Number(data.totalPointsEarned ?? 0),
      merchantPiBalance: Number(data.merchantPiBalance ?? 0),
      pioneerUsername: data.pioneerUsername || '@pioneer_user',
      pioneerWalletAddress: data.pioneerWalletAddress || '',
      adStreamEnabled: data.adStreamEnabled ?? true,
      adCompletedStreak: Number(data.adCompletedStreak ?? 0),
      history: Array.isArray(data.history) ? data.history : [],
      updatedAt: Number(data.updatedAt ?? 0),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path, { silentReturn: true });
    return null;
  }
}

/**
 * Ascolta gli aggiornamenti remoti del wallet su Firestore per la sincronizzazione multi-dispositivo
 */
export function subscribeToWalletCloud(
  walletId: string,
  onUpdate: (wallet: CloudWalletPayload) => void
): () => void {
  const safeId = normalizeWalletId(walletId);
  if (!auth.currentUser?.uid || auth.currentUser.uid !== safeId) {
    return () => {};
  }
  const path = `${WALLETS_COLLECTION}/${safeId}`;
  try {
    const docRef = doc(db, WALLETS_COLLECTION, safeId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        knownExistingCloudWallets.add(safeId);
        const data = snap.data();
        onUpdate({
          walletId: safeId,
          pointsBalance: Number(data.pointsBalance ?? 0),
          totalPointsEarned: Number(data.totalPointsEarned ?? 0),
          merchantPiBalance: Number(data.merchantPiBalance ?? 0),
          pioneerUsername: data.pioneerUsername || '@pioneer_user',
          pioneerWalletAddress: data.pioneerWalletAddress || '',
          adStreamEnabled: data.adStreamEnabled ?? true,
          adCompletedStreak: Number(data.adCompletedStreak ?? 0),
          history: Array.isArray(data.history) ? data.history : [],
          updatedAt: Number(data.updatedAt ?? 0),
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path, { silentReturn: true });
      }
    );
  } catch {
    return () => {};
  }
}

export async function submitHandshakeProposalToCloud(
  listingId: string,
  proposal: {
    listingId: string;
    ownerUid?: string;
    buyerUsername: string;
    note?: string;
    status?: 'pending' | 'completed';
  }
): Promise<{ ok: boolean; error?: string }> {
  const authenticatedUid = auth.currentUser?.uid;
  if (!authenticatedUid) {
    return { ok: false, error: 'Autenticazione Pi / Firebase richiesta per registrare la stretta di mano.' };
  }
  const safeListingId = String(listingId || '').trim();
  if (!safeListingId) return { ok: false, error: 'ID annuncio mancante.' };

  const handshakePath = `${LISTINGS_COLLECTION}/${safeListingId}/handshakes/${authenticatedUid}`;
  try {
    let resolvedOwnerUid = String(proposal.ownerUid || '').trim();
    if (!resolvedOwnerUid) {
      const parentSnap = await getDoc(doc(db, LISTINGS_COLLECTION, safeListingId));
      if (parentSnap.exists()) {
        resolvedOwnerUid = String(parentSnap.data()?.ownerUid || '').trim();
      }
    }
    if (!resolvedOwnerUid) {
      return { ok: false, error: 'Proprietario annuncio non trovato su Firestore.' };
    }
    if (resolvedOwnerUid === authenticatedUid) {
      return { ok: false, error: 'Non puoi inviare una proposta di ritiro al tuo stesso annuncio.' };
    }

    await setDoc(
      doc(db, LISTINGS_COLLECTION, safeListingId, 'handshakes', authenticatedUid),
      cleanData({
        id: authenticatedUid,
        listingId: safeListingId,
        proposerUid: authenticatedUid,
        buyerUid: authenticatedUid,
        ownerUid: resolvedOwnerUid,
        buyerUsername: String(proposal.buyerUsername || '@pioneer').slice(0, 64),
        status: proposal.status || 'pending',
        note: String(proposal.note || '').slice(0, 300),
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      }),
      { merge: true }
    );
    return { ok: true };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, handshakePath, { silentReturn: true });
    return { ok: false, error: error?.message || 'Errore scrittura handshake su Firestore.' };
  }
}

export async function saveGuideToCloud(guide: {
  id?: string;
  title: string;
  category: string;
  content?: string;
  summary?: string;
  body?: string;
  authorName?: string;
  city?: string;
  country?: string;
}): Promise<boolean> {
  const authenticatedUid = auth.currentUser?.uid;
  const safeTitle = String(guide?.title || '').trim().slice(0, 200);
  if (!authenticatedUid || !safeTitle) return false;
  const safeContent = String(guide.content || guide.body || guide.summary || safeTitle)
    .trim()
    .slice(0, 12000);
  if (!safeContent) return false;

  const docId = guide.id || `guide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `${GUIDES_COLLECTION}/${docId}`;
  try {
    await setDoc(
      doc(db, GUIDES_COLLECTION, docId),
      cleanData({
        ...guide,
        id: docId,
        authorUid: authenticatedUid,
        title: safeTitle,
        content: safeContent,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, { silentReturn: true });
    return false;
  }
}

export function subscribeToCloudGuides(onUpdate: (guides: any[]) => void): () => void {
  try {
    const q = query(collection(db, GUIDES_COLLECTION), orderBy('createdAt', 'desc'), limit(80));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d?.title) items.push({ id: docSnap.id, ...d });
        });
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, GUIDES_COLLECTION, { silentReturn: true });
      }
    );
  } catch {
    return () => {};
  }
}

export async function submitAbuseReportToCloud(report: {
  targetId: string;
  listingId?: string;
  targetType: 'listing' | 'shop' | 'user';
  reason: string;
  details?: string;
}): Promise<boolean> {
  const authenticatedUid = auth.currentUser?.uid;
  const safeListingId = String(report?.listingId || report?.targetId || '').trim().slice(0, 128);
  const safeReason = String(report?.reason || '').trim().slice(0, 1000);
  if (!authenticatedUid || !safeListingId || safeReason.length < 3) return false;
  const docId = `rep_${Date.now()}_${authenticatedUid.slice(0, 8)}`;
  const path = `${ABUSE_REPORTS_COLLECTION}/${docId}`;
  try {
    await setDoc(
      doc(db, ABUSE_REPORTS_COLLECTION, docId),
      cleanData({
        ...report,
        id: docId,
        listingId: safeListingId,
        reason: safeReason,
        reporterUid: authenticatedUid,
        status: 'open',
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      })
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path, { silentReturn: true });
    return false;
  }
}
