// Provider Registry pubblicitario (Punti 3, 11, 14).
// Layer parallelo e retrocompatibile con AdCreative 1.0: non modifica le rotte esistenti
// (/api/campaigns, /api/feed/ads, /api/impressions/certify, /api/uploads/presign, /execute).
// Implementa:
//  - Adapter standard con interfaccia unificata
//  - Priorità di esecuzione (numero minore = priorità maggiore)
//  - Health-check per provider
//  - Failover automatico tra provider disponibili
//  - Provider Gemini API (se GEMINI_API_KEY configurata) + fallback deterministi locali
//  - Moderazione, controllo qualità, analisi metadati/OCR testuale, generazione asset
// Nessuna nuova dipendenza esterna (uso solo fetch nativo).
// Variabile d'ambiente opzionale: GEMINI_API_KEY

import crypto from 'crypto';
import type { AdCreativeType } from './adTypes';

// ========== Tipi ==========

export type AdProviderAction = 'moderate' | 'analyze' | 'generate-asset' | 'health';

export interface ModerationInput {
  text: string;
  creativeId?: string;
}

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  score: number; // 0 = sicuro, 100 = bloccato
  provider: string;
}

export interface AnalyzeInput {
  text?: string;
  imageDataUrl?: string;
  creativeId?: string;
}

export interface AnalyzeResult {
  text?: string;
  keywords?: string[];
  brandSafety: boolean;
  language?: string;
  wordCount?: number;
  metadata: Record<string, unknown>;
  provider: string;
}

export interface GenerateAssetInput {
  type: AdCreativeType;
  title: string;
  cta?: string;
  width?: number;
  height?: number;
  logoUrl?: string;
  fileUrl?: string;
}

export interface GenerateAssetResult {
  assetUrl: string;
  mimeType: string;
  width: number;
  height: number;
  provider: string;
}

export interface ProviderHealth {
  name: string;
  priority: number;
  available: boolean;
  ok: boolean;
  latencyMs?: number;
  error?: string;
  lastCheck: number;
}

export interface AdProviderAdapter {
  name: string;
  priority: number;
  isAvailable(): boolean;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
  analyze(input: AnalyzeInput): Promise<AnalyzeResult>;
  generateAsset(input: GenerateAssetInput): Promise<GenerateAssetResult>;
}

// ========== Keyword di brand safety (fallback deterministico) ==========

const BLOCKED_KEYWORDS = [
  'truffa', 'scam', 'frode', 'inganno', 'falso', 'fake',
  'droga', 'stupefacente', 'spacci', 'arma', 'pistola', 'coltello',
  'violenza', 'odio', 'razz', 'discriminaz', 'adulto', 'porno',
  'casino', 'scommessa', 'bingo', 'slot', 'prestito', 'usura',
  'bitcoin truffa', 'guadagno facile', 'arricchirsi subito',
];

const SUSPICIOUS_KEYWORDS = [
  'gratis', 'omaggio', 'vince', 'vincita', 'premio', 'clicca qui',
  'urgente', 'immediato', 'offerta limitata',
];

function containsKeyword(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

function simpleOcrText(input: string | undefined): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-zàèéìòù0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);
}

function detectLanguage(text: string): string | undefined {
  if (!text) return undefined;
  const itMarkers = [' di ', ' del ', ' la ', ' le ', ' il ', ' lo ', ' che ', ' e ', ' è ', ' un ', ' una '];
  let itScore = 0;
  for (const m of itMarkers) {
    if (text.toLowerCase().includes(m)) itScore++;
  }
  return itScore >= 2 ? 'it' : 'en';
}

// ========== Provider: Gemini API ==========

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class GeminiAdapter implements AdProviderAdapter {
  name = 'gemini';
  priority = 10; // alta priorità se configurata

  isAvailable(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  private async callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY non configurata');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        '';
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      if (!this.isAvailable()) {
        return { ok: false, latencyMs: 0, error: 'GEMINI_API_KEY non configurata' };
      }
      await this.callGemini('Di OK');
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, error: err?.message || 'Gemini health check fallito' };
    }
  }

  async moderate(input: ModerationInput): Promise<ModerationResult> {
    const prompt = `Analizza il seguente testo pubblicitario e rispondi solo con JSON valido: {"allowed": true/false, "reason": "...", "score": 0-100}. Blocca contenuti illegali, truffa, droga, armi, odio, adulto, gioco d'azzardo, prestiti usurai, guadagni facili. Testo: "${input.text}"`;
    const text = await this.callGemini(prompt);
    let parsed: { allowed?: boolean; reason?: string; score?: number };
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { allowed: true, reason: 'Parsing Gemini non riuscito, fallback permissivo', score: 10 };
    }
    return {
      allowed: parsed.allowed ?? true,
      reason: parsed.reason,
      score: parsed.score ?? 0,
      provider: 'gemini',
    };
  }

  async analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    const text = simpleOcrText(input.text);
    const prompt = `Analizza questa creatività pubblicitaria e rispondi con JSON: {"keywords": [], "brandSafety": true/false, "language": "...", "metadata": {}}. Testo: "${text}"`;
    const geminiText = await this.callGemini(prompt);
    let parsed: any = {};
    try {
      parsed = JSON.parse(geminiText);
    } catch {
      parsed = {};
    }
    return {
      text,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : extractKeywords(text),
      brandSafety: parsed.brandSafety ?? true,
      language: parsed.language || detectLanguage(text),
      wordCount: text.split(/\s+/).filter(Boolean).length,
      metadata: parsed.metadata ?? { source: 'gemini', analyzedAt: Date.now() },
      provider: 'gemini',
    };
  }

  async generateAsset(input: GenerateAssetInput): Promise<GenerateAssetResult> {
    const prompt = `Genera una descrizione di asset pubblicitario ${input.type} con titolo "${input.title}"${input.cta ? ` e CTA "${input.cta}"` : ''}. Rispondi JSON: {"description": "...", "suggestedColors": [], "layout": "..."}`;
    const text = await this.callGemini(prompt);
    const width = input.width ?? 300;
    const height = input.height ?? 250;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#1e293b"/>
        <text x="50%" y="40%" font-family="sans-serif" font-size="${Math.min(width, height) / 6}" fill="#ffffff" text-anchor="middle" font-weight="bold">${escapeXml(input.title)}</text>
        ${input.cta ? `<text x="50%" y="60%" font-family="sans-serif" font-size="${Math.min(width, height) / 10}" fill="#0ea5e9" text-anchor="middle">${escapeXml(input.cta)}</text>` : ''}
      </svg>
    `.trim();
    const assetUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return {
      assetUrl,
      mimeType: 'image/svg+xml',
      width,
      height,
      provider: 'gemini',
    };
  }
}

// ========== Provider: Fallback deterministico locale ==========

export class LocalDeterministicAdapter implements AdProviderAdapter {
  name = 'local-deterministic';
  priority = 100; // priorità bassa, usato come fallback

  isAvailable(): boolean {
    return true;
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    return { ok: true, latencyMs: 0 };
  }

  async moderate(input: ModerationInput): Promise<ModerationResult> {
    const text = input.text || '';
    const blocked = containsKeyword(text, BLOCKED_KEYWORDS);
    const suspicious = containsKeyword(text, SUSPICIOUS_KEYWORDS);
    let score = 0;
    let reason: string | undefined;
    let allowed = true;
    if (blocked) {
      allowed = false;
      score = 90;
      reason = `Contenuto non consentito rilevato: "${blocked}"`;
    } else if (suspicious) {
      score = 40;
      reason = `Contenuto potenzialmente sensibile: "${suspicious}"`;
    }
    return { allowed, reason, score, provider: 'local-deterministic' };
  }

  async analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    const text = simpleOcrText(input.text);
    const blocked = containsKeyword(text, BLOCKED_KEYWORDS);
    return {
      text,
      keywords: extractKeywords(text),
      brandSafety: !blocked,
      language: detectLanguage(text),
      wordCount: text.split(/\s+/).filter(Boolean).length,
      metadata: {
        source: 'local-deterministic',
        analyzedAt: Date.now(),
        ocrSimulated: true,
        imageProvided: Boolean(input.imageDataUrl),
      },
      provider: 'local-deterministic',
    };
  }

  async generateAsset(input: GenerateAssetInput): Promise<GenerateAssetResult> {
    const width = input.width ?? 300;
    const height = input.height ?? 250;
    const ctaText = input.cta ? `\n${input.cta}` : '';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <rect x="10%" y="10%" width="80%" height="80%" fill="none" stroke="#334155" stroke-width="2"/>
        <text x="50%" y="45%" font-family="sans-serif" font-size="${Math.min(width, height) / 8}" fill="#e2e8f0" text-anchor="middle">${escapeXml(input.title)}</text>
        ${input.cta ? `<text x="50%" y="62%" font-family="sans-serif" font-size="${Math.min(width, height) / 12}" fill="#22d3ee" text-anchor="middle" font-weight="bold">${escapeXml(input.cta)}</text>` : ''}
        <text x="50%" y="95%" font-family="sans-serif" font-size="${Math.min(width, height) / 20}" fill="#64748b" text-anchor="middle">HAVE2WANT PLUS — AdCreative 1.0</text>
      </svg>
    `.trim();
    const assetUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return {
      assetUrl,
      mimeType: 'image/svg+xml',
      width,
      height,
      provider: 'local-deterministic',
    };
  }
}

// ========== Registry ==========

export class AdProviderRegistry {
  private adapters: AdProviderAdapter[] = [];
  private healthCache: Map<string, ProviderHealth> = new Map();

  register(adapter: AdProviderAdapter): void {
    this.adapters.push(adapter);
    this.adapters.sort((a, b) => a.priority - b.priority);
  }

  getAdapters(): AdProviderAdapter[] {
    return [...this.adapters];
  }

  getAvailable(): AdProviderAdapter[] {
    return this.adapters.filter((a) => a.isAvailable());
  }

  async healthCheckAll(): Promise<ProviderHealth[]> {
    const results: ProviderHealth[] = [];
    for (const adapter of this.adapters) {
      const start = Date.now();
      let ok = false;
      let error: string | undefined;
      let available = adapter.isAvailable();
      try {
        const h = await adapter.healthCheck();
        ok = h.ok;
        error = h.error;
      } catch (err: any) {
        ok = false;
        error = err?.message || 'Health check fallito';
      }
      results.push({
        name: adapter.name,
        priority: adapter.priority,
        available,
        ok,
        latencyMs: Date.now() - start,
        error,
        lastCheck: Date.now(),
      });
      this.healthCache.set(adapter.name, results[results.length - 1]);
    }
    return results;
  }

  async moderateWithFailover(input: ModerationInput): Promise<ModerationResult> {
    const available = this.getAvailable();
    let lastError: Error | null = null;
    for (const adapter of available) {
      try {
        const result = await adapter.moderate(input);
        return { ...result, provider: adapter.name };
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    throw lastError ?? new Error('Nessun provider disponibile per la moderazione');
  }

  async analyzeWithFailover(input: AnalyzeInput): Promise<AnalyzeResult> {
    const available = this.getAvailable();
    let lastError: Error | null = null;
    for (const adapter of available) {
      try {
        const result = await adapter.analyze(input);
        return { ...result, provider: adapter.name };
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    throw lastError ?? new Error('Nessun provider disponibile per l\'analisi');
  }

  async generateAssetWithFailover(input: GenerateAssetInput): Promise<GenerateAssetResult> {
    const available = this.getAvailable();
    let lastError: Error | null = null;
    for (const adapter of available) {
      try {
        const result = await adapter.generateAsset(input);
        return { ...result, provider: adapter.name };
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    throw lastError ?? new Error('Nessun provider disponibile per la generazione asset');
  }

  getHealthSnapshot(): ProviderHealth[] {
    return Array.from(this.healthCache.values());
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ========== Istanza singleton del registry ==========

export const adProviderRegistry = new AdProviderRegistry();

// Registra i provider built-in (ordine: Gemini se disponibile, poi fallback locale)
adProviderRegistry.register(new LocalDeterministicAdapter());
if (process.env.GEMINI_API_KEY) {
  adProviderRegistry.register(new GeminiAdapter());
}
