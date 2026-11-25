/**
 * FREE SERVICES CONFIG – HAVE2WANT PLUS
 * Centralizza i provider gratuiti di appoggio (STUN/TURN, host creator, archivio opzionale)
 * con fallback interno a zero costi.
 */

export interface FreeServiceConfig {
  iceServers: RTCIceServer[];
  creatorFallbackHosts: string[];
  allowLocalObjectUrl: boolean;
  syncChannelName: string;
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
  syncChannelName: 'h2w-sync',
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

/**
 * BroadcastChannel per sync leggero tra schede/finestre (zero costi, solo client-side).
 * Usato per: trigger video ad, stato chat, scansione radar, ecc.
 */
let syncChannel: BroadcastChannel | null = null;

function getSyncChannel(): BroadcastChannel {
  if (!syncChannel) {
    syncChannel = new BroadcastChannel(FREE_SERVICES_CONFIG.syncChannelName);
  }
  return syncChannel;
}

export interface SyncMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  sourceTabId: string;
}

const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function publishSyncMessage<T>(type: string, payload: T): void {
  try {
    const channel = getSyncChannel();
    const message: SyncMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
      sourceTabId: TAB_ID,
    };
    channel.postMessage(message);
  } catch (err) {
    console.warn('[freeServicesConfig] BroadcastChannel publish failed:', err);
  }
}

export function subscribeSyncMessage<T>(
  type: string,
  handler: (message: SyncMessage<T>) => void
): () => void {
  try {
    const channel = getSyncChannel();
    const listener = (event: MessageEvent<SyncMessage<T>>) => {
      if (event.data?.sourceTabId !== TAB_ID && event.data.type === type) {
        handler(event.data);
      }
    };
    channel.addEventListener('message', listener);
    return () => channel.removeEventListener('message', listener);
  } catch (err) {
    console.warn('[freeServicesConfig] BroadcastChannel subscribe failed:', err);
    return () => {};
  }
}