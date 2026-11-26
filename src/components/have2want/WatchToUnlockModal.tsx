// Watch-to-Unlock Modal — Guarda 1 annuncio per sbloccare un'azione protetta.
// Flusso: GET /api/feed/ads → visione annuncio (1 alla volta) → POST /api/impressions/certify
// → riceve action_unlock_token → POST /api/ads/unlock/verify → esegue azione.
// Nessun accredito punti: il token è monouso, scadenza breve (10 min).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { resolveApiUrl } from '@/lib/apiConfig';
import {
  X,
  Play,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Film,
} from 'lucide-react';

type ActionType = 'UNLOCK_FEATURE' | 'FREE_POST' | 'STUDIO_EXPORT';

interface WatchToUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionType;
  actionLabel: string; // es. 'Sblocca funzione Studio'
  onSuccess: () => void;
}

const MIN_VIEW_SECONDS = 15; // durata minima visione prima di certificare

export const WatchToUnlockModal: React.FC<WatchToUnlockModalProps> = ({
  isOpen,
  onClose,
  actionType,
  actionLabel,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [ad, setAd] = useState<{
    id: string;
    title: string;
    description?: string;
    advertiser_id?: string;
    cost_per_impression?: number;
  } | null>(null);
  const [step, setStep] = useState<'idle' | 'loading' | 'watching' | 'certifying' | 'verified' | 'error'>('idle');
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const u: any = user;
    const token =
      u?.accessToken ||
      u?.idToken ||
      u?.token ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('pi_access_token') : null);
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [user]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep('idle');
      setAd(null);
      setSecondsWatched(0);
      setError(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    }
  }, [isOpen]);

  // Carica un annuncio dal feed del Blocco 2
  const loadAd = useCallback(async () => {
    setStep('loading');
    setError(null);
    try {
      const abort = new AbortController();
      abortRef.current = abort;
      const res = await fetch(resolveApiUrl('/api/feed/ads?countryCode=IT&limit=1'), {
        headers: getAuthHeaders(),
        signal: abort.signal,
      });
      if (!res.ok) throw new Error(`Feed annunci non disponibile (${res.status})`);
      const data = await res.json();
      const campaigns = data.campaigns || [];
      if (campaigns.length === 0) {
        setStep('error');
        setError('Nessun annuncio disponibile al momento');
        return;
      }
      setAd(campaigns[0]);
      setStep('watching');
      setSecondsWatched(0);

      // Timer visione minima
      let secs = 0;
      timerRef.current = setInterval(() => {
        secs++;
        setSecondsWatched(secs);
      }, 1000);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setStep('error');
      setError(err?.message || 'Errore caricamento annuncio');
      toast.error('Errore caricamento annuncio: ' + (err?.message || 'sconosciuto'));
    }
  }, [isOpen, getAuthHeaders]);

  useEffect(() => {
    if (isOpen && step === 'idle') {
      loadAd();
    }
  }, [isOpen, step, loadAd]);

  // Certifica l'impressione dopo la durata minima
  const certifyImpression = async () => {
    if (!ad) return;
    setStep('certifying');
    try {
      const abort = new AbortController();
      abortRef.current = abort;
      const payload = {
        campaignId: ad.id,
        userId: (user as any)?.id || 'local_user',
        sessionToken: `session_${Date.now()}`,
        nonce: `nonce_${Math.random().toString(36).slice(2, 10)}`,
        idempotencyKey: `imp_${ad.id}_${Date.now()}`,
        amount: ad.cost_per_impression ?? 0,
        creativeId: `creative_${ad.id}`,
        actionType,
        ipHash: '0',
        userAgentHash: '0',
        visibilityDurationMs: secondsWatched * 1000,
      };
      const res = await fetch(resolveApiUrl('/api/impressions/certify'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        signal: abort.signal,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Certificazione fallita (${res.status})`);
      }
      const data = await res.json();
      const actionUnlockToken = data.actionUnlockToken;
      if (!actionUnlockToken) throw new Error('Token azione non ricevuto');

      // Verifica e consuma il token sul Blocco 2
      const verifyRes = await fetch(resolveApiUrl('/api/ads/unlock/verify'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          token: actionUnlockToken,
          actionType,
          userId: payload.userId,
        }),
        signal: abort.signal,
      });
      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.error || `Verifica token fallita (${verifyRes.status})`);
      }
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) throw new Error('Token non valido');

      setStep('verified');
      toast.success(`Azione sbloccata: ${actionLabel}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setStep('error');
      setError(err?.message || 'Errore certificazione');
      toast.error('Errore sblocco: ' + (err?.message || 'sconosciuto'));
    }
  };

  const handleWatch = () => {
    if (secondsWatched < MIN_VIEW_SECONDS) {
      toast.info(`Guarda l'annuncio per almeno ${MIN_VIEW_SECONDS} secondi per sbloccare`);
      return;
    }
    certifyImpression();
  };

  const handleRetry = () => {
    setStep('idle');
    setError(null);
    loadAd();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-white text-sm uppercase tracking-wider">Guarda per sbloccare</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stato / Step */}
          <div className="flex flex-col items-center gap-3">
            {step === 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-amber-500/30 rounded-full border-t-amber-500 animate-spin" />
                <p className="text-xs text-zinc-400">Caricamento annuncio...</p>
              </div>
            )}
            {step === 'watching' && ad && (
              <div className="flex flex-col items-center gap-3">
                <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
                  Annuncio sponsorizzato
                </div>
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm">{ad.title}</h4>
                      <p className="text-xs text-zinc-400">{ad.description || 'Scopri l\'offerta dell\'inserzionista'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-mono text-zinc-300">
                      Visione: {secondsWatched}s / {MIN_VIEW_SECONDS}s minimi
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-1000"
                    style={{ width: Math.min(100, (secondsWatched / MIN_VIEW_SECONDS) * 100) }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  1 annuncio alla volta — durata minima verificata lato server
                </p>
              </div>
            )}
            {step === 'certifying' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500/30 rounded-full border-t-blue-500 animate-spin" />
                <p className="text-xs text-blue-300">Certificazione visione in corso...</p>
              </div>
            )}
            {step === 'verified' && (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-emerald-300 font-bold text-sm">Azione sbloccata!</p>
                <p className="text-[10px] text-zinc-500">Token azione monouso verificato.</p>
              </div>
            )}
            {step === 'error' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <X className="w-4 h-4" />
                </div>
                <p className="text-xs text-rose-300 text-center">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold cursor-pointer hover:bg-rose-500/30"
                >
                  <RefreshCw className="w-3 h-3" /> Riprova
                </button>
              </div>
            )}
          </div>

          {/* Azione target */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Azione da sbloccare:</span>
            </div>
            <p className="text-sm text-zinc-200">{actionLabel}</p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Nessun accredito punti: riceverai un token azione monouso (valido 10 min, consumo singolo).
            </p>
          </div>
        </div>

        {/* Footer azioni */}
        <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-700 text-xs font-bold hover:text-white transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleWatch}
            disabled={step !== 'watching' || secondsWatched < MIN_VIEW_SECONDS}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 ${
              step !== 'watching' || secondsWatched < MIN_VIEW_SECONDS
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                : 'bg-amber-500 text-white border border-amber-400 hover:bg-amber-400 active:scale-95'
            }`}
          >
            {secondsWatched < MIN_VIEW_SECONDS
              ? `Attendi ${Math.max(0, MIN_VIEW_SECONDS - secondsWatched)}s`
              : 'Certifica visione'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchToUnlockModal;
