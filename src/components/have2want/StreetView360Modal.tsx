import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass,
  Navigation,
  ArrowUp,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Footprints,
  Car,
  Maximize2,
  Minimize2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { isValidCoord } from '@/lib/worldAtlas';
import { calculateRealRoute } from '@/lib/routingService';

interface StreetView360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  cityName?: string;
  streetName?: string;
  placeName?: string;
}

export default function StreetView360Modal({
  isOpen,
  onClose,
  lat,
  lng,
  cityName = 'Mondo',
  streetName = 'Corso Principale',
  placeName,
}: StreetView360ModalProps) {
  const [currentStreet, setCurrentStreet] = useState(streetName);
  const [heading, setHeading] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [navMode, setNavMode] = useState<'WALK' | 'DRIVE'>('WALK');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedRoad, setResolvedRoad] = useState<string>(streetName);
  const [panoramaxUrl, setPanoramaxUrl] = useState<string | null>(null);
  const [panoramaxLoading, setPanoramaxLoading] = useState<boolean>(true);
  const [hasPanoramaxPhoto, setHasPanoramaxPhoto] = useState<boolean>(false);

  const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (!isOpen || !hasValidCoords) {
      setPanoramaxLoading(false);
      setHasPanoramaxPhoto(false);
      setPanoramaxUrl(null);
      return;
    }
    let isMounted = true;

    async function fetchPanoramaxData() {
      setPanoramaxLoading(true);
      setHasPanoramaxPhoto(false);
      setPanoramaxUrl(null);
      try {
        const delta = 0.002;
        const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
        const res = await fetch(`https://api.panoramax.xyz/api/search?bbox=${bbox}&limit=1`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const feature = data?.features?.[0];
          const picId = feature?.id || feature?.properties?.id;
          if (isMounted && picId) {
            setPanoramaxUrl(`https://api.panoramax.xyz/#focus=pic&pic=${encodeURIComponent(String(picId))}&map=none`);
            setHasPanoramaxPhoto(true);
          }
        }
      } catch (err) {
        console.warn('Errore fetch Panoramax:', err);
      } finally {
        if (isMounted) setPanoramaxLoading(false);
      }
    }

    fetchPanoramaxData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, hasValidCoords, lat, lng]);

  useEffect(() => {
    if (!isOpen || !hasValidCoords) return;
    let isMounted = true;
    async function resolveRealStreet() {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            const road = data.address?.road || data.address?.pedestrian || data.address?.suburb || streetName;
            setResolvedRoad(road);
            setCurrentStreet(road);
          }
        }
      } catch (err) {
        // Fallback su streetName passato come prop
      }
    }
    resolveRealStreet();
    return () => { isMounted = false; };
  }, [isOpen, lat, lng, streetName]);

  const [routeResult, setRouteResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !hasValidCoords) return;
    let isMounted = true;
    async function loadRoute() {
      try {
        const profile = navMode === 'DRIVE' ? 'driving' : 'walking';
        const startLat = lat - 0.0028;
        const startLng = lng - 0.0028;
        const res = await calculateRealRoute(startLat, startLng, lat, lng, profile);
        if (isMounted && res) {
          setRouteResult(res);
          setStepIndex(0);
        }
      } catch (e) {
        console.warn('Errore routing reale:', e);
      }
    }
    loadRoute();
    return () => { isMounted = false; };
  }, [isOpen, lat, lng, navMode]);

  const realSteps = routeResult?.steps || [];
  const currentStep = realSteps.length > 0 ? realSteps[stepIndex % realSteps.length] : {
    name: resolvedRoad,
    instruction: `Procedi verso destinazione lungo ${resolvedRoad}`,
    distanceMeters: 150,
    durationSeconds: 120,
    location: [lng, lat],
  };

  const stepForward = () => {
    setStepIndex((prev) => prev + 1);
    const nextStep = realSteps.length > 0 ? realSteps[(stepIndex + 1) % realSteps.length] : null;
    toast.success(`🚶 Avanzamento stradale lungo ${currentStreet}`, {
      description: nextStep ? `${nextStep.instruction} • ${nextStep.distanceMeters}m` : 'Raggiunto nuovo incrocio',
      duration: 2000,
    });
  };

  const stepBack = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
    toast.info('↩️ Retromarcia lungo il percorso stradale');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[60] bg-black flex flex-col p-0`}>
      <div className="relative w-full h-full flex flex-col bg-slate-950">
        {/* Top Navigation Bar: Google Street View style */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
          {/* Street & City Info Box */}
          <div className="bg-black/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-zinc-800 text-white shadow-2xl pointer-events-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-sm shadow-md">
              360°
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span className="text-[#00ff66]">{placeName || cityName}</span>
                <span className="text-zinc-500">•</span>
                <span className="truncate max-w-[200px] sm:max-w-xs">{currentStep.name}</span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>Lat: {lat.toFixed(4)}</span>
                <span>Lng: {lng.toFixed(4)}</span>
                <span className="text-amber-400 font-bold">Bussola: {heading}°</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border bg-emerald-500/20 text-[#00ff66] border-emerald-500/40">
                  📷 FOTOGRAFIA 360° REALE • Panoramax Open-Source (OpenStreetMap)
                </span>
              </div>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
            <div className="bg-black/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNavMode('WALK')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  navMode === 'WALK' ? 'bg-[#00ff66] text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Modalità A Piedi (5 km/h)"
              >
                <Footprints className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setNavMode('DRIVE')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  navMode === 'DRIVE' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Modalità Auto / Conducente (35 km/h)"
              >
                <Car className="w-4 h-4" />
              </button>
            </div>

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
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
              title="Esci da Street View 360°"
            >
              <ArrowLeft className="w-4 h-4 text-[#00ff66]" />
              <span>← Torna alla Mappa</span>
            </button>
          </div>
        </div>

        {!hasValidCoords ? (
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            <div className="text-center max-w-md mx-4 p-6 bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-2xl">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-black text-white mb-1.5">
                Coordinate geografiche non disponibili
              </h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Seleziona un Paese, una città o un punto valido sulla mappa prima di avviare la vista stradale a 360°.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#00ff66] hover:bg-[#00e65c] text-black px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Torna alla Mappa</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Panoramax Real 360 Photo Iframe / Loading / Empty State */}
            {panoramaxLoading ? (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <div className="text-center px-4">
                  <div className="inline-block w-9 h-9 border-4 border-[#00ff66] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-bold text-zinc-300">Ricerca foto stradale Panoramax in corso...</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Coordinate: {lat.toFixed(4)}, {lng.toFixed(4)}
                  </p>
                </div>
              </div>
            ) : hasPanoramaxPhoto && panoramaxUrl ? (
              <iframe
                src={panoramaxUrl}
                title="Panoramax 360 Real Street View"
                className="w-full h-full border-none"
                allow="geolocation; accelerometer; gyroscope"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <div className="text-center max-w-md mx-4 p-6 bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-2xl">
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-base font-black text-white mb-1.5">
                    Nessuna foto Panoramax disponibile
                  </h3>
                  <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                    Non risultano scatti panoramici geolocalizzati registrati in questo tratto stradale ({lat.toFixed(4)}, {lng.toFixed(4)}). Puoi tornare alla mappa.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#00ff66] hover:bg-[#00e65c] text-black px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>← Torna alla Mappa</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Turn-by-Turn GPS Directions Overlay at Bottom */}
        <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Turn instruction banner */}
          <div className="bg-black/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-emerald-500/40 text-white shadow-2xl pointer-events-auto flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0 font-black shadow-lg shadow-emerald-500/20">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xs font-black text-white">{currentStep.instruction}</div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                <span className="text-[#00ff66] font-bold">Distanza: {currentStep.distanceMeters ?? 120} m</span>
                <span>•</span>
                <span>Tempo: {Math.max(1, Math.round((currentStep.durationSeconds ?? 60) / 60))} min</span>
                <span>•</span>
                <span>{navMode === 'WALK' ? 'A Piedi (5 km/h)' : 'In Auto (35 km/h)'}</span>
                <span>•</span>
                <span className="text-zinc-500 font-mono text-[9px]">OSRM Reale</span>
              </div>
            </div>
          </div>

          {/* Street Walk Arrows (Forward / Backward) */}
          <div className="bg-black/90 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 shadow-2xl pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={stepBack}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Passo Indietro"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Indietro</span>
            </button>

            <button
              type="button"
              onClick={stepForward}
              className="px-5 py-3 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#00ff66]/20"
              title="Avanza lungo la strada"
            >
              <ArrowUp className="w-5 h-5 stroke-[3]" />
              <span>AVANZA LUNGO LA VIA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  , document.body);
}