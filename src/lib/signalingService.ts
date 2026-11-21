/**
 * Client centralizzato per il signaling WebRTC.
 * Riutilizza gli endpoint backend esistenti (/api/calls, /api/calls/:callId/signal).
 */
import { buildApiUrl } from './apiConfig';

export type SignalType = 'offer' | 'answer' | 'ice-candidate';

export interface SignalPayload {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | any;
}

export interface CreateCallRequest {
  calleeUid: string;
  listingId?: string;
}

export interface CreateCallResponse {
  success: boolean;
  callId: string;
  error?: string;
}

export interface SignalRequest {
  callId: string;
  type: SignalType;
  payload: any;
}

export interface SignalResponse {
  success: boolean;
  signalId?: string;
  error?: string;
}

export interface GetSignalsResponse {
  success: boolean;
  signals: Array<{
    id: string;
    callId: string;
    senderUid: string;
    type: SignalType;
    payload: any;
    timestamp: string;
  }>;
  error?: string;
}

export interface UpdateCallStatusRequest {
  callId: string;
  status: 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';
  durationSec?: number;
}

export interface CallStatusResponse {
  success: boolean;
  error?: string;
}

/**
 * Crea una nuova chiamata WebRTC.
 */
export async function createCall(
  piAccessToken: string,
  calleeUid: string,
  listingId?: string
): Promise<CreateCallResponse> {
  const res = await fetch(buildApiUrl('/api/calls'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${piAccessToken}`,
    },
    body: JSON.stringify({ calleeUid, listingId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, callId: '', error: data?.error || `HTTP ${res.status}` };
  }
  return data;
}

/**
 * Invia un segnale di signaling (offer, answer, ice-candidate).
 */
export async function sendSignal(
  piAccessToken: string,
  callId: string,
  type: 'offer' | 'answer' | 'ice-candidate',
  payload: any
): Promise<SignalResponse> {
  const res = await fetch(buildApiUrl(`/api/calls/${encodeURIComponent(callId)}/signal`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${type}`,
    },
    body: JSON.stringify({ type, payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error || `HTTP ${res.status}` };
  }
  return { success: true, signalId: data.signalId };
}

/**
 * Recupera i messaggi di signaling per una chiamata (polling).
 */
export async function getSignals(
  piAccessToken: string,
  callId: string
): Promise<GetSignalsResponse> {
  const res = await fetch(buildApiUrl(`/api/calls/${encodeURIComponent(callId)}/signaling`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${piAccessToken}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, signals: [], error: data?.error || `HTTP ${res.status}` };
  }
  return data;
}

/**
 * Aggiorna lo stato di una chiamata.
 */
export async function updateCallStatus(
  piAccessToken: string,
  callId: string,
  status: 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed',
  durationSec?: number
): Promise<CallStatusResponse> {
  const res = await fetch(buildApiUrl(`/api/calls/${encodeURIComponent(callId)}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${piAccessToken}`,
    },
    body: JSON.stringify({ status, durationSec }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error || `HTTP ${res.status}` };
  }
  return { success: true };
}

/**
 * Helper per ottenere il token Pi dal contesto corrente.
 * Priorità: 1) localStorage (persistito), 2) h2wContext (se disponibile).
 */
export function getPiAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pi_access_token') || null;
}

/**
 * Imposta il token Pi nel localStorage.
 */
export function setPiAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pi_access_token', token);
  }
}

/**
 * Rimuove il token Pi dal localStorage.
 */
export function clearPiAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pi_access_token');
  }
}
