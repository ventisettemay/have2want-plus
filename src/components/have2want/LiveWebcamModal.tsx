import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Maximize2, Minimize2, Wifi, WifiOff, RefreshCw, Eye, Video, WifiSync, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface WebcamData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  countryCode: string;
  imageUrl: string;
  streamUrl?: string;
  type: 'traffic' | 'tourist' | 'commercial' | 'weather' | 'public';
  isLive: boolean;
  lastUpdate?: string;
  source?: string;
  description?: string;
}

interface LiveWebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  radiusKm?: number;
  countryCode?: string;
  onNavigateToWebcam?: (webcam: WebcamData) => void;
}

const STORAGE_KEY = 'h2w_webcam_cache_v1';

export function getCachedWebcams(): WebcamData[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp < 6 * 60 * 60 * 1000) {
      return data.webcams || [];
    }
  } catch {}
  return [];
}

export function setCachedWebcams(webcams: WebcamData[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), webcams }));
  } catch {}
}

export async function fetchNearbyWebcams(lat: number, lng: number, radiusKm: number = 50): Promise<WebcamData[]> {
  const cached = getCachedWebcams();
  if (cached.length > 0) {
    const nearby = cached.filter((w) => {
      const dLat = (w.lat - lat) * 111;
      const dLng = (w.lng - lng) * 111 * Math.cos(lat * (Math.PI / 180));
      return Math.hypot(dLat, dLng) <= radiusKm;
    });
    if (nearby.length > 0) return nearby;
  }

  // Fonti aperte: windy.com, webcams.travel, traffic cam APIs pubbliche
  // Per questa implementazione usiamo dati demo rappresentativi
  // In produzione: collegare API reali (Windy, Weather Underground, ecc.)
  const demoWebcams: WebcamData[] = [
    {
      id: 'wc_1',
      name: 'Roma - Piazza Venezia (Traffico)',
      lat: 41.8962,
      lng: 12.4812,
      country: 'Italia',
      countryCode: 'IT',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
      streamUrl: 'https://example.com/stream/venezia',
      type: 'traffic',
      isLive: true,
      lastUpdate: new Date().toISOString(),
      source: 'Comune di Roma - Telecamere Traffico',
      description: 'Incrocio centrale, monitoraggio traffico veicolare 24/7',
    },
    {
      id: 'wc_2',
      name: 'Roma - Colosseo (Turistico)',
      lat: 41.8902,
      lng: 12.4922,
      country: 'Italia',
      countryCode: 'IT',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
      type: 'tourist',
      isLive: true,
      lastUpdate: new Date().toISOString(),
      source: 'Roma Turismo - Webcam Panoramiche',
      description: 'Vista sull\'anfiteatro Flavio, aggiornamento ogni 5 min',
    },
    {
      id: 'wc_3',
      name: 'Milano - Piazza Duomo (Commerciale)',
      lat: 45.4642,
      lng: 9.1900,
      country: 'Italia',
      countryCode: 'IT',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      type: 'commercial',
      isLive: false,
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      source: 'Milano Centro - Telecamere Pubbliche',
      description: 'Afflusso visitatori area commerciale',
    },
  ];

  const nearby = demoWebcams.filter((w) => {
    const dLat = (w.lat - lat) * 111;
    const dLng = (w.lng - lng) * 111 * Math.cos(lat * (Math.PI / 180));
    return Math.hypot(dLat, dLng) <= radiusKm;
  });

  setCachedWebcams([...cached, ...nearby].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i));
  return nearby;
}

export default function LiveWebcamModal({
  isOpen,
  onClose,
  lat,
  lng,
  radiusKm = 50,
  countryCode = 'IT',
  onNavigateToWebcam,
}: LiveWebcamModalProps) {
  const [webcams, setWebcams] = useState<WebcamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebcam, setSelectedWebcam] = useState<WebcamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'traffic' | 'tourist' | 'commercial' | 'weather' | 'public'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetchNearbyWebcams(lat, lng, radiusKm)
        .then((data) => {
          setWebcams(data);
          if (data.length === 0) {
            setError('Nessuna webcam pubblica trovata nel raggio specificato. Prova ad ampliare il raggio.');
          }
        })
        .catch((err) => {
          console.error('Errore caricamento webcam:', err);
          setError('Impossibile caricare le webcam dal catalogo pubblico.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, lat, lng, radiusKm]);

  if (!isOpen) return null;

  const filteredWebcams = filterType === 'all'
    ? webcams
    : webcams.filter((w) => w.type === filterType);

  const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    traffic: { label: 'Traffico', icon: <MapPin className="w-3 h-3" />, color: 'text-red-400' },
    tourist: { label: 'Turistico', icon: <Eye className="w-3 h-3" />, color: 'text-blue-400' },
    commercial: { label: 'Commerciale', icon: <ShieldCheck className="w-3 h-3" />, color: 'text-emerald-400' },
    weather: { label: 'Meteo', icon: <Wifi className="w-3 h-3" />, color: 'text-sky-400' },
    public: { label: 'Pubblico', icon: <MapPin className="w-3 h-3" />, color: 'text-zinc-400' },
  };

  const handleSelect = (webcam: WebcamData) => {
    setSelectedWebcam(webcam);
    if (onNavigateToWebcam) onNavigateToWebcam(webcam);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-zinc-900 via-zinc-900 to-black border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">VIEW LIVE — Webcam Pubbliche</h2>
              <p className="text-[11px] text-zinc-400">
                Raggio {radiusKm} km • {filteredWebcams.length} webcam {loading ? '(caricamento...)' : 'trovate'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchNearbyWebcams(lat, lng, radiusKm).then((d) => { setWebcams(d); setLoading(false); });
              }}
              disabled={loading}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer disabled:opacity-50"
              aria-label="Aggiorna webcam"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtri per tipo */}
        <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-zinc-400 shrink-0">Filtra:</span>
          {(['all', 'traffic', 'tourist', 'commercial', 'weather', 'public'] as const).map((type) => {
            const meta = TYPE_META[type] || { label: type, icon: <MapPin className="w-3 h-3" />, color: 'text-zinc-400' };
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  filterType === type
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                }`}>
                <span className={meta.color}>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/50">
                  {webcams.filter((w) => type === 'all' || w.type === type).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista webcam */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-2">
              <WifiOff className="w-12 h-12 text-zinc-500 mx-auto" />
              <p className="text-zinc-400">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  fetchNearbyWebcams(lat, lng, radiusKm).then((d) => { setWebcams(d); setLoading(false); });
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/40 cursor-pointer"
              >
                Riprova
              </button>
            </div>
          ) : filteredWebcams.length === 0 ? (
            <div className="text-center py-12">
              <WifiOff className="w-12 h-12 text-zinc-500 mx-auto" />
              <p className="text-zinc-400 mt-2">Nessuna webcam di questo tipo nel raggio.</p>
            </div>
          ) : (
            filteredWebcams.map((wc) => (
              <div
                key={wc.id}
                onClick={() => handleSelect(wc)}
                className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-24 h-18 shrink-0 rounded-xl overflow-hidden border border-zinc-700">
                    <img
                      src={wc.imageUrl}
                      alt={wc.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className={`absolute top-1 left-1 ${wc.isLive ? 'bg-red-500' : 'bg-zinc-600'} text-white text-[8px] font-bold px-1.5 py-0.5 rounded`}>
                      {wc.isLive ? 'LIVE' : 'ARCHIVIO'}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded">
                      {TYPE_META[wc.type]?.label || wc.type}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{wc.name}</h3>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{wc.description || 'Webcam pubblica'}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-zinc-500">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {wc.lat.toFixed(4)}, {wc.lng.toFixed(4)}
                      </span>
                      {wc.lastUpdate && (
                        <span className="flex items-center gap-0.5">
                          <RefreshCw className="w-2.5 h-2.5" />
                          {new Date(wc.lastUpdate).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-1">Fonte: {wc.source || 'Catalogo pubblico'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dettaglio webcam selezionata */}
        {selectedWebcam && (
          <div className="fixed inset-0 z-55 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
              <div className="px-4 py-3 bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                <h3 className="text-sm font-black text-white truncate">{selectedWebcam.name}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedWebcam(null)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                  {selectedWebcam.streamUrl ? (
                    <video
                      src={selectedWebcam.streamUrl}
                      autoPlay
                      muted
                      playsInline
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={selectedWebcam.imageUrl}
                      alt={selectedWebcam.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${selectedWebcam.isLive ? 'bg-red-500 text-white' : 'bg-zinc-600 text-zinc-300'}`}>
                        {selectedWebcam.isLive ? '🔴 LIVE' : '📹 ARCHIVIO'}
                      </span>
                      <span className="text-[10px] text-zinc-300">
                        {selectedWebcam.type} · {selectedWebcam.country}
                      </span>
                    </div>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${selectedWebcam.lat}&mlon=${selectedWebcam.lng}#map=17/${selectedWebcam.lat}/${selectedWebcam.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/40 hover:bg-sky-500/30"
                    >
                      Posizione
                    </a>
                  </div>
                </div>
                <div className="space-y-3 text-[11px]">
                  <p className="text-zinc-300">{selectedWebcam.description || 'Nessuna descrizione disponibile.'}</p>
                  <div className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center justify-between text-zinc-400">
                    <span>Fonte: {selectedWebcam.source || 'Catalogo pubblico'}</span>
                    <span className="font-mono">{selectedWebcam.lastUpdate ? new Date(selectedWebcam.lastUpdate).toLocaleString('it-IT') : 'N/A'}</span>
                  </div>
                  <p className="text-zinc-500">
                    Nota: le webcam provengono da fonti pubbliche e aperte. Have2Want non gestisce né ospita i flussi video.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}