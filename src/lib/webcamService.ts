import { resolveApiUrl } from './apiConfig';
import { isValidCoord } from './worldAtlas';

export interface LiveWebcamItem {
  id: string;
  title: string;
  status: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
  previewImageUrl: string;
  playerUrl: string | null;
  windyPageUrl: string;
  lastUpdatedIso: string | null;
}

export interface LiveWebcamsResponse {
  configured: boolean;
  source: string;
  webcams: LiveWebcamItem[];
  message?: string;
}

export async function fetchNearbyLiveWebcams(
  lat: number,
  lng: number,
  radiusKm = 35,
  fetchImpl: typeof fetch = globalThis.fetch
): Promise<LiveWebcamsResponse> {
  if (!isValidCoord(lat, lng)) {
    return {
      configured: false,
      source: 'Windy Webcams API v3',
      webcams: [],
      message: 'Coordinate non valide per la ricerca webcam.',
    };
  }

  const endpoint = resolveApiUrl(
    `/api/webcams/nearby?lat=${encodeURIComponent(lat.toFixed(5))}&lng=${encodeURIComponent(lng.toFixed(5))}&radius=${encodeURIComponent(String(radiusKm))}`
  );

  try {
    const res = await fetchImpl(endpoint, { method: 'GET' });
    if (!res.ok) {
      return {
        configured: false,
        source: 'Windy Webcams API v3',
        webcams: [],
        message: `Servizio webcam non disponibile (HTTP ${res.status}).`,
      };
    }
    const payload = await res.json();
    const list: LiveWebcamItem[] = Array.isArray(payload?.webcams)
      ? payload.webcams.filter((w: any) => w && w.previewImageUrl && isValidCoord(w.lat, w.lng))
      : [];
    return {
      configured: Boolean(payload?.configured),
      source: payload?.source || 'Windy Webcams API v3',
      webcams: list,
      message: payload?.message,
    };
  } catch (err: any) {
    return {
      configured: false,
      source: 'Windy Webcams API v3',
      webcams: [],
      message: err?.message || 'Errore di rete nel recupero webcam.',
    };
  }
}
