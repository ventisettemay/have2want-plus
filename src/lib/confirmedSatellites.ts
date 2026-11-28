// SATELLITI CONFERMATI – ALLINEAMENTO CON have2want-aistudio
// Elenco canonico degli 11 satelliti ufficiali usato per la barra rotante LED.
// Colori e NORAD IDs tracciabili via CelesTrak (satelliteModularEngine.ts).

export interface ConfirmedSatellite {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  shortDescription: string;
}

export const CONFIRMED_SATELLITES: ConfirmedSatellite[] = [
  {
    id: 'MAP_SAT',
    name: 'MAPPA 3D — Navigazione & Territorio',
    shortName: 'Mappa 3D',
    icon: '🛰️',
    color: '#06b6d4',
    shortDescription: 'GPS, stradario 360°, webcam, meteo integrato',
  },
  {
    id: 'METEO_SAT',
    name: 'METEO LIVE — Globo Mondiale',
    shortName: 'Meteo Live',
    icon: '🌤️',
    color: '#38bdf8',
    shortDescription: 'Previsioni Open-Meteo, radar 3D, allerte',
  },
  {
    id: 'KM0_SAT',
    name: 'KM 0 — Filiera Corta',
    shortName: 'Km 0',
    icon: '🌾',
    color: '#10b981',
    shortDescription: 'Produttori locali, filiera corta a chilometro zero',
  },
  {
    id: 'GLOBAL_MARKET_SAT',
    name: 'PRODOTTI DEL MONDO — Marketplace Interno',
    shortName: 'Marketplace',
    icon: '🛒',
    color: '#a855f7',
    shortDescription: 'Annunci utenti, compravendita P2P, pagamenti Pi',
  },
  {
    id: 'PI_CHAT_SAT',
    name: 'CHAT & VIDEOCHAT — Comunicazione Diretta',
    shortName: 'Chat & Video',
    icon: '💬',
    color: '#22c55e',
    shortDescription: 'Chat privata, note vocali, videochiamate P2P',
  },
  {
    id: 'SOCCORSO_SAT',
    name: 'SOCCORSO — Emergenze & Mutuo Aiuto',
    shortName: 'Soccorso',
    icon: '🆘',
    color: '#ef4444',
    shortDescription: 'Numeri emergenza globali, mutuo aiuto, presidi civici',
  },
  {
    id: 'DEFIANCE_PULSE_SAT',
    name: 'DEFIANCE PULSE — Multimedia AI',
    shortName: 'Defiance Pulse',
    icon: '⚡',
    color: '#ec4899',
    shortDescription: 'Creator, musica e video AI',
  },
  {
    id: 'ACTIONFLOW_SAT',
    name: 'ACTIONFLOW HUB — Portal App Esterne',
    shortName: 'ActionFlow',
    icon: '🎮',
    color: '#8b5cf6',
    shortDescription: 'Ponte per collegare fino a 3 app esterne',
  },
  {
    id: 'EXTERNAL_MARKET_SAT',
    name: 'MARKETPLACE ESTERNI — Canali Esterni',
    shortName: 'Market Esterni',
    icon: '🛒',
    color: '#f97316',
    shortDescription: 'Amazon, eBay, AliExpress, commissioni crypto',
  },
  {
    id: 'CREATOR_ADS_SAT',
    name: 'CREATOR ADS — Pubblicità VIP',
    shortName: 'Pubblicità H2W',
    icon: '📢',
    color: '#ffd700',
    shortDescription: 'Banner, volantini, spot per Pin e Vetrine',
  },
  {
    id: 'PUBLISH_STORE_SAT',
    name: 'PUBLISH & STORE — Vetrina Pubblica',
    shortName: 'Vetrine & Negozi',
    icon: '🏪',
    color: '#8b5cf6',
    shortDescription: 'Vetrina pubblica per negozi e professionisti',
  },
];

export function getConfirmedSatelliteById(id: string): ConfirmedSatellite | undefined {
  return CONFIRMED_SATELLITES.find((s) => s.id === id);
}
