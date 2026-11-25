/**
 * FREE SERVICES CONFIG – HAVE2WANT PLUS
 * Centralizza i provider gratuiti di appoggio (STUN/TURN, host creator, archivio opzionale)
 * con fallback interno a zero costi.
 */

export interface FreeServiceConfig {
  iceServers: RTCIceServer[];
  creatorFallbackHosts: string[];
  allowLocalObjectUrl: boolean;
}

export const FREE_SERVICES_CONFIG: FreeServiceConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Appoggio TURN gratuito opzionale (inserire URL/credenziali da Metered o Xirsys se serve)
    // { urls: 'turn:openrelay.metered.ca:80', username: '...', credential: '...' },
  ],
  creatorFallbackHosts: [
    'https://archive.org/embed/',
  ],
  allowLocalObjectUrl: true,
};

/**
 * Risolve la sorgente media del creator:
 * - Se c'è un File locale (caricato dall'utente) → usa URL.createObjectURL (zero costi, locale)
 * - Altrimenti → usa l'URL remoto fornito (link diretto, embed Internet Archive, ecc.)
 */
export function resolveCreatorMediaSource(rawUrl: string, localFile?: File | null): string {
  if (localFile && FREE_SERVICES_CONFIG.allowLocalObjectUrl) {
    return URL.createObjectURL(localFile);
  }
  return rawUrl.trim();
}