import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { HaveWantListing } from '../types';

const LISTINGS_COLLECTION = 'listings';
const SHOPS_COLLECTION = 'shops';
const WALLETS_COLLECTION = 'wallets';

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
        console.warn('Connessione cloud Firestore in ascolto offline/standby:', error.message);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Errore inizializzazione listener Firestore:', err);
    return () => {};
  }
}

/**
 * Salva e pubblica un annuncio sul Cloud Firebase Firestore in tempo reale
 */
export async function publishListingToCloud(listing: HaveWantListing): Promise<boolean> {
  try {
    const docId = listing.id || `h2w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, LISTINGS_COLLECTION, docId);

    const payload = cleanData({
      ...listing,
      id: docId,
      cloudSynced: true,
      updatedAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    });

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('Errore pubblicazione annuncio su Cloud Firestore:', error);
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
    console.warn('Aggiornamento listing su Cloud Firestore saltato/offline:', error);
    return false;
  }
}

/**
 * Persiste e ascolta i negozi / attività sponsorizzate su Cloud Firestore
 */
export async function publishShopToCloud(shop: Record<string, any>): Promise<boolean> {
  if (!shop || !shop.name) return false;
  try {
    const shopId = shop.id || `biz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, SHOPS_COLLECTION, shopId);
    await setDoc(
      docRef,
      cleanData({
        ...shop,
        id: shopId,
        updatedAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('Salvataggio attività su Cloud Firestore saltato/offline:', error);
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
        console.warn('Listener negozi Firestore in standby:', error.message);
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
 * Salva il saldo punti e lo storico transazioni associato all'utente su Firestore
 */
export async function saveWalletToCloud(
  walletId: string,
  walletData: CloudWalletPayload
): Promise<boolean> {
  try {
    const safeId = normalizeWalletId(walletId);
    const docRef = doc(db, WALLETS_COLLECTION, safeId);
    const payload = cleanData({
      walletId: safeId,
      pointsBalance: Math.max(0, Number(walletData.pointsBalance ?? 0)),
      totalPointsEarned: Math.max(0, Number(walletData.totalPointsEarned ?? 0)),
      merchantPiBalance: Math.max(0, Number(walletData.merchantPiBalance ?? 0)),
      pioneerUsername: walletData.pioneerUsername || '@pioneer_user',
      pioneerWalletAddress: walletData.pioneerWalletAddress || '',
      adStreamEnabled: walletData.adStreamEnabled ?? true,
      adCompletedStreak: walletData.adCompletedStreak ?? 0,
      history: Array.isArray(walletData.history) ? walletData.history.slice(0, 100) : [],
      updatedAt: walletData.updatedAt || Date.now(),
      serverTimestamp: serverTimestamp(),
    });
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.warn('Sync wallet Firestore offline/standby:', error);
    return false;
  }
}

/**
 * Carica il saldo wallet dell'utente da Cloud Firestore
 */
export async function loadWalletFromCloud(
  walletId: string
): Promise<CloudWalletPayload | null> {
  try {
    const safeId = normalizeWalletId(walletId);
    const docRef = doc(db, WALLETS_COLLECTION, safeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
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
  } catch {
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
  try {
    const safeId = normalizeWalletId(walletId);
    const docRef = doc(db, WALLETS_COLLECTION, safeId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
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
        console.warn('Wallet Firestore listener standby:', error.message);
      }
    );
  } catch {
    return () => {};
  }
}
