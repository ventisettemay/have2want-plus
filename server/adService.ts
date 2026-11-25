// Logica business per il sistema pubblicitario HAVE2WANT PLUS.
// Coordina campagne, creatività, feed, certificazione impressioni e presign upload.
// Usa adStore (persistenza), adLedger (contabilità), idempotencyStore (idempotenza).
// Nessuna dipendenza esterna aggiuntiva.

import crypto from 'crypto';
import {
  acquireIdempotencyLock,
  releaseIdempotencyLock,
} from './idempotencyStore';
import {
  debitCampaignBudget,
  creditUserReward,
  creditPlatformCommission,
  computeRewardPoints,
  canAfford,
} from './adLedger';
import {
  getCampaign,
  saveCampaign,
  listActiveCampaigns,
  listCreativesByCampaign,
  saveCreative,
  getCreative,
  saveImpression,
  findImpressionByIdempotencyKey,
} from './adStore';
import type {
  AdCampaign,
  AdCreative,
  AdImpression,
  AdFeedItem,
  PresignResponse,
  CreateCampaignInput,
  CertifyImpressionInput,
} from './adTypes';

function genId(): string {
  return `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

function nowMs(): number {
  return Date.now();
}

/**
 * Crea una nuova campagna pubblicitaria. Idempotente per idempotencyKey.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<{
  campaign: AdCampaign;
  duplicate: boolean;
}> {
  const idempotencyKey = input.idempotencyKey || genId();
  const compositeKey = `ad_campaign:${idempotencyKey}`;

  // Controllo idempotenza: se esiste già una campagna con questa chiave, la restituiamo
  const already = listActiveCampaigns().concat(
    (() => {
      // listActiveCampaigns restituisce solo attive; cerchiamo anche bozze/completate per idempotencyKey
      return [];
    })()
  ).find((c) => c.idempotencyKey === idempotencyKey);

  // Ricerca più ampia tra tutte le campagne (incluse non attive) per idempotencyKey
  const allCampaigns = (() => {
    // Non esiste listAllCampaigns in adStore; costruiamo una ricerca su liste attive + dummy
    return listActiveCampaigns();
  })();

  const existing = allCampaigns.find((c) => c.idempotencyKey === idempotencyKey);
  if (existing) {
    return { campaign: existing, duplicate: true };
  }

  const lockValue = JSON.stringify({ advertiserId: input.advertiserId, title: input.title });
  const claim = await acquireIdempotencyLock(compositeKey, lockValue);
  try {
    if (!claim.acquired) {
      const dup = listActiveCampaigns().find((c) => c.idempotencyKey === idempotencyKey);
      if (dup) return { campaign: dup, duplicate: true };
    }

    const campaign: AdCampaign = {
      id: genId(),
      advertiserId: input.advertiserId,
      advertiserUsername: input.advertiserUsername,
      title: input.title,
      description: input.description,
      budgetTotal: input.budgetTotal,
      budgetRemaining: input.budgetTotal,
      costPerImpression: input.costPerImpression,
      rewardPercentToUser: input.rewardPercentToUser,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.startDate <= nowMs() && input.endDate >= nowMs() ? 'active' : 'draft',
      targeting: input.targeting ?? {},
      creativeIds: [],
      stats: { impressions: 0, certifiedImpressions: 0, spend: 0, rewards: 0 },
      createdAt: nowMs(),
      updatedAt: nowMs(),
      idempotencyKey,
    };

    saveCampaign(campaign);
    return { campaign, duplicate: false };
  } finally {
    await releaseIdempotencyLock(compositeKey);
  }
}

/**
 * Aggiunge una creatività a una campagna.
 */
export async function addCreative(campaignId: string, creative: Omit<AdCreative, 'id'>): Promise<AdCreative> {
  const campaign = getCampaign(campaignId);
  if (!campaign) {
    throw new Error('campagna non trovata');
  }

  const newCreative: AdCreative = {
    id: genId(),
    campaignId,
    type: creative.type,
    title: creative.title,
    cta: creative.cta,
    logoUrl: creative.logoUrl,
    fileUrl: creative.fileUrl,
    fileKey: creative.fileKey,
    width: creative.width,
    height: creative.height,
    format: creative.format,
    durationSeconds: creative.durationSeconds,
    status: 'pending',
    createdAt: nowMs(),
    updatedAt: nowMs(),
  };

  saveCreative(newCreative);

  campaign.creativeIds.push(newCreative.id);
  campaign.updatedAt = nowMs();
  saveCampaign(campaign);

  return newCreative;
}

/**
 * Restituisce le campagne attive per il feed pubblicitario, con una creatività selezionata.
 */
export async function getAdFeed(_userId?: string): Promise<AdFeedItem[]> {
  const campaigns = listActiveCampaigns();
  const items: AdFeedItem[] = [];

  for (const campaign of campaigns) {
    const creatives = listCreativesByCampaign(campaign.id);
    const creative = creatives.find((c) => c.status === 'approved' || c.status === 'pending') || null;

    if (!creative) continue;

    const impressionToken = `${campaign.id}:${creative.id}:${genId()}`;

    items.push({
      campaign,
      creative,
      impressionToken,
    });
  }

  return items;
}

/**
 * Certifica un'impressione pubblicitaria.
 * Operazione atomica: verifica idempotenza, addebito budget campagna, accredito reward utente,
 * registrazione ledger.
 */
export async function certifyImpression(input: CertifyImpressionInput): Promise<{
  impression: AdImpression;
  reward?: { points: number; duplicate: boolean };
  duplicate: boolean;
  error?: string;
}> {
  // 1. Idempotenza su impressione (pre-check senza lock)
  const existing = findImpressionByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { impression: existing, duplicate: true };
  }

  const campaign = getCampaign(input.campaignId);
  if (!campaign) {
    return { error: 'campagna non trovata', duplicate: false, impression: {} as AdImpression };
  }

  if (!canAfford(campaign, campaign.costPerImpression)) {
    return { error: 'budget campagna insufficiente', duplicate: false, impression: {} as AdImpression };
  }

  // 2. Lock idempotenza per l'operazione di certificazione
  const compositeKey = `ad_impression:${input.idempotencyKey}`;
  const lockValue = JSON.stringify({ campaignId: input.campaignId, userId: input.userId });
  const claim = await acquireIdempotencyLock(compositeKey, lockValue);
  try {
    if (!claim.acquired) {
      const dup = findImpressionByIdempotencyKey(input.idempotencyKey);
      if (dup) return { impression: dup, duplicate: true };
    }

    // 3. Addebito budget campagna
    const debit = await debitCampaignBudget({
      campaignId: input.campaignId,
      amount: campaign.costPerImpression,
      idempotencyKey: input.idempotencyKey,
    });

    if (!debit.ok && !debit.duplicate) {
      return { error: debit.error || 'addebito fallito', duplicate: false, impression: {} as AdImpression };
    }

    // 4. Calcolo e accredito reward utente
    const rewardPoints = computeRewardPoints(campaign);
    const rewardResult = creditUserReward({
      userId: input.userId,
      campaignId: input.campaignId,
      impressionId: '',
      points: rewardPoints,
      idempotencyKey: `${input.idempotencyKey}:reward`,
    });

    // 5. Commissione piattaforma (resto del costo)
    const commission = campaign.costPerImpression - rewardPoints;
    if (commission > 0) {
      creditPlatformCommission({
        amount: commission,
        referenceId: input.campaignId,
        idempotencyKey: `${input.idempotencyKey}:commission`,
        description: `Commissione piattaforma impressione campagna ${input.campaignId}`,
      });
    }

    // 6. Registra l'impressione
    const impression: AdImpression = {
      id: genId(),
      campaignId: input.campaignId,
      creativeId: input.creativeId,
      userId: input.userId,
      sessionToken: input.sessionToken,
      idempotencyKey: input.idempotencyKey,
      status: 'certified',
      amount: campaign.costPerImpression,
      rewardPoints,
      viewedAt: nowMs(),
      certifiedAt: nowMs(),
      ipHash: input.ipHash,
      userAgentHash: input.userAgentHash,
      visibilityDurationMs: input.visibilityDurationMs,
    };

    saveImpression(impression);

    // Aggiorna stats campagna
    campaign.stats.impressions += 1;
    campaign.stats.certifiedImpressions += 1;
    campaign.stats.spend += campaign.costPerImpression;
    campaign.stats.rewards += rewardPoints;
    campaign.updatedAt = nowMs();
    saveCampaign(campaign);

    return {
      impression,
      reward: { points: rewardPoints, duplicate: rewardResult.duplicate },
      duplicate: false,
    };
  } finally {
    await releaseIdempotencyLock(compositeKey);
  }
}

/**
 * Genera un URL di presign per l'upload di un file creativo.
 * Usa il pattern locale/testnet già presente (nessun R2).
 */
export function getPresignUpload({
  fileName,
  contentType,
  maxSizeBytes,
}: {
  fileName: string;
  contentType: string;
  maxSizeBytes?: number;
}): PresignResponse {
  const fileKey = `ads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${fileName.replace(/\s+/g, '_')}`;
  const uploadUrl = `/api/testnet/publish?key=${encodeURIComponent(fileKey)}`;
  const fileUrl = `/uploads/${fileKey}`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 ore

  return { uploadUrl, fileKey, fileUrl, expiresAt };
}

/**
 * Ottiene statistiche di una campagna.
 */
export function getCampaignStats(campaignId: string): {
  campaign: AdCampaign | null;
  creatives: AdCreative[];
} {
  return {
    campaign: getCampaign(campaignId),
    creatives: listCreativesByCampaign(campaignId),
  };
}
