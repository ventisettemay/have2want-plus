import React, { useState } from 'react';
import { X, ExternalLink, Satellite, ShieldCheck, Radio, Globe, Compass, ArrowRight, ChevronLeft, ChevronRight, Layers, Eye } from 'lucide-react';

import sentinel2Img from '@/assets/images/sentinel_two_esa_1794141612427.jpg';
import meteosatImg from '@/assets/images/meteosat_three_sat_1794141624764.jpg';
import telstarImg from '@/assets/images/telstar_nineteen_sat_1794141637082.jpg';
import starlinkImg from '@/assets/images/starlink_v2_satellite_1794141648989.jpg';
import sentinel1Img from '@/assets/images/sentinel_one_sar_1794141660899.jpg';
import cospasImg from '@/assets/images/cospas_sarsat_meosar_1794141673678.jpg';
import noaaImg from '@/assets/images/noaa_nineteen_poes_1794141686910.jpg';
import worldviewImg from '@/assets/images/worldview_three_sat_1794141699752.jpg';

export interface ScientificSatelliteData {
  type: string;
  name: string;
  agency: string;
  missionCode: string;
  altitude: string;
  orbitType: string;
  primaryInstrument: string;
  launchYear: string;
  realCivilPurpose: string;
  h2wChannelName: string;
  h2wChannelDesc: string;
  h2wChannelButton: string;
  color: string;
  image: string;
}

export const REAL_SATELLITES_DATABASE: Record<string, ScientificSatelliteData> = {
  KMZERO: {
    type: 'KMZERO',
    name: 'Copernicus Sentinel-2',
    agency: 'ESA (European Space Agency)',
    missionCode: 'SENTINEL-2A / 2B',
    altitude: '786 km',
    orbitType: 'Elio-sincrona polare (SSO)',
    primaryInstrument: 'MSI (MultiSpectral Instrument - 13 bande ottiche)',
    launchYear: '2015 / 2017 (Operativo)',
    realCivilPurpose: 'Scansione multispettrale ad alta risoluzione del suolo, salute delle colture agricole, fertilità dei campi e ciclo vegetativo della filiera alimentare.',
    h2wChannelName: 'Km 0 & Produttori del Territorio',
    h2wChannelDesc: 'Accesso diretto agli agricoltori, artigiani e botteghe alimentari della tua zona con scambio trasparente e filiera corta.',
    h2wChannelButton: 'Entra nel Canale Km 0 Territoriale',
    color: '#10b981',
    image: sentinel2Img,
  },
  WEATHER: {
    type: 'WEATHER',
    name: 'Meteosat Third Generation (MTG)',
    agency: 'EUMETSAT & ESA',
    missionCode: 'MTG-I1',
    altitude: '35.786 km',
    orbitType: 'Geostazionaria (GEO)',
    primaryInstrument: 'FCI (Flexible Combined Imager a 16 canali termici) & Lightning Imager',
    launchYear: '2022 (Operativo)',
    realCivilPurpose: 'Rilevamento istantaneo dell\'atmosfera, monitoraggio dei fronti temporaleschi e previsioni del tempo in tempo reale per tutti i territori.',
    h2wChannelName: 'Meteo Live & Clima in Tempo Reale',
    h2wChannelDesc: 'Previsioni orarie e settimanali verificate via Open-Meteo per il comune selezionato, con nuvole dinamiche e allarmi meteo.',
    h2wChannelButton: 'Apri Meteo Live Territoriale',
    color: '#38bdf8',
    image: meteosatImg,
  },
  MONDO: {
    type: 'MONDO',
    name: 'Telstar 19 Vantage',
    agency: 'Telesat / Costruzione SSL (Maxar)',
    missionCode: 'TELSTAR-19V',
    altitude: '35.786 km',
    orbitType: 'Geostazionaria (GEO)',
    primaryInstrument: 'Transponder a microonde ad alta capacità Ka/Ku band con doppie parabole riflettenti',
    launchYear: '2018 (Operativo)',
    realCivilPurpose: 'Ponti radio ad alta velocità transoceanici tra continenti per il commercio internazionale, flussi logistici e telecomunicazioni globali.',
    h2wChannelName: 'Marketplace Globale & Prodotti dal Mondo',
    h2wChannelDesc: 'Supermarket mondiale per acquisti internazionali, catalogo verificato, doppia visualizzazione prezzi (valuta locale + Pi Network reale) e spedizioni tracciate.',
    h2wChannelButton: 'Esplora Marketplace Globale',
    color: '#a855f7',
    image: telstarImg,
  },
  P2P: {
    type: 'P2P',
    name: 'Starlink v2 Mini / Direct',
    agency: 'SpaceX',
    missionCode: 'STARLINK-V2',
    altitude: '540–550 km',
    orbitType: 'Orbita Bassa Terrestre (LEO)',
    primaryInstrument: 'Antenne phased array attive E-band & Laser inter-satellite optical mesh',
    launchYear: '2023–2026 (Operativo in costellazione)',
    realCivilPurpose: 'Rete mesh globale ultra-decentralizzata per connettere persone, freelance e comunità indipendenti senza censura o barriere geografiche.',
    h2wChannelName: 'Lavoro P2P & Bacheca Autonoma',
    h2wChannelDesc: 'Bacheca libera di piccoli lavori, riparazioni, competenze professionali e mutuo aiuto tra privati con contatto diretto.',
    h2wChannelButton: 'Apri Bacheca Lavoro P2P',
    color: '#00ff66',
    image: starlinkImg,
  },
  RADAR: {
    type: 'RADAR',
    name: 'Copernicus Sentinel-1 C-SAR',
    agency: 'ESA (European Space Agency)',
    missionCode: 'SENTINEL-1C',
    altitude: '693 km',
    orbitType: 'Orbita polare elio-sincrona',
    primaryInstrument: 'C-SAR (Synthetic Aperture Radar in banda C da 12,3 metri)',
    launchYear: '2024 (Operativo)',
    realCivilPurpose: 'Mappatura radar ad altissima precisione in qualsiasi condizione meteo (anche attraverso nubi fitte o di notte) per rilievi territoriali e prossimità fisica.',
    h2wChannelName: 'Radar Territoriale di Prossimità',
    h2wChannelDesc: 'Scansione geografica per raggio di vicinanza locale nel tuo comune o nelle zone limitrofe con raggio protetto.',
    h2wChannelButton: 'Avvia Scansione Radar Territoriale',
    color: '#f59e0b',
    image: sentinel1Img,
  },
  COMUNITA: {
    type: 'COMUNITA',
    name: 'Cospas-Sarsat MEOSAR',
    agency: 'Consorzio Internazionale Cospas-Sarsat',
    missionCode: 'COSPAS-SARSAT-SARP',
    altitude: '19.000–23.000 km',
    orbitType: 'Orbita Terrestre Media (MEO)',
    primaryInstrument: 'Ricevitore d\'emergenza SARP 406.1 MHz con antenne elicoidali spirali',
    launchYear: 'Operativo su costellazioni SAR',
    realCivilPurpose: 'Ricezione istantanea dei segnali di allarme e soccorso per il coordinamento del salvataggio civile e della solidarietà d\'emergenza nel mondo.',
    h2wChannelName: 'Comunità & Soccorso Civico',
    h2wChannelDesc: 'Rete solidale di emergenza civica, soccorso mutuo, punti di primo presidio e carpooling di prossimità.',
    h2wChannelButton: 'Accedi alla Rete Comunità & Soccorso',
    color: '#ef4444',
    image: cospasImg,
  },
  BARATTO: {
    type: 'BARATTO',
    name: 'NOAA-19 POES',
    agency: 'NASA & NOAA (USA)',
    missionCode: 'NOAA-19',
    altitude: '870 km',
    orbitType: 'Orbita Elio-sincrona pomeridiana',
    primaryInstrument: 'AVHRR/3 (Advanced Very High Resolution Radiometer) & modulo Argos',
    launchYear: '2009 (Operativo a lungo termine)',
    realCivilPurpose: 'Raccolta e ridistribuzione pubblica e aperta di parametri ambientali e risorse senza brevetti proprietari o barriere commerciali.',
    h2wChannelName: 'Baratto Puro & Risoluzione WANT',
    h2wChannelDesc: 'Filtro per scambi reciproci cosa offri (HAVE) per cosa cerchi (WANT) senza denaro, basato sulla pura reciprocità.',
    h2wChannelButton: 'Attiva Filtro Baratto Puro',
    color: '#ec4899',
    image: noaaImg,
  },
  STRADARIO: {
    type: 'STRADARIO',
    name: 'WorldView-3 Super-Spectral',
    agency: 'Maxar Technologies',
    missionCode: 'WORLDVIEW-3',
    altitude: '617 km',
    orbitType: 'Orbita Elio-sincrona a media inclinazione',
    primaryInstrument: 'Telescopio ottico Cassegrain da 1,1 metri con risoluzione di 31 cm/pixel',
    launchYear: '2014 (Operativo)',
    realCivilPurpose: 'Fotogrammetria urbana e viabilità di terra ad altissima risoluzione per la mappatura di strade, numeri civici, facciate di negozi e percorsi a 360°.',
    h2wChannelName: 'Stradario & Passeggiata 360°',
    h2wChannelDesc: 'Navigazione visiva a 360 gradi per esplorare le vie cittadine, gli incroci e la viabilità reale dei comuni.',
    h2wChannelButton: 'Apri Stradario & Vista 360°',
    color: '#06b6d4',
    image: worldviewImg,
  },
};

const ORDERED_TYPES = ['KMZERO', 'WEATHER', 'MONDO', 'P2P', 'RADAR', 'COMUNITA', 'BARATTO', 'STRADARIO'];

interface ScientificSatelliteModalProps {
  isOpen: boolean;
  satelliteType: string | null;
  onClose: () => void;
  onLaunchChannel: (satType: string) => void;
  onSelectSatellite?: (satType: string) => void;
}

export default function ScientificSatelliteModal({
  isOpen,
  satelliteType,
  onClose,
  onLaunchChannel,
  onSelectSatellite,
}: ScientificSatelliteModalProps) {
  if (!isOpen || !satelliteType) return null;

  // Normalizza tipologia (es. METEO -> WEATHER, SUPERMARKET -> MONDO, LAVORO -> P2P)
  const normType = (() => {
    if (satelliteType === 'METEO') return 'WEATHER';
    if (satelliteType === 'SUPERMARKET') return 'MONDO';
    if (satelliteType === 'LAVORO') return 'P2P';
    return satelliteType;
  })();

  const satData = REAL_SATELLITES_DATABASE[normType] || REAL_SATELLITES_DATABASE.KMZERO;

  const currentIndex = ORDERED_TYPES.indexOf(normType);
  const prevType = ORDERED_TYPES[(currentIndex - 1 + ORDERED_TYPES.length) % ORDERED_TYPES.length];
  const nextType = ORDERED_TYPES[(currentIndex + 1) % ORDERED_TYPES.length];

  const handlePrev = () => {
    if (onSelectSatellite) onSelectSatellite(prevType);
  };

  const handleNext = () => {
    if (onSelectSatellite) onSelectSatellite(nextType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white"
        style={{ boxShadow: `0 0 50px -10px ${satData.color}33` }}
      >
        {/* Intestazione Superiore Aerospaziale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-850 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{ backgroundColor: `${satData.color}15`, borderColor: `${satData.color}50` }}
            >
              <Satellite className="w-5 h-5" style={{ color: satData.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                  Sonda Orbitale Reale
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-[11px] font-semibold" style={{ color: satData.color }}>
                  {satData.agency}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                {satData.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigatore satelliti precedente/successivo */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
              <button
                onClick={handlePrev}
                title="Satellite precedente"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold px-2 text-zinc-400">
                {currentIndex + 1} / {ORDERED_TYPES.length}
              </span>
              <button
                onClick={handleNext}
                title="Satellite successivo"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
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

        {/* Corpo Scrollabile con Fotografia Reale HD e Dati di Missione */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* VERA FOTOGRAFIA UFFICIALE DELLO SPAZIO AD ALTA RISOLUZIONE */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video sm:aspect-[21/9] shadow-inner group">
            <img
              src={satData.image}
              alt={satData.name}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            
            {/* Scudo ottico e overlay informativo sulla foto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white tracking-wide">
                FOTOGRAFIA DI MISSIONE REALE
              </span>
              <span 
                className="px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-mono font-bold text-white border"
                style={{ backgroundColor: `${satData.color}33`, borderColor: `${satData.color}88` }}
              >
                ORBITA: {satData.altitude}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-zinc-300 font-medium">Designazione Ufficiale</p>
                <p className="text-sm sm:text-base font-black text-white">{satData.missionCode}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-300 font-medium">Stato di Volo</p>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  OPERATIVO IN ORBITA
                </p>
              </div>
            </div>
          </div>

          {/* SCHEDA DATI TECNICI REALI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-850">
              <span className="text-zinc-500 block mb-1">Quota e Traiettoria Orbitale</span>
              <span className="font-bold text-white text-sm block">{satData.altitude}</span>
              <span className="text-[11px] text-zinc-400">{satData.orbitType}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-850">
              <span className="text-zinc-500 block mb-1">Payload Scientifico Primario</span>
              <span className="font-bold text-white text-sm block truncate" title={satData.primaryInstrument}>
                {satData.primaryInstrument}
              </span>
              <span className="text-[11px] text-zinc-400">Sensori scientifici certificati</span>
            </div>
          </div>

          {/* SCOPO CIVILE REALE DEL SATELLITE */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Missione Civile Ufficiale nello Spazio
              </h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {satData.realCivilPurpose}
            </p>
          </div>

          {/* COLLEGAMENTO AL CANALE DELL'ECOSISTEMA H2W */}
          <div 
            className="p-5 rounded-2xl border transition-all"
            style={{ 
              backgroundColor: `${satData.color}0a`,
              borderColor: `${satData.color}40`,
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider" style={{ color: satData.color }}>
                  Canale HAVE2WANT Associato
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {satData.h2wChannelName}
                </h3>
              </div>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${satData.color}25` }}
              >
                <Radio className="w-5 h-5" style={{ color: satData.color }} />
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              {satData.h2wChannelDesc}
            </p>

            {/* PULSANTE DI LANCIO IMMEDIATO DEL CANALE */}
            <button
              onClick={() => {
                onClose();
                onLaunchChannel(satData.type);
              }}
              className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer shadow-lg"
              style={{
                backgroundColor: satData.color,
                color: '#000000',
              }}
            >
              <span>{satData.h2wChannelButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* MINI-BARRA PER SCORRERE GLI ALTRI SATELLITI REALI */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Esplora gli altri 7 satelliti reali in orbita
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ORDERED_TYPES.map((t) => {
                const s = REAL_SATELLITES_DATABASE[t];
                const isActive = t === normType;
                return (
                  <button
                    key={t}
                    onClick={() => onSelectSatellite && onSelectSatellite(t)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-white bg-zinc-800 scale-105 shadow-md' 
                        : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700">
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] font-bold text-zinc-300 truncate w-full text-center">
                      {s.h2wChannelName.split('&')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
