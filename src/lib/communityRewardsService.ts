/**
 * communityRewardsService.ts
 * Fonte unica di verità (Single Source of Truth) per:
 * - Saldo Punti Comunitari (pointsBalance, 1000 Punti = 1.0 π)
 * - Saldo Pi Esercenti/Abbonamenti (merchantPiBalance)
 * - Persistenza cross-device su Cloud Firebase Firestore + cache locale localStorage
 * - Conversione e Prelievo su Pi Network tramite backend Express (/api/pi/withdraw)
 */

import {
  loadWalletFromCloud,
  normalizeWalletId,
  saveWalletToCloud,
  subscribeToWalletCloud,
} from './firestoreService';

export interface RewardTransaction {
  id: string;
  type: 'EARN_REAL_LISTING' | 'EARN_AD_VIEW' | 'EARN_COMMUNITY_ENGAGE' | 'WITHDRAW_PI' | 'AD_IMPRESSION_VERIFIED';
  description: string;
  pointsDelta: number;
  piEquivalent?: number;
  timestamp: number;
  txHash?: string;
  status: 'completed' | 'pending' | 'rejected';
  campaignId?: string;
  impressionId?: string;
  // Watch-to-Unlock: token azione monouso rilasciato dopo visione certificata
  actionUnlockToken?: string;
  actionType?: string; // 'UNLOCK_FEATURE' | 'FREE_POST' | 'STUDIO_EXPORT' | ...
  expiresAt?: number;  // scadenza token (ms)
}

export interface PioneerRewardsState {
  walletId: string;
  pointsBalance: number;
  totalPointsEarned: number;
  pioneerUsername: string;
  pioneerWalletAddress: string;
  merchantPiBalance: number;
  adStreamEnabled: boolean;
  adCompletedStreak: number;
  updatedAt: number;
  history: RewardTransaction[];
}

export const REWARDS_CONFIG = {
  POINTS_PER_PI: 1000,
  MIN_WITHDRAWAL_PI: 0.50,
  MIN_WITHDRAWAL_POINTS: 500,
  BLOCKCHAIN_TRANSACTION_FEE_PI: 0.01,
  EARN_RATES: {
    QUICK_SPONSOR_AD: 4,
    BANNER_CLICK: 2,
    COMMUNITY_SHARING: 5,
    REAL_LISTING_BASIC: 60,
    REAL_LISTING_VERIFIED: 120,
    REAL_EXCHANGE_CONCLUDED: 250,
    AD_IMPRESSION_VERIFIED: 5,
  },
};

const STORAGE_KEY = 'have2want_pioneer_rewards_v1';
const WALLET_USER_KEY = 'have2want_active_wallet_id';

type RewardsListener = (state: PioneerRewardsState) => void;
const listeners = new Set<RewardsListener>();
let cloudUnsubscribe: (() => void) | null = null;
let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;
let activeWalletIdCache: string | null = null;

function isTestEnvironment(): boolean {
  try {
    return Boolean(
      typeof process !== 'undefined' &&
        (process.env.VITEST || process.env.NODE_ENV === 'test')
    );
  } catch {
    return false;
  }
}

function getActiveWalletId(): string {
  if (activeWalletIdCache) return activeWalletIdCache;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(WALLET_USER_KEY);
    if (saved) {
      activeWalletIdCache = normalizeWalletId(saved);
      return activeWalletIdCache;
    }
  }
  return 'user_pioneer_001';
}

function getInitialRewardsState(walletId = getActiveWalletId()): PioneerRewardsState {
  return {
    walletId: normalizeWalletId(walletId),
    pointsBalance: 120,
    totalPointsEarned: 120,
    pioneerUsername: '@pioniere_001',
    pioneerWalletAddress: '',
    merchantPiBalance: 0,
    adStreamEnabled: true,
    adCompletedStreak: 0,
    updatedAt: Date.now(),
    history: [
      {
        id: 'tx_init_welcome',
        type: 'EARN_COMMUNITY_ENGAGE',
        description: 'Bonus di benvenuto pioniere HAVE2WANT',
        pointsDelta: 120,
        piEquivalent: 0.12,
        timestamp: Date.now() - 3600000 * 24,
        status: 'completed',
      },
    ],
  };
}

function normalizeState(raw: Partial<PioneerRewardsState>): PioneerRewardsState {
  const base = getInitialRewardsState(raw.walletId || getActiveWalletId());
  return {
    walletId: normalizeWalletId(raw.walletId || base.walletId),
    pointsBalance: typeof raw.pointsBalance === 'number' && !Number.isNaN(raw.pointsBalance) ? Math.max(0, raw.pointsBalance) : base.pointsBalance,
    totalPointsEarned: typeof raw.totalPointsEarned === 'number' && !Number.isNaN(raw.totalPointsEarned) ? Math.max(0, raw.totalPointsEarned) : base.totalPointsEarned,
    pioneerUsername: raw.pioneerUsername || base.pioneerUsername,
    pioneerWalletAddress: raw.pioneerWalletAddress || '',
    merchantPiBalance: typeof raw.merchantPiBalance === 'number' && !Number.isNaN(raw.merchantPiBalance) ? Math.max(0, raw.merchantPiBalance) : 0,
    adStreamEnabled: typeof raw.adStreamEnabled === 'boolean' ? raw.adStreamEnabled : true,
    adCompletedStreak: typeof raw.adCompletedStreak === 'number' ? raw.adCompletedStreak : 0,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    history: Array.isArray(raw.history) ? raw.history : base.history,
  };
}

function notifyListeners(state: PioneerRewardsState) {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      // ignore subscriber render warnings
    }
  });
}

function scheduleCloudSync(state: PioneerRewardsState) {
  if (typeof window === 'undefined' || isTestEnvironment()) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    saveWalletToCloud(state.walletId, {
      walletId: state.walletId,
      pointsBalance: state.pointsBalance,
      totalPointsEarned: state.totalPointsEarned,
      merchantPiBalance: state.merchantPiBalance,
      pioneerUsername: state.pioneerUsername,
      pioneerWalletAddress: state.pioneerWalletAddress,
      adStreamEnabled: state.adStreamEnabled,
      adCompletedStreak: state.adCompletedStreak,
      history: state.history,
      updatedAt: state.updatedAt,
    }).catch(() => {});
  }, 250);
}

export function subscribeRewardsState(listener: RewardsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPioneerRewardsState(): PioneerRewardsState {
  if (typeof window === 'undefined') {
    return getInitialRewardsState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeState(JSON.parse(raw));
    }
  } catch (err) {
    console.warn('Errore lettura rewards state:', err);
  }

  const initial = getInitialRewardsState();
  savePioneerRewardsState(initial);
  return initial;
}

export function savePioneerRewardsState(
  state: PioneerRewardsState,
  options: { skipCloudSync?: boolean } = {}
): void {
  const normalized = normalizeState({
    ...state,
    updatedAt: options.skipCloudSync ? state.updatedAt : Date.now(),
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (err) {
      console.error('Errore salvataggio rewards state:', err);
    }
  }

  notifyListeners(normalized);

  if (!options.skipCloudSync) {
    scheduleCloudSync(normalized);
  }
}

/**
 * Collega il portafoglio locale all'utente attivo e sincronizza i punti con Cloud Firestore
 */
export async function setActiveWalletUser(
  userId?: string | null,
  username?: string | null
): Promise<PioneerRewardsState> {
  const walletId = normalizeWalletId(userId || username || getActiveWalletId());
  activeWalletIdCache = walletId;

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(WALLET_USER_KEY, walletId);
  }

  const currentLocal = getPioneerRewardsState();
  const updatedLocal = normalizeState({
    ...currentLocal,
    walletId,
    pioneerUsername: username || currentLocal.pioneerUsername,
  });
  savePioneerRewardsState(updatedLocal, { skipCloudSync: true });

  if (!isTestEnvironment() && typeof window !== 'undefined') {
    try {
      const cloud = await loadWalletFromCloud(walletId);
      if (cloud && cloud.updatedAt >= updatedLocal.updatedAt) {
        const merged = normalizeState({
          ...updatedLocal,
          ...cloud,
          walletId,
          pioneerUsername: username || cloud.pioneerUsername || updatedLocal.pioneerUsername,
        });
        savePioneerRewardsState(merged, { skipCloudSync: true });
      } else {
        await saveWalletToCloud(walletId, updatedLocal);
      }

      if (cloudUnsubscribe) {
        cloudUnsubscribe();
      }
      cloudUnsubscribe = subscribeToWalletCloud(walletId, (remoteWallet) => {
        const latestLocal = getPioneerRewardsState();
        if (remoteWallet.updatedAt > latestLocal.updatedAt) {
          const synced = normalizeState({
            ...latestLocal,
            ...remoteWallet,
            walletId,
          });
          savePioneerRewardsState(synced, { skipCloudSync: true });
        }
      });
    } catch {
      // mantiene cache locale funzionante se Firestore non è raggiungibile
    }
  }

  return getPioneerRewardsState();
}

/**
 * Converte Punti in Pi Network equivalenti
 */
export function pointsToPi(points: number): number {
  return Number((points / REWARDS_CONFIG.POINTS_PER_PI).toFixed(4));
}

/**
 * Converte Pi in Punti equivalenti
 */
export function piToPoints(pi: number): number {
  return Math.round(pi * REWARDS_CONFIG.POINTS_PER_PI);
}

/**
 * Assegna punti per un'azione compiuta
 */
export function awardPoints(
  actionType: keyof typeof REWARDS_CONFIG.EARN_RATES,
  customDescription?: string
): { success: boolean; newBalance: number; pointsEarned: number } {
  const points = REWARDS_CONFIG.EARN_RATES[actionType] || 0;
  if (points <= 0) return { success: false, newBalance: 0, pointsEarned: 0 };

  const state = getPioneerRewardsState();
  state.pointsBalance += points;
  state.totalPointsEarned += points;
  if (actionType === 'QUICK_SPONSOR_AD') {
    state.adCompletedStreak = (state.adCompletedStreak || 0) + 1;
  }

  const descMap: Record<string, string> = {
    QUICK_SPONSOR_AD: 'Visione sponsor rapido partner',
    BANNER_CLICK: 'Interazione con banner territoriale',
    COMMUNITY_SHARING: 'Condivisione con la community locale',
    REAL_LISTING_BASIC: 'Pubblicazione nuovo annuncio reale P2P',
    REAL_LISTING_VERIFIED: 'Pubblicazione annuncio reale verificato con foto e geo',
    REAL_EXCHANGE_CONCLUDED: 'Stretta di mano e scambio reale completato',
  };

  const newTx: RewardTransaction = {
    id: 'rew_' + Math.random().toString(36).substring(2, 9),
    type: actionType.startsWith('REAL_LISTING')
      ? 'EARN_REAL_LISTING'
      : actionType === 'QUICK_SPONSOR_AD'
      ? 'EARN_AD_VIEW'
      : 'EARN_COMMUNITY_ENGAGE',
    description: customDescription || descMap[actionType] || 'Azione comunitaria completata',
    pointsDelta: points,
    piEquivalent: pointsToPi(points),
    timestamp: Date.now(),
    status: 'completed',
  };

  state.history.unshift(newTx);
  savePioneerRewardsState(state);

  return {
    success: true,
    newBalance: state.pointsBalance,
    pointsEarned: points,
  };
}

/**
 * Aggiunge o rimuove punti arbitrari mantenendo una sola fonte di verità
 */
export function adjustCommunityPoints(
  delta: number,
  description = 'Aggiornamento saldo punti comunitario'
): { success: boolean; newBalance: number; pointsDelta: number } {
  if (!delta) {
    return { success: false, newBalance: getPioneerRewardsState().pointsBalance, pointsDelta: 0 };
  }
  if (delta < 0) {
    const spent = spendPoints(Math.abs(delta), description);
    return { success: spent.success, newBalance: spent.newBalance, pointsDelta: -spent.pointsSpent };
  }

  const state = getPioneerRewardsState();
  state.pointsBalance += delta;
  state.totalPointsEarned += delta;
  state.history.unshift({
    id: `tx_adj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'EARN_COMMUNITY_ENGAGE',
    description,
    pointsDelta: delta,
    piEquivalent: pointsToPi(delta),
    timestamp: Date.now(),
    status: 'completed',
  });
  savePioneerRewardsState(state);
  return { success: true, newBalance: state.pointsBalance, pointsDelta: delta };
}

/**
 * Aggiorna la preferenza di stream ricompense
 */
export function setAdStreamEnabledPreference(enabled: boolean): PioneerRewardsState {
  const state = getPioneerRewardsState();
  state.adStreamEnabled = Boolean(enabled);
  savePioneerRewardsState(state);
  return getPioneerRewardsState();
}

/**
 * Ricarica o scala il saldo Pi Esercente in modo sincrono e persistente
 */
export function addMerchantPiCredit(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return getPioneerRewardsState().merchantPiBalance;
  }
  const state = getPioneerRewardsState();
  state.merchantPiBalance = Number((state.merchantPiBalance + amount).toFixed(8));
  savePioneerRewardsState(state);
  return state.merchantPiBalance;
}

export function spendMerchantPiBalance(
  costPi: number,
  description = 'Abbonamento vetrina esercente'
): { success: boolean; newMerchantBalance: number } {
  const state = getPioneerRewardsState();
  if (!Number.isFinite(costPi) || costPi <= 0 || state.merchantPiBalance < costPi) {
    return { success: false, newMerchantBalance: state.merchantPiBalance };
  }
  state.merchantPiBalance = Number((state.merchantPiBalance - costPi).toFixed(8));
  state.history.unshift({
    id: `tx_merch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'WITHDRAW_PI',
    description: `${description} (-${costPi} π)`,
    pointsDelta: 0,
    piEquivalent: -costPi,
    timestamp: Date.now(),
    status: 'completed',
  });
  savePioneerRewardsState(state);
  return { success: true, newMerchantBalance: state.merchantPiBalance };
}

/**
 * Calcola i dettagli del prelievo rispettando la soglia minima di 0.50 π e la fee di 0.01 π
 */
export function calculateWithdrawalBreakdown(requestedPi: number) {
  const minPi = REWARDS_CONFIG.MIN_WITHDRAWAL_PI;
  const feePi = REWARDS_CONFIG.BLOCKCHAIN_TRANSACTION_FEE_PI;

  const isValidAmount = requestedPi >= minPi;
  const netReceivedPi = isValidAmount ? Number((requestedPi - feePi).toFixed(4)) : 0;
  const requiredPoints = piToPoints(requestedPi);

  return {
    requestedPi,
    feePi,
    netReceivedPi,
    requiredPoints,
    minPi,
    isValidAmount,
  };
}

/**
 * Esegue la richiesta di prelievo verso il wallet esterno Pi Network tramite backend Express (/api/pi/withdraw)
 */
export async function executePiWithdrawal(
  requestedPi: number,
  walletAddress: string,
  pioneerUsername?: string,
  uid?: string
): Promise<{
  success: boolean;
  netPiSent?: number;
  feeDeducted?: number;
  txHash?: string;
  mode?: string;
  newPointsBalance?: number;
  error?: string;
}> {
  const breakdown = calculateWithdrawalBreakdown(requestedPi);

  if (!breakdown.isValidAmount) {
    return {
      success: false,
      error: `La soglia minima di prelievo è di ${REWARDS_CONFIG.MIN_WITHDRAWAL_PI} π.`,
    };
  }

  const state = getPioneerRewardsState();
  if (state.pointsBalance < breakdown.requiredPoints) {
    return {
      success: false,
      error: `Punti insufficienti. Hai ${state.pointsBalance} punti (${pointsToPi(state.pointsBalance)} π), necessari ${breakdown.requiredPoints} punti.`,
    };
  }

  if (!walletAddress || walletAddress.trim().length < 6) {
    return {
      success: false,
      error: 'Inserisci un indirizzo Pi Wallet o Username Pioneer valido.',
    };
  }

  let txHash = '';
  let mode = 'live_pi_api';
  let netPiSent = breakdown.netReceivedPi;
  let feeDeducted = breakdown.feePi;
  let confirmed = false;

  if (typeof fetch === 'function') {
    try {
      const response = await fetch('/api/pi/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedPi,
          walletAddress: walletAddress.trim(),
          pioneerUsername: pioneerUsername || state.pioneerUsername,
          uid,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          success: false,
          error: payload?.error || `Errore server prelievo Pi (HTTP ${response.status})`,
        };
      }
      if (payload?.txHash) {
        txHash = payload.txHash;
        mode = payload.mode || mode;
        netPiSent = typeof payload.netPiSent === 'number' ? payload.netPiSent : netPiSent;
        feeDeducted = typeof payload.feeDeducted === 'number' ? payload.feeDeducted : feeDeducted;
        confirmed = true;
      }
    } catch {
      confirmed = false;
    }
  }

  // Senza conferma del server non si scala alcun punto e non si dichiara un prelievo riuscito
  if (!confirmed) {
    return {
      success: false,
      error: 'Prelievo non confermato dal server Pi Network: nessun punto è stato addebitato.',
    };
  }

  state.pointsBalance -= breakdown.requiredPoints;
  if (pioneerUsername) state.pioneerUsername = pioneerUsername;
  state.pioneerWalletAddress = walletAddress;

  const withdrawTx: RewardTransaction = {
    id: 'wth_' + Math.random().toString(36).substring(2, 9),
    type: 'WITHDRAW_PI',
    description: `Prelievo sul Pi Wallet esterno (${walletAddress.substring(0, 10)}...)`,
    pointsDelta: -breakdown.requiredPoints,
    piEquivalent: requestedPi,
    timestamp: Date.now(),
    txHash,
    status: 'completed',
  };

  state.history.unshift(withdrawTx);
  savePioneerRewardsState(state);

  return {
    success: true,
    netPiSent,
    feeDeducted,
    txHash,
    mode,
    newPointsBalance: state.pointsBalance,
  };
}

// ============================================================
// Spende/scala punti dal saldo comunitario unificato
// Uso: spendPoints(2, "Pubblicazione annuncio semplice")
// ============================================================
export function spendPoints(
  amount: number,
  description: string
): { success: boolean; newBalance: number; pointsSpent: number } {
  if (!amount || amount <= 0) {
    return { success: false, newBalance: getPioneerRewardsState().pointsBalance, pointsSpent: 0 };
  }
  const state = getPioneerRewardsState();
  if (state.pointsBalance < amount) {
    return { success: false, newBalance: state.pointsBalance, pointsSpent: 0 };
  }
  state.pointsBalance -= amount;
  const tx: RewardTransaction = {
    id: `tx_spend_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'EARN_COMMUNITY_ENGAGE',
    description,
    pointsDelta: -amount,
    piEquivalent: Number((amount / 1000).toFixed(6)),
    timestamp: Date.now(),
    status: 'completed',
  };
  state.history.unshift(tx);
  savePioneerRewardsState(state);
  return { success: true, newBalance: state.pointsBalance, pointsSpent: amount };
}

/**
 * Costruisce una transazione premio AD_IMPRESSION_VERIFIED pura (senza effetti collaterali).
 * Watch-to-Unlock: invece di pointsDelta accredita un actionUnlockToken monouso.
 * Usabile sia dal frontend che dal backend per allineare la struttura della causale.
 */
export function buildAdImpressionTransaction({
  points = 0,
  campaignId,
  impressionId,
  userId,
  description,
  actionUnlockToken,
  actionType,
  expiresAt,
}: {
  points?: number;
  campaignId: string;
  impressionId: string;
  userId?: string;
  description?: string;
  actionUnlockToken?: string;
  actionType?: string;
  expiresAt?: number;
}): RewardTransaction {
  return {
    id: `tx_adimp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'AD_IMPRESSION_VERIFIED',
    description: description || 'Visione pubblicitaria certificata',
    pointsDelta: points,
    piEquivalent: pointsToPi(points),
    timestamp: Date.now(),
    status: 'completed',
    campaignId,
    impressionId,
    actionUnlockToken,
    actionType,
    expiresAt,
  };
}

/**
 * Registra un'impressione pubblicitaria verificata in modalità Watch-to-Unlock.
 * NON accredita punti: rilascia solo un record di audit con actionUnlockToken.
 * Il token azione monouso è generato e firmato dal Blocco 2 e passato qui per audit.
 * Frontend-only: opera su localStorage + sincronizzazione Firestore.
 */
export function recordAdImpressionUnlock({
  actionUnlockToken,
  actionType,
  expiresAt,
  campaignId,
  impressionId,
  userId,
  description,
}: {
  actionUnlockToken: string;
  actionType: string;
  expiresAt?: number;
  campaignId: string;
  impressionId: string;
  userId?: string;
  description?: string;
}): { success: boolean; actionUnlockToken: string } {
  const state = getPioneerRewardsState();

  // Idempotenza: evita doppio audit se stesso impressionId già presente
  const alreadyExists = Array.isArray(state.history) && state.history.some(
    (t) => t.impressionId === impressionId && t.type === 'AD_IMPRESSION_VERIFIED'
  );
  if (alreadyExists) {
    return { success: true, actionUnlockToken };
  }

  const tx = buildAdImpressionTransaction({
    points: 0,
    campaignId,
    impressionId,
    userId,
    description,
    actionUnlockToken,
    actionType,
    expiresAt,
  });

  state.history.unshift(tx);
  savePioneerRewardsState(state);

  return { success: true, actionUnlockToken };
}
