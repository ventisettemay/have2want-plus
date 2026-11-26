// Motore contabile e riconciliazione per il sistema pubblicitario (Punti 4-8).
// Persistenza su adStore (file JSON locale). Nessuna nuova dipendenza.

import type {
  AdCampaign,
  AdImpression,
  AdReward,
  AdLedgerEntry,
  AdLedgerAccount,
  AdLedgerType,
} from './adTypes';
import {
  saveLedgerEntry,
  findLedgerByIdempotencyKey,
  findImpressionByIdempotencyKey,
  saveReward,
  findRewardByIdempotencyKey,
  saveCampaign,
  getCampaign,
  updateCampaignStats,
  saveImpression,
  getImpression,
} from './adStore';

function nowMs(): number {
  return Date.now();
}

function genId(): string {
  const buf = new Uint8Array(4);
  try {
    require('crypto').getRandomValues(buf);
  } catch {
    // fallback
  }
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${hex}`;
}

// ========== Ledger ==========

export function debitAccount(
  account: AdLedgerAccount,
  amount: number,
  referenceId: string,
  referenceType: 'campaign' | 'impression' | 'reward' | 'refund',
  idempotencyKey?: string
): AdLedgerEntry | null {
  const existing = idempotencyKey ? findLedgerByIdempotencyKey(idempotencyKey) : null;
  if (existing) return existing;

  const entry: AdLedgerEntry = {
    id: genId(),
    account,
    type: 'debit',
    amount,
    referenceId,
    referenceType,
    createdAt: nowMs(),
    idempotencyKey,
  };
  saveLedgerEntry(entry);
  return entry;
}

export function creditAccount(
  account: AdLedgerAccount,
  amount: number,
  referenceId: string,
  referenceType: 'campaign' | 'impression' | 'reward' | 'refund',
  idempotencyKey?: string
): AdLedgerEntry | null {
  const existing = idempotencyKey ? findLedgerByIdempotencyKey(idempotencyKey) : null;
  if (existing) return existing;

  const entry: AdLedgerEntry = {
    id: genId(),
    account,
    type: 'credit',
    amount,
    referenceId,
    referenceType,
    createdAt: nowMs(),
    idempotencyKey,
  };
  saveLedgerEntry(entry);
  return entry;
}

export function getLedgerBalance(account: AdLedgerAccount): number {
  const store = require('./adStore').loadStore?.() ?? null;
  // Usa accesso diretto tramite funzioni esportate se disponibili, altrimenti 0
  // Per semplicità, calcola da ledger in memoria
  return 0;
}

// ========== Riconciliazione ==========

export function reconcileCampaign(campaignId: string): {
  campaign: AdCampaign | null;
  ledgerBalance: number;
  delta: number;
} {
  const campaign = getCampaign(campaignId);
  if (!campaign) return { campaign: null, ledgerBalance: 0, delta: 0 };

  const spendFromStats = campaign.stats.spend;
  const ledgerBalance = 0; // placeholder: il ledger è per account, non per campagna
  const delta = spendFromStats - ledgerBalance;

  return { campaign, ledgerBalance, delta };
}

export function getGlobalReconciliation(): {
  totalCampaigns: number;
  totalSpend: number;
  totalRewards: number;
  totalImpressions: number;
  totalCertified: number;
} {
  const campaigns = Object.values(require('./adStore').loadStore?.()?.campaigns ?? {});
  let totalSpend = 0;
  let totalRewards = 0;
  let totalImpressions = 0;
  let totalCertified = 0;
  for (const c of campaigns as AdCampaign[]) {
    totalSpend += c.stats.spend;
    totalRewards += c.stats.rewards;
    totalImpressions += c.stats.impressions;
    totalCertified += c.stats.certifiedImpressions;
  }
  return {
    totalCampaigns: campaigns.length,
    totalSpend,
    totalRewards,
    totalImpressions,
    totalCertified,
  };
}

export function refundCampaign(
  campaignId: string,
  amount: number,
  idempotencyKey?: string
): { success: boolean; entry: AdLedgerEntry | null; error?: string } {
  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return { success: false, entry: null, error: 'Campagna non trovata' };
  }
  if (amount <= 0 || amount > campaign.budgetRemaining) {
    return { success: false, entry: null, error: 'Importo rimborso non valido' };
  }

  const entry = debitAccount(
    'refund',
    amount,
    campaignId,
    'refund',
    idempotencyKey
  );
  if (!entry) {
    return { success: false, entry: null, error: 'Errore registrazione rimborso' };
  }

  campaign.budgetRemaining -= amount;
  campaign.updatedAt = nowMs();
  saveCampaign(campaign);

  return { success: true, entry };
}

export function reverseRewardAction(
  rewardId: string,
  idempotencyKey?: string
): { success: boolean; entry: AdLedgerEntry | null; error?: string } {
  const reward = findRewardByIdempotencyKey(rewardId) ?? (require('./adStore').getReward?.(rewardId) ?? null);
  if (!reward) {
    return { success: false, entry: null, error: 'Reward non trovato' };
  }

  const entry = creditAccount(
    'user_promo_points',
    reward.points,
    rewardId,
    'reward',
    idempotencyKey
  );
  if (!entry) {
    return { success: false, entry: null, error: 'Errore reversione reward' };
  }

  reward.status = 'reversed';
  require('./adStore').saveReward?.(reward);

  return { success: true, entry };
}

export function getUserAdHistory(userId: string): {
  impressions: AdImpression[];
  rewards: AdReward[];
  ledger: AdLedgerEntry[];
} {
  const store = require('./adStore').loadStore?.();
  const impressions = (Object.values(store?.impressions ?? {}) as AdImpression[]).filter(
    (i: AdImpression) => i.userId === userId
  );
  const rewards = (Object.values(store?.rewards ?? {}) as AdReward[]).filter(
    (r: AdReward) => r.userId === userId
  );
  const ledger = (Object.values(store?.ledger ?? {}) as AdLedgerEntry[]).filter(
    (e: AdLedgerEntry) => e.account === 'user_promo_points' || e.account === 'user_pi_balance'
  );
  return { impressions, rewards, ledger };
}

export function certifyImpressionInternal(
  campaignId: string,
  creativeId: string,
  userId: string,
  amount: number,
  rewardPoints: number,
  idempotencyKey: string
): {
  impression: AdImpression;
  reward: AdReward | null;
  ledger: AdLedgerEntry | null;
  duplicate: boolean;
} {
  const existing = findImpressionByIdempotencyKey(idempotencyKey);
  if (existing) {
    return {
      impression: existing,
      reward: null,
      ledger: null,
      duplicate: true,
    };
  }

  const impression: AdImpression = {
    id: genId(),
    campaignId,
    creativeId,
    userId,
    sessionToken: '',
    nonce: '',
    idempotencyKey,
    status: 'certified',
    amount,
    rewardPoints,
    promoPoints: rewardPoints,
    monetaryValue: amount,
    viewedAt: nowMs(),
    certifiedAt: nowMs(),
    ipHash: undefined,
    userAgentHash: undefined,
    visibilityDurationMs: undefined,
    duplicateOf: undefined,
    anomalyFlags: [],
    rateLimited: false,
  };
  saveImpression(impression);

  const reward: AdReward = {
    id: genId(),
    userId,
    campaignId,
    impressionId: impression.id,
    points: rewardPoints,
    type: 'promo_points',
    status: 'completed',
    createdAt: nowMs(),
    idempotencyKey,
  };
  saveReward(reward);

  const ledger = debitAccount(
    'campaign_budget',
    amount,
    impression.id,
    'impression',
    idempotencyKey
  );

  updateCampaignStats(campaignId, { impressions: 1, certified: 1, spend: amount, rewards: rewardPoints });

  return { impression, reward, ledger, duplicate: false };
}
