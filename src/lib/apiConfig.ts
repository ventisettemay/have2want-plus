/**
 * Risolve l'URL base dell'API per le chiamate cross-blocco (Blocco 1 Express e Blocco 2 Worker).
 * In sviluppo punta allo stesso origin; in produzione può essere sovrascritto via env.
 */
export const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL)
  ? (import.meta as any).env.VITE_API_URL
  : '';

export function resolveApiUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || API_BASE_URL;
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getApiBaseUrl(url?: string): string {
  if (url !== undefined && url !== null) return url.replace(/\/$/, '');
  return API_BASE_URL;
}

export function buildApiUrl(path: string, baseUrl?: string): string {
  return resolveApiUrl(path, baseUrl);
}
