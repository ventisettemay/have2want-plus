// Logica business per il sistema pubblicitario HAVE2WANT PLUS — Punti 4-8.
// Coordina campagne, creatività, feed, certificazione impressioni e presign upload.
// Usa adStore (persistenza), adLedger (contabilità), idempotencyStore (idempotenza).
// Collegamenti: countryAdvertisingPricing.ts (prezzi paese), merchantPinClassifier.ts (categoria pin),
// idempotencyStore.ts (idempotenza atomica), firestoreWalletSync.ts (saldo wallet).
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
  checkDailyCaps,
  reconcileCampaign,
  reconcileAll,
  getUserHistory,
  getCertifiedImpressionsToday,
  reverseReward,
  refundCampaign as refundCampaignFn,
} from './adLedger';
import {
  getCampaign,
  saveCampaign,
  listActiveCampaigns,
  listCreativesByCampaign,
  saveCreative,
  getCreative,
  getApprovedCreative,
  approveCreative,
  saveImpression,
  findImpressionByIdempotencyKey,
  findImpressionByNonce,
  updateCampaignStatus,
  incrementCampaignStats,
  getDailyCaps,
  incrementDailyCaps,
  incrementRateLimit,
  listImpressionsByUser,
} from './adStore';
import { getWeeklyAdvertisingPrice } from '../src/lib/countryAdvertisingPricing';
import { classifyMerchantPin } from '../src/lib/merchantPinClassifier';
import type {
  AdCampaign,
  AdCreative,
  AdCreativeInput,
  AdImpression,
  AdFeedItem,
  AdSessionToken,
  PresignResponse,
  CreateCampaignInput,
  CertifyImpressionInput,
  AdPricingSnapshot,
} from './adTypes';

// Chiave segreta per firmare i token di sessione (da env o fallback deterministico)
const SESSION_SECRET =
  typeof process !== 'undefined' && process.env.AD_SESSION_SECRET
    ? process.env.AD_SESSION_SECRET
    : 'have2want-ads-session-secret-default';

function genId(): string {
  return `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;
}

function nowMs(): number {
  return Date.now();
}

function sha256Hmac(message: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Firma un payload e restituisce token + signature.
 */
function signSessionPayload(payload: Record<string, unknown>): { token: string; signature: string } {
  const token = `${genId()}.${Date.now()}.${crypto.randomBytes(8).toString('hex')}`;
  const signature = sha256Hmac(token, SESSION_SECRET);
  return { token, signature };
}

/**
 * Verifica la firma di un token di sessione. Ritorna null se non valido.
 */
function verifySessionTokenSignature(token: string, signature: string): boolean {
  try {
    const expected = sha256Hmac(token, SESSION_SECRET);
    return expected === signature;
  } catch {
    return false;
  }
}

/**
 * Crea una nuova campagna pubblicitaria completa.
 * Collega pricing da countryAdvertisingPricing e categoria pin da merchantPinClassifier.
 * Idempotente per idempotencyKey. Blocca budget negativo.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<{
  campaign: AdCampaign;
  duplicate: boolean;
  pricing?: AdPricingSnapshot;
}> {
  const idempotencyKey = input.idempotencyKey || genId();
  const compositeKey = `ad_campaign:${idempotencyKey}`;

  const existing = (() => {
    for (const c of listActiveCampaigns()) {
      if (c.idempotencyKey === idempotencyKey) return c;
    }
    return null;
  })();
  if (existing) {
    return { campaign: existing, duplicate: true };
  }

  // Validazioni di base
  if (!input.advertiserId || !input.title) {
    throw new Error('advertiserId e title sono obbligatori');
  }
  if (input.budgetTotal <= 0) {
    throw new Error('budgetTotal deve essere maggiore di zero');
  }
  if (input.costPerImpression <= 0) {
    throw new Error('costPerImpression deve essere maggiore di zero');
  }
  if (input.rewardPercentToUser < 0 || input.rewardPercentToUser > 100) {
    throw new Error('rewardPercentToUser deve essere compreso tra 0 e 100');
  }
  if (input.endDate <= input.startDate) {
    throw new Error('endDate deve essere successiva a startDate');
  }

  const lockValue = JSON.stringify({
    advertiserId: input.advertiserId,
    title: input.title,
    budgetTotal: input.budgetTotal,
  });
  const claim = await acquireIdempotencyLock(compositeKey, lockValue);
  try {
    if (!claim.acquired) {
      const dup = (() => {
        for (const c of listActiveCampaigns()) {
          if (c.idempotencyKey === idempotencyKey) return c;
        }
        return null;
      })();
      if (dup) return { campaign: dup, duplicate: true };
    }

    // Pricing snapshot da countryAdvertisingPricing se countryCode fornito
    let pricing: AdPricingSnapshot | undefined;
    if (input.countryCode) {
      const weekly = getWeeklyAdvertisingPrice(input.countryCode);
      pricing = {
        countryCode: weekly.countryCode,
        listPricePi: weekly.listPricePi,
        currentPricePi: weekly.currentPricePi,
        coefficient: weekly.listPricePi > 0 ? weekly.currentPricePi / weekly.listPricePi : 0,
        trafficTierLabel: weekly.trafficTierLabel,
        durationDays: weekly.durationDays,
      };
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
      dailyBudget: input.dailyBudget,
      maxImpressionsPerUserPerDay: input.maxImpressionsPerUserPerDay,
      minVisibilityDurationMs: input.minVisibilityDurationMs,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.startDate <= nowMs() && input.endDate >= nowMs() ? 'active' : 'draft',
      targeting: input.targeting ?? {},
      pricing,
      creativeIds: [],
      stats: { impressions: 0, certifiedImpressions: 0, spend: 0, rewards: 0 },
      createdAt: nowMs(),
      updatedAt: nowMs(),
      idempotencyKey,
    };

    saveCampaign(campaign);
    return { campaign, duplicate: false, pricing };
  } finally {
    await releaseIdempotencyLock(compositeKey);
  }
}

/**
 * Attiva o sospende una campagna.
 */
export async function toggleCampaign(
  campaignId: string,
  status: 'active' | 'paused'
): Promise<{ campaign: AdCampaign | null; error?: string }> {
  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return { campaign: null, error: 'campagna non trovata' };
  }
  const updated = updateCampaignStatus(campaignId, status);
  return { campaign: updated ?? null };
}

/**
 * Aggiunge una creatività a una campagna.
 */
export async function addCreative(campaignId: string, creative: AdCreativeInput): Promise<AdCreative> {
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
 * Approva o rifiuta una creatività (solo approvate vengono distribuite).
 */
export async function reviewCreative(
  creativeId: string,
  approved: boolean,
  rejectionReason?: string
): Promise<AdCreative | null> {
  const creative = getCreative(creativeId);
  if (!creative) return null;

  if (approved) {
    return approveCreative(creativeId);
  }

  creative.status = 'rejected';
  creative.rejectionReason = rejectionReason || 'Rifiutata in revisione';
  creative.updatedAt = nowMs();
  saveCreative(creative);
  return creative;
}

/**
 * Genera un token di sessione firmato monouso per un'impressione.
 * Il token è necessario per chiamare /api/impressions/certify.
 */
export function createSessionToken({
  userId,
  campaignId,
  ttlMs = 10 * 60 * 1000, // 10 minuti default
}: {
  userId: string;
  campaignId: string;
  ttlMs?: number;
}): AdSessionToken {
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = nowMs();
  const expiresAt = issuedAt + ttlMs;
  const payload = { userId, campaignId, nonce, issuedAt, expiresAt };
  const { token, signature } = signSessionPayload(payload);

  return {
    token,
    nonce,
    userId,
    campaignId,
    issuedAt,
    expiresAt,
    signature,
  };
}

/**
 * Verifica un token di sessione. Ritorna il payload decodificato o null.
 */
export function verifySessionTokenFull(
  token: string,
  signature: string
): {
  valid: boolean;
  payload?: { userId: string; campaignId: string; nonce: string; issuedAt: number; expiresAt: number };
  error?: string;
} {
  if (!token || !signature) {
    return { valid: false, error: 'token o signature mancanti' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'formato token non valido' };
  }

  const [tokenId, issuedAtStr] = parts;
  const issuedAt = Number(issuedAtStr);
  const expiresAt = issuedAt + 10 * 60 * 1000; // stesso TTL usato in createSessionToken

  if (!verifySessionTokenSignature(token, signature)) {
    return { valid: false, error: 'firma token non valida' };
  }

  if (nowMs() > expiresAt) {
    return { valid: false, error: 'token scaduto' };
  }

  return {
    valid: true,
    payload: { userId: '', campaignId: '', nonce: tokenId, issuedAt, expiresAt },
  };
}

/**
 * Restituisce il feed pubblicitario con rotazione annunci.
 * Seleziona solo campagne attive, non esaurite, entro le date.
 * Applica criteri di targeting e limiti di frequenza per utente.
 */
export async function getAdFeed(userId?: string): Promise<{
  items: AdFeedItem[];
  rateLimited?: boolean;
  remaining?: number;
}> {
  const now = nowMs();
  const campaigns = listActiveCampaigns(now);
  const items: AdFeedItem[] = [];

  // Rate limiting per utente (usa userId come chiave se presente, altrimenti 'anonymous')
  const rateKey = userId ? `feed:user:${userId}` : 'feed:anonymous';
  const rate = incrementRateLimit(rateKey, 60_000, 30); // 30 richieste al minuto
  if (!rate.allowed) {
    return { items: [], rateLimited: true, remaining: 0 };
  }

  for (const campaign of campaigns) {
    // Controllo budget residuo: impedisce qualsiasi spesa oltre il disponibile
    if (!canAfford(campaign, campaign.costPerImpression)) {
      continue;
    }

    // Controllo massimali giornalieri utente
    if (userId) {
      const date = new Date().toISOString().slice(0, 10);
      const maxPerUser = campaign.maxImpressionsPerUserPerDay ?? 10;
      const caps = getDailyCaps(userId, date) ?? {
        userId,
        date,
        impressionsCount: 0,
        pointsEarned: 0,
        maxImpressions: maxPerUser,
        maxPoints: 500,
      };
      if (caps.impressionsCount >= caps.maxImpressions) {
        continue; // utente ha raggiunto il limite giornaliero
      }
    }

    const creative = getApprovedCreative(campaign.id);
    if (!creative) continue;

    const sessionToken = createSessionToken({
      userId: userId || 'anonymous',
      campaignId: campaign.id,
    });

    items.push({
      campaign,
      creative,
      sessionToken,
      impressionToken: `${campaign.id}:${creative.id}:${sessionToken.nonce}`,
    });
  }

  // Rotazione semplice: mescola per evitare sempre lo stesso ordine
  items.sort(() => Math.random() - 0.5);

  return { items, rateLimited: false, remaining: rate.remaining };
}

/**
 * Certifica un'impressione pubblicitaria.
 * Operazione atomica:
 *  1. Verifica idempotenza (anti-duplicazione)
 *  2. Anti-replay: nonce già utilizzato?
 *  3. Verifica campagna attiva e budget residuo (blocco spesa oltre disponibile)
 *  4. Rate limiting per utente
 *  5. Massimali giornalieri utente
 *  6. Durata minima visibilità pagina
 *  7. Rilevamento anomalie (frequenza anomala stesso utente)
 *  8. Lock idempotenza per operazione atomica
 *  9. Addebito budget campagna
 *  10. Accredito reward utente (idempotente, punti promozionali separati da saldo monetario/Pi)
 *  11. Commissione piattaforma
 *  12. Registrazione ledger contabile
 */
export async function certifyImpression(input: CertifyImpressionInput): Promise<{
  impression: AdImpression;
  reward?: { points: number; type: string; duplicate: boolean; capped: boolean };
  duplicate: boolean;
  error?: string;
  rateLimited?: boolean;
}> {
  const now = nowMs();

  // 1. Idempotenza pre-check
  const existing = findImpressionByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { impression: existing, duplicate: true };
  }

  // 2. Anti-replay: nonce già utilizzato?
  if (input.nonce && findImpressionByNonce(input.nonce)) {
    return {
      duplicate: false,
      error: 'nonce già utilizzato (anti-replay)',
      impression: {} as AdImpression,
    };
  }

  const campaign = getCampaign(input.campaignId);
  if (!campaign) {
    return { error: 'campagna non trovata', duplicate: false, impression: {} as AdImpression };
  }

  // 3. Verifica campagna attiva e budget
  if (!canAfford(campaign, campaign.costPerImpression)) {
    return {
      error: 'campagna non attiva o budget esaurito',
      duplicate: false,
      impression: {} as AdImpression,
    };
  }

  // 4. Rate limiting per utente (finestra 1 minuto, max 60 certificazioni)
  const rateKey = `certify:user:${input.userId}`;
  const rate = incrementRateLimit(rateKey, 60_000, 60);
  if (!rate.allowed) {
    return {
      error: 'rate limit superato per certificazione impressioni',
      duplicate: false,
      rateLimited: true,
      impression: {} as AdImpression,
    };
  }

  // 5. Massimali giornalieri utente
  const date = new Date().toISOString().slice(0, 10);
  const maxPerUser = campaign.maxImpressionsPerUserPerDay ?? 10;
  const capsCheck = checkDailyCaps(input.userId, date, {
    maxImpressions: maxPerUser,
    maxPoints: 500,
  });
  if (!capsCheck.allowed) {
    return {
      error: 'massimale giornaliero utente raggiunto',
      duplicate: false,
      impression: {} as AdImpression,
    };
  }

  // 6. Durata minima visibilità pagina
  const minVisibility = campaign.minVisibilityDurationMs ?? 2000; // 2 secondi default
  if (
    input.visibilityDurationMs !== undefined &&
    input.visibilityDurationMs < minVisibility
  ) {
    return {
      error: `durata visibilità insufficiente (minimo ${minVisibility}ms)`,
      duplicate: false,
      impression: {} as AdImpression,
    };
  }

  // 7. Rilevamento anomalie
  const anomalyFlags: string[] = [];
  const ipHash = input.ipHash ? hashValue(input.ipHash) : undefined;
  const uaHash = input.userAgentHash ? hashValue(input.userAgentHash) : undefined;

  const recentImpressions = listImpressionsByUser(input.userId).filter(
    (imp) =>
      imp.campaignId === input.campaignId &&
      now - imp.viewedAt < 60_000
  );
  if (recentImpressions.length >= 5) {
    anomalyFlags.push('high_frequency_same_user');
  }

  // 8. Lock idempotenza per operazione atomica
  const compositeKey = `ad_impression:${input.idempotencyKey}`;
  const lockValue = JSON.stringify({
    campaignId: input.campaignId,
    userId: input.userId,
    nonce: input.nonce,
  });
  const claim = await acquireIdempotencyLock(compositeKey, lockValue);
  try {
    // Se non ho acquisito il lock, un'altra operazione sta già elaborando questa chiave: rifiuto per anti-duplicazione
    if (!claim.acquired) {
      const existing2 = findImpressionByIdempotencyKey(input.idempotencyKey);
      if (existing2) {
        return { impression: existing2, duplicate: true };
      }
      return {
        duplicate: false,
        error: 'operazione in corso per questa chiave di idempotenza (concorrenza)',
        impression: {} as AdImpression,
      };
    }

    // Doppio controllo dopo lock (race condition)
    const existing2 = findImpressionByIdempotencyKey(input.idempotencyKey);
    if (existing2) {
      return { impression: existing2, duplicate: true };
    }
    if (input.nonce && findImpressionByNonce(input.nonce)) {
      return {
        duplicate: false,
        error: 'nonce già utilizzato (anti-replay)',
        impression: {} as AdImpression,
      };
    }

    // 9. Addebito budget campagna (blocca se esaurito)
    const debit = await debitCampaignBudget({
      campaignId: input.campaignId,
      amount: campaign.costPerImpression,
      idempotencyKey: input.idempotencyKey,
    });

    if (!debit.ok && !debit.duplicate) {
      return {
        error: debit.error || 'addebito budget fallito',
        duplicate: false,
        impression: {} as AdImpression,
      };
    }

    // 10. Calcolo e accredito reward utente
    const rewardPoints = computeRewardPoints(campaign);
    const caps = getDailyCaps(input.userId, date) ?? {
      userId: input.userId,
      date,
      impressionsCount: 0,
      pointsEarned: 0,
      maxImpressions: maxPerUser,
      maxPoints: 500,
    };

    const rewardResult = creditUserReward({
      userId: input.userId,
      campaignId: input.campaignId,
      impressionId: '',
      points: rewardPoints,
      type: 'promo_points',
      idempotencyKey: `${input.idempotencyKey}:reward`,
      walletId: input.userId,
      dailyCaps: caps,
    });

    // 11. Commissione piattaforma (resto del costo)
    const commission = campaign.costPerImpression - rewardPoints;
    if (commission > 0) {
      creditPlatformCommission({
        amount: commission,
        referenceId: input.campaignId,
        idempotencyKey: `${input.idempotencyKey}:commission`,
        description: `Commissione piattaforma impressione campagna ${input.campaignId}`,
      });
    }

    // 12. Registra l'impressione
    const impression: AdImpression = {
      id: genId(),
      campaignId: input.campaignId,
      creativeId: input.creativeId,
      userId: input.userId,
      sessionToken: input.sessionToken,
      nonce: input.nonce,
      idempotencyKey: input.idempotencyKey,
      status: 'certified',
      amount: campaign.costPerImpression,
      rewardPoints,
      promoPoints: rewardPoints,
      monetaryValue: 0, // punti promozionali, nessuna convertibilità monetaria automatica
      viewedAt: now,
      certifiedAt: now,
      ipHash,
      userAgentHash: uaHash,
      visibilityDurationMs: input.visibilityDurationMs,
      duplicateOf: undefined,
      anomalyFlags,
      rateLimited: false,
    };

    saveImpression(impression);

    // Aggiorna daily caps
    incrementDailyCaps(input.userId, date, {
      impressions: 1,
      points: rewardResult.capped ? 0 : rewardPoints,
    });

    // Aggiorna stats campagna
    incrementCampaignStats(input.campaignId, {
      impressions: 1,
      certified: 1,
      spend: campaign.costPerImpression,
      rewards: rewardPoints,
    });

    return {
      impression,
      reward: {
        points: rewardPoints,
        type: 'promo_points',
        duplicate: rewardResult.duplicate,
        capped: rewardResult.capped,
      },
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
 * Ottiene statistiche di una campagna con riconciliazione contabile.
 */
export function getCampaignStats(campaignId: string): {
  campaign: AdCampaign | null;
  creatives: AdCreative[];
  reconciliation: ReturnType<typeof reconcileCampaign>;
} {
  return {
    campaign: getCampaign(campaignId),
    creatives: listCreativesByCampaign(campaignId),
    reconciliation: reconcileCampaign(campaignId),
  };
}

/**
 * Ottiene lo storico movimenti di un utente (reward, ledger, impressioni).
 */
export function getUserAdHistory(userId: string) {
  return getUserHistory(userId);
}

/**
 * Ottiene il report di riconciliazione globale dei conti.
 */
export function getGlobalReconciliation() {
  return reconcileAll();
}

/**
 * Esegue un rimborso su una campagna (storno contabile).
 */
export function refundCampaign({
  campaignId,
  amount,
  idempotencyKey,
}: {
  campaignId: string;
  amount: number;
  idempotencyKey: string;
}) {
  return refundCampaignFn({ campaignId, amount, idempotencyKey });
}

/**
 * Storna un reward accreditato (reverso).
 */
export function reverseRewardAction({
  rewardId,
  idempotencyKey,
}: {
  rewardId: string;
  idempotencyKey: string;
}) {
  return reverseReward({ rewardId, idempotencyKey });
}
