import React, { useEffect, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, ExternalLink, AlertCircle, MapPin } from 'lucide-react';
import { fetchNearbyLiveWebcams, type LiveWebcamItem } from '@/lib/webcamService';

interface LiveWebcamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number | null;
  lng: number | null;
  cityName: string;
}

export default function LiveWebcamsModal({
  isOpen,
  onClose,
  lat,
  lng,
  cityName,
}: LiveWebcamsModalProps) {
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [webcams, setWebcams] = useState<LiveWebcamItem[]>([]);
  const [message, setMessage] = useState<string>('');

  const loadWebcams = useCallback(async () => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    setLoading(true);
    const res = await fetchNearbyLiveWebcams(lat, lng, 40);
    setConfigured(res.configured);
    setWebcams(res.webcams);
    setMessage(res.message || '');
    setLoading(false);
  }, [lat, lng]);

  useEffect(() => {
    if (isOpen) {
      void loadWebcams();
    }
  }, [isOpen, loadWebcams]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-white">
        <div className="px-5 py-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                Webcam Live Territoriali — {cityName || 'Area Selezionata'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Fonte: Windy Webcams API v3 (solo immagini reali verificabili tramite proxy server)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={loadWebcams}
              disabled={loading}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer disabled:opacity-50"
              title="Aggiorna webcam"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
              title="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-300">
              Ricerca webcam reali attive nei dintorni di {cityName}...
            </div>
          ) : !configured ? (
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-black text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Servizio Webcam Live predisposto — Credenziale Server non configurata</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                {message ||
                  'Il proxy backend /api/webcams/nearby è pronto ma la chiave server WINDY_WEBCAMS_API_KEY non è impostata. Nessun costo attivo e nessuna immagine simulata viene mostrata.'}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Imposta WINDY_WEBCAMS_API_KEY lato server per abilitare le webcam live verificate nell’area.
              </p>
            </div>
          ) : webcams.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-300">
              {message || `Nessuna webcam live attiva rilevata entro 40 km da ${cityName}.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {webcams.map((cam) => (
                <div
                  key={cam.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-black">
                    <img
                      src={cam.previewImageUrl}
                      alt={cam.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                      LIVE • {cam.status}
                    </span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h4 className="text-xs font-black text-white line-clamp-1">{cam.title}</h4>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">
                        {cam.city || cam.region || cam.country} ({cam.lat.toFixed(3)}, {cam.lng.toFixed(3)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800 text-[10px]">
                      <span className="text-zinc-500">
                        {cam.lastUpdatedIso
                          ? new Date(cam.lastUpdatedIso).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Windy'}
                      </span>
                      <a
                        href={cam.windyPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-300 hover:text-sky-200 font-bold inline-flex items-center gap-1"
                      >
                        <span>Apri su Windy</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
