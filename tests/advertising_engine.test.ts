/**
 * Test per il motore pubblicitario HAVE2WANT PLUS (Punti 4-8).
 * Testa: ciclo campagne, distribuzione feed, verifica impronta,
 * motore premiazione e contabilità atomica.
 * Esegue in ambiente Node (vitest environment: 'node').
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  createCampaign,
  addCreative,
  getAdFeed,
  certifyImpression,
  createSessionToken,
  verifySessionTokenFull,
  toggleCampaign,
  reviewCreative,
  getCampaignStats,
  getUserAdHistory,
  getGlobalReconciliation,
  refundCampaign as refundCampaignAction,
  reverseRewardAction,
} from '../server/adService';
import {
  debitCampaignBudget,
  creditUserReward,
  computeRewardPoints,
  canAfford,
  reconcileCampaign,
  reconcileAll,
  refundCampaign as refundCampaignFn,
  reverseReward,
  checkDailyCaps,
  getCertifiedImpressionsToday,
  getAccountBalance,
} from '../server/adLedger';
import {
  getCampaign,
  saveCampaign,
  listActiveCampaigns,
  findImpressionByIdempotencyKey,
  saveImpression,
  getImpression,
  listImpressionsByCampaign,
  incrementCampaignStats,
  findCampaignByIdempotencyKey,
  listCreativesByCampaign,
  getCreative,
  getApprovedCreative,
  saveCreative,
  approveCreative,
  saveDailyCaps,
  incrementDailyCaps,
  getDailyCaps,
  setDailyCapsLimits,
  saveLedgerEntry,
  getReward,
  resetForTests,
} from '../server/adStore';
import { resetMemoryIdempotencyForTests } from '../server/idempotencyStore';
import type {
  CreateCampaignInput,
  CertifyImpressionInput,
} from '../server/adTypes';

function resetStore(): void {
  resetMemoryIdempotencyForTests();
  resetForTests();
}

function makeCampaignInput(overrides: Partial<CreateCampaignInput> = {}): CreateCampaignInput {
  return {
    advertiserId: 'adv_001',
    advertiserUsername: '@mercante_001',
    title: 'Campagna test banner',
    description: 'Descrizione campagna test',
    budgetTotal: 1000,
    costPerImpression: 10,
    rewardPercentToUser: 30,
    startDate: Date.now() - 1000,
    endDate: Date.now() + 86400000 * 7,
    targeting: { countryCode: 'IT' },
    dailyBudget: 100,
    maxImpressionsPerUserPerDay: 5,
    minVisibilityDurationMs: 2000,
    idempotencyKey: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  };
}

const baseImpression: CertifyImpressionInput = {
  campaignId: '',
  creativeId: '',
  userId: 'user_001',
  sessionToken: 'token_abc',
  nonce: 'nonce_abc',
  idempotencyKey: 'imp_test_001',
  visibilityDurationMs: 3000,
  ipHash: '192.168.1.1',
  userAgentHash: 'Mozilla/5.0 test',
};

describe('Motore Campagne (Punto 4)', () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  it('crea una campagna con budget totale, costo per impressione, % utenti e date', async () => {
    const { campaign, duplicate } = await createCampaign(makeCampaignInput({ countryCode: 'IT' }));
    expect(duplicate).toBe(false);
    expect(campaign.id).toBeDefined();
    expect(campaign.budgetTotal).toBe(1000);
    expect(campaign.budgetRemaining).toBe(1000);
    expect(campaign.costPerImpression).toBe(10);
    expect(campaign.rewardPercentToUser).toBe(30);
    expect(campaign.status).toBe('active');
    expect(campaign.pricing?.countryCode).toBe('IT');
    expect(campaign.pricing?.listPricePi).toBe(100);
  });

  it('è idempotente: stessa idempotencyKey restituisce duplicato', async () => {
    const input = makeCampaignInput({ idempotencyKey: 'camp_idem_fixed_001' });
    const first = await createCampaign(input);
    const second = await createCampaign(input);
    expect(second.duplicate).toBe(true);
    expect(second.campaign.id).toBe(first.campaign.id);
  });

  it('rifiuta budget totale <= 0', async () => {
    await expect(createCampaign(makeCampaignInput({ budgetTotal: 0 }))).rejects.toThrow();
  });

  it('rifiuta costPerImpression <= 0', async () => {
    await expect(createCampaign(makeCampaignInput({ costPerImpression: 0 }))).rejects.toThrow();
  });

  it('rifiuta rewardPercentToUser fuori range 0-100', async () => {
    await expect(
      createCampaign(makeCampaignInput({ rewardPercentToUser: 101 }))
    ).rejects.toThrow();
  });

  it('rifiuta endDate <= startDate', async () => {
    await expect(
      createCampaign(makeCampaignInput({
        startDate: Date.now() + 86400000,
        endDate: Date.now(),
      }))
    ).rejects.toThrow();
  });

  it('aggiunge una creatività alla campagna', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, {
      type: 'banner',
      title: 'Banner test',
      cta: 'Scopri di più',
      fileUrl: '/ads/banner.png',
      format: 'png',
    });
    expect(creative.id).toBeDefined();
    expect(creative.campaignId).toBe(campaign.id);
    expect(creative.status).toBe('pending');

    const saved = getCreative(creative.id);
    expect(saved?.id).toBe(creative.id);
  });

  it('rifiuta creatività per campagna inesistente', async () => {
    await expect(
      addCreative('camp_inesistente', { type: 'banner' })
    ).rejects.toThrow('campagna non trovata');
  });

  it('approva una creatività', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });
    const approved = await reviewCreative(creative.id, true);
    expect(approved?.status).toBe('approved');
  });

  it('rifiuta una creatività con motivo', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });
    const rejected = await reviewCreative(creative.id, false, 'Contenuto non idoneo');
    expect(rejected?.status).toBe('rejected');
    expect(rejected?.rejectionReason).toBe('Contenuto non idoneo');
  });

  it('attiva e sospende una campagna', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const paused = await toggleCampaign(campaign.id, 'paused');
    expect(paused.campaign?.status).toBe('paused');

    const reactivated = await toggleCampaign(campaign.id, 'active');
    expect(reactivated.campaign?.status).toBe('active');
  });

  it('toggle su campagna inesistente restituisce errore', async () => {
    const result = await toggleCampaign('camp_inesistente', 'active');
    expect(result.campaign).toBeNull();
    expect(result.error).toBe('campagna non trovata');
  });

  it('computeRewardPoints calcola correttamente', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const points = computeRewardPoints(campaign);
    expect(points).toBe(Math.floor(10 * 0.3)); // 3 punti
  });

  it('canAfford restituisce false se budget insufficiente', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    expect(canAfford(campaign, 10)).toBe(true);
    expect(canAfford(campaign, 1001)).toBe(false);
  });

  it('canAfford restituisce false se campagna non attiva', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const paused = await toggleCampaign(campaign.id, 'paused');
    expect(canAfford(paused.campaign!, 10)).toBe(false);
  });

  it('debitCampaignBudget blocca spesa oltre budget residuo', async () => {
    const { campaign } = await createCampaign(makeCampaignInput({
      budgetTotal: 20,
      costPerImpression: 10,
    }));

    const ok1 = debitCampaignBudget({
      campaignId: campaign.id,
      amount: 10,
      idempotencyKey: 'debit_001',
    });
    expect(ok1.ok).toBe(true);

    const ok2 = debitCampaignBudget({
      campaignId: campaign.id,
      amount: 10,
      idempotencyKey: 'debit_002',
    });
    expect(ok2.ok).toBe(true);

    const ok3 = debitCampaignBudget({
      campaignId: campaign.id,
      amount: 1,
      idempotencyKey: 'debit_003',
    });
    expect(ok3.ok).toBe(false);
    expect(
      ok3.error === 'budget residuo insufficiente' || ok3.error === 'campagna non attiva'
    ).toBe(true);
  });

  it('debitCampaignBudget è idempotente', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const d1 = debitCampaignBudget({
      campaignId: campaign.id,
      amount: 10,
      idempotencyKey: 'debit_idem_001',
    });
    const d2 = debitCampaignBudget({
      campaignId: campaign.id,
      amount: 10,
      idempotencyKey: 'debit_idem_001',
    });
    expect(d2.duplicate).toBe(true);
    expect(d2.entry?.id).toBe(d1.entry?.id);
  });

  it('toggleCampaign disattiva e riattiva la campagna nel feed', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    await addCreative(campaign.id, { type: 'banner' });

    let feed = await getAdFeed('user_feed_001');
    expect(feed.items.some((i) => i.campaign.id === campaign.id)).toBe(true);

    await toggleCampaign(campaign.id, 'paused');
    feed = await getAdFeed('user_feed_001');
    expect(feed.items.some((i) => i.campaign.id === campaign.id)).toBe(false);
  });

  it('getCampaignStats include riconciliazione contabile', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const stats = getCampaignStats(campaign.id);
    expect(stats.campaign?.id).toBe(campaign.id);
    expect(stats.reconciliation.campaignId).toBe(campaign.id);
    expect(typeof stats.reconciliation.balanced).toBe('boolean');
  });

  it('findCampaignByIdempotencyKey trova campagna per chiave', async () => {
    await createCampaign(makeCampaignInput({ idempotencyKey: 'camp_test_001' }));
    const found = findCampaignByIdempotencyKey('camp_test_001');
    expect(found?.id).toBeDefined();
    expect(found?.title).toBe('Campagna test banner');
  });
});

describe('Motore Distribuzione Annunci (Punto 5)', () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  it('feed restituisce solo campagne attive con budget', async () => {
    await createCampaign(makeCampaignInput());
    // Crea una campagna e poi esaurisci il suo budget
    const { campaign: exhausted } = await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_test_002',
      title: 'Campagna esaurita',
      budgetTotal: 10,
      costPerImpression: 10,
    }));
    debitCampaignBudget({
      campaignId: exhausted.id,
      amount: 10,
      idempotencyKey: 'debit_exhaust_feed_001',
    });

    const feed = await getAdFeed('user_feed_002');
    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items.every((i) => i.campaign.status === 'active')).toBe(true);
    expect(feed.items.every((i) => i.campaign.budgetRemaining > 0)).toBe(true);
    expect(feed.items.some((i) => i.campaign.id === exhausted.id)).toBe(false);
    expect(feed.rateLimited).toBe(false);
  });

  it('feed applica rate limiting per utente', async () => {
    await createCampaign(makeCampaignInput());
    // Esaurisce il rate limit (30 richieste al minuto)
    for (let i = 0; i < 31; i++) {
      await getAdFeed('user_rate_limit');
    }
    const limited = await getAdFeed('user_rate_limit');
    expect(limited.rateLimited).toBe(true);
    expect(limited.items.length).toBe(0);
  });

  it('feed applica rotazione annunci (ordine variabile ma stesse campagne)', async () => {
    await createCampaign(makeCampaignInput());
    await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_test_003',
      title: 'Campagna seconda',
    }));

    const feed1 = await getAdFeed('user_rot_001');
    const feed2 = await getAdFeed('user_rot_001');
    const ids1 = feed1.items.map((i) => i.campaign.id).sort();
    const ids2 = feed2.items.map((i) => i.campaign.id).sort();
    expect(ids1).toEqual(ids2);
  });

  it('feed esclude campagne con budget esaurito', async () => {
    const { campaign } = await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_budget_001',
      budgetTotal: 10,
      costPerImpression: 10,
    }));
    debitCampaignBudget({
      campaignId: campaign.id,
      amount: 10,
      idempotencyKey: 'debit_exhaust_001',
    });

    const feed = await getAdFeed('user_exhaust');
    expect(feed.items.some((i) => i.campaign.id === campaign.id)).toBe(false);
  });
});

describe('Motore Verifica Impronta (Punto 6)', () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  it('certifica un\'impressione con successo', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });

    const result = await certifyImpression({
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_cert_001',
      sessionToken: 'session_xyz',
      nonce: 'nonce_xyz',
      idempotencyKey: 'imp_cert_001',
      visibilityDurationMs: 3000,
      ipHash: '10.0.0.1',
      userAgentHash: 'TestAgent/1.0',
    });

    expect(result.error).toBeUndefined();
    expect(result.duplicate).toBe(false);
    expect(result.impression.status).toBe('certified');
    expect(result.impression.amount).toBe(10);
    expect(result.reward?.points).toBeGreaterThanOrEqual(0);
  });

  it('certificazione è idempotente (anti-duplicazione)', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });

    const input: CertifyImpressionInput = {
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_idem_001',
      sessionToken: 'session_idem',
      nonce: 'nonce_idem',
      idempotencyKey: 'imp_idem_001',
      visibilityDurationMs: 3000,
    };

    const r1 = await certifyImpression(input);
    const r2 = await certifyImpression(input);

    expect(r1.duplicate).toBe(false);
    expect(r2.duplicate).toBe(true);
    expect(r2.impression.id).toBe(r1.impression.id);
  });

  it('anti-replay: stesso nonce rifiutato', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });

    const input1: CertifyImpressionInput = {
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_replay_001',
      sessionToken: 'session_replay',
      nonce: 'nonce_replay_shared',
      idempotencyKey: 'imp_replay_001',
      visibilityDurationMs: 3000,
    };
    const input2: CertifyImpressionInput = {
      ...input1,
      idempotencyKey: 'imp_replay_002', // chiave diversa, stesso nonce
    };

    await certifyImpression(input1);
    const r2 = await certifyImpression(input2);
    expect(r2.error).toContain('anti-replay');
  });

  it('blocca certificazione su campagna con budget esaurito', async () => {
    const { campaign } = await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_broke_001',
      budgetTotal: 5,
      costPerImpression: 10,
    }));
    const creative = await addCreative(campaign.id, { type: 'banner' });

    const result = await certifyImpression({
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_broke_001',
      sessionToken: 'session_broke',
      nonce: 'nonce_broke',
      idempotencyKey: 'imp_broke_001',
      visibilityDurationMs: 3000,
    });
    expect(result.error).toContain('budget esaurito');
  });

  it('blocca certificazione con durata visibilità insufficiente', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });

    const result = await certifyImpression({
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_vis_001',
      sessionToken: 'session_vis',
      nonce: 'nonce_vis',
      idempotencyKey: 'imp_vis_001',
      visibilityDurationMs: 500, // sotto il minimo di 2000ms
    });
    expect(result.error).toContain('durata visibilità');
  });

  it('concorrenza: molte richieste simultanee stessa idempotencyKey -> solo una certificata', async () => {
    const { campaign } = await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_conc_001',
      budgetTotal: 100,
    }));
    const creative = await addCreative(campaign.id, { type: 'banner' });

    const inputBase: CertifyImpressionInput = {
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_conc_001',
      sessionToken: 'session_conc',
      nonce: 'nonce_conc',
      idempotencyKey: 'imp_conc_001',
      visibilityDurationMs: 3000,
    };

    const results = await Promise.all(
      Array.from({ length: 20 }).map(() => certifyImpression(inputBase))
    );

    const certified = results.filter((r) => !r.error && !r.duplicate);
    const duplicates = results.filter(
      (r) =>
        r.duplicate ||
        (r.error &&
          (r.error.includes('anti-replay') || r.error.includes('concorrenza')))
    );

    expect(certified.length).toBe(1);
    expect(duplicates.length).toBe(19);
  });

  it('token di sessione generato e verificato', () => {
    const token = createSessionToken({
      userId: 'user_tok_001',
      campaignId: 'camp_tok_001',
    });
    expect(token.token).toBeDefined();
    expect(token.nonce).toBeDefined();
    expect(token.signature).toBeDefined();

    const verified = verifySessionTokenFull(token.token, token.signature);
    expect(verified.valid).toBe(true);
  });

  it('token con firma invalida è rifiutato', () => {
    const verified = verifySessionTokenFull('token.xyz.random', 'firma_falsa');
    expect(verified.valid).toBe(false);
    expect(verified.error).toContain('firma');
  });

  it('campagna inesistente nella certificazione', async () => {
    const result = await certifyImpression({
      ...baseImpression,
      campaignId: 'camp_inesistente',
    });
    expect(result.error).toContain('campagna non trovata');
  });
});

describe('Motore Premiazione e Punti (Punto 7)', () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  it('accredita punti reward all\'utente', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const rewardResult = creditUserReward({
      userId: 'user_rew_001',
      campaignId: campaign.id,
      impressionId: 'imp_rew_001',
      points: 3,
      type: 'promo_points',
      idempotencyKey: 'rew_001',
    });

    expect(rewardResult.reward.points).toBe(3);
    expect(rewardResult.reward.type).toBe('promo_points');
    expect(rewardResult.duplicate).toBe(false);
  });

  it('accredito reward è idempotente', async () => {
    const input = {
      userId: 'user_rew_idem_001',
      campaignId: 'camp_rew_idem_001',
      impressionId: 'imp_rew_idem_001',
      points: 5,
      idempotencyKey: 'rew_idem_001',
    };
    const r1 = creditUserReward(input);
    const r2 = creditUserReward(input);
    expect(r2.duplicate).toBe(true);
    expect(r2.reward.id).toBe(r1.reward.id);
  });

  it('checkDailyCaps blocca oltre il massimale giornaliero', async () => {
    const today = new Date().toISOString().slice(0, 10);
    saveDailyCaps({
      userId: 'user_cap_001',
      date: today,
      impressionsCount: 2,
      pointsEarned: 100,
      maxImpressions: 2,
      maxPoints: 100,
    });

    const caps = checkDailyCaps('user_cap_001', today, {
      maxImpressions: 2,
      maxPoints: 100,
    });
    expect(caps.allowed).toBe(false);
    expect(caps.remainingImpressions).toBe(0);
    expect(caps.remainingPoints).toBe(0);
  });

  it('getCertifiedImpressionsToday restituisce le impressioni certificate oggi', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });

    await certifyImpression({
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_hist_001',
      sessionToken: 'session_hist',
      nonce: 'nonce_hist',
      idempotencyKey: 'imp_hist_001',
      visibilityDurationMs: 3000,
    });

    const today = getCertifiedImpressionsToday('user_hist_001');
    expect(today.length).toBeGreaterThanOrEqual(1);
    expect(today[0].userId).toBe('user_hist_001');
  });

  it('getDailyCaps restituisce i massimali impostati', async () => {
    const today = new Date().toISOString().slice(0, 10);
    setDailyCapsLimits('user_cap_limits_001', today, {
      maxImpressions: 5,
      maxPoints: 250,
    });
    const caps = getDailyCaps('user_cap_limits_001', today);
    expect(caps?.maxImpressions).toBe(5);
    expect(caps?.maxPoints).toBe(250);
  });
});

describe('Motore Finanziario e Contabilità (Punto 8)', () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  it('recordLedgerEntry registra una voce contabile', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const result = debitCampaignBudget({
      campaignId: campaign.id,
      amount: 50,
      idempotencyKey: 'ledger_001',
    });
    expect(result.ok).toBe(true);
    expect(result.entry).toBeDefined();
    expect(result.entry?.account).toBe('campaign_budget');
    expect(result.duplicate).toBe(false);
  });

  it('getAccountBalance somma le voci di un conto', () => {
    const acct: import('../server/adTypes').AdLedgerAccount = 'platform_commission';
    saveLedgerEntry({
      id: 'ledger_manual_1',
      type: 'credit',
      account: acct,
      amount: 10,
      referenceId: 'camp_x',
      description: 'commissione test',
      timestamp: Date.now(),
      idempotencyKey: 'ledger_manual_key_1',
    });
    saveLedgerEntry({
      id: 'ledger_manual_2',
      type: 'credit',
      account: acct,
      amount: 20,
      referenceId: 'camp_x',
      description: 'commissione test 2',
      timestamp: Date.now(),
      idempotencyKey: 'ledger_manual_key_2',
    });

    const balance = getAccountBalance(acct);
    expect(balance).toBeGreaterThanOrEqual(30);
  });

  it('refundCampaign ripristina budget campagna', async () => {
    const { campaign } = await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_refund_001',
      budgetTotal: 100,
      costPerImpression: 10,
    }));

    debitCampaignBudget({
      campaignId: campaign.id,
      amount: 30,
      idempotencyKey: 'refund_debit_001',
    });
    let c = getCampaign(campaign.id)!;
    expect(c.budgetRemaining).toBe(70);

    const refund = refundCampaignFn({
      campaignId: campaign.id,
      amount: 30,
      idempotencyKey: 'refund_001',
    });
    expect(refund.ok).toBe(true);

    c = getCampaign(campaign.id)!;
    expect(c.budgetRemaining).toBe(100);
  });

  it('refundCampaign è idempotente', async () => {
    const { campaign } = await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_refund_idem_001',
      budgetTotal: 100,
    }));

    const r1 = refundCampaignFn({
      campaignId: campaign.id,
      amount: 10,
      idempotencyKey: 'refund_idem_001',
    });
    const r2 = refundCampaignFn({
      campaignId: campaign.id,
      amount: 10,
      idempotencyKey: 'refund_idem_001',
    });
    expect(r2.duplicate).toBe(true);
    expect(r2.entry?.id).toBe(r1.entry?.id);
  });

  it('reverseReward storna un reward accreditato', async () => {
    const rewardResult = creditUserReward({
      userId: 'user_rev_001',
      campaignId: 'camp_rev_001',
      impressionId: 'imp_rev_001',
      points: 5,
      idempotencyKey: 'rev_001',
    });

    const reversed = reverseReward({
      rewardId: rewardResult.reward.id,
      idempotencyKey: 'rev_reverse_001',
    });
    expect(reversed.ok).toBe(true);

    const reward = getReward(rewardResult.reward.id);
    expect(reward?.status).toBe('rejected');
  });

  it('reconcileCampaign restituisce report con discrepanze', async () => {
    const { campaign } = await createCampaign(makeCampaignInput({
      idempotencyKey: 'camp_reconcile_001',
      budgetTotal: 100,
      costPerImpression: 10,
    }));

    debitCampaignBudget({
      campaignId: campaign.id,
      amount: 20,
      idempotencyKey: 'reconcile_debit_001',
    });
    incrementCampaignStats(campaign.id, { spend: 20, certified: 2 });

    const report = reconcileCampaign(campaign.id);
    expect(report.campaignId).toBe(campaign.id);
    expect(typeof report.balanced).toBe('boolean');
    expect(Array.isArray(report.entries)).toBe(true);
  });

  it('reconcileAll restituisce report globale bilanciato', () => {
    const report = reconcileAll();
    expect(typeof report.balanced).toBe('boolean');
    expect(typeof report.campaignBudgetDebits).toBe('number');
    expect(typeof report.platformCommissionCredits).toBe('number');
    expect(typeof report.userRewardsCredits).toBe('number');
    expect(typeof report.refunds).toBe('number');
  });

  it('getGlobalReconciliation restituisce report contabile', () => {
    const report = getGlobalReconciliation();
    expect(report.balanced).toBeDefined();
  });

  it('getUserAdHistory restituisce storico movimenti utente', async () => {
    const { campaign } = await createCampaign(makeCampaignInput());
    const creative = await addCreative(campaign.id, { type: 'banner' });

    await certifyImpression({
      campaignId: campaign.id,
      creativeId: creative.id,
      userId: 'user_hist_full_001',
      sessionToken: 'session_hist_full',
      nonce: 'nonce_hist_full',
      idempotencyKey: 'imp_hist_full_001',
      visibilityDurationMs: 3000,
    });

    const history = getUserAdHistory('user_hist_full_001');
    expect(history.impressions.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(history.rewards)).toBe(true);
    expect(Array.isArray(history.ledger)).toBe(true);
  });
});
