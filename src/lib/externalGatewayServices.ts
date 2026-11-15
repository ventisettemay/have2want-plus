// Modulo Gateway Collegamenti Esterni & Servizi Reali nel Mondo
// ZERO archiviazione di dati pesanti terzi: solo routing verso fonti ufficiali dirette
// Gratuito, leggero, senza API a pagamento.

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
  const query = placeName ? encodeURIComponent(placeName) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${query}`;
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
    countryCode: 'IT',
    countryName: 'Italia',
    flag: '🇮🇹',
    universalEmergency: '112',
    medicalEmergency: '118',
    police: '113',
    firefighters: '115',
    crisisOrWomenHelpline: '1522',
    officialEmergencyPortal: 'https://www.carabinieri.it/in-vostro-aiuto/emergenze'
  },
  US: {
    countryCode: 'US',
    countryName: 'Stati Uniti (USA)',
    flag: '🇺🇸',
    universalEmergency: '911',
    medicalEmergency: '911',
    police: '911',
    firefighters: '911',
    crisisOrWomenHelpline: '988',
    officialEmergencyPortal: 'https://www.ready.gov'
  },
  GB: {
    countryCode: 'GB',
    countryName: 'Regno Unito (UK)',
    flag: '🇬🇧',
    universalEmergency: '999',
    medicalEmergency: '111',
    police: '101',
    firefighters: '999',
    crisisOrWomenHelpline: '0808 2000 247',
    officialEmergencyPortal: 'https://www.gov.uk/browse/justice/emergencies'
  },
  FR: {
    countryCode: 'FR',
    countryName: 'Francia',
    flag: '🇫🇷',
    universalEmergency: '112',
    medicalEmergency: '15',
    police: '17',
    firefighters: '18',
    crisisOrWomenHelpline: '3919',
    officialEmergencyPortal: 'https://www.service-public.fr/particuliers/vosdroits/F3152'
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germania',
    flag: '🇩🇪',
    universalEmergency: '112',
    medicalEmergency: '116117',
    police: '110',
    firefighters: '112',
    crisisOrWomenHelpline: '08000 116 016',
    officialEmergencyPortal: 'https://www.bbk.bund.de'
  },
  ES: {
    countryCode: 'ES',
    countryName: 'Spagna',
    flag: '🇪🇸',
    universalEmergency: '112',
    medicalEmergency: '061',
    police: '091',
    firefighters: '080',
    crisisOrWomenHelpline: '016',
    officialEmergencyPortal: 'https://www.proteccioncivil.es'
  },
  CH: {
    countryCode: 'CH',
    countryName: 'Svizzera',
    flag: '🇨🇭',
    universalEmergency: '112',
    medicalEmergency: '144',
    police: '117',
    firefighters: '118',
    crisisOrWomenHelpline: '143',
    officialEmergencyPortal: 'https://www.ch.ch/it/sicurezza-e-giustizia/numeri-di-emergenza'
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Giappone',
    flag: '🇯🇵',
    universalEmergency: '110',
    medicalEmergency: '119',
    police: '110',
    firefighters: '119',
    crisisOrWomenHelpline: '#8891',
    officialEmergencyPortal: 'https://www.fdma.go.jp'
  },
  DEFAULT: {
    countryCode: 'GLOBAL',
    countryName: 'Internazionale',
    flag: '🌐',
    universalEmergency: '112',
    medicalEmergency: '112',
    police: '112',
    firefighters: '112',
    crisisOrWomenHelpline: '112',
    officialEmergencyPortal: 'https://www.sos.org'
  }
};

// Esempi di Punti del Mondo Reale per dimostrare i collegamenti esterni senza salvare dati pesanti
export const SAMPLE_REAL_WORLD_GATEWAY_PLACES: ExternalPlaceService[] = [
  // 1. TOTEM VOLANTINI SUPERMERCATI (Link esterno al volantino ufficiale)
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
    hours: 'Lun-Dom: 08:00 - 21:00'
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
    hours: 'Lun-Sab: 07:30 - 21:00'
  },

  // 2. DISCOTECHE, LOCALI APERTI E VITA NOTTURNA
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
    hours: 'Ven-Sab: 23:00 - 05:00'
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
    description: 'Eventi musicali d\'avanguardia, scenografie luminose e serate esclusive.',
    promo: 'Drink inclusi per gruppi e tavoli dedicati.',
    hours: 'Giov-Sab: 23:30 - 04:30'
  },

  // 3. FIERE, MANIFESTAZIONI E SAGRE DI PAESE
  {
    id: 'fair-1',
    name: 'Fiera dell\'Artigianato e Mercato Rionale',
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
    description: 'Bancarelle d\'antiquariato, sapori tipici del territorio, musica popolare e artigianato dal vivo.',
    promo: 'Ingresso libero e degustazioni guidate.',
    hours: 'Sabato e Domenica: 09:00 - 20:00'
  },
  {
    id: 'fair-2',
    name: 'Festival Internazionale del Fumetto & Cosplay',
    category: 'event_fair',
    categoryLabel: 'Manifestazione Culturale',
    badge: 'Evento del Mese',
    lat: 43.8430,
    lng: 10.5050,
    address: 'Centro Storico, Lucca',
    city: 'Lucca',
    countryCode: 'IT',
    externalLink: 'https://www.luccacomicsandgames.com',
    externalLinkText: 'Portale Ufficiale Manifestazione',
    navigationUrl: getDirectTurnByTurnUrl(43.8430, 10.5050, 'Lucca Centro'),
    description: 'Manifestazione mondiale dedicata a creatività, giochi da tavolo, cinema e fumetti.',
    promo: 'Mappa dei padiglioni e navette disponibili sul sito ufficiale.',
    hours: 'Tutti i giorni durante il festival: 09:00 - 19:00'
  },

  // 4. LOCKER & PUNTI DI RITIRO CROWDSOURCED (Amazon, InPost, BRT, Fermopoint)
  {
    id: 'locker-1',
    name: 'Amazon Locker "Cassiopea" 24/7',
    category: 'locker',
    categoryLabel: 'Punto di Ritiro & Spedizioni',
    badge: 'Locker Automatico 24/7',
    lat: 41.8940,
    lng: 12.4810,
    address: 'Presso Stazione / Distributore Eni, Roma Centro',
    city: 'Roma',
    countryCode: 'IT',
    externalLink: 'https://www.amazon.it/ulp',
    externalLinkText: 'Verifica Disponibilità sul sito Amazon',
    navigationUrl: getDirectTurnByTurnUrl(41.8940, 12.4810, 'Amazon Locker Roma'),
    description: 'Armadietto self-service per ritirare e rendere pacchi con codice a barre o app Bluetooth.',
    promo: 'Ritiro garantito in 3 giorni senza code.',
    hours: 'Aperto 24 ore su 24, 7 giorni su 7'
  },
  {
    id: 'locker-2',
    name: 'InPost Locker & Fermopoint BRT',
    category: 'locker',
    categoryLabel: 'Punto di Ritiro & Spedizioni',
    badge: 'InPost & BRT',
    lat: 45.4660,
    lng: 9.1880,
    address: 'Via San Babila 4, Milano',
    city: 'Milano',
    countryCode: 'IT',
    externalLink: 'https://inpost.it/trova-il-tuo-locker',
    externalLinkText: 'Cerca Codice Ritiro InPost Ufficiale',
    navigationUrl: getDirectTurnByTurnUrl(45.4660, 9.1880, 'InPost Milano San Babila'),
    description: 'Locker multi-corriere per pacchi Vinted, eBay, BRT e spedizioni e-commerce sostenibili.',
    promo: 'Zero emissioni con ritiro a piedi nel tuo quartiere.',
    hours: '24/7 all\'esterno'
  },

  // 5. PROFESSIONISTI ETICI (Assistenza gratuita e orientamento in cambio di visibilità)
  {
    id: 'pro-1',
    name: 'Dr. Marco V. - Medico di Medicina Generale & Primo Ascolto',
    category: 'pro_ethical',
    categoryLabel: 'Professionista Etico della Comunità',
    badge: 'Consulenza Etica Gratuita',
    lat: 41.8910,
    lng: 12.4800,
    address: 'Studio Medico Convenzionato, Roma',
    city: 'Roma',
    countryCode: 'IT',
    externalLink: 'https://www.dottori.it',
    externalLinkText: 'Profilo Medico & Prenotazione Ufficiale',
    navigationUrl: getDirectTurnByTurnUrl(41.8910, 12.4800, 'Studio Medico Roma'),
    description: 'Offre gratuitamente primo orientamento sanitario e spiegazione referti agli utenti dell\'app.',
    promo: 'Risposta diretta discreta in chat per urgenze non gravi.',
    hours: 'Disponibile per domande in app: Lun-Ven 18:00 - 20:00'
  },
  {
    id: 'pro-2',
    name: 'Officina & Meccanico Etico Roberto',
    category: 'pro_ethical',
    categoryLabel: 'Professionista Etico della Comunità',
    badge: 'Soccorso Tecnico Etico',
    lat: 45.4620,
    lng: 9.1850,
    address: 'Via Ripamonti, Milano',
    city: 'Milano',
    countryCode: 'IT',
    externalLink: 'https://www.google.com/maps/search/meccanico+milano',
    externalLinkText: 'Scheda Ufficiale & Recensioni Google',
    navigationUrl: getDirectTurnByTurnUrl(45.4620, 9.1850, 'Officina Roberto Milano'),
    description: 'Aiuta gli automobilisti con consigli telefonici immediati per spie accese, cambio gomme o emergenze.',
    promo: 'Diagnosi iniziale di cortesia gratuita.',
    hours: 'Lun-Sab: 08:00 - 19:00'
  }
];

// Funzione Gateway: restituisce servizi del mondo reale per la zona visualizzata
export function getExternalServicesForArea(lat: number, lng: number, cityName = ''): ExternalPlaceService[] {
  // Se la città corrisponde o se cerchiamo servizi generali
  const cityLower = (cityName || '').toLowerCase();
  if (cityLower.includes('roma') || (lat > 41.5 && lat < 42.2)) {
    return SAMPLE_REAL_WORLD_GATEWAY_PLACES.filter(p => p.city === 'Roma');
  }
  if (cityLower.includes('milan') || (lat > 45.2 && lat < 45.7)) {
    return SAMPLE_REAL_WORLD_GATEWAY_PLACES.filter(p => p.city === 'Milano');
  }
  // Se siamo in un'altra area geografica, adatta dinamicamente i punti per visualizzare totem utili attorno al centro
  return SAMPLE_REAL_WORLD_GATEWAY_PLACES.map((p, idx) => {
    const angle = (idx / SAMPLE_REAL_WORLD_GATEWAY_PLACES.length) * Math.PI * 2;
    const radius = 0.005 + (idx % 3) * 0.003;
    const itemLat = lat + Math.sin(angle) * radius;
    const itemLng = lng + Math.cos(angle) * radius;
    return {
      ...p,
      lat: itemLat,
      lng: itemLng,
      navigationUrl: getDirectTurnByTurnUrl(itemLat, itemLng, p.name)
    };
  });
}

