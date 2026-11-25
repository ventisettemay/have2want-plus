/**
 * CONFIRMED SATELLITES – HAVE2WANT PLUS
 * Elenco canonico degli 11 satelliti definitivi confermati dal proprietario.
 * Fonte unica di verità per tutti i moduli che necessitano l'elenco completo.
 */

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

export interface ConfirmedSatellite {
  id: ConfirmedSatelliteId;
  name: string;
  codeName: string;
  category: 'TERRITORIO' | 'METEO' | 'MERCATI' | 'COMUNICAZIONE' | 'COMUNITA';
}

export const CONFIRMED_SATELLITES: ConfirmedSatellite[] = [
  {
    id: 'SOCCORSO_SAT',
    name: 'SOCCORSO — Emergenze & Mutuo Aiuto',
    codeName: 'COSPAS-SARSAT',
    category: 'COMUNITA',
  },
  {
    id: 'MAP_SAT',
    name: 'MAP — Navigazione & Territorio',
    codeName: 'MAP-COMPOSITE',
    category: 'TERRITORIO',
  },
  {
    id: 'ACTIONFLOW_SAT',
    name: 'ACTIONFLOW HUB — Portal App Esterne',
    codeName: 'ACTIONFLOW-CORE',
    category: 'COMUNITA',
  },
  {
    id: 'DEFIANCE_PULSE_SAT',
    name: 'DEFIANCE PULSE — Multimedia AI (Creator, Music, Video, Promotion)',
    codeName: 'DEFIANCE-CORE',
    category: 'COMUNICAZIONE',
  },
  {
    id: 'RADAR_SAT',
    name: 'RADAR — Scansione Prossimità Territoriale',
    codeName: 'RADAR-SCAN',
    category: 'TERRITORIO',
  },
  {
    id: 'METEO_SAT',
    name: 'METEO — Clima & Radar Live',
    codeName: 'METEOSAT-3G',
    category: 'METEO',
  },
  {
    id: 'KM0_SAT',
    name: 'KM 0 — Filiera Corta',
    codeName: 'SENTINEL-2',
    category: 'TERRITORIO',
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'PI CHAT — Chat Vocale & Video',
    codeName: 'STARLINK-COMM',
    category: 'COMUNICAZIONE',
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'PRODOTTI DEL MONDO — Marketplace Interno',
    codeName: 'TELSTAR 19V',
    category: 'MERCATI',
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'MARKETPLACE ESTERNI — Canali Esterni',
    codeName: 'GATEWAY-RELAIS',
    category: 'MERCATI',
  },
  {
    id: 'BUSINESS_ADS_SAT',
    name: 'CREAZIONE PUBBLICITÀ — Vetrine Sponsorizzate',
    codeName: 'BEACON-BUSINESS',
    category: 'TERRITORIO',
  },
];

export function isConfirmedSatellite(id: string): id is ConfirmedSatelliteId {
  return CONFIRMED_SATELLITES.some((s) => s.id === id);
}

export function getConfirmedSatellite(id: ConfirmedSatelliteId): ConfirmedSatellite | undefined {
  return CONFIRMED_SATELLITES.find((s) => s.id === id);
}