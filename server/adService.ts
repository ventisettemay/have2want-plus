// Logica business pubblicitaria (Punti 4-8).
// Espone le funzioni usate dalle rotte Express in server.ts.
// Persistenza su adStore (file JSON locale). Nessuna nuova dipendenza.

import type {
  AdCampaign,
  AdCreative,
  AdImpression,
  AdReward,
  AdLedgerEntry,
} from './adTypes';
import {
  getCampaign,
  listCampaigns,
  listCampaignsByAdvertiser,
  findCampaignByIdempotencyKey,
  saveCampaign,
  createCampaign as storeCreateCampaign,
  toggleCampaign as storeToggleCampaign,
  updateCampaignStats,
  getCreative,
  listCreativesByCampaign,
  getApprovedCreative,
  saveCreative,
  addCreative as storeAddCreative,
  reviewCreative as storeReviewCreative,
  approveCreative,
  getImpression,
  findImpressionByIdempotencyKey,
  saveImpression,
  saveReward,
  findRewardByIdempotencyKey,
  saveLedgerEntry,
  findLedgerByIdempotencyKey,
  getDailyCap,
  saveDailyCap,
  incrementRateLimit,
  getIdempotencyRecord,
  saveIdempotencyRecord,
  resetAdsStoreForTests,
} from './adStore';
import {
  debitAccount,
  creditAccount,
  reconcileCampaign,
  getGlobalReconciliation as ledgerGetGlobalReconciliation,
  refundCampaign as ledgerRefundCampaign,
  reverseRewardAction as ledgerReverseRewardAction,
  getUserAdHistory as ledgerGetUserAdHistory,
  certifyImpressionInternal,
} from './adLedger';

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

function hashString(input: string): string {
  const buf = new Uint8Array(4);
  try {
    require('crypto').getRandomValues(buf);
  } catch {
    // fallback
  }
  return (
    input.slice(0, 8) +
    '_' +
    Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
  );
}

// ========== Campagne ==========

export function createCampaign(
  input: {
    advertiserId: string;
    advertiserUsername?: string;
    title: string;
    description?: string;
    budgetTotal: number;
    costPerImpression: number;
    rewardPercentToUser: number;
    targeting: any;
    pricing?: any;
    idempotencyKey?: string;
  }
): { campaign: AdCampaign; error?: string } {
  const idempotencyKey = input.idempotencyKey || genId();
  const existing = findCampaignByIdempotencyKey(idempotencyKey);
  if (existing) {
    return { campaign: existing };
  }

  const campaign = storeCreateCampaign({
    advertiserId: input.advertiserId,
    advertiserUsername: input.advertiserUsername,
    title: input.title,
    description: input.description,
    budgetTotal: input.budgetTotal,
    costPerImpression: input.costPerImpression,
    rewardPercentToUser: input.rewardPercentToUser,
    targeting: input.targeting,
    pricing: input.pricing,
    idempotencyKey,
  });

  // Ledger: riserva budget
  debitAccount(
    'campaign_budget',
    input.budgetTotal,
    campaign.id,
    'campaign',
    idempotencyKey
  );

  return { campaign };
}

export function getAdFeed({
  countryCode,
  category,
  limit = 20,
}: {
  countryCode?: string;
  category?: string;
  limit?: number;
}): { campaigns: AdCampaign[]; count: number } {
  const all = listCampaigns().filter((c) => c.status === 'active' && c.budgetRemaining > 0);

  let filtered = all;
  if (countryCode) {
    filtered = filtered.filter(
      (c) => !c.targeting.countryCode || c.targeting.countryCode === countryCode
    );
  }
  if (category) {
    filtered = filtered.filter(
      (c) =>
        c.targeting.category?.includes(category) ||
        (c.title?.toLowerCase().includes(category.toLowerCase()) ?? false)
    );
  }

  return {
    campaigns: filtered.slice(0, limit),
    count: filtered.length,
  };
}

export function getCampaignStats(campaignId: string): {
  campaign: AdCampaign | null;
  reconciliation: any;
} {
  const campaign = getCampaign(campaignId);
  const reconciliation = campaign ? reconcileCampaign(campaignId) : null;
  return { campaign, reconciliation };
}

export function toggleCampaign(
  id: string,
  status: 'active' | 'paused'
): { campaign: AdCampaign | null; error?: string } {
  const c = storeToggleCampaign(id, status as any);
  if (!c) return { campaign: null, error: 'Campagna non trovata' };
  return { campaign: c };
}

// ========== Creatività ==========

export function addCreative(
  input: {
    campaignId: string;
    type: 'banner' | 'video';
    title?: string;
    cta?: string;
    logoUrl?: string;
    fileUrl?: string;
    fileKey?: string;
    width?: number;
    height?: number;
    format?: string;
    durationSeconds?: number;
  }
): { creative: AdCreative; error?: string } {
  const campaign = getCampaign(input.campaignId);
  if (!campaign) {
    return { creative: null as any, error: 'Campagna non trovata' };
  }

  const creative = storeAddCreative({
    campaignId: input.campaignId,
    type: input.type,
    title: input.title,
    cta: input.cta,
    logoUrl: input.logoUrl,
    fileUrl: input.fileUrl,
    fileKey: input.fileKey,
    width: input.width,
    height: input.height,
    format: input.format,
    durationSeconds: input.durationSeconds,
  });

  campaign.creativeIds.push(creative.id);
  campaign.updatedAt = nowMs();
  saveCampaign(campaign);

  return { creative };
}

export function getAdFeedForCampaign(campaignId: string): AdCreative[] {
  return listCreativesByCampaign(campaignId);
}

export function reviewCreative(
  creativeId: string,
  action: 'approve' | 'reject',
  reason?: string
): { creative: AdCreative | null; error?: string } {
  const cr = storeReviewCreative(creativeId, action, reason);
  if (!cr) return { creative: null, error: 'Creatività non trovata' };
  return { creative: cr };
}

// ========== Session Token ==========

export function createSessionToken({
  userId,
  campaignId,
}: {
  userId: string;
  campaignId: string;
}): { token: string; nonce: string; error?: string } {
  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return { token: '', nonce: '', error: 'Campagna non trovata' };
  }
  const token = genId();
  const nonce = genId();
  const issuedAt = nowMs();
  const expiresAt = issuedAt + 30 * 60 * 1000; // 30 minuti

  const signature = hashString(`${token}:${nonce}:${issuedAt}:${userId}:${campaignId}`);

  saveLedgerEntry({
    id: genId(),
    account: 'user_promo_points',
    type: 'credit',
    amount: 0,
    referenceId: campaignId,
    referenceType: 'campaign',
    createdAt: issuedAt,
    idempotencyKey: `session:${token}`,
  });

  return { token, nonce };
}

export function verifySessionTokenFull({
  token,
  nonce,
  userId,
  campaignId,
}: {
  token: string;
  nonce: string;
  userId: string;
  campaignId: string;
}): { valid: boolean; error?: string } {
  const record = getIdempotencyRecord(token, 'session');
  if (!record) {
    return { valid: false, error: 'Token di sessione non valido o scaduto' };
  }
  return { valid: true };
}

// ========== Impressioni / Certificazione ==========

export function certifyImpression(input: {
  campaignId: string;
  userId: string;
  sessionToken: string;
  nonce: string;
  idempotencyKey: string;
  amount?: number;
}): {
  impression: AdImpression | null;
  reward: AdReward | null;
  duplicate: boolean;
  rateLimited: boolean;
  error?: string;
} {
  const campaign = getCampaign(input.campaignId);
  if (!campaign) {
    return { impression: null, reward: null, duplicate: false, rateLimited: false, error: 'Campagna non trovata' };
  }

  // Rate limiting per utente
  const rateId = `impression:${input.userId}:${input.campaignId}`;
  const rate = incrementRateLimit(rateId, 60_000, 60);
  if (!rate.allowed) {
    return { impression: null, reward: null, duplicate: false, rateLimited: true, error: 'Rate limit impressioni superato' };
  }

  // Daily cap
  const today = new Date().toISOString().slice(0, 10);
  const cap = getDailyCap(input.userId, today);
  const maxPerDay = campaign.targeting.maxFrequencyPerUserPerDay ?? 10;
  if (cap && cap.impressions >= maxPerDay) {
    return { impression: null, reward: null, duplicate: false, rateLimited: true, error: 'Limite giornaliero impressioni raggiunto' };
  }

  const creative = getApprovedCreative(input.campaignId);
  if (!creative) {
    return { impression: null, reward: null, duplicate: false, rateLimited: false, error: 'Nessuna creatività approvata per questa campagna' };
  }

  const amount = input.amount ?? campaign.costPerImpression;
  const rewardPoints = Math.round((amount * campaign.rewardPercentToUser) / 100);

  const result = certifyImpressionInternal(
    input.campaignId,
    creative.id,
    input.userId,
    amount,
    rewardPoints,
    input.idempotencyKey
  );

  if (result.duplicate) {
    return {
      impression: result.impression,
      reward: null,
      duplicate: true,
      rateLimited: false,
    };
  }

  // Aggiorna daily cap
  const newCap: any = cap ?? { userId: input.userId, date: today, impressions: 0, rewards: 0 };
  newCap.impressions += 1;
  newCap.rewards += rewardPoints;
  saveDailyCap(newCap);

  return {
    impression: result.impression,
    reward: result.reward,
    duplicate: false,
    rateLimited: false,
  };
}

// ========== Presign Upload ==========

export function getPresignUpload({
  fileName,
  contentType,
}: {
  fileName: string;
  contentType: string;
}): { uploadUrl: string; fileKey: string; error?: string } {
  const fileKey = `ads/uploads/${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
  const uploadUrl = `/api/uploads/local/${fileKey}`;
  return { uploadUrl, fileKey };
}

// ========== Storico utente ==========

export function getUserAdHistory(userId: string) {
  return ledgerGetUserAdHistory(userId);
}

// ========== Riconciliazione globale ==========

export function getGlobalReconciliation() {
  return ledgerGetGlobalReconciliation();
}

// ========== Rimborso campagna ==========

export function refundCampaign(
  campaignId: string,
  amount: number,
  idempotencyKey?: string
) {
  return ledgerRefundCampaign(campaignId, amount, idempotencyKey);
}

// ========== Reversione reward ==========

export function reverseRewardAction(
  rewardId: string,
  idempotencyKey?: string
) {
  return ledgerReverseRewardAction(rewardId, idempotencyKey);
}

/** Resetta lo store per i test. */
export function resetAdServiceForTests(): void {
  resetAdsStoreForTests();
}
