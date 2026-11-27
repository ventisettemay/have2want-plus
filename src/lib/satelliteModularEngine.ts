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
  | 'RADAR'
  // Satelliti reali prioritari (catalogo parallelo, non conta nel vincolo dei 10 canali H2W)
  | 'ISS'
  | 'HUBBLE'
  | 'JWST'
  | 'LANDSAT_8'
  | 'LANDSAT_9'
  | 'SENTINEL_1A'
  | 'SENTINEL_2A'
  | 'SENTINEL_2B'
  | 'SENTINEL_3A'
  | 'TERRA'
  | 'AQUA'
  | 'SUOMI_NPP'
  | 'NOAA_20'
  | 'GPS_IIF'
  | 'GALILEO'
  | 'METEOSAT_GEO'
  | 'STARLINK';

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
  ISS: 'iss',
  HUBBLE: 'hubble',
  JWST: 'jwst',
  LANDSAT_8: 'landsat8',
  LANDSAT_9: 'landsat9',
  SENTINEL_1A: 'sentinel1a',
  SENTINEL_2A: 'sentinel2a',
  SENTINEL_2B: 'sentinel2b',
  SENTINEL_3A: 'sentinel3a',
  TERRA: 'terra',
  AQUA: 'aqua',
  SUOMI_NPP: 'suomi_npp',
  NOAA_20: 'noaa_20',
  GPS_IIF: 'gps_iif',
  GALILEO: 'galileo',
  METEOSAT_GEO: 'meteosat_geo',
  STARLINK: 'starlink',
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
  ISS: 'SatelliteDetailModal',
  HUBBLE: 'SatelliteDetailModal',
  JWST: 'SatelliteDetailModal',
  LANDSAT_8: 'SatelliteDetailModal',
  LANDSAT_9: 'SatelliteDetailModal',
  SENTINEL_1A: 'SatelliteDetailModal',
  SENTINEL_2A: 'SatelliteDetailModal',
  SENTINEL_2B: 'SatelliteDetailModal',
  SENTINEL_3A: 'SatelliteDetailModal',
  TERRA: 'SatelliteDetailModal',
  AQUA: 'SatelliteDetailModal',
  SUOMI_NPP: 'SatelliteDetailModal',
  NOAA_20: 'SatelliteDetailModal',
  GPS_IIF: 'SatelliteDetailModal',
  GALILEO: 'SatelliteDetailModal',
  METEOSAT_GEO: 'SatelliteDetailModal',
  STARLINK: 'SatelliteDetailModal',
};

/**
 * Risolve il canale territoriale associato a un satellite.
 */
export function resolveSatelliteChannel(id: SatelliteId): string {
  return SATELLITE_TO_CHANNEL[id] ?? 'default';
}

/* ============================================================================
   SATELLITI REALI PRIORITARI – catalogo parallelo (NON conteggiato nei 10 canali H2W)
   Dati fisici reali: massa, dimensioni, quota orbitale, inclinazione, categoria.
   Fonte: schede tecniche pubbliche / CelesTrak / NORAD.
   ============================================================================ */

export interface RealSatelliteConfig extends SatelliteConfig {
  massaKg: number;
  lunghezzaM: number;
  larghezzaM: number;
  altezzaM: number;
  pannelliSolariM?: { lunghezza: number; larghezza: number };
  antennaPrincipaleM?: number;
  lancioAnno: number;
  operatore: string;
  paese: string;
  missione: string;
  designazioneInternazionale?: string;
  fonteModello?: string; // URL o fonte del modello 3D (NASA, Space Radar, ecc.)
  licenzaModello?: string;
  notaModello?: string; // 'originale NASA' | 'ricostruzione da foto/documentazione' | 'assente'
}

/** Colori orbita per categoria (richiesti nella specifica) */
export const SATELLITE_ORBIT_COLORS: Record<'LEO' | 'MEO' | 'GEO' | 'HEO' | 'LOGICAL', string> = {
  LEO: '#38bdf8',      // azzurro
  MEO: '#10b981',      // verde
  GEO: '#f97316',      // arancione
  HEO: '#a855f7',      // viola
  LOGICAL: '#94a3b8',  // grigio (canali logici, nessuna orbita fisica)
};

/**
 * Raggio medio terrestre di riferimento (km) – coerente con il globo 3D.
 */
export const EARTH_RADIUS_KM = 6371;

/**
 * Scala visiva iniziale applicata ai modelli satellitari per renderli riconoscibili
 * da lontano (modifica solo la rappresentazione grafica, non le coordinate orbitali).
 */
export const VISUAL_SCALE_INITIAL = 3;
export const VISUAL_SCALE_MAX = 5;

/**
 * Catalogo satelliti reali prioritari con dati fisici e orbitali documentati.
 * Mantiene proporzioni e geometria originale; non inventa satelliti.
 */
export const REAL_PRIORITY_SATELLITES_CATALOG: RealSatelliteConfig[] = [
  {
    id: 'ISS',
    name: 'International Space Station',
    codeName: 'ISS (Zarya)',
    category: 'TERRITORIO',
    icon: '🛰️',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 420,
    orbitMultiplier: 1.25,
    speed: 0.0015,
    inclination: 0.92, // 51.6°
    startAngle: 0.0,
    h2wRole: 'Stazione spaziale abitata in orbita bassa terrestre',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 25544,
    isPhysicalSpacecraft: true,
    massaKg: 420000,
    lunghezzaM: 73,
    larghezzaM: 109,
    altezzaM: 20,
    pannelliSolariM: { lunghezza: 73, larghezza: 11 },
    antennaPrincipaleM: 2,
    lancioAnno: 1998,
    operatore: 'NASA / Roscosmos / ESA / JAXA / CSA',
    paese: 'Internazionale',
    missione: 'Laboratorio di ricerca in microgravità',
    designazioneInternazionale: '1998-067A',
    fonteModello: 'NASA 3D Resources',
    licenzaModello: 'NASA Media Usage Guidelines',
    notaModello: 'modello NASA originale',
  },
  {
    id: 'HUBBLE',
    name: 'Hubble Space Telescope',
    codeName: 'HST',
    category: 'TERRITORIO',
    icon: '🔭',
    color: '#38bdf8',
    foilColor: 0x18181b,
    altitudeKm: 540,
    orbitMultiplier: 1.28,
    speed: 0.0014,
    inclination: 0.45, // 28.5°
    startAngle: 1.0,
    h2wRole: 'Telescopio spaziale in orbita bassa terrestre',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 20580,
    isPhysicalSpacecraft: true,
    massaKg: 11110,
    lunghezzaM: 13,
    larghezzaM: 4,
    altezzaM: 4,
    pannelliSolariM: { lunghezza: 11, larghezza: 2.5 },
    antennaPrincipaleM: 1,
    lancioAnno: 1990,
    operatore: 'NASA / ESA',
    paese: 'USA',
    missione: 'Astronomia ottica e ultravioletta',
    designazioneInternazionale: '1990-037B',
    fonteModello: 'NASA 3D Resources',
    licenzaModello: 'NASA Media Usage Guidelines',
    notaModello: 'modello NASA originale',
  },
  {
    id: 'JWST',
    name: 'James Webb Space Telescope',
    codeName: 'JWST',
    category: 'TERRITORIO',
    icon: '🕸️',
    color: '#38bdf8',
    foilColor: 0x18181b,
    altitudeKm: 1500000, // punto di Lagrange L2 (non orbita terrestre chiusa)
    orbitMultiplier: 2.0,
    speed: 0.0002,
    inclination: 0.0,
    startAngle: 3.14,
    h2wRole: 'Telescopio spaziale infrarosso al punto di Lagrange L2',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 48378,
    isPhysicalSpacecraft: true,
    massaKg: 6200,
    lunghezzaM: 20,
    larghezzaM: 14,
    altezzaM: 8,
    pannelliSolariM: { lunghezza: 6, larghezza: 4 },
    antennaPrincipaleM: 6.5,
    lancioAnno: 2021,
    operatore: 'NASA / ESA / CSA',
    paese: 'USA',
    missione: 'Astronomia infrarossa',
    designazioneInternazionale: '2021-107A',
    fonteModello: 'NASA 3D Resources',
    licenzaModello: 'NASA Media Usage Guidelines',
    notaModello: 'modello NASA originale',
  },
  {
    id: 'LANDSAT_8',
    name: 'Landsat 8',
    codeName: 'LDCM',
    category: 'TERRITORIO',
    icon: '📡',
    color: '#38bdf8',
    foilColor: 0xd4af37,
    altitudeKm: 705,
    orbitMultiplier: 1.30,
    speed: 0.0012,
    inclination: 1.72, // 98.2° SSO
    startAngle: 2.0,
    h2wRole: 'Osservazione terrestre e gestione risorse',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 39084,
    isPhysicalSpacecraft: true,
    massaKg: 2623,
    lunghezzaM: 5,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 9, larghezza: 2 },
    antennaPrincipaleM: 1,
    lancioAnno: 2013,
    operatore: 'NASA / USGS',
    paese: 'USA',
    missione: 'Telerilevamento terrestre',
    designazioneInternazionale: '2013-008A',
    fonteModello: 'ricostruzione da documentazione NASA/USGS',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
  {
    id: 'LANDSAT_9',
    name: 'Landsat 9',
    codeName: 'L9',
    category: 'TERRITORIO',
    icon: '📡',
    color: '#38bdf8',
    foilColor: 0xd4af37,
    altitudeKm: 705,
    orbitMultiplier: 1.30,
    speed: 0.0012,
    inclination: 1.72,
    startAngle: 2.5,
    h2wRole: 'Osservazione terrestre e gestione risorse',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 49124,
    isPhysicalSpacecraft: true,
    massaKg: 2682,
    lunghezzaM: 5,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 9, larghezza: 2 },
    antennaPrincipaleM: 1,
    lancioAnno: 2021,
    operatore: 'NASA / USGS',
    paese: 'USA',
    missione: 'Telerilevamento terrestre',
    designazioneInternazionale: '2021-081A',
    fonteModello: 'ricostruzione da documentazione NASA/USGS',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
  {
    id: 'SENTINEL_1A',
    name: 'Sentinel-1A',
    codeName: 'S1A',
    category: 'TERRITORIO',
    icon: '🛰️',
    color: '#38bdf8',
    foilColor: 0xd4af37,
    altitudeKm: 693,
    orbitMultiplier: 1.30,
    speed: 0.0012,
    inclination: 1.72, // 98.18° SSO
    startAngle: 3.0,
    h2wRole: 'Radar ad apertura sintetica (SAR) Copernicus ESA',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 39244,
    isPhysicalSpacecraft: true,
    massaKg: 2300,
    lunghezzaM: 3,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 11, larghezza: 1 },
    antennaPrincipaleM: 5,
    lancioAnno: 2014,
    operatore: 'ESA Copernicus',
    paese: 'Europa',
    missione: 'Monitoraggio SAR terrestre e marittimo',
    designazioneInternazionale: '2014-009A',
    fonteModello: 'Space Radar Models (CC BY 4.0)',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione da dimensioni pubblicate',
  },
  {
    id: 'SENTINEL_2A',
    name: 'Sentinel-2A',
    codeName: 'S2A',
    category: 'TERRITORIO',
    icon: '🌾',
    color: '#10b981',
    foilColor: 0xd4af37,
    altitudeKm: 786,
    orbitMultiplier: 1.32,
    speed: 0.0011,
    inclination: 1.72, // 98.5° SSO
    startAngle: 0.785,
    h2wRole: 'Imaging ottico multispettrale Copernicus ESA',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 40697,
    isPhysicalSpacecraft: true,
    massaKg: 1140,
    lunghezzaM: 3,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 12, larghezza: 1 },
    antennaPrincipaleM: 1,
    lancioAnno: 2015,
    operatore: 'ESA Copernicus',
    paese: 'Europa',
    missione: 'Monitoraggio vegetazione e superficie terrestre',
    designazioneInternazionale: '2015-028A',
    fonteModello: 'Space Radar Models (CC BY 4.0)',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione da dimensioni pubblicate',
  },
  {
    id: 'SENTINEL_2B',
    name: 'Sentinel-2B',
    codeName: 'S2B',
    category: 'TERRITORIO',
    icon: '🌾',
    color: '#10b981',
    foilColor: 0xd4af37,
    altitudeKm: 786,
    orbitMultiplier: 1.32,
    speed: 0.0011,
    inclination: 1.72,
    startAngle: 1.2,
    h2wRole: 'Imaging ottico multispettrale Copernicus ESA',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 42063,
    isPhysicalSpacecraft: true,
    massaKg: 1130,
    lunghezzaM: 3,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 12, larghezza: 1 },
    antennaPrincipaleM: 1,
    lancioAnno: 2017,
    operatore: 'ESA Copernicus',
    paese: 'Europa',
    missione: 'Monitoraggio vegetazione e superficie terrestre',
    designazioneInternazionale: '2017-013A',
    fonteModello: 'Space Radar Models (CC BY 4.0)',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione da dimensioni pubblicate',
  },
  {
    id: 'SENTINEL_3A',
    name: 'Sentinel-3A',
    codeName: 'S3A',
    category: 'METEO',
    icon: '🌊',
    color: '#38bdf8',
    foilColor: 0xd4af37,
    altitudeKm: 814,
    orbitMultiplier: 1.33,
    speed: 0.0011,
    inclination: 1.73, // 98.65° SSO
    startAngle: 1.7,
    h2wRole: 'Oceanografia e colore dell’oceano Copernicus ESA',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 39194,
    isPhysicalSpacecraft: true,
    massaKg: 1250,
    lunghezzaM: 3,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 10, larghezza: 1 },
    antennaPrincipaleM: 1,
    lancioAnno: 2016,
    operatore: 'ESA Copernicus / EUMETSAT',
    paese: 'Europa',
    missione: 'Misura superficie oceanica e atmosferica',
    designazioneInternazionale: '2016-005A',
    fonteModello: 'Space Radar Models (CC BY 4.0)',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione da dimensioni pubblicate',
  },
  {
    id: 'TERRA',
    name: 'Terra',
    codeName: 'EOS AM-1',
    category: 'METEO',
    icon: '🌍',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 705,
    orbitMultiplier: 1.30,
    speed: 0.0012,
    inclination: 1.72,
    startAngle: 2.2,
    h2wRole: 'Osservazione del sistema terrestre NASA EOS',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 24697,
    isPhysicalSpacecraft: true,
    massaKg: 4870,
    lunghezzaM: 7,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 10, larghezza: 2 },
    antennaPrincipaleM: 1,
    lancioAnno: 1999,
    operatore: 'NASA',
    paese: 'USA',
    missione: 'Monitoraggio clima e superficie terrestre',
    designazioneInternazionale: '1999-068A',
    fonteModello: 'NASA 3D Resources',
    licenzaModello: 'NASA Media Usage Guidelines',
    notaModello: 'modello NASA originale',
  },
  {
    id: 'AQUA',
    name: 'Aqua',
    codeName: 'EOS PM-1',
    category: 'METEO',
    icon: '💧',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 705,
    orbitMultiplier: 1.30,
    speed: 0.0012,
    inclination: 1.72,
    startAngle: 2.7,
    h2wRole: 'Ciclo dell’acqua e misure atmosferiche NASA EOS',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 27424,
    isPhysicalSpacecraft: true,
    massaKg: 2850,
    lunghezzaM: 5,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 8, larghezza: 2 },
    antennaPrincipaleM: 1,
    lancioAnno: 2002,
    operatore: 'NASA',
    paese: 'USA',
    missione: 'Misure acqua, vapore, energia e clima',
    designazioneInternazionale: '2002-022A',
    fonteModello: 'NASA 3D Resources',
    licenzaModello: 'NASA Media Usage Guidelines',
    notaModello: 'modello NASA originale',
  },
  {
    id: 'SUOMI_NPP',
    name: 'Suomi NPP',
    codeName: 'SNPP',
    category: 'METEO',
    icon: '☁️',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 824,
    orbitMultiplier: 1.34,
    speed: 0.0011,
    inclination: 1.73,
    startAngle: 3.2,
    h2wRole: 'Previsioni meteorologiche e clima NOAA/NASA',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 37849,
    isPhysicalSpacecraft: true,
    massaKg: 2100,
    lunghezzaM: 4,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 5, larghezza: 2 },
    antennaPrincipaleM: 1,
    lancioAnno: 2011,
    operatore: 'NOAA / NASA',
    paese: 'USA',
    missione: 'Meteo operativo e monitoraggio clima',
    designazioneInternazionale: '2011-031A',
    fonteModello: 'ricostruzione da documentazione NOAA/NASA',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
  {
    id: 'NOAA_20',
    name: 'NOAA-20 (JPSS-1)',
    codeName: 'JPSS-1',
    category: 'METEO',
    icon: '🌡️',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    altitudeKm: 824,
    orbitMultiplier: 1.34,
    speed: 0.0011,
    inclination: 1.73,
    startAngle: 3.7,
    h2wRole: 'Meteo operativo polare NOAA',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 43013,
    isPhysicalSpacecraft: true,
    massaKg: 2300,
    lunghezzaM: 4,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 5, larghezza: 2 },
    antennaPrincipaleM: 1,
    lancioAnno: 2017,
    operatore: 'NOAA',
    paese: 'USA',
    missione: 'Previsioni meteorologiche operative',
    designazioneInternazionale: '2017-081A',
    fonteModello: 'ricostruzione da documentazione NOAA',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
  {
    id: 'GPS_IIF',
    name: 'GPS IIF (Navstar)',
    codeName: 'GPS IIF-1',
    category: 'COMUNICAZIONE',
    icon: '📍',
    color: '#10b981',
    foilColor: 0xd4af37,
    altitudeKm: 20200,
    orbitMultiplier: 1.60,
    speed: 0.0007,
    inclination: 0.91, // 55°
    startAngle: 0.0,
    h2wRole: 'Navigazione e posizionamento globale MEO',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 36035,
    isPhysicalSpacecraft: true,
    massaKg: 1630,
    lunghezzaM: 2,
    larghezzaM: 2,
    altezzaM: 2,
    pannelliSolariM: { lunghezza: 16, larghezza: 2 },
    antennaPrincipaleM: 0.5,
    lancioAnno: 2010,
    operatore: 'U.S. Space Force / DoD',
    paese: 'USA',
    missione: 'Sistema di posizionamento globale GPS',
    designazioneInternazionale: '2010-013A',
    fonteModello: 'ricostruzione da documentazione pubblica',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
  {
    id: 'GALILEO',
    name: 'Galileo FOC',
    codeName: 'GSAT0101',
    category: 'COMUNICAZIONE',
    icon: '🌍',
    color: '#10b981',
    foilColor: 0xd4af37,
    altitudeKm: 23222,
    orbitMultiplier: 1.62,
    speed: 0.00065,
    inclination: 0.99, // 56°
    startAngle: 1.5,
    h2wRole: 'Navigazione satellitare europea MEO',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 37845,
    isPhysicalSpacecraft: true,
    massaKg: 700,
    lunghezzaM: 2,
    larghezzaM: 1,
    altezzaM: 1,
    pannelliSolariM: { lunghezza: 14, larghezza: 1 },
    antennaPrincipaleM: 0.5,
    lancioAnno: 2011,
    operatore: 'ESA / European Commission',
    paese: 'Europa',
    missione: 'Sistema di navigazione satellitare Galileo',
    designazioneInternazionale: '2011-061A',
    fonteModello: 'ricostruzione da documentazione ESA',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
  {
    id: 'METEOSAT_GEO',
    name: 'Meteosat-11 (MSG)',
    codeName: 'METEOSAT-11',
    category: 'METEO',
    icon: '☀️',
    color: '#f97316',
    foilColor: 0xe2e8f0,
    altitudeKm: 35786,
    orbitMultiplier: 1.66,
    speed: 0.0006,
    inclination: 0.0,
    startAngle: 0.0,
    h2wRole: 'Meteo geostazionario EUMETSAT',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 40068,
    isPhysicalSpacecraft: true,
    massaKg: 2000,
    lunghezzaM: 3,
    larghezzaM: 3,
    altezzaM: 3,
    pannelliSolariM: { lunghezza: 4, larghezza: 3 },
    antennaPrincipaleM: 0.5,
    lancioAnno: 2015,
    operatore: 'EUMETSAT / ESA',
    paese: 'Europa',
    missione: 'Osservazione meteorologica geostazionaria',
    designazioneInternazionale: '2015-033A',
    fonteModello: 'ricostruzione da documentazione ESA',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
  {
    id: 'STARLINK',
    name: 'Starlink (esemplare)',
    codeName: 'STARLINK-3109',
    category: 'COMUNICAZIONE',
    icon: '📶',
    color: '#22c55e',
    foilColor: 0x18181b,
    altitudeKm: 550,
    orbitMultiplier: 1.22,
    speed: 0.0010,
    inclination: 0.92, // 53°
    startAngle: 2.356,
    h2wRole: 'Costellazione broadband in orbita bassa SpaceX',
    targetComponent: 'SatelliteDetailModal',
    isActive: true,
    noradId: 49143,
    isPhysicalSpacecraft: true,
    massaKg: 260,
    lunghezzaM: 3,
    larghezzaM: 1,
    altezzaM: 0.3,
    pannelliSolariM: { lunghezza: 8, larghezza: 1 },
    antennaPrincipaleM: 0.5,
    lancioAnno: 2021,
    operatore: 'SpaceX',
    paese: 'USA',
    missione: 'Connettività internet satellitare',
    designazioneInternazionale: '2021-082P',
    fonteModello: 'ricostruzione da documentazione SpaceX',
    licenzaModello: 'CC BY 4.0',
    notaModello: 'ricostruzione fotografica',
  },
];

/**
 * Ritorna l'intero catalogo satelliti reali prioritari.
 */
export function getRealSatelliteCatalog(): RealSatelliteConfig[] {
  return REAL_PRIORITY_SATELLITES_CATALOG;
}

/**
 * Ritorna un satellite reale per id.
 */
export function getRealSatelliteById(id: SatelliteId): RealSatelliteConfig | null {
  return REAL_PRIORITY_SATELLITES_CATALOG.find((s) => s.id === id) ?? null;
}

/**
 * Ritorna un satellite reale per NORAD ID.
 */
export function getRealSatelliteByNorad(noradId: number): RealSatelliteConfig | null {
  return REAL_PRIORITY_SATELLITES_CATALOG.find((s) => s.noradId === noradId) ?? null;
}

/**
 * Conta i satelliti reali fisici nel catalogo parallelo.
 */
export function getRealSatelliteCount(): number {
  return REAL_PRIORITY_SATELLITES_CATALOG.length;
}

/**
 * Conta i satelliti reali fisici attivi nel catalogo parallelo.
 */
export function getRealSatelliteActiveCount(): number {
  return REAL_PRIORITY_SATELLITES_CATALOG.filter((s) => s.isActive).length;
}
