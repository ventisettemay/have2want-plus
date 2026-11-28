import React, { useState, useEffect } from 'react';
import { CloudSun, Store, ShoppingBag, X, ChevronRight, Sparkles, MapPin, Mic, Globe, Zap, LifeBuoy, Megaphone, Satellite, Compass, Shield, Map, ShieldAlert, Cpu, Music, Video, Megaphone as MegaphoneIcon, Radio, Store as StoreIcon, Building2 as Building2Icon } from 'lucide-react';
import LiveWeatherModal from './LiveWeatherModal';
import SpacecraftInspectorModal from './SpacecraftInspectorModal';
import WorldEmergencyModal from './WorldEmergencyModal';
import PiChatUnifiedHub from './PiChatUnifiedHub';
import MerchantDetailModal from './MerchantDetailModal';
import { SatelliteId, satelliteEngine, SATELLITE_TO_CHANNEL, SATELLITE_TO_COMPONENT } from '@/lib/satelliteModularEngine';

interface OrbitalSatellitesHubProps {
  currentUser?: any;
  country?: any;
  onOpenChat?: (merchantId: string) => void;
  onTogglePolitical?: () => void;
  isPoliticalActive?: boolean;
  onToggleWeather?: () => void;
  isWeatherActive?: boolean;
  onOpenSatelliteChannel?: (channel: string) => void;
  onOpenDefiancePulse?: () => void;
}

type ChannelId =
  | 'WEATHER'
  | 'KMZERO'
  | 'CHAT'
  | 'SUPERMARKET'
  | 'EXTERNAL'
  | 'BUSINESS_ADS'
  | 'MAP'
  | 'EMERGENCY'
  | 'ACTIONFLOW'
  | 'DEFIANCE_PULSE'
  | 'CREATOR_ADS'
  | 'PUBLISH_STORE'
  | null;

export default function OrbitalSatellitesHub({
  currentUser,
  country,
  onOpenChat,
  onTogglePolitical,
  isPoliticalActive = false,
  onToggleWeather,
  isWeatherActive: isWeatherActiveProp = true,
  onOpenSatelliteChannel,
  onOpenDefiancePulse,
}: OrbitalSatellitesHubProps) {
  const [activeChannel, setActiveChannel] = useState<ChannelId>(null);
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
      id: 'WEATHER' as const,
      satId: 'METEO_SAT' as SatelliteId,
      name: 'METEO — Clima & Radar Live',
      desc: 'Previsioni Open-Meteo, radar 3D, allerte per ogni territorio',
      icon: CloudSun,
      color: 'from-sky-500 to-blue-600',
      badge: isWeatherActive ? 'LIVE 3D' : 'PAUSA',
      badgeColor: isWeatherActive ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-zinc-800 text-zinc-400',
    },
    {
      id: 'KMZERO' as const,
      satId: 'KM0_SAT' as SatelliteId,
      name: 'KM 0 — Filiera Corta',
      desc: 'Produttori locali, agricoltori, filiera corta a chilometro zero',
      icon: Store,
      color: 'from-emerald-500 to-teal-600',
      badge: 'PRODUTTORI LOCALI',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'SUPERMARKET' as const,
      satId: 'GLOBAL_MARKET_SAT' as SatelliteId,
      name: 'PRODOTTI DEL MONDO — Marketplace Interno',
      desc: 'Annunci utenti HAVE2WANT, compravendita P2P, pagamenti Pi',
      icon: ShoppingBag,
      color: 'from-amber-500 to-orange-600',
      badge: 'MARKETPLACE INTERNO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'EXTERNAL' as const,
      satId: 'EXTERNAL_MARKET_SAT' as SatelliteId,
      name: 'MARKETPLACE ESTERNI — Canali Esterni',
      desc: 'Ricerca prodotti Amazon/eBay, link affiliati, commissioni crypto',
      icon: Globe,
      color: 'from-amber-500 to-yellow-600',
      badge: 'MARKET ESTERNO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'CHAT' as const,
      satId: 'PI_CHAT_SAT' as SatelliteId,
      name: 'CHAT & VIDEOCHAT — Comunicazione Diretta',
      desc: 'Chat privata, note vocali, gruppi quartiere e videochiamate P2P (PiChatUnifiedHub + VideoChatModal)',
      icon: Mic,
      color: 'from-emerald-500 to-green-600',
      badge: 'CHAT & CALL',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'BUSINESS_ADS' as const,
      satId: 'BUSINESS_ADS_SAT' as SatelliteId,
      name: 'CREAZIONE PUBBLICITÀ — Vetrine Sponsorizzate',
      desc: 'Area VIP a pagamento per creare pubblicità, volantini e PIN luminosi (anche con AI)',
      icon: Megaphone,
      color: 'from-purple-500 to-fuchsia-600',
      badge: 'ADV VIP + AI',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      id: 'MAP' as const,
      satId: 'MAP_SAT' as SatelliteId,
      name: 'MAPPA 3D — Navigazione & Territorio',
      desc: 'GPS, stradario 360°, webcam, meteo percorso e radar prossimità (interno). Giunzioni: Urbano3D, StreetView360Modal, LiveWebcamsModal, Google3DUrbanLayer, RadarProximityModal.',
      icon: Map,
      color: 'from-cyan-500 to-blue-600',
      badge: 'NAVIGAZIONE REALE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      id: 'EMERGENCY' as const,
      satId: 'SOCCORSO_SAT' as SatelliteId,
      name: 'SOCCORSO — Emergenze & Mutuo Aiuto',
      desc: 'Numeri utili e di emergenza globali per Paese',
      icon: ShieldAlert,
      color: 'from-red-500 to-rose-600',
      badge: 'EMERGENZA GLOBALE',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    {
      id: 'DEFIANCE_PULSE' as const,
      satId: 'DEFIANCE_PULSE_SAT' as SatelliteId,
      name: 'DEFIANCE PULSE — Multimedia AI (Creator, Music, Video)',
      desc: 'Canale video, musica e creazione video AI (senza pubblicità commerciale)',
      icon: Cpu,
      color: 'from-violet-500 to-pink-600',
      badge: 'AI CREATOR • MUSIC • VIDEO',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    },
    {
      id: 'ACTIONFLOW' as const,
      satId: 'ACTIONFLOW_SAT' as SatelliteId,
      name: 'ACTIONFLOW HUB — Portal Applicazioni Esterne',
      desc: 'Ponte per collegare fino a 3 app esterne',
      icon: Zap,
      color: 'from-violet-500 to-purple-600',
      badge: 'ACTIONFLOW HUB',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    },
    {
      id: 'EXTERNAL' as const,
      satId: 'EXTERNAL_MARKET_SAT' as SatelliteId,
      name: 'MARKETPLACE ESTERNI — Canali Esterni',
      desc: 'Market globali filtrati per Paese, partner convenzionati, card prepagate e link di affiliazione',
      icon: Globe,
      color: 'from-amber-500 to-yellow-600',
      badge: 'MARKET ESTERNO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'CREATOR_ADS' as const,
      satId: 'CREATOR_ADS_SAT' as SatelliteId,
      name: 'CREATOR ADS — Pubblicità VIP a Pagamento',
      desc: 'Area VIP a pagamento per creare pubblicità, volantini e PIN luminosi (anche con AI)',
      icon: MegaphoneIcon,
      color: 'from-rose-500 to-pink-600',
      badge: 'CREATOR ADS VIP',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'PUBLISH_STORE' as const,
      satId: 'PUBLISH_STORE_SAT' as SatelliteId,
      name: 'PUBLISH & STORE — Vetrina Pubblica',
      desc: 'Vetrina pubblica per visionare negozi, professionisti e attività sul globo',
      icon: StoreIcon,
      color: 'from-emerald-500 to-teal-600',
      badge: 'VETRINA PUBBLICA',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
  ];

  const handleChannelClick = (chan: typeof channels[0]) => {
    setActiveChannel(chan.id);
    setIsMenuOpen(false);
    if (onOpenSatelliteChannel) {
      onOpenSatelliteChannel(chan.id);
    }
  };

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
          title="Canali Territoriali: 11 Satelliti Ufficiali"
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
                  <p className="text-[10px] text-zinc-400">11 Satelliti Ufficiali</p>
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

            {/* 🛰️ Centro Controllo Flotta */}
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
                      <span className="text-xs font-black text-white">CONTROLLO FLOTTA 11 SATELLITI</span>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-400 text-black">9 PRESET</span>
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
                    onClick={() => handleChannelClick(chan)}
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

            {/* Interruttori diretti dei 10+1 satelliti */}
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

      {/* CANALE: METEO & RADAR TERRITORIO */}
      {activeChannel === 'WEATHER' && (
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

      {/* CANALE: VETRINA KM ZERO */}
      {activeChannel === 'KMZERO' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌾</span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                KM 0 — FILIERA CORTA
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
            {/* Canale KM 0 — contenuto gestito tramite satellite engine */}
          </div>
        </div>
      )}

      {/* CANALE: PRODOTTI DEL MONDO (Marketplace Interno) */}
      {activeChannel === 'SUPERMARKET' && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-in fade-in duration-200">
          {/* Contenuto canale gestito tramite satellite engine */}
        </div>
      )}

      {/* CANALE: MARKETPLACE ESTERNI */}
      {activeChannel === 'EXTERNAL' && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-in fade-in duration-200">
          {/* Contenuto canale gestito tramite satellite engine */}
        </div>
      )}

      {/* CANALE: CHAT & VIDEOCHAT */}
      {activeChannel === 'CHAT' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                CHAT & VIDEOCHAT — COMUNICAZIONE DIRETTA
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
          <div className="max-w-7xl mx-auto p-4">
            <PiChatUnifiedHub currentUser={currentUser} onOpenChat={onOpenChat} />
          </div>
        </div>
      )}

      {/* CANALE: CREAZIONE PUBBLICITÀ */}
      {activeChannel === 'BUSINESS_ADS' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏪</span>
              <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                CREAZIONE PUBBLICITÀ — VETRINE SPONSORIZZATE
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
          <div className="max-w-7xl mx-auto p-4">
            <div className="text-center py-12 text-zinc-400">
              <Megaphone className="w-16 h-16 mx-auto mb-4 text-purple-500/50" />
              <p className="text-sm">BusinessSponsorModal — Vetrine 7gg Pi-paid + AI Creator</p>
              <p className="text-xs mt-2">Genera copy, headline, script vocale, storyboard video con AI</p>
            </div>
          </div>
        </div>
      )}

      {/* CANALE: MAPPA 3D — Navigazione Unificata */}
      {activeChannel === 'MAP' && (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-black/95 border-b border-zinc-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                MAPPA 3D — NAVIGAZIONE & TERRITORIO
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveChannel(null)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Chiudi</span>
            </button>
          </div>
          <div className="h-[calc(100vh-60px)]">
            <div className="text-center py-12 text-zinc-400">
              <Map className="w-16 h-16 mx-auto mb-4 text-cyan-500/50" />
              <p className="text-sm">MapView3DContainer — GPS, Strade/Edifici Reali, OSRM, Meteo Integrato, Webcam</p>
              <p className="text-xs mt-2">Giunzioni: Urbano3D • StreetView360Modal • LiveWebcamsModal • Google3DUrbanLayer • RadarProximityModal (interno)</p>
              <p className="text-xs mt-1">Layer: Commerciali 3-tier • Meteo su Percorsi • Webcam Live • Radar Prossimità</p>
            </div>
          </div>
        </div>
      )}

      {/* CANALE: SOCCORSO — Emergenze */}
      {activeChannel === 'EMERGENCY' && (
        <WorldEmergencyModal
          isOpen={true}
          onClose={() => setActiveChannel(null)}
        />
      )}

      {/* CANALE: ACTIONFLOW HUB */}
      {activeChannel === 'ACTIONFLOW' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <span className="text-xs font-black text-violet-400 uppercase tracking-wider">
                ACTIONFLOW HUB — PORTAL APP ESTERNE
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
          <div className="max-w-7xl mx-auto p-4">
            <div className="text-center py-12 text-zinc-400">
              <Zap className="w-16 h-16 mx-auto mb-4 text-violet-500/50" />
              <p className="text-sm">ActionFlowHubModal — Centro missioni, attività AI, ricompense</p>
              <p className="text-xs mt-2">Portal per applicazioni esterne dell'ecosistema</p>
            </div>
          </div>
        </div>
      )}

      {/* CANALE: DEFIANCE PULSE */}
      {activeChannel === 'DEFIANCE_PULSE' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-xs font-black text-violet-400 uppercase tracking-wider">
                DEFIANCE PULSE — MULTIMEDIA AI (4 AREE)
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
          <div className="max-w-7xl mx-auto p-4">
            <div className="text-center py-12 text-zinc-400">
              <Cpu className="w-16 h-16 mx-auto mb-4 text-violet-500/50" />
              <p className="text-sm">DefiancePulseHub — CREATOR • MUSIC • VIDEO • PROMOTION</p>
              <p className="text-xs mt-2">Generazione client-side (CPU utente), no API esterne, no costi</p>
            </div>
          </div>
        </div>
      )}

      {/* CANALE: CREATOR ADS — Pubblicità VIP a Pagamento */}
      {activeChannel === 'CREATOR_ADS' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">📢</span>
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                CREATOR ADS — PUBBLICITÀ VIP A PAGAMENTO
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
          <div className="max-w-7xl mx-auto p-4">
            <div className="text-center py-12 text-zinc-400">
              <MegaphoneIcon className="w-16 h-16 mx-auto mb-4 text-rose-500/50" />
              <p className="text-sm">BusinessSponsorModal — Area VIP a pagamento per creare pubblicità, volantini e PIN luminosi</p>
              <p className="text-xs mt-2">Collegato a server/ad*.ts (campagne, ordini, ledger, wallet, provider AI Gemini)</p>
            </div>
          </div>
        </div>
      )}

      {/* CANALE: PUBLISH & STORE — Vetrina Pubblica */}
      {activeChannel === 'PUBLISH_STORE' && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
          <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏪</span>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                PUBLISH & STORE — VETRINA PUBBLICA
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
          <div className="max-w-7xl mx-auto p-4">
            <div className="text-center py-12 text-zinc-400">
              <Building2Icon className="w-16 h-16 mx-auto mb-4 text-emerald-500/50" />
              <p className="text-sm">MerchantDetailModal — Vetrina pubblica per visionare negozi, professionisti e attività sul globo</p>
              <p className="text-xs mt-2">Negozi, professionisti e servizi geolocalizzati sul globo 3D</p>
            </div>
          </div>
        </div>
      )}

      {/* 🛰️ MODALE CONTROLLO FLOTTA & ISPEZIONE 3D */}
      <SpacecraftInspectorModal
        isOpen={isFleetModalOpen}
        selectedSatelliteId={selectedSatForFleet}
        initialTab={fleetTab}
        onClose={() => setIsFleetModalOpen(false)}
        onLaunchChannel={(satId) => {
          setIsFleetModalOpen(false);
          satelliteEngine.setSatelliteActive(satId, true);
          if (onOpenSatelliteChannel) {
            onOpenSatelliteChannel(SATELLITE_TO_CHANNEL[satId]);
            return;
          }
          const channel = SATELLITE_TO_CHANNEL[satId];
          if (channel) setActiveChannel(channel as ChannelId);
        }}
        onSelectSatellite={(satId) => setSelectedSatForFleet(satId)}
      />
    </>
  );
}