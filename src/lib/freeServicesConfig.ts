// CONFIGURAZIONE SERVIZI CLIENT-SIDE A COSTO ZERO — HAVE2WANT PLUS
// Zero backend proprietario a pagamento: WebRTC STUN Google pubblico, TURN OpenRelay fallback,
// risoluzione media creator (File locale via ObjectURL o URL remoto verificato), e sincronizzazione BroadcastChannel.

export interface IceServerEntry {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const GOOGLE_PUBLIC_STUN_SERVERS: IceServerEntry[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const OPENRELAY_TURN_FALLBACK_ENDPOINT =
  'https://have2want.metered.live/api/v1/turn/credentials?apiKey=openrelayproject';

export const OPENRELAY_PUBLIC_FALLBACK_SERVERS: IceServerEntry[] = [
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:standard.relay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:standard.relay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export type ResolvedMediaKind = 'object_url' | 'archive_embed' | 'direct_video' | 'direct_audio' | 'external_url' | 'invalid';

export interface ResolvedCreatorMedia {
  url: string;
  kind: ResolvedMediaKind;
  isEmbed: boolean;
  revoke?: () => void;
}

const SAFE_URL_PROTOCOLS = new Set(['https:', 'http:', 'blob:']);

export function resolveCreatorMediaSource(
  input: File | string | null | undefined
): ResolvedCreatorMedia | null {
  if (!input) return null;

  if (typeof File !== 'undefined' && input instanceof File) {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const objectUrl = URL.createObjectURL(input);
      const isAudio = input.type.startsWith('audio/');
      return {
        url: objectUrl,
        kind: 'object_url',
        isEmbed: false,
        revoke: () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // ignore
          }
        },
      };
    }
    return null;
  }

  const raw = String(input).trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }

    const lowerHref = parsed.href.toLowerCase();
    const isArchiveOrgDetails =
      parsed.hostname.includes('archive.org') && parsed.pathname.startsWith('/details/');
    if (isArchiveOrgDetails) {
      const identifier = parsed.pathname.replace('/details/', '').replace(/^\/+|\/+$/g, '');
      return {
        url: `https://archive.org/embed/${identifier}`,
        kind: 'archive_embed',
        isEmbed: true,
      };
    }

    if (parsed.hostname.includes('archive.org') && parsed.pathname.startsWith('/embed/')) {
      return {
        url: parsed.href,
        kind: 'archive_embed',
        isEmbed: true,
      };
    }

    if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(lowerHref)) {
      return {
        url: parsed.href,
        kind: 'direct_audio',
        isEmbed: false,
      };
    }

    if (/\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(lowerHref) || parsed.protocol === 'blob:') {
      return {
        url: parsed.href,
        kind: 'direct_video',
        isEmbed: false,
      };
    }

    return {
      url: parsed.href,
      kind: 'external_url',
      isEmbed: false,
    };
  } catch {
    return null;
  }
}

export const H2W_SYNC_CHANNEL_NAME = 'h2w-sync';

export type SyncEventType =
  | 'VIDEO_AD_TRIGGERED'
  | 'CREATOR_PROMO_PUBLISHED'
  | 'SATELLITE_STATE_UPDATED'
  | 'LISTING_SYNC';

export interface SyncMessage<T = unknown> {
  type: SyncEventType;
  payload: T;
  timestamp: number;
  senderId: string;
}

const TAB_SENDER_ID = `h2w_tab_${Math.random().toString(36).slice(2, 10)}`;

export function publishSyncMessage<T = unknown>(type: SyncEventType, payload: T): SyncMessage<T> {
  const message: SyncMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: TAB_SENDER_ID,
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(H2W_SYNC_CHANNEL_NAME);
      bc.postMessage(message);
      bc.close();
    }
  } catch {
    // ignore BroadcastChannel restrictions
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`h2w_last_sync_${type}`, JSON.stringify(message));
    }
  } catch {
    // ignore storage quota errors
  }

  return message;
}

export function subscribeSyncMessages<T = unknown>(
  onMessage: (message: SyncMessage<T>) => void
): () => void {
  let bc: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(H2W_SYNC_CHANNEL_NAME);
      bc.onmessage = (ev: MessageEvent<SyncMessage<T>>) => {
        if (ev?.data && ev.data.type) {
          onMessage(ev.data);
        }
      };
    }
  } catch {
    bc = null;
  }

  const handleStorage = (ev: StorageEvent) => {
    if (!ev.key || !ev.key.startsWith('h2w_last_sync_') || !ev.newValue) return;
    try {
      const parsed = JSON.parse(ev.newValue) as SyncMessage<T>;
      if (parsed && parsed.type) {
        onMessage(parsed);
      }
    } catch {
      // ignore malformed payloads
    }
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    try {
      if (bc) bc.close();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
