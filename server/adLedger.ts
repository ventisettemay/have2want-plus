// Motore contabile per il sistema pubblicitario HAVE2WANT PLUS.
// Implementa addebiti campagne, accrediti reward utenti, commissioni piattaforma,
// rimborsi e storni in modo idempotente.
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
  saveImpression,
  findImpressionByIdempotencyKey,
  saveReward,
  findRewardByIdempotencyKey,
  saveLedgerEntry,
  findLedgerByIdempotencyKey,
} from './adStore';
import type {
  AdCampaign,
  AdLedgerAccount,
  AdLedgerType,
  CertifyImpressionInput,
} from './adTypes';

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowMs(): number {
  return Date.now();
}

const WALLET_ENV: WalletSyncEnv = {};

/**
 * Esegue una sincronizzazione wallet (best effort). Se non configurata, viene ignorata.
 */
async function syncWallet(input: {
  walletId: string;
  pointsDelta: number;
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
 * Addebita il budget di una campagna. Idempotente.
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
}): { ok: boolean; duplicate?: boolean; entry?: import('./adTypes').AdLedgerEntry; error?: string } {
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
    });
  }

  const newRemaining = campaign.budgetRemaining - amount;
  updateCampaignBudget(campaignId, newRemaining);

  return { ok: true, entry: ledgerResult.entry };
}

/**
 * Accredita reward punti a un utente per un'impressione certificata. Idempotente.
 */
export function creditUserReward({
  userId,
  campaignId,
  impressionId,
  points,
  idempotencyKey,
  walletId,
}: {
  userId: string;
  campaignId: string;
  impressionId: string;
  points: number;
  idempotencyKey: string;
  walletId?: string;
}): { reward: import('./adTypes').AdReward; duplicate: boolean; entry?: import('./adTypes').AdLedgerEntry } {
  const existing = findRewardByIdempotencyKey(idempotencyKey);
  if (existing) {
    return { reward: existing, duplicate: true };
  }

  const ledgerResult = recordLedgerEntry({
    type: 'credit',
    account: 'user_reward',
    amount: points,
    referenceId: userId,
    description: `Reward pubblicitaria campagna ${campaignId}`,
    idempotencyKey,
  });

  const reward: import('./adTypes').AdReward = {
    id: genId(),
    userId,
    campaignId,
    impressionId,
    points,
    status: 'completed',
    createdAt: nowMs(),
    idempotencyKey,
  };

  saveReward(reward);

  if (walletId) {
    syncWallet({
      walletId,
      pointsDelta: points,
      actionType: 'AD_REWARD',
      description: `Reward visualizzazione annuncio campagna ${campaignId}`,
      txId: idempotencyKey,
    });
  }

  return { reward, duplicate: false, entry: ledgerResult.entry };
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
 */
export function refundCampaign({
  campaignId,
  amount,
  idempotencyKey,
}: {
  campaignId: string;
  amount: number;
  idempotencyKey: string;
}): { ok: boolean; duplicate?: boolean; entry?: import('./adTypes').AdLedgerEntry; error?: string } {
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
 * Calcola i punti reward da accreditare all'utente in base alla campagna.
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
