/**
 * Test per i punti 9, 10, 12 del sistema pubblicitario HAVE2WANT PLUS.
 * - Punto 9: ordini creativi (crea, lista, dettaglio, draft, review, status, messages, link-creative)
 * - Punto 10: idempotenza, validazioni integrità, endpoint esistenti compatibili
 * - Punto 12: autenticazione, autorizzazione per ruolo, validazione MIME, protezione SSRF,
 *   rate limiting, audit log, retry controllati, gestione errori
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  createOrder,
  listAllOrders,
  listOrdersByAdvertiser,
  listOrdersByCreator,
  getOrder,
  updateOrderStatus,
  assignCreator,
  submitDraft,
  addOrderMessage,
  listOrderMessages,
  reviewOrder,
  linkOrderToCreative,
  deleteOrder,
  resetForTests as resetForOrdersTests,
} from '../server/adOrders';
import {
  saveCreative,
  approveCreative,
} from '../server/adStore';
import {
  authenticateRequest,
  authorizeRole,
  validateFileUpload,
  validateUrlNoSsrf,
  checkRateLimit,
  writeAuditLog,
  getAuditLog,
  type AdRole,
} from '../server/adSecurity';

const resetOrders = resetForOrdersTests;

// ========== Punto 9: Ordini creativi ==========

describe('Punto 9 — Ordini creativi', () => {
  beforeEach(() => {
    resetOrders();
  });
  afterEach(() => {
    resetOrders();
  });

  it('crea un ordine creativo banner con idempotenza', () => {
    const input = {
      advertiserId: 'adv_001',
      advertiserUsername: '@mercante',
      type: 'banner' as const,
      title: 'Banner estivo',
      description: 'Produzione banner per campagna estate',
      priority: 'high' as const,
      budgetPi: 50,
      idempotencyKey: 'order_banner_001',
    };
    const order = createOrder(input);
    expect(order.id).toBeDefined();
    expect(order.title).toBe('Banner estivo');
    expect(order.type).toBe('banner');
    expect(order.status).toBe('requested');
    expect(order.priority).toBe('high');
    expect(order.budgetPi).toBe(50);
    expect(order.idempotencyKey).toBe('order_banner_001');
  });

  it('creazione ordine è idempotente', () => {
    const input = {
      advertiserId: 'adv_002',
      type: 'video' as const,
      title: 'Video spot',
      idempotencyKey: 'order_idem_001',
    };
    const o1 = createOrder(input);
    const o2 = createOrder(input);
    expect(o2.id).toBe(o1.id);
    expect(o2.status).toBe('requested');
  });

  it('lista ordini per advertiser', () => {
    createOrder({ advertiserId: 'adv_a', type: 'banner', title: 'A1', idempotencyKey: 'o_a1' });
    createOrder({ advertiserId: 'adv_a', type: 'video', title: 'A2', idempotencyKey: 'o_a2' });
    createOrder({ advertiserId: 'adv_b', type: 'banner', title: 'B1', idempotencyKey: 'o_b1' });

    const aOrders = listOrdersByAdvertiser('adv_a');
    expect(aOrders.length).toBe(2);
    expect(aOrders.every((o) => o.advertiserId === 'adv_a')).toBe(true);

    const bOrders = listOrdersByAdvertiser('adv_b');
    expect(bOrders.length).toBe(1);
  });

  it('lista ordini per creator', () => {
    createOrder({
      advertiserId: 'adv_x',
      creatorId: 'creator_001',
      type: 'banner',
      title: 'C1',
      idempotencyKey: 'o_c1',
    });
    createOrder({
      advertiserId: 'adv_y',
      creatorId: 'creator_001',
      type: 'video',
      title: 'C2',
      idempotencyKey: 'o_c2',
    });
    createOrder({
      advertiserId: 'adv_z',
      type: 'banner',
      title: 'C3',
      idempotencyKey: 'o_c3',
    });

    const cOrders = listOrdersByCreator('creator_001');
    expect(cOrders.length).toBe(2);
    expect(cOrders.every((o) => o.creatorId === 'creator_001')).toBe(true);
  });

  it('ottiene dettaglio ordine per id', () => {
    const created = createOrder({
      advertiserId: 'adv_detail',
      type: 'banner',
      title: 'Dettaglio test',
      idempotencyKey: 'o_detail_001',
    });
    const fetched = getOrder(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.title).toBe('Dettaglio test');
  });

  it('getOrder restituisce null per ordine inesistente', () => {
    expect(getOrder('ordine_inesistente')).toBeNull();
  });

  it('assegna un creator e cambia stato in in_production', () => {
    const order = createOrder({
      advertiserId: 'adv_assign',
      type: 'banner',
      title: 'Assegna creator',
      idempotencyKey: 'o_assign_001',
    });
    const updated = assignCreator(order.id, 'creator_assign', '@creator_assign');
    expect(updated).not.toBeNull();
    expect(updated?.creatorId).toBe('creator_assign');
    expect(updated?.creatorUsername).toBe('@creator_assign');
    expect(updated?.status).toBe('in_production');
  });

  it('invia bozza (draft) con file', () => {
    const order = createOrder({
      advertiserId: 'adv_draft',
      type: 'banner',
      title: 'Bozza test',
      idempotencyKey: 'o_draft_001',
    });
    const result = submitDraft(order.id, {
      fileKey: 'ads/banner_001.png',
      fileUrl: '/uploads/ads/banner_001.png',
      fileName: 'banner_001.png',
      mimeType: 'image/png',
      sizeBytes: 102400,
      uploadedBy: 'adv_draft',
      message: 'Ecco la prima bozza',
    });
    expect(result.order).not.toBeNull();
    expect(result.file).not.toBeNull();
    expect(result.file?.fileName).toBe('banner_001.png');
    expect(result.file?.mimeType).toBe('image/png');
    expect(result.order?.status).toBe('draft_submitted');
    expect(result.order?.files.length).toBe(1);
    expect(result.order?.messages.length).toBe(1);
    expect(result.order?.messages[0].content).toBe('Ecco la prima bozza');
  });

  it('rifiuta bozza con estensione non consentita', () => {
    const order = createOrder({
      advertiserId: 'adv_draft2',
      type: 'banner',
      title: 'Bozza invalida',
      idempotencyKey: 'o_draft2_001',
    });
    const result = submitDraft(order.id, {
      fileKey: 'ads/evil.exe',
      fileUrl: '/uploads/ads/evil.exe',
      fileName: 'evil.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: 1000,
      uploadedBy: 'adv_draft2',
    });
    expect(result.order).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('rifiuta bozza su ordine inesistente', () => {
    const result = submitDraft('ordine_inesistente', {
      fileKey: 'ads/x.png',
      fileUrl: '/uploads/ads/x.png',
      fileName: 'x.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedBy: 'user',
    });
    expect(result.order).toBeNull();
    expect(result.error).toContain('Ordine non trovato');
  });

  it('aggiunge messaggi e li lista ordinati per data', () => {
    const order = createOrder({
      advertiserId: 'adv_msg',
      type: 'video',
      title: 'Messaggi test',
      idempotencyKey: 'o_msg_001',
    });
    addOrderMessage(order.id, 'adv_msg', 'advertiser', 'Ciao creator');
    addOrderMessage(order.id, 'creator_001', 'creator', 'Ricevuto, lavoro in corso');
    addOrderMessage(order.id, 'adv_msg', 'advertiser', 'Perfetto, attendo bozza');

    const messages = listOrderMessages(order.id);
    expect(messages.length).toBe(3);
    expect(messages[0].senderRole).toBe('advertiser');
    expect(messages[1].senderRole).toBe('creator');
    expect(messages[2].senderRole).toBe('advertiser');
    expect(messages[0].createdAt).toBeLessThanOrEqual(messages[1].createdAt);
  });

  it('approva un ordine (review)', () => {
    const order = createOrder({
      advertiserId: 'adv_review',
      creatorId: 'creator_rev',
      type: 'banner',
      title: 'Da approvare',
      idempotencyKey: 'o_review_001',
    });
    assignCreator(order.id, 'creator_rev', '@creator_rev');

    const reviewed = reviewOrder(order.id, {
      orderId: order.id,
      action: 'approve',
      notes: 'Bozza approvata',
      reviewerId: 'creator_rev',
      reviewerRole: 'creator',
    });
    expect(reviewed.order).not.toBeNull();
    expect(reviewed.order?.status).toBe('approved');
    expect(reviewed.order?.approvedAt).toBeDefined();
  });

  it('richiede revisione su un ordine', () => {
    const order = createOrder({
      advertiserId: 'adv_rev2',
      type: 'banner',
      title: 'Revisione richiesta',
      idempotencyKey: 'o_rev2_001',
    });
    const reviewed = reviewOrder(order.id, {
      orderId: order.id,
      action: 'request_revision',
      notes: 'Cambia i colori',
      reviewerId: 'adv_rev2',
      reviewerRole: 'advertiser',
    });
    expect(reviewed.order?.status).toBe('revision_requested');
    expect(reviewed.order?.revisionNotes).toBe('Cambia i colori');
  });

  it('rifiuta un ordine', () => {
    const order = createOrder({
      advertiserId: 'adv_rej',
      type: 'video',
      title: 'Da rifiutare',
      idempotencyKey: 'o_rej_001',
    });
    const reviewed = reviewOrder(order.id, {
      orderId: order.id,
      action: 'reject',
      notes: 'Contenuto non idoneo',
      reviewerId: 'adv_rej',
      reviewerRole: 'advertiser',
    });
    expect(reviewed.order?.status).toBe('rejected');
    expect(reviewed.order?.rejectedReason).toBe('Contenuto non idoneo');
  });

  it('collega ordine approvato a creatività pubblicitaria', () => {
    const order = createOrder({
      advertiserId: 'adv_link',
      type: 'banner',
      title: 'Link creative',
      idempotencyKey: 'o_link_001',
    });
    reviewOrder(order.id, {
      orderId: order.id,
      action: 'approve',
      notes: 'OK',
      reviewerId: 'adv_link',
      reviewerRole: 'advertiser',
    });

    const creativeId = `creative_link_${Date.now()}`;
    saveCreative({
      id: creativeId,
      campaignId: 'camp_link',
      type: 'banner',
      title: 'Creative linkata',
      fileUrl: '/ads/creative.png',
      format: 'png',
    } as any);
    approveCreative(creativeId);

    const result = linkOrderToCreative(order.id, creativeId);
    expect(result.order).not.toBeNull();
    expect(result.order?.status).toBe('completed');
    expect(result.order?.creativeId).toBe(creativeId);
    expect(result.creative?.id).toBe(creativeId);
  });

  it('rifiuta link se creatività non approvata', () => {
    const order = createOrder({
      advertiserId: 'adv_link2',
      type: 'banner',
      title: 'Link non approvato',
      idempotencyKey: 'o_link2_001',
    });
    const creativeId = `creative_pending_${Date.now()}`;
    saveCreative({
      id: creativeId,
      campaignId: 'camp_link2',
      type: 'banner',
      title: 'Creative pendente',
    } as any); // status pending di default

    const result = linkOrderToCreative(order.id, creativeId);
    expect(result.order).not.toBeNull();
    expect(result.error).toContain('non è ancora approvata');
  });

  it('elimina un ordine', () => {
    const order = createOrder({
      advertiserId: 'adv_del',
      type: 'banner',
      title: 'Da eliminare',
      idempotencyKey: 'o_del_001',
    });
    const deleted = deleteOrder(order.id);
    expect(deleted).toBe(true);
    expect(getOrder(order.id)).toBeNull();
  });

  it('elimina ordine inesistente restituisce false', () => {
    expect(deleteOrder('ordine_inesistente_del')).toBe(false);
  });

  it('lista tutti gli ordini', () => {
    createOrder({ advertiserId: 'adv_all', type: 'banner', title: 'T1', idempotencyKey: 'o_all_1' });
    createOrder({ advertiserId: 'adv_all', type: 'video', title: 'T2', idempotencyKey: 'o_all_2' });
    const all = listAllOrders();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});

// ========== Punto 12 — Sicurezza: autenticazione e autorizzazione ==========

describe('Punto 12 — Autenticazione server-side', () => {
  beforeEach(() => {
    resetOrders();
  });
  afterEach(() => {
    resetOrders();
  });

  it('autentica con Pi Network Bearer token', () => {
    const req = {
      headers: { authorization: 'Bearer pi_access_token_12345' },
      ip: '1.2.3.4',
    } as any;
    const result = authenticateRequest(req);
    expect(result.authenticated).toBe(true);
    expect(result.userId).toBe('pi_pi_access_token_');
    expect(result.tokenType).toBe('pi_bearer');
    expect(result.role).toBe('user');
  });

  it('autentica con Firebase ID token (X-Firebase-Token)', () => {
    const req = {
      headers: { 'x-firebase-token': 'firebase_id_token_abcdef' },
      ip: '1.2.3.4',
    } as any;
    const result = authenticateRequest(req);
    expect(result.authenticated).toBe(true);
    expect(result.tokenType).toBe('firebase_id');
  });

  it('autentica con API key server-to-server', () => {
    process.env.PI_API_KEY = 'test_secret_key';
    const req = {
      headers: { 'x-api-key': 'test_secret_key' },
      ip: '1.2.3.4',
    } as any;
    const result = authenticateRequest(req);
    expect(result.authenticated).toBe(true);
    expect(result.role).toBe('platform');
    expect(result.tokenType).toBe('api_key');
    delete process.env.PI_API_KEY;
  });

  it('rifiuta richiesta senza autenticazione', () => {
    const req = { headers: {}, ip: '1.2.3.4' } as any;
    const result = authenticateRequest(req);
    expect(result.authenticated).toBe(false);
    expect(result.error).toContain('Autenticazione richiesta');
  });

  it('autorizza ruolo advertiser', () => {
    const auth = { authenticated: true, userId: 'u1', role: 'advertiser' as AdRole };
    const r = authorizeRole(auth, ['advertiser', 'creator']);
    expect(r.allowed).toBe(true);
  });

  it('nega autorizzazione a ruolo non consentito', () => {
    const auth = { authenticated: true, userId: 'u1', role: 'user' as AdRole };
    const r = authorizeRole(auth, ['advertiser', 'creator']);
    expect(r.allowed).toBe(false);
    expect(r.error).toContain('non autorizzato');
  });

  it('nega autorizzazione se non autenticato', () => {
    const auth = { authenticated: false };
    const r = authorizeRole(auth, ['advertiser']);
    expect(r.allowed).toBe(false);
    expect(r.error).toContain('Non autenticato');
  });
});

// ========== Punto 12 — Validazione file e MIME ==========

describe('Punto 12 — Validazione file e MIME', () => {
  it('accetta immagini consentite', () => {
    for (const [name, mime] of [
      ['foto.jpg', 'image/jpeg'],
      ['foto.jpeg', 'image/jpeg'],
      ['foto.png', 'image/png'],
      ['foto.webp', 'image/webp'],
      ['foto.gif', 'image/gif'],
    ]) {
      const r = validateFileUpload({ fileName: name, mimeType: mime, sizeBytes: 50000 });
      expect(r.valid).toBe(true);
    }
  });

  it('accetta video consentiti', () => {
    for (const [name, mime] of [
      ['clip.mp4', 'video/mp4'],
      ['clip.webm', 'video/webm'],
      ['clip.mov', 'video/quicktime'],
    ]) {
      const r = validateFileUpload({ fileName: name, mimeType: mime, sizeBytes: 1000000 });
      expect(r.valid).toBe(true);
    }
  });

  it('rifiuta estensione non consentita', () => {
    const r = validateFileUpload({
      fileName: 'script.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: 1000,
    });
    expect(r.valid).toBe(false);
    expect(r.error).toContain('Estensione non consentita');
  });

  it('rifiuta MIME type non consentito', () => {
    const r = validateFileUpload({
      fileName: 'foto.jpg',
      mimeType: 'text/html',
      sizeBytes: 1000,
    });
    expect(r.valid).toBe(false);
    expect(r.error).toContain('MIME type non consentito');
  });

  it('rifiuta file troppo grande', () => {
    const r = validateFileUpload({
      fileName: 'grande.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 60 * 1024 * 1024, // 60 MB
    });
    expect(r.valid).toBe(false);
    expect(r.error).toContain('troppo grande');
  });

  it('rifiuta nome file mancante', () => {
    const r = validateFileUpload({ fileName: '', mimeType: 'image/png', sizeBytes: 100 });
    expect(r.valid).toBe(false);
  });
});

// ========== Punto 12 — Protezione SSRF ==========

describe('Punto 12 — Protezione SSRF', () => {
  it('consente URL esterni HTTP/HTTPS', () => {
    for (const url of [
      'https://example.com/file.png',
      'http://cdn.have2want.it/ads/banner.jpg',
      'https://urbano3d.pages.dev/upload/x.png',
    ]) {
      const r = validateUrlNoSsrf(url);
      expect(r.safe).toBe(true);
    }
  });

  it('blocca localhost', () => {
    const r = validateUrlNoSsrf('http://localhost:3000/internal');
    expect(r.safe).toBe(false);
    expect(r.error).toContain('SSRF');
  });

  it('blocca 127.0.0.1', () => {
    const r = validateUrlNoSsrf('http://127.0.0.1/admin');
    expect(r.safe).toBe(false);
  });

  it('blocca indirizzi interni 10.x, 192.168.x, 172.16-31.x', () => {
    const r1 = validateUrlNoSsrf('http://10.0.0.1/metadata');
    const r2 = validateUrlNoSsrf('http://192.168.1.1/admin');
    const r3 = validateUrlNoSsrf('http://172.20.0.1/metadata');
    expect(r1.safe).toBe(false);
    expect(r2.safe).toBe(false);
    expect(r3.safe).toBe(false);
  });

  it('blocca link-local 169.254.x (AWS metadata)', () => {
    const r = validateUrlNoSsrf('http://169.254.169.254/latest/meta-data/');
    expect(r.safe).toBe(false);
    expect(r.error).toContain('SSRF');
  });

  it('blocca protocollo non consentito (file://)', () => {
    const r = validateUrlNoSsrf('file:///etc/passwd');
    expect(r.safe).toBe(false);
  });

  it('blocca URL non valido', () => {
    const r = validateUrlNoSsrf('non è un url');
    expect(r.safe).toBe(false);
  });
});

// ========== Punto 12 — Rate limiting ==========

describe('Punto 12 — Rate limiting', () => {
  it('consente richieste entro il limite', () => {
    for (let i = 0; i < 10; i++) {
      const r = checkRateLimit('user_test_rl');
      expect(r.allowed).toBe(true);
    }
  });

  it('blocca oltre il limite massimo', () => {
    const key = `rl_test_${Date.now()}`;
    let allowed = 0;
    let blocked = 0;
    for (let i = 0; i < 70; i++) {
      const r = checkRateLimit(key, { windowMs: 60_000, maxRequests: 60 });
      if (r.allowed) allowed++;
      else blocked++;
    }
    expect(allowed).toBe(60);
    expect(blocked).toBeGreaterThan(0);
  });
});

// ========== Punto 12 — Audit log ==========

describe('Punto 12 — Audit log', () => {
  it('scrive e legge voci di audit', () => {
    writeAuditLog({
      action: 'test_action',
      userId: 'user_audit',
      role: 'advertiser',
      ip: '1.2.3.4',
      path: '/api/ads/test',
      method: 'POST',
      status: 200,
      success: true,
      details: { test: true },
    });
    const entries = getAuditLog(10);
    expect(entries.length).toBeGreaterThan(0);
    const last = entries[entries.length - 1];
    expect(last.action).toBe('test_action');
    expect(last.userId).toBe('user_audit');
    expect(last.success).toBe(true);
  });
});

// ========== Punto 10 — Idempotenza e integrità sugli endpoint esistenti ==========

describe('Punto 10 — Idempotenza e integrità', () => {
  beforeEach(() => {
    resetOrders();
  });
  afterEach(() => {
    resetOrders();
  });

  it('idempotenza su creazione ordine con stessa chiave', () => {
    const input = {
      advertiserId: 'adv_idem',
      type: 'banner' as const,
      title: 'Idempotent order',
      idempotencyKey: 'idem_order_fixed',
    };
    const o1 = createOrder(input);
    const o2 = createOrder(input);
    expect(o2.id).toBe(o1.id);
    expect(listAllOrders().filter((o) => o.idempotencyKey === 'idem_order_fixed').length).toBe(1);
  });

  it('integrità: cambio stato ordine aggiorna updatedAt', () => {
    const order = createOrder({
      advertiserId: 'adv_int',
      type: 'banner',
      title: 'Integrità test',
      idempotencyKey: 'o_int_001',
    });
    const before = order.updatedAt;
    const updated = updateOrderStatus(order.id, 'cancelled', 'adv_int', 'Test integrità');
    expect(updated).not.toBeNull();
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('integrità: submitDraft aggiorna files e messages', () => {
    const order = createOrder({
      advertiserId: 'adv_int2',
      type: 'video',
      title: 'Integrità draft',
      idempotencyKey: 'o_int2_001',
    });
    const r1 = submitDraft(order.id, {
      fileKey: 'ads/v1.mp4',
      fileUrl: '/uploads/ads/v1.mp4',
      fileName: 'v1.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 500000,
      uploadedBy: 'adv_int2',
    });
    expect(r1.order?.files.length).toBe(1);
    const r2 = submitDraft(order.id, {
      fileKey: 'ads/v2.mp4',
      fileUrl: '/uploads/ads/v2.mp4',
      fileName: 'v2.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 500000,
      uploadedBy: 'adv_int2',
    });
    expect(r2.order?.files.length).toBe(2);
  });
});
