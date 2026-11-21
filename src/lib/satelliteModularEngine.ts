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
  | 'BUSINESS_ADS_SAT';

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
  noradId: number | null;
  officialDesignation: string;
  isPhysicalSpacecraft: boolean;
  trackingSourceLabel: string;
  category: 'TERRITORIO' | 'METEO' | 'MERCATI' | 'COMUNICAZIONE' | 'COMUNITA';
  icon: string;
  color: string;
  foilColor: number; // Colore lamina termica (oro 0xd4af37, argento 0xe2e8f0, titanio 0x64748b)
  altitudeKm: number | null;
  orbitMultiplier: number;
  speed: number;
  inclination: number; // Inclinazione orbitale nominale in radianti
  startAngle: number;
  h2wRole: string;
  targetComponent: string;
  isActive: boolean;
}

// Configurazione Ingegneristica degli 8 Satelliti (6 veicoli fisici reali NORAD + 2 canali logici H2W)
export const INITIAL_SATELLITES_CATALOG: SatelliteConfig[] = [
  {
    id: 'METEO_SAT',
    name: 'Meteo & Clima Live',
    codeName: 'METEOSAT-12',
    noradId: 54743,
    officialDesignation: 'METEOSAT-12 (MTG-I1)',
    isPhysicalSpacecraft: true,
    trackingSourceLabel: 'CelesTrak GP/OMM (NORAD 54743)',
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
  },
  {
    id: 'KM0_SAT',
    name: 'Produttori a Km 0',
    codeName: 'SENTINEL-2A',
    noradId: 40697,
    officialDesignation: 'SENTINEL-2A (ESA Copernicus)',
    isPhysicalSpacecraft: true,
    trackingSourceLabel: 'CelesTrak GP/OMM (NORAD 40697)',
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
  },
  {
    id: 'STREET_360_SAT',
    name: 'Stradario & Vista 360°',
    codeName: 'WORLDVIEW-3',
    noradId: 40115,
    officialDesignation: 'WORLDVIEW-3 (WV-3)',
    isPhysicalSpacecraft: true,
    trackingSourceLabel: 'CelesTrak GP/OMM (NORAD 40115)',
    category: 'TERRITORIO',
    icon: '🧭',
    color: '#06b6d4',
    foilColor: 0x18181b,
    altitudeKm: 617,
    orbitMultiplier: 1.26,
    speed: 0.0008,
    inclination: 0.75,
    startAngle: 1.57,
    h2wRole: 'Navigazione urbana tridimensionale, passeggiata stradale e incroci',
    targetComponent: 'StreetView360Modal',
    isActive: true,
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'Chat Vocale & Video',
    codeName: 'STARLINK-3109',
    noradId: 49143,
    officialDesignation: 'STARLINK-3109 (SpaceX)',
    isPhysicalSpacecraft: true,
    trackingSourceLabel: 'CelesTrak GP/OMM (NORAD 49143)',
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
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'Marketplace Globale',
    codeName: 'TELSTAR 19V',
    noradId: 43562,
    officialDesignation: 'TELSTAR 19V (Telesat)',
    isPhysicalSpacecraft: true,
    trackingSourceLabel: 'CelesTrak GP/OMM (NORAD 43562)',
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
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'Marketplace Esterni',
    codeName: 'GATEWAY-RELAIS',
    noradId: null,
    officialDesignation: 'Canale logico HAVE2WANT (nessun satellite fisico)',
    isPhysicalSpacecraft: false,
    trackingSourceLabel: 'Nessun tracciamento orbitale fisico previsto',
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
  },
  {
    id: 'COMMUNITY_RESCUE_SAT',
    name: 'Comunità & Soccorso',
    codeName: 'GALILEO-SAR',
    noradId: 43566,
    officialDesignation: 'GSAT0219 (GALILEO 23 · Cospas-Sarsat SAR)',
    isPhysicalSpacecraft: true,
    trackingSourceLabel: 'CelesTrak GP/OMM (NORAD 43566)',
    category: 'COMUNITA',
    icon: '🤝',
    color: '#ef4444',
    foilColor: 0xe2e8f0,
    altitudeKm: 23222,
    orbitMultiplier: 1.52,
    speed: 0.0007,
    inclination: 1.10,
    startAngle: 4.712,
    h2wRole: 'Numeri di emergenza civica mondiali, carpooling solidale e mutuo aiuto',
    targetComponent: 'WorldEmergencyModal',
    isActive: true,
  },
  {
    id: 'BUSINESS_ADS_SAT',
    name: 'Pubblicità Esercenti',
    codeName: 'BEACON-BUSINESS',
    noradId: null,
    officialDesignation: 'Canale logico HAVE2WANT (nessun satellite fisico)',
    isPhysicalSpacecraft: false,
    trackingSourceLabel: 'Nessun tracciamento orbitale fisico previsto',
    category: 'TERRITORIO',
    icon: '🏪',
    color: '#e11d48',
    foilColor: 0xd4af37,
    altitudeKm: null,
    orbitMultiplier: 1.34,
    speed: 0.0009,
    inclination: -0.38,
    startAngle: 5.497,
    h2wRole: 'Locandine e spazi pubblicitari per negozi ed esercenti con Quota X (0.25 π)',
    targetComponent: 'BusinessSponsorModal',
    isActive: true,
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
            sat.id === 'BUSINESS_ADS_SAT';
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
