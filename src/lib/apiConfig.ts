/**
 * Helper centrale per la risoluzione degli endpoint backend API (/api/*).
 * - Se VITE_API_BASE_URL non è impostato (sviluppo locale con server.ts o dominio unico Pages + Workers Routes),
 *   restituisce percorsi relativi (/api/...).
 * - Se VITE_API_BASE_URL è configurato (es. https://urbano3d-api.<account>.workers.dev),
 *   instrada automaticamente le chiamate verso il Cloudflare Worker autonomo.
 */
export function getApiBaseUrl(overrideBase?: string): string {
  const candidate =
    typeof overrideBase === 'string'
      ? overrideBase
      : (() => {
          try {
            return (import.meta as any)?.env?.VITE_API_BASE_URL;
          } catch {
            return '';
          }
        })();

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim().replace(/\/+$/, '');
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      return trimmed;
    }
  }
  return '';
}

export function resolveApiUrl(path: string, overrideBase?: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl(overrideBase);
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export function buildApiUrl(path: string, overrideBase?: string): string {
  return resolveApiUrl(path, overrideBase);
}
