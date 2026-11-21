// Database delle 20 Regioni Italiane e principali Territori Mondiali
// Con coordinate centroide, capoluogo, coordinate di confine e metadati 3D

export interface RegionData {
  id: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
  countryId: string;
  countryName: string;
  flag: string;
  description: string;
  population?: string;
  featuredSpots?: string[];
}

// 20 Regioni d'Italia
export const ITALIAN_REGIONS: RegionData[] = [
  {
    id: 'it-lom',
    name: 'Lombardia',
    capital: 'Milano',
    lat: 45.4642,
    lng: 9.1900,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Capitale economica, moda, innovazione e laghi prealpini',
    population: '10.0M',
    featuredSpots: ['Milano Duomo', 'Brescia', 'Bergamo', 'Lago di Como']
  },
  {
    id: 'it-laz',
    name: 'Lazio',
    capital: 'Roma',
    lat: 41.8902,
    lng: 12.4922,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Cuore storico, archeologia millenaria e capitale d\'Italia',
    population: '5.7M',
    featuredSpots: ['Roma Colosseo', 'Viterbo', 'Tivoli', 'Latina']
  },
  {
    id: 'it-pie',
    name: 'Piemonte',
    capital: 'Torino',
    lat: 45.0703,
    lng: 7.6869,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Langhe, Alpi maestose, industria e tradizione enogastronomica',
    population: '4.3M',
    featuredSpots: ['Torino Mole', 'Alba', 'Novara', 'Verbano']
  },
  {
    id: 'it-ven',
    name: 'Veneto',
    capital: 'Venezia',
    lat: 45.4408,
    lng: 12.3155,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Laguna veneziana, Dolomiti patrimonio UNESCO e ville palladiane',
    population: '4.9M',
    featuredSpots: ['Venezia San Marco', 'Verona Arena', 'Padova', 'Treviso']
  },
  {
    id: 'it-emr',
    name: 'Emilia-Romagna',
    capital: 'Bologna',
    lat: 44.4949,
    lng: 11.3426,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Motor Valley, Food Valley, università antiche e riviera adriatica',
    population: '4.4M',
    featuredSpots: ['Bologna Due Torri', 'Modena', 'Parma', 'Rimini']
  },
  {
    id: 'it-cam',
    name: 'Campania',
    capital: 'Napoli',
    lat: 40.8518,
    lng: 14.2681,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Golfo di Napoli, Costiera Amalfitana, Pompei e Vesuvio',
    population: '5.6M',
    featuredSpots: ['Napoli Spaccanapoli', 'Salerno', 'Pompei', 'Capri']
  },
  {
    id: 'it-sic',
    name: 'Sicilia',
    capital: 'Palermo',
    lat: 38.1157,
    lng: 13.3615,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Isola di luce, templi greci, Etna e cultura mediterranea',
    population: '4.8M',
    featuredSpots: ['Palermo', 'Catania Etna', 'Taormina', 'Siracusa']
  },
  {
    id: 'it-tos',
    name: 'Toscana',
    capital: 'Firenze',
    lat: 43.7696,
    lng: 11.2558,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Rinascimento, colline del Chianti, arte e borghi medievali',
    population: '3.7M',
    featuredSpots: ['Firenze Uffizi', 'Siena Piazza del Campo', 'Pisa', 'Lucca']
  },
  {
    id: 'it-pug',
    name: 'Puglia',
    capital: 'Bari',
    lat: 41.1171,
    lng: 16.8719,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Trulli della Valle d\'Itria, mare cristallino e Salento barocco',
    population: '3.9M',
    featuredSpots: ['Bari Vecchia', 'Lecce', 'Alberobello', 'Otranto']
  },
  {
    id: 'it-lig',
    name: 'Liguria',
    capital: 'Genova',
    lat: 44.4056,
    lng: 8.9463,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Cinque Terre, borghi a picco sul mare e porto storico di Genova',
    population: '1.5M',
    featuredSpots: ['Genova Porto Antico', 'Portofino', 'Cinque Terre', 'Sanremo']
  },
  {
    id: 'it-sar',
    name: 'Sardegna',
    capital: 'Cagliari',
    lat: 39.2238,
    lng: 9.1217,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Nuraghi millenari, acque turchesi incontaminate e tradizioni vive',
    population: '1.6M',
    featuredSpots: ['Cagliari Bastione', 'Olbia Costa Smeralda', 'Alghero', 'Barbagia']
  },
  {
    id: 'it-cal',
    name: 'Calabria',
    capital: 'Catanzaro',
    lat: 38.9098,
    lng: 16.5877,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Due mari, parchi della Sila e dell\'Aspromonte e Tropea',
    population: '1.8M',
    featuredSpots: ['Reggio Bronzi', 'Tropea', 'Catanzaro', 'Cosenza']
  },
  {
    id: 'it-mar',
    name: 'Marche',
    capital: 'Ancona',
    lat: 43.6158,
    lng: 13.5189,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Conero, colline di Leopardi, manifattura di qualità e mare',
    population: '1.5M',
    featuredSpots: ['Ancona', 'Urbino', 'Pesaro', 'Ascoli Piceno']
  },
  {
    id: 'it-fvg',
    name: 'Friuli-Venezia Giulia',
    capital: 'Trieste',
    lat: 45.6495,
    lng: 13.7768,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Incontro di culture mitteleuropee, Carso, Udine e mare di Trieste',
    population: '1.2M',
    featuredSpots: ['Trieste Piazza Unità', 'Udine', 'Gorizia', 'Pordenone']
  },
  {
    id: 'it-taa',
    name: 'Trentino-Alto Adige',
    capital: 'Trento',
    lat: 46.0748,
    lng: 11.1217,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Dolomiti, laghi alpini, valli incantate e rifugi d\'alta quota',
    population: '1.1M',
    featuredSpots: ['Trento', 'Bolzano', 'Merano', 'Val di Fassa']
  },
  {
    id: 'it-abr',
    name: 'Abruzzo',
    capital: 'L\'Aquila',
    lat: 42.3498,
    lng: 13.3995,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Regione verde d\'Europa, Gran Sasso, trabocchi e natura protetta',
    population: '1.3M',
    featuredSpots: ['L\'Aquila', 'Pescara', 'Gran Sasso', 'Costa dei Trabocchi']
  },
  {
    id: 'it-umb',
    name: 'Umbria',
    capital: 'Perugia',
    lat: 43.1107,
    lng: 12.3908,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Cuore verde d\'Italia, Assisi, lago Trasimeno e borghi di pace',
    population: '0.8M',
    featuredSpots: ['Perugia', 'Assisi San Francesco', 'Orvieto', 'Gubbio']
  },
  {
    id: 'it-bas',
    name: 'Basilicata',
    capital: 'Potenza',
    lat: 40.6404,
    lng: 15.8056,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Sassi di Matera patrimonio mondiale, Pollino e costa tirrenica',
    population: '0.5M',
    featuredSpots: ['Matera Sassi', 'Potenza', 'Maratea', 'Metaponto']
  },
  {
    id: 'it-mol',
    name: 'Molise',
    capital: 'Campobasso',
    lat: 41.5603,
    lng: 14.6627,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Tratturi storici, natura incontaminata, borghi fortificati e mare',
    population: '0.3M',
    featuredSpots: ['Campobasso', 'Termoli Borgo Antico', 'Isernia', 'Agnone']
  },
  {
    id: 'it-vda',
    name: 'Valle d\'Aosta',
    capital: 'Aosta',
    lat: 45.7371,
    lng: 7.3197,
    countryId: 'it',
    countryName: 'Italia',
    flag: '🇮🇹',
    description: 'Monte Bianco, Cervino, castelli feudali e natura d\'alta quota',
    population: '0.12M',
    featuredSpots: ['Aosta Romana', 'Courmayeur', 'Cervinia', 'Castello di Fénis']
  }
];

// Negozi e Aziende Inserzioniste d'esempio su Mappa 3D
export interface SponsoredBusiness {
  id: string;
  name: string;
  category: 'ristorazione' | 'artigianato' | 'tecnologia' | 'abbigliamento' | 'servizi' | 'bio_agricoltura';
  categoryLabel: string;
  badge: 'Gold Verified' | 'Diamond Partner' | 'Pi Merchant';
  city: string;
  region: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  description: string;
  promo?: string;
  piAccepted: boolean;
  fiatAccepted: boolean;
  phone: string;
  website: string;
  hours: string;
  voiceIntro?: string; // Descrizione vocale del titolare
  hasAd?: boolean;
  isAd?: boolean;
  adHeadline?: string;
  flyerUrl?: string;
  durationDays?: number;
  paidPricePi?: number;
  expiresAt?: string; // ISO date: scadenza automatica della vetrina sponsorizzata
}

export const SPONSORED_BUSINESSES: SponsoredBusiness[] = [
  // 1. CATEGORIA DOPPIO ANELLO (Accetta Pi + Pubblicizza con Volantino)
  {
    id: 'biz-roma-1',
    name: 'Bottega d\'Arte & Restauro Roma',
    category: 'artigianato',
    categoryLabel: 'Artigianato & Restauro',
    badge: 'Diamond Partner',
    city: 'Roma',
    region: 'Lazio',
    lat: 41.8935,
    lng: 12.4820,
    rating: 4.9,
    reviewCount: 88,
    description: 'Maestri ebanisti e restauratori di mobili storici ed orologi d\'epoca.',
    promo: 'Sconto 15% pagando con Pi Network (π) o baratto con materiali d\'epoca.',
    piAccepted: true,
    fiatAccepted: true,
    hasAd: true,
    isAd: true,
    adHeadline: 'Campagna Restauro Autunno: -15% in Pi Coin sul restauro ligneo',
    phone: '+39 06 6982 4110',
    website: 'https://bottegaroma-example.it',
    hours: 'Lun-Sab: 09:00 - 19:30',
    voiceIntro: 'Benvenuti alla Bottega d\'Arte di Roma! Ascolta la nostra storia.'
  },
  {
    id: 'biz-milano-1',
    name: 'Tech & Green Circular Lab',
    category: 'tecnologia',
    categoryLabel: 'Informatica & Rigenerazione',
    badge: 'Pi Merchant',
    city: 'Milano',
    region: 'Lombardia',
    lat: 45.4670,
    lng: 9.1890,
    rating: 4.8,
    reviewCount: 142,
    description: 'Riparazione cellulari, notebook e vendita hardware ricondizionato con garanzia 24 mesi.',
    promo: 'Valutazione immediata del tuo usato in Pi Coin o sconto sul nuovo!',
    piAccepted: true,
    fiatAccepted: true,
    hasAd: true,
    isAd: true,
    adHeadline: 'Volantino Rigenerati 2026: Notebook garantiti 24 mesi con Pi Wallet',
    phone: '+39 02 8734 5520',
    website: 'https://techcircular-example.it',
    hours: 'Lun-Ven: 09:30 - 19:00',
    voiceIntro: 'Ciao Pioneer! Qui rigeneriamo tecnologia e accettiamo Pi per qualsiasi riparazione.'
  },
  {
    id: 'biz-napoli-1',
    name: 'Caffè & Dolci Tradizione Partenopea',
    category: 'ristorazione',
    categoryLabel: 'Caffetteria & Pasticceria',
    badge: 'Gold Verified',
    city: 'Napoli',
    region: 'Campania',
    lat: 40.8490,
    lng: 14.2580,
    rating: 5.0,
    reviewCount: 230,
    description: 'Vero espresso napoletano, sfogliatelle calde e babà artigianali.',
    promo: 'Colazione Pi: Caffè speciale + sfogliatella a 0.2 π',
    piAccepted: true,
    fiatAccepted: true,
    hasAd: true,
    isAd: true,
    adHeadline: 'Offerta Pioneer: Colazione completa con espresso e sfogliatella a 0.2 Pi',
    phone: '+39 081 552 1904',
    website: 'https://caffetradizione-example.it',
    hours: 'Tutti i giorni: 06:30 - 21:00',
    voiceIntro: 'Profumo di caffè e sfogliatella calda! Vi aspettiamo nel cuore di Napoli.'
  },

  // 2. CATEGORIA VIOLA E ORO LAMPEGGIANTE (Solo Accettazione Pi, no campagna pubblicitaria)
  {
    id: 'biz-torino-pi',
    name: 'Studio Odontoiatrico & Igiene Sanitaria',
    category: 'servizi',
    categoryLabel: 'Salute & Servizi Medici',
    badge: 'Pi Merchant',
    city: 'Torino',
    region: 'Piemonte',
    lat: 45.0680,
    lng: 7.6830,
    rating: 4.9,
    reviewCount: 64,
    description: 'Ambulatorio polispecialistico convenzionato: visite dentistiche e igiene orale professionale.',
    promo: '',
    piAccepted: true,
    fiatAccepted: true,
    hasAd: false,
    isAd: false,
    phone: '+39 011 443 8912',
    website: 'https://studiosanitario-torino.it',
    hours: 'Lun-Ven: 08:30 - 19:00',
    voiceIntro: 'Studio convenzionato per la salute del sorriso con pagamenti digitali Pi Network.'
  },
  {
    id: 'biz-bologna-pi',
    name: 'Farmacia Sanitaria & Fitoterapia Naturale',
    category: 'servizi',
    categoryLabel: 'Salute & Benessere',
    badge: 'Pi Merchant',
    city: 'Bologna',
    region: 'Emilia-Romagna',
    lat: 44.4960,
    lng: 11.3410,
    rating: 4.9,
    reviewCount: 112,
    description: 'Preparazioni galeniche, integratori naturali e articoli sanitari di prima necessità.',
    promo: '',
    piAccepted: true,
    fiatAccepted: true,
    hasAd: false,
    isAd: false,
    phone: '+39 051 228 901',
    website: 'https://farmaciasanitaria-bologna.it',
    hours: 'Lun-Sab: 08:00 - 20:00 (Turno notturno disponibile)',
    voiceIntro: 'Farmacia convenzionata: accetta pagamenti in valuta locale e Pi Coin.'
  },

  // 3. CATEGORIA ORO PURO (Esercizio Pubblicizzato / Volantino, Non accetta Pi)
  {
    id: 'biz-venezia-ad',
    name: 'Grand Hotel & Residenza Belle Arti',
    category: 'servizi',
    categoryLabel: 'Ospitalità & Turismo Storico',
    badge: 'Gold Verified',
    city: 'Venezia',
    region: 'Veneto',
    lat: 45.4320,
    lng: 12.3280,
    rating: 4.8,
    reviewCount: 310,
    description: 'Palazzo veneziano del Settecento affacciato sul Canal Grande. Suite storiche e ristorante tipico.',
    promo: 'Volantino Soggiorni Primavera: -20% su prenotazioni anticipate dirette',
    piAccepted: false,
    fiatAccepted: true,
    hasAd: true,
    isAd: true,
    adHeadline: 'Campagna Primavera Venezia: Prenotazione anticipata con cena degustazione inclusa',
    phone: '+39 041 520 0211',
    website: 'https://hotelbellearti-venezia.it',
    hours: 'Reception: 24h / 24h',
    voiceIntro: 'Benvenuti a Venezia. Scoprite il fascino della laguna nel nostro palazzo storico.'
  },
  {
    id: 'biz-verona-ad',
    name: 'Concessionaria & Noleggio Mobilità Verona',
    category: 'tecnologia',
    categoryLabel: 'Veicoli Elettrici & Mobilità',
    badge: 'Gold Verified',
    city: 'Verona',
    region: 'Veneto',
    lat: 45.4380,
    lng: 10.9920,
    rating: 4.7,
    reviewCount: 95,
    description: 'Vendita e noleggio a lungo termine di autovetture elettriche, scooter e furgoni commerciali.',
    promo: 'Offerta Noleggio Week-End: Scooter elettrici e citycar con chilometraggio illimitato',
    piAccepted: false,
    fiatAccepted: true,
    hasAd: true,
    isAd: true,
    adHeadline: 'Locandina Mobilità Verde: Noleggio a tariffa agevolata per residenti',
    phone: '+39 045 801 3490',
    website: 'https://mobilitaverona-example.it',
    hours: 'Lun-Sab: 08:30 - 19:30',
    voiceIntro: 'Mobilità sostenibile a Verona: veicoli ecologici per ogni esigenza.'
  }
];
