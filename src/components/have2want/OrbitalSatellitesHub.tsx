import React, { useEffect, useState } from 'react';
import { CloudSun, Store, ShoppingBag, Briefcase, X, ChevronRight, Sparkles, ShieldCheck, MapPin, Truck, Satellite } from 'lucide-react';
import VetrinaKmZero from './VetrinaKmZero';
import { GlobalMarketplaceView } from './GlobalMarketplaceView';
import BachecaLavoroP2P from './BachecaLavoroP2P';
import LiveWeatherModal from './LiveWeatherModal';
import SpacecraftInspectorModal from './SpacecraftInspectorModal';
import { SatelliteId, satelliteEngine } from '@/lib/satelliteModularEngine';

const SATELLITE_TO_CHANNEL: Record<SatelliteId, string> = {
  METEO_SAT: 'WEATHER',
  KM0_SAT: 'KMZERO',
  STREET_360_SAT: 'STRADARIO',
  PI_CHAT_SAT: 'CHAT',
  GLOBAL_MARKET_SAT: 'SUPERMARKET',
  EXTERNAL_MARKET_SAT: 'EXTERNAL',
  COMMUNITY_RESCUE_SAT: 'COMUNITA',
  BUSINESS_ADS_SAT: 'BUSINESS_ADS',
};

interface OrbitalSatellitesHubProps {
  currentUser?: any;
  onOpenChat?: (merchantId: string) => void;
  onTogglePolitical?: () => void;
  isPoliticalActive?: boolean;
  onToggleWeather?: () => void;
  isWeatherActive?: boolean;
  onOpenSatelliteChannel?: (channel: string) => void;
}

export default function OrbitalSatellitesHub({
  currentUser,
  onOpenChat,
  onTogglePolitical,
  isPoliticalActive = false,
  onToggleWeather,
  isWeatherActive = true,
  onOpenSatelliteChannel,
}: OrbitalSatellitesHubProps) {
  const [activeChannel, setActiveChannel] = useState<'METEO' | 'KMZERO' | 'SUPERMARKET' | 'LAVORO' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [selectedSatForFleet, setSelectedSatForFleet] = useState<SatelliteId | null>(null);
  const [fleetTab, setFleetTab] = useState<'INSPECTOR' | 'CONTROLS'>('CONTROLS');
  const [satelliteStates, setSatelliteStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = satelliteEngine.subscribe((states) => {
      setSatelliteStates(states as Record<string, boolean>);
    });
    return unsubscribe;
  }, []);

  const isSatelliteOn = (satId?: SatelliteId) => !satId || satelliteStates[satId] !== false;

  const channels = [
    {
      id: 'METEO' as const,
      satId: 'METEO_SAT' as SatelliteId,
      name: 'Meteo & Radar Territorio',
      desc: 'Nuvole, pioggia dinamica 3D, radar live e dissolvenza geopolitica',
      icon: CloudSun,
      color: 'from-sky-500 to-blue-600',
      badge: isWeatherActive ? 'LIVE 3D' : 'PAUSA',
      badgeColor: isWeatherActive ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-zinc-800 text-zinc-400',
    },
    {
      id: 'KMZERO' as const,
      satId: 'KM0_SAT' as SatelliteId,
      name: 'Produttori a Km Zero',
      desc: 'Agricoltori locali, ortofrutta fresca, negozi del territorio e ritiro sul posto',
      icon: Store,
      color: 'from-emerald-500 to-teal-600',
      badge: 'PRODUTTORI LOCALI',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'SUPERMARKET' as const,
      satId: 'GLOBAL_MARKET_SAT' as SatelliteId,
      name: 'Supermarket dal Mondo',
      desc: 'Marketplace mondiale, negozi internazionali e spedizioni tracciate',
      icon: ShoppingBag,
      color: 'from-amber-500 to-orange-600',
      badge: 'MARKETPLACE MONDO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'LAVORO' as const,
      satId: undefined as SatelliteId | undefined,
      name: 'Lavoro & Servizi Diretti',
      desc: 'Annunci di lavoro, servizi di prossimità e collaborazioni senza agenzie',
      icon: Briefcase,
      color: 'from-purple-500 to-indigo-600',
      badge: 'LAVORO & SERVIZI',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
  ];

  return (
    <>
      {/* Pulsante Canali Territoriali nell'Area di Navigazione */}
      <div className="relative">
        <button
          id="btn-orbital-satellites-menu"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg border ${
            isMenuOpen
              ? 'bg-[#00ff66] text-black border-[#00ff66] shadow-[#00ff66]/20'
              : 'bg-zinc-950/90 hover:bg-zinc-900 text-white border-zinc-700/80 hover:border-zinc-500'
          }`}
          title="Canali Territoriali: Meteo, Km 0, Marketplace e Lavoro P2P"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ff66]"></span>
          </span>
          <span className="font-black tracking-wide">CANALI TERRITORIALI</span>
        </button>

        {/* Dropdown Menu when clicked */}
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-zinc-950/98 border border-zinc-800 rounded-2xl p-3 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Canali & Servizi Territoriali</h4>
                  <p className="text-[10px] text-zinc-400">Le 4 funzioni operative chiave dell'ecosistema Have2Want</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 🛰️ Centro Controllo Flotta 8 Satelliti H2W */}
            <div className="mb-2.5">
              <button
                type="button"
                onClick={() => {
                  setFleetTab('CONTROLS');
                  setIsFleetModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-sky-950/80 hover:from-emerald-900/90 hover:to-sky-900/90 border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center justify-between group cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <Satellite className="w-4 h-4 text-emerald-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">CONTROLLO FLOTTA 8 SATELLITI</span>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-400 text-black">8 PRESET</span>
                    </div>
                    <p className="text-[10px] text-zinc-300">Interruttori ON/OFF, Ispezione 3D, orbite ed azionamenti</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>

            <div className="space-y-2">
              {channels.map((chan, idx) => {
                const Icon = chan.icon;
                return (
                  <button
                    key={chan.id}
                    type="button"
                    onClick={() => {
                      setActiveChannel(chan.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/70 hover:border-zinc-700 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${chan.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white truncate">{idx + 1}. {chan.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${isSatelliteOn(chan.satId) ? chan.badgeColor : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                            {isSatelliteOn(chan.satId) ? chan.badge : 'SPENTO'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{chan.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Quick Controls Section inside the menu */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="text-[10px]">Piattaforma P2P Senza Intermediari</span>
              <span className="text-[10px] font-black text-[#00ff66]">100% Zero Fiat • Pi Network</span>
            </div>
          </div>
        )}
      </div>

      {/* CANALE 1: METEO & RADAR TERRITORIO */}
      {activeChannel === 'METEO' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <CloudSun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">METEO LIVE & RADAR TERRITORIALE</h3>
                  <p className="text-[11px] text-zinc-400">Stato atmosfera 3D, precipitazioni, stazioni locali e mappa geopolitica</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveChannel(null)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">⛅ Nuvole & Pioggia 3D</div>
                  <div className="text-[10px] text-zinc-400">Atmosfera dinamica su mappa e globo</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isSatelliteOn('METEO_SAT');
                    satelliteEngine.setSatelliteActive('METEO_SAT', next);
                    if (onToggleWeather) onToggleWeather();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                    isSatelliteOn('METEO_SAT')
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isSatelliteOn('METEO_SAT') ? 'ATTIVO' : 'DISATTIVATO'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">🗺️ Dissolvenza Geopolitica</div>
                  <div className="text-[10px] text-zinc-400">Confini di Stato e territori</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onTogglePolitical) onTogglePolitical();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                    isPoliticalActive
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isPoliticalActive ? 'POLITICA' : 'FOTOGRAFICA'}
                </button>
              </div>
            </div>

            {/* Embedded Live Weather Modal Component view */}
            <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-black/40 p-4">
              <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider mb-2">Radar Live Territoriale</h4>
              <p className="text-xs text-zinc-300 mb-4">
                I dati meteorologici integrano precipitazioni, venti e copertura nuvolosa in tempo reale. Puoi disabilitare l'effetto visivo in qualsiasi momento dalla barra 3D.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveChannel(null)}
                  className="px-4 py-2 rounded-xl bg-[#00ff66] text-black font-black text-xs cursor-pointer hover:bg-[#00e65c]"
                >
                  Torna alla Mappa 3D
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANALE 2: VETRINA KM ZERO */}
      {activeChannel === 'KMZERO' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">🥦</span>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                VETRINA A KM ZERO (PRODOTTI FRESCHI & TERRITORIO)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveChannel(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Chiudi</span>
            </button>
          </div>
          <div className="max-w-7xl mx-auto">
            <VetrinaKmZero currentUser={currentUser} onOpenChat={onOpenChat} />
          </div>
        </div>
      )}

      {/* CANALE 3: MARKETPLACE INTERNAZIONALE & PRODOTTI FISICI */}
      {activeChannel === 'SUPERMARKET' && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-in fade-in duration-200">
          <GlobalMarketplaceView
            onBack={() => setActiveChannel(null)}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* CANALE 4: BACHECA LAVORO & SCAMBI P2P */}
      {activeChannel === 'LAVORO' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">💼</span>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                BACHECA LAVORO P2P & COMPETENZE (NO AGENZIE INTERINALI)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveChannel(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Chiudi</span>
            </button>
          </div>
          <div className="max-w-7xl mx-auto">
            <BachecaLavoroP2P currentUser={currentUser} />
          </div>
        </div>
      )}

      {/* 🛰️ MODALE CONTROLLO FLOTTA 8 SATELLITI & ISPEZIONE 3D */}
      <SpacecraftInspectorModal
        isOpen={isFleetModalOpen}
        selectedSatelliteId={selectedSatForFleet}
        initialTab={fleetTab}
        onClose={() => setIsFleetModalOpen(false)}
        onLaunchChannel={(satId) => {
          setIsFleetModalOpen(false);
          const channel = SATELLITE_TO_CHANNEL[satId];
          if (channel && onOpenSatelliteChannel) {
            onOpenSatelliteChannel(channel);
          } else if (satId === 'METEO_SAT') {
            setActiveChannel('METEO');
          } else if (satId === 'KM0_SAT') {
            setActiveChannel('KMZERO');
          } else if (satId === 'GLOBAL_MARKET_SAT' || satId === 'EXTERNAL_MARKET_SAT') {
            setActiveChannel('SUPERMARKET');
          }
        }}
        onSelectSatellite={(satId) => setSelectedSatForFleet(satId)}
      />
    </>
  );
}
