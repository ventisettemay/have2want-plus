// MOTORE INGEGNERISTICO MODULARE SATELLITI – HAVE2WANT PLUS
// Flotta Canonica: 10 Satelliti (6 veicoli fisici reali NORAD a licenza libera + 4 canali logici HAVE2WANT)
// Unica fonte di verità per catalogo 3D, interruttori ON/OFF, preset, canali UI e componenti target.

export type SatelliteId =
  | 'KM0_SAT'
  | 'MAP_SAT'
  | 'EXTERNAL_MARKET_SAT'
  | 'METEO_SAT'
  | 'PI_CHAT_SAT'
  | 'BUSINESS_ADS_SAT'
  | 'GLOBAL_MARKET_SAT'
  | 'COMMUNITY_RESCUE_SAT'
  | 'ACTIONFLOW_SAT'
  | 'DEFIANCE_PULSE_SAT';

export type PresetType =
  | 'ACCENDI_TUTTI'
  | 'SPEGNI_TUTTI'
  | 'SOLO_METEO'
  | 'SOLO_CHAT'
  | 'KM0_METEO'
  | 'SOLO_MERCATI'
  | 'SOLO_TERRITORIO'
  | 'RIPRISTINA_TUTTI';

export interface SatelliteConfig {
  id: SatelliteId;
  name: string;
  codeName: string;
  officialDesignation: string;
  icon: string;
  orbitMultiplier: number;
  speed: number;
  inclination: number;
  startAngle: number;
  color: string;
  solarPanelColor: string;
  h2wRole: string;
  targetComponent: string;
  isPhysicalSpacecraft: boolean;
  noradId: number | null;
  altitudeKm?: number | null;
  category: 'TERRITORIO' | 'METEO' | 'MERCATI' | 'COMUNICAZIONE' | 'COMUNITA';
}

export const INITIAL_SATELLITES_CATALOG: SatelliteConfig[] = [
  {
    id: 'KM0_SAT',
    name: 'KM 0',
    codeName: 'SENTINEL-2A',
    officialDesignation: 'ESA Copernicus Sentinel-2A (Open License)',
    icon: '🌾',
    orbitMultiplier: 1.54,
    speed: 0.00055,
    inclination: 0.56,
    startAngle: 0.2,
    color: '#00ff66',
    solarPanelColor: '#047857',
    h2wRole: 'Produttori agricoli locali, artigiani e botteghe Km 0 entro 100 km (distinto da Lavoro P2P).',
    targetComponent: 'VetrinaKmZero',
    isPhysicalSpacecraft: true,
    noradId: 40697,
    category: 'TERRITORIO',
  },
  {
    id: 'MAP_SAT',
    name: 'MAPPA 3D',
    codeName: 'SENTINEL-2B',
    officialDesignation: 'ESA Copernicus Sentinel-2B (Open License)',
    icon: '🗺️',
    orbitMultiplier: 1.48,
    speed: 0.00058,
    inclination: -0.46,
    startAngle: 1.15,
    color: '#ffffff',
    solarPanelColor: '#0369a1',
    h2wRole: 'Mappa mondiale 3D, navigazione GPS/OSRM reale, Stradario 360°, Webcam Live e Meteo percorso.',
    targetComponent: 'MapView3DContainer',
    isPhysicalSpacecraft: true,
    noradId: 42063,
    category: 'TERRITORIO',
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'MARKETPLACE ESTERNI',
    codeName: 'H2W-EXT-CRYPTO',
    officialDesignation: 'Canale Logico Marketplace Esterni (Solo Crypto)',
    icon: '🛒',
    orbitMultiplier: 1.72,
    speed: 0.00038,
    inclination: 0.32,
    startAngle: 1.95,
    color: '#38bdf8',
    solarPanelColor: '#1e3a8a',
    h2wRole: 'Cataloghi Amazon, eBay e negozi esterni separati dal mercato interno; pagamenti solo in criptovalute.',
    targetComponent: 'ExternalListings',
    isPhysicalSpacecraft: false,
    noradId: null,
    altitudeKm: null,
    category: 'MERCATI',
  },
  {
    id: 'METEO_SAT',
    name: 'METEO LIVE',
    codeName: 'MTG-I1',
    officialDesignation: 'Meteosat-12 Third Generation (EUMETSAT Open)',
    icon: '🌩️',
    orbitMultiplier: 1.84,
    speed: 0.00045,
    inclination: 0.14,
    startAngle: 2.55,
    color: '#ef4444',
    solarPanelColor: '#0284c7',
    h2wRole: 'Previsioni reali Open-Meteo, onde marine, venti globali, precipitazioni 3D e radar RainViewer.',
    targetComponent: 'LiveWeatherModal',
    isPhysicalSpacecraft: true,
    noradId: 54743,
    category: 'METEO',
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'CHAT E VIDEO',
    codeName: 'STARLINK-3109',
    officialDesignation: 'Open LEO Telemetry Mesh (NORAD 49143)',
    icon: '💬',
    orbitMultiplier: 1.36,
    speed: 0.00068,
    inclination: 0.34,
    startAngle: 0.4,
    color: '#10b981',
    solarPanelColor: '#0f766e',
    h2wRole: 'Chat privata, note vocali, Videochat separata e gruppi di quartiere geolocalizzati.',
    targetComponent: 'VoiceNoteChat',
    isPhysicalSpacecraft: true,
    noradId: 49143,
    category: 'COMUNICAZIONE',
  },
  {
    id: 'BUSINESS_ADS_SAT',
    name: 'CREAZIONE PUBBLICITÀ',
    codeName: 'H2W-ADS-RELAY',
    officialDesignation: 'Canale Logico Inserzioni & Volantini Multicanale',
    icon: '📢',
    orbitMultiplier: 1.66,
    speed: 0.00041,
    inclination: -0.28,
    startAngle: 3.45,
    color: '#fbbf24',
    solarPanelColor: '#b45309',
    h2wRole: 'Creazione, gestione e pubblicazione di volantini e spilli pubblicitari 3D (Pi / USDT / Crediti).',
    targetComponent: 'BusinessSponsorModal',
    isPhysicalSpacecraft: false,
    noradId: null,
    altitudeKm: null,
    category: 'COMUNICAZIONE',
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'PRODOTTI DEL MONDO',
    codeName: 'TELSTAR-19V',
    officialDesignation: 'Telstar 19V Global Marketplace Relay',
    icon: '🌍',
    orbitMultiplier: 1.60,
    speed: 0.0005,
    inclination: -0.52,
    startAngle: 4.5,
    color: '#06b6d4',
    solarPanelColor: '#1d4ed8',
    h2wRole: 'Marketplace internazionale, Baratto / Cerco / Acquisto e Bacheca Lavoro P2P integrata.',
    targetComponent: 'GlobalMarketplaceView',
    isPhysicalSpacecraft: true,
    noradId: 43562,
    category: 'MERCATI',
  },
  {
    id: 'COMMUNITY_RESCUE_SAT',
    name: 'SOCCORSO',
    codeName: 'GALILEO-23',
    officialDesignation: 'Galileo GSAT0219 Search & Rescue (ESA Open)',
    icon: '🚨',
    orbitMultiplier: 1.90,
    speed: 0.00044,
    inclination: 0.72,
    startAngle: 5.05,
    color: '#f97316',
    solarPanelColor: '#9a3412',
    h2wRole: 'Soccorso e numeri di emergenza mondiali dedicati (separato dal Carpool e dalle chat).',
    targetComponent: 'WorldEmergencyModal',
    isPhysicalSpacecraft: true,
    noradId: 43566,
    category: 'COMUNITA',
  },
  {
    id: 'ACTIONFLOW_SAT',
    name: 'ACTIONFLOW HUB',
    codeName: 'H2W-ACTIONFLOW',
    officialDesignation: 'Canale Logico Hub Applicazioni Esterne ActionFlow',
    icon: '⚡',
    orbitMultiplier: 1.42,
    speed: 0.00062,
    inclination: -0.64,
    startAngle: 5.55,
    color: '#22c55e',
    solarPanelColor: '#065f46',
    h2wRole: 'Collegamento alle applicazioni esterne ActionFlow con 3 slot configurabili pronti all’uso.',
    targetComponent: 'ActionFlowHubModal',
    isPhysicalSpacecraft: false,
    noradId: null,
    altitudeKm: null,
    category: 'COMUNICAZIONE',
  },
  {
    id: 'DEFIANCE_PULSE_SAT',
    name: 'DEFIANCE PULSE',
    codeName: 'H2W-DEFIANCE',
    officialDesignation: 'Canale Logico Creator, Musica, Video & Promozione',
    icon: '🎙️',
    orbitMultiplier: 1.78,
    speed: 0.00048,
    inclination: 0.48,
    startAngle: 5.95,
    color: '#c084fc',
    solarPanelColor: '#6b21a8',
    h2wRole: 'Piattaforma Defiance Pulse con sezioni Creator, Musica, Video e Promozione interna.',
    targetComponent: 'DefiancePulseHub',
    isPhysicalSpacecraft: false,
    noradId: null,
    altitudeKm: null,
    category: 'COMUNICAZIONE',
  },
];

// Mappa canonica Satellite -> Canale UI e Componente target
export const SATELLITE_TO_CHANNEL: Record<SatelliteId, string> = {
  KM0_SAT: 'KMZERO',
  MAP_SAT: 'MAP',
  EXTERNAL_MARKET_SAT: 'EXTERNAL',
  METEO_SAT: 'WEATHER',
  PI_CHAT_SAT: 'CHAT',
  BUSINESS_ADS_SAT: 'BUSINESS_ADS',
  GLOBAL_MARKET_SAT: 'SUPERMARKET',
  COMMUNITY_RESCUE_SAT: 'EMERGENCY',
  ACTIONFLOW_SAT: 'ACTIONFLOW',
  DEFIANCE_PULSE_SAT: 'DEFIANCE_PULSE',
};

export const SATELLITE_TO_COMPONENT: Record<SatelliteId, string> = {
  KM0_SAT: 'VetrinaKmZero',
  MAP_SAT: 'MapView3DContainer',
  EXTERNAL_MARKET_SAT: 'ExternalListings',
  METEO_SAT: 'LiveWeatherModal',
  PI_CHAT_SAT: 'VoiceNoteChat',
  BUSINESS_ADS_SAT: 'BusinessSponsorModal',
  GLOBAL_MARKET_SAT: 'GlobalMarketplaceView',
  COMMUNITY_RESCUE_SAT: 'WorldEmergencyModal',
  ACTIONFLOW_SAT: 'ActionFlowHubModal',
  DEFIANCE_PULSE_SAT: 'DefiancePulseHub',
};

const LEGACY_CHANNEL_ALIASES: Record<string, string> = {
  STRADARIO: 'MAP',
  STREET_360: 'MAP',
  STREET_360_SAT: 'MAP',
  WEBCAM: 'MAP',
  METEO_ROUTE: 'MAP',
  MONDO: 'SUPERMARKET',
  P2P: 'SUPERMARKET',
  LAVORO: 'SUPERMARKET',
  COMUNITA: 'EMERGENCY',
  SOCCORSO: 'EMERGENCY',
  SOCCORSO_SAT: 'EMERGENCY',
  RADAR_SAT: 'RADAR',
  RADAR: 'RADAR',
};

export function resolveSatelliteChannel(satIdOrChannel: SatelliteId | string): string {
  const fromSat = (SATELLITE_TO_CHANNEL as Record<string, string>)[satIdOrChannel];
  if (fromSat) return fromSat;
  return LEGACY_CHANNEL_ALIASES[satIdOrChannel] || satIdOrChannel;
}

const STORAGE_KEY_STATES = 'have2want_satellite_states_v3';

function createDefaultStates(active = true): Record<SatelliteId, boolean> {
  const map = {} as Record<SatelliteId, boolean>;
  for (const sat of INITIAL_SATELLITES_CATALOG) {
    map[sat.id] = active;
  }
  return map;
}

function loadInitialStates(): Record<SatelliteId, boolean> {
  const defaults = createDefaultStates(true);
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return defaults;
    }
    const raw = localStorage.getItem(STORAGE_KEY_STATES);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    for (const sat of INITIAL_SATELLITES_CATALOG) {
      if (typeof parsed[sat.id] === 'boolean') {
        defaults[sat.id] = parsed[sat.id];
      }
    }
    return defaults;
  } catch {
    return defaults;
  }
}

class SatelliteModularEngine {
  private states: Record<SatelliteId, boolean>;
  private listeners = new Set<(states: Record<SatelliteId, boolean>) => void>();

  constructor() {
    this.states = loadInitialStates();
  }

  private persistAndNotify() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_STATES, JSON.stringify(this.states));
      }
    } catch {
      // ignore storage errors
    }
    const snapshot = { ...this.states };
    this.listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.warn('Satellite listener error:', err);
      }
    });
  }

  public isSatelliteActive(id: SatelliteId): boolean {
    return Boolean(this.states[id]);
  }

  public getStates(): Record<SatelliteId, boolean> {
    return { ...this.states };
  }

  public getActiveCount(): number {
    return INITIAL_SATELLITES_CATALOG.filter((s) => Boolean(this.states[s.id])).length;
  }

  public setSatelliteActive(id: SatelliteId, active: boolean): boolean {
    this.states = {
      ...this.states,
      [id]: active,
    };
    this.persistAndNotify();
    return active;
  }

  public toggleSatellite(id: SatelliteId): boolean {
    const next = !this.states[id];
    return this.setSatelliteActive(id, next);
  }

  public applyPreset(preset: PresetType): Record<SatelliteId, boolean> {
    let next = createDefaultStates(false);
    switch (preset) {
      case 'ACCENDI_TUTTI':
      case 'RIPRISTINA_TUTTI':
        next = createDefaultStates(true);
        break;
      case 'SPEGNI_TUTTI':
        next = createDefaultStates(false);
        break;
      case 'SOLO_METEO':
        next.METEO_SAT = true;
        break;
      case 'SOLO_CHAT':
        next.PI_CHAT_SAT = true;
        break;
      case 'KM0_METEO':
        next.KM0_SAT = true;
        next.METEO_SAT = true;
        break;
      case 'SOLO_MERCATI':
        next.GLOBAL_MARKET_SAT = true;
        next.EXTERNAL_MARKET_SAT = true;
        break;
      case 'SOLO_TERRITORIO':
        next.KM0_SAT = true;
        next.MAP_SAT = true;
        next.BUSINESS_ADS_SAT = true;
        break;
    }
    this.states = next;
    this.persistAndNotify();
    return { ...this.states };
  }

  public subscribe(cb: (states: Record<SatelliteId, boolean>) => void): () => void {
    this.listeners.add(cb);
    cb({ ...this.states });
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const satelliteEngine = new SatelliteModularEngine();
