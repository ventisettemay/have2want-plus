// SATELLITE MODULAR ENGINE – HAVE2WANT PLUS
// Registro centrale e centro di controllo dei 10 satelliti definitivi + DEFIANCE PULSE.
// Gestisce l'attivazione/disattivazione autonoma (ON/OFF), le orbite, i preset
// e la persistenza locale/cloud, preservando l'integrità di tutti i servizi esistenti.

export type SatelliteId =
  | 'KM0_SAT'
  | 'METEO_SAT'
  | 'PI_CHAT_SAT'
  | 'GLOBAL_MARKET_SAT'
  | 'EXTERNAL_MARKET_SAT'
  | 'BUSINESS_ADS_SAT'
  | 'MAP_SAT'
  | 'SOCCORSO_SAT'
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
}

// Configurazione Ingegneristica dei 10 Satelliti Definitivi + DEFIANCE PULSE (Distribuzione orbitale a 360° LEO, MEO, GEO)
export const INITIAL_SATELLITES_CATALOG: SatelliteConfig[] = [
  {
    id: 'KM0_SAT',
    name: 'KM 0 — Filiera Corta',
    codeName: 'SENTINEL-2 (ESA)',
    category: 'TERRITORIO',
    icon: '🌾',
    color: '#10b981',
    foilColor: 0xd4af37,
    altitudeKm: 786,
    orbitMultiplier: 1.20,
    speed: 0.0011,
    inclination: 1.35,
    startAngle: 0.0,
    h2wRole: 'Produttori locali, agricoltori e filiera corta a chilometro zero',
    targetComponent: 'VetrinaKmZero',
    isActive: true,
  },
  {
    id: 'METEO_SAT',
    name: 'METEO — Clima & Radar Live',
    codeName: 'METEOSAT-3G',
    category: 'METEO',
    icon: '🌦️',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 35786,
    orbitMultiplier: 1.66,
    speed: 0.0006,
    inclination: 0.08,
    startAngle: 0.5,
    h2wRole: 'Previsioni climatologiche Open-Meteo, radar precipitazioni, allerte per ogni territorio',
    targetComponent: 'LiveWeatherModal',
    isActive: true,
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'CHAT E VIDEO — Comunicazione Diretta',
    codeName: 'STARLINK-COMM',
    category: 'COMUNICAZIONE',
    icon: '🎙️',
    color: '#22c55e',
    foilColor: 0x18181b,
    altitudeKm: 550,
    orbitMultiplier: 1.22,
    speed: 0.0010,
    inclination: -0.92,
    startAngle: 1.1,
    h2wRole: 'Messaggistica discreta, note vocali, videochiamata diretta, gruppi comunità/quartiere',
    targetComponent: 'VoiceNoteChat',
    isActive: true,
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'PRODOTTI DEL MONDO — Marketplace Interno',
    codeName: 'TELSTAR 19V',
    category: 'MERCATI',
    icon: '🌐',
    color: '#a855f7',
    foilColor: 0xd4af37,
    altitudeKm: 35786,
    orbitMultiplier: 1.60,
    speed: 0.00065,
    inclination: 0.22,
    startAngle: 1.7,
    h2wRole: 'Annunci utenti HAVE2WANT, compravendita P2P, pagamenti Pi, Conferma di Acquisto',
    targetComponent: 'GlobalMarketplaceView',
    isActive: true,
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'MARKETPLACE ESTERNI — Canali Esterni',
    codeName: 'GATEWAY-RELAIS',
    category: 'MERCATI',
    icon: '🛒',
    color: '#f97316',
    foilColor: 0xd4af37,
    altitudeKm: 2000,
    orbitMultiplier: 1.44,
    speed: 0.00075,
    inclination: -0.62,
    startAngle: 2.3,
    h2wRole: 'Ricerca prodotti su piattaforme esterne (Amazon, eBay, ecc.), link affiliati, commissioni in criptovaluta',
    targetComponent: 'ExternalListings',
    isActive: true,
  },
  {
    id: 'BUSINESS_ADS_SAT',
    name: 'CREAZIONE PUBBLICITÀ — Vetrine Sponsorizzate',
    codeName: 'BEACON-BUSINESS',
    category: 'TERRITORIO',
    icon: '🏪',
    color: '#e11d48',
    foilColor: 0xd4af37,
    altitudeKm: 1100,
    orbitMultiplier: 1.34,
    speed: 0.0009,
    inclination: -0.38,
    startAngle: 2.9,
    h2wRole: 'Pubblicità commercianti 7gg a pagamento Pi, AI Creator per contenuti, vetrine geolocalizzate',
    targetComponent: 'BusinessSponsorModal',
    isActive: true,
  },
  {
    id: 'MAP_SAT',
    name: 'MAP — Navigazione & Territorio Unificato',
    codeName: 'MAP-COMPOSITE',
    category: 'TERRITORIO',
    icon: '🗺️',
    color: '#06b6d4',
    foilColor: 0x18181b,
    altitudeKm: 800,
    orbitMultiplier: 1.30,
    speed: 0.0008,
    inclination: 0.5,
    startAngle: 3.5,
    h2wRole: 'GPS, strade ed edifici reali (MapLibre), percorsi reali (OSRM), meteo integrato, webcam live, layer commerciali 3-tier',
    targetComponent: 'MapView3DContainer',
    isActive: true,
  },
  {
    id: 'SOCCORSO_SAT',
    name: 'SOCCORSO — Emergenze & Mutuo Aiuto',
    codeName: 'COSPAS-SARSAT',
    category: 'COMUNITA',
    icon: '🆘',
    color: '#ef4444',
    foilColor: 0xe2e8f0,
    altitudeKm: 19000,
    orbitMultiplier: 1.52,
    speed: 0.0007,
    inclination: 1.10,
    startAngle: 4.1,
    h2wRole: 'Numeri emergenza mondiali, carpooling solidale, mutuo aiuto, punti incontro certificati — SEPARATO da Chat/Video',
    targetComponent: 'WorldEmergencyModal',
    isActive: true,
  },
  {
    id: 'ACTIONFLOW_SAT',
    name: 'ACTIONFLOW HUB — Portal Applicazioni Esterne',
    codeName: 'ACTIONFLOW-CORE',
    category: 'COMUNITA',
    icon: '🎮',
    color: '#8b5cf6',
    foilColor: 0x7c3aed,
    altitudeKm: 2000,
    orbitMultiplier: 1.4,
    speed: 0.0008,
    inclination: 0.5,
    startAngle: 4.7,
    h2wRole: 'Centro operativo missioni, attività AI e ricompense — Portal per app esterne dell\'ecosistema',
    targetComponent: 'ActionFlowHubModal',
    isActive: true,
  },
  {
    id: 'DEFIANCE_PULSE_SAT',
    name: 'DEFIANCE PULSE — Multimedia AI (Creator, Music, Video, Promotion)',
    codeName: 'DEFIANCE-CORE',
    category: 'COMUNICAZIONE',
    icon: '⚡',
    color: '#8b5cf6',
    foilColor: 0x7c3aed,
    altitudeKm: 2000,
    orbitMultiplier: 1.45,
    speed: 0.00085,
    inclination: 0.6,
    startAngle: 5.3,
    h2wRole: 'Quattro aree: CREATOR (AI generativa contenuti), MUSIC (basi/loop locali), VIDEO (feed verticale), PROMOTION (ADS interno) — client-side, no API esterne',
    targetComponent: 'DefiancePulseHub',
    isActive: true,
  },
];

// ============================================================================
// MAPPA CANONICA SATELLITE → CANALE UI / COMPONENTE TARGET
// Unica fonte di verità per il routing satellitare. Ogni SatelliteId di
// INITIAL_SATELLITES_CATALOG è associato al canale UI e al componente target.
// ============================================================================

export const SATELLITE_TO_CHANNEL: Record<SatelliteId, string> = {
  KM0_SAT: 'KMZERO',
  METEO_SAT: 'WEATHER',
  PI_CHAT_SAT: 'CHAT',
  GLOBAL_MARKET_SAT: 'SUPERMARKET',
  EXTERNAL_MARKET_SAT: 'EXTERNAL',
  BUSINESS_ADS_SAT: 'BUSINESS_ADS',
  MAP_SAT: 'MAP',
  COMMUNITY_RESCUE_SAT: 'EMERGENCY',
  ACTIONFLOW_SAT: 'ACTIONFLOW',
  DEFIANCE_PULSE_SAT: 'DEFIANCE_PULSE',
};

export const SATELLITE_TO_COMPONENT: Record<SatelliteId, string> = {
  KM0_SAT: 'VetrinaKmZero',
  METEO_SAT: 'LiveWeatherModal',
  PI_CHAT_SAT: 'VoiceNoteChat',
  GLOBAL_MARKET_SAT: 'GlobalMarketplaceView',
  EXTERNAL_MARKET_SAT: 'ExternalListings',
  BUSINESS_ADS_SAT: 'BusinessSponsorModal',
  MAP_SAT: 'MapView3DContainer',
  SOCCORSO_SAT: 'WorldEmergencyModal',
  ACTIONFLOW_SAT: 'ActionFlowHubModal',
  DEFIANCE_PULSE_SAT: 'DefiancePulseHub',
};

// Risolve il canale UI associato a un SatelliteId (wrapper sulla mappa canonica)
export function resolveSatelliteChannel(satId: SatelliteId): string {
  return SATELLITE_TO_CHANNEL[satId];
}

const STORAGE_KEY = 'h2w_satellites_modular_state_v3';

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