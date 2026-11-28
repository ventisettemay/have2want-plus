// SATELLITE MODULAR ENGINE – HAVE2WANT PLUS
// Registro centrale e centro di controllo degli 11 satelliti ufficiali.
// Gestisce l'attivazione/disattivazione autonoma (ON/OFF), le orbite, i preset
// e la persistenza locale/cloud, preservando l'integrità di tutti i servizi esistenti.

export type SatelliteId =
  | 'MAP_SAT'
  | 'METEO_SAT'
  | 'KM0_SAT'
  | 'GLOBAL_MARKET_SAT'
  | 'PI_CHAT_SAT'
  | 'SOCCORSO_SAT'
  | 'DEFIANCE_PULSE_SAT'
  | 'ACTIONFLOW_SAT'
  | 'EXTERNAL_MARKET_SAT'
  | 'CREATOR_ADS_SAT'
  | 'PUBLISH_STORE_SAT';

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
  altitudeKm: number | null;
  orbitMultiplier: number;
  speed: number;
  inclination: number; // Inclinazione orbitale in radianti
  startAngle: number;
  h2wRole: string;
  targetComponent: string;
  isActive: boolean;
  noradId?: number; // ID NORAD per satelliti fisici reali (tracciati via CelesTrak), null per logici
  officialDesignation?: string; // Designazione ufficiale NASA/NOAA del satellite
  isPhysicalSpacecraft?: boolean; // true se veicolo spaziale fisico con orbita reale, false se relay logico
}

// Configurazione Ingegneristica degli 11 Satelliti Ufficiali
// Tutti con orbita reale NASA/NOAA tracciata via CelesTrak OMM + SGP4/SDP4
export const INITIAL_SATELLITES_CATALOG: SatelliteConfig[] = [
  {
    id: 'MAP_SAT',
    name: 'MAPPA 3D — Navigazione & Territorio',
    codeName: 'Landsat 9',
    category: 'TERRITORIO',
    icon: '🗺️',
    color: '#06b6d4',
    foilColor: 0x18181b,
    altitudeKm: 705,
    orbitMultiplier: 1.30,
    speed: 0.0008,
    inclination: 0.98,
    startAngle: 3.5,
    h2wRole: 'Navigazione GPS completa, stradario 360°, webcam, meteo percorso e radar prossimità (interno a Mappa 3D)',
    targetComponent: 'MapView3DContainer',
    isActive: true,
    noradId: 49260,
    officialDesignation: 'Landsat 9',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'METEO_SAT',
    name: 'METEO LIVE — Globo Mondiale',
    codeName: 'GOES-18',
    category: 'METEO',
    icon: '🌦️',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 35786,
    orbitMultiplier: 1.66,
    speed: 0.0006,
    inclination: 0.0,
    startAngle: 0.0,
    h2wRole: 'Isola il globo mondiale mostrando solo meteo, nuvole, radar pioggia, vento e mare',
    targetComponent: 'LiveWeatherModal',
    isActive: true,
    noradId: 51850,
    officialDesignation: 'GOES-18',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'KM0_SAT',
    name: 'KM 0 — Filiera Corta',
    codeName: 'SMAP',
    category: 'TERRITORIO',
    icon: '🌾',
    color: '#10b981',
    foilColor: 0xd4af37,
    altitudeKm: 685,
    orbitMultiplier: 1.20,
    speed: 0.0011,
    inclination: 0.98,
    startAngle: 0.0,
    h2wRole: 'Produttori agricoli e ittici entro 100 km',
    targetComponent: 'VetrinaKmZero',
    isActive: true,
    noradId: 40376,
    officialDesignation: 'SMAP',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'PRODOTTI DEL MONDO — Marketplace Interno',
    codeName: 'TDRS-13',
    category: 'MERCATI',
    icon: '🌍',
    color: '#a855f7',
    foilColor: 0xd4af37,
    altitudeKm: 35786,
    orbitMultiplier: 1.60,
    speed: 0.00065,
    inclination: 0.0,
    startAngle: 1.7,
    h2wRole: 'Specialità globali, baratto, richieste Cerco, lavoro P2P e ordini',
    targetComponent: 'GlobalMarketplaceView',
    isActive: true,
    noradId: 42915,
    officialDesignation: 'TDRS-13',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'CHAT & VIDEOCHAT — Comunicazione Diretta',
    codeName: 'TDRS-12',
    category: 'COMUNICAZIONE',
    icon: '💬',
    color: '#22c55e',
    foilColor: 0x18181b,
    altitudeKm: 35786,
    orbitMultiplier: 1.22,
    speed: 0.0010,
    inclination: 0.0,
    startAngle: 1.1,
    h2wRole: 'Chat privata, note vocali, gruppi quartiere e videochiamate P2P',
    targetComponent: 'PiChatUnifiedHub',
    isActive: true,
    noradId: 39504,
    officialDesignation: 'TDRS-12',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'SOCCORSO_SAT',
    name: 'SOCCORSO — Emergenze & Mutuo Aiuto',
    codeName: 'NOAA-20',
    category: 'COMUNITA',
    icon: '🆘',
    color: '#ef4444',
    foilColor: 0xe2e8f0,
    altitudeKm: 824,
    orbitMultiplier: 1.52,
    speed: 0.0007,
    inclination: 0.99,
    startAngle: 4.1,
    h2wRole: 'Numeri utili e di emergenza globali per Paese',
    targetComponent: 'WorldEmergencyModal',
    isActive: true,
    noradId: 43013,
    officialDesignation: 'NOAA-20',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'DEFIANCE_PULSE_SAT',
    name: 'DEFIANCE PULSE — Multimedia AI (Creator, Music, Video)',
    codeName: 'ISS (Zarya)',
    category: 'COMUNICAZIONE',
    icon: '⚡',
    color: '#ec4899',
    foilColor: 0xec4899,
    altitudeKm: 420,
    orbitMultiplier: 1.45,
    speed: 0.00085,
    inclination: 0.72,
    startAngle: 5.3,
    h2wRole: 'Canale video, musica e creazione video AI (senza pubblicità commerciale)',
    targetComponent: 'DefiancePulseHub',
    isActive: true,
    noradId: 25544,
    officialDesignation: 'ISS (Zarya)',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'ACTIONFLOW_SAT',
    name: 'ACTIONFLOW HUB — Portal Applicazioni Esterne',
    codeName: 'TDRS-11',
    category: 'COMUNITA',
    icon: '🎮',
    color: '#8b5cf6',
    foilColor: 0x7c3aed,
    altitudeKm: 35786,
    orbitMultiplier: 1.40,
    speed: 0.0008,
    inclination: 0.0,
    startAngle: 4.7,
    h2wRole: 'Ponte per collegare fino a 3 app esterne',
    targetComponent: 'ActionFlowHubModal',
    isActive: true,
    noradId: 39070,
    officialDesignation: 'TDRS-11',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'MARKETPLACE ESTERNI — Canali Esterni',
    codeName: 'AQUA',
    category: 'MERCATI',
    icon: '🛒',
    color: '#f97316',
    foilColor: 0xd4af37,
    altitudeKm: 705,
    orbitMultiplier: 1.44,
    speed: 0.00075,
    inclination: 0.98,
    startAngle: 2.3,
    h2wRole: 'Market globali filtrati per Paese, partner convenzionati, card prepagate e link di affiliazione',
    targetComponent: 'ExternalListings',
    isActive: true,
    noradId: 27424,
    officialDesignation: 'AQUA',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'CREATOR_ADS_SAT',
    name: 'CREATOR ADS — Pubblicità VIP a Pagamento',
    codeName: 'TERRA',
    category: 'TERRITORIO',
    icon: '📢',
    color: '#ffd700',
    foilColor: 0xd4af37,
    altitudeKm: 705,
    orbitMultiplier: 1.34,
    speed: 0.0009,
    inclination: 0.98,
    startAngle: 2.9,
    h2wRole: 'Area VIP a pagamento per creare pubblicità, volantini e PIN luminosi (anche con AI)',
    targetComponent: 'BusinessSponsorModal',
    isActive: true,
    noradId: 25994,
    officialDesignation: 'TERRA',
    isPhysicalSpacecraft: true,
  },
  {
    id: 'PUBLISH_STORE_SAT',
    name: 'PUBLISH & STORE — Vetrina Pubblica',
    codeName: 'ICESAT-2',
    category: 'TERRITORIO',
    icon: '🏪',
    color: '#8b5cf6',
    foilColor: 0xd4af37,
    altitudeKm: 496,
    orbitMultiplier: 1.25,
    speed: 0.0010,
    inclination: 0.92,
    startAngle: 5.9,
    h2wRole: 'Vetrina pubblica per visionare negozi, professionisti e attività sul globo',
    targetComponent: 'MerchantDetailModal',
    isActive: true,
    noradId: 43613,
    officialDesignation: 'ICESAT-2',
    isPhysicalSpacecraft: true,
  },
];

// ============================================================================
// MAPPA CANONICA SATELLITE → CANALE UI / COMPONENTE TARGET
// Unica fonte di verità per il routing satellitare. Ogni SatelliteId di
// INITIAL_SATELLITES_CATALOG è associato al canale UI e al componente target.
// ============================================================================

export const SATELLITE_TO_CHANNEL: Record<SatelliteId, string> = {
  MAP_SAT: 'MAP',
  METEO_SAT: 'WEATHER',
  KM0_SAT: 'KMZERO',
  GLOBAL_MARKET_SAT: 'SUPERMARKET',
  PI_CHAT_SAT: 'CHAT',
  SOCCORSO_SAT: 'EMERGENCY',
  DEFIANCE_PULSE_SAT: 'DEFIANCE_PULSE',
  ACTIONFLOW_SAT: 'ACTIONFLOW',
  EXTERNAL_MARKET_SAT: 'EXTERNAL',
  CREATOR_ADS_SAT: 'CREATOR_ADS',
  PUBLISH_STORE_SAT: 'PUBLISH_STORE',
};

export const SATELLITE_TO_COMPONENT: Record<SatelliteId, string> = {
  MAP_SAT: 'MapView3DContainer',
  METEO_SAT: 'LiveWeatherModal',
  KM0_SAT: 'VetrinaKmZero',
  GLOBAL_MARKET_SAT: 'GlobalMarketplaceView',
  PI_CHAT_SAT: 'PiChatUnifiedHub',
  SOCCORSO_SAT: 'WorldEmergencyModal',
  DEFIANCE_PULSE_SAT: 'DefiancePulseHub',
  ACTIONFLOW_SAT: 'ActionFlowHubModal',
  EXTERNAL_MARKET_SAT: 'ExternalListings',
  CREATOR_ADS_SAT: 'BusinessSponsorModal',
  PUBLISH_STORE_SAT: 'MerchantDetailModal',
};

// Risolve il canale UI associato a un SatelliteId (wrapper sulla mappa canonica)
export function resolveSatelliteChannel(satId: SatelliteId): string {
  return SATELLITE_TO_CHANNEL[satId];
}

const STORAGE_KEY = 'h2w_satellites_modular_state_v4';

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

  // Applicazione dei Preset Concordati
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
            sat.id === 'MAP_SAT' ||
            sat.id === 'PUBLISH_STORE_SAT' ||
            sat.id === 'CREATOR_ADS_SAT';
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
