// SPACECRAFT INSPECTOR & PANNELLO CONTROLLO SATELLITI – HAVE2WANT PLUS
// Permette all'utente di ispezionare visivamente gli 8 veicoli spaziali in 3D,
// accendere/spegnere ciascun satellite (ON/OFF), attivare i 7 preset concordati
// e lanciare direttamente il relativo servizio applicativo senza uscire dal flusso.

import React, { useState, useEffect } from 'react';
import {
  Satellite,
  X,
  Power,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  ShieldCheck,
  Radio,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  SatelliteId,
  PresetType,
  SatelliteConfig,
  satelliteEngine,
  INITIAL_SATELLITES_CATALOG
} from '@/lib/satelliteModularEngine';

interface SpacecraftInspectorModalProps {
  isOpen: boolean;
  selectedSatelliteId: SatelliteId | null;
  onClose: () => void;
  onLaunchChannel: (satelliteId: SatelliteId) => void;
  onSelectSatellite?: (satelliteId: SatelliteId) => void;
  initialTab?: 'INSPECTOR' | 'CONTROLS';
}

export default function SpacecraftInspectorModal({
  isOpen,
  selectedSatelliteId,
  onClose,
  onLaunchChannel,
  onSelectSatellite,
  initialTab = 'INSPECTOR',
}: SpacecraftInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<'INSPECTOR' | 'CONTROLS'>(initialTab);
  const [satelliteStates, setSatelliteStates] = useState<Record<SatelliteId, boolean>>(() => {
    const states: Record<SatelliteId, boolean> = {} as any;
    INITIAL_SATELLITES_CATALOG.forEach((s) => {
      states[s.id] = satelliteEngine.isSatelliteActive(s.id);
    });
    return states;
  });

  const [currentSatId, setCurrentSatId] = useState<SatelliteId>(selectedSatelliteId || 'METEO_SAT');

  useEffect(() => {
    if (selectedSatelliteId) {
      setCurrentSatId(selectedSatelliteId);
    }
  }, [selectedSatelliteId]);

  useEffect(() => {
    const unsubscribe = satelliteEngine.subscribe((states) => {
      setSatelliteStates(states);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const currentSat = INITIAL_SATELLITES_CATALOG.find((s) => s.id === currentSatId) || INITIAL_SATELLITES_CATALOG[0];
  const isCurrentActive = Boolean(satelliteStates[currentSat.id]);

  const currentIndex = INITIAL_SATELLITES_CATALOG.findIndex((s) => s.id === currentSat.id);
  const prevSat = INITIAL_SATELLITES_CATALOG[(currentIndex - 1 + INITIAL_SATELLITES_CATALOG.length) % INITIAL_SATELLITES_CATALOG.length];
  const nextSat = INITIAL_SATELLITES_CATALOG[(currentIndex + 1) % INITIAL_SATELLITES_CATALOG.length];

  const handleSelect = (id: SatelliteId) => {
    setCurrentSatId(id);
    if (onSelectSatellite) onSelectSatellite(id);
  };

  const handleToggle = (id: SatelliteId) => {
    satelliteEngine.toggleSatellite(id);
  };

  const handlePreset = (preset: PresetType) => {
    satelliteEngine.applyPreset(preset);
  };

  const activeCount = Object.values(satelliteStates).filter(Boolean).length;
  const totalCount = INITIAL_SATELLITES_CATALOG.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white"
        style={{ boxShadow: `0 0 60px -15px ${currentSat.color}35` }}
      >
        {/* HEADER MODALE */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-850 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border text-lg"
              style={{ backgroundColor: `${currentSat.color}15`, borderColor: `${currentSat.color}60` }}
            >
              {currentSat.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {currentSat.category}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-[10px] font-bold" style={{ color: currentSat.color }}>
                  {currentSat.codeName}
                </span>
                <span className="text-zinc-600">·</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isCurrentActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isCurrentActive ? 'IN ORBITA' : 'DISATTIVATO'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                {currentSat.name}
              </h2>
            </div>
          </div>

          {/* TABS SELETTORE & CHIUDI */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('INSPECTOR')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'INSPECTOR' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ispezione
              </button>
              <button
                onClick={() => setActiveTab('CONTROLS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'CONTROLS' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Flotta ({activeCount}/{totalCount})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO MODALE */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'INSPECTOR' ? (
            /* TAB 1: ISPEZIONE VEICOLO SPAZIALE & LANCIO CANALE */
            <>
              {/* SCHEDA VISIVA DEL VEICOLO SPAZIALE */}
              <div
                className="relative rounded-2xl overflow-hidden border border-zinc-800 p-6 flex flex-col justify-between min-h-[220px] bg-gradient-to-b from-zinc-900/80 to-black"
                style={{ borderColor: `${currentSat.color}40` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase">
                      Codice di Volo & Quota Orbitale
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      {currentSat.codeName}
                    </h3>
                    <p className="text-xs text-zinc-300 font-medium mt-1">
                      Orbita: {currentSat.altitudeKm.toLocaleString()} km dalla superficie terrestre
                    </p>
                  </div>

                  {/* INTERRUTTORE ON/OFF SATELLITE */}
                  <button
                    onClick={() => handleToggle(currentSat.id)}
                    className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all border ${
                      isCurrentActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <Power className={`w-3.5 h-3.5 ${isCurrentActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span>{isCurrentActive ? 'ATTIVO (ON)' : 'SPENTO (OFF)'}</span>
                  </button>
                </div>

                {/* RUOLO APPLICATIVO H2W */}
                <div className="mt-4 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <Radio className="w-4 h-4" style={{ color: currentSat.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Funzione Operativa HAVE2WANT
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {currentSat.h2wRole}
                  </p>
                </div>

                {/* PULSANTE LANCIO CANALE */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (!isCurrentActive) {
                        satelliteEngine.setSatelliteActive(currentSat.id, true);
                      }
                      onClose();
                      onLaunchChannel(currentSat.id);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 shadow-lg"
                    style={{
                      backgroundColor: currentSat.color,
                      color: '#000000',
                    }}
                  >
                    <span>Apri Canale {currentSat.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* NAVIGAZIONE RAPIDA TRA GLI 8 SATELLITI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Flotta Completa (8 Satelliti)
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => handleSelect(prevSat.id)}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Precedente"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1 text-zinc-400">
                      {currentIndex + 1} / {totalCount}
                    </span>
                    <button
                      onClick={() => handleSelect(nextSat.id)}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Successivo"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {INITIAL_SATELLITES_CATALOG.map((s) => {
                    const isSelected = s.id === currentSat.id;
                    const isActive = Boolean(satelliteStates[s.id]);
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelect(s.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'border-white bg-zinc-850 shadow-md scale-102'
                            : 'border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{s.icon}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-zinc-700'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-white truncate w-full">
                          {s.name}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-400 truncate w-full">
                          {s.codeName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: PANNELLO CONTROLLO SATELLITI & PRESET */
            <div className="space-y-6">
              {/* SETTE PRESET CONCORDATI */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Preset di Attivazione Rapida
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Attivi: {activeCount} su {totalCount}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handlePreset('ACCENDI_TUTTI')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-emerald-950/60 border border-zinc-800 hover:border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition-colors cursor-pointer text-center"
                  >
                    🚀 Accendi Tutti
                  </button>
                  <button
                    onClick={() => handlePreset('SPEGNI_TUTTI')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/40 text-[11px] font-bold text-red-300 transition-colors cursor-pointer text-center"
                  >
                    ⏹️ Spegni Tutti
                  </button>
                  <button
                    onClick={() => handlePreset('SOLO_METEO')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-sky-950/60 border border-zinc-800 hover:border-sky-500/40 text-[11px] font-bold text-sky-300 transition-colors cursor-pointer text-center"
                  >
                    🌦️ Solo Meteo
                  </button>
                  <button
                    onClick={() => handlePreset('SOLO_CHAT')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-green-950/60 border border-zinc-800 hover:border-green-500/40 text-[11px] font-bold text-green-300 transition-colors cursor-pointer text-center"
                  >
                    🎙️ Solo Chat
                  </button>
                  <button
                    onClick={() => handlePreset('KM0_METEO')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-teal-950/60 border border-zinc-800 hover:border-teal-500/40 text-[11px] font-bold text-teal-300 transition-colors cursor-pointer text-center"
                  >
                    🌾 Km 0 + Meteo
                  </button>
                  <button
                    onClick={() => handlePreset('SOLO_MERCATI')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-purple-950/60 border border-zinc-800 hover:border-purple-500/40 text-[11px] font-bold text-purple-300 transition-colors cursor-pointer text-center"
                  >
                    🌐 Solo Mercati
                  </button>
                  <button
                    onClick={() => handlePreset('SOLO_TERRITORIO')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-amber-950/60 border border-zinc-800 hover:border-amber-500/40 text-[11px] font-bold text-amber-300 transition-colors cursor-pointer text-center"
                  >
                    📍 Solo Territorio
                  </button>
                  <button
                    onClick={() => handlePreset('RIPRISTINA_TUTTI')}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-bold text-zinc-300 transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ripristina</span>
                  </button>
                </div>
              </div>

              {/* LISTA DEGLI 8 SATELLITI CON INTERRUTTORE ON/OFF */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Interruttori Individuali degli 8 Satelliti
                </span>
                <div className="space-y-2">
                  {INITIAL_SATELLITES_CATALOG.map((sat) => {
                    const isActive = Boolean(satelliteStates[sat.id]);
                    return (
                      <div
                        key={sat.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-zinc-900/60 border-zinc-800'
                            : 'bg-zinc-950/80 border-zinc-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl shrink-0">{sat.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white truncate">
                                {sat.name}
                              </span>
                              <span className="text-[9px] font-mono font-bold text-zinc-400">
                                {sat.codeName}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {sat.h2wRole}
                            </p>
                          </div>
                        </div>

                        {/* TOGGLE SWITCH */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggle(sat.id)}
                            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                              isActive ? 'bg-emerald-500' : 'bg-zinc-800'
                            }`}
                          >
                            <span
                              className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                                isActive ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
