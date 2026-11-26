import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

import type {
  CreateCampaignInput,
  CertifyImpressionInput,
} from './src/lib/adTypes';
import {
  createCampaign as adCreateCampaign,
  getAdFeed as adGetAdFeed,
  addCreative as adAddCreative,
  toggleCampaign as adToggleCampaign,
  getCampaignStats as adGetCampaignStats,
  reviewCreative as adReviewCreative,
  createSessionToken as adCreateSessionToken,
  verifySessionTokenFull as adVerifySessionTokenFull,
  certifyImpression as adCertifyImpression,
  getPresignUpload as adGetPresignUpload,
  getUserAdHistory as adGetUserAdHistory,
  getGlobalReconciliation as adGetGlobalReconciliation,
  refundCampaign as adRefundCampaign,
  reverseRewardAction as adReverseRewardAction,
} from './src/lib/adService';
import {
  createOrder as adCreateOrder,
  listAllOrders as adListAllOrders,
  listOrdersByAdvertiser as adListOrdersByAdvertiser,
  listOrdersByCreator as adListOrdersByCreator,
  getOrder as adGetOrder,
  updateOrderStatus as adUpdateOrderStatus,
  assignCreator as adAssignCreator,
  submitDraft as adSubmitDraft,
  addOrderMessage as adAddOrderMessage,
  listOrderMessages as adListOrderMessages,
  reviewOrder as adReviewOrder,
  deleteOrder as adDeleteOrder,
  linkOrderToCreative as adLinkOrderToCreative,
  flushStore as adOrdersFlushStore,
  resetForTests as adOrdersResetForTests,
  type CreateCreativeOrderInput,
  type SubmitDraftInput,
  type ReviewOrderInput,
  type ChangeOrderStatusInput,
} from './src/lib/adOrders';
import {
  adsAuthMiddleware,
  adsRoleMiddleware,
  adsRateLimitMiddleware,
  writeAuditLog,
  getAuditLog,
  authenticateRequest,
  authorizeRole,
  validateFileUpload,
  validateUrlNoSsrf,
  type AdRole,
} from './src/lib/adSecurity';
import {
  adProviderRegistry,
  type ModerationInput,
  type AnalyzeInput,
  type GenerateAssetInput,
} from './src/lib/adProviderRegistry';
import {
  getProject as adGetProject,
  listProjectsByAdvertiser as adListProjectsByAdvertiser,
  createProject as adCreateProject,
  updateProject as adUpdateProject,
  deleteProject as adDeleteProject,
  exportProject as adExportProject,
  resetCreativeStoreForTests as adCreativeStoreResetForTests,
  getMedia as adGetMedia,
  listMediaByAdvertiser as adListMediaByAdvertiser,
  addMedia as adAddMedia,
  deleteMedia as adDeleteMedia,
} from './src/lib/adCreativeStore';
import {
  saveWalletToCloud as fwSaveWalletToCloud,
  loadWalletFromCloud as fwLoadWalletFromCloud,
  normalizeWalletId as fwNormalizeWalletId,
} from './src/lib/firestoreService';

const VALIDATION_KEY = '41d098c27068bf811f67caeefe5dc094a6304c413d84b17e9e0c5ae364e3af4ac4086bc073ce287d5bdc3f21cdf45a09ea1f1a842d5a6ccd784777aae7a286b7';
const PI_API_BASE = 'https://api.minepi.com/v2';

// --- Webhook inter-blocco (HMAC-SHA256) ---
const WEBHOOK_SECRET = (process.env.WEBHOOK_SECRET || 'dev_secret_change_me').trim();
const BLOCCO2_WEBHOOK_URL = (process.env.BLOCCO2_WEBHOOK_URL || '').replace(/\/$/, '');

function computeHmacSha256(rawBody: string | Buffer): string {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
}

function verifyWebhookSignature(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const signature = req.headers['x-webhook-signature'] as string | undefined;
  if (!signature) {
    res.status(401).json({ success: false, error: 'Firma webhook mancante', code: 'WEBHOOK_SIGNATURE_MISSING' });
    return;
  }
  const rawBody = (req.body as Buffer) ?? '';
  const expected = computeHmacSha256(rawBody);
  // Confronto a tempo costante per evitare timing attack
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    res.status(401).json({ success: false, error: 'Firma webhook non valida', code: 'WEBHOOK_SIGNATURE_INVALID' });
    return;
  }
  next();
}

function getConfiguredPiApiKey(): string {
  const key = (process.env.PI_API_KEY || '').trim();
  if (!key || key === 'MY_PI_API_KEY' || key === 'PLACEHOLDER') return '';
  return key;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Support process.env.PORT (Render/Railway/Cloud Run) and CLI arguments (--port)
  const args = process.argv.slice(2);
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
  let parsedPort = Number.isFinite(envPort) && envPort > 0 ? envPort : 3000;
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
      parsedPort = parseInt(args[i + 1], 10);
    }
  }
  const PORT = parsedPort || 3000;

  // 1. CORS permissivo per tutti i domini (richiesto da Pi Network e bot di validazione)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Header anti-cache rigorosi per Pi Browser mobile (previene blocco cache su smartphone)
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    if (ua.includes('pibrowser') || ua.includes('pinetwork') || req.url === '/' || req.url.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // 2. Rotta GET esplicita per /validation-key.txt (Massima Priorità Assoluta)
  const sendValidationKey = (_req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Length', '128');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(VALIDATION_KEY);
  };

  app.get('/validation-key.txt', sendValidationKey);
  app.get('/.well-known/validation-key.txt', sendValidationKey);

  // Pagine Legali e Policy accessibili sia con che senza estensione .html
  app.get(['/privacy', '/privacy.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'privacy.html'));
  });
  app.get(['/terms', '/terms.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'terms.html'));
  });
  app.get(['/specifiche', '/specifiche_tecniche_progetto', '/specifiche_tecniche_progetto.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'specifiche_tecniche_progetto.html'));
  });

  // 3. Cartelle statiche pubbliche esplicite con supporto MIME .txt
  const publicDir = path.join(process.cwd(), 'public');
  const distDir = path.join(process.cwd(), 'dist');

  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.txt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      }
    }));
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    const apiKey = getConfiguredPiApiKey();
    res.json({
      status: 'ok',
      validationKeyAvailable: true,
      piApiConfigured: Boolean(apiKey),
      piMode: apiKey ? 'live_pi_api' : 'structured_fallback',
    });
  });

  // Pi Network SDK Backend Config
  app.get('/api/pi/config', (_req, res) => {
    const apiKey = getConfiguredPiApiKey();
    res.json({
      sandbox: process.env.VITE_PI_SANDBOX === 'true',
      serverConfigured: Boolean(apiKey),
      mode: apiKey ? 'live_pi_api' : 'unavailable',
    });
  });

  // Pi Network Payment Server-Side Approval (/api/pi/approve)
  app.post('/api/pi/approve', async (req, res) => {
    const { paymentId } = req.body || {};
    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({ approved: false, error: 'paymentId mancante o non valido' });
    }

    const apiKey = getConfiguredPiApiKey();
    if (!apiKey) {
      return res.status(503).json({
        approved: false,
        paymentId,
        mode: 'unavailable',
        error: 'PI_API_KEY non configurata: il pagamento non può essere approvato e verificato.',
      });
    }

    try {
      const upstream = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          approved: false,
          paymentId,
          mode: 'live_pi_api',
          error: data?.message || `Pi API HTTP ${upstream.status}`,
          details: data,
        });
      }
      return res.status(200).json({
        approved: true,
        paymentId,
        mode: 'live_pi_api',
        payment: data,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(502).json({
        approved: false,
        paymentId,
        mode: 'live_pi_api',
        error: err?.message || 'Errore connessione server Pi Network',
      });
    }
  });

  // Pi Network Payment Server-Side Completion (/api/pi/complete)
  app.post('/api/pi/complete', async (req, res) => {
    const { paymentId, txid, campaignId, amountPi, advertiserId, idempotencyKey } = req.body || {};
    if (!paymentId || typeof paymentId !== 'string' || !txid || typeof txid !== 'string') {
      return res.status(400).json({ completed: false, error: 'paymentId e txid obbligatori' });
    }

    const apiKey = getConfiguredPiApiKey();
    if (!apiKey) {
      return res.status(503).json({
        completed: false,
        paymentId,
        txid,
        mode: 'unavailable',
        error: 'PI_API_KEY non configurata: il pagamento non può essere completato e verificato.',
      });
    }

    try {
      const upstream = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          completed: false,
          paymentId,
          txid,
          mode: 'live_pi_api',
          error: data?.message || `Pi API HTTP ${upstream.status}`,
          details: data,
        });
      }

      // Notifica Blocco 2 (campagna pagata) se URL webhook configurata
      if (BLOCCO2_WEBHOOK_URL) {
        try {
          await sendCampaignPaidWebhook({
            paymentId,
            txid,
            campaignId: campaignId || '',
            amountPi: amountPi ?? 0,
            advertiserId: advertiserId || '',
            idempotencyKey: idempotencyKey || `camp_paid_${paymentId}`,
          });
        } catch (webhookErr) {
          // Non blocca il completamento Pi se il webhook al Blocco 2 fallisce
          console.warn('Webhook CAMPAIGN_PAID verso Blocco 2 fallito:', webhookErr?.message || webhookErr);
        }
      }

      return res.status(200).json({
        completed: true,
        paymentId,
        txid,
        mode: 'live_pi_api',
        payment: data,
        timestamp: new Date().toISOString(),
        webhookCampaignPaidSent: Boolean(BLOCCO2_WEBHOOK_URL),
      });
    } catch (err: any) {
      return res.status(502).json({
        completed: false,
        paymentId,
        txid,
        mode: 'live_pi_api',
        error: err?.message || 'Errore completamento pagamento Pi Network',
      });
    }
  });

  // --- Invio webhook CAMPAIGN_PAID verso Blocco 2 (Worker + D1 + R2) ---
  async function sendCampaignPaidWebhook(payload: {
    paymentId: string;
    txid: string;
    campaignId: string;
    amountPi: number;
    advertiserId: string;
    idempotencyKey: string;
  }): Promise<void> {
    if (!BLOCCO2_WEBHOOK_URL) return;
    const body = JSON.stringify(payload);
    const signature = computeHmacSha256(body);
    await fetch(`${BLOCCO2_WEBHOOK_URL}/webhooks/campaign-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
      },
      body,
    });
  }

  // --- Ricezione webhook AD_IMPRESSION_VERIFIED dal Blocco 2 ---
  app.post(
    '/webhooks/ad-impression-verified',
    express.raw({ type: 'application/json' }),
    verifyWebhookSignature,
    async (req, res) => {
      try {
        const raw = req.body as Buffer;
        const payload = JSON.parse(raw.toString('utf8')) as {
          impressionId: string;
          userId: string;
          campaignId: string;
          points: number;
          timestamp: number;
          idempotencyKey: string;
        };
        if (!payload || !payload.impressionId || !payload.userId || !payload.campaignId || !payload.points) {
          return res.status(400).json({ success: false, error: 'Payload webhook incompleto', code: 'WEBHOOK_PAYLOAD_INVALID' });
        }

        const walletId = fwNormalizeWalletId(payload.userId);
        let wallet = await fwLoadWalletFromCloud(walletId);
        if (!wallet) {
          wallet = {
            walletId,
            pointsBalance: 0,
            totalPointsEarned: 0,
            merchantPiBalance: 0,
            pioneerUsername: '@user',
            pioneerWalletAddress: '',
            history: [],
            updatedAt: Date.now(),
          };
        }

        const pointsToAward = payload.points && payload.points > 0 ? payload.points : 5;

        const tx: any = {
          id: `tx_webhook_adimp_${payload.impressionId}`,
          type: 'AD_IMPRESSION_VERIFIED',
          description: 'Visione pubblicitaria certificata (webhook Blocco 2)',
          pointsDelta: pointsToAward,
          piEquivalent: Number((pointsToAward / 1000).toFixed(4)),
          timestamp: payload.timestamp || Date.now(),
          status: 'completed',
          campaignId: payload.campaignId,
          impressionId: payload.impressionId,
        };

        // Idempotenza: evita doppia accredito se stesso impressionId già presente
        const alreadyExists = Array.isArray(wallet.history) && wallet.history.some(
          (t: any) => t.impressionId === payload.impressionId && t.type === 'AD_IMPRESSION_VERIFIED'
        );
        if (alreadyExists) {
          return res.status(200).json({ success: true, duplicate: true, credited: 0 });
        }

        wallet.pointsBalance = Number((wallet.pointsBalance + pointsToAward).toFixed(0));
        wallet.totalPointsEarned = Number((wallet.totalPointsEarned + pointsToAward).toFixed(0));
        wallet.history.unshift(tx);
        wallet.updatedAt = Date.now();

        await fwSaveWalletToCloud(walletId, {
          walletId: wallet.walletId,
          pointsBalance: wallet.pointsBalance,
          totalPointsEarned: wallet.totalPointsEarned,
          merchantPiBalance: wallet.merchantPiBalance,
          pioneerUsername: wallet.pioneerUsername,
          pioneerWalletAddress: wallet.pioneerWalletAddress,
          adStreamEnabled: wallet.adStreamEnabled,
          adCompletedStreak: wallet.adCompletedStreak,
          history: wallet.history,
          updatedAt: wallet.updatedAt,
        });

        return res.status(200).json({
          success: true,
          duplicate: false,
          credited: pointsToAward,
          newBalance: wallet.pointsBalance,
          impressionId: payload.impressionId,
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore elaborazione webhook AD_IMPRESSION_VERIFIED', code: 'WEBHOOK_PROCESSING_ERROR' });
      }
    }
  );

  // Pi Network App-to-User (A2U) Withdrawal Endpoint (/api/pi/withdraw)
  app.post('/api/pi/withdraw', async (req, res) => {
    const { requestedPi, walletAddress, pioneerUsername, uid } = req.body || {};
    const amountNum = Number(requestedPi);
    if (!Number.isFinite(amountNum) || amountNum < 0.5) {
      return res.status(400).json({
        success: false,
        error: 'La soglia minima di prelievo è di 0.50 π.',
      });
    }
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo Pi Wallet o Username Pioneer non valido.',
      });
    }

    const feeDeducted = 0.01;
    const netPiSent = Number((amountNum - feeDeducted).toFixed(4));
    const apiKey = getConfiguredPiApiKey();

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        mode: 'unavailable',
        error: 'PI_API_KEY non configurata: il prelievo non può essere eseguito.',
      });
    }
    if (!uid || typeof uid !== 'string') {
      return res.status(401).json({
        success: false,
        mode: 'live_pi_api',
        error: 'uid del pioniere mancante: autenticazione Pi richiesta.',
      });
    }

    if (apiKey && uid) {
      try {
        const upstream = await fetch(`${PI_API_BASE}/payments`, {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment: {
              amount: netPiSent,
              memo: `HAVE2WANT Rewards Payout (${pioneerUsername || walletAddress})`,
              metadata: {
                walletAddress: walletAddress.trim(),
                requestedPi: amountNum,
                feePi: feeDeducted,
                pioneerUsername: pioneerUsername || '@pioneer',
              },
              uid,
            },
          }),
        });
        const data = await upstream.json().catch(() => ({}));
        if (upstream.ok && data?.identifier) {
          return res.status(200).json({
            success: true,
            mode: 'live_pi_api',
            paymentId: data.identifier,
            txHash: data.transaction?.txid || `pi_a2u_${data.identifier}`,
            netPiSent,
            feeDeducted,
            walletAddress: walletAddress.trim(),
            timestamp: new Date().toISOString(),
          });
        }
        return res.status(upstream.status || 502).json({
          success: false,
          mode: 'live_pi_api',
          error: data?.message || 'Errore creazione pagamento A2U su Pi Platform API',
        });
      } catch (err: any) {
        return res.status(502).json({
          success: false,
          mode: 'live_pi_api',
          error: err?.message || 'Errore rete Pi Platform API durante prelievo A2U',
        });
      }
    }

    // Fallback non consentito: senza verifica del server non si dichiara alcun prelievo riuscito
    return res.status(500).json({
      success: false,
      mode: 'live_pi_api',
      error: 'Prelievo non completato: risposta non valida dal server Pi Network.',
    });
  });

  // ================================================================
  // ROTTE PUBBLICITARIE (Punti 4-14) — layer parallelo, retrocompatibile
  // ================================================================

  // POST /api/campaigns — crea campagna pubblicitaria
  app.post('/api/campaigns', async (req, res) => {
    try {
      const body = req.body as CreateCampaignInput;
      if (!body || !body.title || !body.advertiserId || !body.budgetTotal) {
        return res.status(400).json({
          success: false,
          error: 'Campi obbligatori: title, advertiserId, budgetTotal',
          code: 'VALIDATION_ERROR',
        });
      }
      const result = adCreateCampaign({
        advertiserId: body.advertiserId,
        advertiserUsername: body.advertiserUsername,
        title: body.title,
        description: body.description,
        budgetTotal: body.budgetTotal,
        costPerImpression: body.costPerImpression ?? 1,
        rewardPercentToUser: body.rewardPercentToUser ?? 10,
        targeting: body.targeting ?? {},
        pricing: body.pricing,
        idempotencyKey: body.idempotencyKey,
      });
      writeAuditLog({
        action: 'ads_campaign_create',
        userId: body.advertiserId,
        role: 'advertiser',
        ip: req.ip,
        path: req.path,
        method: req.method,
        status: 201,
        success: true,
        details: { campaignId: result.campaign.id },
      });
      return res.status(201).json({ success: true, campaign: result.campaign });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Errore creazione campagna' });
    }
  });

  // GET /api/feed/ads — feed campagne attive per territorio
  app.get('/api/feed/ads', async (req, res) => {
    try {
      const { countryCode, category, limit } = req.query as {
        countryCode?: string;
        category?: string;
        limit?: string;
      };
      const result = adGetAdFeed({
        countryCode,
        category,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      return res.json({ success: true, campaigns: result.campaigns, count: result.count });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Errore feed ads' });
    }
  });

  // POST /api/impressions/certify — certifica un'impressione pubblicitaria
  app.post('/api/impressions/certify', async (req, res) => {
    try {
      const body = req.body as CertifyImpressionInput;
      if (!body || !body.campaignId || !body.userId || !body.sessionToken || !body.nonce || !body.idempotencyKey) {
        return res.status(400).json({
          success: false,
          error: 'Campi obbligatori: campaignId, userId, sessionToken, nonce, idempotencyKey',
          code: 'VALIDATION_ERROR',
        });
      }
      const result = adCertifyImpression({
        campaignId: body.campaignId,
        userId: body.userId,
        sessionToken: body.sessionToken,
        nonce: body.nonce,
        idempotencyKey: body.idempotencyKey,
        amount: body.amount,
      });
      if (result.error) {
        return res.status(400).json({ success: false, error: result.error, duplicate: result.duplicate, rateLimited: result.rateLimited });
      }
      return res.status(result.duplicate ? 200 : 201).json({
        success: true,
        duplicate: result.duplicate,
        impression: result.impression,
        reward: result.reward,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Errore certificazione impressione' });
    }
  });

  // POST /api/uploads/presign — presign upload file creativo
  app.post('/api/uploads/presign', async (req, res) => {
    try {
      const body = req.body as { fileName: string; contentType: string };
      if (!body || !body.fileName || !body.contentType) {
        return res.status(400).json({
          success: false,
          error: 'Campi obbligatori: fileName, contentType',
          code: 'VALIDATION_ERROR',
        });
      }
      const result = adGetPresignUpload({ fileName: body.fileName, contentType: body.contentType });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Errore presign upload' });
    }
  });

  // POST /execute — execute azioni pubblicitarie (stats, reconciliation, refund, reverse, history)
  app.post('/execute', async (req, res) => {
    try {
      const { action, payload } = req.body as { action?: string; payload?: Record<string, unknown> };
      if (!action) {
        return res.status(400).json({ success: false, error: 'Campo obbligatorio: action', code: 'VALIDATION_ERROR' });
      }
      switch (action) {
        case 'campaign_stats': {
          const stats = adGetCampaignStats(String(payload?.campaignId || ''));
          return res.json({ success: true, action, stats });
        }
        case 'global_reconciliation': {
          const report = adGetGlobalReconciliation();
          return res.json({ success: true, action, report });
        }
        case 'refund_campaign': {
          const result = adRefundCampaign(
            String(payload?.campaignId || ''),
            Number(payload?.amount || 0),
            String(payload?.idempotencyKey || '')
          );
          return res.json({ success: result.success, action, entry: result.entry, error: result.error });
        }
        case 'reverse_reward': {
          const result = adReverseRewardAction(
            String(payload?.rewardId || ''),
            String(payload?.idempotencyKey || '')
          );
          return res.json({ success: result.success, action, entry: result.entry, error: result.error });
        }
        case 'user_history': {
          const history = adGetUserAdHistory(String(payload?.userId || ''));
          return res.json({ success: true, action, ...history });
        }
        default:
          return res.status(400).json({ success: false, error: `Azione non supportata: ${action}` });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Errore execute' });
    }
  });

  // === Rotte ordini creativi (Punto 9) ===
  app.post(
    '/api/ads/orders',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const body = req.body as CreateCreativeOrderInput;
        if (!body || !body.title || !body.type) {
          return res.status(400).json({
            success: false,
            error: 'Campi obbligatori: title, type (banner o video)',
            code: 'VALIDATION_ERROR',
          });
        }
        if (!['banner', 'video'].includes(body.type)) {
          return res.status(400).json({ success: false, error: 'type deve essere "banner" o "video"', code: 'VALIDATION_ERROR' });
        }
        const advertiserId = body.advertiserId || auth.userId;
        const order = adCreateOrder({ ...body, advertiserId, advertiserUsername: body.advertiserUsername });
        writeAuditLog({
          action: 'ads_order_create',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 201,
          success: true,
          details: { orderId: order.id, type: order.type },
        });
        return res.status(201).json({ success: true, order });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore creazione ordine' });
      }
    }
  );

  app.get(
    '/api/ads/orders',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const { advertiserId, creatorId, status } = req.query as { advertiserId?: string; creatorId?: string; status?: string };
        let orders = adListAllOrders();
        if (advertiserId) orders = orders.filter((o) => o.advertiserId === advertiserId);
        if (creatorId) orders = orders.filter((o) => o.creatorId === creatorId);
        if (status) orders = orders.filter((o) => o.status === status);
        if (auth.role === 'user' && !advertiserId) orders = orders.filter((o) => o.advertiserId === auth.userId);
        return res.json({ success: true, orders, count: orders.length });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore lista ordini' });
      }
    }
  );

  app.get(
    '/api/ads/orders/:id',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const order = adGetOrder(id);
        if (!order) return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        const auth = (req as any).adAuth;
        if (auth.role === 'user' && order.advertiserId !== auth.userId) {
          return res.status(403).json({ success: false, error: 'Accesso negato a questo ordine' });
        }
        return res.json({ success: true, order });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore dettaglio ordine' });
      }
    }
  );

  app.post(
    '/api/ads/orders/:id/draft',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const body = req.body as SubmitDraftInput;
        if (!body || !body.fileKey || !body.fileUrl || !body.fileName || !body.mimeType) {
          return res.status(400).json({ success: false, error: 'Campi obbligatori: fileKey, fileUrl, fileName, mimeType', code: 'VALIDATION_ERROR' });
        }
        const fileValidation = validateFileUpload({ fileName: body.fileName, mimeType: body.mimeType, sizeBytes: body.sizeBytes });
        if (!fileValidation.valid) return res.status(400).json({ success: false, error: fileValidation.error, code: 'VALIDATION_ERROR' });
        const urlCheck = validateUrlNoSsrf(body.fileUrl);
        if (!urlCheck.safe) return res.status(400).json({ success: false, error: urlCheck.error, code: 'SSRF_BLOCKED' });
        const result = adSubmitDraft(id, { ...body, uploadedBy: auth.userId });
        if (!result.order) return res.status(404).json({ success: false, error: result.error || 'Ordine non trovato' });
        writeAuditLog({
          action: 'ads_order_draft',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { orderId: id, fileId: result.file?.id },
        });
        return res.json({ success: true, order: result.order, file: result.file });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore invio bozza' });
      }
    }
  );

  app.post(
    '/api/ads/orders/:id/review',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const body = req.body as ReviewOrderInput;
        if (!body || !body.action) return res.status(400).json({ success: false, error: 'Campo obbligatorio: action', code: 'VALIDATION_ERROR' });
        if (!['approve', 'request_revision', 'reject'].includes(body.action)) {
          return res.status(400).json({ success: false, error: 'action deve essere approve, request_revision o reject', code: 'VALIDATION_ERROR' });
        }
        const result = adReviewOrder(id, { ...body, reviewerId: auth.userId, reviewerRole: auth.role });
        if (!result.order) return res.status(404).json({ success: false, error: result.error || 'Ordine non trovato' });
        writeAuditLog({
          action: `ads_order_review_${body.action}`,
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { orderId: id, notes: body.notes },
        });
        return res.json({ success: true, order: result.order });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore revisione ordine' });
      }
    }
  );

  app.post(
    '/api/ads/orders/:id/status',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const body = req.body as ChangeOrderStatusInput;
        if (!body || !body.status) return res.status(400).json({ success: false, error: 'Campo obbligatorio: status', code: 'VALIDATION_ERROR' });
        const validStatuses = ['requested', 'in_production', 'draft_submitted', 'revision_requested', 'approved', 'rejected', 'completed', 'cancelled'];
        if (!validStatuses.includes(body.status)) {
          return res.status(400).json({ success: false, error: `status non valido. Valori ammessi: ${validStatuses.join(', ')}`, code: 'VALIDATION_ERROR' });
        }
        const order = adUpdateOrderStatus(id, body.status, auth.userId, body.reason);
        if (!order) return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        writeAuditLog({
          action: 'ads_order_status_change',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { orderId: id, newStatus: body.status, reason: body.reason },
        });
        return res.json({ success: true, order });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore cambio stato ordine' });
      }
    }
  );

  app.get(
    '/api/ads/orders/:id/messages',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const order = adGetOrder(id);
        if (!order) return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        const auth = (req as any).adAuth;
        if (auth.role === 'user' && order.advertiserId !== auth.userId) return res.status(403).json({ success: false, error: 'Accesso negato' });
        const messages = adListOrderMessages(id);
        return res.json({ success: true, messages, count: messages.length });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore storico messaggi' });
      }
    }
  );

  app.post(
    '/api/ads/orders/:id/messages',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const { content, fileId } = req.body as { content?: string; fileId?: string };
        if (!content || typeof content !== 'string') return res.status(400).json({ success: false, error: 'Campo obbligatorio: content', code: 'VALIDATION_ERROR' });
        const message = adAddOrderMessage(id, auth.userId, auth.role, content, fileId);
        if (!message) return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        writeAuditLog({
          action: 'ads_order_message',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 201,
          success: true,
          details: { orderId: id, messageId: message.id },
        });
        return res.status(201).json({ success: true, message });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore invio messaggio' });
      }
    }
  );

  app.post(
    '/api/ads/orders/:id/link-creative',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { creativeId } = req.body as { creativeId?: string };
        if (!creativeId) return res.status(400).json({ success: false, error: 'Campo obbligatorio: creativeId', code: 'VALIDATION_ERROR' });
        const result = adLinkOrderToCreative(id, creativeId);
        if (!result.order) return res.status(400).json({ success: false, error: result.error || 'Ordine non trovato' });
        writeAuditLog({
          action: 'ads_order_link_creative',
          userId: (req as any).adAuth?.userId,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { orderId: id, creativeId },
        });
        return res.json({ success: true, order: result.order, creative: result.creative });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore collegamento creatività' });
      }
    }
  );

  app.delete(
    '/api/ads/orders/:id',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const order = adGetOrder(id);
        if (!order) return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        if (auth.role !== 'platform' && order.advertiserId !== auth.userId) return res.status(403).json({ success: false, error: 'Accesso negato' });
        const deleted = adDeleteOrder(id);
        if (!deleted) return res.status(404).json({ success: false, error: 'Ordine non trovato' });
        writeAuditLog({
          action: 'ads_order_delete',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { orderId: id },
        });
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore eliminazione ordine' });
      }
    }
  );

  // === Rotte audit log (Punto 10/12) ===
  app.get(
    '/api/ads/audit',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['platform']),
    async (_req, res) => {
      try {
        const limit = parseInt((_req.query.limit as string) || '100', 10);
        const entries = getAuditLog(limit);
        return res.json({ success: true, audit: entries, count: entries.length });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore lettura audit log' });
      }
    }
  );

  // === Rotte Provider Registry (Punti 3, 11, 14) ===
  app.get(
    '/api/ads/providers',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (_req, res) => {
      try {
        const providers = adProviderRegistry.getAdapters().map((a) => ({
          name: a.name,
          priority: a.priority,
          available: a.isAvailable(),
        }));
        return res.json({ success: true, providers, count: providers.length });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore lista provider' });
      }
    }
  );

  app.get(
    '/api/ads/provider/health',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (_req, res) => {
      try {
        const health = await adProviderRegistry.healthCheckAll();
        return res.json({ success: true, health, count: health.length });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore health-check provider' });
      }
    }
  );

  app.post(
    '/api/ads/provider/moderate',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const body = req.body as ModerationInput & { idempotencyKey?: string };
        if (!body || typeof body.text !== 'string') {
          return res.status(400).json({ success: false, error: 'Campo obbligatorio: text', code: 'VALIDATION_ERROR' });
        }
        const result = await adProviderRegistry.moderateWithFailover({ text: body.text, creativeId: body.creativeId });
        writeAuditLog({
          action: 'ads_provider_moderate',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { provider: result.provider, allowed: result.allowed, score: result.score },
        });
        return res.json({ success: true, moderation: result });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore moderazione provider' });
      }
    }
  );

  app.post(
    '/api/ads/provider/analyze',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const body = req.body as AnalyzeInput & { idempotencyKey?: string };
        if (!body || (!body.text && !body.imageDataUrl)) {
          return res.status(400).json({ success: false, error: 'Campo obbligatorio: text o imageDataUrl', code: 'VALIDATION_ERROR' });
        }
        const result = await adProviderRegistry.analyzeWithFailover({ text: body.text, imageDataUrl: body.imageDataUrl, creativeId: body.creativeId });
        writeAuditLog({
          action: 'ads_provider_analyze',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { provider: result.provider, brandSafety: result.brandSafety },
        });
        return res.json({ success: true, analysis: result });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore analisi provider' });
      }
    }
  );

  app.post(
    '/api/ads/provider/generate-asset',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const body = req.body as GenerateAssetInput & { idempotencyKey?: string };
        if (!body || !body.title) return res.status(400).json({ success: false, error: 'Campo obbligatorio: title', code: 'VALIDATION_ERROR' });
        if (!['banner', 'video'].includes(body.type)) return res.status(400).json({ success: false, error: 'type deve essere banner o video', code: 'VALIDATION_ERROR' });
        if (body.logoUrl) {
          const logoCheck = validateUrlNoSsrf(body.logoUrl);
          if (!logoCheck.safe) return res.status(400).json({ success: false, error: logoCheck.error, code: 'SSRF_BLOCKED' });
        }
        if (body.fileUrl) {
          const fileCheck = validateUrlNoSsrf(body.fileUrl);
          if (!fileCheck.safe) return res.status(400).json({ success: false, error: fileCheck.error, code: 'SSRF_BLOCKED' });
        }
        const result = await adProviderRegistry.generateAssetWithFailover({
          type: body.type,
          title: body.title,
          cta: body.cta,
          width: body.width,
          height: body.height,
          logoUrl: body.logoUrl,
          fileUrl: body.fileUrl,
        });
        writeAuditLog({
          action: 'ads_provider_generate_asset',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { provider: result.provider, type: result.mimeType },
        });
        return res.json({ success: true, asset: result });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore generazione asset provider' });
      }
    }
  );

  // === Rotte Creative Studio / Progetti e Media (Punto 1) ===
  app.get(
    '/api/ads/creative/projects',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const advertiserId = (req.query.advertiserId as string) || auth.userId;
        const projects = adListProjectsByAdvertiser(advertiserId);
        return res.json({ success: true, projects, count: projects.length });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore lista progetti' });
      }
    }
  );

  app.post(
    '/api/ads/creative/projects',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const body = req.body as { name: string; type: 'banner' | 'video'; canvasState: Record<string, unknown>; width: number; height: number; format?: string };
        if (!body || !body.name || !body.type || !body.canvasState) {
          return res.status(400).json({ success: false, error: 'Campi obbligatori: name, type, canvasState', code: 'VALIDATION_ERROR' });
        }
        if (!['banner', 'video'].includes(body.type)) return res.status(400).json({ success: false, error: 'type deve essere banner o video', code: 'VALIDATION_ERROR' });
        if (!Number.isFinite(body.width) || !Number.isFinite(body.height) || body.width <= 0 || body.height <= 0) {
          return res.status(400).json({ success: false, error: 'width e height devono essere numeri positivi', code: 'VALIDATION_ERROR' });
        }
        const project = adCreateProject({
          advertiserId: auth.userId,
          advertiserUsername: (auth as any).username,
          name: body.name,
          type: body.type,
          canvasState: body.canvasState,
          width: body.width,
          height: body.height,
          format: body.format,
        });
        writeAuditLog({
          action: 'ads_creative_project_create',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 201,
          success: true,
          details: { projectId: project.id, type: project.type },
        });
        return res.status(201).json({ success: true, project });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore creazione progetto' });
      }
    }
  );

  app.get(
    '/api/ads/creative/projects/:id',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const project = adGetProject(id);
        if (!project) return res.status(404).json({ success: false, error: 'Progetto non trovato' });
        const auth = (req as any).adAuth;
        if (auth.role !== 'platform' && project.advertiserId !== auth.userId) return res.status(403).json({ success: false, error: 'Accesso negato a questo progetto' });
        return res.json({ success: true, project });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore dettaglio progetto' });
      }
    }
  );

  app.put(
    '/api/ads/creative/projects/:id',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const project = adGetProject(id);
        if (!project) return res.status(404).json({ success: false, error: 'Progetto non trovato' });
        if (auth.role !== 'platform' && project.advertiserId !== auth.userId) return res.status(403).json({ success: false, error: 'Accesso negato a questo progetto' });
        const body = req.body as Partial<{ name: string; canvasState: Record<string, unknown>; width: number; height: number; format: string; status: 'draft' | 'exported' | 'submitted'; exportedUrl: string; mimeType: string; campaignId: string; orderId: string }>;
        const updated = adUpdateProject(id, body);
        if (!updated) return res.status(404).json({ success: false, error: 'Progetto non trovato' });
        writeAuditLog({
          action: 'ads_creative_project_update',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { projectId: id },
        });
        return res.json({ success: true, project: updated });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore aggiornamento progetto' });
      }
    }
  );

  app.delete(
    '/api/ads/creative/projects/:id',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const project = adGetProject(id);
        if (!project) return res.status(404).json({ success: false, error: 'Progetto non trovato' });
        if (auth.role !== 'platform' && project.advertiserId !== auth.userId) return res.status(403).json({ success: false, error: 'Accesso negato a questo progetto' });
        const deleted = adDeleteProject(id);
        if (!deleted) return res.status(404).json({ success: false, error: 'Progetto non trovato' });
        writeAuditLog({
          action: 'ads_creative_project_delete',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { projectId: id },
        });
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore eliminazione progetto' });
      }
    }
  );

  app.post(
    '/api/ads/creative/projects/:id/export',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const { exportedUrl, mimeType } = req.body as { exportedUrl?: string; mimeType?: string };
        if (!exportedUrl || !mimeType) return res.status(400).json({ success: false, error: 'Campi obbligatori: exportedUrl, mimeType', code: 'VALIDATION_ERROR' });
        const project = adGetProject(id);
        if (!project) return res.status(404).json({ success: false, error: 'Progetto non trovato' });
        if (auth.role !== 'platform' && project.advertiserId !== auth.userId) return res.status(403).json({ success: false, error: 'Accesso negato a questo progetto' });
        const updated = adExportProject(id, exportedUrl, mimeType);
        if (!updated) return res.status(404).json({ success: false, error: 'Progetto non trovato' });
        return res.json({ success: true, project: updated });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore esportazione progetto' });
      }
    }
  );

  app.get(
    '/api/ads/creative/media',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform', 'user']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const advertiserId = (req.query.advertiserId as string) || auth.userId;
        const media = adListMediaByAdvertiser(advertiserId);
        return res.json({ success: true, media, count: media.length });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore lista media' });
      }
    }
  );

  app.post(
    '/api/ads/creative/media',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const auth = (req as any).adAuth;
        const body = req.body as { fileKey: string; fileUrl: string; fileName: string; mimeType: string; sizeBytes: number; tags?: string[] };
        if (!body || !body.fileKey || !body.fileUrl || !body.fileName || !body.mimeType) {
          return res.status(400).json({ success: false, error: 'Campi obbligatori: fileKey, fileUrl, fileName, mimeType', code: 'VALIDATION_ERROR' });
        }
        const fileValidation = validateFileUpload({ fileName: body.fileName, mimeType: body.mimeType, sizeBytes: body.sizeBytes });
        if (!fileValidation.valid) return res.status(400).json({ success: false, error: fileValidation.error, code: 'VALIDATION_ERROR' });
        const urlCheck = validateUrlNoSsrf(body.fileUrl);
        if (!urlCheck.safe) return res.status(400).json({ success: false, error: urlCheck.error, code: 'SSRF_BLOCKED' });
        const media = adAddMedia({
          advertiserId: auth.userId,
          fileKey: body.fileKey,
          fileUrl: body.fileUrl,
          fileName: body.fileName,
          mimeType: body.mimeType,
          sizeBytes: body.sizeBytes,
          tags: body.tags,
        });
        writeAuditLog({
          action: 'ads_creative_media_add',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 201,
          success: true,
          details: { mediaId: media.id, mimeType: media.mimeType },
        });
        return res.status(201).json({ success: true, media });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore aggiunta media' });
      }
    }
  );

  app.delete(
    '/api/ads/creative/media/:id',
    adsAuthMiddleware,
    adsRateLimitMiddleware,
    adsRoleMiddleware(['advertiser', 'creator', 'platform']),
    async (req, res) => {
      try {
        const { id } = req.params;
        const auth = (req as any).adAuth;
        const media = adGetMedia(id);
        if (!media) return res.status(404).json({ success: false, error: 'Media non trovato' });
        if (auth.role !== 'platform' && media.advertiserId !== auth.userId) return res.status(403).json({ success: false, error: 'Accesso negato a questo media' });
        const deleted = adDeleteMedia(id);
        if (!deleted) return res.status(404).json({ success: false, error: 'Media non trovato' });
        writeAuditLog({
          action: 'ads_creative_media_delete',
          userId: auth.userId,
          role: auth.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
          status: 200,
          success: true,
          details: { mediaId: id },
        });
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Errore eliminazione media' });
      }
    }
  );

  // 4. Integrazione Vite (dev) o Dist (produzione)
  const isRunningCompiledServer = Boolean(process.argv[1] && process.argv[1].endsWith('server.cjs'));
  const hasBuiltDist = fs.existsSync(path.join(distDir, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || (isRunningCompiledServer && hasBuiltDist);

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.txt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      }
    }));

    // Rotta di fallback corretta per Single Page Application
    app.get('*', (req, res) => {
      const cleanPath = req.path.replace(/\/$/, '');
      if (cleanPath === '/validation-key.txt' || req.url.includes('validation-key.txt')) {
        return sendValidationKey(req, res);
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} already in use, exiting for supervisor restart...`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
