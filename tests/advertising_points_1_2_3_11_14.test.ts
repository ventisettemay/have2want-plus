/**
 * Test per i punti 1, 2, 3, 11, 14 del sistema pubblicitario HAVE2WANT PLUS.
 * - Punto 1: Creative Store (progetti + libreria media)
 * - Punti 3, 11, 14: Provider Registry (Adapter, priorità, health-check, failover,
 *   Gemini API + fallback deterministico locale, retrocompatibile AdCreative 1.0)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  adProviderRegistry,
  LocalDeterministicAdapter,
  GeminiAdapter,
  type AdProviderAdapter,
  type ModerationInput,
  type AnalyzeInput,
  type GenerateAssetInput,
  type ModerationResult,
  type AnalyzeResult,
  type GenerateAssetResult,
} from '../src/lib/adProviderRegistry';
import {
  getProject,
  listProjectsByAdvertiser,
  createProject,
  updateProject,
  deleteProject,
  exportProject,
  getMedia,
  listMediaByAdvertiser,
  addMedia,
  deleteMedia,
  resetCreativeStoreForTests,
} from '../src/lib/adCreativeStore';

// ========== Punti 3, 11, 14 — Provider Registry ==========

class FailingAdapter implements AdProviderAdapter {
  name = 'failing';
  priority = 5;
  isAvailable(): boolean { return true; }
  async healthCheck() { return { ok: false, latencyMs: 0, error: 'down' }; }
  async moderate(_input: ModerationInput): Promise<ModerationResult> { throw new Error('provider down'); }
  async analyze(_input: AnalyzeInput): Promise<AnalyzeResult> { throw new Error('provider down'); }
  async generateAsset(_input: GenerateAssetInput): Promise<GenerateAssetResult> { throw new Error('provider down'); }
}

describe('Punti 3/11/14 — Provider Registry (AdCreative 1.0)', () => {
  beforeEach(() => {
    // Svuota il registry e registra solo il fallback deterministico per i test
    (adProviderRegistry as any).adapters = [];
    (adProviderRegistry as any).healthCache = new Map();
    adProviderRegistry.register(new LocalDeterministicAdapter());
  });
  afterEach(() => {
    (adProviderRegistry as any).adapters = [];
    (adProviderRegistry as any).healthCache = new Map();
    adProviderRegistry.register(new LocalDeterministicAdapter());
  });

  it('registra e ordina provider per priorità', () => {
    adProviderRegistry.register(new FailingAdapter());
    const adapters = adProviderRegistry.getAdapters();
    // local-deterministic (priorità 100) dopo failing (priorità 5)
    expect(adapters[0].name).toBe('failing');
    expect(adapters[1].name).toBe('local-deterministic');
  });

  it('restituisce solo provider disponibili', () => {
    const available = adProviderRegistry.getAvailable();
    expect(available.length).toBeGreaterThan(0);
    expect(available.every((a) => a.isAvailable())).toBe(true);
  });

  it('health-check di tutti i provider', async () => {
    adProviderRegistry.register(new FailingAdapter());
    const health = await adProviderRegistry.healthCheckAll();
    expect(health.length).toBe(2);
    const local = health.find((h) => h.name === 'local-deterministic');
    expect(local?.ok).toBe(true);
    const failing = health.find((h) => h.name === 'failing');
    expect(failing?.ok).toBe(false);
  });

  it('moderazione blocca contenuti proibiti (fallback locale)', async () => {
    const result = await adProviderRegistry.moderateWithFailover({
      text: 'Questa è una truffa, guadagni facili immediati',
    });
    expect(result.allowed).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.provider).toBe('local-deterministic');
    expect(result.reason).toContain('truffa');
  });

  it('moderazione consente contenuti sicuri', async () => {
    const result = await adProviderRegistry.moderateWithFailover({
      text: 'Sconto del 20% sui prodotti artigianali locali',
    });
    expect(result.allowed).toBe(true);
    expect(result.score).toBeLessThan(50);
  });

  it('analisi testi estrae keyword e brand safety', async () => {
    const result = await adProviderRegistry.analyzeWithFailover({
      text: 'Offerte speciali su prodotti bio a km zero',
    });
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.brandSafety).toBe(true);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.provider).toBe('local-deterministic');
  });

  it('generazione asset produce SVG valido', async () => {
    const result = await adProviderRegistry.generateAssetWithFailover({
      type: 'banner',
      title: 'Offerta Estate',
      cta: 'Scopri di più',
      width: 300,
      height: 250,
    });
    expect(result.assetUrl).toContain('data:image/svg+xml');
    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.width).toBe(300);
    expect(result.height).toBe(250);
    expect(result.provider).toBe('local-deterministic');
  });

  it('failover usa provider successivo se il primo fallisce', async () => {
    adProviderRegistry.register(new FailingAdapter());
    const result = await adProviderRegistry.moderateWithFailover({
      text: 'contenuto sicuro',
    });
    expect(result.provider).toBe('local-deterministic');
    expect(result.allowed).toBe(true);
  });

  it('lancia errore se nessun provider disponibile', async () => {
    (adProviderRegistry as any).adapters = [];
    await expect(
      adProviderRegistry.moderateWithFailover({ text: 'x' })
    ).rejects.toThrow(/Nessun provider disponibile/);
    // Ripristina
    adProviderRegistry.register(new LocalDeterministicAdapter());
  });

  it('health snapshot contiene voci dopo healthCheckAll', async () => {
    await adProviderRegistry.healthCheckAll();
    const snapshot = adProviderRegistry.getHealthSnapshot();
    expect(snapshot.length).toBeGreaterThan(0);
    expect(snapshot[0].name).toBeDefined();
  });

  it('Gemini adapter non disponibile senza API key', () => {
    const gemini = new GeminiAdapter();
    expect(gemini.isAvailable()).toBe(false);
  });
});

// ========== Punto 1 — Creative Store (progetti e media) ==========

describe('Punto 1 — Creative Store', () => {
  beforeEach(() => {
    resetCreativeStoreForTests();
  });
  afterEach(() => {
    resetCreativeStoreForTests();
  });

  it('crea, lista e recupera un progetto creativo', () => {
    const proj = createProject({
      advertiserId: 'adv_01',
      advertiserUsername: '@mercante',
      name: 'Banner Estate',
      type: 'banner',
      canvasState: { title: 'Sconto 20%', format: '300x250' },
      width: 300,
      height: 250,
      format: '300x250',
    });
    expect(proj.id).toBeDefined();
    expect(proj.name).toBe('Banner Estate');
    expect(proj.status).toBe('draft');

    const fetched = getProject(proj.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(proj.id);

    const list = listProjectsByAdvertiser('adv_01');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(proj.id);
  });

  it('aggiorna progetto (canvasState, status, exportedUrl)', () => {
    const proj = createProject({
      advertiserId: 'adv_02',
      name: 'Progetto da aggiornare',
      type: 'banner',
      canvasState: {},
      width: 300,
      height: 250,
    });
    const updated = updateProject(proj.id, {
      name: 'Nuovo Nome',
      status: 'exported',
      exportedUrl: 'data:image/png;base64,abc',
      mimeType: 'image/png',
    });
    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('Nuovo Nome');
    expect(updated?.status).toBe('exported');
    expect(updated?.exportedUrl).toBe('data:image/png;base64,abc');
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(proj.updatedAt);
  });

  it('esporta progetto imposta status exported', () => {
    const proj = createProject({
      advertiserId: 'adv_03',
      name: 'Da esportare',
      type: 'video',
      canvasState: {},
      width: 1280,
      height: 720,
      format: '16:9',
    });
    const exported = exportProject(proj.id, 'data:image/webp;base64,xyz', 'image/webp');
    expect(exported).not.toBeNull();
    expect(exported?.status).toBe('exported');
    expect(exported?.mimeType).toBe('image/webp');
  });

  it('elimina progetto', () => {
    const proj = createProject({
      advertiserId: 'adv_04',
      name: 'Da eliminare',
      type: 'banner',
      canvasState: {},
      width: 300,
      height: 250,
    });
    const deleted = deleteProject(proj.id);
    expect(deleted).toBe(true);
    expect(getProject(proj.id)).toBeNull();
  });

  it('elimina progetto inesistente restituisce false', () => {
    expect(deleteProject('progetto_inesistente')).toBe(false);
  });

  it('lista progetti per advertiser (filtro corretto)', () => {
    createProject({ advertiserId: 'adv_a', name: 'A1', type: 'banner', canvasState: {}, width: 100, height: 100 });
    createProject({ advertiserId: 'adv_a', name: 'A2', type: 'video', canvasState: {}, width: 200, height: 200 });
    createProject({ advertiserId: 'adv_b', name: 'B1', type: 'banner', canvasState: {}, width: 100, height: 100 });
    expect(listProjectsByAdvertiser('adv_a').length).toBe(2);
    expect(listProjectsByAdvertiser('adv_b').length).toBe(1);
  });

  it('aggiunge, lista ed elimina media', () => {
    const media = addMedia({
      advertiserId: 'adv_m',
      fileKey: 'ads/logo.png',
      fileUrl: '/uploads/ads/logo.png',
      fileName: 'logo.png',
      mimeType: 'image/png',
      sizeBytes: 10240,
      tags: ['logo', 'brand'],
    });
    expect(media.id).toBeDefined();
    expect(media.fileName).toBe('logo.png');

    const list = listMediaByAdvertiser('adv_m');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(media.id);

    const fetched = getMedia(media.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.fileName).toBe('logo.png');

    const del = deleteMedia(media.id);
    expect(del).toBe(true);
    expect(getMedia(media.id)).toBeNull();
  });

  it('media non trovato restituisce null', () => {
    expect(getMedia('media_inesistente')).toBeNull();
    expect(deleteMedia('media_inesistente')).toBe(false);
  });

  it('filtro media per advertiser', () => {
    addMedia({ advertiserId: 'adv_x', fileKey: 'k1', fileUrl: '/u/1.png', fileName: '1.png', mimeType: 'image/png', sizeBytes: 100 });
    addMedia({ advertiserId: 'adv_y', fileKey: 'k2', fileUrl: '/u/2.png', fileName: '2.png', mimeType: 'image/png', sizeBytes: 100 });
    expect(listMediaByAdvertiser('adv_x').length).toBe(1);
    expect(listMediaByAdvertiser('adv_y').length).toBe(1);
  });
});
