// Modulo Gateway Collegamenti Esterni & Servizi Reali nel Mondo
// ZERO archiviazione di dati pesanti terzi: solo routing verso fonti ufficiali dirette
// Gratuito, leggero, senza API a pagamento.

import { isValidCoord } from './worldAtlas';

export const ExternalPlaceService = {};
export interface ExternalPlaceService {
  id: string;
  name: string;
  category: 'supermarket_flyer' | 'nightlife' | 'event_fair' | 'locker' | 'pro_ethical';
  categoryLabel: string;
  badge?: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  countryCode: string;

  // Collegamento esterno UFFICIALE diretto
  externalLink: string;
  externalLinkText: string;

  // Link Navigatore nativo smartphone (Costo Zero, apre Google Maps o Apple Maps)
  navigationUrl: string;

  description: string;
  promoOrSpecial?: string;
  promo?: string;
  hours?: string;
}

// Generatore link Google Maps gratuito per navigatore turn-by-turn nativo
export function getDirectTurnByTurnUrl(lat: number, lng: number, placeName = '') {
  if (!isValidCoord(lat, lng)) {
    return placeName
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`
      : 'https://www.google.com/maps';
  }
  const query = placeName ? encodeURIComponent(`${placeName} @${lat},${lng}`) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${query}`;
}

// Numeri Utili Internazionali (Chiamata Diretta tel: senza database interno)
export interface CountryEmergencyNumbers {
  countryCode: string;
  countryName: string;
  flag: string;
  universalEmergency: string;
  medicalEmergency: string;
  police: string;
  firefighters: string;
  crisisOrWomenHelpline: string;
  officialEmergencyPortal: string;
}

export const WORLD_EMERGENCY_SERVICES: Record<string, CountryEmergencyNumbers> = {
  IT: {
    countryCode: 'IT', countryName: 'Italia', flag: '🇮🇹',
    universalEmergency: '112', medicalEmergency: '118', police: '113', firefighters: '115',
    crisisOrWomenHelpline: '1522', officialEmergencyPortal: 'https://www.carabinieri.it/in-vostro-aiuto/emergenze',
  },
  US: {
    countryCode: 'US', countryName: 'Stati Uniti (USA)', flag: '🇺🇸',
    universalEmergency: '911', medicalEmergency: '911', police: '911', firefighters: '911',
    crisisOrWomenHelpline: '988', officialEmergencyPortal: 'https://www.ready.gov',
  },
  CA: {
    countryCode: 'CA', countryName: 'Canada', flag: '🇨🇦',
    universalEmergency: '911', medicalEmergency: '911', police: '911', firefighters: '911',
    crisisOrWomenHelpline: '988', officialEmergencyPortal: 'https://www.getprepared.gc.ca',
  },
  GB: {
    countryCode: 'GB', countryName: 'Regno Unito (UK)', flag: '🇬🇧',
    universalEmergency: '999', medicalEmergency: '111', police: '101', firefighters: '999',
    crisisOrWomenHelpline: '0808 2000 247', officialEmergencyPortal: 'https://www.gov.uk/browse/justice/emergencies',
  },
  FR: {
    countryCode: 'FR', countryName: 'Francia', flag: '🇫🇷',
    universalEmergency: '112', medicalEmergency: '15', police: '17', firefighters: '18',
    crisisOrWomenHelpline: '3919', officialEmergencyPortal: 'https://www.service-public.fr/particuliers/vosdroits/F3152',
  },
  DE: {
    countryCode: 'DE', countryName: 'Germania', flag: '🇩🇪',
    universalEmergency: '112', medicalEmergency: '116117', police: '110', firefighters: '112',
    crisisOrWomenHelpline: '08000 116 016', officialEmergencyPortal: 'https://www.bbk.bund.de',
  },
  ES: {
    countryCode: 'ES', countryName: 'Spagna', flag: '🇪🇸',
    universalEmergency: '112', medicalEmergency: '061', police: '091', firefighters: '080',
    crisisOrWomenHelpline: '016', officialEmergencyPortal: 'https://www.proteccioncivil.es',
  },
  PT: {
    countryCode: 'PT', countryName: 'Portogallo', flag: '🇵🇹',
    universalEmergency: '112', medicalEmergency: '112', police: '112', firefighters: '112',
    crisisOrWomenHelpline: '800 202 148', officialEmergencyPortal: 'https://www.prociv.pt',
  },
  CH: {
    countryCode: 'CH', countryName: 'Svizzera', flag: '🇨🇭',
    universalEmergency: '112', medicalEmergency: '144', police: '117', firefighters: '118',
    crisisOrWomenHelpline: '143', officialEmergencyPortal: 'https://www.ch.ch/it/sicurezza-e-giustizia/numeri-di-emergenza',
  },
  NL: {
    countryCode: 'NL', countryName: 'Paesi Bassi', flag: '🇳🇱',
    universalEmergency: '112', medicalEmergency: '112', police: '0900-8844', firefighters: '112',
    crisisOrWomenHelpline: '0800-0113', officialEmergencyPortal: 'https://www.politie.nl',
  },
  BE: {
    countryCode: 'BE', countryName: 'Belgio', flag: '🇧🇪',
    universalEmergency: '112', medicalEmergency: '112', police: '101', firefighters: '112',
    crisisOrWomenHelpline: '1712', officialEmergencyPortal: 'https://www.sos112.be',
  },
  AT: {
    countryCode: 'AT', countryName: 'Austria', flag: '🇦🇹',
    universalEmergency: '112', medicalEmergency: '144', police: '133', firefighters: '122',
    crisisOrWomenHelpline: '0800 222 555', officialEmergencyPortal: 'https://www.oesterreich.gv.at',
  },
  GR: {
    countryCode: 'GR', countryName: 'Grecia', flag: '🇬🇷',
    universalEmergency: '112', medicalEmergency: '166', police: '100', firefighters: '199',
    crisisOrWomenHelpline: '15900', officialEmergencyPortal: 'https://civilprotection.gov.gr',
  },
  SE: {
    countryCode: 'SE', countryName: 'Svezia', flag: '🇸🇪',
    universalEmergency: '112', medicalEmergency: '1177', police: '11414', firefighters: '112',
    crisisOrWomenHelpline: '020-50 50 50', officialEmergencyPortal: 'https://www.sosalarm.se',
  },
  NO: {
    countryCode: 'NO', countryName: 'Norvegia', flag: '🇳🇴',
    universalEmergency: '112', medicalEmergency: '113', police: '112', firefighters: '110',
    crisisOrWomenHelpline: '116 123', officialEmergencyPortal: 'https://www.dsb.no',
  },
  PL: {
    countryCode: 'PL', countryName: 'Polonia', flag: '🇵🇱',
    universalEmergency: '112', medicalEmergency: '999', police: '997', firefighters: '998',
    crisisOrWomenHelpline: '800 120 002', officialEmergencyPortal: 'https://www.gov.pl/web/numer-alarmowy-112',
  },
  JP: {
    countryCode: 'JP', countryName: 'Giappone', flag: '🇯🇵',
    universalEmergency: '110', medicalEmergency: '119', police: '110', firefighters: '119',
    crisisOrWomenHelpline: '#8891', officialEmergencyPortal: 'https://www.fdma.go.jp',
  },
  KR: {
    countryCode: 'KR', countryName: 'Corea del Sud', flag: '🇰🇷',
    universalEmergency: '112', medicalEmergency: '119', police: '112', firefighters: '119',
    crisisOrWomenHelpline: '1366', officialEmergencyPortal: 'https://www.mois.go.kr',
  },
  CN: {
    countryCode: 'CN', countryName: 'Cina', flag: '🇨🇳',
    universalEmergency: '110', medicalEmergency: '120', police: '110', firefighters: '119',
    crisisOrWomenHelpline: '12338', officialEmergencyPortal: 'https://www.mem.gov.cn',
  },
  IN: {
    countryCode: 'IN', countryName: 'India', flag: '🇮🇳',
    universalEmergency: '112', medicalEmergency: '108', police: '100', firefighters: '101',
    crisisOrWomenHelpline: '181', officialEmergencyPortal: 'https://www.ndma.gov.in',
  },
  SG: {
    countryCode: 'SG', countryName: 'Singapore', flag: '🇸🇬',
    universalEmergency: '999', medicalEmergency: '995', police: '999', firefighters: '995',
    crisisOrWomenHelpline: '1800-777-0000', officialEmergencyPortal: 'https://www.scdf.gov.sg',
  },
  AE: {
    countryCode: 'AE', countryName: 'Emirati Arabi Uniti', flag: '🇦🇪',
    universalEmergency: '999', medicalEmergency: '998', police: '999', firefighters: '997',
    crisisOrWomenHelpline: '800111', officialEmergencyPortal: 'https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies',
  },
  SA: {
    countryCode: 'SA', countryName: 'Arabia Saudita', flag: '🇸🇦',
    universalEmergency: '911', medicalEmergency: '997', police: '999', firefighters: '998',
    crisisOrWomenHelpline: '1919', officialEmergencyPortal: 'https://www.998.gov.sa',
  },
  TR: {
    countryCode: 'TR', countryName: 'Turchia', flag: '🇹🇷',
    universalEmergency: '112', medicalEmergency: '112', police: '155', firefighters: '110',
    crisisOrWomenHelpline: '183', officialEmergencyPortal: 'https://www.afad.gov.tr',
  },
  EG: {
    countryCode: 'EG', countryName: 'Egitto', flag: '🇪🇬',
    universalEmergency: '122', medicalEmergency: '123', police: '122', firefighters: '180',
    crisisOrWomenHelpline: '15115', officialEmergencyPortal: 'https://www.egypt.gov.eg',
  },
  MA: {
    countryCode: 'MA', countryName: 'Marocco', flag: '🇲🇦',
    universalEmergency: '19', medicalEmergency: '15', police: '19', firefighters: '15',
    crisisOrWomenHelpline: '8350', officialEmergencyPortal: 'https://www.maroc.ma',
  },
  NG: {
    countryCode: 'NG', countryName: 'Nigeria', flag: '🇳🇬',
    universalEmergency: '112', medicalEmergency: '112', police: '112', firefighters: '112',
    crisisOrWomenHelpline: '112', officialEmergencyPortal: 'https://nema.gov.ng',
  },
  KE: {
    countryCode: 'KE', countryName: 'Kenya', flag: '🇰🇪',
    universalEmergency: '999', medicalEmergency: '999', police: '112', firefighters: '999',
    crisisOrWomenHelpline: '1195', officialEmergencyPortal: 'https://www.nationalpolice.go.ke',
  },
  ZA: {
    countryCode: 'ZA', countryName: 'Sudafrica', flag: '🇿🇦',
    universalEmergency: '112', medicalEmergency: '10177', police: '10111', firefighters: '10177',
    crisisOrWomenHelpline: '0800 428 428', officialEmergencyPortal: 'https://www.gov.za',
  },
  CG: {
    countryCode: 'CG', countryName: 'Repubblica del Congo', flag: '🇨🇬',
    universalEmergency: '117', medicalEmergency: '118', police: '117', firefighters: '118',
    crisisOrWomenHelpline: '117', officialEmergencyPortal: 'https://gouvernement.cg',
  },
  CD: {
    countryCode: 'CD', countryName: 'RD Congo', flag: '🇨🇩',
    universalEmergency: '112', medicalEmergency: '118', police: '112', firefighters: '118',
    crisisOrWomenHelpline: '112', officialEmergencyPortal: 'https://www.presidence.cd',
  },
  BR: {
    countryCode: 'BR', countryName: 'Brasile', flag: '🇧🇷',
    universalEmergency: '190', medicalEmergency: '192', police: '190', firefighters: '193',
    crisisOrWomenHelpline: '180', officialEmergencyPortal: 'https://www.gov.br',
  },
  AR: {
    countryCode: 'AR', countryName: 'Argentina', flag: '🇦🇷',
    universalEmergency: '911', medicalEmergency: '107', police: '101', firefighters: '100',
    crisisOrWomenHelpline: '144', officialEmergencyPortal: 'https://www.argentina.gob.ar/seguridad',
  },
  MX: {
    countryCode: 'MX', countryName: 'Messico', flag: '🇲🇽',
    universalEmergency: '911', medicalEmergency: '911', police: '911', firefighters: '911',
    crisisOrWomenHelpline: '800 911 2000', officialEmergencyPortal: 'https://www.gob.mx/911',
  },
  AU: {
    countryCode: 'AU', countryName: 'Australia', flag: '🇦🇺',
    universalEmergency: '000', medicalEmergency: '000', police: '000', firefighters: '000',
    crisisOrWomenHelpline: '1800 737 732', officialEmergencyPortal: 'https://www.triplezero.gov.au',
  },
  NZ: {
    countryCode: 'NZ', countryName: 'Nuova Zelanda', flag: '🇳🇿',
    universalEmergency: '111', medicalEmergency: '111', police: '111', firefighters: '111',
    crisisOrWomenHelpline: '0800 456 450', officialEmergencyPortal: 'https://www.police.govt.nz',
  },
  DEFAULT: {
    countryCode: 'GLOBAL', countryName: 'Internazionale (Standard GSM 112)', flag: '🌐',
    universalEmergency: '112', medicalEmergency: '112', police: '112', firefighters: '112',
    crisisOrWomenHelpline: '112', officialEmergencyPortal: 'https://www.eena.org',
  },
};

export function getEmergencyServicesForCountry(countryCode?: string): CountryEmergencyNumbers {
  const code = String(countryCode || '').trim().toUpperCase();
  if (code && WORLD_EMERGENCY_SERVICES[code]) {
    return WORLD_EMERGENCY_SERVICES[code];
  }
  return WORLD_EMERGENCY_SERVICES.DEFAULT;
}

// Esempi di Punti del Mondo Reale per dimostrare i collegamenti esterni senza salvare dati pesanti
export const SAMPLE_REAL_WORLD_GATEWAY_PLACES: ExternalPlaceService[] = [
  {
    id: 'totem-super-1',
    name: 'Supermercato IperConad & Volantino Settimanale',
    category: 'supermarket_flyer',
    categoryLabel: 'Totem Volantino Offerte',
    badge: 'Totem Digitale',
    lat: 41.8905,
    lng: 12.4930,
    address: 'Via dei Fori Imperiali, Roma',
    city: 'Roma',
    countryCode: 'IT',
    externalLink: 'https://www.conad.it/volantini',
    externalLinkText: 'Sfoglia Volantino Ufficiale Online',
    navigationUrl: getDirectTurnByTurnUrl(41.8905, 12.4930, 'IperConad Roma'),
    description: 'Offerte settimanali, sconti freschi e promozioni di prossimità visualizzabili con 1 tap.',
    promo: 'Sconti fino al 40% su prodotti locali e cassa veloce.',
    hours: 'Lun-Dom: 08:00 - 21:00',
  },
  {
    id: 'totem-super-2',
    name: 'Esselunga Point & Offerte Smart',
    category: 'supermarket_flyer',
    categoryLabel: 'Totem Volantino Offerte',
    badge: 'Totem Digitale',
    lat: 45.4650,
    lng: 9.1910,
    address: 'Corso Vittorio Emanuele II, Milano',
    city: 'Milano',
    countryCode: 'IT',
    externalLink: 'https://www.esselunga.it/promozioni/volantini',
    externalLinkText: 'Apri Volantino Esselunga Diretto',
    navigationUrl: getDirectTurnByTurnUrl(45.4650, 9.1910, 'Esselunga Milano'),
    description: 'Promozioni di corsia, freschissimi e punti fedeltà visualizzabili dal link ufficiale.',
    promo: 'Fidaty Pi: Speciale Bio e Filiera Corta.',
    hours: 'Lun-Sab: 07:30 - 21:00',
  },
  {
    id: 'nightlife-1',
    name: 'Alcatraz Live Club & Disco',
    category: 'nightlife',
    categoryLabel: 'Discoteca & Musica Live',
    badge: 'Locale Aperto Stasera',
    lat: 45.4950,
    lng: 9.1830,
    address: 'Via Valtellina 25, Milano',
    city: 'Milano',
    countryCode: 'IT',
    externalLink: 'https://alcatrazmilano.it',
    externalLinkText: 'Programma Serata Ufficiale & Biglietti',
    navigationUrl: getDirectTurnByTurnUrl(45.4950, 9.1830, 'Alcatraz Milano'),
    description: 'Grande club con 3 piste musicali, concerti internazionali e serate DJ set.',
    promo: 'Ingresso convenzionato in lista e promozioni drink.',
    hours: 'Ven-Sab: 23:00 - 05:00',
  },
  {
    id: 'nightlife-2',
    name: 'Spazio 900 Roma Disco',
    category: 'nightlife',
    categoryLabel: 'Clubbing & Elettronica',
    badge: 'Vita Notturna',
    lat: 41.8350,
    lng: 12.4680,
    address: 'Piazza Guglielmo Marconi 26, Roma (EUR)',
    city: 'Roma',
    countryCode: 'IT',
    externalLink: 'https://www.spazio900roma.it',
    externalLinkText: 'Vedi Eventi Ufficiali Spazio 900',
    navigationUrl: getDirectTurnByTurnUrl(41.8350, 12.4680, 'Spazio 900 Roma'),
    description: "Eventi musicali d'avanguardia, scenografie luminose e serate esclusive.",
    promo: 'Drink inclusi per gruppi e tavoli dedicati.',
    hours: 'Giov-Sab: 23:30 - 04:30',
  },
  {
    id: 'fair-1',
    name: "Fiera dell'Artigianato e Mercato Rionale",
    category: 'event_fair',
    categoryLabel: 'Fiera di Paese & Tradizione',
    badge: 'Evento in Corso',
    lat: 41.8920,
    lng: 12.4850,
    address: 'Piazza Navona / Campo de Fiori, Roma',
    city: 'Roma',
    countryCode: 'IT',
    externalLink: 'https://www.comune.roma.it/web/it/eventi.page',
    externalLinkText: 'Programma Istituzionale Comune',
    navigationUrl: getDirectTurnByTurnUrl(41.8920, 12.4850, 'Piazza Navona Roma'),
    description: "Bancarelle d'antiquariato, sapori tipici del territorio, musica popolare e artigianato dal vivo.",
    promo: 'Ingresso libero e degustazioni guidate.',
    hours: 'Sabato e Domenica: 09:00 - 20:00',
  },
  {
    id: 'locker-1',
    name: 'Amazon Locker "Cassiopea" 24/7',
    category: 'locker',
    categoryLabel: 'Punto di Ritiro & Spedizioni',
    badge: 'Locker Automatico 24/7',
    lat: 41.8940,
    lng: 12.4810,
    address: 'Stazione Termini / Centro, Roma',
    city: 'Roma',
    countryCode: 'IT',
    externalLink: 'https://www.amazon.it/ulp',
    externalLinkText: 'Verifica Disponibilità Locker',
    navigationUrl: getDirectTurnByTurnUrl(41.8940, 12.4810, 'Amazon Locker Roma'),
    description: 'Armadietto self-service per ritirare e rendere pacchi con codice a barre.',
    promo: 'Ritiro garantito in 3 giorni senza code.',
    hours: 'Aperto 24 ore su 24',
  },
  {
    id: 'locker-2',
    name: 'InPost Locker & Fermopoint',
    category: 'locker',
    categoryLabel: 'Punto di Ritiro & Spedizioni',
    badge: 'InPost 24/7',
    lat: 45.4660,
    lng: 9.1880,
    address: 'Via San Babila 4, Milano',
    city: 'Milano',
    countryCode: 'IT',
    externalLink: 'https://inpost.it/trova-il-tuo-locker',
    externalLinkText: 'Cerca Codice Ritiro InPost',
    navigationUrl: getDirectTurnByTurnUrl(45.4660, 9.1880, 'InPost Milano San Babila'),
    description: 'Locker multi-corriere per ritiro pacchi nel quartiere.',
    promo: 'Zero emissioni con ritiro a piedi.',
    hours: '24/7',
  },
  {
    id: 'pro-1',
    name: 'Presidio Sanitario & Primo Ascolto Etico',
    category: 'pro_ethical',
    categoryLabel: 'Professionista Etico della Comunità',
    badge: 'Consulenza Etica Gratuita',
    lat: 41.8910,
    lng: 12.4800,
    address: 'Roma Centro',
    city: 'Roma',
    countryCode: 'IT',
    externalLink: 'https://www.dottori.it',
    externalLinkText: 'Portale Medico & Prenotazioni',
    navigationUrl: getDirectTurnByTurnUrl(41.8910, 12.4800, 'Studio Medico Roma'),
    description: 'Primo orientamento sanitario e supporto territoriale alla comunità.',
    promo: 'Risposta discreta in chat.',
    hours: 'Lun-Ven 18:00 - 20:00',
  },
  {
    id: 'pro-2',
    name: 'Officina & Assistenza Tecnica Etica Milano',
    category: 'pro_ethical',
    categoryLabel: 'Professionista Etico della Comunità',
    badge: 'Soccorso Tecnico Etico',
    lat: 45.4620,
    lng: 9.1850,
    address: 'Via Ripamonti, Milano',
    city: 'Milano',
    countryCode: 'IT',
    externalLink: 'https://www.google.com/maps/search/meccanico+milano',
    externalLinkText: 'Scheda Assistenza locale',
    navigationUrl: getDirectTurnByTurnUrl(45.4620, 9.1850, 'Officina Milano'),
    description: 'Supporto tecnico rapido per emergenze veicolari e manutenzione.',
    promo: 'Diagnosi iniziale di cortesia.',
    hours: 'Lun-Sab: 08:00 - 19:00',
  },
];

// Cache spaziale Overpass per evitare chiamate ripetute sulla stessa area (TTL 15 minuti)
const OVERPASS_GATEWAY_CACHE = new Map<
  string,
  { timestamp: number; places: ExternalPlaceService[]; source: 'overpass' | 'unavailable'; error?: string }
>();
const OVERPASS_CACHE_TTL_MS = 15 * 60 * 1000;

function makeAreaCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function mapOverpassNodeToExternalPlace(
  el: any,
  fallbackCity: string,
  fallbackCountryCode: string
): ExternalPlaceService | null {
  const tags = el?.tags || {};
  const elLat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
  const elLng = typeof el.lon === 'number' ? el.lon : el.center?.lon;
  if (!isValidCoord(elLat, elLng)) return null;

  const shop = tags.shop || '';
  const amenity = tags.amenity || '';
  const nameRaw = tags.name || tags['name:it'] || tags['name:en'] || tags.operator || tags.brand;
  if (!nameRaw) return null;

  let category: ExternalPlaceService['category'] = 'event_fair';
  let categoryLabel = 'Luogo Pubblico OpenStreetMap';
  let badge = 'OSM Verificato';

  if (shop === 'supermarket' || shop === 'department_store' || amenity === 'marketplace') {
    category = 'supermarket_flyer';
    categoryLabel = 'Mercato & Supermercato OSM';
    badge = 'Approvvigionamento';
  } else if (amenity === 'post_office' || amenity === 'parcel_locker') {
    category = 'locker';
    categoryLabel = 'Punto Postale & Ritiro OSM';
    badge = 'Ritiro Pacchi';
  } else if (amenity === 'pharmacy' || amenity === 'clinic' || amenity === 'hospital') {
    category = 'pro_ethical';
    categoryLabel = 'Presidio Sanitario & Farmacia';
    badge = 'Salute & Supporto';
  } else if (amenity === 'theatre' || amenity === 'arts_centre' || amenity === 'community_centre') {
    category = 'nightlife';
    categoryLabel = 'Cultura & Incontri Serali OSM';
    badge = 'Cultura Locale';
  } else if (amenity === 'townhall') {
    category = 'event_fair';
    categoryLabel = 'Centro Civico & Municipio OSM';
    badge = 'Spazio Civico';
  }

  const cityName =
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || fallbackCity || 'Territorio Locale';
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const address = street ? `${street}, ${cityName}` : `${cityName} (${elLat.toFixed(4)}, ${elLng.toFixed(4)})`;
  const website = typeof tags.website === 'string' && /^https?:\/\//i.test(tags.website)
    ? tags.website
    : `https://www.openstreetmap.org/${el.type || 'node'}/${el.id}`;

  return {
    id: `osm-gw-${el.type || 'node'}-${el.id}`,
    name: String(nameRaw),
    category,
    categoryLabel,
    badge,
    lat: elLat,
    lng: elLng,
    address,
    city: cityName,
    countryCode: (tags['addr:country'] || fallbackCountryCode || 'GLOBAL').toUpperCase(),
    externalLink: website,
    externalLinkText: tags.website ? 'Sito Ufficiale Attività' : 'Apri Scheda OpenStreetMap',
    navigationUrl: getDirectTurnByTurnUrl(elLat, elLng, String(nameRaw)),
    description: `Punto reale estratto da OpenStreetMap Overpass (${categoryLabel}).`,
    hours: tags.opening_hours || 'Orari su OpenStreetMap',
  };
}

export async function fetchRealExternalServicesForArea(
  lat: number,
  lng: number,
  cityName = '',
  countryCode = '',
  fetchImpl: typeof fetch = globalThis.fetch
): Promise<{
  places: ExternalPlaceService[];
  source: 'overpass' | 'cache' | 'unavailable';
  error?: string;
}> {
  if (!isValidCoord(lat, lng)) {
    return { places: [], source: 'unavailable', error: 'Coordinate geografiche non valide' };
  }

  const key = makeAreaCacheKey(lat, lng);
  const now = Date.now();
  const cached = OVERPASS_GATEWAY_CACHE.get(key);
  if (cached && now - cached.timestamp < OVERPASS_CACHE_TTL_MS) {
    return {
      places: cached.places,
      source: cached.source === 'overpass' ? 'cache' : 'unavailable',
      error: cached.error,
    };
  }

  if (typeof fetchImpl !== 'function') {
    return { places: [], source: 'unavailable', error: 'Fetch API non disponibile' };
  }

  const query = `[out:json][timeout:10];(node["shop"="supermarket"](around:2500,${lat},${lng});node["amenity"~"^(pharmacy|post_office|parcel_locker|marketplace|townhall|community_centre)$"](around:2500,${lat},${lng});way["amenity"~"^(marketplace|townhall|hospital)$"](around:2500,${lat},${lng}););out center 20;`;
  const endpoints = [
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const useLocalProxy = isBrowser && fetchImpl === globalThis.fetch;

  if (useLocalProxy) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 11000) : null;
    try {
      const proxyRes = await fetchImpl('/api/osm/overpass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query }),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        const rawElements = Array.isArray(data?.elements) ? data.elements : [];
        const seenIds = new Set<string>();
        const places: ExternalPlaceService[] = [];
        for (const el of rawElements) {
          const mapped = mapOverpassNodeToExternalPlace(el, cityName, countryCode);
          if (!mapped) continue;
          if (seenIds.has(mapped.id)) continue;
          seenIds.add(mapped.id);
          places.push(mapped);
          if (places.length >= 16) break;
        }
        OVERPASS_GATEWAY_CACHE.set(key, {
          timestamp: now,
          places,
          source: 'overpass',
        });
        return { places, source: 'overpass' };
      }
    } catch {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Accept: 'application/json',
    ...(!isBrowser ? { 'User-Agent': 'HAVE2WANT-PLUS/1.0 (https://have2want.app)' } : {}),
  };

  let lastErrorMsg = 'Errore Overpass API';
  for (const endpoint of endpoints) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 9000) : null;

    try {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: `data=${encodeURIComponent(query)}`,
        ...(controller ? { signal: controller.signal } : {}),
      });

      if (!res.ok) {
        lastErrorMsg = `Overpass HTTP ${res.status}`;
        if (timeoutId) clearTimeout(timeoutId);
        // Riprova sul mirror successivo solo per errori transitori o HTTP 406/429/5xx
        if ([406, 429, 500, 502, 503, 504].includes(res.status)) {
          continue;
        }
        return { places: [], source: 'unavailable', error: lastErrorMsg };
      }

      const data = await res.json();
      const rawElements = Array.isArray(data?.elements) ? data.elements : [];
      const seenIds = new Set<string>();
      const places: ExternalPlaceService[] = [];

      for (const el of rawElements) {
        const mapped = mapOverpassNodeToExternalPlace(el, cityName, countryCode);
        if (!mapped) continue;
        if (seenIds.has(mapped.id)) continue;
        seenIds.add(mapped.id);
        places.push(mapped);
        if (places.length >= 16) break;
      }

      OVERPASS_GATEWAY_CACHE.set(key, {
        timestamp: now,
        places,
        source: 'overpass',
      });

      if (timeoutId) clearTimeout(timeoutId);
      return { places, source: 'overpass' };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      lastErrorMsg =
        err?.name === 'AbortError' ? 'Timeout Overpass API' : err?.message || 'Errore Overpass API';
    }
  }

  return { places: [], source: 'unavailable', error: lastErrorMsg };
}

export function clearExternalGatewayCacheForTests(): void {
  OVERPASS_GATEWAY_CACHE.clear();
}

// Restituisce esclusivamente punti reali già in cache Overpass o nodi curati espliciti di Roma/Milano (ZERO pin inventati)
export function getExternalServicesForArea(
  lat: number,
  lng: number,
  cityName = '',
  _countryCode = ''
): ExternalPlaceService[] {
  if (!isValidCoord(lat, lng)) return [];

  const cached = OVERPASS_GATEWAY_CACHE.get(makeAreaCacheKey(lat, lng));
  if (cached && cached.places.length > 0) {
    return cached.places;
  }

  const cityLower = (cityName || '').toLowerCase();
  const isNearRome = Math.abs(lat - 41.8902) < 0.25 && Math.abs(lng - 12.4922) < 0.25;
  const isNearMilan = Math.abs(lat - 45.4642) < 0.25 && Math.abs(lng - 9.1900) < 0.25;

  if (cityLower.includes('roma') || isNearRome) {
    return SAMPLE_REAL_WORLD_GATEWAY_PLACES.filter((p) => p.city === 'Roma');
  }
  if (cityLower.includes('milan') || isNearMilan) {
    return SAMPLE_REAL_WORLD_GATEWAY_PLACES.filter((p) => p.city === 'Milano');
  }

  // Nessuna coordinata geometrica inventata per altre città: si attendono dati reali Overpass
  return [];
}

