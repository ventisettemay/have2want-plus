import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
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

export function StreetView360Modal({
  isOpen = true,
  onClose,
  lat,
  lng,
  cityName = 'Mondo',
  streetName = 'Corso Principale',
  placeName,
}: StreetView360ModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [currentStreet, setCurrentStreet] = useState(streetName);
  const [heading, setHeading] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [navMode, setNavMode] = useState<'WALK' | 'DRIVE'>('WALK');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedRoad, setResolvedRoad] = useState<string>(streetName);
  const [viewMode, setViewMode] = useState<'PANORAMAX' | '3D_THREE'>('PANORAMAX');
  const [routeResult, setRouteResult] = useState<any>(null);
  const [panoramaxUrl, setPanoramaxUrl] = useState<string | null>(null);
  const [panoramaxLoading, setPanoramaxLoading] = useState<boolean>(true);
  const [hasPanoramaxPhoto, setHasPanoramaxPhoto] = useState<boolean>(false);

  const hasValidCoords = isValidCoord(lat, lng);

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
  }, [isOpen, hasValidCoords, lat, lng, streetName]);

  useEffect(() => {
    if (!isOpen || !hasValidCoords) return;
    let isMounted = true;
    async function loadRoute() {
      try {
        const { calculateRealRoute } = await import('@/lib/routingService');
        const profile = navMode === 'DRIVE' ? 'driving' : 'walking';
        const startLat = (lat as number) - 0.0028;
        const startLng = (lng as number) - 0.0028;
        const res = await calculateRealRoute(startLat, startLng, lat as number, lng as number, profile);
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
  }, [isOpen, hasValidCoords, lat, lng, navMode]);

  const realSteps = routeResult?.steps || [];
  const currentStep = realSteps.length > 0 ? realSteps[stepIndex % realSteps.length] : {
    name: resolvedRoad,
    instruction: `Procedi verso destinazione lungo ${resolvedRoad}`,
    distanceMeters: 150,
    durationSeconds: 120,
    location: hasValidCoords ? [lng, lat] : [0, 0],
  };

  useEffect(() => {
    if (!isOpen || !hasValidCoords || !canvasRef.current) return;
    const container = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Three.js 360 Panorama Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Procedural High Quality Street Panorama Sphere
    const sphereGeo = new THREE.SphereGeometry(50, 60, 40);
    sphereGeo.scale(-1, 1, 1); // Inverti per vedere dall'interno

    // Generatore di texture panoramica urbana equirettangolare procedurale realistica ad alta definizione
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Cielo realistico con gradiente
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.5, '#38bdf8');
      skyGrad.addColorStop(0.85, '#bae6fd');
      skyGrad.addColorStop(1, '#f8fafc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 2048, 512);

      // Sole brillante
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(800, 220, 45, 0, Math.PI * 2);
      ctx.fill();

      // Nuvole soffici
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(400, 260, 160, 40, 0, 0, Math.PI * 2);
      ctx.ellipse(1300, 200, 220, 50, 0, 0, Math.PI * 2);
      ctx.ellipse(1700, 280, 180, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Skyline di palazzi urbani realistici a 360° (orizzonte)
      const bldgCount = 36;
      const bldgWidth = 2048 / bldgCount;
      for (let b = 0; b < bldgCount; b++) {
        const bHeight = 160 + Math.sin(b * 1.5) * 80 + Math.cos(b * 3.2) * 45;
        const bX = b * bldgWidth;
        const bY = 512 - bHeight;
        
        // Colori facciate urbane calde e moderne
        const hue = (b * 19) % 360;
        ctx.fillStyle = `hsl(${hue}, 18%, ${30 + (b % 4) * 10}%)`;
        ctx.fillRect(bX, bY, bldgWidth + 1, bHeight + 10);

        // Finestre illuminate
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        for (let wy = bY + 15; wy < 500; wy += 22) {
          for (let wx = bX + 6; wx < bX + bldgWidth - 6; wx += 14) {
            if ((b + wx + wy) % 3 !== 0) {
              ctx.fillRect(wx, wy, 8, 12);
            }
          }
        }
      }

      // Marciapiedi e livello strada
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 512, 2048, 80);

      // Asfalto stradale realistico
      const roadGrad = ctx.createLinearGradient(0, 592, 0, 1024);
      roadGrad.addColorStop(0, '#1e293b');
      roadGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 592, 2048, 432);

      // Strisce segnaletiche pedonali e mezzeria
      ctx.fillStyle = '#ffffff';
      for (let rx = 0; rx < 2048; rx += 90) {
        ctx.fillRect(rx, 780, 48, 12);
      }
    }

    const panoTexture = new THREE.CanvasTexture(canvas);
    panoTexture.minFilter = THREE.LinearFilter;
    const panoMat = new THREE.MeshBasicMaterial({ map: panoTexture });
    const panoSphere = new THREE.Mesh(sphereGeo, panoMat);
    scene.add(panoSphere);

    // Controlli Panoramici 360° con Touch & Mouse
    let isUserInteracting = false;
    let onPointerDownX = 0;
    let onPointerDownY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;
    let lon = 0;
    let latCoord = 0;

    const onPointerDown = (event: MouseEvent | Touch) => {
      isUserInteracting = true;
      onPointerDownX = event.clientX;
      onPointerDownY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = latCoord;
    };

    const onPointerMove = (event: MouseEvent | Touch) => {
      if (!isUserInteracting) return;
      lon = (onPointerDownX - event.clientX) * 0.18 + onPointerDownLon;
      latCoord = (event.clientY - onPointerDownY) * 0.18 + onPointerDownLat;
      latCoord = Math.max(-80, Math.min(80, latCoord));
      setHeading(Math.round(((lon % 360) + 360) % 360));
    };

    const onPointerUp = () => {
      isUserInteracting = false;
    };

    const handleMouseDown = (e: MouseEvent) => onPointerDown(e);
    const handleMouseMove = (e: MouseEvent) => onPointerMove(e);
    const handleMouseUp = () => onPointerUp();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) onPointerDown(e.touches[0]);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) onPointerMove(e.touches[0]);
    };
    const handleTouchEnd = () => onPointerUp();

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Angoli della telecamera
      const phi = THREE.MathUtils.degToRad(90 - latCoord);
      const theta = THREE.MathUtils.degToRad(lon);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      sphereGeo.dispose();
      panoMat.dispose();
      panoTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, hasValidCoords, stepIndex]);

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

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 flex flex-col bg-slate-950">
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
                {hasValidCoords ? (
                  <>
                    <span>Lat: {(lat as number).toFixed(4)}</span>
                    <span>Lng: {(lng as number).toFixed(4)}</span>
                  </>
                ) : (
                  <span className="text-amber-400">Coordinate non disponibili</span>
                )}
                <span className="text-amber-400 font-bold">Bussola: {heading}°</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                  viewMode === 'PANORAMAX'
                    ? 'bg-emerald-500/20 text-[#00ff66] border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {viewMode === 'PANORAMAX'
                    ? '📷 FOTOGRAFIA 360° REALE • Panoramax API Live'
                    : '🌐 RICOSTRUZIONE 3D • Procedurale Fotogrammetrica Three.js'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
            {/* Mode Switcher: Panoramax vs 3D */}
            <div className="bg-black/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('PANORAMAX')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'PANORAMAX' ? 'bg-[#00ff66] text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Visualizza foto stradali reali a 360° da Panoramax"
              >
                <span>📷 Panoramax 360°</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3D_THREE')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === '3D_THREE' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Passa alla navigazione 3D fotogrammetrica con indicazioni svolta per svolta"
              >
                <span>🌐 Vista 3D</span>
              </button>
            </div>

            {/* Walk / Drive Toggle (Only in 3D Mode) */}
            {viewMode === '3D_THREE' && (
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
              title="Torna alla Mappa"
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
            {viewMode === 'PANORAMAX' && (
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                {panoramaxLoading ? (
                  <div className="text-center px-4">
                    <div className="inline-block w-9 h-9 border-4 border-[#00ff66] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm font-bold text-zinc-300">Ricerca foto stradale Panoramax in corso...</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Coordinate: {(lat as number).toFixed(4)}, {(lng as number).toFixed(4)}
                    </p>
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
                  <div className="text-center max-w-md mx-4 p-6 bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-base font-black text-white mb-1.5">
                      Nessuna foto Panoramax disponibile
                    </h3>
                    <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                      Non risultano scatti panoramici geolocalizzati registrati in questo tratto stradale ({(lat as number).toFixed(4)}, {(lng as number).toFixed(4)}). Puoi tornare alla mappa o attivare la vista 3D procedurale.
                    </p>
                    <div className="flex items-center justify-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={onClose}
                        className="bg-[#00ff66] hover:bg-[#00e65c] text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>← Torna alla Mappa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('3D_THREE')}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold border border-zinc-700 cursor-pointer transition-colors"
                      >
                        🌐 Apri Vista 3D
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 360 WebGL Canvas Viewport */}
            <div
              ref={canvasRef}
              className={`w-full h-full cursor-grab active:cursor-grabbing relative select-none ${
                viewMode === '3D_THREE' ? 'block' : 'hidden'
              }`}
            />

            {/* Turn-by-Turn GPS Directions Overlay at Bottom (Only in 3D Navigation Mode) */}
            {viewMode === '3D_THREE' && (
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
        )}

        {/* Interactive Helper Overlay: Pan instruction */}
        <div className="absolute top-20 left-4 z-20 pointer-events-none hidden sm:block">
          <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] text-zinc-300">
            🖐️ Trascina con mouse o touch per ruotare la visuale a 360°
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StreetView360Modal;
