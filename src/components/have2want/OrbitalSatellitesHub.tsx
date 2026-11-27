import React, { useState, useEffect } from 'react';
import { CloudSun, Store, ShoppingBag, Briefcase, X, ChevronRight, Sparkles, ShieldCheck, MapPin, Truck, Satellite } from 'lucide-react';
import BachecaLavoroP2P from './BachecaLavoroP2P';
import VetrinaAgenziePaywall from './VetrinaAgenziePaywall';
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
  WEBCAM: 'WEBCAM',
  METEO_ROUTE: 'METEO_ROUTE',
  MAP_SAT: 'MAP',
  ACTIONFLOW_SAT: 'ACTIONFLOW',
  DEFIANCE_PULSE_SAT: 'DEFIANCE_PULSE',
  SOCCORSO_SAT: 'SOCCORSO',
  RADAR_SAT: 'RADAR',
  RADAR: 'RADAR',
};

interface OrbitalSatellitesHubProps {
  currentUser?: any;
  country?: any;
  onOpenChat?: (merchantId: string) => void;
  onTogglePolitical?: () => void;
  isPoliticalActive?: boolean;
  onToggleWeather?: () => void;
  isWeatherActive?: boolean;
  onOpenSatelliteChannel?: (channel: string) => void;
}

export default function OrbitalSatellitesHub({
  currentUser,
  country,
  onOpenChat,
  onTogglePolitical,
  isPoliticalActive = false,
  onToggleWeather,
  isWeatherActive: isWeatherActiveProp = true,
  onOpenSatelliteChannel,
}: OrbitalSatellitesHubProps) {
  const [activeChannel, setActiveChannel] = useState<'METEO' | 'KMZERO' | 'SUPERMARKET' | 'LAVORO' | 'AGENZIE' | null>(null);
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

  const isWeatherActive = satelliteStates['METEO_SAT'] ?? isWeatherActiveProp;

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
    {
      id: 'AGENZIE' as const,
      name: 'Agenzie & Interinali',
      desc: 'Vetrina a pagamento per agenzie, con le stesse tariffe dei commercianti',
      icon: ShieldCheck,
      color: 'from-rose-500 to-pink-600',
      badge: 'ABBONAMENTO',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
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
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-400 text-black">7 PRESET</span>
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

            {/* Interruttori diretti degli 8 satelliti */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Satelliti · ON/OFF</span>
                <span className="text-[9px] font-black text-[#00ff66]">
                  {satelliteEngine.getActiveCount()}/{satelliteEngine.getTotalCount()} ATTIVI
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {satelliteEngine.getAllSatellites().map((sat) => (
                  <button
                    key={sat.id}
                    type="button"
                    onClick={() => satelliteEngine.toggleSatellite(sat.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      satelliteStates[sat.id]
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                    }`}
                    title={`${sat.name} · ${sat.codeName}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${satelliteStates[sat.id] ? 'bg-[#00ff66]' : 'bg-zinc-600'}`} />
                    <span className="truncate">{sat.name}</span>
                    <span className="ml-auto text-[8px] font-black">{satelliteStates[sat.id] ? 'ON' : 'OFF'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Controls Section inside the menu */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="text-[10px]">Piattaforma P2P Senza Intermediari</span>
              <span className="text-[10px] font-black text-[#00ff66]">100% Zero Fiat • Pi Network</span>
            </div>
          </div>
        )}
      </div>

      {/* CANALE 1: METEO & RADAR TERRITORIO (dati reali Open-Meteo + RainViewer) */}
      {activeChannel === 'METEO' && (
        <LiveWeatherModal
          isOpen={true}
          onClose={() => setActiveChannel(null)}
          weather={null}
          place={null}
          country={country || null}
          weatherEffectsEnabled={isWeatherActive}
          onToggleWeatherEffects={() => {
            satelliteEngine.setSatelliteActive('METEO_SAT', !isWeatherActive);
            if (onToggleWeather) onToggleWeather();
          }}
        />
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
            <div className="text-slate-300 text-center py-20"><span className="text-2xl">🏪</span><h3 className="text-xl font-black mt-2">Vetrina a Km Zero</h3><p className="text-slate-500 mt-1">Produttori agricoli locali e filiera corta.</p></div>
          </div>
        </div>
      )}

      {/* CANALE 3: MARKETPLACE INTERNAZIONALE & PRODOTTI FISICI */}
      {activeChannel === 'SUPERMARKET' && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-in fade-in duration-200">
          <div className="text-slate-300 text-center py-20"><span className="text-2xl">🌍</span><h3 className="text-xl font-black mt-2">Marketplace Globale</h3><p className="text-slate-500 mt-1">Prodotti dal mondo, valute reali e spedizioni tracciate.</p></div>
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

      {/* CANALE 5: VETRINA AGENZIE A PAGAMENTO */}
      {activeChannel === 'AGENZIE' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                VETRINA AGENZIE & INTERINALI (ABBONAMENTO)
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
          <VetrinaAgenziePaywall currentUser={currentUser} />
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
          // L'apertura di un canale attiva anche il relativo satellite
          satelliteEngine.setSatelliteActive(satId, true);
          if (onOpenSatelliteChannel) {
            // Delega al contenitore territoriale: un solo livello di modali e servizio corretto
            onOpenSatelliteChannel(SATELLITE_TO_CHANNEL[satId]);
            return;
          }
          // Fallback locale solo se l'hub è usato senza il contenitore della mappa
          if (satId === 'METEO_SAT') setActiveChannel('METEO');
          else if (satId === 'KM0_SAT') setActiveChannel('KMZERO');
          else if (satId === 'GLOBAL_MARKET_SAT') setActiveChannel('SUPERMARKET');
        }}
        onSelectSatellite={(satId) => setSelectedSatForFleet(satId)}
      />
    </>
  );
}
