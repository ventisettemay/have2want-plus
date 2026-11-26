// SATELLITE MODULAR ENGINE – HAVE2WANT PLUS
// Registro centrale e centro di controllo degli 8 satelliti tridimensionali.
// Gestisce l'attivazione/disattivazione autonoma (ON/OFF), le orbite, i preset
// e la persistenza locale/cloud, preservando l'integrità di tutti i servizi esistenti.

export type SatelliteId =
  | 'METEO_SAT'
  | 'KM0_SAT'
  | 'STREET_360_SAT'
  | 'PI_CHAT_SAT'
  | 'GLOBAL_MARKET_SAT'
  | 'EXTERNAL_MARKET_SAT'
  | 'COMMUNITY_RESCUE_SAT'
  | 'BUSINESS_ADS_SAT'
  | 'WEBCAM'
  | 'METEO_ROUTE'
  | 'MAP_SAT'
  | 'ACTIONFLOW_SAT'
  | 'DEFIANCE_PULSE_SAT'
  | 'SOCCORSO_SAT'
  | 'RADAR_SAT'
  | 'RADAR';

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
  category: 'TERRITORIO' | 'METEO' | 'MERCATI' | 'COMUNICAZIONE' | 'COMUNITA';
  icon: string;
  color: string;
  foilColor: number; // Colore lamina termica (oro 0xd4af37, argento 0xe2e8f0, titanio 0x64748b)
  altitudeKm: number;
  orbitMultiplier: number;
  speed: number;
  inclination: number; // Inclinazione orbitale in radianti
  startAngle: number;
  h2wRole: string;
  targetComponent: string;
  isActive: boolean;
  noradId?: number;
  officialDesignation?: string;
  isPhysicalSpacecraft?: boolean;
}

// Configurazione Ingegneristica dei 10 Satelliti Canonici (6 fisici NORAD + 4 relay logici H2W)
export const INITIAL_SATELLITES_CATALOG: SatelliteConfig[] = [
  {
    id: 'METEO_SAT',
    name: 'Meteo & Clima Live',
    codeName: 'METEOSAT-3G',
    category: 'METEO',
    icon: '🌦️',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 35786,
    orbitMultiplier: 1.66,
    speed: 0.0006,
    inclination: 0.08,
    startAngle: 0.0,
    h2wRole: 'Previsioni climatologiche Open-Meteo per ogni comune e regione',
    targetComponent: 'LiveWeatherModal',
    isActive: true,
    noradId: 54743,
    isPhysicalSpacecraft: true,
  },
  {
    id: 'KM0_SAT',
    name: 'Produttori a Km 0',
    codeName: 'SENTINEL-2 (ESA)',
    category: 'TERRITORIO',
    icon: '🌾',
    color: '#10b981',
    foilColor: 0xd4af37,
    altitudeKm: 786,
    orbitMultiplier: 1.20,
    speed: 0.0011,
    inclination: 1.35,
    startAngle: 0.785,
    h2wRole: 'Botteghe locali, agricoltori e filiera corta a chilometro zero',
    targetComponent: 'VetrinaKmZero',
    isActive: true,
    noradId: 40697,
    isPhysicalSpacecraft: true,
  },
  {
    id: 'STREET_360_SAT',
    name: 'Stradario & Vista 360°',
    codeName: 'WORLDVIEW-3',
    category: 'TERRITORIO',
    icon: '🧭',
    color: '#06b6d4',
    foilColor: 0x18181b,
    altitudeKm: 617,
    orbitMultiplier: 1.26,
    speed: 0.0008,
    inclination: 0.75,
    startAngle: 1.57,
    h2wRole: 'Navigazione urbana tridimensionale, passeggiata stradale e incroci.',
    targetComponent: 'StreetView360Modal',
    isActive: true,
    noradId: 42064,
    isPhysicalSpacecraft: true,
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'Chat Vocale & Video',
    codeName: 'STARLINK-COMM',
    category: 'COMUNICAZIONE',
    icon: '🎙️',
    color: '#22c55e',
    foilColor: 0x18181b,
    altitudeKm: 550,
    orbitMultiplier: 1.22,
    speed: 0.0010,
    inclination: -0.92,
    startAngle: 2.356,
    h2wRole: 'Messaggistica discreta, note vocali da microfono e videochiamata diretta',
    targetComponent: 'VoiceNoteChat',
    isActive: true,
    noradId: 49143,
    isPhysicalSpacecraft: true,
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'Marketplace Globale',
    codeName: 'TELSTAR 19V',
    category: 'MERCATI',
    icon: '🌐',
    color: '#a855f7',
    foilColor: 0xd4af37,
    altitudeKm: 35786,
    orbitMultiplier: 1.60,
    speed: 0.00065,
    inclination: 0.22,
    startAngle: 3.141,
    h2wRole: 'Supermarket mondiale con prezzi in valuta locale e conversione Pi Network reale',
    targetComponent: 'GlobalMarketplaceView',
    isActive: true,
    noradId: 43562,
    isPhysicalSpacecraft: true,
  },
  {
    id: 'COMMUNITY_RESCUE_SAT',
    name: 'Comunità & Soccorso',
    codeName: 'COSPAS-SARSAT',
    category: 'COMUNITA',
    icon: '🤝',
    color: '#ef4444',
    foilColor: 0xe2e8f0,
    altitudeKm: 19000,
    orbitMultiplier: 1.52,
    speed: 0.0007,
    inclination: 1.10,
    startAngle: 4.712,
    h2wRole: 'Numeri di emergenza civica mondiali, carpooling solidale e mutuo aiuto',
    targetComponent: 'WorldEmergencyModal',
    isActive: true,
    noradId: 43566,
    isPhysicalSpacecraft: true,
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'Marketplace Esterni',
    codeName: 'GATEWAY-RELAIS',
    category: 'MERCATI',
    icon: '🛒',
    color: '#f97316',
    foilColor: 0xd4af37,
    altitudeKm: null,
    orbitMultiplier: 1.44,
    speed: 0.00075,
    inclination: -0.62,
    startAngle: 3.927,
    h2wRole: 'Articoli da canali esterni (Amazon, eBay, AliExpress) con guadagno per l\'app',
    targetComponent: 'ExternalListings',
    isActive: true,
    noradId: null,
    isPhysicalSpacecraft: false,
  },
  {
    id: 'BUSINESS_ADS_SAT',
    name: 'Pubblicità Esercenti',
    codeName: 'BEACON-BUSINESS',
    category: 'TERRITORIO',
    icon: '🏪',
    color: '#e11d48',
    foilColor: 0xd4af37,
    altitudeKm: null,
    orbitMultiplier: 1.34,
    speed: 0.0009,
    inclination: -0.38,
    startAngle: 5.497,
    h2wRole: 'Locandine e spazi pubblicitari per negozi ed esercenti con Quota X (0.15)',
    targetComponent: 'BusinessSponsorModal',
    isActive: true,
    noradId: null,
    isPhysicalSpacecraft: false,
  },
  {
    id: 'WEBCAM',
    name: 'Webcam Pubbliche Live',
    codeName: 'CAMSAT-OBS',
    category: 'TERRITORIO',
    icon: '📹',
    color: '#06b6d4',
    foilColor: 0x18181b,
    altitudeKm: null,
    orbitMultiplier: 1.28,
    speed: 0.00085,
    inclination: 0.45,
    startAngle: 6.1,
    h2wRole: 'Webcam pubbliche, turistiche e di traffico in tempo reale.',
    targetComponent: 'LiveWebcamModal',
    isActive: true,
    noradId: null,
    isPhysicalSpacecraft: false,
  },
  {
    id: 'METEO_ROUTE',
    name: 'Meteo Navigazione',
    codeName: 'WX-NAV-SAT',
    category: 'METEO',
    icon: '🧭',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: null,
    orbitMultiplier: 1.70,
    speed: 0.0006,
    inclination: 0.10,
    startAngle: 0.30,
    h2wRole: 'Meteo lungo i percorsi di navigazione (auto/bici/piedi).',
    targetComponent: 'MeteoNavigazioneModal',
    isActive: true,
    noradId: null,
    isPhysicalSpacecraft: false,
  },
];

const STORAGE_KEY = 'h2w_satellites_modular_state_v2';

class SatelliteModularEngine {
  private state: Record<SatelliteId, boolean>;
  private listeners: Set<(state: Record<SatelliteId, boolean>) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): Record<SatelliteId, boolean> {
    const defaultState: Record<SatelliteId, boolean> = {} as any;
    INITIAL_SATELLITES_CATALOG.forEach((sat) => {
      defaultState[sat.id] = sat.isActive;
    });

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          INITIAL_SATELLITES_CATALOG.forEach((sat) => {
            if (typeof parsed[sat.id] === 'boolean') {
              defaultState[sat.id] = parsed[sat.id];
            }
          });
        }
      } catch (err) {
        console.warn('Impossibile caricare stato satelliti da localStorage:', err);
      }
    }
    return defaultState;
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.warn('Impossibile salvare stato satelliti su localStorage:', err);
      }
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state });
      } catch (err) {
        console.error('Errore listener satellite:', err);
      }
    });
  }

  public isSatelliteActive(id: SatelliteId): boolean {
    return Boolean(this.state[id]);
  }

  public getActiveCount(): number {
    return Object.values(this.state).filter(Boolean).length;
  }

  public getTotalCount(): number {
    return INITIAL_SATELLITES_CATALOG.length;
  }

  public getAllSatellites(): (SatelliteConfig & { isActive: boolean })[] {
    return INITIAL_SATELLITES_CATALOG.map((sat) => ({
      ...sat,
      isActive: Boolean(this.state[sat.id]),
    }));
  }

  public getActiveSatellites(): SatelliteConfig[] {
    return INITIAL_SATELLITES_CATALOG.filter((sat) => Boolean(this.state[sat.id]));
  }

  public toggleSatellite(id: SatelliteId): boolean {
    const current = Boolean(this.state[id]);
    this.state[id] = !current;
    this.saveState();
    return this.state[id];
  }

  public setSatelliteActive(id: SatelliteId, active: boolean) {
    if (this.state[id] !== active) {
      this.state[id] = active;
      this.saveState();
    }
  }

  // Applicazione dei Sette Preset Concordati
  public applyPreset(preset: PresetType) {
    const newState: Record<SatelliteId, boolean> = {} as any;

    switch (preset) {
      case 'ACCENDI_TUTTI':
      case 'RIPRISTINA_TUTTI':
        INITIAL_SATELLITES_CATALOG.forEach((sat) => {
          newState[sat.id] = true;
        });
        break;

      case 'SPEGNI_TUTTI':
        INITIAL_SATELLITES_CATALOG.forEach((sat) => {
          newState[sat.id] = false;
        });
        break;

      case 'SOLO_METEO':
        INITIAL_SATELLITES_CATALOG.forEach((sat) => {
          newState[sat.id] = sat.id === 'METEO_SAT';
        });
        break;

      case 'SOLO_CHAT':
        INITIAL_SATELLITES_CATALOG.forEach((sat) => {
          newState[sat.id] = sat.id === 'PI_CHAT_SAT';
        });
        break;

      case 'KM0_METEO':
        INITIAL_SATELLITES_CATALOG.forEach((sat) => {
          newState[sat.id] = sat.id === 'KM0_SAT' || sat.id === 'METEO_SAT';
        });
        break;

      case 'SOLO_MERCATI':
        INITIAL_SATELLITES_CATALOG.forEach((sat) => {
          newState[sat.id] =
            sat.id === 'GLOBAL_MARKET_SAT' ||
            sat.id === 'EXTERNAL_MARKET_SAT';
        });
        break;

      case 'SOLO_TERRITORIO':
        INITIAL_SATELLITES_CATALOG.forEach((sat) => {
          newState[sat.id] =
            sat.id === 'KM0_SAT' ||
            sat.id === 'STREET_360_SAT' ||
            sat.id === 'BUSINESS_ADS_SAT' ||
            sat.id === 'WEBCAM' ||
            sat.id === 'METEO_ROUTE';
        });
        break;

      default:
        return;
    }

    this.state = newState;
    this.saveState();
  }

  public subscribe(listener: (state: Record<SatelliteId, boolean>) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Istanza Singleton del Motore Modulare
export const satelliteEngine = new SatelliteModularEngine();

// Mappatura satellite -> canale territoriale (per integrazione con moduli AI Studio)
export const SATELLITE_TO_CHANNEL: Record<SatelliteId, string> = {
  METEO_SAT: 'meteo',
  KM0_SAT: 'km0',
  STREET_360_SAT: 'street360',
  PI_CHAT_SAT: 'pi-chat',
  GLOBAL_MARKET_SAT: 'global-market',
  EXTERNAL_MARKET_SAT: 'external-market',
  COMMUNITY_RESCUE_SAT: 'community-rescue',
  BUSINESS_ADS_SAT: 'business-ads',
  WEBCAM: 'webcam',
  METEO_ROUTE: 'meteo-route',
  MAP_SAT: 'map',
  ACTIONFLOW_SAT: 'actionflow',
  DEFIANCE_PULSE_SAT: 'defiance-pulse',
  SOCCORSO_SAT: 'SOCCORSO',
  RADAR_SAT: 'RADAR',
  RADAR: 'RADAR',
};

// Mappatura satellite -> componente React target
export const SATELLITE_TO_COMPONENT: Record<SatelliteId, string> = {
  METEO_SAT: 'LiveWeatherModal',
  KM0_SAT: 'VetrinaKmZero',
  STREET_360_SAT: 'StreetView360Modal',
  PI_CHAT_SAT: 'VoiceNoteChat',
  GLOBAL_MARKET_SAT: 'GlobalMarketplaceView',
  EXTERNAL_MARKET_SAT: 'ExternalListings',
  COMMUNITY_RESCUE_SAT: 'WorldEmergencyModal',
  BUSINESS_ADS_SAT: 'BusinessSponsorModal',
  WEBCAM: 'LiveWebcamModal',
  METEO_ROUTE: 'MeteoNavigazioneModal',
  MAP_SAT: 'MapView3DContainer',
  ACTIONFLOW_SAT: 'ActionFlowModal',
  DEFIANCE_PULSE_SAT: 'DefiancePulseHub',
  SOCCORSO_SAT: 'SOCCORSO',
  RADAR_SAT: 'RADAR',
  RADAR: 'RADAR',
};

/**
 * Risolve il canale territoriale associato a un satellite.
 */
export function resolveSatelliteChannel(id: SatelliteId): string {
  return SATELLITE_TO_CHANNEL[id] ?? 'default';
}
