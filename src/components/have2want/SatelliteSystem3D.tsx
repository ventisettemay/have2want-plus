// SatelliteSystem3D.tsx — Sistema satellitare 3D integrato nel globo Cesium (Urbano 3D).
// - Posizioni reali da CelesTrak OMM + propagazione SGP4 (satellite.js)
// - Orbite 3D colorate per categoria
// - Scala fisica reale (coordinate inalterate) + scala visiva adattiva (billboard)
// - Interfaccia informativa, selezione, filtri, animazione temporale
// - Integrazione nel viewer Cesium esistente: nessun secondo globo
// - Usa esclusivamente i 10 satelliti canonici di INITIAL_SATELLITES_CATALOG
import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import {
  satelliteTelemetryStore,
  type SatelliteTelemetry,
  computeInstantaneousOrbitTrack,
} from '@/lib/satelliteTrackingService';
import { INITIAL_SATELLITES_CATALOG } from '@/lib/satelliteModularEngine';

const CELESTRIAL_EARTH_RADIUS_M = 6371000; // raggio medio Terra (m) per Cesium
const VISUAL_SCALE_INITIAL = 3;

interface SatelliteSystem3DProps {
  viewer?: Cesium.Viewer | null;
  enabled?: boolean;
  visualScale?: number;
  onSatelliteSelect?: (sat: SatelliteTelemetry | null) => void;
}

// Colori orbita per categoria (derivati dal category di SatelliteConfig)
const ORBIT_COLORS: Record<string, string> = {
  TERRITORIO: '#38bdf8', // azzurro
  METEO: '#10b981',      // verde
  MERCATI: '#f97316',    // arancione
  COMUNICAZIONE: '#a855f7', // viola
  COMUNITA: '#ef4444',   // rosso
};

// Genera una texture canvas (cerchio + icona) per il billboard del satellite
function createBillboardTexture(colorHex: string, glyph: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.arc(64, 64, 50, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(64, 64, 46, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, 64, 66);
  return canvas.toDataURL('image/png');
}

function toCartesian(lng: number, lat: number, altKm: number | null): Cesium.Cartesian3 {
  const altM = (altKm ?? 0) * 1000;
  return Cesium.Cartesian3.fromDegrees(lng, lat, CELESTRIAL_EARTH_RADIUS_M + altM);
}

export default function SatelliteSystem3D({
  viewer: viewerProp,
  enabled = true,
  visualScale = VISUAL_SCALE_INITIAL,
  onSatelliteSelect,
}: SatelliteSystem3DProps) {
  const viewerRef = useRef<Cesium.Viewer | null>(viewerProp ?? null);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const orbitLinesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<typeof INITIAL_SATELLITES_CATALOG>([]);
  const [telemetry, setTelemetry] = useState<Record<string, SatelliteTelemetry>>({});
  const [simTime, setSimTime] = useState<Date>(new Date());
  const [isRunning, setIsRunning] = useState(true);
  const [timeScale, setTimeScale] = useState(1);
  const [orbitsVisible, setOrbitsVisible] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'TERRITORIO' | 'METEO' | 'MERCATI' | 'COMUNICAZIONE' | 'COMUNITA'>('ALL');
  const rafRef = useRef<number | null>(null);

  if (viewerProp && !viewerRef.current) {
    viewerRef.current = viewerProp;
  }

  useEffect(() => {
    setCatalog(INITIAL_SATELLITES_CATALOG);
  }, []);

  useEffect(() => {
    if (!enabled || !viewerRef.current) return;
    const viewer = viewerRef.current;

    satelliteTelemetryStore.refreshAll().then(() => {
      setTelemetry(satelliteTelemetryStore.getSnapshot(new Date()));
    });

    const unsub = satelliteTelemetryStore.subscribe((snap) => {
      setTelemetry(snap);
    });

    return () => {
      unsub();
      clearEntities();
    };
  }, [enabled]);

  useEffect(() => {
    if (!isRunning || !viewerRef.current) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const delta = (now - last) / 1000;
      last = now;
      setSimTime((prev) => new Date(prev.getTime() + delta * 1000 * timeScale));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, timeScale]);

  useEffect(() => {
    if (!viewerRef.current || !enabled) return;
    updateEntities();
  }, [simTime, telemetry, visualScale, orbitsVisible, filterCategory, enabled]);

  function clearEntities() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    orbitLinesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current.clear();
    orbitLinesRef.current.clear();
  }

  function updateEntities() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    clearEntities();

    const phys = catalog.filter(
      (s) => s.isPhysicalSpacecraft && s.noradId !== null && s.isActive
    );

    phys.forEach((sat) => {
      const tel = telemetry[sat.id];
      if (!tel || tel.status !== 'live' || tel.lat === null || tel.lng === null) return;

      if (filterCategory !== 'ALL' && sat.category !== filterCategory) return;

      const color = Cesium.Color.fromCssColorString(sat.color ?? '#ffffff');
      const isSelected = selectedId === sat.id;

      const position = toCartesian(tel.lng, tel.lat, tel.altitudeKm);

      const tex = createBillboardTexture(sat.color ?? '#ffffff', sat.icon);

      viewer.entities.add({
        id: `sat_${sat.id}`,
        name: sat.name,
        position,
        billboard: {
          image: tex,
          width: 24 * visualScale,
          height: 24 * visualScale,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 4e7, 0.15),
        },
        label: {
          text: isSelected ? `${sat.name} • ${tel.altitudeKm!.toFixed(0)} km` : sat.name,
          font: 'bold 12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16 * visualScale),
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 4e7, 0.2),
          show: true,
        },
        description: `
          <strong>${sat.name}</strong><br/>
          NORAD: ${sat.noradId ?? 'N/D'}<br/>
          Ruolo: ${sat.h2wRole}<br/>
          Categoria: ${tel.orbitRegime}<br/>
          Altitudine: ${tel.altitudeKm!.toFixed(0)} km<br/>
          Velocità: ${tel.velocityKms!.toFixed(2)} km/s<br/>
          Inclinazione: ${tel.inclinationDeg!.toFixed(2)}°<br/>
          Fonte: ${tel.source}<br/>
          Epoca: ${tel.epochIso || 'N/D'}
        `,
      });

      if (orbitsVisible) {
        const omm = satelliteTelemetryStore.getOmmRecord(sat.id);
        if (omm) {
          const track = computeInstantaneousOrbitTrack(omm, simTime, 64);
          if (track.length > 1) {
            const positions = track.map((p) => toCartesian(p.lng, p.lat, p.altitudeKm));
            viewer.entities.add({
              id: `orbit_${sat.id}`,
              name: `Orbita ${sat.name}`,
              polyline: {
                positions: positions as Cesium.Cartesian3[],
                width: 2,
                material: color.withAlpha(0.5),
              },
            });
          }
        }
      }
    });
  }

  const selectedSat = catalog.find((s) => s.id === selectedId) ?? null;
  const selectedTel = selectedId ? telemetry[selectedId] : null;

  return (
    <>
      {enabled && viewerRef.current && (
        <div
          className="absolute top-4 left-4 z-30 flex flex-col gap-2 pointer-events-auto"
          style={{ userSelect: 'none' }}
        >
          <div className="bg-black/85 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-2xl text-xs text-zinc-200">
            <div className="font-black text-[#00ff66] mb-1">🛰️ Sistema Satellitare 3D</div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setIsRunning((p) => !p)}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold border border-zinc-700 cursor-pointer"
              >
                {isRunning ? '⏸️ Ferma Tempo' : '▶️ Avvia Tempo'}
              </button>
              <button
                onClick={() => setTimeScale((p) => Math.max(0.1, p - 0.5))}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold border border-zinc-700 cursor-pointer"
              >
                −
              </button>
              <span className="text-[10px] font-mono text-zinc-400">{timeScale.toFixed(1)}x</span>
              <button
                onClick={() => setTimeScale((p) => p + 0.5)}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold border border-zinc-700 cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="flex gap-1 mb-2">
              {['ALL', 'TERRITORIO', 'METEO', 'MERCATI', 'COMUNICAZIONE', 'COMUNITA'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer transition-colors ${
                    filterCategory === cat
                      ? 'bg-[#00ff66] text-black border-[#00ff66]'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'Tutti' : cat}
                </button>
              ))}
              <button
                onClick={() => setOrbitsVisible((p) => !p)}
                className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer transition-colors ${
                  orbitsVisible ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                {orbitsVisible ? '🌐 Orbite: ON' : '🌐 Orbite: OFF'}
              </button>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Satelliti reali: {catalog.filter((s) => s.isPhysicalSpacecraft).length} • Visivi: {Object.keys(telemetry).filter((id) => telemetry[id].status === 'live').length}
            </div>
          </div>

          {selectedSat && selectedTel && (
            <div className="bg-black/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-2xl text-xs text-zinc-200 max-w-[320px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-[#00ff66] font-bold text-xs border border-zinc-800">
                  {selectedSat.icon}
                </div>
                <div>
                  <div className="font-black text-white">{selectedSat.name}</div>
                  <div className="text-[10px] text-zinc-400">
                    NORAD {selectedSat.noradId ?? 'N/D'} • {selectedSat.category}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="ml-auto p-1 rounded hover:bg-zinc-800 cursor-pointer text-zinc-500"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-zinc-500">Altitudine</span><span>{selectedTel.altitudeKm!.toFixed(0)} km</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Velocità</span><span>{selectedTel.velocityKms!.toFixed(2)} km/s</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Inclinazione</span><span>{selectedTel.inclinationDeg!.toFixed(2)}°</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Periodo</span><span>{selectedTel.periodMinutes!.toFixed(0)} min</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Posizione</span><span>{selectedTel.lat!.toFixed(2)}°, {selectedTel.lng!.toFixed(2)}°</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Categoria</span><span>{selectedSat.category}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Ruolo</span><span className="truncate">{selectedSat.h2wRole}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Fonte dati</span><span className="truncate text-zinc-400">{selectedTel.source}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Epoca OMM</span><span className="truncate text-zinc-400">{selectedSat.officialDesignation ?? 'N/D'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Aggiornato</span><span className="text-zinc-400">{new Date(selectedTel.computedAtIso).toLocaleString()}</span></div>
                <div className="flex justify-between mt-2 pt-2 border-t border-zinc-800">
                  <span className="text-zinc-500">Scala visiva</span>
                  <span className="text-[#00ff66] font-bold">{visualScale}x (solo rappresentazione grafica)</span>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => {
                    if (viewerRef.current && selectedTel.lat !== null && selectedTel.lng !== null) {
                      viewerRef.current.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(
                          selectedTel.lng,
                          selectedTel.lat,
                          (selectedTel.altitudeKm ?? 0) * 1000 + 200000
                        ),
                        duration: 2,
                      });
                    }
                  }}
                  className="flex-1 py-1.5 rounded bg-[#00ff66] text-black text-[10px] font-bold cursor-pointer hover:bg-[#00e65c]"
                >
                  Segui satellite
                </button>
                <button
                  onClick={() => {
                    if (viewerRef.current) {
                      viewerRef.current.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(12.4922, 41.8902, 2000000),
                        duration: 2,
                      });
                    }
                    setSelectedId(null);
                  }}
                  className="flex-1 py-1.5 rounded bg-zinc-900 text-zinc-300 text-[10px] font-bold cursor-pointer border border-zinc-800 hover:bg-zinc-800"
                >
                  Torna a Terra
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {enabled && viewerRef.current && (
        <div className="absolute bottom-4 left-4 z-30 w-64 max-h-[60vh] overflow-y-auto bg-black/85 backdrop-blur-md border border-zinc-800 rounded-xl p-2 shadow-2xl pointer-events-auto">
          <div className="font-black text-[#00ff66] text-[10px] mb-2">Satelliti reali</div>
          {catalog
            .filter((s) => s.isPhysicalSpacecraft && s.isActive)
            .map((s) => {
              const t = telemetry[s.id];
              const live = t && t.status === 'live';
              const sel = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(sel ? null : s.id)}
                  className={`flex items-center gap-2 p-1.5 rounded text-[10px] transition-colors cursor-pointer ${
                    sel
                      ? 'bg-[#00ff66]/20 text-black font-black border border-[#00ff66]/40'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800/50 hover:bg-zinc-900'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    live ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-600'
                  }">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0 truncate">{s.name}</div>
                  {live ? (
                    <span className="text-[9px] text-emerald-400 font-mono">{t!.altitudeKm!.toFixed(0)} km</span>
                  ) : (
                    <span className="text-[9px] text-zinc-600">dati non disponibili</span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </>
  );
}
