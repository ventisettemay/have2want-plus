import type { AI, D1Database, ProviderRow } from './types';
import { getProviders, incrementProviderUsage, getProvider, run } from './db';
import { nowMs } from './auth';

/* ------------------------------------------------------------------ */
/* Soglia di dirottamento fluido (70% - max 75%)                     */
/* ------------------------------------------------------------------ */

const DRIFT_THRESHOLD = 0.70;
const MAX_DRIFT_THRESHOLD = 0.75;

/* ------------------------------------------------------------------ */
/* Selezione provider per categoria                                   */
/* ------------------------------------------------------------------ */

export async function selectProvider(
  db: D1Database,
  category: string
): Promise<ProviderRow | null> {
  const providers = await getProviders(db);
  const now = nowMs();

  const eligible = providers.filter((p) => {
    if (p.category !== category) return false;
    if (p.available !== 1) return false;
    // Reset quota giornaliera se scaduta
    if (now >= p.reset_at) return true;
    const used = p.used_today ?? 0;
    const quota = p.daily_quota ?? 0;
    if (quota <= 0) return true;
    const ratio = used / quota;
    // Dirotta se superato 70% (max 75%)
    return ratio < DRIFT_THRESHOLD;
  });

  if (eligible.length > 0) {
    // Più priorità = numero minore
    eligible.sort((a, b) => a.priority - b.priority);
    return eligible[0];
  }

  // Fallback forzato: primo disponibile della categoria (quota esaurita)
  const fallback = providers
    .filter((p) => p.category === category && p.available === 1)
    .sort((a, b) => a.priority - b.priority);
  return fallback[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Router AI generico con failover                                    */
/* ------------------------------------------------------------------ */

interface AIResult {
  provider: string;
  model: string;
  output: unknown;
  latencyMs: number;
}

export async function runWithFailover(
  env: { AI: AI; DB: D1Database },
  category: string,
  models: Array<{ provider: string; model: string; run: (input: unknown) => Promise<unknown> }>,
  input: unknown
): Promise<AIResult> {
  const start = nowMs();
  let lastError: Error | null = null;

  for (const m of models) {
    try {
      const out = await m.run(input);
      const provider = await selectProvider(env.DB, category);
      if (provider) {
        await incrementProviderUsage(env.DB, provider.name, 1);
      }
      return {
        provider: provider?.name ?? m.provider,
        model: m.model,
        output: out,
        latencyMs: nowMs() - start,
      };
    } catch (err: any) {
      lastError = err;
      // Se il provider è down, segnalo non disponibile
      const provider = await getProvider(env.DB, m.provider);
      if (provider) {
        await run(env.DB, `UPDATE provider_registry SET available = 0, error = ? WHERE name = ?`, err?.message ?? 'provider error', m.provider);
      }
      continue;
    }
  }

  throw lastError ?? new Error(`Nessun provider disponibile per categoria ${category}`);
}

/* ------------------------------------------------------------------ */
/* Generazione immagini                                               */
/* ------------------------------------------------------------------ */

export async function generateImage(
  env: { AI: AI; DB: D1Database },
  prompt: string,
  { width = 512, height = 512 }: { width?: number; height?: number } = {}
): Promise<{ provider: string; model: string; imageUrl: string; latencyMs: number }> {
  const models = [
    {
      provider: 'cloudflare-workers-ai',
      model: '@cf/black-forest-labs/flux-1-schnell',
      run: async (input: unknown) => {
        const res = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
          prompt: input as string,
          width,
          height,
        });
        return res;
      },
    },
    {
      provider: 'pollinations',
      model: 'flux',
      run: async (input: unknown) => {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input as string)}?width=${width}&height=${height}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Pollinations HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return `data:image/png;base64,${base64}`;
      },
    },
  ];

  const result = await runWithFailover(env, 'image', models, prompt);
  return {
    provider: result.provider,
    model: result.model,
    imageUrl: typeof result.output === 'string' ? result.output : String(result.output),
    latencyMs: result.latencyMs,
  };
}

/* ------------------------------------------------------------------ */
/* Moderazione & Vision                                               */
/* ------------------------------------------------------------------ */

export async function moderateVision(
  env: { AI: AI; DB: D1Database },
  input: { text?: string; imageDataUrl?: string }
): Promise<{ provider: string; model: string; allowed: boolean; score: number; reason?: string; latencyMs: number }> {
  const models = [
    {
      provider: 'openai',
      model: 'omni-moderation-latest',
      run: async (inp: unknown) => {
        const res = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.AI as unknown as string}`, // placeholder: API key da secret
          },
          body: JSON.stringify({ input: inp }),
        });
        if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
        return res.json();
      },
    },
    {
      provider: 'groq',
      model: 'qwen/qwen3.8-27b',
      run: async (inp: unknown) => {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer groq-api-key`, // placeholder
          },
          body: JSON.stringify({
            model: 'qwen/qwen3-8b-32768',
            messages: [{ role: 'user', content: JSON.stringify(inp) }],
          }),
        });
        if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
        return res.json();
      },
    },
    {
      provider: 'openrouter',
      model: ':free',
      run: async (inp: unknown) => {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer openrouter-api-key`, // placeholder
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.2-11b-vision-instruct:free',
            messages: [{ role: 'user', content: JSON.stringify(inp) }],
          }),
        });
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
        return res.json();
      },
    },
    {
      provider: 'locale',
      model: 'tesseract-fallback',
      run: async (inp: unknown) => {
        // Fallback deterministico locale (nessuna chiamata esterna)
        const text = (inp as any)?.text ?? '';
        const blocked = ['truffa', 'scam', 'droga', 'arma', 'odio', 'porno', 'casino', 'scommessa'];
        const hit = blocked.find((k) => text.toLowerCase().includes(k));
        return {
          allowed: !hit,
          score: hit ? 90 : 10,
          reason: hit ? `Contenuto bloccato: ${hit}` : 'Ok',
        };
      },
    },
  ];

  const result = await runWithFailover(env, 'vision', models, input);
  const out = result.output as any;
  return {
    provider: result.provider,
    model: result.model,
    allowed: out?.allowed ?? true,
    score: out?.score ?? 0,
    reason: out?.reason,
    latencyMs: result.latencyMs,
  };
}
