// Motore contabile per il sistema pubblicitario HAVE2WANT PLUS — Punti 7-8.
// Implementa addebiti campagne, accrediti reward, commissioni piattaforma,
// rimborsi, storni, riconciliazione saldi e massimali giornalieri.
// Usa:
//   - idempotencyStore per chiavi di idempotenza (Firestore/D1/file locale/in-memory)
//   - firestoreWalletSync per operazioni su punti/Pi quando configurato
//   - adStore per persistenza entità pubblicitarie (file locale fallback)
// Nessuna dipendenza esterna aggiuntiva.

import {
  executeServerWalletPointsSync,
  type WalletSyncEnv,
} from './firestoreWalletSync';
import {
  getCampaign,
  saveCampaign,
  updateCampaignBudget,
  incrementCampaignStats,
  saveImpression,
  findImpressionByIdempotencyKey,
  getReward,
  saveReward,
  findRewardByIdempotencyKey,
  saveLedgerEntry,
  findLedgerByIdempotencyKey,
  listLedgerByAccount,
  sumLedgerByAccount,
  listLedgerByReference,
  listLedgerByUser,
  getDailyCaps,
  saveDailyCaps,
  incrementDailyCaps,
  setDailyCapsLimits,
  listRewardsByUser,
  listImpressionsByUser,
  listImpressionsByUserToday,
} from './adStore';
import type {
  AdCampaign,
  AdLedgerAccount,
  AdLedgerType,
  AdReward,
  AdRewardType,
  CertifyImpressionInput,
  DailyUserCaps,
} from './adTypes';

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function nowMs(): number {
  return Date.now();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const WALLET_ENV: WalletSyncEnv = {};

/**
 * Esegue una sincronizzazione wallet (best effort). Se non configurata, viene ignorata.
 */
async function syncWallet(input: {
  walletId: string;
  pointsDelta: number;
  merchantPiDelta?: number;
  actionType: string;
  description: string;
  txId: string;
}): Promise<void> {
  try {
    await executeServerWalletPointsSync({
      payload: {
        piAccessToken: '',
        firebaseIdToken: '',
        pioneerUsername: input.walletId,
        pointsDelta: input.pointsDelta,
        merchantPiDelta: input.merchantPiDelta ?? 0,
        actionType: input.actionType,
        description: input.description,
        txId: input.txId,
      },
      env: WALLET_ENV,
    });
  } catch {
    // wallet non configurato: continuiamo sul ledger locale
  }
}

/**
 * Registra una voce contabile nel ledger. Idempotente per idempotencyKey.
 * Ritorna la voce e un flag duplicate.
 */
export function recordLedgerEntry({
  type,
  account,
  amount,
  referenceId,
  description,
  idempotencyKey,
  balanceAfter,
}: {
  type: AdLedgerType;
  account: AdLedgerAccount;
  amount: number;
  referenceId: string;
  description: string;
  idempotencyKey: string;
  balanceAfter?: number;
}): { entry: import('./adTypes').AdLedgerEntry; duplicate: boolean } {
  const existing = findLedgerByIdempotencyKey(idempotencyKey);
  if (existing) {
    return { entry: existing, duplicate: true };
  }

  const entry: import('./adTypes').AdLedgerEntry = {
    id: genId(),
    type,
    account,
    amount,
    referenceId,
    description,
    timestamp: nowMs(),
    idempotencyKey,
    balanceAfter,
  };

  saveLedgerEntry(entry);
  return { entry, duplicate: false };
}

/**
 * Calcola il saldo corrente di un conto contabile (somma di tutte le voci).
 */
export function getAccountBalance(account: AdLedgerAccount): number {
  return sumLedgerByAccount(account);
}

/**
 * Addebita il budget di una campagna. Idempotente.
 * Blocca qualsiasi spesa oltre il budget residuo disponibile.
 */
export function debitCampaignBudget({
  campaignId,
  amount,
  idempotencyKey,
  advertiserWalletId,
}: {
  campaignId: string;
  amount: number;
  idempotencyKey: string;
  advertiserWalletId?: string;
}): {
  ok: boolean;
  duplicate?: boolean;
  entry?: import('./adTypes').AdLedgerEntry;
  error?: string;
} {
  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return { ok: false, error: 'campagna non trovata' };
  }
  if (campaign.status !== 'active') {
    return { ok: false, error: 'campagna non attiva' };
  }
  if (campaign.budgetRemaining < amount) {
    return { ok: false, error: 'budget residuo insufficiente' };
  }

  const ledgerResult = recordLedgerEntry({
    type: 'debit',
    account: 'campaign_budget',
    amount,
    referenceId: campaignId,
    description: `Addebito budget campagna ${campaign.title}`,
    idempotencyKey,
    balanceAfter: campaign.budgetRemaining - amount,
  });
  if (ledgerResult.duplicate) {
    return { ok: true, duplicate: true, entry: ledgerResult.entry };
  }

  if (advertiserWalletId) {
    syncWallet({
      walletId: advertiserWalletId,
      pointsDelta: -Math.round(amount),
      actionType: 'AD_DEBIT',
      description: `Addebito budget campagna ${campaignId}`,
      txId: idempotencyKey,
    }).catch(() => {});
  }

  const newRemaining = campaign.budgetRemaining - amount;
  updateCampaignBudget(campaignId, newRemaining);

  return { ok: true, duplicate: false, entry: ledgerResult.entry };
}

/**
 * Accredita reward a un utente per un'impressione certificata.
 * Separa punti promozionali da saldo monetario e Pi (nessuna convertibilità automatica).
 * Idempotente per idempotencyKey. Rispetta i massimali giornalieri.
 */
export function creditUserReward({
  userId,
  campaignId,
  impressionId,
  points,
  type = 'promo_points',
  idempotencyKey,
  walletId,
  dailyCaps,
}: {
  userId: string;
  campaignId: string;
  impressionId: string;
  points: number;
  type?: AdRewardType;
  idempotencyKey: string;
  walletId?: string;
  dailyCaps?: DailyUserCaps;
}): {
  reward: import('./adTypes').AdReward;
  duplicate: boolean;
  entry?: import('./adTypes').AdLedgerEntry;
  capped: boolean;
} {
  const existing = findRewardByIdempotencyKey(idempotencyKey);
  if (existing) {
    return { reward: existing, duplicate: true, capped: false };
  }

  // Rispetta i massimali giornalieri se forniti
  let capped = false;
  let pointsToCredit = points;
  if (dailyCaps && dailyCaps.pointsEarned + points > dailyCaps.maxPoints) {
    pointsToCredit = Math.max(0, dailyCaps.maxPoints - dailyCaps.pointsEarned);
    capped = pointsToCredit < points;
  }

  const ledgerResult = recordLedgerEntry({
    type: 'credit',
    account: 'user_promo_points',
    amount: pointsToCredit,
    referenceId: userId,
    description: `Reward pubblicitaria campagna ${campaignId}`,
    idempotencyKey,
  });

  const reward: import('./adTypes').AdReward = {
    id: genId(),
    userId,
    campaignId,
    impressionId,
    points: pointsToCredit,
    type,
    status: 'completed',
    createdAt: nowMs(),
    idempotencyKey,
  };

  saveReward(reward);

  // Aggiorna daily caps
  if (dailyCaps) {
    incrementDailyCaps(userId, dailyCaps.date, {
      points: pointsToCredit,
    });
  }

  if (walletId && pointsToCredit > 0) {
    syncWallet({
      walletId,
      pointsDelta: pointsToCredit,
      actionType: 'AD_REWARD',
      description: `Reward visualizzazione annuncio campagna ${campaignId}`,
      txId: idempotencyKey,
    }).catch(() => {});
  }

  return { reward, duplicate: false, entry: ledgerResult.entry, capped };
}

/**
 * Accredita commissione piattaforma.
 */
export function creditPlatformCommission({
  amount,
  referenceId,
  idempotencyKey,
  description,
}: {
  amount: number;
  referenceId: string;
  idempotencyKey: string;
  description: string;
}): { entry: import('./adTypes').AdLedgerEntry; duplicate: boolean } {
  return recordLedgerEntry({
    type: 'credit',
    account: 'platform_commission',
    amount,
    referenceId,
    description,
    idempotencyKey,
  });
}

/**
 * Rimborsa una campagna (storno). Idempotente.
 * Ripristina il budget residuo della campagna.
 */
export function refundCampaign({
  campaignId,
  amount,
  idempotencyKey,
}: {
  campaignId: string;
  amount: number;
  idempotencyKey: string;
}): {
  ok: boolean;
  duplicate?: boolean;
  entry?: import('./adTypes').AdLedgerEntry;
  error?: string;
} {
  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return { ok: false, error: 'campagna non trovata' };
  }

  const ledgerResult = recordLedgerEntry({
    type: 'credit',
    account: 'refund',
    amount,
    referenceId: campaignId,
    description: `Rimborso campagna ${campaign.title}`,
    idempotencyKey,
  });
  if (ledgerResult.duplicate) {
    return { ok: true, duplicate: true, entry: ledgerResult.entry };
  }

  const newRemaining = campaign.budgetRemaining + amount;
  updateCampaignBudget(campaignId, newRemaining);
  if (campaign.status === 'completed') {
    campaign.status = 'active';
    saveCampaign(campaign);
  }

  return { ok: true, entry: ledgerResult.entry };
}

/**
 * Storna un accredito reward (reverso). Idempotente.
 */
export function reverseReward({
  rewardId,
  idempotencyKey,
}: {
  rewardId: string;
  idempotencyKey: string;
}): {
  ok: boolean;
  duplicate?: boolean;
  entry?: import('./adTypes').AdLedgerEntry;
  error?: string;
} {
  const reward = getReward(rewardId);
  if (!reward) {
    return { ok: false, error: 'reward non trovato' };
  }
  if (reward.status !== 'completed') {
    return { ok: false, error: 'reward non completato' };
  }

  const ledgerResult = recordLedgerEntry({
    type: 'debit',
    account: 'user_promo_points',
    amount: reward.points,
    referenceId: reward.userId,
    description: `Storno reward campagna ${reward.campaignId}`,
    idempotencyKey,
  });
  if (ledgerResult.duplicate) {
    return { ok: true, duplicate: true, entry: ledgerResult.entry };
  }

  reward.status = 'rejected';
  saveReward(reward);

  return { ok: true, entry: ledgerResult.entry };
}

/**
 * Calcola i punti reward da accreditare in base alla campagna.
 */
export function computeRewardPoints(campaign: AdCampaign): number {
  const cost = campaign.costPerImpression;
  const pct = campaign.rewardPercentToUser / 100;
  return Math.max(0, Math.floor(cost * pct));
}

/**
 * Verifica che una campagna possa sostenere un addebito.
 */
export function canAfford(campaign: AdCampaign, amount: number): boolean {
  return campaign.status === 'active' && campaign.budgetRemaining >= amount;
}

/**
 * Controlla i massimali giornalieri per utente.
 * Ritorna se l'operazione è consentita e i punti residui consentiti.
 */
export function checkDailyCaps(
  userId: string,
  date: string,
  { maxImpressions, maxPoints }: { maxImpressions?: number; maxPoints?: number }
): {
  allowed: boolean;
  remainingImpressions: number;
  remainingPoints: number;
  caps: DailyUserCaps;
} {
  const caps = getDailyCaps(userId, date) ?? {
    userId,
    date,
    impressionsCount: 0,
    pointsEarned: 0,
    maxImpressions: maxImpressions ?? 10,
    maxPoints: maxPoints ?? 500,
  };

  const remainingImpressions = Math.max(0, (caps.maxImpressions ?? 10) - caps.impressionsCount);
  const remainingPoints = Math.max(0, (caps.maxPoints ?? 500) - caps.pointsEarned);

  return {
    allowed: remainingImpressions > 0 && remainingPoints > 0,
    remainingImpressions,
    remainingPoints,
    caps,
  }
}

/**
 * Riconcilia il ledger contabile con lo stato delle campagne.
 * Ritorna un report con eventuali discrepanze.
 */
export function reconcileCampaign(campaignId: string): ReconciliationReport {
  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return {
      campaignId,
      ledgerSpend: 0,
      campaignSpend: 0,
      discrepancy: 0,
      balanced: false,
      entries: [],
    };
  }

  const entries = listLedgerByReference(campaignId);
  const debits = entries
    .filter((e) => e.type === 'debit' && e.account === 'campaign_budget')
    .reduce((acc, e) => acc + e.amount, 0);
  const credits = entries
    .filter((e) => e.type === 'credit' && e.account === 'refund')
    .reduce((acc, e) => acc + e.amount, 0);

  const ledgerSpend = debits - credits;
  const campaignSpend = campaign.stats.spend;
  const discrepancy = Math.abs(ledgerSpend - campaignSpend);
  const balanced = discrepancy < 0.01;

  return {
    campaignId,
    ledgerSpend,
    campaignSpend,
    discrepancy,
    balanced,
    entries,
  };
}

/**
 * Riconcilia tutti i saldi contabili (verifica coerenza globale).
 */
export function reconcileAll(): {
  campaignBudgetDebits: number;
  platformCommissionCredits: number;
  userRewardsCredits: number;
  refunds: number;
  balanced: boolean;
} {
  const campaignBudgetDebits = sumLedgerByAccount('campaign_budget');
  const platformCommissionCredits = sumLedgerByAccount('platform_commission');
  const userRewardsCredits = sumLedgerByAccount('user_promo_points');
  const refunds = sumLedgerByAccount('refund');

  // La spesa totale delle campagne dovrebbe equivalere a commissioni + reward (al netto dei rimborsi)
  const netSpend = campaignBudgetDebits - refunds;
  const distributed = platformCommissionCredits + userRewardsCredits;
  const balanced = Math.abs(netSpend - distributed) < 0.01;

  return {
    campaignBudgetDebits,
    platformCommissionCredits,
    userRewardsCredits,
    refunds,
    balanced,
  };
}

/**
 * Ottiene lo storico movimenti di un utente (reward + ledger).
 */
export function getUserHistory(userId: string): {
  rewards: AdReward[];
  ledger: import('./adTypes').AdLedgerEntry[];
  impressions: import('./adTypes').AdImpression[];
} {
  return {
    rewards: listRewardsByUser(userId),
    ledger: listLedgerByUser(userId),
    impressions: listImpressionsByUser(userId),
  };
}

/**
 * Ottiene le impressioni certificate oggi per un utente (per controllo massimali).
 */
export function getCertifiedImpressionsToday(userId: string): import('./adTypes').AdImpression[] {
  return listImpressionsByUserToday(userId, todayKey());
}

export type ReconciliationReport = import('./adTypes').ReconciliationReport;
