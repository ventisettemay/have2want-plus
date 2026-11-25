// REGISTRO CANONICO DEGLI 11 SATELLITI CONFERMATI — HAVE2WANT PLUS
// Copre tutti gli 11 canali operativi confermati dal proprietario mantenendo piena compatibilità
// con il motore 3D orbitale (satelliteModularEngine.ts) senza alterare Globo3D.jsx o src/types.ts.

export type ConfirmedSatelliteId =
  | 'SOCCORSO_SAT'
  | 'MAP_SAT'
  | 'ACTIONFLOW_SAT'
  | 'DEFIANCE_PULSE_SAT'
  | 'RADAR_SAT'
  | 'METEO_SAT'
  | 'KM0_SAT'
  | 'PI_CHAT_SAT'
  | 'GLOBAL_MARKET_SAT'
  | 'EXTERNAL_MARKET_SAT'
  | 'BUSINESS_ADS_SAT';

export interface ConfirmedSatelliteSpec {
  id: ConfirmedSatelliteId;
  orbitEngineId: string;
  channel: string;
  name: string;
  icon: string;
  color: string;
  targetComponent: string;
  shortDescription: string;
}

export const CONFIRMED_SATELLITES: ConfirmedSatelliteSpec[] = [
  {
    id: 'SOCCORSO_SAT',
    orbitEngineId: 'COMMUNITY_RESCUE_SAT',
    channel: 'EMERGENCY',
    name: 'SOCCORSO',
    icon: '🚨',
    color: '#f97316',
    targetComponent: 'WorldEmergencyModal',
    shortDescription: 'Numeri di emergenza e soccorso mondiale immediato.',
  },
  {
    id: 'MAP_SAT',
    orbitEngineId: 'MAP_SAT',
    channel: 'MAP',
    name: 'MAPPA 3D',
    icon: '🗺️',
    color: '#ffffff',
    targetComponent: 'MapView3DContainer',
    shortDescription: 'Mappa 3D, strade OSM, navigazione GPS, Stradario 360° e Webcam.',
  },
  {
    id: 'ACTIONFLOW_SAT',
    orbitEngineId: 'ACTIONFLOW_SAT',
    channel: 'ACTIONFLOW',
    name: 'ACTIONFLOW HUB',
    icon: '⚡',
    color: '#22c55e',
    targetComponent: 'ActionFlowHubModal',
    shortDescription: 'Bridge per 3 applicazioni esterne configurabili.',
  },
  {
    id: 'DEFIANCE_PULSE_SAT',
    orbitEngineId: 'DEFIANCE_PULSE_SAT',
    channel: 'DEFIANCE_PULSE',
    name: 'DEFIANCE PULSE',
    icon: '🎙️',
    color: '#c084fc',
    targetComponent: 'DefiancePulseHub',
    shortDescription: 'Spazio Creator, Musica, Video e Promozione interna.',
  },
  {
    id: 'RADAR_SAT',
    orbitEngineId: 'MAP_SAT',
    channel: 'RADAR',
    name: 'RADAR PROSSIMITÀ',
    icon: '📡',
    color: '#38bdf8',
    targetComponent: 'RadarProximityModal',
    shortDescription: 'Scansione locale Haversine di annunci e attività vicine a costo zero.',
  },
  {
    id: 'METEO_SAT',
    orbitEngineId: 'METEO_SAT',
    channel: 'WEATHER',
    name: 'METEO LIVE',
    icon: '🌩️',
    color: '#ef4444',
    targetComponent: 'LiveWeatherModal',
    shortDescription: 'Previsioni Open-Meteo, venti, onde e precipitazioni radar.',
  },
  {
    id: 'KM0_SAT',
    orbitEngineId: 'KM0_SAT',
    channel: 'KMZERO',
    name: 'KM 0',
    icon: '🌾',
    color: '#00ff66',
    targetComponent: 'VetrinaKmZero',
    shortDescription: 'Produttori agricoli locali, artigiani e filiera corta entro 100 km.',
  },
  {
    id: 'PI_CHAT_SAT',
    orbitEngineId: 'PI_CHAT_SAT',
    channel: 'CHAT',
    name: 'CHAT E VIDEO',
    icon: '💬',
    color: '#10b981',
    targetComponent: 'PiChatUnifiedHub',
    shortDescription: 'Chat privata, note vocali, gruppi quartiere e videochiamata WebRTC gratuita.',
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    orbitEngineId: 'GLOBAL_MARKET_SAT',
    channel: 'SUPERMARKET',
    name: 'PRODOTTI DEL MONDO',
    icon: '🌍',
    color: '#06b6d4',
    targetComponent: 'GlobalMarketplaceView',
    shortDescription: 'Marketplace internazionale, Baratto, Cerco e Lavoro P2P.',
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    orbitEngineId: 'EXTERNAL_MARKET_SAT',
    channel: 'EXTERNAL',
    name: 'MARKETPLACE ESTERNI',
    icon: '🛒',
    color: '#38bdf8',
    targetComponent: 'ExternalListings',
    shortDescription: 'Cataloghi esterni con regolamento esclusivamente in criptovalute.',
  },
  {
    id: 'BUSINESS_ADS_SAT',
    orbitEngineId: 'BUSINESS_ADS_SAT',
    channel: 'BUSINESS_ADS',
    name: 'CREAZIONE PUBBLICITÀ',
    icon: '📢',
    color: '#fbbf24',
    targetComponent: 'BusinessSponsorModal',
    shortDescription: 'Creazione e gestione spilli, banner video e volantini promozionali.',
  },
];

export const CONFIRMED_SATELLITE_TO_COMPONENT: Record<ConfirmedSatelliteId, string> = {
  SOCCORSO_SAT: 'WorldEmergencyModal',
  MAP_SAT: 'MapView3DContainer',
  ACTIONFLOW_SAT: 'ActionFlowHubModal',
  DEFIANCE_PULSE_SAT: 'DefiancePulseHub',
  RADAR_SAT: 'RadarProximityModal',
  METEO_SAT: 'LiveWeatherModal',
  KM0_SAT: 'VetrinaKmZero',
  PI_CHAT_SAT: 'PiChatUnifiedHub',
  GLOBAL_MARKET_SAT: 'GlobalMarketplaceView',
  EXTERNAL_MARKET_SAT: 'ExternalListings',
  BUSINESS_ADS_SAT: 'BusinessSponsorModal',
};

export function getConfirmedSatelliteById(id: string): ConfirmedSatelliteSpec | undefined {
  if (id === 'COMMUNITY_RESCUE_SAT' || id === 'EMERGENCY') {
    return CONFIRMED_SATELLITES.find((s) => s.id === 'SOCCORSO_SAT');
  }
  if (id === 'RADAR') {
    return CONFIRMED_SATELLITES.find((s) => s.id === 'RADAR_SAT');
  }
  return CONFIRMED_SATELLITES.find((s) => s.id === id || s.channel === id);
}
