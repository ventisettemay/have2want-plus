import type { CloudflareEnv, CampaignRow, ExecutionContext } from './types';
import { WEBHOOK_SECRET, verifyWebhookSignature, generateId, nowMs } from './auth';
import {
  getCampaign,
  createCampaign,
  updateCampaignStatus,
  incrementCampaignStats,
  listActiveCampaigns,
  getImpressionByIdempotency,
  createImpression,
  incrementProviderUsage,
  getSubscriptionByAdvertiser,
  createSubscription,
  getOrder,
  createOrder,
  updateOrderStatus,
  addOrderMessage,
} from './db';
import { generateImage, moderateVision } from './ai';
import { presignUpload, cleanupExpiredR2Files } from './r2';

/* ------------------------------------------------------------------ */
/* Costi listino Blocco 2 (Pi, sconto -50% già applicato)             */
/* ------------------------------------------------------------------ */

const SUBSCRIPTION_LEVELS: Record<string, { pricePi: number; durationDays: number }> = {
  base: { pricePi: 0, durationDays: 30 },
  vetrina: { pricePi: 250, durationDays: 30 },
  inserzionista: { pricePi: 1000, durationDays: 30 },
};

/* ------------------------------------------------------------------ */
/* Helper di risposta JSON                                            */
/* ------------------------------------------------------------------ */

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}

function errorResponse(message: string, code: string, status = 400): Response {
  return json({ success: false, error: message, code }, status);
}

/* ------------------------------------------------------------------ */
/* Verifica abbonamento attivo per inserzionista                      */
/* ------------------------------------------------------------------ */

async function requireSubscription(
  env: CloudflareEnv,
  advertiserId: string,
  requiredLevel: 'vetrina' | 'inserzionista'
): Promise<{ ok: boolean; response?: Response }> {
  const sub = await getSubscriptionByAdvertiser(env.DB, advertiserId);
  if (!sub || sub.status !== 'active') {
    return { ok: false, response: errorResponse(`Abbonamento '${requiredLevel}' richiesto e non attivo`, 'SUBSCRIPTION_REQUIRED', 403) };
  }
  const levelOrder = { base: 0, vetrina: 1, inserzionista: 2 };
  if (levelOrder[sub.level] < levelOrder[requiredLevel]) {
    return { ok: false, response: errorResponse(`Livello abbonamento insufficiente: richiesto '${requiredLevel}', attivo '${sub.level}'`, 'SUBSCRIPTION_INSUFFICIENT', 403) };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Invio webhook AD_IMPRESSION_VERIFIED a Blocco 1                    */
/* ------------------------------------------------------------------ */

async function sendAdImpressionVerifiedWebhook(
  env: CloudflareEnv,
  payload: {
    impressionId: string;
    userId: string;
    campaignId: string;
    points: number;
    timestamp: number;
    idempotencyKey: string;
  },
  blocco1WebhookUrl: string
): Promise<void> {
  const body = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const signature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await fetch(`${blocco1WebhookUrl}/webhooks/ad-impression-verified`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
    },
    body,
  });
}

/* ------------------------------------------------------------------ */
/* Rate limiting semplice per utente (memoria/KV)                     */
/* ------------------------------------------------------------------ */

async function checkRateLimitKV(
  env: CloudflareEnv,
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rl:${identifier}`;
  const raw = await env.ADS_KV.get(key);
  const now = nowMs();
  let count = 0;
  let windowStart = now;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (now - parsed.windowStart < windowMs) {
        count = parsed.count;
        windowStart = parsed.windowStart;
      }
    } catch {
      // ignora, ricomincia
    }
  }

  count++;
  const remaining = Math.max(0, maxRequests - count);
  const allowed = count <= maxRequests;

  await env.ADS_KV.put(key, JSON.stringify({ count, windowStart }), { expirationTtl: Math.ceil(windowMs / 1000) });

  return { allowed, remaining };
}

/* ------------------------------------------------------------------ */
/* Frequency capping per utente/campagna (KV)                         */
/* ------------------------------------------------------------------ */

async function checkFrequencyCap(
  env: CloudflareEnv,
  userId: string,
  campaignId: string,
  maxPerDay: number
): Promise<{ allowed: boolean }> {
  const dayKey = Math.floor(nowMs() / (24 * 60 * 60 * 1000));
  const key = `fc:${userId}:${campaignId}:${dayKey}`;
  const raw = await env.ADS_KV.get(key);
  let count = 0;
  if (raw) {
    try { count = parseInt(raw, 10) || 0; } catch { count = 0; }
  }
  if (count >= maxPerDay) {
    return { allowed: false };
  }
  await env.ADS_KV.put(key, String(count + 1), { expirationTtl: 24 * 60 * 60 });
  return { allowed: true };
}

/* ------------------------------------------------------------------ */
/* Cache KV feed annunci (60s)                                        */
/* ------------------------------------------------------------------ */

async function getCachedFeed(
  env: CloudflareEnv,
  cacheKey: string,
  fetchFn: () => Promise<any>
): Promise<any> {
  const raw = await env.ADS_KV.get(cacheKey);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ricomincia */ }
  }
  const data = await fetchFn();
  await env.ADS_KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
  return data;
}

/* ------------------------------------------------------------------ */
/* Route handler                                                      */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const blocco1WebhookUrl = (env as any).BLOCCO1_WEBHOOK_URL ?? '';

    /* -------------------------------------------------------------- */
    // POST /webhooks/campaign-paid — Blocco 1 notifica pagamento Pi
    /* -------------------------------------------------------------- */
    if (path === '/webhooks/campaign-paid' && request.method === 'POST') {
      const rawBody = await request.arrayBuffer();
      const signature = request.headers.get('x-webhook-signature');
      if (!(await verifyWebhookSignature(WEBHOOK_SECRET, signature ?? '', rawBody))) {
        return errorResponse('Firma webhook non valida', 'WEBHOOK_SIGNATURE_INVALID', 401);
      }

      const payload = JSON.parse(new TextDecoder().decode(rawBody)) as {
        paymentId: string;
        txid: string;
        campaignId: string;
        amountPi: number;
        advertiserId: string;
        idempotencyKey: string;
      };

      if (!payload || !payload.paymentId || !payload.campaignId || !payload.advertiserId || !payload.idempotencyKey) {
        return errorResponse('Payload webhook incompleto', 'WEBHOOK_PAYLOAD_INVALID', 400);
      }

      // Idempotenza su idempotencyKey
      const existing = await getCampaign(env.DB, `idem:${payload.idempotencyKey}`);
      if (existing) {
        return json({ success: true, duplicate: true, campaignId: existing.id });
      }

      const campaignId = payload.campaignId;
      const campaign = await getCampaign(env.DB, campaignId);
      if (!campaign) {
        return errorResponse('Campagna non trovata', 'CAMPAIGN_NOT_FOUND', 404);
      }

      await updateCampaignStatus(env.DB, campaignId, 'active');

      // Marca idempotenza (usiamo una campagna fittizia come marker)
      await createCampaign(env.DB, {
        ...campaign,
        id: `idem:${payload.idempotencyKey}`,
        idempotency_key: payload.idempotencyKey,
        title: `[idempotency-marker] ${campaign.title}`,
        budget_total: 0,
        budget_remaining: 0,
      } as CampaignRow);

      return json({
        success: true,
        campaignId,
        status: 'active',
        paymentId: payload.paymentId,
        txid: payload.txid,
      });
    }

    /* -------------------------------------------------------------- */
    // POST /api/uploads/presign — presign upload diretto su R2
    /* -------------------------------------------------------------- */
    if (path === '/api/uploads/presign' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { fileName, contentType, sizeBytes, advertiserId } = body as {
        fileName?: string;
        contentType?: string;
        sizeBytes?: number;
        advertiserId?: string;
      };
      if (!fileName || !contentType || !advertiserId) {
        return errorResponse('Campi obbligatori: fileName, contentType, advertiserId', 'VALIDATION_ERROR', 400);
      }
      const result = await presignUpload(env, { fileName, contentType, sizeBytes, advertiserId });
      if (result.error) {
        return errorResponse(result.error, 'VALIDATION_ERROR', 400);
      }
      return json({ success: true, uploadUrl: result.uploadUrl, fileKey: result.fileKey });
    }

    /* -------------------------------------------------------------- */
    // POST /api/campaigns — crea campagna + abbonamento
    /* -------------------------------------------------------------- */
    if (path === '/api/campaigns' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const {
        advertiserId,
        advertiserUsername,
        title,
        description,
        budgetTotal,
        costPerImpression,
        rewardPercentToUser,
        targeting,
        pricing,
        idempotencyKey,
        subscriptionLevel,
      } = body as {
        advertiserId?: string;
        advertiserUsername?: string;
        title?: string;
        description?: string;
        budgetTotal?: number;
        costPerImpression?: number;
        rewardPercentToUser?: number;
        targeting?: Record<string, unknown>;
        pricing?: Record<string, unknown>;
        idempotencyKey?: string;
        subscriptionLevel?: 'vetrina' | 'inserzionista';
      };

      if (!advertiserId || !title || !budgetTotal) {
        return errorResponse('Campi obbligatori: advertiserId, title, budgetTotal', 'VALIDATION_ERROR', 400);
      }

      // Se inserzionista, richiede abbonamento attivo
      if (subscriptionLevel) {
        const subCheck = await requireSubscription(env, advertiserId, subscriptionLevel);
        if (!subCheck.ok) return subCheck.response!;
      }

      const id = generateId();
      const now = nowMs();

      await createCampaign(env.DB, {
        id,
        advertiser_id: advertiserId,
        advertiser_username: advertiserUsername ?? null,
        title,
        description: description ?? null,
        budget_total: budgetTotal,
        budget_remaining: budgetTotal,
        cost_per_impression: costPerImpression ?? 1,
        reward_percent_to_user: rewardPercentToUser ?? 10,
        status: 'draft',
        targeting: targeting ? JSON.stringify(targeting) : undefined,
        pricing: pricing ? JSON.stringify(pricing) : undefined,
        creative_ids: '[]',
        stats: '{}',
        created_at: now,
        updated_at: now,
        idempotency_key: idempotencyKey ?? null,
      } as unknown as CampaignRow);

      // Se specificato livello abbonamento, crea/aggiorna subscription
      if (subscriptionLevel) {
        const levelInfo = SUBSCRIPTION_LEVELS[subscriptionLevel];
        if (levelInfo) {
          const startDate = now;
          const endDate = startDate + levelInfo.durationDays * 24 * 60 * 60 * 1000;
          await createSubscription(env.DB, {
            id: generateId(),
            advertiser_id: advertiserId,
            level: subscriptionLevel,
            price_pi: levelInfo.pricePi,
            start_date: startDate,
            end_date: endDate,
          });
        }
      }

      return json({ success: true, campaign: { id, advertiserId, title, status: 'draft', budgetTotal } }, 201);
    }

    /* -------------------------------------------------------------- */
    // GET /api/feed/ads — feed con cache KV 60s e frequency capping
    /* -------------------------------------------------------------- */
    if (path === '/api/feed/ads' && request.method === 'GET') {
      const countryCode = url.searchParams.get('countryCode') ?? undefined;
      const category = url.searchParams.get('category') ?? undefined;
      const limit = parseInt(url.searchParams.get('limit') ?? '20', 10) || 20;
      const userId = url.searchParams.get('userId') ?? 'anonymous';

      const cacheKey = `feed:${countryCode ?? 'all'}:${category ?? 'all'}:${limit}`;

      const data = await getCachedFeed(env, cacheKey, async () => {
        const campaigns = await listActiveCampaigns(env.DB, { countryCode, category, limit });
        return { success: true, campaigns, count: campaigns.length, cached: false };
      });

      // Frequency capping per utente
      const fc = await checkFrequencyCap(env, userId, 'feed', 100);
      if (!fc.allowed) {
        return errorResponse('Limite giornaliero feed raggiunto', 'RATE_LIMITED', 429);
      }

      return json({ ...data, cached: true });
    }

    /* -------------------------------------------------------------- */
    // POST /api/impressions/certify — certificazione impressione
    /* -------------------------------------------------------------- */
    if (path === '/api/impressions/certify' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const {
        campaignId,
        userId,
        sessionToken,
        nonce,
        idempotencyKey,
        amount,
        creativeId,
        ipHash,
        userAgentHash,
        visibilityDurationMs,
      } = body as {
        campaignId?: string;
        userId?: string;
        sessionToken?: string;
        nonce?: string;
        idempotencyKey?: string;
        amount?: number;
        creativeId?: string;
        ipHash?: string;
        userAgentHash?: string;
        visibilityDurationMs?: number;
      };

      if (!campaignId || !userId || !sessionToken || !nonce || !idempotencyKey) {
        return errorResponse('Campi obbligatori: campaignId, userId, sessionToken, nonce, idempotencyKey', 'VALIDATION_ERROR', 400);
      }

      // Idempotenza
      const existing = await getImpressionByIdempotency(env.DB, idempotencyKey);
      if (existing) {
        return json({ success: true, duplicate: true, impression: existing }, 200);
      }

      // Frequency cap per utente/campagna
      const campaign = await getCampaign(env.DB, campaignId);
      if (!campaign) {
        return errorResponse('Campagna non trovata', 'CAMPAIGN_NOT_FOUND', 404);
      }
      const maxPerDay = campaign.targeting ? (JSON.parse(campaign.targeting) as { maxFrequencyPerUserPerDay?: number }).maxFrequencyPerUserPerDay ?? 10 : 10;
      const fc = await checkFrequencyCap(env, userId, campaignId, maxPerDay);
      if (!fc.allowed) {
        return errorResponse('Limite giornaliero impressioni raggiunto', 'RATE_LIMITED', 429);
      }

      // Rate limiting generico
      const rl = await checkRateLimitKV(env, `imp:${userId}`, 60, 60_000);
      if (!rl.allowed) {
        return errorResponse('Rate limit impressioni superato', 'RATE_LIMITED', 429);
      }

      // Seleziona creatività approvata
      const creativeIdFinal = creativeId || (campaign.creative_ids ? (JSON.parse(campaign.creative_ids) as string[])[0] : null);
      if (!creativeIdFinal) {
        return errorResponse('Nessuna creatività disponibile per questa campagna', 'NO_CREATIVE', 400);
      }

      const rewardPoints = Math.round(((amount ?? campaign.cost_per_impression) * campaign.reward_percent_to_user) / 100);
      const now = nowMs();

      await createImpression(env.DB, {
        id: generateId(),
        campaign_id: campaignId,
        creative_id: creativeIdFinal,
        user_id: userId,
        session_token: sessionToken,
        nonce,
        idempotency_key: idempotencyKey,
        status: 'certified',
        amount: amount ?? campaign.cost_per_impression,
        reward_points: rewardPoints,
        promo_points: rewardPoints,
        monetary_value: amount ?? campaign.cost_per_impression,
        viewed_at: now,
        certified_at: now,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        visibility_duration_ms: visibilityDurationMs,
        duplicate_of: null,
        anomaly_flags: '[]',
        rate_limited: 0,
      });

      await incrementCampaignStats(env.DB, campaignId, { impressions: 1, certified: 1, spend: amount ?? campaign.cost_per_impression, rewards: rewardPoints });

      // Invio webhook AD_IMPRESSION_VERIFIED a Blocco 1
      if (blocco1WebhookUrl) {
        try {
          await sendAdImpressionVerifiedWebhook(env, {
            impressionId: generateId(),
            userId,
            campaignId,
            points: rewardPoints,
            timestamp: now,
            idempotencyKey: `imp_${idempotencyKey}`,
          }, blocco1WebhookUrl);
        } catch {
          // Non bloccare la certificazione se webhook fallisce
        }
      }

      return json({
        success: true,
        duplicate: false,
        impression: { id: generateId(), campaignId, creativeId: creativeIdFinal, userId, status: 'certified', amount: amount ?? campaign.cost_per_impression, rewardPoints },
        reward: { points: rewardPoints, type: 'promo_points' },
      }, 201);
    }

    /* -------------------------------------------------------------- */
    // POST /api/ai/generate-image — generazione immagini AI
    /* -------------------------------------------------------------- */
    if (path === '/api/ai/generate-image' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { prompt, width, height } = body as { prompt?: string; width?: number; height?: number };
      if (!prompt) return errorResponse('Campo obbligatorio: prompt', 'VALIDATION_ERROR', 400);
      const result = await generateImage(env, prompt, { width, height });
      return json({ success: true, ...result });
    }

    /* -------------------------------------------------------------- */
    // POST /api/ai/moderate — moderazione & vision
    /* -------------------------------------------------------------- */
    if (path === '/api/ai/moderate' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { text, imageDataUrl } = body as { text?: string; imageDataUrl?: string };
      if (!text && !imageDataUrl) return errorResponse('Campo obbligatorio: text o imageDataUrl', 'VALIDATION_ERROR', 400);
      const result = await moderateVision(env, { text, imageDataUrl });
      return json({ success: true, ...result });
    }

    /* -------------------------------------------------------------- */
    // POST /api/ads/orders — ordine creativo
    /* -------------------------------------------------------------- */
    if (path === '/api/ads/orders' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const {
        advertiserId,
        advertiserUsername,
        creatorId,
        creatorUsername,
        type,
        title,
        description,
        priority,
        budgetPi,
        deadline,
        targetingCountryCode,
        idempotencyKey,
      } = body as {
        advertiserId?: string;
        advertiserUsername?: string;
        creatorId?: string;
        creatorUsername?: string;
        type?: 'banner' | 'video';
        title?: string;
        description?: string;
        priority?: 'low' | 'normal' | 'high';
        budgetPi?: number;
        deadline?: number;
        targetingCountryCode?: string;
        idempotencyKey?: string;
      };
      if (!advertiserId || !title || !type) {
        return errorResponse('Campi obbligatori: advertiserId, title, type', 'VALIDATION_ERROR', 400);
      }
      const id = generateId();
      const now = nowMs();
      await createOrder(env.DB, {
        id,
        advertiserId,
        advertiserUsername,
        creatorId,
        creatorUsername,
        type,
        title,
        description,
        status: 'requested',
        priority: priority ?? 'normal',
        budgetPi,
        deadline,
        targetingCountryCode,
        created_at: now,
        updated_at: now,
        idempotencyKey,
      });
      return json({ success: true, order: { id, advertiserId, title, type, status: 'requested' } }, 201);
    }

    /* -------------------------------------------------------------- */
    // Fallback 404
    /* -------------------------------------------------------------- */
    return json({ success: false, error: 'Endpoint non trovato', code: 'NOT_FOUND' }, 404);
  },

  /* ------------------------------------------------------------------ */
  // Cron trigger giornaliero — pulizia R2 a +7 giorni
  /* ------------------------------------------------------------------ */
  async scheduled(controller: any, env: CloudflareEnv, ctx: ExecutionContext): Promise<void> {
    const now = nowMs();
    const deleted = await cleanupExpiredR2Files(env, now);
    console.log(`Pulizia R2 completata: ${deleted} file eliminati`);
    // Reset quote provider giornaliere se necessario
    const providers = await import('./db').then((m) => m.getProviders(env.DB));
    const nowTs = nowMs();
    for (const p of providers) {
      if (nowTs >= p.reset_at) {
        await import('./db').then((m) => m.resetProviderQuotas(env.DB, nowTs + 24 * 60 * 60 * 1000));
      }
    }
  },
};
