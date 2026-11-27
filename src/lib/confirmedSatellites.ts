/**
 * CONFIRMED SATELLITES – HAVE2WANT PLUS
 * Elenco canonico degli 11 satelliti ufficiali confermati dal proprietario.
 * Fonte unica di verità per tutti i moduli che necessitano l'elenco completo.
 */

export type ConfirmedSatelliteId =
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

export interface ConfirmedSatellite {
  id: ConfirmedSatelliteId;
  name: string;
  codeName: string;
  category: 'TERRITORIO' | 'METEO' | 'MERCATI' | 'COMUNICAZIONE' | 'COMUNITA';
}

export const CONFIRMED_SATELLITES: ConfirmedSatellite[] = [
  {
    id: 'MAP_SAT',
    name: 'MAPPA 3D — Navigazione & Territorio',
    codeName: 'Landsat 9',
    category: 'TERRITORIO',
  },
  {
    id: 'METEO_SAT',
    name: 'METEO LIVE — Globo Mondiale',
    codeName: 'GOES-18',
    category: 'METEO',
  },
  {
    id: 'KM0_SAT',
    name: 'KM 0 — Filiera Corta',
    codeName: 'SMAP',
    category: 'TERRITORIO',
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'PRODOTTI DEL MONDO — Marketplace Interno',
    codeName: 'TDRS-13',
    category: 'MERCATI',
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'CHAT & VIDEOCHAT — Comunicazione Diretta',
    codeName: 'TDRS-12',
    category: 'COMUNICAZIONE',
  },
  {
    id: 'SOCCORSO_SAT',
    name: 'SOCCORSO — Emergenze & Mutuo Aiuto',
    codeName: 'NOAA-20',
    category: 'COMUNITA',
  },
  {
    id: 'DEFIANCE_PULSE_SAT',
    name: 'DEFIANCE PULSE — Multimedia AI (Creator, Music, Video)',
    codeName: 'ISS (Zarya)',
    category: 'COMUNICAZIONE',
  },
  {
    id: 'ACTIONFLOW_SAT',
    name: 'ACTIONFLOW HUB — Portal App Esterne',
    codeName: 'TDRS-11',
    category: 'COMUNITA',
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'MARKETPLACE ESTERNI — Canali Esterni',
    codeName: 'AQUA',
    category: 'MERCATI',
  },
  {
    id: 'CREATOR_ADS_SAT',
    name: 'CREATOR ADS — Pubblicità VIP a Pagamento',
    codeName: 'TERRA',
    category: 'TERRITORIO',
  },
  {
    id: 'PUBLISH_STORE_SAT',
    name: 'PUBLISH & STORE — Vetrina Pubblica',
    codeName: 'ICESAT-2',
    category: 'TERRITORIO',
  },
];

export function isConfirmedSatellite(id: string): id is ConfirmedSatelliteId {
  return CONFIRMED_SATELLITES.some((s) => s.id === id);
}

export function getConfirmedSatellite(id: ConfirmedSatelliteId): ConfirmedSatellite | undefined {
  return CONFIRMED_SATELLITES.find((s) => s.id === id);
}
