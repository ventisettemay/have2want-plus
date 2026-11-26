/**
 * Risolve l'URL base dell'API per le chiamate cross-blocco (Blocco 1 Express e Blocco 2 Worker).
 * In sviluppo punta allo stesso origin; in produzione può essere sovrascritto via env.
 */
export const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL)
  ? (import.meta as any).env.VITE_API_URL
  : '';

export function resolveApiUrl(path: string): string {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}
