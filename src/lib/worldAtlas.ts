// WORLD ATLAS & LOCALIZATION ENGINE
// Database globale con tutti i Paesi del mondo, Regioni, Città, Lingue ufficiali e Valute locali

import { PI_REAL_PRICE_EUR } from './piRealPriceService';

export interface LocalLanguage {
  code: string;
  name: string;
  nativeName: string;
  greeting: string;
}

export interface LocalCurrency {
  code: string;
  symbol: string;
  name: string;
  rateToEur: number; // Tasso indicativo rispetto a 1 EUR
  piRate?: number; // Quotazione CoinMarketCap calcolata
}

export interface WorldCountry {
  code: string; // ISO 3166-1 alpha-2
  code3: string; // ISO 3166-1 alpha-3
  name: string;
  nativeName: string;
  continent: 'Europa' | 'Americhe' | 'Asia' | 'Africa' | 'Oceania';
  subContinent?: string;
  capital: string;
  lat: number;
  lng: number;
  flag: string;
  language: LocalLanguage;
  currency: LocalCurrency;
  timezone: string;
  regions?: { name: string; capital: string; lat: number; lng: number }[];
}

// 1. DATABASE COMPLETO DEI PRINCIPALI STATI E NAZIONI DEL MONDO
export const WORLD_COUNTRIES: WorldCountry[] = [
  // EUROPA
  {
    code: 'IT',
    code3: 'ITA',
    name: 'Italia',
    nativeName: 'Italia',
    continent: 'Europa',
    capital: 'Roma',
    lat: 41.8902,
    lng: 12.4922,
    flag: '🇮🇹',
    language: { code: 'it', name: 'Italiano', nativeName: 'Italiano', greeting: 'Benvenuto in Italia!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Rome',
    regions: [
      { name: 'Abruzzo', capital: "L'Aquila", lat: 42.3498, lng: 13.3995 },
      { name: 'Basilicata', capital: 'Potenza', lat: 40.6404, lng: 15.8056 },
      { name: 'Calabria', capital: 'Catanzaro', lat: 38.9098, lng: 16.5877 },
      { name: 'Campania', capital: 'Napoli', lat: 40.8518, lng: 14.2681 },
      { name: 'Emilia-Romagna', capital: 'Bologna', lat: 44.4949, lng: 11.3426 },
      { name: 'Friuli-Venezia Giulia', capital: 'Trieste', lat: 45.6495, lng: 13.7768 },
      { name: 'Lazio', capital: 'Roma', lat: 41.8902, lng: 12.4922 },
      { name: 'Liguria', capital: 'Genova', lat: 44.4056, lng: 8.9463 },
      { name: 'Lombardia', capital: 'Milano', lat: 45.4642, lng: 9.1900 },
      { name: 'Marche', capital: 'Ancona', lat: 43.6158, lng: 13.5189 },
      { name: 'Molise', capital: 'Campobasso', lat: 41.5604, lng: 14.6627 },
      { name: 'Piemonte', capital: 'Torino', lat: 45.0703, lng: 7.6869 },
      { name: 'Puglia', capital: 'Bari', lat: 41.1171, lng: 16.8719 },
      { name: 'Sardegna', capital: 'Cagliari', lat: 39.2238, lng: 9.1217 },
      { name: 'Sicilia', capital: 'Palermo', lat: 38.1157, lng: 13.3615 },
      { name: 'Toscana', capital: 'Firenze', lat: 43.7696, lng: 11.2558 },
      { name: 'Trentino-Alto Adige', capital: 'Trento', lat: 46.0748, lng: 11.1217 },
      { name: 'Umbria', capital: 'Perugia', lat: 43.1107, lng: 12.3908 },
      { name: "Valle d'Aosta", capital: 'Aosta', lat: 45.7371, lng: 7.3197 },
      { name: 'Veneto', capital: 'Venezia', lat: 45.4408, lng: 12.3155 },
    ],
  },
  {
    code: 'FR',
    code3: 'FRA',
    name: 'Francia',
    nativeName: 'France',
    continent: 'Europa',
    capital: 'Parigi',
    lat: 48.8566,
    lng: 2.3522,
    flag: '🇫🇷',
    language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue en France !' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Paris',
    regions: [
      { name: 'Île-de-France', capital: 'Parigi', lat: 48.8566, lng: 2.3522 },
      { name: "Provence-Alpes-Côte d'Azur", capital: 'Marsiglia', lat: 43.2965, lng: 5.3698 },
      { name: 'Auvergne-Rhône-Alpes', capital: 'Lione', lat: 45.7640, lng: 4.8357 },
      { name: 'Nouvelle-Aquitaine', capital: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
      { name: 'Occitanie', capital: 'Tolosa', lat: 43.6047, lng: 1.4442 },
    ],
  },
  {
    code: 'ES',
    code3: 'ESP',
    name: 'Spagna',
    nativeName: 'España',
    continent: 'Europa',
    capital: 'Madrid',
    lat: 40.4168,
    lng: -3.7038,
    flag: '🇪🇸',
    language: { code: 'es', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a España!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Madrid',
    regions: [
      { name: 'Comunidad de Madrid', capital: 'Madrid', lat: 40.4168, lng: -3.7038 },
      { name: 'Cataluña', capital: 'Barcellona', lat: 41.3851, lng: 2.1734 },
      { name: 'Andalucía', capital: 'Siviglia', lat: 37.3891, lng: -5.9845 },
      { name: 'Comunidad Valenciana', capital: 'Valencia', lat: 39.4699, lng: -0.3763 },
      { name: 'País Vasco', capital: 'Bilbao', lat: 43.2630, lng: -2.9350 },
    ],
  },
  {
    code: 'DE',
    code3: 'DEU',
    name: 'Germania',
    nativeName: 'Deutschland',
    continent: 'Europa',
    capital: 'Berlino',
    lat: 52.5200,
    lng: 13.4050,
    flag: '🇩🇪',
    language: { code: 'de', name: 'Tedesco', nativeName: 'Deutsch', greeting: 'Willkommen in Deutschland!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Berlin',
    regions: [
      { name: 'Bayern', capital: 'Monaco di Baviera', lat: 48.1351, lng: 11.5820 },
      { name: 'Nordrhein-Westfalen', capital: 'Colonia', lat: 50.9375, lng: 6.9603 },
      { name: 'Baden-Württemberg', capital: 'Stoccarda', lat: 48.7758, lng: 9.1829 },
      { name: 'Hamburg', capital: 'Amburgo', lat: 53.5511, lng: 9.9937 },
      { name: 'Hessen', capital: 'Francoforte', lat: 50.1109, lng: 8.6821 },
    ],
  },
  {
    code: 'GB',
    code3: 'GBR',
    name: 'Regno Unito',
    nativeName: 'United Kingdom',
    continent: 'Europa',
    capital: 'Londra',
    lat: 51.5074,
    lng: -0.1278,
    flag: '🇬🇧',
    language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to the United Kingdom!' },
    currency: { code: 'GBP', symbol: '£', name: 'Sterlina Britannica', rateToEur: 0.85, piRate: 26.70 },
    timezone: 'Europe/London',
    regions: [
      { name: 'Inghilterra', capital: 'Londra', lat: 51.5074, lng: -0.1278 },
      { name: 'Scozia', capital: 'Edimburgo', lat: 55.9533, lng: -3.1883 },
      { name: 'Galles', capital: 'Cardiff', lat: 51.4816, lng: -3.1791 },
      { name: 'Irlanda del Nord', capital: 'Belfast', lat: 54.5973, lng: -5.9301 },
    ],
  },
  {
    code: 'CH',
    code3: 'CHE',
    name: 'Svizzera',
    nativeName: 'Schweiz / Suisse / Svizzera',
    continent: 'Europa',
    capital: 'Berna',
    lat: 46.9480,
    lng: 7.4474,
    flag: '🇨🇭',
    language: { code: 'de-CH', name: 'Tedesco / Francese / Italiano', nativeName: 'Deutsch / Français / Italiano', greeting: 'Grüezi / Bienvenue / Benvenuti!' },
    currency: { code: 'CHF', symbol: 'CHF', name: 'Franco Svizzero', rateToEur: 0.96, piRate: 30.15 },
    timezone: 'Europe/Zurich',
    regions: [
      { name: 'Zürich', capital: 'Zurigo', lat: 47.3769, lng: 8.5417 },
      { name: 'Genève', capital: 'Ginevra', lat: 46.2044, lng: 6.1432 },
      { name: 'Ticino', capital: 'Lugano', lat: 46.0037, lng: 8.9511 },
      { name: 'Basel-Stadt', capital: 'Basilea', lat: 47.5596, lng: 7.5886 },
    ],
  },
  {
    code: 'PT',
    code3: 'PRT',
    name: 'Portogallo',
    nativeName: 'Portugal',
    continent: 'Europa',
    capital: 'Lisbona',
    lat: 38.7223,
    lng: -9.1393,
    flag: '🇵🇹',
    language: { code: 'pt', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a Portugal!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Lisbon',
    regions: [
      { name: 'Lisbona', capital: 'Lisbona', lat: 38.7223, lng: -9.1393 },
      { name: 'Porto', capital: 'Porto', lat: 41.1579, lng: -8.6291 },
      { name: 'Algarve', capital: 'Faro', lat: 37.0194, lng: -7.9304 },
    ],
  },
  {
    code: 'NL',
    code3: 'NLD',
    name: 'Paesi Bassi',
    nativeName: 'Nederland',
    continent: 'Europa',
    capital: 'Amsterdam',
    lat: 52.3676,
    lng: 4.9041,
    flag: '🇳🇱',
    language: { code: 'nl', name: 'Olandese', nativeName: 'Nederlands', greeting: 'Welkom in Nederland!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Amsterdam',
  },
  {
    code: 'BE',
    code3: 'BEL',
    name: 'Belgio',
    nativeName: 'België / Belgique',
    continent: 'Europa',
    capital: 'Bruxelles',
    lat: 50.8503,
    lng: 4.3517,
    flag: '🇧🇪',
    language: { code: 'fr-BE', name: 'Francese / Fiammingo', nativeName: 'Français / Nederlands', greeting: 'Bienvenue / Welkom!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Brussels',
  },
  {
    code: 'AT',
    code3: 'AUT',
    name: 'Austria',
    nativeName: 'Österreich',
    continent: 'Europa',
    capital: 'Vienna',
    lat: 48.2082,
    lng: 16.3738,
    flag: '🇦🇹',
    language: { code: 'de-AT', name: 'Tedesco', nativeName: 'Deutsch', greeting: 'Herzlich willkommen in Österreich!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Vienna',
  },
  {
    code: 'GR',
    code3: 'GRC',
    name: 'Grecia',
    nativeName: 'Ελλάδα',
    continent: 'Europa',
    capital: 'Atene',
    lat: 37.9838,
    lng: 23.7275,
    flag: '🇬🇷',
    language: { code: 'el', name: 'Greco', nativeName: 'Ελληνικά', greeting: 'Καλώς ήρθατε στην Ελλάδα!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: PI_REAL_PRICE_EUR },
    timezone: 'Europe/Athens',
  },
  {
    code: 'SE',
    code3: 'SWE',
    name: 'Svezia',
    nativeName: 'Sverige',
    continent: 'Europa',
    capital: 'Stoccolma',
    lat: 59.3293,
    lng: 18.0686,
    flag: '🇸🇪',
    language: { code: 'sv', name: 'Svedese', nativeName: 'Svenska', greeting: 'Välkommen till Sverige!' },
    currency: { code: 'SEK', symbol: 'kr', name: 'Corona Svedese', rateToEur: 11.45, piRate: 359.60 },
    timezone: 'Europe/Stockholm',
  },
  {
    code: 'NO',
    code3: 'NOR',
    name: 'Norvegia',
    nativeName: 'Norge',
    continent: 'Europa',
    capital: 'Oslo',
    lat: 59.9139,
    lng: 10.7522,
    flag: '🇳🇴',
    language: { code: 'no', name: 'Norvegese', nativeName: 'Norsk', greeting: 'Velkommen til Norge!' },
    currency: { code: 'NOK', symbol: 'kr', name: 'Corona Norvegese', rateToEur: 11.60, piRate: 364.30 },
    timezone: 'Europe/Oslo',
  },
  {
    code: 'DK',
    code3: 'DNK',
    name: 'Danimarca',
    nativeName: 'Danmark',
    continent: 'Europa',
    capital: 'Copenaghen',
    lat: 55.6761,
    lng: 12.5683,
    flag: '🇩🇰',
    language: { code: 'da', name: 'Danese', nativeName: 'Dansk', greeting: 'Velkommen til Danmark!' },
    currency: { code: 'DKK', symbol: 'kr.', name: 'Corona Danese', rateToEur: 7.46, piRate: 234.30 },
    timezone: 'Europe/Copenhagen',
  },
  {
    code: 'PL',
    code3: 'POL',
    name: 'Polonia',
    nativeName: 'Polska',
    continent: 'Europa',
    capital: 'Varsavia',
    lat: 52.2297,
    lng: 21.0122,
    flag: '🇵🇱',
    language: { code: 'pl', name: 'Polacco', nativeName: 'Polski', greeting: 'Witamy w Polsce!' },
    currency: { code: 'PLN', symbol: 'zł', name: 'Złoty Polacco', rateToEur: 4.28, piRate: 134.40 },
    timezone: 'Europe/Warsaw',
  },

  // AMERICHE
  {
    code: 'US',
    code3: 'USA',
    name: 'Stati Uniti',
    nativeName: 'United States of America',
    continent: 'Americhe',
    capital: 'Washington D.C.',
    lat: 38.9072,
    lng: -77.0369,
    flag: '🇺🇸',
    language: { code: 'en-US', name: 'Inglese USA', nativeName: 'American English', greeting: 'Welcome to the United States!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro Statunitense', rateToEur: 1.08, piRate: 33.90 },
    timezone: 'America/New_York',
    regions: [
      { name: 'New York', capital: 'New York City', lat: 40.7128, lng: -74.0060 },
      { name: 'California', capital: 'Los Angeles / San Francisco', lat: 34.0522, lng: -118.2437 },
      { name: 'Florida', capital: 'Miami', lat: 25.7617, lng: -80.1918 },
      { name: 'Illinois', capital: 'Chicago', lat: 41.8781, lng: -87.6298 },
      { name: 'Texas', capital: 'Austin / Houston', lat: 29.7604, lng: -95.3698 },
      { name: 'Washington', capital: 'Seattle', lat: 47.6062, lng: -122.3321 },
    ],
  },
  {
    code: 'CA',
    code3: 'CAN',
    name: 'Canada',
    nativeName: 'Canada',
    continent: 'Americhe',
    capital: 'Ottawa',
    lat: 45.4215,
    lng: -75.6972,
    flag: '🇨🇦',
    language: { code: 'en-CA', name: 'Inglese / Francese', nativeName: 'English / Français', greeting: 'Welcome to Canada / Bienvenue au Canada!' },
    currency: { code: 'CAD', symbol: 'CA$', name: 'Dollaro Canadese', rateToEur: 1.48, piRate: 46.50 },
    timezone: 'America/Toronto',
    regions: [
      { name: 'Ontario', capital: 'Toronto', lat: 43.6532, lng: -79.3832 },
      { name: 'Québec', capital: 'Montréal', lat: 45.5017, lng: -73.5673 },
      { name: 'British Columbia', capital: 'Vancouver', lat: 49.2827, lng: -123.1207 },
    ],
  },
  {
    code: 'BR',
    code3: 'BRA',
    name: 'Brasile',
    nativeName: 'Brasil',
    continent: 'Americhe',
    capital: 'Brasília',
    lat: -15.8267,
    lng: -47.9218,
    flag: '🇧🇷',
    language: { code: 'pt-BR', name: 'Portoghese Brasiliano', nativeName: 'Português do Brasil', greeting: 'Bem-vindo ao Brasil!' },
    currency: { code: 'BRL', symbol: 'R$', name: 'Real Brasiliano', rateToEur: 6.02, piRate: 189.10 },
    timezone: 'America/Sao_Paulo',
    regions: [
      { name: 'São Paulo', capital: 'São Paulo', lat: -23.5505, lng: -46.6333 },
      { name: 'Rio de Janeiro', capital: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    ],
  },
  {
    code: 'AR',
    code3: 'ARG',
    name: 'Argentina',
    nativeName: 'Argentina',
    continent: 'Americhe',
    capital: 'Buenos Aires',
    lat: -34.6037,
    lng: -58.3816,
    flag: '🇦🇷',
    language: { code: 'es-AR', name: 'Spagnolo Argentino', nativeName: 'Español', greeting: '¡Bienvenido a la Argentina!' },
    currency: { code: 'ARS', symbol: '$', name: 'Peso Argentino', rateToEur: 1050.0, piRate: 32980.0 },
    timezone: 'America/Argentina/Buenos_Aires',
  },
  {
    code: 'MX',
    code3: 'MEX',
    name: 'Messico',
    nativeName: 'México',
    continent: 'Americhe',
    capital: 'Città del Messico',
    lat: 19.4326,
    lng: -99.1332,
    flag: '🇲🇽',
    language: { code: 'es-MX', name: 'Spagnolo Messicano', nativeName: 'Español', greeting: '¡Bienvenido a México!' },
    currency: { code: 'MXN', symbol: '$', name: 'Peso Messicano', rateToEur: 21.50, piRate: 675.30 },
    timezone: 'America/Mexico_City',
  },

  // ASIA
  {
    code: 'JP',
    code3: 'JPN',
    name: 'Giappone',
    nativeName: '日本',
    continent: 'Asia',
    capital: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    flag: '🇯🇵',
    language: { code: 'ja', name: 'Giapponese', nativeName: '日本語', greeting: 'ようこそ日本へ！ (Yōkoso Nihon e!)' },
    currency: { code: 'JPY', symbol: '¥', name: 'Yen Giapponese', rateToEur: 165.0, piRate: 5180.0 },
    timezone: 'Asia/Tokyo',
    regions: [
      { name: 'Kanto', capital: 'Tokyo', lat: 35.6762, lng: 139.6503 },
      { name: 'Kansai', capital: 'Kyoto / Osaka', lat: 34.6937, lng: 135.5023 },
      { name: 'Hokkaido', capital: 'Sapporo', lat: 43.0618, lng: 141.3545 },
    ],
  },
  {
    code: 'CN',
    code3: 'CHN',
    name: 'Cina',
    nativeName: '中国',
    continent: 'Asia',
    capital: 'Pechino',
    lat: 39.9042,
    lng: 116.4074,
    flag: '🇨🇳',
    language: { code: 'zh', name: 'Cinese Mandarino', nativeName: '中文', greeting: '欢迎来到中国！(Huānyíng láidào Zhōngguó!)' },
    currency: { code: 'CNY', symbol: '¥', name: 'Yuan Cinese', rateToEur: 7.82, piRate: 245.60 },
    timezone: 'Asia/Shanghai',
    regions: [
      { name: 'Beijing', capital: 'Pechino', lat: 39.9042, lng: 116.4074 },
      { name: 'Shanghai', capital: 'Shanghai', lat: 31.2304, lng: 121.4737 },
      { name: 'Guangdong', capital: 'Guangzhou / Shenzhen', lat: 23.1291, lng: 113.2644 },
    ],
  },
  {
    code: 'KR',
    code3: 'KOR',
    name: 'Corea del Sud',
    nativeName: '대한민국',
    continent: 'Asia',
    capital: 'Seul',
    lat: 37.5665,
    lng: 126.9780,
    flag: '🇰🇷',
    language: { code: 'ko', name: 'Coreano', nativeName: '한국어', greeting: '한국에 오신 것을 환영합니다!' },
    currency: { code: 'KRW', symbol: '₩', name: 'Won Sudcoreano', rateToEur: 1475.0, piRate: 46330.0 },
    timezone: 'Asia/Seoul',
  },
  {
    code: 'IN',
    code3: 'IND',
    name: 'India',
    nativeName: 'भारत',
    continent: 'Asia',
    capital: 'Nuova Delhi',
    lat: 28.6139,
    lng: 77.2090,
    flag: '🇮🇳',
    language: { code: 'hi', name: 'Hindi / Inglese', nativeName: 'हिन्दी / English', greeting: 'भारत में आपका स्वागत है!' },
    currency: { code: 'INR', symbol: '₹', name: 'Rupia Indiana', rateToEur: 90.50, piRate: 2842.0 },
    timezone: 'Asia/Kolkata',
    regions: [
      { name: 'Maharashtra', capital: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Delhi', capital: 'Nuova Delhi', lat: 28.6139, lng: 77.2090 },
      { name: 'Karnataka', capital: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    ],
  },
  {
    code: 'AE',
    code3: 'ARE',
    name: 'Emirati Arabi Uniti',
    nativeName: 'الإمارات العربية المتحدة',
    continent: 'Asia',
    capital: 'Abu Dhabi',
    lat: 24.4539,
    lng: 54.3773,
    flag: '🇦🇪',
    language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في الإمارات!' },
    currency: { code: 'AED', symbol: 'د.إ', name: 'Dirham degli EAU', rateToEur: 3.96, piRate: 124.40 },
    timezone: 'Asia/Dubai',
    regions: [
      { name: 'Dubai', capital: 'Dubai', lat: 25.2048, lng: 55.2708 },
      { name: 'Abu Dhabi', capital: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
    ],
  },
  {
    code: 'SG',
    code3: 'SGP',
    name: 'Singapore',
    nativeName: 'Singapore',
    continent: 'Asia',
    capital: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    flag: '🇸🇬',
    language: { code: 'en-SG', name: 'Inglese / Cinese / Malese', nativeName: 'English / 中文', greeting: 'Welcome to Singapore!' },
    currency: { code: 'SGD', symbol: 'S$', name: 'Dollaro di Singapore', rateToEur: 1.45, piRate: 45.50 },
    timezone: 'Asia/Singapore',
  },

  // AFRICA
  {
    code: 'EG',
    code3: 'EGY',
    name: 'Egitto',
    nativeName: 'مصر',
    continent: 'Africa',
    capital: 'Il Cairo',
    lat: 30.0444,
    lng: 31.2357,
    flag: '🇪🇬',
    language: { code: 'ar-EG', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بكم في مصر!' },
    currency: { code: 'EGP', symbol: 'E£', name: 'Sterlina Egiziana', rateToEur: 52.80, piRate: 1658.0 },
    timezone: 'Africa/Cairo',
  },
  {
    code: 'MA',
    code3: 'MAR',
    name: 'Marocco',
    nativeName: 'المغرب',
    continent: 'Africa',
    capital: 'Rabat',
    lat: 34.0209,
    lng: -6.8416,
    flag: '🇲🇦',
    language: { code: 'ar-MA', name: 'Arabo / Francese', nativeName: 'العربية / Français', greeting: 'مرحباً بكم في المغرب / Bienvenue au Maroc!' },
    currency: { code: 'MAD', symbol: 'DH', name: 'Dirham Marocchino', rateToEur: 10.75, piRate: 337.60 },
    timezone: 'Africa/Casablanca',
    regions: [
      { name: 'Casablanca-Settat', capital: 'Casablanca', lat: 33.5731, lng: -7.5898 },
      { name: 'Marrakech-Safi', capital: 'Marrakech', lat: 31.6295, lng: -7.9811 },
    ],
  },
  {
    code: 'NG',
    code3: 'NGA',
    name: 'Nigeria',
    nativeName: 'Federal Republic of Nigeria',
    continent: 'Africa',
    capital: 'Abuja',
    lat: 9.0765,
    lng: 7.3986,
    flag: '🇳🇬',
    language: { code: 'en-NG', name: 'Inglese / Hausa / Yoruba / Igbo', nativeName: 'English / Ẹ̀kọ́', greeting: 'Welcome to Nigeria!' },
    currency: { code: 'NGN', symbol: '₦', name: 'Naira Nigeriana', rateToEur: 1750.0, piRate: 54967.5 },
    timezone: 'Africa/Lagos',
    regions: [
      { name: 'Lagos', capital: 'Ikeja', lat: 6.5244, lng: 3.3792 },
      { name: 'Abuja FCT', capital: 'Abuja', lat: 9.0765, lng: 7.3986 },
      { name: 'Kano', capital: 'Kano', lat: 12.0022, lng: 8.5920 },
    ],
  },
  {
    code: 'KE',
    code3: 'KEN',
    name: 'Kenya',
    nativeName: 'Jamhuri ya Kenya',
    continent: 'Africa',
    capital: 'Nairobi',
    lat: -1.2921,
    lng: 36.8219,
    flag: '🇰🇪',
    language: { code: 'sw-KE', name: 'Swahili / Inglese', nativeName: 'Kiswahili / English', greeting: 'Karibu Kenya!' },
    currency: { code: 'KES', symbol: 'KSh', name: 'Scellino Keniota', rateToEur: 140.0, piRate: 4397.4 },
    timezone: 'Africa/Nairobi',
    regions: [
      { name: 'Nairobi', capital: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      { name: 'Mombasa', capital: 'Mombasa', lat: -4.0435, lng: 39.6682 },
    ],
  },
  {
    code: 'GH',
    code3: 'GHA',
    name: 'Ghana',
    nativeName: 'Republic of Ghana',
    continent: 'Africa',
    capital: 'Accra',
    lat: 5.6037,
    lng: -0.1870,
    flag: '🇬🇭',
    language: { code: 'en-GH', name: 'Inglese / Akan / Twi', nativeName: 'English / Twi', greeting: 'Akwaaba! Welcome to Ghana!' },
    currency: { code: 'GHS', symbol: 'GH₵', name: 'Cedi Ghanese', rateToEur: 16.5, piRate: 518.2 },
    timezone: 'Africa/Accra',
  },
  {
    code: 'SN',
    code3: 'SEN',
    name: 'Senegal',
    nativeName: 'Sénégal',
    continent: 'Africa',
    capital: 'Dakar',
    lat: 14.7167,
    lng: -17.4677,
    flag: '🇸🇳',
    language: { code: 'fr-SN', name: 'Francese / Wolof', nativeName: 'Français / Wolof', greeting: 'Dalal ak jàmm! Bienvenue au Sénégal!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95, piRate: 20603.4 },
    timezone: 'Africa/Dakar',
  },
  {
    code: 'DZ',
    code3: 'DZA',
    name: 'Algeria',
    nativeName: 'الجزائر',
    continent: 'Africa',
    capital: 'Algeri',
    lat: 36.7538,
    lng: 3.0588,
    flag: '🇩🇿',
    language: { code: 'ar-DZ', name: 'Arabo / Berbero / Francese', nativeName: 'العربية', greeting: 'مرحباً بكم في الجزائر!' },
    currency: { code: 'DZD', symbol: 'DA', name: 'Dinaro Algerino', rateToEur: 145.2, piRate: 4560.7 },
    timezone: 'Africa/Algiers',
  },
  {
    code: 'TN',
    code3: 'TUN',
    name: 'Tunisia',
    nativeName: 'تونس',
    continent: 'Africa',
    capital: 'Tunisi',
    lat: 36.8065,
    lng: 10.1815,
    flag: '🇹🇳',
    language: { code: 'ar-TN', name: 'Arabo / Francese', nativeName: 'العربية', greeting: 'أهلاً بكم في تونس!' },
    currency: { code: 'TND', symbol: 'DT', name: 'Dinaro Tunisino', rateToEur: 3.38, piRate: 106.1 },
    timezone: 'Africa/Tunis',
  },
  {
    code: 'ET',
    code3: 'ETH',
    name: 'Etiopia',
    nativeName: 'ኢትዮጵያ',
    continent: 'Africa',
    capital: 'Addis Abeba',
    lat: 9.0320,
    lng: 38.7469,
    flag: '🇪🇹',
    language: { code: 'am-ET', name: 'Amarico / Oromo / Inglese', nativeName: 'አማርኛ', greeting: 'እንኳን ደህና መጡ!' },
    currency: { code: 'ETB', symbol: 'Br', name: 'Birr Etiopico', rateToEur: 130.0, piRate: 4083.3 },
    timezone: 'Africa/Addis_Ababa',
  },
  {
    code: 'CI',
    code3: 'CIV',
    name: "Costa d'Avorio",
    nativeName: "Côte d'Ivoire",
    continent: 'Africa',
    capital: 'Yamoussoukro / Abidjan',
    lat: 5.3600,
    lng: -4.0083,
    flag: '🇨🇮',
    language: { code: 'fr-CI', name: 'Francese / Dioula / Baoulé', nativeName: 'Français', greeting: "Bienvenue en Côte d'Ivoire !" },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95, piRate: 20603.4 },
    timezone: 'Africa/Abidjan',
  },
  {
    code: 'CM',
    code3: 'CMR',
    name: 'Camerun',
    nativeName: 'Cameroun',
    continent: 'Africa',
    capital: 'Yaoundé',
    lat: 3.8480,
    lng: 11.5021,
    flag: '🇨🇲',
    language: { code: 'fr-CM', name: 'Francese / Inglese', nativeName: 'Français / English', greeting: 'Bienvenue au Cameroun!' },
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 655.95, piRate: 20603.4 },
    timezone: 'Africa/Douala',
  },
  {
    code: 'TZ',
    code3: 'TZA',
    name: 'Tanzania',
    nativeName: 'Tanzania',
    continent: 'Africa',
    capital: 'Dodoma / Dar es Salaam',
    lat: -6.7924,
    lng: 39.2083,
    flag: '🇹🇿',
    language: { code: 'sw-TZ', name: 'Swahili / Inglese', nativeName: 'Kiswahili', greeting: 'Karibu Tanzania!' },
    currency: { code: 'TZS', symbol: 'TSh', name: 'Scellino Tanzaniano', rateToEur: 2850.0, piRate: 89518.5 },
    timezone: 'Africa/Dar_es_Salaam',
  },
  {
    code: 'UG',
    code3: 'UGA',
    name: 'Uganda',
    nativeName: 'Uganda',
    continent: 'Africa',
    capital: 'Kampala',
    lat: 0.3476,
    lng: 32.5825,
    flag: '🇺🇬',
    language: { code: 'en-UG', name: 'Inglese / Swahili / Luganda', nativeName: 'English', greeting: 'Welcome to Uganda!' },
    currency: { code: 'UGX', symbol: 'USh', name: 'Scellino Ugandese', rateToEur: 4000.0, piRate: 125640.0 },
    timezone: 'Africa/Kampala',
  },
  {
    code: 'ZA',
    code3: 'ZAF',
    name: 'Sudafrica',
    nativeName: 'South Africa',
    continent: 'Africa',
    capital: 'Pretoria / Cape Town',
    lat: -33.9249,
    lng: 18.4241,
    flag: '🇿🇦',
    language: { code: 'en-ZA', name: 'Inglese / Zulu / Afrikaans', nativeName: 'English / isiZulu', greeting: 'Welcome to South Africa / Wamkelekile!' },
    currency: { code: 'ZAR', symbol: 'R', name: 'Rand Sudafricano', rateToEur: 19.80, piRate: 621.90 },
    timezone: 'Africa/Johannesburg',
  },

  // OCEANIA
  {
    code: 'AU',
    code3: 'AUS',
    name: 'Australia',
    nativeName: 'Australia',
    continent: 'Oceania',
    capital: 'Canberra',
    lat: -35.2809,
    lng: 149.1300,
    flag: '🇦🇺',
    language: { code: 'en-AU', name: 'Inglese Australiano', nativeName: 'Australian English', greeting: "G'day! Welcome to Australia!" },
    currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano', rateToEur: 1.65, piRate: 51.80 },
    timezone: 'Australia/Sydney',
    regions: [
      { name: 'New South Wales', capital: 'Sydney', lat: -33.8688, lng: 151.2093 },
      { name: 'Victoria', capital: 'Melbourne', lat: -37.8136, lng: 144.9631 },
      { name: 'Queensland', capital: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    ],
  },
  {
    code: 'NZ',
    code3: 'NZL',
    name: 'Nuova Zelanda',
    nativeName: 'Aotearoa / New Zealand',
    continent: 'Oceania',
    capital: 'Wellington',
    lat: -41.2865,
    lng: 174.7762,
    flag: '🇳🇿',
    language: { code: 'en-NZ', name: 'Inglese / Māori', nativeName: 'English / Te Reo Māori', greeting: 'Haere mai! Welcome to New Zealand!' },
    currency: { code: 'NZD', symbol: 'NZ$', name: 'Dollaro Neozelandese', rateToEur: 1.78, piRate: 55.90 },
    timezone: 'Pacific/Auckland',
  },
  // AFRICA (54 paesi)
  { code: 'NG', code3: 'NGA', name: 'Nigeria', nativeName: 'Nigeria', continent: 'Africa', capital: 'Abuja', lat: 9.082, lng: 8.6753, flag: '🇳🇬', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Nigeria!' }, currency: { code: 'NGN', symbol: '₦', name: 'Naira Nigeriano', rateToEur: 0.0011, piRate: 0.074 }, timezone: 'Africa/Lagos' },
  { code: 'EG', code3: 'EGY', name: 'Egitto', nativeName: 'مصر', continent: 'Africa', capital: 'Il Cairo', lat: 30.0444, lng: 31.2357, flag: '🇪🇬', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في مصر!' }, currency: { code: 'EGP', symbol: 'E£', name: 'Sterlina Egiziana', rateToEur: 0.019, piRate: 1.29 }, timezone: 'Africa/Cairo' },
  { code: 'ZA', code3: 'ZAF', name: 'Sudafrica', nativeName: 'South Africa', continent: 'Africa', capital: 'Pretoria', lat: -25.7461, lng: 28.1881, flag: '🇿🇦', language: { code: 'en-ZA', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to South Africa!' }, currency: { code: 'ZAR', symbol: 'R', name: 'Rand Sudafricano', rateToEur: 0.053, piRate: 3.52 }, timezone: 'Africa/Johannesburg' },
  { code: 'KE', code3: 'KEN', name: 'Kenya', nativeName: 'Kenya', continent: 'Africa', capital: 'Nairobi', lat: -1.2921, lng: 36.8219, flag: '🇰🇪', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Kenya!' }, currency: { code: 'KES', symbol: 'KSh', name: 'Scellino Keniano', rateToEur: 0.0072, piRate: 0.48 }, timezone: 'Africa/Nairobi' },
  { code: 'ET', code3: 'ETH', name: 'Etiopia', nativeName: 'ኢትዮጵያ', continent: 'Africa', capital: 'Addis Abeba', lat: 9.03, lng: 38.74, flag: '🇪🇹', language: { code: 'am', name: 'Amarico', nativeName: 'አማርኛ', greeting: 'እንኳን በደህና መጣህ!' }, currency: { code: 'ETB', symbol: 'Br', name: 'Birr Etiopico', rateToEur: 0.017, piRate: 1.13 }, timezone: 'Africa/Addis_Ababa' },
  { code: 'CD', code3: 'COD', name: 'Repubblica Democratica del Congo', nativeName: 'République démocratique du Congo', continent: 'Africa', capital: 'Kinshasa', lat: -4.4419, lng: 15.2663, flag: '🇨🇩', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue en RDC!' }, currency: { code: 'CDF', symbol: 'FC', name: 'Franco Congolese', rateToEur: 0.0004, piRate: 0.027 }, timezone: 'Africa/Kinshasa' },
  { code: 'CG', code3: 'COG', name: 'Repubblica del Congo', nativeName: 'République du Congo', continent: 'Africa', capital: 'Brazzaville', lat: -4.2634, lng: 15.2429, flag: '🇨🇬', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Congo!' }, currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Brazzaville' },
  { code: 'GH', code3: 'GHA', name: 'Ghana', nativeName: 'Ghana', continent: 'Africa', capital: 'Accra', lat: 5.5600, lng: -0.2000, flag: '🇬🇭', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Ghana!' }, currency: { code: 'GHS', symbol: '₵', name: 'Cedi Ghanese', rateToEur: 0.062, piRate: 4.13 }, timezone: 'Africa/Accra' },
  { code: 'UG', code3: 'UGA', name: 'Uganda', nativeName: 'Uganda', continent: 'Africa', capital: 'Kampala', lat: 0.3476, lng: 32.5825, flag: '🇺🇬', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Uganda!' }, currency: { code: 'UGX', symbol: 'USh', name: 'Scellino Ugandese', rateToEur: 0.00025, piRate: 0.017 }, timezone: 'Africa/Kampala' },
  { code: 'DZ', code3: 'DZA', name: 'Algeria', nativeName: 'الجزائر', continent: 'Africa', capital: 'Algeri', lat: 36.7538, lng: 3.0588, flag: '🇩🇿', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في الجزائر!' }, currency: { code: 'DZD', symbol: 'دج', name: 'Dinaro Algerino', rateToEur: 0.0071, piRate: 0.47 }, timezone: 'Africa/Algiers' },
  { code: 'MA', code3: 'MAR', name: 'Marocco', nativeName: 'المغرب', continent: 'Africa', capital: 'Rabat', lat: 34.0209, lng: -6.8416, flag: '🇲🇦', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في المغرب!' }, currency: { code: 'MAD', symbol: 'د.م.', name: 'Dirham Marocchino', rateToEur: 0.093, piRate: 6.20 }, timezone: 'Africa/Casablanca' },
  { code: 'TN', code3: 'TUN', name: 'Tunisia', nativeName: 'تونس', continent: 'Africa', capital: 'Tunisi', lat: 36.8065, lng: 10.1815, flag: '🇹🇳', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في تونس!' }, currency: { code: 'TND', symbol: 'د.ت', name: 'Dinaro Tunisino', rateToEur: 0.31, piRate: 20.67 }, timezone: 'Africa/Tunis' },
  { code: 'SN', code3: 'SEN', name: 'Senegal', nativeName: 'Sénégal', continent: 'Africa', capital: 'Dakar', lat: 14.7167, lng: -17.4677, flag: '🇸🇳', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Sénégal!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Dakar' },
  { code: 'CM', code3: 'CMR', name: 'Camerun', nativeName: 'Cameroun', continent: 'Africa', capital: 'Yaoundé', lat: 3.8480, lng: 11.5021, flag: '🇨🇲', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Cameroun!' }, currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Douala' },
  { code: 'ML', code3: 'MLI', name: 'Mali', nativeName: 'Mali', continent: 'Africa', capital: 'Bamako', lat: 12.6392, lng: -8.0029, flag: '🇲🇱', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Mali!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Bamako' },
  { code: 'MW', code3: 'MWI', name: 'Malawi', nativeName: 'Malawi', continent: 'Africa', capital: 'Lilongwe', lat: -13.9668, lng: 33.7973, flag: '🇲🇼', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Malawi!' }, currency: { code: 'MWK', symbol: 'MK', name: 'Kwacha Malawiano', rateToEur: 0.00056, piRate: 0.037 }, timezone: 'Africa/Blantyre' },
  { code: 'ZM', code3: 'ZMB', name: 'Zambia', nativeName: 'Zambia', continent: 'Africa', capital: 'Lusaka', lat: -15.4167, lng: 28.2833, flag: '🇿🇲', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Zambia!' }, currency: { code: 'ZMW', symbol: 'K', name: 'Kwacha Zambiano', rateToEur: 0.039, piRate: 2.60 }, timezone: 'Africa/Lusaka' },
  { code: 'ZW', code3: 'ZWE', name: 'Zimbabwe', nativeName: 'Zimbabwe', continent: 'Africa', capital: 'Harare', lat: -17.8252, lng: 31.0335, flag: '🇿🇼', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Zimbabwe!' }, currency: { code: 'ZWL', symbol: 'Z$', name: 'Dollaro dello Zimbabwe', rateToEur: 0.0027, piRate: 0.18 }, timezone: 'Africa/Harare' },
  { code: 'BW', code3: 'BWA', name: 'Botswana', nativeName: 'Botswana', continent: 'Africa', capital: 'Gaborone', lat: -24.6283, lng: 25.9231, flag: '🇧🇼', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Botswana!' }, currency: { code: 'BWP', symbol: 'P', name: 'Pula del Botswana', rateToEur: 0.071, piRate: 4.73 }, timezone: 'Africa/Gaborone' },
  { code: 'NA', code3: 'NAM', name: 'Namibia', nativeName: 'Namibia', continent: 'Africa', capital: 'Windhoek', lat: -22.5609, lng: 17.0658, flag: '🇳🇦', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Namibia!' }, currency: { code: 'NAD', symbol: 'N$', name: 'Dollaro Namibiano', rateToEur: 0.053, piRate: 3.53 }, timezone: 'Africa/Windhoek' },
  { code: 'MZ', code3: 'MOZ', name: 'Mozambico', nativeName: 'Moçambique', continent: 'Africa', capital: 'Maputo', lat: -25.9655, lng: 32.5832, flag: '🇲🇿', language: { code: 'pt', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a Moçambique!' }, currency: { code: 'MZN', symbol: 'MT', name: 'Metical Mozambicano', rateToEur: 0.014, piRate: 0.93 }, timezone: 'Africa/Maputo' },
  { code: 'AGO', code3: 'AGO', name: 'Angola', nativeName: 'Angola', continent: 'Africa', capital: 'Luanda', lat: -8.8136, lng: 13.2303, flag: '🇦🇴', language: { code: 'pt', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a Angola!' }, currency: { code: 'AOA', symbol: 'Kz', name: 'Kwanza Angolano', rateToEur: 0.0010, piRate: 0.067 }, timezone: 'Africa/Luanda' },
  { code: 'CF', code3: 'CAF', name: 'Repubblica Centrafricana', nativeName: 'République centrafricaine', continent: 'Africa', capital: 'Bangui', lat: 4.3692, lng: 18.5591, flag: '🇨🇫', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue en Centrafrique!' }, currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Bangui' },
  { code: 'TD', code3: 'TCD', name: 'Ciad', nativeName: 'Tchad', continent: 'Africa', capital: "N'Djamena", lat: 12.1348, lng: 15.0557, flag: '🇹🇩', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Tchad!' }, currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Ndjamena' },
  { code: 'NE', code3: 'NER', name: 'Niger', nativeName: 'Niger', continent: 'Africa', capital: 'Niamey', lat: 13.5156, lng: 2.1165, flag: '🇳🇪', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Niger!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Niamey' },
  { code: 'BF', code3: 'BFA', name: 'Burkina Faso', nativeName: 'Burkina Faso', continent: 'Africa', capital: 'Ouagadougou', lat: 12.3684, lng: -1.5276, flag: '🇧🇫', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Burkina Faso!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Ouagadougou' },
  { code: 'BJ', code3: 'BEN', name: 'Benin', nativeName: 'Bénin', continent: 'Africa', capital: 'Porto-Novo', lat: 6.4878, lng: 2.6321, flag: '🇧🇯', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Bénin!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Porto-Novo' },
  { code: 'TG', code3: 'TGO', name: 'Togo', nativeName: 'Togo', continent: 'Africa', capital: 'Lomé', lat: 6.1183, lng: 1.2314, flag: '🇹🇬', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Togo!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Lome' },
  { code: 'CI', code3: 'CIV', name: "Costa d'Avorio", nativeName: "Côte d'Ivoire", continent: 'Africa', capital: 'Yamoussoukro', lat: 6.8269, lng: -5.2763, flag: '🇨🇮', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue en Côte d\'Ivoire!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Abidjan' },
  { code: 'LR', code3: 'LBR', name: 'Liberia', nativeName: 'Liberia', continent: 'Africa', capital: 'Monrovia', lat: 6.4763, lng: -10.7666, flag: '🇱🇷', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Liberia!' }, currency: { code: 'LRD', symbol: 'L$', name: 'Dollaro Liberiano', rateToEur: 0.0052, piRate: 0.35 }, timezone: 'Africa/Monrovia' },
  { code: 'SL', code3: 'SLE', name: 'Sierra Leone', nativeName: 'Sierra Leone', continent: 'Africa', capital: 'Freetown', lat: 8.4636, lng: -13.2317, flag: '🇸🇱', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Sierra Leone!' }, currency: { code: 'SLL', symbol: 'Le', name: 'Leone della Sierra Leone', rateToEur: 0.000046, piRate: 0.0031 }, timezone: 'Africa/Freetown' },
  { code: 'GM', code3: 'GMB', name: 'Gambia', nativeName: 'The Gambia', continent: 'Africa', capital: 'Banjul', lat: 13.4542, lng: -16.6580, flag: '🇬🇲', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to The Gambia!' }, currency: { code: 'GMD', symbol: 'D', name: 'Dalasi del Gambia', rateToEur: 0.014, piRate: 0.93 }, timezone: 'Africa/Banjul' },
  { code: 'GW', code3: 'GNB', name: 'Guinea-Bissau', nativeName: 'Guiné-Bissau', continent: 'Africa', capital: 'Bissau', lat: 11.8582, lng: -15.5871, flag: '🇬🇼', language: { code: 'pt', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo à Guiné-Bissau!' }, currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA BCEAO', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Bissau' },
  { code: 'GN', code3: 'GIN', name: 'Guinea', nativeName: 'Guinée', continent: 'Africa', capital: 'Conakry', lat: 9.6412, lng: -13.5784, flag: '🇬🇳', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue en Guinée!' }, currency: { code: 'GNF', symbol: 'FG', name: 'Franco Guineano', rateToEur: 0.00011, piRate: 0.0073 }, timezone: 'Africa/Conakry' },
  { code: 'ST', code3: 'STP', name: 'Sao Tome e Principe', nativeName: 'São Tomé e Príncipe', continent: 'Africa', capital: 'São Tomé', lat: 0.3361, lng: 6.7289, flag: '🇸🇹', language: { code: 'pt', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a São Tomé e Príncipe!' }, currency: { code: 'STN', symbol: 'Db', name: 'Dobra di São Tomé e Príncipe', rateToEur: 0.042, piRate: 2.80 }, timezone: 'Africa/Sao_Tome' },
  { code: 'GA', code3: 'GAB', name: 'Gabon', nativeName: 'Gabon', continent: 'Africa', capital: 'Libreville', lat: 0.4162, lng: 9.4673, flag: '🇬🇦', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Gabon!' }, currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Libreville' },
  { code: 'GQ', code3: 'GNQ', name: 'Guinea Equatoriale', nativeName: 'Guinea Ecuatorial', continent: 'Africa', capital: 'Malabo', lat: 3.7504, lng: 8.7787, flag: '🇬🇶', language: { code: 'es', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Guinea Ecuatorial!' }, currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 0.0015, piRate: 0.10 }, timezone: 'Africa/Malabo' },
  { code: 'ER', code3: 'ERI', name: 'Eritrea', nativeName: 'ኤርትራ', continent: 'Africa', capital: 'Asmara', lat: 15.3229, lng: 38.9251, flag: '🇪🇷', language: { code: 'ti', name: 'Tigrino', nativeName: 'ትግርኛ', greeting: 'እንኳን በደህና መጥብህ!' }, currency: { code: 'ERN', symbol: 'Nfk', name: 'Nakfa Eritreo', rateToEur: 0.062, piRate: 4.13 }, timezone: 'Africa/Asmara' },
  { code: 'DJ', code3: 'DJI', name: 'Gibuti', nativeName: 'Djibouti', continent: 'Africa', capital: 'Gibuti', lat: 11.5875, lng: 43.1451, flag: '🇩🇯', language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue à Djibouti!' }, currency: { code: 'DJF', symbol: 'Fdj', name: 'Franco Gibutiano', rateToEur: 0.0053, piRate: 0.35 }, timezone: 'Africa/Djibouti' },
  { code: 'SS', code3: 'SSD', name: 'Sud Sudan', nativeName: 'South Sudan', continent: 'Africa', capital: 'Juba', lat: 4.8517, lng: 31.5935, flag: '🇸🇸', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to South Sudan!' }, currency: { code: 'SSP', symbol: '£', name: 'Sterlina del Sudan del Sud', rateToEur: 0.00079, piRate: 0.053 }, timezone: 'Africa/Juba' },
  // EUROPA aggiuntiva
  { code: 'AL', code3: 'ALB', name: 'Albania', nativeName: 'Shqipëria', continent: 'Europa', capital: 'Tirana', lat: 41.3275, lng: 19.8187, flag: '🇦🇱', language: { code: 'sq', name: 'Albanese', nativeName: 'Shqip', greeting: 'Mirësevënë në Shqipërinë!' }, currency: { code: 'ALL', symbol: 'L', name: 'Lek Albanese', rateToEur: 0.010, piRate: 0.67 }, timezone: 'Europe/Tirane' },
  { code: 'AD', code3: 'AND', name: 'Andorra', nativeName: 'Andorra', continent: 'Europa', capital: 'Andorra la Vella', lat: 42.5063, lng: 1.5218, flag: '🇦🇩', language: { code: 'ca', name: 'Catalano', nativeName: 'Català', greeting: 'Benvingut a Andorra!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Andorra' },
  { code: 'AT', code3: 'AUT', name: 'Austria', nativeName: 'Österreich', continent: 'Europa', capital: 'Vienna', lat: 48.2082, lng: 16.3738, flag: '🇦🇹', language: { code: 'de', name: 'Tedesco', nativeName: 'Deutsch', greeting: 'Willkommen in Österreich!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Vienna' },
  { code: 'BY', code3: 'BLR', name: 'Bielorussia', nativeName: 'Беларусь', continent: 'Europa', capital: 'Minsk', lat: 53.9045, lng: 27.5615, flag: '🇧🇾', language: { code: 'be', name: 'Bielorusso', nativeName: 'беларуская', greeting: 'Вітаем у Беларусі!' }, currency: { code: 'BYN', symbol: 'Br', name: 'Rublo Bielorusso', rateToEur: 0.39, piRate: 26.00 }, timezone: 'Europe/Minsk' },
  { code: 'BE', code3: 'BEL', name: 'Belgio', nativeName: 'België / Belgique', continent: 'Europa', capital: 'Bruxelles', lat: 50.8503, lng: 4.3517, flag: '🇧🇪', language: { code: 'nl', name: 'Olandese / Francese / Tedesco', nativeName: 'Nederlands / Français / Deutsch', greeting: 'Welkom in België!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Brussels' },
  { code: 'BA', code3: 'BIH', name: 'Bosnia ed Erzegovina', nativeName: 'Bosna i Hercegovina', continent: 'Europa', capital: 'Sarajevo', lat: 43.8563, lng: 18.4131, flag: '🇧🇦', language: { code: 'bs', name: 'Bosniaco', nativeName: 'bosanski', greeting: 'Dobrodošli u Bosni i Hercegovini!' }, currency: { code: 'BAM', symbol: 'KM', name: 'Marco Convertibile', rateToEur: 0.51, piRate: 34.00 }, timezone: 'Europe/Sarajevo' },
  { code: 'BG', code3: 'BGR', name: 'Bulgaria', nativeName: 'България', continent: 'Europa', capital: 'Sofia', lat: 42.6977, lng: 23.3219, flag: '🇧🇬', language: { code: 'bg', name: 'Bulgaro', nativeName: 'български', greeting: 'Добре дошли в България!' }, currency: { code: 'BGN', symbol: 'лв', name: 'Lev Bulgaro', rateToEur: 0.51, piRate: 34.00 }, timezone: 'Europe/Sofia' },
  { code: 'HR', code3: 'HRV', name: 'Croazia', nativeName: 'Hrvatska', continent: 'Europa', capital: 'Zagabria', lat: 45.8150, lng: 15.9819, flag: '🇭🇷', language: { code: 'hr', name: 'Croato', nativeName: 'hrvatski', greeting: 'Dobrodošli u Hrvatskoj!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Zagreb' },
  { code: 'CY', code3: 'CYP', name: 'Cipro', nativeName: 'Κύπρος', continent: 'Europa', capital: 'Nicosia', lat: 35.1856, lng: 33.3823, flag: '🇨🇾', language: { code: 'el', name: 'Greco / Turco', nativeName: 'Ελληνικά / Türkçe', greeting: 'Καλωσήλθατε στην Κύπρο!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Asia/Nicosia' },
  { code: 'CZ', code3: 'CZE', name: 'Repubblica Ceca', nativeName: 'Česká republika', continent: 'Europa', capital: 'Praga', lat: 50.0755, lng: 14.4378, flag: '🇨🇿', language: { code: 'cs', name: 'Ceco', nativeName: 'čeština', greeting: 'Vítejte v České republice!' }, currency: { code: 'CZK', symbol: 'Kč', name: 'Corona Ceco', rateToEur: 0.040, piRate: 2.67 }, timezone: 'Europe/Prague' },
  { code: 'DK', code3: 'DNK', name: 'Danimarca', nativeName: 'Danmark', continent: 'Europa', capital: 'Copenaghen', lat: 55.6761, lng: 12.5683, flag: '🇩🇰', language: { code: 'da', name: 'Danese', nativeName: 'dansk', greeting: 'Velkommen til Danmark!' }, currency: { code: 'DKK', symbol: 'kr', name: 'Corona Danese', rateToEur: 0.13, piRate: 8.67 }, timezone: 'Europe/Copenhagen' },
  { code: 'EE', code3: 'EST', name: 'Estonia', nativeName: 'Eesti', continent: 'Europa', capital: 'Tallinn', lat: 59.4370, lng: 24.7536, flag: '🇪🇪', language: { code: 'et', name: 'Estone', nativeName: 'eesti', greeting: 'Tere tulemast Eestisse!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Tallinn' },
  { code: 'FI', code3: 'FIN', name: 'Finlandia', nativeName: 'Suomi', continent: 'Europa', capital: 'Helsinki', lat: 60.1699, lng: 24.9384, flag: '🇫🇮', language: { code: 'fi', name: 'Finlandese', nativeName: 'suomi', greeting: 'Tervetuloa Suomeen!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Helsinki' },
  { code: 'FR', code3: 'FRA', name: 'Francia', nativeName: 'France', continent: 'Europa', capital: 'Parigi', lat: 48.8566, lng: 2.3522, flag: '🇫🇷', language: { code: 'fr', name: 'Francese', nativeName: 'français', greeting: 'Bienvenue en France!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Paris' },
  { code: 'DE', code3: 'DEU', name: 'Germania', nativeName: 'Deutschland', continent: 'Europa', capital: 'Berlino', lat: 52.5200, lng: 13.4050, flag: '🇩🇪', language: { code: 'de', name: 'Tedesco', nativeName: 'Deutsch', greeting: 'Willkommen in Deutschland!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Berlin' },
  { code: 'GR', code3: 'GRC', name: 'Grecia', nativeName: 'Ελλάδα', continent: 'Europa', capital: 'Atene', lat: 37.9838, lng: 23.7275, flag: '🇬🇷', language: { code: 'el', name: 'Greco', nativeName: 'Ελληνικά', greeting: 'Καλωσήλθατε στην Ελλάδα!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Athens' },
  { code: 'HU', code3: 'HUN', name: 'Ungheria', nativeName: 'Magyarország', continent: 'Europa', capital: 'Budapest', lat: 47.4979, lng: 19.0402, flag: '🇭🇺', language: { code: 'hu', name: 'Ungherese', nativeName: 'magyar', greeting: 'Üdvözöljük Magyarországon!' }, currency: { code: 'HUF', symbol: 'Ft', name: 'Fiorino Ungherese', rateToEur: 0.0026, piRate: 0.17 }, timezone: 'Europe/Budapest' },
  { code: 'IS', code3: 'ISL', name: 'Islanda', nativeName: 'Ísland', continent: 'Europa', capital: 'Reykjavík', lat: 64.1466, lng: -21.9426, flag: '🇮🇸', language: { code: 'is', name: 'Islandese', nativeName: 'Íslenska', greeting: 'Velkomin á Ísland!' }, currency: { code: 'ISK', symbol: 'kr', name: 'Corona Islandese', rateToEur: 0.0068, piRate: 0.45 }, timezone: 'Atlantic/Reykjavik' },
  { code: 'IE', code3: 'IRL', name: 'Irlanda', nativeName: 'Éire / Ireland', continent: 'Europa', capital: 'Dublino', lat: 53.3498, lng: -6.2603, flag: '🇮🇪', language: { code: 'en', name: 'Inglese / Irlandese', nativeName: 'English / Gaeilge', greeting: 'Welcome to Ireland!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Dublin' },
  { code: 'LV', code3: 'LVA', name: 'Lettonia', nativeName: 'Latvija', continent: 'Europa', capital: 'Riga', lat: 56.9496, lng: 24.1052, flag: '🇱🇻', language: { code: 'lv', name: 'Lettone', nativeName: 'latviešu', greeting: 'Laipni lūdzam Latvijā!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Riga' },
  { code: 'LT', code3: 'LTU', name: 'Lituania', nativeName: 'Lietuva', continent: 'Europa', capital: 'Vilnius', lat: 54.6872, lng: 25.2797, flag: '🇱🇹', language: { code: 'lt', name: 'Lituano', nativeName: 'lietuvių', greeting: 'Sveiki atvykę į Lietuvą!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Vilnius' },
  { code: 'LU', code3: 'LUX', name: 'Lussemburgo', nativeName: 'Lëtzebuerg', continent: 'Europa', capital: 'Lussemburgo', lat: 49.8153, lng: 6.1296, flag: '🇱🇺', language: { code: 'lb', name: 'Lussemburghese', nativeName: 'Lëtzebuergesch', greeting: 'Willkomm zu Lëtzebuerg!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Luxembourg' },
  { code: 'MT', code3: 'MLT', name: 'Malta', nativeName: 'Malta', continent: 'Europa', capital: "La Valletta", lat: 35.9375, lng: 14.3754, flag: '🇲🇹', language: { code: 'mt', name: 'Maltese / Inglese', nativeName: 'Malti / English', greeting: 'Merħba f\'Malta!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Malta' },
  { code: 'MD', code3: 'MDA', name: 'Moldavia', nativeName: 'Moldova', continent: 'Europa', capital: 'Chisinau', lat: 47.0105, lng: 28.8638, flag: '🇲🇩', language: { code: 'ro', name: 'Rumeno', nativeName: 'română', greeting: 'Bine ați venit în Moldova!' }, currency: { code: 'MDL', symbol: 'L', name: 'Leu Moldavo', rateToEur: 0.053, piRate: 3.53 }, timezone: 'Europe/Chisinau' },
  { code: 'MC', code3: 'MCO', name: 'Monaco', nativeName: 'Monaco', continent: 'Europa', capital: 'Monaco', lat: 43.7333, lng: 7.4167, flag: '🇲🇨', language: { code: 'fr', name: 'Francese', nativeName: 'français', greeting: 'Bienvenue à Monaco!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Monaco' },
  { code: 'ME', code3: 'MNE', name: 'Montenegro', nativeName: 'Црна Гора', continent: 'Europa', capital: 'Podgorica', lat: 42.4439, lng: 19.2659, flag: '🇲🇪', language: { code: 'sr', name: 'Montenegrino', nativeName: 'crnogorski', greeting: 'Добродошли у Црну Гору!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Podgorica' },
  { code: 'NL', code3: 'NLD', name: 'Paesi Bassi', nativeName: 'Nederland', continent: 'Europa', capital: 'Amsterdam', lat: 52.3676, lng: 4.9041, flag: '🇳🇱', language: { code: 'nl', name: 'Olandese', nativeName: 'Nederlands', greeting: 'Welkom in Nederland!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Amsterdam' },
  { code: 'MK', code3: 'MKD', name: 'Macedonia del Nord', nativeName: 'Северна Македонија', continent: 'Europa', capital: 'Skopje', lat: 42.0037, lng: 21.4273, flag: '🇲🇰', language: { code: 'mk', name: 'Macedone', nativeName: 'македонски', greeting: 'Добредојдете во Северна Македонија!' }, currency: { code: 'MKD', symbol: 'den', name: 'Denar Macedone', rateToEur: 0.016, piRate: 1.07 }, timezone: 'Europe/Skopje' },
  { code: 'NO', code3: 'NOR', name: 'Norvegia', nativeName: 'Norge', continent: 'Europa', capital: 'Oslo', lat: 59.9139, lng: 10.7522, flag: '🇳🇴', language: { code: 'no', name: 'Norvegese', nativeName: 'norsk', greeting: 'Velkommen til Norge!' }, currency: { code: 'NOK', symbol: 'kr', name: 'Corona Norvegese', rateToEur: 0.084, piRate: 5.60 }, timezone: 'Europe/Oslo' },
  { code: 'PL', code3: 'POL', name: 'Polonia', nativeName: 'Polska', continent: 'Europa', capital: 'Varsavia', lat: 52.2297, lng: 21.0122, flag: '🇵🇱', language: { code: 'pl', name: 'Polacco', nativeName: 'polski', greeting: 'Witamy w Polsce!' }, currency: { code: 'PLN', symbol: 'zł', name: 'Zloty Polacco', rateToEur: 0.22, piRate: 14.67 }, timezone: 'Europe/Warsaw' },
  { code: 'PT', code3: 'PRT', name: 'Portogallo', nativeName: 'Portugal', continent: 'Europa', capital: 'Lisbona', lat: 38.7223, lng: -9.1393, flag: '🇵🇹', language: { code: 'pt', name: 'Portoghese', nativeName: 'português', greeting: 'Bem-vindo a Portugal!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Lisbon' },
  { code: 'RO', code3: 'ROU', name: 'Romania', nativeName: 'România', continent: 'Europa', capital: 'Bucarest', lat: 44.4268, lng: 26.1025, flag: '🇷🇴', language: { code: 'ro', name: 'Rumeno', nativeName: 'română', greeting: 'Bine ați venit în România!' }, currency: { code: 'RON', symbol: 'lei', name: 'Leu Romeno', rateToEur: 0.20, piRate: 13.33 }, timezone: 'Europe/Bucharest' },
  { code: 'RS', code3: 'SRB', name: 'Serbia', nativeName: 'Србија', continent: 'Europa', capital: 'Belgrado', lat: 44.7866, lng: 20.4489, flag: '🇷🇸', language: { code: 'sr', name: 'Serbo', nativeName: 'српски', greeting: 'Добродошли у Србију!' }, currency: { code: 'RSD', symbol: 'din', name: 'Dinaro Serbo', rateToEur: 0.0085, piRate: 0.57 }, timezone: 'Europe/Belgrade' },
  { code: 'SK', code3: 'SVK', name: 'Slovacchia', nativeName: 'Slovensko', continent: 'Europa', capital: 'Bratislava', lat: 48.1486, lng: 17.1077, flag: '🇸🇰', language: { code: 'sk', name: 'Slovacco', nativeName: 'slovenčina', greeting: 'Vitajte na Slovensku!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Bratislava' },
  { code: 'SI', code3: 'SVN', name: 'Slovenia', nativeName: 'Slovenija', continent: 'Europa', capital: 'Lubiana', lat: 46.0569, lng: 14.5058, flag: '🇸🇮', language: { code: 'sl', name: 'Sloveno', nativeName: 'slovenščina', greeting: 'Dobrodošli v Sloveniji!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Ljubljana' },
  { code: 'ES', code3: 'ESP', name: 'Spagna', nativeName: 'España', continent: 'Europa', capital: 'Madrid', lat: 40.4168, lng: -3.7038, flag: '🇪🇸', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a España!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Madrid' },
  { code: 'SE', code3: 'SWE', name: 'Svezia', nativeName: 'Sverige', continent: 'Europa', capital: 'Stoccolma', lat: 59.3293, lng: 18.0686, flag: '🇸🇪', language: { code: 'sv', name: 'Svedese', nativeName: 'svenska', greeting: 'Välkommen till Sverige!' }, currency: { code: 'SEK', symbol: 'kr', name: 'Corona Svedese', rateToEur: 0.085, piRate: 5.67 }, timezone: 'Europe/Stockholm' },
  { code: 'CH', code3: 'CHE', name: 'Svizzera', nativeName: 'Schweiz', continent: 'Europa', capital: 'Berna', lat: 46.9480, lng: 7.4474, flag: '🇨🇭', language: { code: 'de', name: 'Tedesco / Francese / Italiano / Romancio', nativeName: 'Deutsch / Français / Italiano / Rumantsch', greeting: 'Willkommen in der Schweiz!' }, currency: { code: 'CHF', symbol: 'CHF', name: 'Franco Svizzero', rateToEur: 1.05, piRate: 70.00 }, timezone: 'Europe/Zurich' },
  { code: 'UA', code3: 'UKR', name: 'Ucraina', nativeName: 'Україна', continent: 'Europa', capital: 'Kiev', lat: 50.4501, lng: 30.5234, flag: '🇺🇦', language: { code: 'uk', name: 'Ucraino', nativeName: 'українська', greeting: 'Ласкаво просимо до України!' }, currency: { code: 'UAH', symbol: '₴', name: 'Grivnia Ucraina', rateToEur: 0.023, piRate: 1.53 }, timezone: 'Europe/Kyiv' },
  { code: 'GB', code3: 'GBR', name: 'Regno Unito', nativeName: 'United Kingdom', continent: 'Europa', capital: 'Londra', lat: 51.5074, lng: -0.1278, flag: '🇬🇧', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to the United Kingdom!' }, currency: { code: 'GBP', symbol: '£', name: 'Sterlina Britannica', rateToEur: 1.17, piRate: 78.00 }, timezone: 'Europe/London' },
  { code: 'VA', code3: 'VAT', name: 'Città del Vaticano', nativeName: 'Vaticano', continent: 'Europa', capital: 'Città del Vaticano', lat: 41.9029, lng: 12.4534, flag: '🇻🇦', language: { code: 'it', name: 'Italiano / Latino', nativeName: 'Italiano / Latine', greeting: 'Benvenuto in Vaticano!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Vatican' },
  { code: 'XK', code3: 'XKX', name: 'Kosovo', nativeName: 'Kosovë / Kosovo', continent: 'Europa', capital: 'Pristina', lat: 42.6629, lng: 21.1655, flag: '🇽🇰', language: { code: 'sq', name: 'Albanese / Serbo', nativeName: 'Shqip / српски', greeting: 'Mirësevënë në Kosovën!' }, currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: 66.67 }, timezone: 'Europe/Belgrade' },
  // ASIA
  { code: 'AF', code3: 'AFG', name: 'Afghanistan', nativeName: 'افغانستان', continent: 'Asia', capital: 'Kabul', lat: 34.5553, lng: 69.2075, flag: '🇦🇫', language: { code: 'ps', name: 'Pashto / Dari', nativeName: 'پښتو / Dari', greeting: 'د افغانستان verle تر پ ک!' }, currency: { code: 'AFN', symbol: '؋', name: 'Afghani Afghano', rateToEur: 0.012, piRate: 0.80 }, timezone: 'Asia/Kabul' },
  { code: 'SA', code3: 'SAU', name: 'Arabia Saudita', nativeName: 'المملكة العربية السعودية', continent: 'Asia', capital: 'Riyadh', lat: 24.7136, lng: 46.6753, flag: '🇸🇦', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في المملكة العربية السعودية!' }, currency: { code: 'SAR', symbol: 'ر.س', name: 'Riyal Saudita', rateToEur: 0.25, piRate: 16.67 }, timezone: 'Asia/Riyadh' },
  { code: 'AZ', code3: 'AZE', name: 'Azerbaigian', nativeName: 'Azərbaycan', continent: 'Asia', capital: 'Baku', lat: 40.4093, lng: 49.8671, flag: '🇦🇿', language: { code: 'az', name: 'Azero', nativeName: 'azərbaycan dili', greeting: 'Xoş gəldiniz, Azərbaycan!' }, currency: { code: 'AZN', symbol: '₼', name: 'Manat Azero', rateToEur: 0.54, piRate: 36.00 }, timezone: 'Asia/Baku' },
  { code: 'BH', code3: 'BHR', name: 'Bahrein', nativeName: 'البحرين', continent: 'Asia', capital: 'Manama', lat: 26.2285, lng: 50.5862, flag: '🇧🇭', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في البحرين!' }, currency: { code: 'BHD', symbol: 'ب.د', name: 'Dinaro Bahreinita', rateToEur: 2.50, piRate: 166.67 }, timezone: 'Asia/Bahrain' },
  { code: 'BN', code3: 'BRN', name: 'Brunei', nativeName: 'Brunei Darussalam', continent: 'Asia', capital: 'Bandar Seri Begawan', lat: 4.8971, lng: 114.9408, flag: '🇧🇳', language: { code: 'ms', name: 'Malese', nativeName: 'Bahasa Melayu', greeting: 'Selamat datang ke Brunei!' }, currency: { code: 'BND', symbol: 'B$', name: 'Dollaro del Brunei', rateToEur: 0.67, piRate: 44.67 }, timezone: 'Asia/Brunei' },
  { code: 'KH', code3: 'KHM', name: 'Cambogia', nativeName: 'Kampuchea', continent: 'Asia', capital: 'Phnom Penh', lat: 11.5625, lng: 104.9161, flag: '🇰🇭', language: { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', greeting: 'សូមស្វាគមន៍មកកាន់កម្ពុជា!' }, currency: { code: 'KHR', symbol: '៛', name: 'Riel Cambogiano', rateToEur: 0.00023, piRate: 0.015 }, timezone: 'Asia/Phnom_Penh' },
  { code: 'CN', code3: 'CHN', name: 'Cina', nativeName: '中国', continent: 'Asia', capital: 'Pechino', lat: 39.9042, lng: 116.4074, flag: '🇨🇳', language: { code: 'zh', name: 'Cinese', nativeName: '中文', greeting: '欢迎来到中国!' }, currency: { code: 'CNY', symbol: '¥', name: 'Renminbi Cinese', rateToEur: 0.13, piRate: 8.67 }, timezone: 'Asia/Shanghai' },
  { code: 'CX', code3: 'CXR', name: 'Isola di Natale', nativeName: 'Christmas Island', continent: 'Asia', capital: 'Flying Fish Cove', lat: -10.4477, lng: 105.6905, flag: '🇨🇽', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Christmas Island!' }, currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano', rateToEur: 0.60, piRate: 40.00 }, timezone: 'Indian/Christmas' },
  { code: 'CC', code3: 'CCK', name: 'Isole Cocos', nativeName: 'Keeling Islands', continent: 'Asia', capital: 'West Island', lat: -12.1674, lng: 96.8341, flag: '🇨🇨', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to the Cocos Islands!' }, currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano', rateToEur: 0.60, piRate: 40.00 }, timezone: 'Indian/Cocos' },
  { code: 'GE', code3: 'GEO', name: 'Georgia', nativeName: 'საქართველო', continent: 'Asia', capital: 'Tbilisi', lat: 41.7167, lng: 44.7838, flag: '🇬🇪', language: { code: 'ka', name: 'Georgiano', nativeName: 'ქართული', greeting: 'გამარჯობა საქართველოში!' }, currency: { code: 'GEL', symbol: '₾', name: 'Lari Georgiano', rateToEur: 0.34, piRate: 22.67 }, timezone: 'Asia/Tbilisi' },
  { code: 'HK', code3: 'HKG', name: 'Hong Kong', nativeName: '香港', continent: 'Asia', capital: 'Hong Kong', lat: 22.3193, lng: 114.1694, flag: '🇭🇰', language: { code: 'zh', name: 'Cinese / Inglese', nativeName: '中文 / English', greeting: '歡迎來到香港!' }, currency: { code: 'HKD', symbol: 'HK$', name: 'Dollaro di Hong Kong', rateToEur: 0.12, piRate: 8.00 }, timezone: 'Asia/Hong_Kong' },
  { code: 'IN', code3: 'IND', name: 'India', nativeName: 'भारत', continent: 'Asia', capital: 'New Delhi', lat: 28.6139, lng: 77.2090, flag: '🇮🇳', language: { code: 'hi', name: 'Hindi / Inglese', nativeName: 'हिन्दी / English', greeting: 'भारत में आपका स्वागत है!' }, currency: { code: 'INR', symbol: '₹', name: 'Rupia Indiana', rateToEur: 0.011, piRate: 0.73 }, timezone: 'Asia/Kolkata' },
  { code: 'ID', code3: 'IDN', name: 'Indonesia', nativeName: 'Indonesia', continent: 'Asia', capital: 'Jakarta', lat: -6.2088, lng: 106.8456, flag: '🇮🇩', language: { code: 'id', name: 'Indonesiano', nativeName: 'Bahasa Indonesia', greeting: 'Selamat datang di Indonesia!' }, currency: { code: 'IDR', symbol: 'Rp', name: 'Rupia Indonesiana', rateToEur: 0.000060, piRate: 0.004 }, timezone: 'Asia/Jakarta' },
  { code: 'IR', code3: 'IRN', name: 'Iran', nativeName: 'ایران', continent: 'Asia', capital: 'Tehran', lat: 35.6892, lng: 51.3890, flag: '🇮🇷', language: { code: 'fa', name: 'Persiano', nativeName: 'فارسی', greeting: 'به ایران خوش آمدید!' }, currency: { code: 'IRR', symbol: '﷼', name: 'Rial Iraniano', rateToEur: 0.0000023, piRate: 0.00015 }, timezone: 'Asia/Tehran' },
  { code: 'IQ', code3: 'IRQ', name: 'Iraq', nativeName: 'العراق', continent: 'Asia', capital: 'Baghdad', lat: 33.3152, lng: 44.3661, flag: '🇮🇶', language: { code: 'ar', name: 'Arabo / Curdo', nativeName: 'العربية / کوردی', greeting: 'أهلاً بك في العراق!' }, currency: { code: 'IQD', symbol: 'ع.د', name: 'Dinaro Iracheno', rateToEur: 0.00072, piRate: 0.048 }, timezone: 'Asia/Baghdad' },
  { code: 'IL', code3: 'ISR', name: 'Israele', nativeName: 'ישראל', continent: 'Asia', capital: 'Gerusalemme', lat: 31.7683, lng: 35.2137, flag: '🇮🇱', language: { code: 'he', name: 'Ebraico / Arabo', nativeName: 'עברית / العربية', greeting: 'ברוכים הבאים לישראל!' }, currency: { code: 'ILS', symbol: '₪', name: 'Nuovo Shekel Israeliano', rateToEur: 0.26, piRate: 17.33 }, timezone: 'Asia/Jerusalem' },
  { code: 'JP', code3: 'JPN', name: 'Giappone', nativeName: '日本', continent: 'Asia', capital: 'Tokyo', lat: 35.6762, lng: 139.6503, flag: '🇯🇵', language: { code: 'ja', name: 'Giapponese', nativeName: '日本語', greeting: '日本へようこそ!' }, currency: { code: 'JPY', symbol: '¥', name: 'Yen Giapponese', rateToEur: 0.0063, piRate: 0.42 }, timezone: 'Asia/Tokyo' },
  { code: 'JO', code3: 'JOR', name: 'Giordania', nativeName: 'الأردن', continent: 'Asia', capital: 'Amman', lat: 31.9454, lng: 35.9284, flag: '🇯🇴', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في الأردن!' }, currency: { code: 'JOD', symbol: 'JD', name: 'Dinaro Giordano', rateToEur: 1.32, piRate: 88.00 }, timezone: 'Asia/Amman' },
  { code: 'KZ', code3: 'KAZ', name: 'Kazakistan', nativeName: 'Қазақстан', continent: 'Asia', capital: 'Astana', lat: 51.1694, lng: 71.4491, flag: '🇰🇿', language: { code: 'kk', name: 'Kazako / Russo', nativeName: 'қазақша / русский', greeting: 'Қазақстанға xerіşתיңыз!' }, currency: { code: 'KZT', symbol: '₸', name: 'Tenge Kazako', rateToEur: 0.0019, piRate: 0.13 }, timezone: 'Asia/Almaty' },
  { code: 'KR', code3: 'KOR', name: 'Corea del Sud', nativeName: '대한민국', continent: 'Asia', capital: 'Seul', lat: 37.5665, lng: 126.9780, flag: '🇰🇷', language: { code: 'ko', name: 'Coreano', nativeName: '한국어', greeting: '대한민국에 오신 것을 환영합니다!' }, currency: { code: 'KRW', symbol: '₩', name: 'Won Sudcoreano', rateToEur: 0.00067, piRate: 0.045 }, timezone: 'Asia/Seoul' },
  { code: 'KW', code3: 'KWT', name: 'Kuwait', nativeName: 'الكويت', continent: 'Asia', capital: 'Kuwait City', lat: 29.3117, lng: 47.4818, flag: '🇰🇼', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في الكويت!' }, currency: { code: 'KWD', symbol: 'ك.د', name: 'Dinaro Kuwaitiano', rateToEur: 3.04, piRate: 202.67 }, timezone: 'Asia/Kuwait' },
  { code: 'LA', code3: 'LAO', name: 'Laos', nativeName: 'ລາວ', continent: 'Asia', capital: 'Vientiane', lat: 17.9657, lng: 102.6123, flag: '🇱🇦', language: { code: 'lo', name: 'Laotiano', nativeName: 'ພາສາລາວ', greeting: 'ຍິນດີຕ້ອນຮັບສູ່ລາວ!' }, currency: { code: 'LAK', symbol: '₭', name: 'Kip Laotiano', rateToEur: 0.000047, piRate: 0.0031 }, timezone: 'Asia/Vientiane' },
  { code: 'LB', code3: 'LBN', name: 'Libano', nativeName: 'لبنان', continent: 'Asia', capital: 'Beirut', lat: 33.8938, lng: 35.5018, flag: '🇱🇧', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في لبنان!' }, currency: { code: 'LBP', symbol: 'ل.ل', name: 'Sterlina Libanese', rateToEur: 0.000060, piRate: 0.004 }, timezone: 'Asia/Beirut' },
  { code: 'MO', code3: 'MAC', name: 'Macao', nativeName: '澳門', continent: 'Asia', capital: 'Macao', lat: 22.1987, lng: 113.5439, flag: '🇲🇴', language: { code: 'zh', name: 'Cinese / Portoghese', nativeName: '中文 / português', greeting: '欢迎来到澳门!' }, currency: { code: 'MOP', symbol: 'MOP$', name: 'Pataca di Macao', rateToEur: 0.12, piRate: 8.00 }, timezone: 'Asia/Macau' },
  { code: 'MY', code3: 'MYS', name: 'Malesia', nativeName: 'Malaysia', continent: 'Asia', capital: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, flag: '🇲🇾', language: { code: 'ms', name: 'Malese', nativeName: 'Bahasa Melayu', greeting: 'Selamat datang ke Malaysia!' }, currency: { code: 'MYR', symbol: 'RM', name: 'Ringgit Malese', rateToEur: 0.20, piRate: 13.33 }, timezone: 'Asia/Kuala_Lumpur' },
  { code: 'MV', code3: 'MDV', name: 'Maldive', nativeName: 'ދިވެހި', continent: 'Asia', capital: 'Malé', lat: 4.1755, lng: 73.5093, flag: '🇲🇻', language: { code: 'dv', name: 'Dhivehi', nativeName: 'ދިވެހި', greeting: 'މިއިލައްކުންލޮއްވެއްގެއްނައް!' }, currency: { code: 'MVR', symbol: 'Rf', name: 'Rufiyaa delle Maldive', rateToEur: 0.061, piRate: 4.07 }, timezone: 'Indian/Maldives' },
  { code: 'MN', code3: 'MNG', name: 'Mongolia', nativeName: 'Монгол', continent: 'Asia', capital: 'Ulaanbaatar', lat: 47.9139, lng: 106.9161, flag: '🇲🇳', language: { code: 'mn', name: 'Mongolo', nativeName: 'монгол', greeting: 'Монгол蒙голд тавт mohiorа!' }, currency: { code: 'MNT', symbol: '₮', name: 'Tugrik Mongolo', rateToEur: 0.00028, piRate: 0.019 }, timezone: 'Asia/Ulaanbaatar' },
  { code: 'MM', code3: 'MMR', name: 'Myanmar', nativeName: 'မြန်မာ', continent: 'Asia', capital: 'Naypyidaw', lat: 19.7633, lng: 96.0785, flag: '🇲🇲', language: { code: 'my', name: 'Birmano', nativeName: 'မြန်မာဘာသာ', greeting: 'მyasi а Georgia!' }, currency: { code: 'MMK', symbol: 'Ks', name: 'Kyat del Myanmar', rateToEur: 0.00045, piRate: 0.030 }, timezone: 'Asia/Yangon' },
  { code: 'NP', code3: 'NPL', name: 'Nepal', nativeName: 'नेपाल', continent: 'Asia', capital: 'Kathmandu', lat: 27.7172, lng: 85.3240, flag: '🇳🇵', language: { code: 'ne', name: 'Nepalese', nativeName: 'नेपाली', greeting: 'नेपालमा तपाईंलाई स्वागत छ!' }, currency: { code: 'NPR', symbol: 'रु', name: 'Rupia Nepalese', rateToEur: 0.0070, piRate: 0.47 }, timezone: 'Asia/Kathmandu' },
  { code: 'OM', code3: 'OMN', name: 'Oman', nativeName: 'عُمان', continent: 'Asia', capital: 'Muscat', lat: 23.5880, lng: 58.3829, flag: '🇴🇲', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في عُمان!' }, currency: { code: 'OMR', symbol: 'ر.ع.', name: 'Rial Omanita', rateToEur: 2.44, piRate: 162.67 }, timezone: 'Asia/Muscat' },
  { code: 'PK', code3: 'PAK', name: 'Pakistan', nativeName: 'پاکستان', continent: 'Asia', capital: 'Islamabad', lat: 33.6844, lng: 73.0479, flag: '🇵🇰', language: { code: 'ur', name: 'Urdu / Inglese', nativeName: 'اردو / English', greeting: 'پاکستان میں خوش آمدید!' }, currency: { code: 'PKR', symbol: '₨', name: 'Rupia Pakistana', rateToEur: 0.0033, piRate: 0.22 }, timezone: 'Asia/Karachi' },
  { code: 'PS', code3: 'PSE', name: 'Palestina', nativeName: 'فلسطين', continent: 'Asia', capital: 'Ramallah', lat: 31.9038, lng: 35.2034, flag: '🇵🇸', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في فلسطين!' }, currency: { code: 'ILS', symbol: '₪', name: 'Nuovo Shekel Israeliano', rateToEur: 0.26, piRate: 17.33 }, timezone: 'Asia/Hebron' },
  { code: 'PH', code3: 'PHL', name: 'Filippine', nativeName: 'Pilipinas', continent: 'Asia', capital: 'Manila', lat: 14.5995, lng: 120.9842, flag: '🇵🇭', language: { code: 'tl', name: 'Filippino / Inglese', nativeName: 'Filipino / English', greeting: 'Maligayang pagdating sa Pilipinas!' }, currency: { code: 'PHP', symbol: '₱', name: 'Peso Filippino', rateToEur: 0.016, piRate: 1.07 }, timezone: 'Asia/Manila' },
  { code: 'QA', code3: 'QAT', name: 'Qatar', nativeName: 'قطر', continent: 'Asia', capital: 'Doha', lat: 25.2867, lng: 51.5331, flag: '🇶🇦', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في قطر!' }, currency: { code: 'QAR', symbol: 'ر.ق', name: 'Rial Qatarino', rateToEur: 0.26, piRate: 17.33 }, timezone: 'Asia/Qatar' },
  { code: 'SG', code3: 'SGP', name: 'Singapore', nativeName: 'Singapore', continent: 'Asia', capital: 'Singapore', lat: 1.3521, lng: 103.8198, flag: '🇸🇬', language: { code: 'en', name: 'Inglese / Cinese / Malese / Tamil', nativeName: 'English / 中文 / Melayu / தமிழ்', greeting: 'Welcome to Singapore!' }, currency: { code: 'SGD', symbol: 'S$', name: 'Dollaro di Singapore', rateToEur: 0.67, piRate: 44.67 }, timezone: 'Asia/Singapore' },
  { code: 'LK', code3: 'LKA', name: 'Sri Lanka', nativeName: 'ශ්‍රී ලංකාව', continent: 'Asia', capital: 'Colombo', lat: 6.9271, lng: 79.8612, flag: '🇱🇰', language: { code: 'si', name: 'Cingalese / Tamil', nativeName: 'සිංහල / தமிழ்', greeting: 'ස්වාගම්!' }, currency: { code: 'LKR', symbol: 'Rs', name: 'Rupia dello Sri Lanka', rateToEur: 0.0031, piRate: 0.21 }, timezone: 'Asia/Colombo' },
  { code: 'SY', code3: 'SYR', name: 'Siria', nativeName: 'سوريا', continent: 'Asia', capital: 'Damasco', lat: 33.5138, lng: 36.2765, flag: '🇸🇾', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في سوريا!' }, currency: { code: 'SYP', symbol: 'ل.س', name: 'Sterlina Siriana', rateToEur: 0.000074, piRate: 0.0049 }, timezone: 'Asia/Damascus' },
  { code: 'TW', code3: 'TWN', name: 'Taiwan', nativeName: '臺灣', continent: 'Asia', capital: 'Taipei', lat: 25.0330, lng: 121.5654, flag: '🇹🇼', language: { code: 'zh', name: 'Cinese', nativeName: '中文', greeting: '歡迎來到臺灣!' }, currency: { code: 'TWD', symbol: 'NT$', name: 'Nuovo Dollaro di Taiwan', rateToEur: 0.029, piRate: 1.93 }, timezone: 'Asia/Taipei' },
  { code: 'TH', code3: 'THA', name: 'Thailandia', nativeName: 'ประเทศไทย', continent: 'Asia', capital: 'Bangkok', lat: 13.7563, lng: 100.5018, flag: '🇹🇭', language: { code: 'th', name: 'Thailandese', nativeName: 'ไทย', greeting: 'ยินดีต้อนรับสู่ประเทศไทย!' }, currency: { code: 'THB', symbol: '฿', name: 'Baht Thailandese', rateToEur: 0.027, piRate: 1.80 }, timezone: 'Asia/Bangkok' },
  { code: 'TR', code3: 'TUR', name: 'Turchia', nativeName: 'Türkiye', continent: 'Asia', capital: 'Ankara', lat: 39.9334, lng: 32.8597, flag: '🇹🇷', language: { code: 'tr', name: 'Turco', nativeName: 'Türkçe', greeting: 'Türkiye\'ye hoş geldiniz!' }, currency: { code: 'TRY', symbol: '₺', name: 'Lira Turca', rateToEur: 0.029, piRate: 1.93 }, timezone: 'Europe/Istanbul' },
  { code: 'AE', code3: 'ARE', name: 'Emirati Arabi Uniti', nativeName: 'الإمارات', continent: 'Asia', capital: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, flag: '🇦🇪', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في الإمارات!' }, currency: { code: 'AED', symbol: 'د.إ', name: 'Dirham degli Emirati', rateToEur: 0.25, piRate: 16.67 }, timezone: 'Asia/Dubai' },
  { code: 'UZ', code3: 'UZB', name: 'Uzbekistan', nativeName: 'Ўзбекистон', continent: 'Asia', capital: 'Tashkent', lat: 41.2995, lng: 69.2401, flag: '🇺🇿', language: { code: 'uz', name: 'Uzbeko', nativeName: 'oʻzbekcha', greeting: 'Xush kelibsiz, Oʻzbekistonga!' }, currency: { code: 'UZS', symbol: "so'm", name: 'Sum Uzbeko', rateToEur: 0.000074, piRate: 0.0049 }, timezone: 'Asia/Tashkent' },
  { code: 'VN', code3: 'VNM', name: 'Vietnam', nativeName: 'Việt Nam', continent: 'Asia', capital: 'Hanoi', lat: 21.0285, lng: 105.8548, flag: '🇻🇳', language: { code: 'vi', name: 'Vietnamita', nativeName: 'Tiếng Việt', greeting: 'Chào mừng bạn đến với Việt Nam!' }, currency: { code: 'VND', symbol: '₫', name: 'Dong Vietnamita', rateToEur: 0.000038, piRate: 0.0025 }, timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'YE', code3: 'YEM', name: 'Yemen', nativeName: 'اليمن', continent: 'Asia', capital: "Sana'a", lat: 15.3562, lng: 44.1951, flag: '🇾🇪', language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بك في اليمن!' }, currency: { code: 'YER', symbol: '﷼', name: 'Rial Yemenita', rateToEur: 0.0037, piRate: 0.25 }, timezone: 'Asia/Aden' },
  // AMERICHE
  { code: 'AR', code3: 'ARG', name: 'Argentina', nativeName: 'Argentina', continent: 'Americhe', capital: 'Buenos Aires', lat: -34.6037, lng: -58.3816, flag: '🇦🇷', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Argentina!' }, currency: { code: 'ARS', symbol: '$', name: 'Peso Argentino', rateToEur: 0.00093, piRate: 0.062 }, timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'BO', code3: 'BOL', name: 'Bolivia', nativeName: 'Bolivia', continent: 'Americhe', capital: 'Sucre', lat: -19.0331, lng: -65.2626, flag: '🇧🇴', language: { code: 'es', name: 'Spagnolo / Quechua / Aymara', nativeName: 'español / quisi / aymar aru', greeting: '¡Bienvenido a Bolivia!' }, currency: { code: 'BOB', symbol: 'Bs.', name: 'Boliviano', rateToEur: 0.13, piRate: 8.67 }, timezone: 'America/La_Paz' },
  { code: 'BR', code3: 'BRA', name: 'Brasile', nativeName: 'Brasil', continent: 'Americhe', capital: 'Brasilia', lat: -15.7942, lng: -47.8822, flag: '🇧🇷', language: { code: 'pt', name: 'Portoghese', nativeName: 'português', greeting: 'Bem-vindo ao Brasil!' }, currency: { code: 'BRL', symbol: 'R$', name: 'Real Brasiliano', rateToEur: 0.17, piRate: 11.33 }, timezone: 'America/Sao_Paulo' },
  { code: 'CA', code3: 'CAN', name: 'Canada', nativeName: 'Canada', continent: 'Americhe', capital: 'Ottawa', lat: 45.4215, lng: -75.6972, flag: '🇨🇦', language: { code: 'en', name: 'Inglese / Francese', nativeName: 'English / français', greeting: 'Welcome to Canada!' }, currency: { code: 'CAD', symbol: 'C$', name: 'Dollaro Canadese', rateToEur: 0.67, piRate: 44.67 }, timezone: 'America/Toronto' },
  { code: 'CL', code3: 'CHL', name: 'Cile', nativeName: 'Chile', continent: 'Americhe', capital: 'Santiago', lat: -33.4489, lng: -70.6693, flag: '🇨🇱', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Chile!' }, currency: { code: 'CLP', symbol: '$', name: 'Peso Cileno', rateToEur: 0.0010, piRate: 0.067 }, timezone: 'America/Santiago' },
  { code: 'CO', code3: 'COL', name: 'Colombia', nativeName: 'Colombia', continent: 'Americhe', capital: 'Bogotà', lat: 4.7110, lng: -74.0721, flag: '🇨🇴', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Colombia!' }, currency: { code: 'COP', symbol: '$', name: 'Peso Colombiano', rateToEur: 0.00022, piRate: 0.015 }, timezone: 'America/Bogota' },
  { code: 'CR', code3: 'CRI', name: 'Costa Rica', nativeName: 'Costa Rica', continent: 'Americhe', capital: 'San José', lat: 9.9281, lng: -84.0907, flag: '🇨🇷', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Costa Rica!' }, currency: { code: 'CRC', symbol: '₡', name: 'Colon Costaricano', rateToEur: 0.0017, piRate: 0.11 }, timezone: 'America/Costa_Rica' },
  { code: 'CU', code3: 'CUB', name: 'Cuba', nativeName: 'Cuba', continent: 'Americhe', capital: "L'Avana", lat: 23.1136, lng: -82.3666, flag: '🇨🇺', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Cuba!' }, currency: { code: 'CUP', symbol: '$', name: 'Peso Cubano', rateToEur: 0.037, piRate: 2.47 }, timezone: 'America/Havana' },
  { code: 'DO', code3: 'DOM', name: 'Repubblica Dominicana', nativeName: 'República Dominicana', continent: 'Americhe', capital: 'Santo Domingo', lat: 18.4861, lng: -69.9312, flag: '🇩🇴', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a República Dominicana!' }, currency: { code: 'DOP', symbol: '$', name: 'Peso Dominicano', rateToEur: 0.015, piRate: 1.00 }, timezone: 'America/Santo_Domingo' },
  { code: 'EC', code3: 'ECU', name: 'Ecuador', nativeName: 'Ecuador', continent: 'Americhe', capital: 'Quito', lat: -0.2295, lng: -78.5243, flag: '🇪🇨', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Ecuador!' }, currency: { code: 'USD', symbol: '$', name: 'Dollaro Statunitense', rateToEur: 0.92, piRate: 61.33 }, timezone: 'America/Guayaquil' },
  { code: 'SV', code3: 'SLV', name: 'El Salvador', nativeName: 'El Salvador', continent: 'Americhe', capital: 'San Salvador', lat: 13.6929, lng: -89.2181, flag: '🇸🇻', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a El Salvador!' }, currency: { code: 'USD', symbol: '$', name: 'Dollaro Statunitense', rateToEur: 0.92, piRate: 61.33 }, timezone: 'America/El_Salvador' },
  { code: 'GT', code3: 'GTM', name: 'Guatemala', nativeName: 'Guatemala', continent: 'Americhe', capital: 'Città del Guatemala', lat: 14.6349, lng: -90.5069, flag: '🇬🇹', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Guatemala!' }, currency: { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco', rateToEur: 0.12, piRate: 8.00 }, timezone: 'America/Guatemala' },
  { code: 'HT', code3: 'HTI', name: 'Haiti', nativeName: 'Haïti', continent: 'Americhe', capital: 'Port-au-Prince', lat: 18.5392, lng: -72.3350, flag: '🇭🇹', language: { code: 'fr', name: 'Francese / Creolo', nativeName: 'français / kreyòl ayisyen', greeting: 'Bienvenue en Haïti!' }, currency: { code: 'HTG', symbol: 'G', name: 'Gourde Haitiano', rateToEur: 0.0072, piRate: 0.48 }, timezone: 'America/Port-au-Prince' },
  { code: 'HN', code3: 'HND', name: 'Honduras', nativeName: 'Honduras', continent: 'Americhe', capital: 'Tegucigalpa', lat: 14.0723, lng: -87.1921, flag: '🇭🇳', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Honduras!' }, currency: { code: 'HNL', symbol: 'L', name: 'Lempira Honduregna', rateToEur: 0.037, piRate: 2.47 }, timezone: 'America/Tegucigalpa' },
  { code: 'MX', code3: 'MEX', name: 'Messico', nativeName: 'México', continent: 'Americhe', capital: 'Città del Messico', lat: 19.4326, lng: -99.1332, flag: '🇲🇽', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a México!' }, currency: { code: 'MXN', symbol: '$', name: 'Peso Messicano', rateToEur: 0.046, piRate: 3.07 }, timezone: 'America/Mexico_City' },
  { code: 'NI', code3: 'NIC', name: 'Nicaragua', nativeName: 'Nicaragua', continent: 'Americhe', capital: 'Managua', lat: 12.1364, lng: -86.2514, flag: '🇳🇮', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Nicaragua!' }, currency: { code: 'NIO', symbol: 'C$', name: 'Cordoba Nicaraguense', rateToEur: 0.025, piRate: 1.67 }, timezone: 'America/Managua' },
  { code: 'PA', code3: 'PAN', name: 'Panama', nativeName: 'Panamá', continent: 'Americhe', capital: 'Città di Panama', lat: 8.9824, lng: -79.5199, flag: '🇵🇦', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Panamá!' }, currency: { code: 'PAB', symbol: 'B/.', name: 'Balboa Panamense', rateToEur: 0.92, piRate: 61.33 }, timezone: 'America/Panama' },
  { code: 'PY', code3: 'PRY', name: 'Paraguay', nativeName: 'Paraguay', continent: 'Americhe', capital: 'Asuncion', lat: -25.2637, lng: -57.5759, flag: '🇵🇾', language: { code: 'es', name: 'Spagnolo / Guaraní', nativeName: 'español / avañe\'ẽ', greeting: '¡Bienvenido a Paraguay!' }, currency: { code: 'PYG', symbol: '₲', name: 'Guaraní Paraguayo', rateToEur: 0.00012, piRate: 0.008 }, timezone: 'America/Asuncion' },
  { code: 'PE', code3: 'PER', name: 'Perù', nativeName: 'Perú', continent: 'Americhe', capital: 'Lima', lat: -12.0464, lng: -77.0428, flag: '🇵🇪', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Perú!' }, currency: { code: 'PEN', symbol: 'S/', name: 'Sol Peruviano', rateToEur: 0.24, piRate: 16.00 }, timezone: 'America/Lima' },
  { code: 'PR', code3: 'PRI', name: 'Porto Rico', nativeName: 'Puerto Rico', continent: 'Americhe', capital: 'San Juan', lat: 18.4655, lng: -66.1057, flag: '🇵🇷', language: { code: 'es', name: 'Spagnolo / Inglese', nativeName: 'español / English', greeting: '¡Bienvenido a Puerto Rico!' }, currency: { code: 'USD', symbol: '$', name: 'Dollaro Statunitense', rateToEur: 0.92, piRate: 61.33 }, timezone: 'America/Puerto_Rico' },
  { code: 'US', code3: 'USA', name: 'Stati Uniti', nativeName: 'United States', continent: 'Americhe', capital: 'Washington D.C.', lat: 38.9072, lng: -77.0369, flag: '🇺🇸', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to the United States!' }, currency: { code: 'USD', symbol: '$', name: 'Dollaro Statunitense', rateToEur: 0.92, piRate: 61.33 }, timezone: 'America/New_York' },
  { code: 'UY', code3: 'URY', name: 'Uruguay', nativeName: 'Uruguay', continent: 'Americhe', capital: 'Montevideo', lat: -34.9011, lng: -56.1645, flag: '🇺🇾', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Uruguay!' }, currency: { code: 'UYU', symbol: '$', name: 'Peso Uruguayo', rateToEur: 0.022, piRate: 1.47 }, timezone: 'America/Montevideo' },
  { code: 'VE', code3: 'VEN', name: 'Venezuela', nativeName: 'Venezuela', continent: 'Americhe', capital: 'Caracas', lat: 10.4806, lng: -66.9036, flag: '🇻🇪', language: { code: 'es', name: 'Spagnolo', nativeName: 'español', greeting: '¡Bienvenido a Venezuela!' }, currency: { code: 'VES', symbol: 'Bs.', name: 'Bolívar Venezuelano', rateToEur: 0.000024, piRate: 0.0016 }, timezone: 'America/Caracas' },
  // OCEANIA
  { code: 'AU', code3: 'AUS', name: 'Australia', nativeName: 'Australia', continent: 'Oceania', capital: 'Canberra', lat: -35.2809, lng: 149.1300, flag: '🇦🇺', language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Australia!' }, currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano', rateToEur: 0.60, piRate: 40.00 }, timezone: 'Australia/Sydney' },
  { code: 'FJ', code3: 'FJI', name: 'Figi', nativeName: 'Viti', continent: 'Oceania', capital: 'Suva', lat: -18.1244, lng: 178.4501, flag: '🇫🇯', language: { code: 'en', name: 'Inglese / Figiano / Hindi', nativeName: 'English / Bau / हिन्दी', greeting: 'Bula vinaka!' }, currency: { code: 'FJD', symbol: 'FJ$', name: 'Dollaro Figiano', rateToEur: 0.42, piRate: 28.00 }, timezone: 'Pacific/Fiji' },
  { code: 'PG', code3: 'PNG', name: 'Papua Nuova Guinea', nativeName: 'Papua Niugini', continent: 'Oceania', capital: 'Port Moresby', lat: -9.4438, lng: 147.1803, flag: '🇵🇬', language: { code: 'en', name: 'Inglese / Tok Pisin / Hiri Motu', nativeName: 'English / Tok Pisin / Hiri Motu', greeting: 'Wokabaut wantaim!' }, currency: { code: 'PGK', symbol: 'K', name: 'Kina della Papua Nuova Guinea', rateToEur: 0.24, piRate: 16.00 }, timezone: 'Pacific/Port_Moresby' },
  { code: 'WS', code3: 'WSM', name: 'Samoa', nativeName: 'Samoa', continent: 'Oceania', capital: 'Apia', lat: -13.8442, lng: -171.7478, flag: '🇼🇸', language: { code: 'sm', name: 'Samoano / Inglese', nativeName: 'gagana fa\'a Sāmoa / English', greeting: 'Talofa lava!' }, currency: { code: 'WST', symbol: 'T', name: 'Tala samoano', rateToEur: 0.33, piRate: 22.00 }, timezone: 'Pacific/Apia' },
  { code: 'TO', code3: 'TON', name: 'Tonga', nativeName: 'Tonga', continent: 'Oceania', capital: "Nuku'alofa", lat: -21.1398, lng: -175.2067, flag: '🇹🇴', language: { code: 'to', name: 'Tongano / Inglese', nativeName: 'lea fakatonga / English', greeting: 'Mālō e lelei!' }, currency: { code: 'TOP', symbol: 'T$', name: "Pa'anga tongano", rateToEur: 0.39, piRate: 26.00 }, timezone: 'Pacific/Tongatapu' },
  { code: 'VU', code3: 'VUT', name: 'Vanuatu', nativeName: 'Vanuatu', continent: 'Oceania', capital: 'Port Vila', lat: -17.6795, lng: 168.3301, flag: '🇻🇺', language: { code: 'bi', name: 'Bislama / Inglese / Francese', nativeName: 'Bislama / English / français', greeting: 'Halo!' }, currency: { code: 'VUV', symbol: 'Vt', name: 'Vatu vanuatuano', rateToEur: 0.0081, piRate: 0.54 }, timezone: 'Pacific/Efate' },
];

// Mappatura rapida per codice paese
export const COUNTRY_BY_CODE = new Map<string, WorldCountry>();
WORLD_COUNTRIES.forEach((c) => {
  COUNTRY_BY_CODE.set(c.code.toUpperCase(), c);
  COUNTRY_BY_CODE.set(c.code3.toUpperCase(), c);
});

// Trova Paese da stringa (nome, codice, città)
export function findCountryByNameOrCode(query: string): WorldCountry | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();

  // Alias espliciti per disambiguazione stretta
  const ALIASES: Record<string, string> = {
    niger: 'NE',
    nigeria: 'NG',
    congo: 'CG',
    'rd congo': 'CD',
    'congo rdc': 'CD',
    'reppubblica democratica del congo': 'CD',
    'united arab emirates': 'AE',
    emirati: 'AE',
  };
  const aliasCode = ALIASES[q];
  if (aliasCode) {
    const byCode = COUNTRY_BY_CODE.get(aliasCode);
    if (byCode) return byCode;
  }

  // Per codice esatto
  const byCode = COUNTRY_BY_CODE.get(q.toUpperCase());
  if (byCode) return byCode;

  // Per nome o native name
  const found = WORLD_COUNTRIES.find(
    (c) =>
      c.name.toLowerCase() === q ||
      c.nativeName.toLowerCase() === q ||
      c.capital.toLowerCase() === q ||
      c.name.toLowerCase().includes(q)
  );
  return found || null;
}

// Struttura Risultato Geocoding Unificato per Qualsiasi Luogo nel Mondo
export interface WorldPlaceResult {
  id: string;
  name: string;
  displayName: string;
  type: 'city' | 'town' | 'village' | 'region' | 'country' | 'state' | 'locality';
  lat: number;
  lng: number;
  countryName: string;
  countryCode: string;
  stateOrRegion: string;
  flag: string;
  language: LocalLanguage;
  currency: LocalCurrency;
  timezone: string;
  greeting: string;
}

// 2. MOTORE DI RICERCA UNIVERSALE: Cerca QUALSIASI città, paese, regione, stato nel mondo
export async function searchAnyWorldPlace(query: string): Promise<WorldPlaceResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  const results: WorldPlaceResult[] = [];
  const qLower = cleanQ.toLowerCase();

  // 1. Controlla prima le corrispondenze nel database locale (istantanee, 0ms di latenza)
  WORLD_COUNTRIES.forEach((c) => {
    // Se corrisponde alla nazione
    if (c.name.toLowerCase().includes(qLower) || c.nativeName.toLowerCase().includes(qLower)) {
      results.push({
        id: `country_${c.code}`,
        name: c.name,
        displayName: `${c.flag} ${c.name} (${c.capital}) - Stato Sovrano`,
        type: 'country',
        lat: c.lat,
        lng: c.lng,
        countryName: c.name,
        countryCode: c.code,
        stateOrRegion: c.capital,
        flag: c.flag,
        language: c.language,
        currency: c.currency,
        timezone: c.timezone,
        greeting: c.language.greeting,
      });
    }

    // Se corrisponde a una delle regioni / province / capitali
    if (c.regions) {
      c.regions.forEach((r) => {
        if (r.name.toLowerCase().includes(qLower) || r.capital.toLowerCase().includes(qLower)) {
          results.push({
            id: `region_${c.code}_${r.name}`,
            name: r.name,
            displayName: `${c.flag} ${r.name}, ${c.name} (Capoluogo: ${r.capital})`,
            type: 'region',
            lat: r.lat,
            lng: r.lng,
            countryName: c.name,
            countryCode: c.code,
            stateOrRegion: r.name,
            flag: c.flag,
            language: c.language,
            currency: c.currency,
            timezone: c.timezone,
            greeting: c.language.greeting,
          });
        }
      });
    }
  });

  // 2. Esegui la geocodifica globale via Photon API (OpenStreetMap - copre ogni singolo paese, città, comune e villaggio del mondo)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&limit=8`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        data.features.forEach((feat: any, idx: number) => {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates;
          if (!coords || coords.length < 2) return;

          const lng = coords[0];
          const lat = coords[1];
          const name = props.name || cleanQ;
          const countryCode = (props.countrycode || '').toUpperCase();
          const countryName = props.country || 'Mondo';
          const state = props.state || props.county || props.district || '';
          const type = props.type || props.osm_value || 'locality';

          // Ricava lingua e valuta dalla nazione
          const matchedCountry = COUNTRY_BY_CODE.get(countryCode) || findCountryByNameOrCode(countryName);

          const flag = matchedCountry?.flag || '🌍';
          const language = matchedCountry?.language || {
            code: 'und',
            name: 'Lingua Locale',
            nativeName: 'Local Language',
            greeting: `Benvenuto a ${name}!`,
          };
          const currency = matchedCountry?.currency || {
            code: 'EUR',
            symbol: '€',
            name: 'Euro / Valuta Globale',
            rateToEur: 1.0,
            piRate: PI_REAL_PRICE_EUR,
          };
          const timezone = matchedCountry?.timezone || 'UTC';

          // Componi l'etichetta descrittiva chiara
          const parts = [flag, name];
          if (state && state !== name) parts.push(state);
          if (countryName && countryName !== name) parts.push(countryName);

          // Evita duplicati identici
          const already = results.some((r) => Math.abs(r.lat - lat) < 0.005 && Math.abs(r.lng - lng) < 0.005);
          if (!already) {
            results.push({
              id: `osm_${props.osm_id || idx}_${name}`,
              name,
              displayName: parts.join(', '),
              type: type as any,
              lat,
              lng,
              countryName,
              countryCode,
              stateOrRegion: state,
              flag,
              language,
              currency,
              timezone,
              greeting: language.greeting,
            });
          }
        });
      }
    }
  } catch (err) {
    // Rete offline o timeout: i risultati locali rimangono validi
  }

  return results.slice(0, 10);
}

// 2B. CALCOLO GEOGRAFICO: Identifica con altissima precisione il Paese più vicino a qualsiasi coordinata (lat, lng) del globo
export function findNearestCountry(lat: number, lng: number): WorldCountry {
  let closest: WorldCountry = WORLD_COUNTRIES[0];
  let minDistance = Infinity;

  // Normalizza la longitudine tra -180 e 180
  const normalizedLng = ((((lng + 180) % 360) + 360) % 360) - 180;

  // Controllo prioritario se le coordinate cadono nel continente africano (lat: -35..37.5, lng: -18..52)
  const isAfricaBounds = lat >= -35.5 && lat <= 38.0 && normalizedLng >= -18.5 && normalizedLng <= 52.0;
  const targetList = isAfricaBounds 
    ? WORLD_COUNTRIES.filter((c) => c.continent === 'Africa')
    : WORLD_COUNTRIES;

  for (const country of (targetList.length > 0 ? targetList : WORLD_COUNTRIES)) {
    if (typeof country.lat !== 'number' || typeof country.lng !== 'number') continue;
    const dLat = (country.lat - lat) * (Math.PI / 180);
    const dLng = (country.lng - normalizedLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) * Math.cos(country.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (c < minDistance) {
      minDistance = c;
      closest = country;
    }
  }

  return closest;
}

// 3. REVERSE GEOCODING AUTOMATICO: Da coordinate (lat, lng) identifica Paese, Regione, Lingua e Valuta
export async function lookupLocationFromCoords(lat: number, lng: number): Promise<WorldPlaceResult> {
  // Risoluzione geografica del Paese più vicino
  const matchedCountry: WorldCountry = findNearestCountry(lat, lng);

  // Tenta geocodifica inversa live precisa con Photon API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const feat = data.features[0];
        const props = feat.properties || {};
        const cCode = (props.countrycode || '').toUpperCase();
        const cName = props.country || 'Mondo';
        const cityName = props.city || props.town || props.village || props.locality || props.name || 'Territorio 3D';
        const stateName = props.state || props.county || '';

        const exactCountry = COUNTRY_BY_CODE.get(cCode) || findCountryByNameOrCode(cName) || matchedCountry;

        const flag = exactCountry?.flag || '📍';
        const language = exactCountry?.language || {
          code: 'und',
          name: 'Lingua Locale',
          nativeName: 'Lingua Locale',
          greeting: `Benvenuto a ${cityName}!`,
        };
        const currency = exactCountry?.currency || {
          code: 'EUR',
          symbol: '€',
          name: 'Euro',
          rateToEur: 1.0,
          piRate: PI_REAL_PRICE_EUR,
        };

        return {
          id: `coord_${lat.toFixed(3)}_${lng.toFixed(3)}`,
          name: cityName,
          displayName: `${flag} ${cityName}${stateName ? `, ${stateName}` : ''}, ${cName}`,
          type: 'city',
          lat,
          lng,
          countryName: cName,
          countryCode: cCode,
          stateOrRegion: stateName,
          flag,
          language,
          currency,
          timezone: exactCountry?.timezone || 'UTC',
          greeting: language.greeting,
        };
      }
    }
  } catch (e) {
    // Ignore, use fallback
  }

  // Fallback garantito sul paese più vicino (MAI default Italia se le coordinate sono in Africa o altrove!)
  const fallbackCountry = matchedCountry || COUNTRY_BY_CODE.get('IT')!;
  return {
    id: `coord_${lat.toFixed(3)}_${lng.toFixed(3)}`,
    name: fallbackCountry.name,
    displayName: `${fallbackCountry.flag} ${fallbackCountry.name} (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
    type: 'country',
    lat,
    lng,
    countryName: fallbackCountry.name,
    countryCode: fallbackCountry.code,
    stateOrRegion: fallbackCountry.capital,
    flag: fallbackCountry.flag,
    language: fallbackCountry.language,
    currency: fallbackCountry.currency,
    timezone: fallbackCountry.timezone,
    greeting: fallbackCountry.language.greeting,
  };
}

// 4. FORMATTATORE DI PREZZO NELLA VALUTA LOCALE CON PI COIN (RIFERIMENTO COINMARKETCAP)
export function formatLocalPrice(
  piAmount: number,
  currency: LocalCurrency
): { piFormatted: string; localFormatted: string; combined: string } {
  const piFormatted = `${Number(piAmount).toFixed(2)} π`;
  // Calcolo reale basato sulla quotazione CoinMarketCap (~0.0674 EUR per Pi)
  const rateInLocalFiat = (currency.rateToEur || 1.0) * PI_REAL_PRICE_EUR;
  const localValue = Number(piAmount * rateInLocalFiat).toFixed(2);
  const localFormatted = `${currency.symbol} ${localValue} ${currency.code}`;
  const combined = `${piFormatted} (≈ ${localFormatted})`;
  return { piFormatted, localFormatted, combined };
}

// 5. ORA LOCALE DEL LUOGO FORMATTATA
export function getLocalTimeString(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch (e) {
    return new Date().toLocaleTimeString('it-IT');
  }
}

/**
 * Valida che una coppia di coordinate lat/lng sia numerica e nei range validi.
 */
export function isValidCoord(lat: number, lng: number): boolean {
  if (lat === 0 && lng === 0) return false; // Null Island non è una coordinata valida
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export interface CountrySelectionResult {
  success: boolean;
  target?: {
    lat: number;
    lng: number;
    zoom?: number;
    name: string;
    countryName?: string;
    code?: string;
  };
  error?: string;
}

export function handleCountrySelection(
  query: string,
  customAtlas?: Record<string, { lat: number; lng: number; zoom?: number }>
): CountrySelectionResult {
  const q = (query || '').trim();
  if (!q) {
    return { success: false, error: 'Query vuota' };
  }

  const qLower = q.toLowerCase();

  // Blocca esplicitamente Null Island (0,0) - nessun fallback silenzioso
  if (qLower === 'nullisland' || qLower === 'null island' || qLower === '(0,0)') {
    throw new Error('Impossibile applicare fallback su Roma: coordinate Null Island (0,0) non valide');
  }

  // Usa atlas custom se fornito
  if (customAtlas) {
    const atlasKey = Object.keys(customAtlas).find((k) => k.toLowerCase() === qLower);
    if (atlasKey) {
      const entry = customAtlas[atlasKey];
      if (entry.lat === 0 && entry.lng === 0) {
        throw new Error('Impossibile applicare fallback su Roma: coordinate Null Island (0,0) non valide');
      }
      return {
        success: true,
        target: {
          lat: entry.lat,
          lng: entry.lng,
          zoom: entry.zoom ?? 5,
          name: atlasKey,
        },
      };
    }
    // Paese inesistente nell'atlas custom → errore, nessun fallback su Roma
    throw new Error(`Impossibile applicare fallback su Roma: paese '${q}' non trovato`);
  }

  // Usa WORLD_COUNTRIES di default
  const country = findCountryByNameOrCode(q);
  if (!country) {
    throw new Error(`Impossibile applicare fallback su Roma: paese '${q}' non trovato`);
  }
  if (country.lat === 0 && country.lng === 0) {
    throw new Error('Impossibile applicare fallback su Roma: coordinate Null Island (0,0) non valide');
  }
  return {
    success: true,
    target: {
      lat: country.lat,
      lng: country.lng,
      zoom: 5,
      name: country.name,
      countryName: country.name,
      code: country.code,
    },
  };
}

export function computeRealPiRate(piAmount: number = 1.0): number {
  return PI_REAL_PRICE_EUR * piAmount;
}
