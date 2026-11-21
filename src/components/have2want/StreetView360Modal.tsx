import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Camera,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { isValidCoord } from '@/lib/worldAtlas';

interface StreetView360ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  lat?: number;
  lng?: number;
  cityName?: string;
  streetName?: string;
  placeName?: string;
}

interface StreetPhotoItem {
  id: string;
  provider: 'PANORAMAX' | 'MAPILLARY';
  embedUrl?: string;
  imageUrl?: string;
  capturedAt?: string;
  compassAngle?: number | null;
}

export function StreetView360Modal({
  isOpen = true,
  onClose,
  lat,
  lng,
  cityName = 'Mondo',
  streetName = 'Via locale',
  placeName,
}: StreetView360ModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedRoad, setResolvedRoad] = useState<string>(streetName);
  const [activeProvider, setActiveProvider] = useState<'PANORAMAX' | 'MAPILLARY'>('PANORAMAX');
  const [panoramaxPhotos, setPanoramaxPhotos] = useState<StreetPhotoItem[]>([]);
  const [mapillaryPhotos, setMapillaryPhotos] = useState<StreetPhotoItem[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(true);
  const [gpsRoute, setGpsRoute] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const mapillaryToken =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MAPILLARY_ACCESS_TOKEN
      ? String((import.meta as any).env.VITE_MAPILLARY_ACCESS_TOKEN).trim()
      : '';

  const hasValidCoords = isValidCoord(lat, lng);

  useEffect(() => {
    setResolvedRoad(streetName);
  }, [streetName]);

  // 1. Ricerca foto stradali reali da Panoramax e Mapillary (se token autorizzato presente)
  useEffect(() => {
    if (!isOpen || !hasValidCoords) {
      setLoadingPhotos(false);
      setPanoramaxPhotos([]);
      setMapillaryPhotos([]);
      setPhotoIdx(0);
      return;
    }

    let isMounted = true;
    const delta = 0.0025;
    const bbox = `${(lng as number) - delta},${(lat as number) - delta},${(lng as number) + delta},${(lat as number) + delta}`;

    async function fetchStreetImagery() {
      setLoadingPhotos(true);
      setPhotoIdx(0);
      try {
        const panoPromise = fetch(`https://api.panoramax.xyz/api/search?bbox=${bbox}&limit=8`, {
          headers: { Accept: 'application/json' },
        })
          .then(async (res) => {
            if (!res.ok) return [] as StreetPhotoItem[];
            const data = await res.json();
            const features = Array.isArray(data?.features) ? data.features : [];
            return features
              .map((feature: any) => {
                const picId = feature?.id || feature?.properties?.id;
                if (!picId) return null;
                return {
                  id: String(picId),
                  provider: 'PANORAMAX' as const,
                  embedUrl: `https://api.panoramax.xyz/#focus=pic&pic=${encodeURIComponent(String(picId))}&map=none`,
                  imageUrl: feature?.assets?.hd?.href || feature?.assets?.sd?.href || feature?.assets?.thumb?.href || undefined,
                  capturedAt: feature?.properties?.datetime || feature?.properties?.created || undefined,
                  compassAngle: typeof feature?.properties?.['view:azimuth'] === 'number'
                    ? Math.round(feature.properties['view:azimuth'])
                    : null,
                };
              })
              .filter(Boolean) as StreetPhotoItem[];
          })
          .catch(() => [] as StreetPhotoItem[]);

        const mapillaryPromise = mapillaryToken
          ? fetch(
              `https://graph.mapillary.com/images?access_token=${encodeURIComponent(mapillaryToken)}&fields=id,thumb_1024_url,captured_at,compass_angle&bbox=${bbox}&limit=8`,
              { headers: { Accept: 'application/json' } }
            )
              .then(async (res) => {
                if (!res.ok) return [] as StreetPhotoItem[];
                const data = await res.json();
                const items = Array.isArray(data?.data) ? data.data : [];
                return items
                  .filter((img: any) => Boolean(img?.thumb_1024_url))
                  .map((img: any) => ({
                    id: String(img.id),
                    provider: 'MAPILLARY' as const,
                    imageUrl: img.thumb_1024_url,
                    capturedAt: img.captured_at ? new Date(img.captured_at).toISOString() : undefined,
                    compassAngle: typeof img.compass_angle === 'number' ? Math.round(img.compass_angle) : null,
                  }));
              })
              .catch(() => [] as StreetPhotoItem[])
          : Promise.resolve([] as StreetPhotoItem[]);

        const [panoList, mapillaryList] = await Promise.all([panoPromise, mapillaryPromise]);
        if (!isMounted) return;

        setPanoramaxPhotos(panoList);
        setMapillaryPhotos(mapillaryList);
        if (panoList.length > 0) {
          setActiveProvider('PANORAMAX');
        } else if (mapillaryList.length > 0) {
          setActiveProvider('MAPILLARY');
        } else {
          setActiveProvider('PANORAMAX');
        }
      } finally {
        if (isMounted) setLoadingPhotos(false);
      }
    }

    fetchStreetImagery();
    return () => {
      isMounted = false;
    };
  }, [isOpen, hasValidCoords, lat, lng, mapillaryToken]);

  // 2. Risoluzione nome reale della via tramite Nominatim OpenStreetMap
  useEffect(() => {
    if (!isOpen || !hasValidCoords) return;
    let isMounted = true;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.address) {
          const road =
            data.address.road ||
            data.address.pedestrian ||
            data.address.square ||
            data.address.suburb ||
            streetName;
          setResolvedRoad(road);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen, hasValidCoords, lat, lng, streetName]);

  // 3. Percorso OSRM reale solo su posizione GPS effettiva del dispositivo
  const handleCalculateFromDeviceGps = () => {
    if (!hasValidCoords || !navigator.geolocation) {
      toast.error('Geolocalizzazione GPS non disponibile su questo dispositivo');
      return;
    }
    setLoadingRoute(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { calculateRealRoute } = await import('@/lib/routingService');
          const route = await calculateRealRoute(
            pos.coords.latitude,
            pos.coords.longitude,
            lat as number,
            lng as number,
            'walking'
          );
          if (!route) {
            setGpsRoute(null);
            toast.error('Percorso OSRM non disponibile da qui verso questo punto');
          } else {
            setGpsRoute(route);
            toast.success(`🧭 Percorso a piedi da GPS reale: ${route.totalDistanceKm} km (${route.totalDurationMinutes} min)`);
          }
        } catch {
          toast.error('Impossibile contattare OSRM per calcolare il percorso');
        } finally {
          setLoadingRoute(false);
        }
      },
      () => {
        setLoadingRoute(false);
        toast.error('Permesso GPS negato o posizione non rilevata');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  if (!isOpen) return null;

  const activePhotos = activeProvider === 'PANORAMAX' ? panoramaxPhotos : mapillaryPhotos;
  const currentPhoto = activePhotos.length > 0 ? activePhotos[photoIdx % activePhotos.length] : null;

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 flex flex-col bg-slate-950">
        {/* Top Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
          <div className="bg-black/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-zinc-800 text-white shadow-2xl pointer-events-auto flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-sm shrink-0">
              360°
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
                <span className="text-[#00ff66]">{placeName || cityName}</span>
                <span className="text-zinc-500">•</span>
                <span className="truncate">{resolvedRoad}</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5 flex-wrap">
                {hasValidCoords ? (
                  <span>
                    {(lat as number).toFixed(4)}, {(lng as number).toFixed(4)}
                  </span>
                ) : (
                  <span className="text-amber-400">Coordinate non disponibili</span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-[#00ff66] border border-emerald-500/30 font-bold">
                  {activeProvider === 'PANORAMAX'
                    ? `Panoramax (${panoramaxPhotos.length})`
                    : `Mapillary (${mapillaryPhotos.length})`}
                </span>
                {currentPhoto?.compassAngle != null && (
                  <span className="text-amber-400 font-bold">Bussola {currentPhoto.compassAngle}°</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap justify-end">
            <div className="bg-black/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveProvider('PANORAMAX');
                  setPhotoIdx(0);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeProvider === 'PANORAMAX'
                    ? 'bg-[#00ff66] text-black font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                📷 Panoramax ({panoramaxPhotos.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveProvider('MAPILLARY');
                  setPhotoIdx(0);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeProvider === 'MAPILLARY'
                    ? 'bg-emerald-400 text-black font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={mapillaryToken ? 'Immagini stradali Mapillary autorizzate' : 'Richiede VITE_MAPILLARY_ACCESS_TOKEN'}
              >
                🗺️ Mapillary ({mapillaryPhotos.length})
              </button>
            </div>

            {hasValidCoords && (
              <button
                type="button"
                onClick={handleCalculateFromDeviceGps}
                disabled={loadingRoute}
                className="px-2.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                title="Calcola percorso pedonale OSRM reale dalla tua posizione GPS attuale"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{loadingRoute ? 'Calcolo...' : 'Percorso da GPS'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 rounded-xl bg-black/90 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
              title={isFullscreen ? 'Riduci finestra' : 'Schermo intero'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#00ff66] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#00ff66]" />
              <span>Torna alla Mappa</span>
            </button>
          </div>
        </div>

        {/* Body */}
        {!hasValidCoords ? (
          <div className="w-full h-full flex items-center justify-center bg-black p-4">
            <div className="text-center max-w-md p-6 bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-2xl">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-black text-white mb-1.5">Coordinate geografiche non disponibili</h3>
              <p className="text-xs text-zinc-400 mb-5">
                Seleziona prima un luogo valido sulla mappa urbana prima di cercare fotografie stradali reali.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#00ff66] hover:bg-[#00e65c] text-black px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Torna alla Mappa</span>
              </button>
            </div>
          </div>
        ) : loadingPhotos ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black px-4 text-center">
            <div className="inline-block w-9 h-9 border-4 border-[#00ff66] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-zinc-200">Ricerca foto stradali reali Panoramax &amp; Mapillary...</p>
            <p className="text-xs text-zinc-500 mt-1">
              {(lat as number).toFixed(4)}, {(lng as number).toFixed(4)}
            </p>
          </div>
        ) : currentPhoto ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            {currentPhoto.provider === 'PANORAMAX' && currentPhoto.embedUrl ? (
              <iframe
                key={currentPhoto.id}
                src={currentPhoto.embedUrl}
                title={`Panoramax 360 ${resolvedRoad}`}
                className="w-full h-full border-none"
                allow="geolocation; accelerometer; gyroscope"
                allowFullScreen
              />
            ) : (
              <img
                src={currentPhoto.imageUrl}
                alt={`Foto stradale Mapillary su ${resolvedRoad}`}
                className="w-full h-full object-contain bg-black"
              />
            )}

            {/* Barra inferiore navigazione sequenza fotografica reale + eventuale tratta OSRM da GPS */}
            <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="bg-black/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-200 pointer-events-auto flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#00ff66]" />
                <span>
                  Scatto <strong>{(photoIdx % activePhotos.length) + 1}</strong> / {activePhotos.length} •{' '}
                  {currentPhoto.provider === 'PANORAMAX' ? 'Panoramax ODbL' : 'Mapillary API v4'}
                  {currentPhoto.capturedAt ? ` • ${new Date(currentPhoto.capturedAt).toLocaleDateString('it-IT')}` : ''}
                </span>
              </div>

              {gpsRoute && (
                <div className="bg-emerald-950/90 border border-emerald-500/40 px-3 py-2 rounded-xl text-xs text-emerald-200 pointer-events-auto flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>
                    Da tua posizione GPS: <strong>{gpsRoute.totalDistanceKm} km</strong> ({gpsRoute.totalDurationMinutes} min)
                  </span>
                </div>
              )}

              {activePhotos.length > 1 && (
                <div className="bg-black/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 flex items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setPhotoIdx((prev) => (prev - 1 + activePhotos.length) % activePhotos.length)}
                    className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prec</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoIdx((prev) => (prev + 1) % activePhotos.length)}
                    className="px-3 py-2 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <span>Succ</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black p-4">
            <div className="text-center max-w-md p-6 bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-2xl space-y-3">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-black text-white">
                {activeProvider === 'MAPILLARY' && !mapillaryToken
                  ? 'Chiave Mapillary non configurata'
                  : `Nessuna immagine reale disponibile su ${activeProvider === 'PANORAMAX' ? 'Panoramax' : 'Mapillary'}`}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {activeProvider === 'MAPILLARY' && !mapillaryToken
                  ? 'Per consultare le immagini Mapillary Graph API v4 è necessario configurare la variabile VITE_MAPILLARY_ACCESS_TOKEN. Nessuna immagine simulata verrà generata.'
                  : `Non sono state trovate fotografie panoramiche reali registrate attorno a ${(lat as number).toFixed(4)}, ${(lng as number).toFixed(4)} (${resolvedRoad}).`}
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                {activeProvider === 'PANORAMAX' && mapillaryPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProvider('MAPILLARY');
                      setPhotoIdx(0);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Passa a Mapillary ({mapillaryPhotos.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#00ff66] hover:bg-[#00e65c] text-black px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Torna alla Mappa 3D</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StreetView360Modal;
