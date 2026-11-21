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
