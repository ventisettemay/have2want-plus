// SERVIZIO TURN/STUN DINAMICO A COSTO ZERO — HAVE2WANT PLUS
// Recupera ICE servers OpenRelay gratuiti con fallback immediato ai server STUN Google e OpenRelay pubblici.

import {
  GOOGLE_PUBLIC_STUN_SERVERS,
  OPENRELAY_PUBLIC_FALLBACK_SERVERS,
  OPENRELAY_TURN_FALLBACK_ENDPOINT,
  IceServerEntry,
} from './freeServicesConfig';

let cachedIceServers: IceServerEntry[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

export function getStaticFreeIceServers(): IceServerEntry[] {
  return [...GOOGLE_PUBLIC_STUN_SERVERS, ...OPENRELAY_PUBLIC_FALLBACK_SERVERS];
}

export async function getDynamicIceServers(timeoutMs = 2500): Promise<IceServerEntry[]> {
  const now = Date.now();
  if (cachedIceServers && now - cachedAt < CACHE_TTL_MS) {
    return cachedIceServers;
  }

  const base = [...GOOGLE_PUBLIC_STUN_SERVERS];

  if (typeof fetch !== 'function') {
    return [...base, ...OPENRELAY_PUBLIC_FALLBACK_SERVERS];
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(OPENRELAY_TURN_FALLBACK_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(controller ? { signal: controller.signal } : {}),
    });
    if (timer) clearTimeout(timer);

    if (!res.ok) {
      return [...base, ...OPENRELAY_PUBLIC_FALLBACK_SERVERS];
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const validEntries: IceServerEntry[] = data.filter(
        (item) => item && (typeof item.urls === 'string' || Array.isArray(item.urls))
      );
      if (validEntries.length > 0) {
        cachedIceServers = [...base, ...validEntries];
        cachedAt = now;
        return cachedIceServers;
      }
    }
  } catch {
    if (timer) clearTimeout(timer);
  }

  return [...base, ...OPENRELAY_PUBLIC_FALLBACK_SERVERS];
}

export function clearTurnCache(): void {
  cachedIceServers = null;
  cachedAt = 0;
}
