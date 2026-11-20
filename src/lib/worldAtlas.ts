// WORLD ATLAS & LOCALIZATION ENGINE
// Database globale completo con ~197 Stati Sovrani e Territori del mondo,
// Regioni, Città, Lingue ufficiali, Valute locali e quotazione Pi Network reale (CoinMarketCap).

import { PI_REAL_PRICE_EUR } from './piRealPriceService';

export { PI_REAL_PRICE_EUR };

export function computeRealPiRate(rateToEur: number): number {
  const safeRate = typeof rateToEur === 'number' && Number.isFinite(rateToEur) && rateToEur > 0 ? rateToEur : 1.0;
  return Number((safeRate * PI_REAL_PRICE_EUR).toFixed(4));
}

export function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

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
  piRate?: number; // Quotazione CoinMarketCap calcolata (rateToEur * PI_REAL_PRICE_EUR)
}

export interface WorldRegion {
  name: string;
  capital: string;
  lat: number;
  lng: number;
}

export interface WorldCountry {
  code: string; // ISO 3166-1 alpha-2
  code3: string; // ISO 3166-1 alpha-3
  name: string;
  nativeName: string;
  continent: 'Europa' | 'Americhe' | 'Asia' | 'Africa' | 'Oceania';
  subContinent?: 'Nord America' | 'Sud America';
  capital: string;
  lat: number;
  lng: number;
  flag: string;
  language: LocalLanguage;
  currency: LocalCurrency;
  timezone: string;
  regions?: WorldRegion[];
}

interface RawWorldCountry extends Omit<WorldCountry, 'currency'> {
  currency: {
    code: string;
    symbol: string;
    name: string;
    rateToEur: number;
    piRate?: number;
  };
}

const RAW_WORLD_COUNTRIES: RawWorldCountry[] = [
  // ============================================================================
  // EUROPA (45 Stati Sovrani + Kosovo)
  // ============================================================================
  {
    code: 'IT', code3: 'ITA', name: 'Italia', nativeName: 'Italia', continent: 'Europa',
    capital: 'Roma', lat: 41.8902, lng: 12.4922, flag: '🇮🇹',
    language: { code: 'it', name: 'Italiano', nativeName: 'Italiano', greeting: 'Benvenuto in Italia!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
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
    code: 'FR', code3: 'FRA', name: 'Francia', nativeName: 'France', continent: 'Europa',
    capital: 'Parigi', lat: 48.8566, lng: 2.3522, flag: '🇫🇷',
    language: { code: 'fr', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue en France !' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
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
    code: 'ES', code3: 'ESP', name: 'Spagna', nativeName: 'España', continent: 'Europa',
    capital: 'Madrid', lat: 40.4168, lng: -3.7038, flag: '🇪🇸',
    language: { code: 'es', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a España!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
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
    code: 'DE', code3: 'DEU', name: 'Germania', nativeName: 'Deutschland', continent: 'Europa',
    capital: 'Berlino', lat: 52.5200, lng: 13.4050, flag: '🇩🇪',
    language: { code: 'de', name: 'Tedesco', nativeName: 'Deutsch', greeting: 'Willkommen in Deutschland!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
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
    code: 'GB', code3: 'GBR', name: 'Regno Unito', nativeName: 'United Kingdom', continent: 'Europa',
    capital: 'Londra', lat: 51.5074, lng: -0.1278, flag: '🇬🇧',
    language: { code: 'en', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to the United Kingdom!' },
    currency: { code: 'GBP', symbol: '£', name: 'Sterlina Britannica', rateToEur: 0.85 },
    timezone: 'Europe/London',
    regions: [
      { name: 'Inghilterra', capital: 'Londra', lat: 51.5074, lng: -0.1278 },
      { name: 'Scozia', capital: 'Edimburgo', lat: 55.9533, lng: -3.1883 },
      { name: 'Galles', capital: 'Cardiff', lat: 51.4816, lng: -3.1791 },
      { name: 'Irlanda del Nord', capital: 'Belfast', lat: 54.5973, lng: -5.9301 },
    ],
  },
  {
    code: 'CH', code3: 'CHE', name: 'Svizzera', nativeName: 'Schweiz / Suisse / Svizzera', continent: 'Europa',
    capital: 'Berna', lat: 46.9480, lng: 7.4474, flag: '🇨🇭',
    language: { code: 'de-CH', name: 'Tedesco / Francese / Italiano', nativeName: 'Deutsch / Français / Italiano', greeting: 'Grüezi / Bienvenue / Benvenuti!' },
    currency: { code: 'CHF', symbol: 'CHF', name: 'Franco Svizzero', rateToEur: 0.96 },
    timezone: 'Europe/Zurich',
    regions: [
      { name: 'Zürich', capital: 'Zurigo', lat: 47.3769, lng: 8.5417 },
      { name: 'Genève', capital: 'Ginevra', lat: 46.2044, lng: 6.1432 },
      { name: 'Ticino', capital: 'Lugano', lat: 46.0037, lng: 8.9511 },
      { name: 'Basel-Stadt', capital: 'Basilea', lat: 47.5596, lng: 7.5886 },
    ],
  },
  {
    code: 'PT', code3: 'PRT', name: 'Portogallo', nativeName: 'Portugal', continent: 'Europa',
    capital: 'Lisbona', lat: 38.7223, lng: -9.1393, flag: '🇵🇹',
    language: { code: 'pt', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a Portugal!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Lisbon',
    regions: [
      { name: 'Lisbona', capital: 'Lisbona', lat: 38.7223, lng: -9.1393 },
      { name: 'Porto', capital: 'Porto', lat: 41.1579, lng: -8.6291 },
      { name: 'Algarve', capital: 'Faro', lat: 37.0194, lng: -7.9304 },
    ],
  },
  {
    code: 'NL', code3: 'NLD', name: 'Paesi Bassi', nativeName: 'Nederland', continent: 'Europa',
    capital: 'Amsterdam', lat: 52.3676, lng: 4.9041, flag: '🇳🇱',
    language: { code: 'nl', name: 'Olandese', nativeName: 'Nederlands', greeting: 'Welkom in Nederland!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Amsterdam',
    regions: [
      { name: 'Noord-Holland', capital: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
      { name: 'Zuid-Holland', capital: "Rotterdam / L'Aia", lat: 51.9244, lng: 4.4777 },
      { name: 'Utrecht', capital: 'Utrecht', lat: 52.0907, lng: 5.1214 },
      { name: 'Noord-Brabant', capital: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
    ],
  },
  {
    code: 'BE', code3: 'BEL', name: 'Belgio', nativeName: 'België / Belgique', continent: 'Europa',
    capital: 'Bruxelles', lat: 50.8503, lng: 4.3517, flag: '🇧🇪',
    language: { code: 'fr-BE', name: 'Francese / Fiammingo', nativeName: 'Français / Nederlands', greeting: 'Bienvenue / Welkom!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Brussels',
    regions: [
      { name: 'Bruxelles-Capitale', capital: 'Bruxelles', lat: 50.8503, lng: 4.3517 },
      { name: 'Fiandre (Vlaanderen)', capital: 'Anversa / Gand', lat: 51.2194, lng: 4.4025 },
      { name: 'Vallonia (Wallonie)', capital: 'Liegi / Namur', lat: 50.6326, lng: 5.5797 },
    ],
  },
  {
    code: 'AT', code3: 'AUT', name: 'Austria', nativeName: 'Österreich', continent: 'Europa',
    capital: 'Vienna', lat: 48.2082, lng: 16.3738, flag: '🇦🇹',
    language: { code: 'de-AT', name: 'Tedesco', nativeName: 'Deutsch', greeting: 'Herzlich willkommen in Österreich!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Vienna',
    regions: [
      { name: 'Wien', capital: 'Vienna', lat: 48.2082, lng: 16.3738 },
      { name: 'Salzburg', capital: 'Salisburgo', lat: 47.8095, lng: 13.0550 },
      { name: 'Tirol', capital: 'Innsbruck', lat: 47.2692, lng: 11.4041 },
      { name: 'Steiermark', capital: 'Graz', lat: 47.0707, lng: 15.4395 },
    ],
  },
  {
    code: 'GR', code3: 'GRC', name: 'Grecia', nativeName: 'Ελλάδα', continent: 'Europa',
    capital: 'Atene', lat: 37.9838, lng: 23.7275, flag: '🇬🇷',
    language: { code: 'el', name: 'Greco', nativeName: 'Ελληνικά', greeting: 'Καλώς ήρθατε στην Ελλάδα!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Athens',
    regions: [
      { name: 'Attica', capital: 'Atene', lat: 37.9838, lng: 23.7275 },
      { name: 'Macedonia Centrale', capital: 'Salonicco', lat: 40.6401, lng: 22.9444 },
      { name: 'Creta', capital: 'Heraklion', lat: 35.3387, lng: 25.1442 },
    ],
  },
  {
    code: 'SE', code3: 'SWE', name: 'Svezia', nativeName: 'Sverige', continent: 'Europa',
    capital: 'Stoccolma', lat: 59.3293, lng: 18.0686, flag: '🇸🇪',
    language: { code: 'sv', name: 'Svedese', nativeName: 'Svenska', greeting: 'Välkommen till Sverige!' },
    currency: { code: 'SEK', symbol: 'kr', name: 'Corona Svedese', rateToEur: 11.45 },
    timezone: 'Europe/Stockholm',
    regions: [
      { name: 'Stockholm', capital: 'Stoccolma', lat: 59.3293, lng: 18.0686 },
      { name: 'Västra Götaland', capital: 'Göteborg', lat: 57.7089, lng: 11.9746 },
      { name: 'Skåne', capital: 'Malmö', lat: 55.6050, lng: 13.0038 },
    ],
  },
  {
    code: 'NO', code3: 'NOR', name: 'Norvegia', nativeName: 'Norge', continent: 'Europa',
    capital: 'Oslo', lat: 59.9139, lng: 10.7522, flag: '🇳🇴',
    language: { code: 'no', name: 'Norvegese', nativeName: 'Norsk', greeting: 'Velkommen til Norge!' },
    currency: { code: 'NOK', symbol: 'kr', name: 'Corona Norvegese', rateToEur: 11.60 },
    timezone: 'Europe/Oslo',
    regions: [
      { name: 'Oslo', capital: 'Oslo', lat: 59.9139, lng: 10.7522 },
      { name: 'Vestland', capital: 'Bergen', lat: 60.3913, lng: 5.3221 },
      { name: 'Trøndelag', capital: 'Trondheim', lat: 63.4305, lng: 10.3951 },
    ],
  },
  {
    code: 'DK', code3: 'DNK', name: 'Danimarca', nativeName: 'Danmark', continent: 'Europa',
    capital: 'Copenaghen', lat: 55.6761, lng: 12.5683, flag: '🇩🇰',
    language: { code: 'da', name: 'Danese', nativeName: 'Dansk', greeting: 'Velkommen til Danmark!' },
    currency: { code: 'DKK', symbol: 'kr.', name: 'Corona Danese', rateToEur: 7.46 },
    timezone: 'Europe/Copenhagen',
    regions: [
      { name: 'Hovedstaden', capital: 'Copenaghen', lat: 55.6761, lng: 12.5683 },
      { name: 'Midtjylland', capital: 'Aarhus', lat: 56.1629, lng: 10.2039 },
      { name: 'Syddanmark', capital: 'Odense', lat: 55.4038, lng: 10.4024 },
    ],
  },
  {
    code: 'FI', code3: 'FIN', name: 'Finlandia', nativeName: 'Suomi', continent: 'Europa',
    capital: 'Helsinki', lat: 60.1699, lng: 24.9384, flag: '🇫🇮',
    language: { code: 'fi', name: 'Finlandese / Svedese', nativeName: 'Suomi', greeting: 'Tervetuloa Suomeen!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Helsinki',
    regions: [
      { name: 'Uusimaa', capital: 'Helsinki', lat: 60.1699, lng: 24.9384 },
      { name: 'Pirkanmaa', capital: 'Tampere', lat: 61.4978, lng: 23.7610 },
    ],
  },
  {
    code: 'IE', code3: 'IRL', name: 'Irlanda', nativeName: 'Éire / Ireland', continent: 'Europa',
    capital: 'Dublino', lat: 53.3498, lng: -6.2603, flag: '🇮🇪',
    language: { code: 'en-IE', name: 'Inglese / Irlandese', nativeName: 'English / Gaeilge', greeting: 'Fáilte go hÉirinn!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Dublin',
    regions: [
      { name: 'Leinster', capital: 'Dublino', lat: 53.3498, lng: -6.2603 },
      { name: 'Munster', capital: 'Cork', lat: 51.8985, lng: -8.4756 },
    ],
  },
  {
    code: 'PL', code3: 'POL', name: 'Polonia', nativeName: 'Polska', continent: 'Europa',
    capital: 'Varsavia', lat: 52.2297, lng: 21.0122, flag: '🇵🇱',
    language: { code: 'pl', name: 'Polacco', nativeName: 'Polski', greeting: 'Witamy w Polsce!' },
    currency: { code: 'PLN', symbol: 'zł', name: 'Złoty Polacco', rateToEur: 4.28 },
    timezone: 'Europe/Warsaw',
    regions: [
      { name: 'Mazowieckie', capital: 'Varsavia', lat: 52.2297, lng: 21.0122 },
      { name: 'Małopolskie', capital: 'Cracovia', lat: 50.0647, lng: 19.9450 },
      { name: 'Pomorskie', capital: 'Danzica', lat: 54.3520, lng: 18.6466 },
    ],
  },
  {
    code: 'CZ', code3: 'CZE', name: 'Repubblica Ceca', nativeName: 'Česko', continent: 'Europa',
    capital: 'Praga', lat: 50.0755, lng: 14.4378, flag: '🇨🇿',
    language: { code: 'cs', name: 'Ceco', nativeName: 'Čeština', greeting: 'Vítejte v Česku!' },
    currency: { code: 'CZK', symbol: 'Kč', name: 'Corona Ceca', rateToEur: 25.2 },
    timezone: 'Europe/Prague',
    regions: [
      { name: 'Praga', capital: 'Praga', lat: 50.0755, lng: 14.4378 },
      { name: 'Moravia Meridionale', capital: 'Brno', lat: 49.1951, lng: 16.6068 },
    ],
  },
  {
    code: 'SK', code3: 'SVK', name: 'Slovacchia', nativeName: 'Slovensko', continent: 'Europa',
    capital: 'Bratislava', lat: 48.1486, lng: 17.1077, flag: '🇸🇰',
    language: { code: 'sk', name: 'Slovacco', nativeName: 'Slovenčina', greeting: 'Vitajte na Slovensku!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Bratislava',
    regions: [
      { name: 'Bratislava', capital: 'Bratislava', lat: 48.1486, lng: 17.1077 },
      { name: 'Košice', capital: 'Košice', lat: 48.7164, lng: 21.2611 },
    ],
  },
  {
    code: 'HU', code3: 'HUN', name: 'Ungheria', nativeName: 'Magyarország', continent: 'Europa',
    capital: 'Budapest', lat: 47.4979, lng: 19.0402, flag: '🇭🇺',
    language: { code: 'hu', name: 'Ungherese', nativeName: 'Magyar', greeting: 'Üdvözöljük Magyarországon!' },
    currency: { code: 'HUF', symbol: 'Ft', name: 'Fiorino Ungherese', rateToEur: 398.0 },
    timezone: 'Europe/Budapest',
    regions: [
      { name: 'Budapest', capital: 'Budapest', lat: 47.4979, lng: 19.0402 },
      { name: 'Hajdú-Bihar', capital: 'Debrecen', lat: 47.5316, lng: 21.6273 },
    ],
  },
  {
    code: 'RO', code3: 'ROU', name: 'Romania', nativeName: 'România', continent: 'Europa',
    capital: 'Bucarest', lat: 44.4268, lng: 26.1025, flag: '🇷🇴',
    language: { code: 'ro', name: 'Rumeno', nativeName: 'Română', greeting: 'Bine ați venit în România!' },
    currency: { code: 'RON', symbol: 'lei', name: 'Leu Rumeno', rateToEur: 4.97 },
    timezone: 'Europe/Bucharest',
    regions: [
      { name: 'București', capital: 'Bucarest', lat: 44.4268, lng: 26.1025 },
      { name: 'Cluj', capital: 'Cluj-Napoca', lat: 46.7712, lng: 23.6236 },
    ],
  },
  {
    code: 'BG', code3: 'BGR', name: 'Bulgaria', nativeName: 'България', continent: 'Europa',
    capital: 'Sofia', lat: 42.6977, lng: 23.3219, flag: '🇧🇬',
    language: { code: 'bg', name: 'Bulgaro', nativeName: 'Български', greeting: 'Добре дошли в България!' },
    currency: { code: 'BGN', symbol: 'лв', name: 'Lev Bulgaro', rateToEur: 1.96 },
    timezone: 'Europe/Sofia',
    regions: [
      { name: 'Sofia', capital: 'Sofia', lat: 42.6977, lng: 23.3219 },
      { name: 'Plovdiv', capital: 'Plovdiv', lat: 42.1354, lng: 24.7453 },
    ],
  },
  {
    code: 'HR', code3: 'HRV', name: 'Croazia', nativeName: 'Hrvatska', continent: 'Europa',
    capital: 'Zagabria', lat: 45.8150, lng: 15.9819, flag: '🇭🇷',
    language: { code: 'hr', name: 'Croato', nativeName: 'Hrvatski', greeting: 'Dobrodošli u Hrvatsku!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Zagreb',
    regions: [
      { name: 'Zagreb', capital: 'Zagabria', lat: 45.8150, lng: 15.9819 },
      { name: 'Dalmazia', capital: 'Spalato', lat: 43.5081, lng: 16.4402 },
    ],
  },
  {
    code: 'SI', code3: 'SVN', name: 'Slovenia', nativeName: 'Slovenija', continent: 'Europa',
    capital: 'Lubiana', lat: 46.0569, lng: 14.5058, flag: '🇸🇮',
    language: { code: 'sl', name: 'Sloveno', nativeName: 'Slovenščina', greeting: 'Dobrodošli v Sloveniji!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Ljubljana',
    regions: [
      { name: 'Osrednjeslovenska', capital: 'Lubiana', lat: 46.0569, lng: 14.5058 },
      { name: 'Podravska', capital: 'Maribor', lat: 46.5547, lng: 15.6459 },
    ],
  },
  {
    code: 'EE', code3: 'EST', name: 'Estonia', nativeName: 'Eesti', continent: 'Europa',
    capital: 'Tallinn', lat: 59.4370, lng: 24.7536, flag: '🇪🇪',
    language: { code: 'et', name: 'Estone', nativeName: 'Eesti', greeting: 'Tere tulemast Eestisse!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Tallinn',
    regions: [{ name: 'Harjumaa', capital: 'Tallinn', lat: 59.4370, lng: 24.7536 }],
  },
  {
    code: 'LV', code3: 'LVA', name: 'Lettonia', nativeName: 'Latvija', continent: 'Europa',
    capital: 'Riga', lat: 56.9496, lng: 24.1052, flag: '🇱🇻',
    language: { code: 'lv', name: 'Lettone', nativeName: 'Latviešu', greeting: 'Laipni lūdzam Latvijā!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Riga',
    regions: [{ name: 'Rīga', capital: 'Riga', lat: 56.9496, lng: 24.1052 }],
  },
  {
    code: 'LT', code3: 'LTU', name: 'Lituania', nativeName: 'Lietuva', continent: 'Europa',
    capital: 'Vilnius', lat: 54.6872, lng: 25.2797, flag: '🇱🇹',
    language: { code: 'lt', name: 'Lituano', nativeName: 'Lietuvių', greeting: 'Sveiki atvykę į Lietuvą!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Vilnius',
    regions: [{ name: 'Vilnius', capital: 'Vilnius', lat: 54.6872, lng: 25.2797 }],
  },
  {
    code: 'LU', code3: 'LUX', name: 'Lussemburgo', nativeName: 'Lëtzebuerg', continent: 'Europa',
    capital: 'Lussemburgo', lat: 49.6116, lng: 6.1319, flag: '🇱🇺',
    language: { code: 'lb', name: 'Lussemburghese / Francese / Tedesco', nativeName: 'Lëtzebuergesch', greeting: 'Wëllkomm zu Lëtzebuerg!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Luxembourg',
    regions: [{ name: 'Luxembourg', capital: 'Lussemburgo', lat: 49.6116, lng: 6.1319 }],
  },
  {
    code: 'MT', code3: 'MLT', name: 'Malta', nativeName: 'Malta', continent: 'Europa',
    capital: 'La Valletta', lat: 35.8989, lng: 14.5146, flag: '🇲🇹',
    language: { code: 'mt', name: 'Maltese / Inglese', nativeName: 'Malti', greeting: 'Merħba f’Malta!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Malta',
    regions: [{ name: 'Valletta', capital: 'La Valletta', lat: 35.8989, lng: 14.5146 }],
  },
  {
    code: 'CY', code3: 'CYP', name: 'Cipro', nativeName: 'Κύπρος / Kıbrıs', continent: 'Europa',
    capital: 'Nicosia', lat: 35.1856, lng: 33.3823, flag: '🇨🇾',
    language: { code: 'el-CY', name: 'Greco / Turco', nativeName: 'Ελληνικά', greeting: 'Καλώς ήρθατε στην Κύπρο!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Asia/Nicosia',
    regions: [{ name: 'Nicosia', capital: 'Nicosia', lat: 35.1856, lng: 33.3823 }],
  },
  {
    code: 'IS', code3: 'ISL', name: 'Islanda', nativeName: 'Ísland', continent: 'Europa',
    capital: 'Reykjavík', lat: 64.1466, lng: -21.9426, flag: '🇮🇸',
    language: { code: 'is', name: 'Islandese', nativeName: 'Íslenska', greeting: 'Velkomin til Íslands!' },
    currency: { code: 'ISK', symbol: 'kr', name: 'Corona Islandese', rateToEur: 149.0 },
    timezone: 'Atlantic/Reykjavik',
    regions: [{ name: 'Höfuðborgarsvæðið', capital: 'Reykjavík', lat: 64.1466, lng: -21.9426 }],
  },
  {
    code: 'UA', code3: 'UKR', name: 'Ucraina', nativeName: 'Україна', continent: 'Europa',
    capital: 'Kiev', lat: 50.4501, lng: 30.5234, flag: '🇺🇦',
    language: { code: 'uk', name: 'Ucraino', nativeName: 'Українська', greeting: 'Ласкаво просимо в Україну!' },
    currency: { code: 'UAH', symbol: '₴', name: 'Grivnia Ucraina', rateToEur: 44.5 },
    timezone: 'Europe/Kyiv',
    regions: [
      { name: 'Kyiv', capital: 'Kiev', lat: 50.4501, lng: 30.5234 },
      { name: 'Lviv', capital: 'Leopoli', lat: 49.8397, lng: 24.0297 },
    ],
  },
  {
    code: 'RU', code3: 'RUS', name: 'Russia', nativeName: 'Россия', continent: 'Europa',
    capital: 'Mosca', lat: 55.7558, lng: 37.6173, flag: '🇷🇺',
    language: { code: 'ru', name: 'Russo', nativeName: 'Русский', greeting: 'Добро пожаловать в Россию!' },
    currency: { code: 'RUB', symbol: '₽', name: 'Rublo Russo', rateToEur: 98.0 },
    timezone: 'Europe/Moscow',
    regions: [
      { name: 'Mosca', capital: 'Mosca', lat: 55.7558, lng: 37.6173 },
      { name: 'San Pietroburgo', capital: 'San Pietroburgo', lat: 59.9311, lng: 30.3609 },
    ],
  },
  {
    code: 'RS', code3: 'SRB', name: 'Serbia', nativeName: 'Србија', continent: 'Europa',
    capital: 'Belgrado', lat: 44.7866, lng: 20.4489, flag: '🇷🇸',
    language: { code: 'sr', name: 'Serbo', nativeName: 'Српски', greeting: 'Добродошли у Србију!' },
    currency: { code: 'RSD', symbol: 'дин', name: 'Dinaro Serbo', rateToEur: 117.1 },
    timezone: 'Europe/Belgrade',
    regions: [{ name: 'Belgrado', capital: 'Belgrado', lat: 44.7866, lng: 20.4489 }],
  },
  {
    code: 'BA', code3: 'BIH', name: 'Bosnia ed Erzegovina', nativeName: 'Bosna i Hercegovina', continent: 'Europa',
    capital: 'Sarajevo', lat: 43.8563, lng: 18.4131, flag: '🇧🇦',
    language: { code: 'bs', name: 'Bosniaco / Croato / Serbo', nativeName: 'Bosanski', greeting: 'Dobrodošli u Bosnu i Hercegovinu!' },
    currency: { code: 'BAM', symbol: 'KM', name: 'Marco Convertibile', rateToEur: 1.96 },
    timezone: 'Europe/Sarajevo',
    regions: [{ name: 'Sarajevo', capital: 'Sarajevo', lat: 43.8563, lng: 18.4131 }],
  },
  {
    code: 'ME', code3: 'MNE', name: 'Montenegro', nativeName: 'Crna Gora', continent: 'Europa',
    capital: 'Podgorica', lat: 42.4304, lng: 19.2594, flag: '🇲🇪',
    language: { code: 'sr-ME', name: 'Montenegrino', nativeName: 'Crnogorski', greeting: 'Dobrodošli u Crnu Goru!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Podgorica',
    regions: [{ name: 'Podgorica', capital: 'Podgorica', lat: 42.4304, lng: 19.2594 }],
  },
  {
    code: 'MK', code3: 'MKD', name: 'Macedonia del Nord', nativeName: 'Северна Македонија', continent: 'Europa',
    capital: 'Skopje', lat: 41.9981, lng: 21.4254, flag: '🇲🇰',
    language: { code: 'mk', name: 'Macedone', nativeName: 'Македонски', greeting: 'Добредојдовте во Македонија!' },
    currency: { code: 'MKD', symbol: 'ден', name: 'Dinaro Macedone', rateToEur: 61.5 },
    timezone: 'Europe/Skopje',
    regions: [{ name: 'Skopje', capital: 'Skopje', lat: 41.9981, lng: 21.4254 }],
  },
  {
    code: 'AL', code3: 'ALB', name: 'Albania', nativeName: 'Shqipëria', continent: 'Europa',
    capital: 'Tirana', lat: 41.3275, lng: 19.8187, flag: '🇦🇱',
    language: { code: 'sq', name: 'Albanese', nativeName: 'Shqip', greeting: 'Mirë se vini në Shqipëri!' },
    currency: { code: 'ALL', symbol: 'L', name: 'Lek Albanese', rateToEur: 99.5 },
    timezone: 'Europe/Tirane',
    regions: [
      { name: 'Tirana', capital: 'Tirana', lat: 41.3275, lng: 19.8187 },
      { name: 'Durrës', capital: 'Durazzo', lat: 41.3246, lng: 19.4565 },
    ],
  },
  {
    code: 'XK', code3: 'XKX', name: 'Kosovo', nativeName: 'Kosova', continent: 'Europa',
    capital: 'Pristina', lat: 42.6629, lng: 21.1655, flag: '🇽🇰',
    language: { code: 'sq-XK', name: 'Albanese / Serbo', nativeName: 'Shqip', greeting: 'Mirë se vini në Kosovë!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Belgrade',
    regions: [{ name: 'Prishtinë', capital: 'Pristina', lat: 42.6629, lng: 21.1655 }],
  },
  {
    code: 'MD', code3: 'MDA', name: 'Moldavia', nativeName: 'Moldova', continent: 'Europa',
    capital: 'Chișinău', lat: 47.0105, lng: 28.8638, flag: '🇲🇩',
    language: { code: 'ro-MD', name: 'Rumeno', nativeName: 'Română', greeting: 'Bine ați venit în Moldova!' },
    currency: { code: 'MDL', symbol: 'L', name: 'Leu Moldavo', rateToEur: 19.2 },
    timezone: 'Europe/Chisinau',
    regions: [{ name: 'Chișinău', capital: 'Chișinău', lat: 47.0105, lng: 28.8638 }],
  },
  {
    code: 'BY', code3: 'BLR', name: 'Bielorussia', nativeName: 'Беларусь', continent: 'Europa',
    capital: 'Minsk', lat: 53.9006, lng: 27.5590, flag: '🇧🇾',
    language: { code: 'be', name: 'Bielorusso / Russo', nativeName: 'Беларуская', greeting: 'Сардэчна запрашаем у Беларусь!' },
    currency: { code: 'BYN', symbol: 'Br', name: 'Rublo Bielorusso', rateToEur: 3.55 },
    timezone: 'Europe/Minsk',
    regions: [{ name: 'Minsk', capital: 'Minsk', lat: 53.9006, lng: 27.5590 }],
  },
  {
    code: 'AD', code3: 'AND', name: 'Andorra', nativeName: 'Andorra', continent: 'Europa',
    capital: 'Andorra la Vella', lat: 42.5063, lng: 1.5218, flag: '🇦🇩',
    language: { code: 'ca', name: 'Catalano', nativeName: 'Català', greeting: 'Benvinguts a Andorra!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Andorra',
  },
  {
    code: 'MC', code3: 'MCO', name: 'Monaco', nativeName: 'Monaco', continent: 'Europa',
    capital: 'Monaco', lat: 43.7384, lng: 7.4246, flag: '🇲🇨',
    language: { code: 'fr-MC', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue à Monaco !' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Monaco',
  },
  {
    code: 'SM', code3: 'SMR', name: 'San Marino', nativeName: 'San Marino', continent: 'Europa',
    capital: 'San Marino', lat: 43.9424, lng: 12.4578, flag: '🇸🇲',
    language: { code: 'it-SM', name: 'Italiano', nativeName: 'Italiano', greeting: 'Benvenuti a San Marino!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/San_Marino',
  },
  {
    code: 'LI', code3: 'LIE', name: 'Liechtenstein', nativeName: 'Liechtenstein', continent: 'Europa',
    capital: 'Vaduz', lat: 47.1410, lng: 9.5209, flag: '🇱🇮',
    language: { code: 'de-LI', name: 'Tedesco', nativeName: 'Deutsch', greeting: 'Willkommen in Liechtenstein!' },
    currency: { code: 'CHF', symbol: 'CHF', name: 'Franco Svizzero', rateToEur: 0.96 },
    timezone: 'Europe/Vaduz',
  },
  {
    code: 'VA', code3: 'VAT', name: 'Città del Vaticano', nativeName: 'Status Civitatis Vaticanae', continent: 'Europa',
    capital: 'Città del Vaticano', lat: 41.9029, lng: 12.4534, flag: '🇻🇦',
    language: { code: 'it-VA', name: 'Italiano / Latino', nativeName: 'Italiano / Latina', greeting: 'Salve!' },
    currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0 },
    timezone: 'Europe/Vatican',
  },

  // ============================================================================
  // AMERICHE (35 Stati Sovrani: 23 Nord/Centro/Caraibi + 12 Sud America)
  // ============================================================================
  {
    code: 'US', code3: 'USA', name: 'Stati Uniti', nativeName: 'United States of America',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Washington D.C.', lat: 38.9072, lng: -77.0369, flag: '🇺🇸',
    language: { code: 'en-US', name: 'Inglese USA', nativeName: 'American English', greeting: 'Welcome to the United States!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro Statunitense', rateToEur: 1.08 },
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
    code: 'CA', code3: 'CAN', name: 'Canada', nativeName: 'Canada',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Ottawa', lat: 45.4215, lng: -75.6972, flag: '🇨🇦',
    language: { code: 'en-CA', name: 'Inglese / Francese', nativeName: 'English / Français', greeting: 'Welcome to Canada / Bienvenue au Canada!' },
    currency: { code: 'CAD', symbol: 'CA$', name: 'Dollaro Canadese', rateToEur: 1.48 },
    timezone: 'America/Toronto',
    regions: [
      { name: 'Ontario', capital: 'Toronto', lat: 43.6532, lng: -79.3832 },
      { name: 'Québec', capital: 'Montréal', lat: 45.5017, lng: -73.5673 },
      { name: 'British Columbia', capital: 'Vancouver', lat: 49.2827, lng: -123.1207 },
    ],
  },
  {
    code: 'MX', code3: 'MEX', name: 'Messico', nativeName: 'México',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Città del Messico', lat: 19.4326, lng: -99.1332, flag: '🇲🇽',
    language: { code: 'es-MX', name: 'Spagnolo Messicano', nativeName: 'Español', greeting: '¡Bienvenido a México!' },
    currency: { code: 'MXN', symbol: '$', name: 'Peso Messicano', rateToEur: 21.50 },
    timezone: 'America/Mexico_City',
    regions: [
      { name: 'Ciudad de México', capital: 'Città del Messico', lat: 19.4326, lng: -99.1332 },
      { name: 'Jalisco', capital: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
      { name: 'Nuevo León', capital: 'Monterrey', lat: 25.6866, lng: -100.3161 },
      { name: 'Quintana Roo', capital: 'Cancún', lat: 21.1619, lng: -86.8515 },
    ],
  },
  {
    code: 'GT', code3: 'GTM', name: 'Guatemala', nativeName: 'Guatemala',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Città del Guatemala', lat: 14.6349, lng: -90.5069, flag: '🇬🇹',
    language: { code: 'es-GT', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Guatemala!' },
    currency: { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco', rateToEur: 8.35 },
    timezone: 'America/Guatemala',
  },
  {
    code: 'BZ', code3: 'BLZ', name: 'Belize', nativeName: 'Belize',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Belmopan', lat: 17.2510, lng: -88.7590, flag: '🇧🇿',
    language: { code: 'en-BZ', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Belize!' },
    currency: { code: 'BZD', symbol: 'BZ$', name: 'Dollaro del Belize', rateToEur: 2.16 },
    timezone: 'America/Belize',
  },
  {
    code: 'HN', code3: 'HND', name: 'Honduras', nativeName: 'Honduras',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Tegucigalpa', lat: 14.0723, lng: -87.1921, flag: '🇭🇳',
    language: { code: 'es-HN', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Honduras!' },
    currency: { code: 'HNL', symbol: 'L', name: 'Lempira Honduregna', rateToEur: 26.8 },
    timezone: 'America/Tegucigalpa',
  },
  {
    code: 'SV', code3: 'SLV', name: 'El Salvador', nativeName: 'El Salvador',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'San Salvador', lat: 13.6929, lng: -89.2182, flag: '🇸🇻',
    language: { code: 'es-SV', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a El Salvador!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro USA', rateToEur: 1.08 },
    timezone: 'America/El_Salvador',
  },
  {
    code: 'NI', code3: 'NIC', name: 'Nicaragua', nativeName: 'Nicaragua',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Managua', lat: 12.1150, lng: -86.2362, flag: '🇳🇮',
    language: { code: 'es-NI', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Nicaragua!' },
    currency: { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaraguense', rateToEur: 39.8 },
    timezone: 'America/Managua',
  },
  {
    code: 'CR', code3: 'CRI', name: 'Costa Rica', nativeName: 'Costa Rica',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'San José', lat: 9.9281, lng: -84.0907, flag: '🇨🇷',
    language: { code: 'es-CR', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Pura Vida! Bienvenido a Costa Rica!' },
    currency: { code: 'CRC', symbol: '₡', name: 'Colón Costaricano', rateToEur: 555.0 },
    timezone: 'America/Costa_Rica',
  },
  {
    code: 'PA', code3: 'PAN', name: 'Panama', nativeName: 'Panamá',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Città di Panama', lat: 8.9824, lng: -79.5199, flag: '🇵🇦',
    language: { code: 'es-PA', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Panamá!' },
    currency: { code: 'PAB', symbol: 'B/.', name: 'Balboa / USD', rateToEur: 1.08 },
    timezone: 'America/Panama',
  },
  {
    code: 'CU', code3: 'CUB', name: 'Cuba', nativeName: 'Cuba',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'L’Avana', lat: 23.1136, lng: -82.3666, flag: '🇨🇺',
    language: { code: 'es-CU', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Cuba!' },
    currency: { code: 'CUP', symbol: '$', name: 'Peso Cubano', rateToEur: 26.0 },
    timezone: 'America/Havana',
  },
  {
    code: 'JM', code3: 'JAM', name: 'Giamaica', nativeName: 'Jamaica',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Kingston', lat: 18.0179, lng: -76.8099, flag: '🇯🇲',
    language: { code: 'en-JM', name: 'Inglese', nativeName: 'English', greeting: 'Wah gwaan! Welcome to Jamaica!' },
    currency: { code: 'JMD', symbol: 'J$', name: 'Dollaro Giamaicano', rateToEur: 169.0 },
    timezone: 'America/Jamaica',
  },
  {
    code: 'HT', code3: 'HTI', name: 'Haiti', nativeName: 'Haïti',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Port-au-Prince', lat: 18.5944, lng: -72.3074, flag: '🇭🇹',
    language: { code: 'fr-HT', name: 'Francese / Creolo', nativeName: 'Français / Kreyòl', greeting: 'Byenvini an Ayiti!' },
    currency: { code: 'HTG', symbol: 'G', name: 'Gourde Haitiano', rateToEur: 142.0 },
    timezone: 'America/Port-au-Prince',
  },
  {
    code: 'DO', code3: 'DOM', name: 'Repubblica Dominicana', nativeName: 'República Dominicana',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Santo Domingo', lat: 18.4861, lng: -69.9312, flag: '🇩🇴',
    language: { code: 'es-DO', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a República Dominicana!' },
    currency: { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano', rateToEur: 64.5 },
    timezone: 'America/Santo_Domingo',
  },
  {
    code: 'BS', code3: 'BHS', name: 'Bahamas', nativeName: 'The Bahamas',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Nassau', lat: 25.0343, lng: -77.3963, flag: '🇧🇸',
    language: { code: 'en-BS', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to The Bahamas!' },
    currency: { code: 'BSD', symbol: 'B$', name: 'Dollaro delle Bahamas', rateToEur: 1.08 },
    timezone: 'America/Nassau',
  },
  {
    code: 'BB', code3: 'BRB', name: 'Barbados', nativeName: 'Barbados',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Bridgetown', lat: 13.1132, lng: -59.5988, flag: '🇧🇧',
    language: { code: 'en-BB', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Barbados!' },
    currency: { code: 'BBD', symbol: 'Bds$', name: 'Dollaro di Barbados', rateToEur: 2.16 },
    timezone: 'America/Barbados',
  },
  {
    code: 'TT', code3: 'TTO', name: 'Trinidad e Tobago', nativeName: 'Trinidad and Tobago',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Port of Spain', lat: 10.6549, lng: -61.5019, flag: '🇹🇹',
    language: { code: 'en-TT', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Trinidad and Tobago!' },
    currency: { code: 'TTD', symbol: 'TT$', name: 'Dollaro di Trinidad e Tobago', rateToEur: 7.32 },
    timezone: 'America/Port_of_Spain',
  },
  {
    code: 'LC', code3: 'LCA', name: 'Saint Lucia', nativeName: 'Saint Lucia',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Castries', lat: 14.0101, lng: -60.9875, flag: '🇱🇨',
    language: { code: 'en-LC', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Saint Lucia!' },
    currency: { code: 'XCD', symbol: 'EC$', name: 'Dollaro dei Caraibi Orientali', rateToEur: 2.92 },
    timezone: 'America/St_Lucia',
  },
  {
    code: 'GD', code3: 'GRD', name: 'Grenada', nativeName: 'Grenada',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: "Saint George's", lat: 12.0561, lng: -61.7488, flag: '🇬🇩',
    language: { code: 'en-GD', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Grenada!' },
    currency: { code: 'XCD', symbol: 'EC$', name: 'Dollaro dei Caraibi Orientali', rateToEur: 2.92 },
    timezone: 'America/Grenada',
  },
  {
    code: 'VC', code3: 'VCT', name: 'Saint Vincent e Grenadine', nativeName: 'Saint Vincent and the Grenadines',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Kingstown', lat: 13.1587, lng: -61.2248, flag: '🇻🇨',
    language: { code: 'en-VC', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Saint Vincent!' },
    currency: { code: 'XCD', symbol: 'EC$', name: 'Dollaro dei Caraibi Orientali', rateToEur: 2.92 },
    timezone: 'America/St_Vincent',
  },
  {
    code: 'AG', code3: 'ATG', name: 'Antigua e Barbuda', nativeName: 'Antigua and Barbuda',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: "Saint John's", lat: 17.1274, lng: -61.8468, flag: '🇦🇬',
    language: { code: 'en-AG', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Antigua and Barbuda!' },
    currency: { code: 'XCD', symbol: 'EC$', name: 'Dollaro dei Caraibi Orientali', rateToEur: 2.92 },
    timezone: 'America/Antigua',
  },
  {
    code: 'DM', code3: 'DMA', name: 'Dominica', nativeName: 'Dominica',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Roseau', lat: 15.3092, lng: -61.3794, flag: '🇩🇲',
    language: { code: 'en-DM', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Dominica!' },
    currency: { code: 'XCD', symbol: 'EC$', name: 'Dollaro dei Caraibi Orientali', rateToEur: 2.92 },
    timezone: 'America/Dominica',
  },
  {
    code: 'KN', code3: 'KNA', name: 'Saint Kitts e Nevis', nativeName: 'Saint Kitts and Nevis',
    continent: 'Americhe', subContinent: 'Nord America',
    capital: 'Basseterre', lat: 17.3026, lng: -62.7177, flag: '🇰🇳',
    language: { code: 'en-KN', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Saint Kitts and Nevis!' },
    currency: { code: 'XCD', symbol: 'EC$', name: 'Dollaro dei Caraibi Orientali', rateToEur: 2.92 },
    timezone: 'America/St_Kitts',
  },
  // SUD AMERICA (12 Stati Sovrani)
  {
    code: 'BR', code3: 'BRA', name: 'Brasile', nativeName: 'Brasil',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Brasília', lat: -15.8267, lng: -47.9218, flag: '🇧🇷',
    language: { code: 'pt-BR', name: 'Portoghese Brasiliano', nativeName: 'Português do Brasil', greeting: 'Bem-vindo ao Brasil!' },
    currency: { code: 'BRL', symbol: 'R$', name: 'Real Brasiliano', rateToEur: 6.02 },
    timezone: 'America/Sao_Paulo',
    regions: [
      { name: 'São Paulo', capital: 'São Paulo', lat: -23.5505, lng: -46.6333 },
      { name: 'Rio de Janeiro', capital: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    ],
  },
  {
    code: 'AR', code3: 'ARG', name: 'Argentina', nativeName: 'Argentina',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Buenos Aires', lat: -34.6037, lng: -58.3816, flag: '🇦🇷',
    language: { code: 'es-AR', name: 'Spagnolo Argentino', nativeName: 'Español', greeting: '¡Bienvenido a la Argentina!' },
    currency: { code: 'ARS', symbol: '$', name: 'Peso Argentino', rateToEur: 1050.0 },
    timezone: 'America/Argentina/Buenos_Aires',
    regions: [
      { name: 'Buenos Aires', capital: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
      { name: 'Córdoba', capital: 'Córdoba', lat: -31.4201, lng: -64.1888 },
      { name: 'Mendoza', capital: 'Mendoza', lat: -32.8895, lng: -68.8458 },
    ],
  },
  {
    code: 'CO', code3: 'COL', name: 'Colombia', nativeName: 'Colombia',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Bogotà', lat: 4.7110, lng: -74.0721, flag: '🇨🇴',
    language: { code: 'es-CO', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Colombia!' },
    currency: { code: 'COP', symbol: '$', name: 'Peso Colombiano', rateToEur: 4550.0 },
    timezone: 'America/Bogota',
    regions: [
      { name: 'Bogotá D.C.', capital: 'Bogotà', lat: 4.7110, lng: -74.0721 },
      { name: 'Antioquia', capital: 'Medellín', lat: 6.2442, lng: -75.5812 },
    ],
  },
  {
    code: 'CL', code3: 'CHL', name: 'Cile', nativeName: 'Chile',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Santiago', lat: -33.4489, lng: -70.6693, flag: '🇨🇱',
    language: { code: 'es-CL', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Chile!' },
    currency: { code: 'CLP', symbol: '$', name: 'Peso Cileno', rateToEur: 1020.0 },
    timezone: 'America/Santiago',
    regions: [
      { name: 'Santiago', capital: 'Santiago', lat: -33.4489, lng: -70.6693 },
      { name: 'Valparaíso', capital: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
    ],
  },
  {
    code: 'PE', code3: 'PER', name: 'Perù', nativeName: 'Perú',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Lima', lat: -12.0464, lng: -77.0428, flag: '🇵🇪',
    language: { code: 'es-PE', name: 'Spagnolo / Quechua', nativeName: 'Español', greeting: '¡Bienvenido al Perú!' },
    currency: { code: 'PEN', symbol: 'S/', name: 'Sol Peruviano', rateToEur: 4.05 },
    timezone: 'America/Lima',
    regions: [
      { name: 'Lima', capital: 'Lima', lat: -12.0464, lng: -77.0428 },
      { name: 'Cusco', capital: 'Cusco', lat: -13.5319, lng: -71.9675 },
    ],
  },
  {
    code: 'VE', code3: 'VEN', name: 'Venezuela', nativeName: 'Venezuela',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Caracas', lat: 10.4806, lng: -66.9036, flag: '🇻🇪',
    language: { code: 'es-VE', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Venezuela!' },
    currency: { code: 'VES', symbol: 'Bs.', name: 'Bolívar Venezuelano', rateToEur: 49.0 },
    timezone: 'America/Caracas',
  },
  {
    code: 'EC', code3: 'ECU', name: 'Ecuador', nativeName: 'Ecuador',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Quito', lat: -0.1807, lng: -78.4678, flag: '🇪🇨',
    language: { code: 'es-EC', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Ecuador!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro USA', rateToEur: 1.08 },
    timezone: 'America/Guayaquil',
  },
  {
    code: 'BO', code3: 'BOL', name: 'Bolivia', nativeName: 'Bolivia',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'La Paz / Sucre', lat: -16.4897, lng: -68.1193, flag: '🇧🇴',
    language: { code: 'es-BO', name: 'Spagnolo / Quechua / Aymara', nativeName: 'Español', greeting: '¡Bienvenido a Bolivia!' },
    currency: { code: 'BOB', symbol: 'Bs.', name: 'Boliviano', rateToEur: 7.46 },
    timezone: 'America/La_Paz',
  },
  {
    code: 'PY', code3: 'PRY', name: 'Paraguay', nativeName: 'Paraguay',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Asunción', lat: -25.2637, lng: -57.5759, flag: '🇵🇾',
    language: { code: 'es-PY', name: 'Spagnolo / Guaraní', nativeName: 'Español / Guaraní', greeting: '¡Bienvenido a Paraguay!' },
    currency: { code: 'PYG', symbol: '₲', name: 'Guaraní Paraguaiano', rateToEur: 8400.0 },
    timezone: 'America/Asuncion',
  },
  {
    code: 'UY', code3: 'URY', name: 'Uruguay', nativeName: 'Uruguay',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Montevideo', lat: -34.9011, lng: -56.1645, flag: '🇺🇾',
    language: { code: 'es-UY', name: 'Spagnolo', nativeName: 'Español', greeting: '¡Bienvenido a Uruguay!' },
    currency: { code: 'UYU', symbol: '$U', name: 'Peso Uruguaiano', rateToEur: 45.2 },
    timezone: 'America/Montevideo',
  },
  {
    code: 'GY', code3: 'GUY', name: 'Guyana', nativeName: 'Guyana',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Georgetown', lat: 6.8013, lng: -58.1551, flag: '🇬🇾',
    language: { code: 'en-GY', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Guyana!' },
    currency: { code: 'GYD', symbol: 'G$', name: 'Dollaro della Guyana', rateToEur: 226.0 },
    timezone: 'America/Guyana',
  },
  {
    code: 'SR', code3: 'SUR', name: 'Suriname', nativeName: 'Suriname',
    continent: 'Americhe', subContinent: 'Sud America',
    capital: 'Paramaribo', lat: 5.8520, lng: -55.2038, flag: '🇸🇷',
    language: { code: 'nl-SR', name: 'Olandese', nativeName: 'Nederlands', greeting: 'Welkom in Suriname!' },
    currency: { code: 'SRD', symbol: '$', name: 'Dollaro Surinamese', rateToEur: 38.0 },
    timezone: 'America/Paramaribo',
  },

  // ============================================================================
  // ASIA & MEDIO ORIENTE (49 Stati Sovrani e Territori)
  // ============================================================================
  {
    code: 'JP', code3: 'JPN', name: 'Giappone', nativeName: '日本', continent: 'Asia',
    capital: 'Tokyo', lat: 35.6762, lng: 139.6503, flag: '🇯🇵',
    language: { code: 'ja', name: 'Giapponese', nativeName: '日本語', greeting: 'ようこそ日本へ！ (Yōkoso Nihon e!)' },
    currency: { code: 'JPY', symbol: '¥', name: 'Yen Giapponese', rateToEur: 165.0 },
    timezone: 'Asia/Tokyo',
    regions: [
      { name: 'Kanto', capital: 'Tokyo', lat: 35.6762, lng: 139.6503 },
      { name: 'Kansai', capital: 'Kyoto / Osaka', lat: 34.6937, lng: 135.5023 },
      { name: 'Hokkaido', capital: 'Sapporo', lat: 43.0618, lng: 141.3545 },
    ],
  },
  {
    code: 'CN', code3: 'CHN', name: 'Cina', nativeName: '中国', continent: 'Asia',
    capital: 'Pechino', lat: 39.9042, lng: 116.4074, flag: '🇨🇳',
    language: { code: 'zh', name: 'Cinese Mandarino', nativeName: '中文', greeting: '欢迎来到中国！(Huānyíng láidào Zhōngguó!)' },
    currency: { code: 'CNY', symbol: '¥', name: 'Yuan Cinese', rateToEur: 7.82 },
    timezone: 'Asia/Shanghai',
    regions: [
      { name: 'Beijing', capital: 'Pechino', lat: 39.9042, lng: 116.4074 },
      { name: 'Shanghai', capital: 'Shanghai', lat: 31.2304, lng: 121.4737 },
      { name: 'Guangdong', capital: 'Guangzhou / Shenzhen', lat: 23.1291, lng: 113.2644 },
    ],
  },
  {
    code: 'KR', code3: 'KOR', name: 'Corea del Sud', nativeName: '대한민국', continent: 'Asia',
    capital: 'Seul', lat: 37.5665, lng: 126.9780, flag: '🇰🇷',
    language: { code: 'ko', name: 'Coreano', nativeName: '한국어', greeting: '한국에 오신 것을 환영합니다!' },
    currency: { code: 'KRW', symbol: '₩', name: 'Won Sudcoreano', rateToEur: 1475.0 },
    timezone: 'Asia/Seoul',
    regions: [
      { name: 'Seoul', capital: 'Seul', lat: 37.5665, lng: 126.9780 },
      { name: 'Busan', capital: 'Busan', lat: 35.1796, lng: 129.0756 },
      { name: 'Incheon', capital: 'Incheon', lat: 37.4563, lng: 126.7052 },
    ],
  },
  {
    code: 'KP', code3: 'PRK', name: 'Corea del Nord', nativeName: '조선민주주의인민공화국', continent: 'Asia',
    capital: 'Pyongyang', lat: 39.0392, lng: 125.7625, flag: '🇰🇵',
    language: { code: 'ko-KP', name: 'Coreano', nativeName: '한국어', greeting: '환영합니다!' },
    currency: { code: 'KPW', symbol: '₩', name: 'Won Nordcoreano', rateToEur: 970.0 },
    timezone: 'Asia/Pyongyang',
  },
  {
    code: 'IN', code3: 'IND', name: 'India', nativeName: 'भारत', continent: 'Asia',
    capital: 'Nuova Delhi', lat: 28.6139, lng: 77.2090, flag: '🇮🇳',
    language: { code: 'hi', name: 'Hindi / Inglese', nativeName: 'हिन्दी / English', greeting: 'भारत में आपका स्वागत है!' },
    currency: { code: 'INR', symbol: '₹', name: 'Rupia Indiana', rateToEur: 90.50 },
    timezone: 'Asia/Kolkata',
    regions: [
      { name: 'Maharashtra', capital: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Delhi', capital: 'Nuova Delhi', lat: 28.6139, lng: 77.2090 },
      { name: 'Karnataka', capital: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    ],
  },
  {
    code: 'AE', code3: 'ARE', name: 'Emirati Arabi Uniti', nativeName: 'الإمارات العربية المتحدة', continent: 'Asia',
    capital: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, flag: '🇦🇪',
    language: { code: 'ar', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في الإمارات!' },
    currency: { code: 'AED', symbol: 'د.إ', name: 'Dirham degli EAU', rateToEur: 3.96 },
    timezone: 'Asia/Dubai',
    regions: [
      { name: 'Dubai', capital: 'Dubai', lat: 25.2048, lng: 55.2708 },
      { name: 'Abu Dhabi', capital: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
    ],
  },
  {
    code: 'SA', code3: 'SAU', name: 'Arabia Saudita', nativeName: 'المملكة العربية السعودية', continent: 'Asia',
    capital: 'Riyadh', lat: 24.7136, lng: 46.6753, flag: '🇸🇦',
    language: { code: 'ar-SA', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في السعودية!' },
    currency: { code: 'SAR', symbol: '﷼', name: 'Riyal Saudita', rateToEur: 4.05 },
    timezone: 'Asia/Riyadh',
    regions: [
      { name: 'Riyadh', capital: 'Riyadh', lat: 24.7136, lng: 46.6753 },
      { name: 'Makkah / Jeddah', capital: 'Jeddah', lat: 21.4858, lng: 39.1925 },
    ],
  },
  {
    code: 'QA', code3: 'QAT', name: 'Qatar', nativeName: 'قطر', continent: 'Asia',
    capital: 'Doha', lat: 25.2854, lng: 51.5310, flag: '🇶🇦',
    language: { code: 'ar-QA', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في قطر!' },
    currency: { code: 'QAR', symbol: 'ر.ق', name: 'Riyal del Qatar', rateToEur: 3.93 },
    timezone: 'Asia/Qatar',
  },
  {
    code: 'KW', code3: 'KWT', name: 'Kuwait', nativeName: 'الكويت', continent: 'Asia',
    capital: 'Kuwait City', lat: 29.3759, lng: 47.9774, flag: '🇰🇼',
    language: { code: 'ar-KW', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في الكويت!' },
    currency: { code: 'KWD', symbol: 'د.ك', name: 'Dinaro Kuwaitiano', rateToEur: 0.33 },
    timezone: 'Asia/Kuwait',
  },
  {
    code: 'BH', code3: 'BHR', name: 'Bahrein', nativeName: 'البحرين', continent: 'Asia',
    capital: 'Manama', lat: 26.2285, lng: 50.5860, flag: '🇧🇭',
    language: { code: 'ar-BH', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في البحرين!' },
    currency: { code: 'BHD', symbol: '.د.ب', name: 'Dinaro del Bahrein', rateToEur: 0.41 },
    timezone: 'Asia/Bahrain',
  },
  {
    code: 'OM', code3: 'OMN', name: 'Oman', nativeName: 'عُمان', continent: 'Asia',
    capital: 'Mascate', lat: 23.5880, lng: 58.3829, flag: '🇴🇲',
    language: { code: 'ar-OM', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في عُمان!' },
    currency: { code: 'OMR', symbol: 'ر.ع.', name: "Riyal dell'Oman", rateToEur: 0.42 },
    timezone: 'Asia/Muscat',
  },
  {
    code: 'IL', code3: 'ISR', name: 'Israele', nativeName: 'ישראל', continent: 'Asia',
    capital: 'Gerusalemme / Tel Aviv', lat: 32.0853, lng: 34.7818, flag: '🇮🇱',
    language: { code: 'he', name: 'Ebraico / Arabo', nativeName: 'עברית', greeting: 'ברוכים הבאים לישראל!' },
    currency: { code: 'ILS', symbol: '₪', name: 'Nuovo Siclo Israeliano', rateToEur: 4.02 },
    timezone: 'Asia/Jerusalem',
    regions: [
      { name: 'Tel Aviv', capital: 'Tel Aviv', lat: 32.0853, lng: 34.7818 },
      { name: 'Gerusalemme', capital: 'Gerusalemme', lat: 31.7683, lng: 35.2137 },
    ],
  },
  {
    code: 'PS', code3: 'PSE', name: 'Palestina', nativeName: 'فلسطين', continent: 'Asia',
    capital: 'Ramallah', lat: 31.9038, lng: 35.2034, flag: '🇵🇸',
    language: { code: 'ar-PS', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بكم في فلسطين!' },
    currency: { code: 'ILS', symbol: '₪', name: 'Siclo / Dinaro Giordano', rateToEur: 4.02 },
    timezone: 'Asia/Hebron',
  },
  {
    code: 'JO', code3: 'JOR', name: 'Giordania', nativeName: 'الأردن', continent: 'Asia',
    capital: 'Amman', lat: 31.9454, lng: 35.9284, flag: '🇯🇴',
    language: { code: 'ar-JO', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بكم في الأردن!' },
    currency: { code: 'JOD', symbol: 'د.أ', name: 'Dinaro Giordano', rateToEur: 0.77 },
    timezone: 'Asia/Amman',
  },
  {
    code: 'LB', code3: 'LBN', name: 'Libano', nativeName: 'لبنان', continent: 'Asia',
    capital: 'Beirut', lat: 33.8938, lng: 35.5018, flag: '🇱🇧',
    language: { code: 'ar-LB', name: 'Arabo / Francese', nativeName: 'العربية', greeting: 'أهلاً بكم في لبنان!' },
    currency: { code: 'LBP', symbol: 'ل.ل', name: 'Lira Libanese', rateToEur: 96500.0 },
    timezone: 'Asia/Beirut',
  },
  {
    code: 'SY', code3: 'SYR', name: 'Siria', nativeName: 'سوريا', continent: 'Asia',
    capital: 'Damasco', lat: 33.5138, lng: 36.2765, flag: '🇸🇾',
    language: { code: 'ar-SY', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بكم في سوريا!' },
    currency: { code: 'SYP', symbol: '£S', name: 'Lira Siriana', rateToEur: 14000.0 },
    timezone: 'Asia/Damascus',
  },
  {
    code: 'IQ', code3: 'IRQ', name: 'Iraq', nativeName: 'العراق', continent: 'Asia',
    capital: 'Baghdad', lat: 33.3152, lng: 44.3661, flag: '🇮🇶',
    language: { code: 'ar-IQ', name: 'Arabo / Curdo', nativeName: 'العربية', greeting: 'مرحباً بكم في العراق!' },
    currency: { code: 'IQD', symbol: 'ع.د', name: 'Dinaro Iracheno', rateToEur: 1415.0 },
    timezone: 'Asia/Baghdad',
  },
  {
    code: 'IR', code3: 'IRN', name: 'Iran', nativeName: 'ایران', continent: 'Asia',
    capital: 'Teheran', lat: 35.6892, lng: 51.3890, flag: '🇮🇷',
    language: { code: 'fa', name: 'Persiano', nativeName: 'فارسی', greeting: 'به ایران خوش آمدید!' },
    currency: { code: 'IRR', symbol: '﷼', name: 'Rial Iraniano', rateToEur: 45500.0 },
    timezone: 'Asia/Tehran',
  },
  {
    code: 'YE', code3: 'YEM', name: 'Yemen', nativeName: 'اليمن', continent: 'Asia',
    capital: "Sana'a", lat: 15.3694, lng: 44.1910, flag: '🇾🇪',
    language: { code: 'ar-YE', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في اليمن!' },
    currency: { code: 'YER', symbol: '﷼', name: 'Rial Yemenita', rateToEur: 270.0 },
    timezone: 'Asia/Aden',
  },
  {
    code: 'TR', code3: 'TUR', name: 'Turchia', nativeName: 'Türkiye', continent: 'Asia',
    capital: 'Ankara', lat: 39.9334, lng: 32.8597, flag: '🇹🇷',
    language: { code: 'tr', name: 'Turco', nativeName: 'Türkçe', greeting: "Türkiye'ye hoş geldiniz!" },
    currency: { code: 'TRY', symbol: '₺', name: 'Lira Turca', rateToEur: 37.2 },
    timezone: 'Europe/Istanbul',
    regions: [
      { name: 'Istanbul', capital: 'Istanbul', lat: 41.0082, lng: 28.9784 },
      { name: 'Ankara', capital: 'Ankara', lat: 39.9334, lng: 32.8597 },
      { name: 'Izmir', capital: 'Smirne', lat: 38.4237, lng: 27.1428 },
    ],
  },
  {
    code: 'GE', code3: 'GEO', name: 'Georgia', nativeName: 'საქართველო', continent: 'Asia',
    capital: 'Tbilisi', lat: 41.7151, lng: 44.8271, flag: '🇬🇪',
    language: { code: 'ka', name: 'Georgiano', nativeName: 'ქართული', greeting: 'კეთილი იყოს თქვენი მობრძანება!' },
    currency: { code: 'GEL', symbol: '₾', name: 'Lari Georgiano', rateToEur: 2.95 },
    timezone: 'Asia/Tbilisi',
  },
  {
    code: 'AM', code3: 'ARM', name: 'Armenia', nativeName: 'Հայաստան', continent: 'Asia',
    capital: 'Yerevan', lat: 40.1792, lng: 44.4991, flag: '🇦🇲',
    language: { code: 'hy', name: 'Armeno', nativeName: 'Հայերեն', greeting: 'Բարի գալուստ Հայաստան!' },
    currency: { code: 'AMD', symbol: '֏', name: 'Dram Armeno', rateToEur: 420.0 },
    timezone: 'Asia/Yerevan',
  },
  {
    code: 'AZ', code3: 'AZE', name: 'Azerbaigian', nativeName: 'Azərbaycan', continent: 'Asia',
    capital: 'Baku', lat: 40.4093, lng: 49.8671, flag: '🇦🇿',
    language: { code: 'az', name: 'Azero', nativeName: 'Azərbaycanca', greeting: 'Azərbaycana xoş gəlmisiniz!' },
    currency: { code: 'AZN', symbol: '₼', name: 'Manat Azero', rateToEur: 1.84 },
    timezone: 'Asia/Baku',
  },
  {
    code: 'KZ', code3: 'KAZ', name: 'Kazakistan', nativeName: 'Қазақстан', continent: 'Asia',
    capital: 'Astana', lat: 51.1694, lng: 71.4491, flag: '🇰🇿',
    language: { code: 'kk', name: 'Kazako / Russo', nativeName: 'Қазақ тілі', greeting: 'Қазақстанға қош келдіңіз!' },
    currency: { code: 'KZT', symbol: '₸', name: 'Tenge Kazako', rateToEur: 525.0 },
    timezone: 'Asia/Almaty',
    regions: [
      { name: 'Astana', capital: 'Astana', lat: 51.1694, lng: 71.4491 },
      { name: 'Almaty', capital: 'Almaty', lat: 43.2220, lng: 76.8512 },
    ],
  },
  {
    code: 'UZ', code3: 'UZB', name: 'Uzbekistan', nativeName: "O'zbekiston", continent: 'Asia',
    capital: 'Tashkent', lat: 41.2995, lng: 69.2401, flag: '🇺🇿',
    language: { code: 'uz', name: 'Uzbeko', nativeName: "O'zbekcha", greeting: "O'zbekistonga xush kelibsiz!" },
    currency: { code: 'UZS', symbol: "so'm", name: 'Som Uzbeko', rateToEur: 13800.0 },
    timezone: 'Asia/Tashkent',
  },
  {
    code: 'TM', code3: 'TKM', name: 'Turkmenistan', nativeName: 'Türkmenistan', continent: 'Asia',
    capital: 'Aşgabat', lat: 37.9601, lng: 58.3261, flag: '🇹🇲',
    language: { code: 'tk', name: 'Turkmeno', nativeName: 'Türkmençe', greeting: 'Hoş geldiňiz!' },
    currency: { code: 'TMT', symbol: 'm', name: 'Manat Turkmeno', rateToEur: 3.78 },
    timezone: 'Asia/Ashgabat',
  },
  {
    code: 'KG', code3: 'KGZ', name: 'Kirghizistan', nativeName: 'Кыргызстан', continent: 'Asia',
    capital: 'Biškek', lat: 42.8746, lng: 74.5698, flag: '🇰🇬',
    language: { code: 'ky', name: 'Kirghiso / Russo', nativeName: 'Кыргызча', greeting: 'Кош келиңиз!' },
    currency: { code: 'KGS', symbol: 'с', name: 'Som Kirghiso', rateToEur: 93.0 },
    timezone: 'Asia/Bishkek',
  },
  {
    code: 'TJ', code3: 'TJK', name: 'Tagikistan', nativeName: 'Тоҷикистон', continent: 'Asia',
    capital: 'Dušanbe', lat: 38.5598, lng: 68.7870, flag: '🇹🇯',
    language: { code: 'tg', name: 'Tagico', nativeName: 'Тоҷикӣ', greeting: 'Хуш омадед!' },
    currency: { code: 'TJS', symbol: 'SM', name: 'Somoni Tagiko', rateToEur: 11.6 },
    timezone: 'Asia/Dushanbe',
  },
  {
    code: 'AF', code3: 'AFG', name: 'Afghanistan', nativeName: 'افغانستان', continent: 'Asia',
    capital: 'Kabul', lat: 34.5553, lng: 69.2075, flag: '🇦🇫',
    language: { code: 'ps', name: 'Pashtu / Dari', nativeName: 'پښتو / دری', greeting: 'ښه راغلاست!' },
    currency: { code: 'AFN', symbol: '؋', name: 'Afghani', rateToEur: 76.0 },
    timezone: 'Asia/Kabul',
  },
  {
    code: 'PK', code3: 'PAK', name: 'Pakistan', nativeName: 'پاکستان', continent: 'Asia',
    capital: 'Islamabad', lat: 33.6844, lng: 73.0479, flag: '🇵🇰',
    language: { code: 'ur', name: 'Urdu / Inglese', nativeName: 'اردو', greeting: 'پاکستان میں خوش آمدید!' },
    currency: { code: 'PKR', symbol: '₨', name: 'Rupia Pakistana', rateToEur: 300.0 },
    timezone: 'Asia/Karachi',
    regions: [
      { name: 'Islamabad', capital: 'Islamabad', lat: 33.6844, lng: 73.0479 },
      { name: 'Sindh', capital: 'Karachi', lat: 24.8607, lng: 67.0011 },
      { name: 'Punjab', capital: 'Lahore', lat: 31.5204, lng: 74.3587 },
    ],
  },
  {
    code: 'BD', code3: 'BGD', name: 'Bangladesh', nativeName: 'বাংলাদেশ', continent: 'Asia',
    capital: 'Dacca', lat: 23.8103, lng: 90.4125, flag: '🇧🇩',
    language: { code: 'bn', name: 'Bengalese', nativeName: 'বাংলা', greeting: 'বাংলাদেশে স্বাগতম!' },
    currency: { code: 'BDT', symbol: '৳', name: 'Taka Bengalese', rateToEur: 129.0 },
    timezone: 'Asia/Dhaka',
  },
  {
    code: 'LK', code3: 'LKA', name: 'Sri Lanka', nativeName: 'ශ්‍රී ලංකාව', continent: 'Asia',
    capital: 'Colombo / Sri Jayawardenepura', lat: 6.9271, lng: 79.8612, flag: '🇱🇰',
    language: { code: 'si', name: 'Singalese / Tamil', nativeName: 'සිංහල', greeting: 'ආයුබෝවන්!' },
    currency: { code: 'LKR', symbol: 'Rs', name: 'Rupia Singalese', rateToEur: 325.0 },
    timezone: 'Asia/Colombo',
  },
  {
    code: 'NP', code3: 'NPL', name: 'Nepal', nativeName: 'नेपाल', continent: 'Asia',
    capital: 'Kathmandu', lat: 27.7172, lng: 85.3240, flag: '🇳🇵',
    language: { code: 'ne', name: 'Nepalese', nativeName: 'नेपाली', greeting: 'नेपालमा स्वागत छ!' },
    currency: { code: 'NPR', symbol: '₨', name: 'Rupia Nepalese', rateToEur: 145.0 },
    timezone: 'Asia/Kathmandu',
  },
  {
    code: 'BT', code3: 'BTN', name: 'Bhutan', nativeName: 'འབྲུག་ཡུལ', continent: 'Asia',
    capital: 'Thimphu', lat: 27.4728, lng: 89.6390, flag: '🇧🇹',
    language: { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ', greeting: 'Kuzuzangpo la!' },
    currency: { code: 'BTN', symbol: 'Nu.', name: 'Ngultrum', rateToEur: 90.5 },
    timezone: 'Asia/Thimphu',
  },
  {
    code: 'MV', code3: 'MDV', name: 'Maldive', nativeName: 'ދިވެހިރާއްޖެ', continent: 'Asia',
    capital: 'Malé', lat: 4.1755, lng: 73.5093, flag: '🇲🇻',
    language: { code: 'dv', name: 'Maldiviano', nativeName: 'ދިވެހި', greeting: 'މަރުޙަބާ!' },
    currency: { code: 'MVR', symbol: 'Rf', name: 'Rufiyaa delle Maldive', rateToEur: 16.6 },
    timezone: 'Indian/Maldives',
  },
  {
    code: 'MM', code3: 'MMR', name: 'Myanmar', nativeName: 'မြန်မာ', continent: 'Asia',
    capital: 'Naypyidaw', lat: 19.7633, lng: 96.0785, flag: '🇲🇲',
    language: { code: 'my', name: 'Birmano', nativeName: 'မြန်မာဘာသာ', greeting: 'မင်္ဂလာပါ!' },
    currency: { code: 'MMK', symbol: 'K', name: 'Kyat Birmano', rateToEur: 2260.0 },
    timezone: 'Asia/Yangon',
  },
  {
    code: 'TH', code3: 'THA', name: 'Thailandia', nativeName: 'ประเทศไทย', continent: 'Asia',
    capital: 'Bangkok', lat: 13.7563, lng: 100.5018, flag: '🇹🇭',
    language: { code: 'th', name: 'Thailandese', nativeName: 'ไทย', greeting: 'ยินดีต้อนรับสู่ประเทศไทย!' },
    currency: { code: 'THB', symbol: '฿', name: 'Baht Thailandese', rateToEur: 37.5 },
    timezone: 'Asia/Bangkok',
    regions: [
      { name: 'Bangkok', capital: 'Bangkok', lat: 13.7563, lng: 100.5018 },
      { name: 'Chiang Mai', capital: 'Chiang Mai', lat: 18.7883, lng: 98.9853 },
    ],
  },
  {
    code: 'LA', code3: 'LAO', name: 'Laos', nativeName: 'ລາວ', continent: 'Asia',
    capital: 'Vientiane', lat: 17.9757, lng: 102.6331, flag: '🇱🇦',
    language: { code: 'lo', name: 'Laotiano', nativeName: 'ລາວ', greeting: 'ສະບາຍດີ!' },
    currency: { code: 'LAK', symbol: '₭', name: 'Kip Laotiano', rateToEur: 23500.0 },
    timezone: 'Asia/Vientiane',
  },
  {
    code: 'KH', code3: 'KHM', name: 'Cambogia', nativeName: 'កម្ពុជា', continent: 'Asia',
    capital: 'Phnom Penh', lat: 11.5564, lng: 104.9282, flag: '🇰🇭',
    language: { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', greeting: 'សូមស្វាគមន៍មកកាន់កម្ពុជា!' },
    currency: { code: 'KHR', symbol: '៛', name: 'Riel Cambogiano', rateToEur: 4380.0 },
    timezone: 'Asia/Phnom_Penh',
  },
  {
    code: 'VN', code3: 'VNM', name: 'Vietnam', nativeName: 'Việt Nam', continent: 'Asia',
    capital: 'Hanoi', lat: 21.0285, lng: 105.8542, flag: '🇻🇳',
    language: { code: 'vi', name: 'Vietnamita', nativeName: 'Tiếng Việt', greeting: 'Chào mừng đến với Việt Nam!' },
    currency: { code: 'VND', symbol: '₫', name: 'Dong Vietnamita', rateToEur: 27400.0 },
    timezone: 'Asia/Ho_Chi_Minh',
    regions: [
      { name: 'Hanoi', capital: 'Hanoi', lat: 21.0285, lng: 105.8542 },
      { name: 'Ho Chi Minh City', capital: 'Ho Chi Minh', lat: 10.8231, lng: 106.6297 },
    ],
  },
  {
    code: 'MY', code3: 'MYS', name: 'Malesia', nativeName: 'Malaysia', continent: 'Asia',
    capital: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, flag: '🇲🇾',
    language: { code: 'ms', name: 'Malese / Inglese', nativeName: 'Bahasa Melayu', greeting: 'Selamat datang ke Malaysia!' },
    currency: { code: 'MYR', symbol: 'RM', name: 'Ringgit Malese', rateToEur: 4.82 },
    timezone: 'Asia/Kuala_Lumpur',
    regions: [
      { name: 'Kuala Lumpur', capital: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 },
      { name: 'Penang', capital: 'George Town', lat: 5.4141, lng: 100.3288 },
    ],
  },
  {
    code: 'SG', code3: 'SGP', name: 'Singapore', nativeName: 'Singapore', continent: 'Asia',
    capital: 'Singapore', lat: 1.3521, lng: 103.8198, flag: '🇸🇬',
    language: { code: 'en-SG', name: 'Inglese / Cinese / Malese', nativeName: 'English / 中文', greeting: 'Welcome to Singapore!' },
    currency: { code: 'SGD', symbol: 'S$', name: 'Dollaro di Singapore', rateToEur: 1.45 },
    timezone: 'Asia/Singapore',
    regions: [
      { name: 'Central Region', capital: 'Singapore', lat: 1.3521, lng: 103.8198 },
      { name: 'East Region', capital: 'Tampines', lat: 1.3526, lng: 103.9448 },
    ],
  },
  {
    code: 'BN', code3: 'BRN', name: 'Brunei', nativeName: 'Brunei Darussalam', continent: 'Asia',
    capital: 'Bandar Seri Begawan', lat: 4.9031, lng: 114.9398, flag: '🇧🇳',
    language: { code: 'ms-BN', name: 'Malese', nativeName: 'Bahasa Melayu', greeting: 'Selamat datang ke Brunei!' },
    currency: { code: 'BND', symbol: 'B$', name: 'Dollaro del Brunei', rateToEur: 1.45 },
    timezone: 'Asia/Brunei',
  },
  {
    code: 'ID', code3: 'IDN', name: 'Indonesia', nativeName: 'Indonesia', continent: 'Asia',
    capital: 'Giacarta', lat: -6.2088, lng: 106.8456, flag: '🇮🇩',
    language: { code: 'id', name: 'Indonesiano', nativeName: 'Bahasa Indonesia', greeting: 'Selamat datang di Indonesia!' },
    currency: { code: 'IDR', symbol: 'Rp', name: 'Rupia Indonesiana', rateToEur: 17150.0 },
    timezone: 'Asia/Jakarta',
    regions: [
      { name: 'Jakarta', capital: 'Giacarta', lat: -6.2088, lng: 106.8456 },
      { name: 'Bali', capital: 'Denpasar', lat: -8.6705, lng: 115.2126 },
    ],
  },
  {
    code: 'PH', code3: 'PHL', name: 'Filippine', nativeName: 'Pilipinas', continent: 'Asia',
    capital: 'Manila', lat: 14.5995, lng: 120.9842, flag: '🇵🇭',
    language: { code: 'tl', name: 'Filippino / Inglese', nativeName: 'Filipino / English', greeting: 'Mabuhay! Maligayang pagdating!' },
    currency: { code: 'PHP', symbol: '₱', name: 'Peso Filippino', rateToEur: 62.5 },
    timezone: 'Asia/Manila',
    regions: [
      { name: 'Metro Manila', capital: 'Manila', lat: 14.5995, lng: 120.9842 },
      { name: 'Cebu', capital: 'Cebu City', lat: 10.3157, lng: 123.8854 },
    ],
  },
  {
    code: 'TL', code3: 'TLS', name: 'Timor Est', nativeName: 'Timor-Leste', continent: 'Asia',
    capital: 'Dili', lat: -8.5569, lng: 125.5603, flag: '🇹🇱',
    language: { code: 'pt-TL', name: 'Portoghese / Tetum', nativeName: 'Português / Tetun', greeting: 'Bem-vindo a Timor-Leste!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro USA', rateToEur: 1.08 },
    timezone: 'Asia/Dili',
  },
  {
    code: 'MN', code3: 'MNG', name: 'Mongolia', nativeName: 'Монгол Улс', continent: 'Asia',
    capital: 'Ulan Bator', lat: 47.8864, lng: 106.9057, flag: '🇲🇳',
    language: { code: 'mn', name: 'Mongolo', nativeName: 'Монгол', greeting: 'Монголд тавтай морил!' },
    currency: { code: 'MNT', symbol: '₮', name: 'Tugrik Mongolo', rateToEur: 3680.0 },
    timezone: 'Asia/Ulaanbaatar',
  },
  {
    code: 'TW', code3: 'TWN', name: 'Taiwan', nativeName: '臺灣', continent: 'Asia',
    capital: 'Taipei', lat: 25.0330, lng: 121.5654, flag: '🇹🇼',
    language: { code: 'zh-TW', name: 'Cinese Tradizionale', nativeName: '繁體中文', greeting: '歡迎來到台灣！' },
    currency: { code: 'TWD', symbol: 'NT$', name: 'Nuovo Dollaro Taiwan', rateToEur: 34.8 },
    timezone: 'Asia/Taipei',
  },

  // ============================================================================
  // AFRICA (Copertura integrale 54/54 Stati Sovrani con Regioni/Province Reali)
  // ============================================================================
  {
    code: 'EG', code3: 'EGY', name: 'Egitto', nativeName: 'مصر', continent: 'Africa',
    capital: 'Il Cairo', lat: 30.0444, lng: 31.2357, flag: '🇪🇬',
    language: { code: 'ar-EG', name: 'Arabo', nativeName: 'العربية', greeting: 'أهلاً بكم في مصر!' },
    currency: { code: 'EGP', symbol: 'E£', name: 'Sterlina Egiziana', rateToEur: 52.80 },
    timezone: 'Africa/Cairo',
    regions: [
      { name: 'Cairo', capital: 'Il Cairo', lat: 30.0444, lng: 31.2357 },
      { name: 'Alexandria', capital: "Alessandria d'Egitto", lat: 31.2001, lng: 29.9187 },
      { name: 'Giza', capital: 'Giza', lat: 30.0131, lng: 31.2089 },
      { name: 'Luxor', capital: 'Luxor', lat: 25.6872, lng: 32.6396 },
      { name: 'Aswan', capital: 'Assuan', lat: 24.0889, lng: 32.8998 },
    ],
  },
  {
    code: 'MA', code3: 'MAR', name: 'Marocco', nativeName: 'المغرب', continent: 'Africa',
    capital: 'Rabat', lat: 34.0209, lng: -6.8416, flag: '🇲🇦',
    language: { code: 'ar-MA', name: 'Arabo / Francese', nativeName: 'العربية / Français', greeting: 'مرحباً بكم في المغرب / Bienvenue au Maroc!' },
    currency: { code: 'MAD', symbol: 'DH', name: 'Dirham Marocchino', rateToEur: 10.75 },
    timezone: 'Africa/Casablanca',
    regions: [
      { name: 'Casablanca-Settat', capital: 'Casablanca', lat: 33.5731, lng: -7.5898 },
      { name: 'Rabat-Salé-Kénitra', capital: 'Rabat', lat: 34.0209, lng: -6.8416 },
      { name: 'Marrakech-Safi', capital: 'Marrakech', lat: 31.6295, lng: -7.9811 },
      { name: 'Fès-Meknès', capital: 'Fès', lat: 34.0181, lng: -5.0078 },
    ],
  },
  {
    code: 'NG', code3: 'NGA', name: 'Nigeria', nativeName: 'Federal Republic of Nigeria', continent: 'Africa',
    capital: 'Abuja', lat: 9.0765, lng: 7.3986, flag: '🇳🇬',
    language: { code: 'en-NG', name: 'Inglese / Hausa / Yoruba / Igbo', nativeName: 'English / Ẹ̀kọ́', greeting: 'Welcome to Nigeria!' },
    currency: { code: 'NGN', symbol: '₦', name: 'Naira Nigeriana', rateToEur: 1750.0 },
    timezone: 'Africa/Lagos',
    regions: [
      { name: 'Lagos', capital: 'Ikeja', lat: 6.5244, lng: 3.3792 },
      { name: 'Abuja FCT', capital: 'Abuja', lat: 9.0765, lng: 7.3986 },
      { name: 'Kano', capital: 'Kano', lat: 12.0022, lng: 8.5920 },
      { name: 'Rivers', capital: 'Port Harcourt', lat: 4.8156, lng: 7.0498 },
      { name: 'Oyo', capital: 'Ibadan', lat: 7.3775, lng: 3.9470 },
    ],
  },
  {
    code: 'KE', code3: 'KEN', name: 'Kenya', nativeName: 'Jamhuri ya Kenya', continent: 'Africa',
    capital: 'Nairobi', lat: -1.2921, lng: 36.8219, flag: '🇰🇪',
    language: { code: 'sw-KE', name: 'Swahili / Inglese', nativeName: 'Kiswahili / English', greeting: 'Karibu Kenya!' },
    currency: { code: 'KES', symbol: 'KSh', name: 'Scellino Keniota', rateToEur: 140.0 },
    timezone: 'Africa/Nairobi',
    regions: [
      { name: 'Nairobi', capital: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      { name: 'Mombasa', capital: 'Mombasa', lat: -4.0435, lng: 39.6682 },
      { name: 'Kisumu', capital: 'Kisumu', lat: -0.0917, lng: 34.7680 },
      { name: 'Nakuru', capital: 'Nakuru', lat: -0.3031, lng: 36.0800 },
      { name: 'Kiambu', capital: 'Kiambu', lat: -1.1714, lng: 36.8356 },
    ],
  },
  {
    code: 'GH', code3: 'GHA', name: 'Ghana', nativeName: 'Republic of Ghana', continent: 'Africa',
    capital: 'Accra', lat: 5.6037, lng: -0.1870, flag: '🇬🇭',
    language: { code: 'en-GH', name: 'Inglese / Akan / Twi', nativeName: 'English / Twi', greeting: 'Akwaaba! Welcome to Ghana!' },
    currency: { code: 'GHS', symbol: 'GH₵', name: 'Cedi Ghanese', rateToEur: 16.5 },
    timezone: 'Africa/Accra',
    regions: [
      { name: 'Greater Accra', capital: 'Accra', lat: 5.6037, lng: -0.1870 },
      { name: 'Ashanti', capital: 'Kumasi', lat: 6.6885, lng: -1.6244 },
      { name: 'Central', capital: 'Cape Coast', lat: 5.1053, lng: -1.2466 },
      { name: 'Eastern', capital: 'Koforidua', lat: 6.0941, lng: -0.2591 },
    ],
  },
  {
    code: 'SN', code3: 'SEN', name: 'Senegal', nativeName: 'Sénégal', continent: 'Africa',
    capital: 'Dakar', lat: 14.7167, lng: -17.4677, flag: '🇸🇳',
    language: { code: 'fr-SN', name: 'Francese / Wolof', nativeName: 'Français / Wolof', greeting: 'Dalal ak jàmm! Bienvenue au Sénégal!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Dakar',
    regions: [
      { name: 'Dakar', capital: 'Dakar', lat: 14.7167, lng: -17.4677 },
      { name: 'Thiès', capital: 'Thiès', lat: 14.7910, lng: -16.9359 },
      { name: 'Saint-Louis', capital: 'Saint-Louis', lat: 16.0179, lng: -16.4896 },
      { name: 'Ziguinchor', capital: 'Ziguinchor', lat: 12.5641, lng: -16.2640 },
    ],
  },
  {
    code: 'DZ', code3: 'DZA', name: 'Algeria', nativeName: 'الجزائر', continent: 'Africa',
    capital: 'Algeri', lat: 36.7538, lng: 3.0588, flag: '🇩🇿',
    language: { code: 'ar-DZ', name: 'Arabo / Berbero / Francese', nativeName: 'العربية', greeting: 'مرحباً بكم في الجزائر!' },
    currency: { code: 'DZD', symbol: 'DA', name: 'Dinaro Algerino', rateToEur: 145.2 },
    timezone: 'Africa/Algiers',
    regions: [
      { name: 'Alger (Algeri)', capital: 'Algeri', lat: 36.7538, lng: 3.0588 },
      { name: 'Oran', capital: 'Orano', lat: 35.6977, lng: -0.6308 },
      { name: 'Constantine', capital: 'Costantina', lat: 36.3650, lng: 6.6147 },
      { name: 'Annaba', capital: 'Annaba', lat: 36.9000, lng: 7.7667 },
    ],
  },
  {
    code: 'TN', code3: 'TUN', name: 'Tunisia', nativeName: 'تونس', continent: 'Africa',
    capital: 'Tunisi', lat: 36.8065, lng: 10.1815, flag: '🇹🇳',
    language: { code: 'ar-TN', name: 'Arabo / Francese', nativeName: 'العربية', greeting: 'أهلاً بكم في تونس!' },
    currency: { code: 'TND', symbol: 'DT', name: 'Dinaro Tunisino', rateToEur: 3.38 },
    timezone: 'Africa/Tunis',
    regions: [
      { name: 'Tunis', capital: 'Tunisi', lat: 36.8065, lng: 10.1815 },
      { name: 'Sfax', capital: 'Sfax', lat: 34.7406, lng: 10.7603 },
      { name: 'Sousse', capital: 'Susa', lat: 35.8256, lng: 10.6084 },
    ],
  },
  {
    code: 'ET', code3: 'ETH', name: 'Etiopia', nativeName: 'ኢትዮጵያ', continent: 'Africa',
    capital: 'Addis Abeba', lat: 9.0320, lng: 38.7469, flag: '🇪🇹',
    language: { code: 'am-ET', name: 'Amarico / Oromo / Inglese', nativeName: 'አማርኛ', greeting: 'እንኳን ደህና መጡ!' },
    currency: { code: 'ETB', symbol: 'Br', name: 'Birr Etiopico', rateToEur: 130.0 },
    timezone: 'Africa/Addis_Ababa',
    regions: [
      { name: 'Addis Ababa', capital: 'Addis Abeba', lat: 9.0320, lng: 38.7469 },
      { name: 'Oromia', capital: 'Adama', lat: 8.5400, lng: 39.2700 },
      { name: 'Amhara', capital: 'Bahir Dar', lat: 11.5742, lng: 37.3614 },
      { name: 'SNNPR', capital: 'Hawassa', lat: 7.0621, lng: 38.4763 },
    ],
  },
  {
    code: 'CI', code3: 'CIV', name: "Costa d'Avorio", nativeName: "Côte d'Ivoire", continent: 'Africa',
    capital: 'Yamoussoukro / Abidjan', lat: 5.3600, lng: -4.0083, flag: '🇨🇮',
    language: { code: 'fr-CI', name: 'Francese / Dioula / Baoulé', nativeName: 'Français', greeting: "Bienvenue en Côte d'Ivoire !" },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Abidjan',
    regions: [
      { name: 'Abidjan', capital: 'Abidjan', lat: 5.3600, lng: -4.0083 },
      { name: 'Yamoussoukro', capital: 'Yamoussoukro', lat: 6.8276, lng: -5.2893 },
      { name: 'Vallée du Bandama', capital: 'Bouaké', lat: 7.6939, lng: -5.0303 },
    ],
  },
  {
    code: 'CM', code3: 'CMR', name: 'Camerun', nativeName: 'Cameroun', continent: 'Africa',
    capital: 'Yaoundé', lat: 3.8480, lng: 11.5021, flag: '🇨🇲',
    language: { code: 'fr-CM', name: 'Francese / Inglese', nativeName: 'Français / English', greeting: 'Bienvenue au Cameroun!' },
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 655.95 },
    timezone: 'Africa/Douala',
    regions: [
      { name: 'Centre', capital: 'Yaoundé', lat: 3.8480, lng: 11.5021 },
      { name: 'Littoral', capital: 'Douala', lat: 4.0511, lng: 9.7679 },
      { name: 'Nord-Ouest', capital: 'Bamenda', lat: 5.9597, lng: 10.1460 },
    ],
  },
  {
    code: 'TZ', code3: 'TZA', name: 'Tanzania', nativeName: 'Tanzania', continent: 'Africa',
    capital: 'Dodoma / Dar es Salaam', lat: -6.7924, lng: 39.2083, flag: '🇹🇿',
    language: { code: 'sw-TZ', name: 'Swahili / Inglese', nativeName: 'Kiswahili', greeting: 'Karibu Tanzania!' },
    currency: { code: 'TZS', symbol: 'TSh', name: 'Scellino Tanzaniano', rateToEur: 2850.0 },
    timezone: 'Africa/Dar_es_Salaam',
    regions: [
      { name: 'Dar es Salaam', capital: 'Dar es Salaam', lat: -6.7924, lng: 39.2083 },
      { name: 'Arusha', capital: 'Arusha', lat: -3.3869, lng: 36.6830 },
      { name: 'Mwanza', capital: 'Mwanza', lat: -2.5164, lng: 32.9175 },
      { name: 'Dodoma', capital: 'Dodoma', lat: -6.1630, lng: 35.7516 },
    ],
  },
  {
    code: 'UG', code3: 'UGA', name: 'Uganda', nativeName: 'Uganda', continent: 'Africa',
    capital: 'Kampala', lat: 0.3476, lng: 32.5825, flag: '🇺🇬',
    language: { code: 'en-UG', name: 'Inglese / Swahili / Luganda', nativeName: 'English', greeting: 'Welcome to Uganda!' },
    currency: { code: 'UGX', symbol: 'USh', name: 'Scellino Ugandese', rateToEur: 4000.0 },
    timezone: 'Africa/Kampala',
    regions: [
      { name: 'Central (Buganda)', capital: 'Kampala', lat: 0.3476, lng: 32.5825 },
      { name: 'Western', capital: 'Mbarara', lat: -0.6072, lng: 30.6545 },
      { name: 'Eastern', capital: 'Jinja', lat: 0.4244, lng: 33.2041 },
    ],
  },
  {
    code: 'ZA', code3: 'ZAF', name: 'Sudafrica', nativeName: 'South Africa', continent: 'Africa',
    capital: 'Pretoria / Cape Town', lat: -33.9249, lng: 18.4241, flag: '🇿🇦',
    language: { code: 'en-ZA', name: 'Inglese / Zulu / Afrikaans', nativeName: 'English / isiZulu', greeting: 'Welcome to South Africa / Wamkelekile!' },
    currency: { code: 'ZAR', symbol: 'R', name: 'Rand Sudafricano', rateToEur: 19.80 },
    timezone: 'Africa/Johannesburg',
    regions: [
      { name: 'Gauteng', capital: 'Johannesburg / Pretoria', lat: -26.2041, lng: 28.0473 },
      { name: 'Western Cape', capital: 'Città del Capo', lat: -33.9249, lng: 18.4241 },
      { name: 'KwaZulu-Natal', capital: 'Durban', lat: -29.8587, lng: 31.0218 },
      { name: 'Eastern Cape', capital: 'Gqeberha', lat: -33.9608, lng: 25.6022 },
    ],
  },
  {
    code: 'AO', code3: 'AGO', name: 'Angola', nativeName: 'Angola', continent: 'Africa',
    capital: 'Luanda', lat: -8.8390, lng: 13.2894, flag: '🇦🇴',
    language: { code: 'pt-AO', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a Angola!' },
    currency: { code: 'AOA', symbol: 'Kz', name: 'Kwanza Angolano', rateToEur: 960.0 },
    timezone: 'Africa/Luanda',
    regions: [
      { name: 'Luanda', capital: 'Luanda', lat: -8.8390, lng: 13.2894 },
      { name: 'Benguela', capital: 'Benguela', lat: -12.5763, lng: 13.4055 },
      { name: 'Huambo', capital: 'Huambo', lat: -12.7761, lng: 15.7392 },
    ],
  },
  {
    code: 'BJ', code3: 'BEN', name: 'Benin', nativeName: 'Bénin', continent: 'Africa',
    capital: 'Porto-Novo', lat: 6.4969, lng: 2.6289, flag: '🇧🇯',
    language: { code: 'fr-BJ', name: 'Francese / Fon', nativeName: 'Français', greeting: 'Bienvenue au Bénin!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Porto-Novo',
    regions: [
      { name: 'Littoral', capital: 'Cotonou', lat: 6.3703, lng: 2.3912 },
      { name: 'Ouémé', capital: 'Porto-Novo', lat: 6.4969, lng: 2.6289 },
    ],
  },
  {
    code: 'BW', code3: 'BWA', name: 'Botswana', nativeName: 'Botswana', continent: 'Africa',
    capital: 'Gaborone', lat: -24.6282, lng: 25.9231, flag: '🇧🇼',
    language: { code: 'en-BW', name: 'Inglese / Setswana', nativeName: 'English / Setswana', greeting: 'Dumela! Welcome to Botswana!' },
    currency: { code: 'BWP', symbol: 'P', name: 'Pula Botswano', rateToEur: 14.5 },
    timezone: 'Africa/Gaborone',
    regions: [
      { name: 'South-East', capital: 'Gaborone', lat: -24.6282, lng: 25.9231 },
      { name: 'North-East', capital: 'Francistown', lat: -21.1699, lng: 27.5084 },
    ],
  },
  {
    code: 'BF', code3: 'BFA', name: 'Burkina Faso', nativeName: 'Burkina Faso', continent: 'Africa',
    capital: 'Ouagadougou', lat: 12.3714, lng: -1.5197, flag: '🇧🇫',
    language: { code: 'fr-BF', name: 'Francese / Mooré', nativeName: 'Français', greeting: 'Bienvenue au Burkina Faso!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Ouagadougou',
    regions: [
      { name: 'Centre', capital: 'Ouagadougou', lat: 12.3714, lng: -1.5197 },
      { name: 'Hauts-Bassins', capital: 'Bobo-Dioulasso', lat: 11.1771, lng: -4.2979 },
    ],
  },
  {
    code: 'BI', code3: 'BDI', name: 'Burundi', nativeName: 'Burundi', continent: 'Africa',
    capital: 'Gitega / Bujumbura', lat: -3.4264, lng: 29.9306, flag: '🇧🇮',
    language: { code: 'rn', name: 'Kirundi / Francese', nativeName: 'Kirundi / Français', greeting: 'Kaze neza muri Burundi!' },
    currency: { code: 'BIF', symbol: 'FBu', name: 'Franco del Burundi', rateToEur: 3100.0 },
    timezone: 'Africa/Bujumbura',
    regions: [
      { name: 'Gitega', capital: 'Gitega', lat: -3.4264, lng: 29.9306 },
      { name: 'Bujumbura Mairie', capital: 'Bujumbura', lat: -3.3614, lng: 29.3599 },
    ],
  },
  {
    code: 'CV', code3: 'CPV', name: 'Capo Verde', nativeName: 'Cabo Verde', continent: 'Africa',
    capital: 'Praia', lat: 14.9330, lng: -23.5133, flag: '🇨🇻',
    language: { code: 'pt-CV', name: 'Portoghese / Creolo', nativeName: 'Português / Kriolu', greeting: 'Bem-vindo a Cabo Verde!' },
    currency: { code: 'CVE', symbol: 'Esc', name: 'Escudo Capoverdiano', rateToEur: 110.26 },
    timezone: 'Atlantic/Cape_Verde',
    regions: [
      { name: 'Santiago (Praia)', capital: 'Praia', lat: 14.9330, lng: -23.5133 },
      { name: 'São Vicente', capital: 'Mindelo', lat: 16.8901, lng: -24.9804 },
    ],
  },
  {
    code: 'TD', code3: 'TCD', name: 'Ciad', nativeName: 'Tchad / تشاد', continent: 'Africa',
    capital: "N'Djamena", lat: 12.1348, lng: 15.0557, flag: '🇹🇩',
    language: { code: 'fr-TD', name: 'Francese / Arabo', nativeName: 'Français / العربية', greeting: 'Bienvenue au Tchad!' },
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 655.95 },
    timezone: 'Africa/Ndjamena',
    regions: [
      { name: "N'Djamena", capital: "N'Djamena", lat: 12.1348, lng: 15.0557 },
      { name: 'Logone Occidental', capital: 'Moundou', lat: 8.5667, lng: 16.0833 },
    ],
  },
  {
    code: 'KM', code3: 'COM', name: 'Comore', nativeName: 'Komori / جزر القمر', continent: 'Africa',
    capital: 'Moroni', lat: -11.7172, lng: 43.2473, flag: '🇰🇲',
    language: { code: 'fr-KM', name: 'Comoriano / Arabo / Francese', nativeName: 'Shikomori', greeting: 'Karibu Komori!' },
    currency: { code: 'KMF', symbol: 'CF', name: 'Franco Comoriano', rateToEur: 491.97 },
    timezone: 'Indian/Comoro',
    regions: [
      { name: 'Grande Comore', capital: 'Moroni', lat: -11.7172, lng: 43.2473 },
      { name: 'Anjouan', capital: 'Mutsamudu', lat: -12.1667, lng: 44.4000 },
    ],
  },
  {
    code: 'CG', code3: 'COG', name: 'Repubblica del Congo', nativeName: 'République du Congo', continent: 'Africa',
    capital: 'Brazzaville', lat: -4.2634, lng: 15.2429, flag: '🇨🇬',
    language: { code: 'fr-CG', name: 'Francese / Lingala', nativeName: 'Français', greeting: 'Bienvenue au Congo!' },
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 655.95 },
    timezone: 'Africa/Brazzaville',
    regions: [
      { name: 'Brazzaville', capital: 'Brazzaville', lat: -4.2634, lng: 15.2429 },
      { name: 'Pointe-Noire', capital: 'Pointe-Noire', lat: -4.7761, lng: 11.8635 },
    ],
  },
  {
    code: 'CD', code3: 'COD', name: 'Repubblica Democratica del Congo', nativeName: 'RD Congo', continent: 'Africa',
    capital: 'Kinshasa', lat: -4.4419, lng: 15.2663, flag: '🇨🇩',
    language: { code: 'fr-CD', name: 'Francese / Lingala / Swahili', nativeName: 'Français / Lingála', greeting: 'Mbote! Bienvenue en RDC!' },
    currency: { code: 'CDF', symbol: 'FC', name: 'Franco Congolese', rateToEur: 3050.0 },
    timezone: 'Africa/Kinshasa',
    regions: [
      { name: 'Kinshasa', capital: 'Kinshasa', lat: -4.4419, lng: 15.2663 },
      { name: 'Haut-Katanga', capital: 'Lubumbashi', lat: -11.6876, lng: 27.5026 },
      { name: 'Nord-Kivu', capital: 'Goma', lat: -1.6585, lng: 29.2205 },
    ],
  },
  {
    code: 'DJ', code3: 'DJI', name: 'Gibuti', nativeName: 'Djibouti / جيبوتي', continent: 'Africa',
    capital: 'Gibuti', lat: 11.5721, lng: 43.1456, flag: '🇩🇯',
    language: { code: 'fr-DJ', name: 'Francese / Arabo', nativeName: 'Français / العربية', greeting: 'Bienvenue à Djibouti!' },
    currency: { code: 'DJF', symbol: 'Fdj', name: 'Franco Gibutiano', rateToEur: 192.0 },
    timezone: 'Africa/Djibouti',
    regions: [
      { name: 'Djibouti-Ville', capital: 'Gibuti', lat: 11.5721, lng: 43.1456 },
      { name: 'Tadjourah', capital: 'Tadjourah', lat: 11.7853, lng: 42.8844 },
    ],
  },
  {
    code: 'GQ', code3: 'GNQ', name: 'Guinea Equatoriale', nativeName: 'Guinea Ecuatorial', continent: 'Africa',
    capital: 'Malabo', lat: 3.7504, lng: 8.7371, flag: '🇬🇶',
    language: { code: 'es-GQ', name: 'Spagnolo / Francese', nativeName: 'Español', greeting: '¡Bienvenido a Guinea Ecuatorial!' },
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 655.95 },
    timezone: 'Africa/Malabo',
    regions: [
      { name: 'Bioko Norte', capital: 'Malabo', lat: 3.7504, lng: 8.7371 },
      { name: 'Litoral', capital: 'Bata', lat: 1.8639, lng: 9.7658 },
    ],
  },
  {
    code: 'ER', code3: 'ERI', name: 'Eritrea', nativeName: 'ኤርትራ / إرتريا', continent: 'Africa',
    capital: 'Asmara', lat: 15.3229, lng: 38.9251, flag: '🇪🇷',
    language: { code: 'ti', name: 'Tigrino / Arabo', nativeName: 'ትግርኛ', greeting: 'እንቋዕ ብደሓን መጻእኩም!' },
    currency: { code: 'ERN', symbol: 'Nfk', name: 'Nakfa Eritreo', rateToEur: 16.2 },
    timezone: 'Africa/Asmara',
    regions: [
      { name: 'Maekel (Centrale)', capital: 'Asmara', lat: 15.3229, lng: 38.9251 },
      { name: 'Mar Rosso Settentrionale', capital: 'Massaua', lat: 15.6081, lng: 39.4746 },
    ],
  },
  {
    code: 'SZ', code3: 'SWZ', name: 'Eswatini', nativeName: 'eSwatini', continent: 'Africa',
    capital: 'Mbabane', lat: -26.3054, lng: 31.1367, flag: '🇸🇿',
    language: { code: 'en-SZ', name: 'Inglese / Swazi', nativeName: 'siSwati / English', greeting: 'Sawubona! Welcome to Eswatini!' },
    currency: { code: 'SZL', symbol: 'L', name: 'Lilangeni', rateToEur: 19.8 },
    timezone: 'Africa/Mbabane',
    regions: [
      { name: 'Hhohho', capital: 'Mbabane', lat: -26.3054, lng: 31.1367 },
      { name: 'Manzini', capital: 'Manzini', lat: -26.4988, lng: 31.3800 },
    ],
  },
  {
    code: 'GA', code3: 'GAB', name: 'Gabon', nativeName: 'Gabon', continent: 'Africa',
    capital: 'Libreville', lat: 0.4162, lng: 9.4673, flag: '🇬🇦',
    language: { code: 'fr-GA', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue au Gabon!' },
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 655.95 },
    timezone: 'Africa/Libreville',
    regions: [
      { name: 'Estuaire', capital: 'Libreville', lat: 0.4162, lng: 9.4673 },
      { name: 'Ogooué-Maritime', capital: 'Port-Gentil', lat: -0.7193, lng: 8.7815 },
    ],
  },
  {
    code: 'GM', code3: 'GMB', name: 'Gambia', nativeName: 'The Gambia', continent: 'Africa',
    capital: 'Banjul', lat: 13.4549, lng: -16.5790, flag: '🇬🇲',
    language: { code: 'en-GM', name: 'Inglese / Mandinka', nativeName: 'English', greeting: 'Welcome to The Gambia!' },
    currency: { code: 'GMD', symbol: 'D', name: 'Dalasi Gambiano', rateToEur: 73.5 },
    timezone: 'Africa/Banjul',
    regions: [
      { name: 'Banjul', capital: 'Banjul', lat: 13.4549, lng: -16.5790 },
      { name: 'Kanifing', capital: 'Serekunda', lat: 13.4383, lng: -16.6781 },
    ],
  },
  {
    code: 'GN', code3: 'GIN', name: 'Guinea', nativeName: 'Guinée', continent: 'Africa',
    capital: 'Conakry', lat: 9.6412, lng: -13.5784, flag: '🇬🇳',
    language: { code: 'fr-GN', name: 'Francese', nativeName: 'Français', greeting: 'Bienvenue en Guinée!' },
    currency: { code: 'GNF', symbol: 'FG', name: 'Franco Guineano', rateToEur: 9300.0 },
    timezone: 'Africa/Conakry',
    regions: [
      { name: 'Conakry', capital: 'Conakry', lat: 9.6412, lng: -13.5784 },
      { name: 'Kankan', capital: 'Kankan', lat: 10.3854, lng: -9.3057 },
    ],
  },
  {
    code: 'GW', code3: 'GNB', name: 'Guinea-Bissau', nativeName: 'Guiné-Bissau', continent: 'Africa',
    capital: 'Bissau', lat: 11.8817, lng: -15.6178, flag: '🇬🇼',
    language: { code: 'pt-GW', name: 'Portoghese / Creolo', nativeName: 'Português', greeting: 'Bem-vindo à Guiné-Bissau!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Bissau',
    regions: [
      { name: 'Bissau', capital: 'Bissau', lat: 11.8817, lng: -15.6178 },
      { name: 'Bafatá', capital: 'Bafatá', lat: 12.1658, lng: -14.6617 },
    ],
  },
  {
    code: 'LS', code3: 'LSO', name: 'Lesotho', nativeName: 'Lesotho', continent: 'Africa',
    capital: 'Maseru', lat: -29.3151, lng: 27.4869, flag: '🇱🇸',
    language: { code: 'st', name: 'Sesotho / Inglese', nativeName: 'Sesotho / English', greeting: 'Khotso! Welcome to Lesotho!' },
    currency: { code: 'LSL', symbol: 'L', name: 'Loti del Lesotho', rateToEur: 19.8 },
    timezone: 'Africa/Maseru',
    regions: [
      { name: 'Maseru', capital: 'Maseru', lat: -29.3151, lng: 27.4869 },
      { name: 'Leribe', capital: 'Hlotse', lat: -28.8719, lng: 28.0450 },
    ],
  },
  {
    code: 'LR', code3: 'LBR', name: 'Liberia', nativeName: 'Liberia', continent: 'Africa',
    capital: 'Monrovia', lat: 6.3156, lng: -10.8074, flag: '🇱🇷',
    language: { code: 'en-LR', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Liberia!' },
    currency: { code: 'LRD', symbol: 'L$', name: 'Dollaro Liberiano', rateToEur: 208.0 },
    timezone: 'Africa/Monrovia',
    regions: [
      { name: 'Montserrado', capital: 'Monrovia', lat: 6.3156, lng: -10.8074 },
      { name: 'Grand Bassa', capital: 'Buchanan', lat: 5.8808, lng: -10.0467 },
    ],
  },
  {
    code: 'LY', code3: 'LBY', name: 'Libia', nativeName: 'ليبيا', continent: 'Africa',
    capital: 'Tripoli', lat: 32.8872, lng: 13.1913, flag: '🇱🇾',
    language: { code: 'ar-LY', name: 'Arabo', nativeName: 'العربية', greeting: 'مرحباً بكم في ليبيا!' },
    currency: { code: 'LYD', symbol: 'LD', name: 'Dinaro Libico', rateToEur: 5.2 },
    timezone: 'Africa/Tripoli',
    regions: [
      { name: 'Tripolitania', capital: 'Tripoli', lat: 32.8872, lng: 13.1913 },
      { name: 'Cirenaica', capital: 'Bengasi', lat: 32.1194, lng: 20.0868 },
    ],
  },
  {
    code: 'MG', code3: 'MDG', name: 'Madagascar', nativeName: 'Madagasikara', continent: 'Africa',
    capital: 'Antananarivo', lat: -18.8792, lng: 47.5079, flag: '🇲🇬',
    language: { code: 'mg', name: 'Malgascio / Francese', nativeName: 'Malagasy / Français', greeting: 'Tonga soa eto Madagasikara!' },
    currency: { code: 'MGA', symbol: 'Ar', name: 'Ariary Malgascio', rateToEur: 4920.0 },
    timezone: 'Indian/Antananarivo',
    regions: [
      { name: 'Analamanga', capital: 'Antananarivo', lat: -18.8792, lng: 47.5079 },
      { name: 'Atsinanana', capital: 'Toamasina', lat: -18.1492, lng: 49.4023 },
    ],
  },
  {
    code: 'MW', code3: 'MWI', name: 'Malawi', nativeName: 'Malawi', continent: 'Africa',
    capital: 'Lilongwe', lat: -13.9626, lng: 33.7741, flag: '🇲🇼',
    language: { code: 'ny', name: 'Chichewa / Inglese', nativeName: 'Chichewa / English', greeting: 'Takulandirani ku Malawi!' },
    currency: { code: 'MWK', symbol: 'MK', name: 'Kwacha Malawiano', rateToEur: 1870.0 },
    timezone: 'Africa/Blantyre',
    regions: [
      { name: 'Central Region', capital: 'Lilongwe', lat: -13.9626, lng: 33.7741 },
      { name: 'Southern Region', capital: 'Blantyre', lat: -15.7861, lng: 35.0058 },
    ],
  },
  {
    code: 'ML', code3: 'MLI', name: 'Mali', nativeName: 'Mali', continent: 'Africa',
    capital: 'Bamako', lat: 12.6392, lng: -8.0029, flag: '🇲🇱',
    language: { code: 'fr-ML', name: 'Francese / Bambara', nativeName: 'Français / Bamanankan', greeting: 'Bisimila! Bienvenue au Mali!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Bamako',
    regions: [
      { name: 'Bamako', capital: 'Bamako', lat: 12.6392, lng: -8.0029 },
      { name: 'Sikasso', capital: 'Sikasso', lat: 11.3176, lng: -5.6665 },
    ],
  },
  {
    code: 'MR', code3: 'MRT', name: 'Mauritania', nativeName: 'موريتانيا', continent: 'Africa',
    capital: 'Nouakchott', lat: 18.0735, lng: -15.9582, flag: '🇲🇷',
    language: { code: 'ar-MR', name: 'Arabo / Francese', nativeName: 'العربية', greeting: 'مرحباً بكم في موريتانيا!' },
    currency: { code: 'MRU', symbol: 'UM', name: 'Ouguiya Mauritana', rateToEur: 43.0 },
    timezone: 'Africa/Nouakchott',
    regions: [
      { name: 'Nouakchott', capital: 'Nouakchott', lat: 18.0735, lng: -15.9582 },
      { name: 'Dakhlet Nouadhibou', capital: 'Nouadhibou', lat: 20.9310, lng: -17.0347 },
    ],
  },
  {
    code: 'MU', code3: 'MUS', name: 'Mauritius', nativeName: 'Maurice / Mauritius', continent: 'Africa',
    capital: 'Port Louis', lat: -20.1609, lng: 57.5012, flag: '🇲🇺',
    language: { code: 'en-MU', name: 'Inglese / Francese / Creolo', nativeName: 'English / Français', greeting: 'Welcome to Mauritius!' },
    currency: { code: 'MUR', symbol: '₨', name: 'Rupia Mauriziana', rateToEur: 50.0 },
    timezone: 'Indian/Mauritius',
    regions: [
      { name: 'Port Louis', capital: 'Port Louis', lat: -20.1609, lng: 57.5012 },
      { name: 'Plaines Wilhems', capital: 'Beau Bassin-Rose Hill', lat: -20.2333, lng: 57.4667 },
    ],
  },
  {
    code: 'MZ', code3: 'MOZ', name: 'Mozambico', nativeName: 'Moçambique', continent: 'Africa',
    capital: 'Maputo', lat: -25.9692, lng: 32.5732, flag: '🇲🇿',
    language: { code: 'pt-MZ', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a Moçambique!' },
    currency: { code: 'MZN', symbol: 'MT', name: 'Metical Mozambicano', rateToEur: 69.0 },
    timezone: 'Africa/Maputo',
    regions: [
      { name: 'Maputo', capital: 'Maputo', lat: -25.9692, lng: 32.5732 },
      { name: 'Sofala', capital: 'Beira', lat: -19.8436, lng: 34.8389 },
    ],
  },
  {
    code: 'NA', code3: 'NAM', name: 'Namibia', nativeName: 'Namibia', continent: 'Africa',
    capital: 'Windhoek', lat: -22.5609, lng: 17.0658, flag: '🇳🇦',
    language: { code: 'en-NA', name: 'Inglese / Afrikaans', nativeName: 'English', greeting: 'Welcome to Namibia!' },
    currency: { code: 'NAD', symbol: 'N$', name: 'Dollaro Namibiano', rateToEur: 19.8 },
    timezone: 'Africa/Windhoek',
    regions: [
      { name: 'Khomas', capital: 'Windhoek', lat: -22.5609, lng: 17.0658 },
      { name: 'Erongo', capital: 'Swakopmund / Walvis Bay', lat: -22.6792, lng: 14.5272 },
    ],
  },
  {
    code: 'NE', code3: 'NER', name: 'Niger', nativeName: 'Niger', continent: 'Africa',
    capital: 'Niamey', lat: 13.5116, lng: 2.1254, flag: '🇳🇪',
    language: { code: 'fr-NE', name: 'Francese / Hausa', nativeName: 'Français', greeting: 'Bienvenue au Niger!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Niamey',
    regions: [
      { name: 'Niamey', capital: 'Niamey', lat: 13.5116, lng: 2.1254 },
      { name: 'Zinder', capital: 'Zinder', lat: 13.8018, lng: 8.9881 },
    ],
  },
  {
    code: 'CF', code3: 'CAF', name: 'Repubblica Centrafricana', nativeName: 'République centrafricaine', continent: 'Africa',
    capital: 'Bangui', lat: 4.3947, lng: 18.5582, flag: '🇨🇫',
    language: { code: 'fr-CF', name: 'Francese / Sango', nativeName: 'Français / Sängö', greeting: 'Bara ala! Bienvenue en Centrafrique!' },
    currency: { code: 'XAF', symbol: 'FCFA', name: 'Franco CFA BEAC', rateToEur: 655.95 },
    timezone: 'Africa/Bangui',
    regions: [
      { name: 'Bangui', capital: 'Bangui', lat: 4.3947, lng: 18.5582 },
      { name: "Ombella-M'Poko", capital: 'Bimbo', lat: 4.2567, lng: 18.4158 },
    ],
  },
  {
    code: 'RW', code3: 'RWA', name: 'Ruanda', nativeName: 'Rwanda', continent: 'Africa',
    capital: 'Kigali', lat: -1.9441, lng: 30.0619, flag: '🇷🇼',
    language: { code: 'rw', name: 'Kinyarwanda / Inglese / Francese', nativeName: 'Ikinyarwanda', greeting: 'Murakaza neza mu Rwanda!' },
    currency: { code: 'RWF', symbol: 'FRw', name: 'Franco Ruandese', rateToEur: 1480.0 },
    timezone: 'Africa/Kigali',
    regions: [
      { name: 'Kigali', capital: 'Kigali', lat: -1.9441, lng: 30.0619 },
      { name: 'Southern Province', capital: 'Huye', lat: -2.5967, lng: 29.7394 },
    ],
  },
  {
    code: 'ST', code3: 'STP', name: 'São Tomé e Príncipe', nativeName: 'São Tomé e Príncipe', continent: 'Africa',
    capital: 'São Tomé', lat: 0.3365, lng: 6.7273, flag: '🇸🇹',
    language: { code: 'pt-ST', name: 'Portoghese', nativeName: 'Português', greeting: 'Bem-vindo a São Tomé e Príncipe!' },
    currency: { code: 'STN', symbol: 'Db', name: 'Dobra', rateToEur: 24.5 },
    timezone: 'Africa/Sao_Tome',
    regions: [
      { name: 'Água Grande', capital: 'São Tomé', lat: 0.3365, lng: 6.7273 },
      { name: 'Região Autónoma do Príncipe', capital: 'Santo António', lat: 1.6373, lng: 7.4195 },
    ],
  },
  {
    code: 'SC', code3: 'SYC', name: 'Seychelles', nativeName: 'Seychelles', continent: 'Africa',
    capital: 'Victoria', lat: -4.6191, lng: 55.4513, flag: '🇸🇨',
    language: { code: 'en-SC', name: 'Creolo / Inglese / Francese', nativeName: 'Kreol Seselwa', greeting: 'Byenveni Sesel!' },
    currency: { code: 'SCR', symbol: 'SR', name: 'Rupia delle Seychelles', rateToEur: 15.2 },
    timezone: 'Indian/Mahe',
    regions: [
      { name: 'Mahé (Victoria)', capital: 'Victoria', lat: -4.6191, lng: 55.4513 },
      { name: 'Praslin', capital: 'Baie Sainte Anne', lat: -4.3210, lng: 55.7370 },
    ],
  },
  {
    code: 'SL', code3: 'SLE', name: 'Sierra Leone', nativeName: 'Sierra Leone', continent: 'Africa',
    capital: 'Freetown', lat: 8.4657, lng: -13.2317, flag: '🇸🇱',
    language: { code: 'en-SL', name: 'Inglese / Krio', nativeName: 'English / Krio', greeting: 'Kusheh! Welcome to Sierra Leone!' },
    currency: { code: 'SLE', symbol: 'Le', name: 'Leone', rateToEur: 24.5 },
    timezone: 'Africa/Freetown',
    regions: [
      { name: 'Western Area', capital: 'Freetown', lat: 8.4657, lng: -13.2317 },
      { name: 'Southern Province', capital: 'Bo', lat: 7.9647, lng: -11.7383 },
    ],
  },
  {
    code: 'SO', code3: 'SOM', name: 'Somalia', nativeName: 'Soomaaliya', continent: 'Africa',
    capital: 'Mogadiscio', lat: 2.0469, lng: 45.3182, flag: '🇸🇴',
    language: { code: 'so', name: 'Somalo / Arabo', nativeName: 'Af-Soomaali', greeting: 'Soo dhowow Soomaaliya!' },
    currency: { code: 'SOS', symbol: 'Sh.So.', name: 'Scellino Somalo', rateToEur: 615.0 },
    timezone: 'Africa/Mogadishu',
    regions: [
      { name: 'Banaadir', capital: 'Mogadiscio', lat: 2.0469, lng: 45.3182 },
      { name: 'Woqooyi Galbeed', capital: 'Hargeisa', lat: 9.5600, lng: 44.0650 },
    ],
  },
  {
    code: 'SS', code3: 'SSD', name: 'Sudan del Sud', nativeName: 'South Sudan', continent: 'Africa',
    capital: 'Giuba (Juba)', lat: 4.8594, lng: 31.5713, flag: '🇸🇸',
    language: { code: 'en-SS', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to South Sudan!' },
    currency: { code: 'SSP', symbol: 'SS£', name: 'Sterlina Sudsudanese', rateToEur: 3200.0 },
    timezone: 'Africa/Juba',
    regions: [
      { name: 'Central Equatoria', capital: 'Giuba (Juba)', lat: 4.8594, lng: 31.5713 },
      { name: 'Upper Nile', capital: 'Malakal', lat: 9.5334, lng: 31.6605 },
    ],
  },
  {
    code: 'SD', code3: 'SDN', name: 'Sudan', nativeName: 'السودان', continent: 'Africa',
    capital: 'Khartum', lat: 15.5007, lng: 32.5599, flag: '🇸🇩',
    language: { code: 'ar-SD', name: 'Arabo / Inglese', nativeName: 'العربية', greeting: 'مرحباً بكم في السودان!' },
    currency: { code: 'SDG', symbol: 'SDG', name: 'Sterlina Sudanese', rateToEur: 650.0 },
    timezone: 'Africa/Khartoum',
    regions: [
      { name: 'Khartum', capital: 'Khartum', lat: 15.5007, lng: 32.5599 },
      { name: 'Mar Rosso', capital: 'Port Sudan', lat: 19.6158, lng: 37.2164 },
    ],
  },
  {
    code: 'TG', code3: 'TGO', name: 'Togo', nativeName: 'Togo', continent: 'Africa',
    capital: 'Lomé', lat: 6.1375, lng: 1.2123, flag: '🇹🇬',
    language: { code: 'fr-TG', name: 'Francese / Ewe', nativeName: 'Français / Eʋegbe', greeting: 'Woezon! Bienvenue au Togo!' },
    currency: { code: 'XOF', symbol: 'CFA', name: 'Franco CFA', rateToEur: 655.95 },
    timezone: 'Africa/Lome',
    regions: [
      { name: 'Maritime', capital: 'Lomé', lat: 6.1375, lng: 1.2123 },
      { name: 'Kara', capital: 'Kara', lat: 9.5511, lng: 1.1861 },
    ],
  },
  {
    code: 'ZM', code3: 'ZMB', name: 'Zambia', nativeName: 'Zambia', continent: 'Africa',
    capital: 'Lusaka', lat: -15.3875, lng: 28.3228, flag: '🇿🇲',
    language: { code: 'en-ZM', name: 'Inglese / Bemba / Nyanja', nativeName: 'English', greeting: 'Mwaiseni! Welcome to Zambia!' },
    currency: { code: 'ZMW', symbol: 'ZK', name: 'Kwacha Zambiano', rateToEur: 28.5 },
    timezone: 'Africa/Lusaka',
    regions: [
      { name: 'Lusaka', capital: 'Lusaka', lat: -15.3875, lng: 28.3228 },
      { name: 'Copperbelt', capital: 'Ndola / Kitwe', lat: -12.9587, lng: 28.6366 },
    ],
  },
  {
    code: 'ZW', code3: 'ZWE', name: 'Zimbabwe', nativeName: 'Zimbabwe', continent: 'Africa',
    capital: 'Harare', lat: -17.8252, lng: 31.0335, flag: '🇿🇼',
    language: { code: 'en-ZW', name: 'Inglese / Shona / Ndebele', nativeName: 'English / chiShona', greeting: 'Mauya! Welcome to Zimbabwe!' },
    currency: { code: 'ZWL', symbol: 'ZiG', name: 'Zimbabwe Gold', rateToEur: 14.8 },
    timezone: 'Africa/Harare',
    regions: [
      { name: 'Harare', capital: 'Harare', lat: -17.8252, lng: 31.0335 },
      { name: 'Bulawayo', capital: 'Bulawayo', lat: -20.1325, lng: 28.6265 },
    ],
  },

  // ============================================================================
  // OCEANIA (14 Stati Sovrani)
  // ============================================================================
  {
    code: 'AU', code3: 'AUS', name: 'Australia', nativeName: 'Australia', continent: 'Oceania',
    capital: 'Canberra', lat: -35.2809, lng: 149.1300, flag: '🇦🇺',
    language: { code: 'en-AU', name: 'Inglese Australiano', nativeName: 'Australian English', greeting: "G'day! Welcome to Australia!" },
    currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano', rateToEur: 1.65 },
    timezone: 'Australia/Sydney',
    regions: [
      { name: 'New South Wales', capital: 'Sydney', lat: -33.8688, lng: 151.2093 },
      { name: 'Victoria', capital: 'Melbourne', lat: -37.8136, lng: 144.9631 },
      { name: 'Queensland', capital: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    ],
  },
  {
    code: 'NZ', code3: 'NZL', name: 'Nuova Zelanda', nativeName: 'Aotearoa / New Zealand', continent: 'Oceania',
    capital: 'Wellington', lat: -41.2865, lng: 174.7762, flag: '🇳🇿',
    language: { code: 'en-NZ', name: 'Inglese / Māori', nativeName: 'English / Te Reo Māori', greeting: 'Haere mai! Welcome to New Zealand!' },
    currency: { code: 'NZD', symbol: 'NZ$', name: 'Dollaro Neozelandese', rateToEur: 1.78 },
    timezone: 'Pacific/Auckland',
    regions: [
      { name: 'Auckland', capital: 'Auckland', lat: -36.8509, lng: 174.7645 },
      { name: 'Wellington', capital: 'Wellington', lat: -41.2865, lng: 174.7762 },
      { name: 'Canterbury', capital: 'Christchurch', lat: -43.5320, lng: 172.6306 },
    ],
  },
  {
    code: 'FJ', code3: 'FJI', name: 'Figi', nativeName: 'Viti / Fiji', continent: 'Oceania',
    capital: 'Suva', lat: -18.1416, lng: 178.4419, flag: '🇫🇯',
    language: { code: 'en-FJ', name: 'Inglese / Figiano', nativeName: 'English / Vosa Vakaviti', greeting: 'Bula! Welcome to Fiji!' },
    currency: { code: 'FJD', symbol: 'FJ$', name: 'Dollaro delle Figi', rateToEur: 2.42 },
    timezone: 'Pacific/Fiji',
  },
  {
    code: 'PG', code3: 'PNG', name: 'Papua Nuova Guinea', nativeName: 'Papua New Guinea', continent: 'Oceania',
    capital: 'Port Moresby', lat: -9.4438, lng: 147.1803, flag: '🇵🇬',
    language: { code: 'en-PG', name: 'Inglese / Tok Pisin', nativeName: 'English / Tok Pisin', greeting: 'Welkam long Papua Niugini!' },
    currency: { code: 'PGK', symbol: 'K', name: 'Kina', rateToEur: 4.18 },
    timezone: 'Pacific/Port_Moresby',
  },
  {
    code: 'SB', code3: 'SLB', name: 'Isole Salomone', nativeName: 'Solomon Islands', continent: 'Oceania',
    capital: 'Honiara', lat: -9.4456, lng: 159.9729, flag: '🇸🇧',
    language: { code: 'en-SB', name: 'Inglese', nativeName: 'English', greeting: 'Welcome to Solomon Islands!' },
    currency: { code: 'SBD', symbol: 'SI$', name: 'Dollaro delle Salomone', rateToEur: 9.1 },
    timezone: 'Pacific/Guadalcanal',
  },
  {
    code: 'VU', code3: 'VUT', name: 'Vanuatu', nativeName: 'Vanuatu', continent: 'Oceania',
    capital: 'Port Vila', lat: -17.7333, lng: 168.3273, flag: '🇻🇺',
    language: { code: 'bi', name: 'Bislama / Inglese / Francese', nativeName: 'Bislama', greeting: 'Welkam long Vanuatu!' },
    currency: { code: 'VUV', symbol: 'VT', name: 'Vatu', rateToEur: 129.0 },
    timezone: 'Pacific/Efate',
  },
  {
    code: 'WS', code3: 'WSM', name: 'Samoa', nativeName: 'Sāmoa', continent: 'Oceania',
    capital: 'Apia', lat: -13.8507, lng: -171.7514, flag: '🇼🇸',
    language: { code: 'sm', name: 'Samoano / Inglese', nativeName: 'Gagana Sāmoa', greeting: 'Talofa! Welcome to Samoa!' },
    currency: { code: 'WST', symbol: 'WS$', name: 'Tala Samoano', rateToEur: 2.95 },
    timezone: 'Pacific/Apia',
  },
  {
    code: 'TO', code3: 'TON', name: 'Tonga', nativeName: 'Tonga', continent: 'Oceania',
    capital: "Nuku'alofa", lat: -21.1393, lng: -175.2049, flag: '🇹🇴',
    language: { code: 'to', name: 'Tongano / Inglese', nativeName: 'Lea Fakatonga', greeting: 'Mālō e lelei!' },
    currency: { code: 'TOP', symbol: 'T$', name: 'Paʻanga Tongano', rateToEur: 2.55 },
    timezone: 'Pacific/Tongatapu',
  },
  {
    code: 'KI', code3: 'KIR', name: 'Kiribati', nativeName: 'Kiribati', continent: 'Oceania',
    capital: 'Tarawa Sud', lat: 1.3382, lng: 173.0176, flag: '🇰🇮',
    language: { code: 'en-KI', name: 'Inglese / Gilbertese', nativeName: 'English / Taetae ni Kiribati', greeting: 'Mauri! Welcome to Kiribati!' },
    currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano / Kiribati', rateToEur: 1.65 },
    timezone: 'Pacific/Tarawa',
  },
  {
    code: 'FM', code3: 'FSM', name: 'Micronesia', nativeName: 'Micronesia', continent: 'Oceania',
    capital: 'Palikir', lat: 6.9248, lng: 158.1610, flag: '🇫🇲',
    language: { code: 'en-FM', name: 'Inglese', nativeName: 'English', greeting: 'Kaselehlie! Welcome to Micronesia!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro USA', rateToEur: 1.08 },
    timezone: 'Pacific/Pohnpei',
  },
  {
    code: 'MH', code3: 'MHL', name: 'Isole Marshall', nativeName: 'Marshall Islands', continent: 'Oceania',
    capital: 'Majuro', lat: 7.1164, lng: 171.1858, flag: '🇲🇭',
    language: { code: 'mh', name: 'Marshallese / Inglese', nativeName: 'Kajin M̧ajeļ', greeting: 'Yokwe!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro USA', rateToEur: 1.08 },
    timezone: 'Pacific/Majuro',
  },
  {
    code: 'PW', code3: 'PLW', name: 'Palau', nativeName: 'Belau / Palau', continent: 'Oceania',
    capital: 'Ngerulmud', lat: 7.5006, lng: 134.6243, flag: '🇵🇼',
    language: { code: 'en-PW', name: 'Palauano / Inglese', nativeName: 'Tekoi er a Belau', greeting: 'Alii! Welcome to Palau!' },
    currency: { code: 'USD', symbol: '$', name: 'Dollaro USA', rateToEur: 1.08 },
    timezone: 'Pacific/Palau',
  },
  {
    code: 'NR', code3: 'NRU', name: 'Nauru', nativeName: 'Nauru', continent: 'Oceania',
    capital: 'Yaren', lat: -0.5477, lng: 166.9209, flag: '🇳🇷',
    language: { code: 'na', name: 'Nauruano / Inglese', nativeName: 'Ekakairũ Naoero', greeting: 'Omo yoran!' },
    currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano', rateToEur: 1.65 },
    timezone: 'Pacific/Nauru',
  },
  {
    code: 'TV', code3: 'TUV', name: 'Tuvalu', nativeName: 'Tuvalu', continent: 'Oceania',
    capital: 'Funafuti', lat: -8.5211, lng: 179.1962, flag: '🇹🇻',
    language: { code: 'tvl', name: 'Tuvaluano / Inglese', nativeName: 'Te Ggana Tuvalu', greeting: 'Talofa!' },
    currency: { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano / Tuvalu', rateToEur: 1.65 },
    timezone: 'Pacific/Funafuti',
  },
];

// Normalizza tutti gli Stati calcolando il piRate reale CoinMarketCap (rateToEur * PI_REAL_PRICE_EUR)
export const WORLD_COUNTRIES: WorldCountry[] = RAW_WORLD_COUNTRIES.map((c) => ({
  ...c,
  currency: {
    code: c.currency.code,
    symbol: c.currency.symbol,
    name: c.currency.name,
    rateToEur: c.currency.rateToEur,
    piRate: computeRealPiRate(c.currency.rateToEur),
  },
}));

export const ADDITIONAL_AFRICAN_COUNTRIES: WorldCountry[] = WORLD_COUNTRIES.filter(
  (c) => c.continent === 'Africa'
);

// Mappatura rapida per codice paese ISO2 & ISO3
export const COUNTRY_BY_CODE = new Map<string, WorldCountry>();
WORLD_COUNTRIES.forEach((c) => {
  COUNTRY_BY_CODE.set(c.code.toUpperCase(), c);
  COUNTRY_BY_CODE.set(c.code3.toUpperCase(), c);
});

function normalizeAtlasKey(val: string): string {
  return String(val || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, "'")
    .replace(/\s+/g, ' ');
}

export const COUNTRY_NAME_ALIASES: Record<string, string> = {
  // Africa
  congo: 'CG',
  'congo-brazzaville': 'CG',
  'republic of the congo': 'CG',
  'repubblica del congo': 'CG',
  'republique du congo': 'CG',
  'dr congo': 'CD',
  'rd congo': 'CD',
  rdc: 'CD',
  'congo-kinshasa': 'CD',
  'democratic republic of the congo': 'CD',
  'repubblica democratica del congo': 'CD',
  egypt: 'EG',
  egitto: 'EG',
  'il cairo': 'EG',
  cairo: 'EG',
  morocco: 'MA',
  marocco: 'MA',
  ethiopia: 'ET',
  etiopia: 'ET',
  cameroon: 'CM',
  camerun: 'CM',
  'south africa': 'ZA',
  sudafrica: 'ZA',
  'cape town': 'ZA',
  johannesburg: 'ZA',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  "costa d'avorio": 'CI',
  algeria: 'DZ',
  tunisia: 'TN',
  libya: 'LY',
  libia: 'LY',
  sudan: 'SD',
  'south sudan': 'SS',
  'sudan del sud': 'SS',
  nigeria: 'NG',
  lagos: 'NG',
  kenya: 'KE',
  nairobi: 'KE',
  ghana: 'GH',
  senegal: 'SN',
  tanzania: 'TZ',
  uganda: 'UG',
  angola: 'AO',
  benin: 'BJ',
  botswana: 'BW',
  'burkina faso': 'BF',
  burundi: 'BI',
  'cape verde': 'CV',
  'cabo verde': 'CV',
  'capo verde': 'CV',
  chad: 'TD',
  tchad: 'TD',
  ciad: 'TD',
  comoros: 'KM',
  comore: 'KM',
  djibouti: 'DJ',
  gibuti: 'DJ',
  'equatorial guinea': 'GQ',
  'guinea equatoriale': 'GQ',
  eritrea: 'ER',
  eswatini: 'SZ',
  swaziland: 'SZ',
  gabon: 'GA',
  gambia: 'GM',
  'the gambia': 'GM',
  guinea: 'GN',
  'guinea-bissau': 'GW',
  lesotho: 'LS',
  liberia: 'LR',
  madagascar: 'MG',
  malawi: 'MW',
  mali: 'ML',
  mauritania: 'MR',
  mauritius: 'MU',
  mozambique: 'MZ',
  mozambico: 'MZ',
  namibia: 'NA',
  niger: 'NE',
  'central african republic': 'CF',
  'repubblica centrafricana': 'CF',
  rwanda: 'RW',
  ruanda: 'RW',
  'sao tome and principe': 'ST',
  'sao tome e principe': 'ST',
  seychelles: 'SC',
  'sierra leone': 'SL',
  somalia: 'SO',
  togo: 'TG',
  zambia: 'ZM',
  zimbabwe: 'ZW',

  // Europa
  italy: 'IT',
  italia: 'IT',
  roma: 'IT',
  rome: 'IT',
  milano: 'IT',
  milan: 'IT',
  france: 'FR',
  francia: 'FR',
  paris: 'FR',
  parigi: 'FR',
  spain: 'ES',
  spagna: 'ES',
  espana: 'ES',
  madrid: 'ES',
  barcelona: 'ES',
  barcellona: 'ES',
  germany: 'DE',
  germania: 'DE',
  deutschland: 'DE',
  berlin: 'DE',
  berlino: 'DE',
  'united kingdom': 'GB',
  uk: 'GB',
  'great britain': 'GB',
  england: 'GB',
  inghilterra: 'GB',
  'regno unito': 'GB',
  london: 'GB',
  londra: 'GB',
  switzerland: 'CH',
  svizzera: 'CH',
  schweiz: 'CH',
  suisse: 'CH',
  zurich: 'CH',
  zurigo: 'CH',
  portugal: 'PT',
  portogallo: 'PT',
  lisbon: 'PT',
  lisbona: 'PT',
  netherlands: 'NL',
  holland: 'NL',
  olanda: 'NL',
  'paesi bassi': 'NL',
  amsterdam: 'NL',
  belgium: 'BE',
  belgio: 'BE',
  belgique: 'BE',
  belgie: 'BE',
  austria: 'AT',
  vienna: 'AT',
  greece: 'GR',
  grecia: 'GR',
  athens: 'GR',
  atene: 'GR',
  sweden: 'SE',
  svezia: 'SE',
  sverige: 'SE',
  norway: 'NO',
  norvegia: 'NO',
  norge: 'NO',
  denmark: 'DK',
  danimarca: 'DK',
  danmark: 'DK',
  finland: 'FI',
  finlandia: 'FI',
  suomi: 'FI',
  ireland: 'IE',
  irlanda: 'IE',
  eire: 'IE',
  poland: 'PL',
  polonia: 'PL',
  polska: 'PL',
  czechia: 'CZ',
  'czech republic': 'CZ',
  'repubblica ceca': 'CZ',
  slovakia: 'SK',
  slovacchia: 'SK',
  hungary: 'HU',
  ungheria: 'HU',
  romania: 'RO',
  bulgaria: 'BG',
  croatia: 'HR',
  croazia: 'HR',
  slovenia: 'SI',
  estonia: 'EE',
  latvia: 'LV',
  lettonia: 'LV',
  lithuania: 'LT',
  lituania: 'LT',
  luxembourg: 'LU',
  lussemburgo: 'LU',
  malta: 'MT',
  cyprus: 'CY',
  cipro: 'CY',
  iceland: 'IS',
  islanda: 'IS',
  ukraine: 'UA',
  ucraina: 'UA',
  russia: 'RU',
  serbia: 'RS',
  bosnia: 'BA',
  'bosnia and herzegovina': 'BA',
  'bosnia ed erzegovina': 'BA',
  montenegro: 'ME',
  'north macedonia': 'MK',
  'macedonia del nord': 'MK',
  albania: 'AL',
  kosovo: 'XK',
  moldova: 'MD',
  moldavia: 'MD',
  belarus: 'BY',
  bielorussia: 'BY',
  andorra: 'AD',
  monaco: 'MC',
  'san marino': 'SM',
  liechtenstein: 'LI',
  vatican: 'VA',
  'vatican city': 'VA',
  'citta del vaticano': 'VA',

  // Americhe
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  'stati uniti': 'US',
  'new york': 'US',
  california: 'US',
  canada: 'CA',
  mexico: 'MX',
  messico: 'MX',
  guatemala: 'GT',
  belize: 'BZ',
  honduras: 'HN',
  'el salvador': 'SV',
  nicaragua: 'NI',
  'costa rica': 'CR',
  panama: 'PA',
  cuba: 'CU',
  jamaica: 'JM',
  giamaica: 'JM',
  haiti: 'HT',
  'dominican republic': 'DO',
  'repubblica dominicana': 'DO',
  bahamas: 'BS',
  barbados: 'BB',
  'trinidad and tobago': 'TT',
  'trinidad e tobago': 'TT',
  'saint lucia': 'LC',
  grenada: 'GD',
  'saint vincent and the grenadines': 'VC',
  'antigua and barbuda': 'AG',
  dominica: 'DM',
  'saint kitts and nevis': 'KN',
  brazil: 'BR',
  brasile: 'BR',
  brasil: 'BR',
  argentina: 'AR',
  colombia: 'CO',
  chile: 'CL',
  cile: 'CL',
  peru: 'PE',
  venezuela: 'VE',
  ecuador: 'EC',
  bolivia: 'BO',
  paraguay: 'PY',
  uruguay: 'UY',
  guyana: 'GY',
  suriname: 'SR',

  // Asia & Medio Oriente
  japan: 'JP',
  giappone: 'JP',
  tokyo: 'JP',
  china: 'CN',
  cina: 'CN',
  'south korea': 'KR',
  'corea del sud': 'KR',
  korea: 'KR',
  seoul: 'KR',
  seul: 'KR',
  'north korea': 'KP',
  'corea del nord': 'KP',
  india: 'IN',
  'united arab emirates': 'AE',
  uae: 'AE',
  'emirati arabi uniti': 'AE',
  'emirati arabi': 'AE',
  dubai: 'AE',
  'abu dhabi': 'AE',
  'saudi arabia': 'SA',
  'arabia saudita': 'SA',
  saudi: 'SA',
  riyadh: 'SA',
  qatar: 'QA',
  doha: 'QA',
  kuwait: 'KW',
  bahrain: 'BH',
  bahrein: 'BH',
  oman: 'OM',
  israel: 'IL',
  israele: 'IL',
  palestine: 'PS',
  palestina: 'PS',
  jordan: 'JO',
  giordania: 'JO',
  lebanon: 'LB',
  libano: 'LB',
  syria: 'SY',
  siria: 'SY',
  iraq: 'IQ',
  iran: 'IR',
  yemen: 'YE',
  turkey: 'TR',
  turkiye: 'TR',
  turchia: 'TR',
  georgia: 'GE',
  armenia: 'AM',
  azerbaijan: 'AZ',
  azerbaigian: 'AZ',
  kazakhstan: 'KZ',
  kazakistan: 'KZ',
  uzbekistan: 'UZ',
  turkmenistan: 'TM',
  kyrgyzstan: 'KG',
  kirghizistan: 'KG',
  tajikistan: 'TJ',
  tagikistan: 'TJ',
  afghanistan: 'AF',
  pakistan: 'PK',
  bangladesh: 'BD',
  'sri lanka': 'LK',
  nepal: 'NP',
  bhutan: 'BT',
  maldives: 'MV',
  maldive: 'MV',
  myanmar: 'MM',
  burma: 'MM',
  birmania: 'MM',
  thailand: 'TH',
  thailandia: 'TH',
  bangkok: 'TH',
  laos: 'LA',
  cambodia: 'KH',
  cambogia: 'KH',
  vietnam: 'VN',
  malaysia: 'MY',
  malesia: 'MY',
  singapore: 'SG',
  brunei: 'BN',
  indonesia: 'ID',
  bali: 'ID',
  philippines: 'PH',
  filippine: 'PH',
  'timor-leste': 'TL',
  'east timor': 'TL',
  'timor est': 'TL',
  mongolia: 'MN',
  taiwan: 'TW',

  // Oceania
  australia: 'AU',
  sydney: 'AU',
  melbourne: 'AU',
  'new zealand': 'NZ',
  'nuova zelanda': 'NZ',
  aotearoa: 'NZ',
  fiji: 'FJ',
  figi: 'FJ',
  'papua new guinea': 'PG',
  'papua nuova guinea': 'PG',
  'solomon islands': 'SB',
  'isole salomone': 'SB',
  vanuatu: 'VU',
  samoa: 'WS',
  tonga: 'TO',
  kiribati: 'KI',
  micronesia: 'FM',
  'marshall islands': 'MH',
  'isole marshall': 'MH',
  palau: 'PW',
  nauru: 'NR',
  tuvalu: 'TV',
};

// Trova Paese da stringa con matching gerarchico a 3 livelli (evita collisioni es. Niger vs Nigeria, Guinea vs Guinea-Bissau)
export function findCountryByNameOrCode(query: string): WorldCountry | null {
  if (!query) return null;
  const rawTrim = String(query).trim();
  const qNorm = normalizeAtlasKey(rawTrim);
  if (!qNorm) return null;

  // Livello 1: match esatto per codice ISO2/ISO3, alias normalizzato, nome, nativeName o capitale
  const byCode = COUNTRY_BY_CODE.get(rawTrim.toUpperCase());
  if (byCode) return byCode;

  const aliasCode = COUNTRY_NAME_ALIASES[qNorm];
  if (aliasCode) {
    const byAlias = COUNTRY_BY_CODE.get(aliasCode);
    if (byAlias) return byAlias;
  }

  const exactCountry = WORLD_COUNTRIES.find(
    (c) =>
      normalizeAtlasKey(c.name) === qNorm ||
      normalizeAtlasKey(c.nativeName) === qNorm ||
      normalizeAtlasKey(c.capital) === qNorm
  );
  if (exactCountry) return exactCountry;

  // Match esatto su nomi di regioni/città note
  const exactRegionCountry = WORLD_COUNTRIES.find((c) =>
    c.regions?.some(
      (r) =>
        normalizeAtlasKey(r.name) === qNorm ||
        normalizeAtlasKey(r.capital) === qNorm
    )
  );
  if (exactRegionCountry) return exactRegionCountry;

  // Evita collisioni di prefisso/sottostringa su input brevissimi (<= 2 caratteri non ISO)
  if (qNorm.length < 3) return null;

  // Livello 2: match a prefisso (startsWith) privilegiando la corrispondenza più stretta (nome più corto)
  const startsMatches = WORLD_COUNTRIES.filter(
    (c) =>
      normalizeAtlasKey(c.name).startsWith(qNorm) ||
      normalizeAtlasKey(c.nativeName).startsWith(qNorm) ||
      normalizeAtlasKey(c.capital).startsWith(qNorm)
  ).sort((a, b) => a.name.length - b.name.length);
  if (startsMatches.length > 0) return startsMatches[0];

  // Livello 2b: startsWith sugli alias
  const aliasPrefixKeys = Object.keys(COUNTRY_NAME_ALIASES)
    .filter((k) => k.startsWith(qNorm))
    .sort((a, b) => a.length - b.length);
  if (aliasPrefixKeys.length > 0) {
    const byAliasPrefix = COUNTRY_BY_CODE.get(COUNTRY_NAME_ALIASES[aliasPrefixKeys[0]]);
    if (byAliasPrefix) return byAliasPrefix;
  }

  // Livello 3: match per confine di parola (word boundary) o inclusione controllata
  const escaped = qNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`(^|\\s|-)${escaped}(\\s|-|$)`, 'i');
  const wordMatch = WORLD_COUNTRIES.find(
    (c) =>
      wordRegex.test(normalizeAtlasKey(c.name)) ||
      wordRegex.test(normalizeAtlasKey(c.nativeName)) ||
      wordRegex.test(normalizeAtlasKey(c.capital))
  );
  if (wordMatch) return wordMatch;

  const partialMatch = WORLD_COUNTRIES.find(
    (c) =>
      normalizeAtlasKey(c.name).includes(qNorm) ||
      normalizeAtlasKey(c.nativeName).includes(qNorm)
  );
  return partialMatch || null;
}

export interface AtlasTargetEntry {
  lat: number;
  lng: number;
  zoom?: number;
}

export const WORLD_ATLAS_LOOKUP: Record<string, AtlasTargetEntry> = (() => {
  const map: Record<string, AtlasTargetEntry> = {};
  for (const c of WORLD_COUNTRIES) {
    const zoom = c.regions && c.regions.length > 8 ? 5 : 6;
    const entry: AtlasTargetEntry = { lat: c.lat, lng: c.lng, zoom };
    map[c.name] = entry;
    if (c.nativeName && !map[c.nativeName]) map[c.nativeName] = entry;
    if (c.code && !map[c.code]) map[c.code] = entry;
    if (c.code3 && !map[c.code3]) map[c.code3] = entry;
  }
  for (const [alias, code] of Object.entries(COUNTRY_NAME_ALIASES)) {
    const matched = COUNTRY_BY_CODE.get(code);
    if (matched && !map[alias]) {
      map[alias] = { lat: matched.lat, lng: matched.lng, zoom: 5 };
    }
  }
  return map;
})();

export function handleCountrySelection(
  countryName: string,
  atlasData: Record<string, { lat: number; lng: number; zoom?: number }> = WORLD_ATLAS_LOOKUP
) {
  const rawName = String(countryName || '');
  const normalizedKey = rawName.trim().toLowerCase();
  const normalizedDeaccented = normalizeAtlasKey(rawName);

  const countryEntry =
    Object.entries(atlasData).find(([key]) => key.trim().toLowerCase() === normalizedKey) ||
    Object.entries(atlasData).find(([key]) => normalizeAtlasKey(key) === normalizedDeaccented);

  if (countryEntry && countryEntry[1]) {
    const { lat, lng, zoom } = countryEntry[1];

    if (isValidCoord(lat, lng)) {
      return {
        success: true,
        target: {
          lat,
          lng,
          zoom: zoom || 5,
          name: countryEntry[0],
        },
      };
    }
  }

  // Fallback sul resolver completo soltanto quando stiamo usando il lookup di default
  if (atlasData === WORLD_ATLAS_LOOKUP) {
    const resolved = findCountryByNameOrCode(rawName);
    if (resolved && isValidCoord(resolved.lat, resolved.lng)) {
      return {
        success: true,
        target: {
          lat: resolved.lat,
          lng: resolved.lng,
          zoom: resolved.regions && resolved.regions.length > 8 ? 5 : 6,
          name: resolved.name,
        },
      };
    }
  }

  throw new Error(
    `Coordinate non trovate per il territorio: ${countryName}. Impossibile applicare fallback su Roma.`
  );
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
  const qNorm = normalizeAtlasKey(cleanQ);

  // Controlla prima corrispondenza diretta tramite alias/codice/nome esatto
  const directCountry = findCountryByNameOrCode(cleanQ);
  if (directCountry) {
    results.push({
      id: `country_${directCountry.code}`,
      name: directCountry.name,
      displayName: `${directCountry.flag} ${directCountry.name} (${directCountry.capital}) - Stato Sovrano`,
      type: 'country',
      lat: directCountry.lat,
      lng: directCountry.lng,
      countryName: directCountry.name,
      countryCode: directCountry.code,
      stateOrRegion: directCountry.capital,
      flag: directCountry.flag,
      language: directCountry.language,
      currency: directCountry.currency,
      timezone: directCountry.timezone,
      greeting: directCountry.language.greeting,
    });
  }

  // Corrispondenze nel database locale
  WORLD_COUNTRIES.forEach((c) => {
    const matchesCountry =
      normalizeAtlasKey(c.name).includes(qNorm) ||
      normalizeAtlasKey(c.nativeName).includes(qNorm) ||
      normalizeAtlasKey(c.capital).includes(qNorm);

    if (matchesCountry && !results.some((r) => r.id === `country_${c.code}`)) {
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

    if (c.regions) {
      c.regions.forEach((r) => {
        if (
          normalizeAtlasKey(r.name).includes(qNorm) ||
          normalizeAtlasKey(r.capital).includes(qNorm)
        ) {
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

  // Geocodifica globale via Photon API (OpenStreetMap)
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

          const lng = Number(coords[0]);
          const lat = Number(coords[1]);
          if (!isValidCoord(lat, lng)) return;

          const name = props.name || cleanQ;
          const countryCode = (props.countrycode || '').toUpperCase();
          const countryName = props.country || 'Mondo';
          const state = props.state || props.county || props.district || '';
          const type = props.type || props.osm_value || 'locality';

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
            name: 'Valuta Globale',
            rateToEur: 1.0,
            piRate: computeRealPiRate(1.0),
          };
          const timezone = matchedCountry?.timezone || 'UTC';

          const parts = [flag, name];
          if (state && state !== name) parts.push(state);
          if (countryName && countryName !== name) parts.push(countryName);

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
  } catch {
    // Rete offline o timeout: i risultati locali rimangono validi
  }

  return results.slice(0, 10);
}

// 2B. CALCOLO GEOGRAFICO: Identifica il Paese più vicino a qualsiasi coordinata valida (lat, lng) del globo
export function findNearestCountry(lat: number, lng: number): WorldCountry {
  let closest: WorldCountry = WORLD_COUNTRIES[0];
  let minDistance = Infinity;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return closest;
  }

  const normalizedLng = ((((lng + 180) % 360) + 360) % 360) - 180;

  const isAfricaBounds = lat >= -35.5 && lat <= 38.0 && normalizedLng >= -18.5 && normalizedLng <= 52.0;
  const targetList = isAfricaBounds
    ? WORLD_COUNTRIES.filter((c) => c.continent === 'Africa')
    : WORLD_COUNTRIES;

  for (const country of targetList.length > 0 ? targetList : WORLD_COUNTRIES) {
    if (typeof country.lat !== 'number' || typeof country.lng !== 'number') continue;
    const dLat = (country.lat - lat) * (Math.PI / 180);
    const dLng = (country.lng - normalizedLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) *
        Math.cos(country.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (c < minDistance) {
      minDistance = c;
      closest = country;
    }
  }

  return closest;
}

// 3. REVERSE GEOCODING AUTOMATICO: Da coordinate (lat, lng) identifica Paese, Regione, Lingua e Valuta (MAI fallback forzato su Italia/Roma)
export async function lookupLocationFromCoords(lat: number, lng: number): Promise<WorldPlaceResult> {
  if (!isValidCoord(lat, lng)) {
    return {
      id: 'coord_unresolved',
      name: 'Posizione Globale',
      displayName: '🌍 Posizione non specificata',
      type: 'locality',
      lat: 0,
      lng: 0,
      countryName: 'Mondo',
      countryCode: 'GLOBAL',
      stateOrRegion: '',
      flag: '🌍',
      language: { code: 'und', name: 'Multilingua', nativeName: 'Global', greeting: 'Benvenuto su Have2Want!' },
      currency: { code: 'EUR', symbol: '€', name: 'Euro', rateToEur: 1.0, piRate: computeRealPiRate(1.0) },
      timezone: 'UTC',
      greeting: 'Benvenuto su Have2Want!',
    };
  }

  const matchedCountry: WorldCountry = findNearestCountry(lat, lng);

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
        const cName = props.country || matchedCountry.name;
        const cityName = props.city || props.town || props.village || props.locality || props.name || 'Territorio 3D';
        const stateName = props.state || props.county || '';

        const exactCountry = COUNTRY_BY_CODE.get(cCode) || findCountryByNameOrCode(cName) || matchedCountry;

        const flag = exactCountry.flag || '📍';
        const language = exactCountry.language;
        const currency = exactCountry.currency;

        return {
          id: `coord_${lat.toFixed(3)}_${lng.toFixed(3)}`,
          name: cityName,
          displayName: `${flag} ${cityName}${stateName ? `, ${stateName}` : ''}, ${exactCountry.name}`,
          type: 'city',
          lat,
          lng,
          countryName: exactCountry.name,
          countryCode: cCode || exactCountry.code,
          stateOrRegion: stateName,
          flag,
          language,
          currency,
          timezone: exactCountry.timezone || 'UTC',
          greeting: language.greeting,
        };
      }
    }
  } catch {
    // Rete offline: usa la risoluzione geodetica più vicina
  }

  return {
    id: `coord_${lat.toFixed(3)}_${lng.toFixed(3)}`,
    name: matchedCountry.name,
    displayName: `${matchedCountry.flag} ${matchedCountry.name} (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
    type: 'country',
    lat,
    lng,
    countryName: matchedCountry.name,
    countryCode: matchedCountry.code,
    stateOrRegion: matchedCountry.capital,
    flag: matchedCountry.flag,
    language: matchedCountry.language,
    currency: matchedCountry.currency,
    timezone: matchedCountry.timezone,
    greeting: matchedCountry.language.greeting,
  };
}

// 4. FORMATTATORE DI PREZZO NELLA VALUTA LOCALE CON PI COIN (RIFERIMENTO COINMARKETCAP)
export function formatLocalPrice(
  piAmount: number,
  currency: LocalCurrency
): { piFormatted: string; localFormatted: string; combined: string } {
  const piFormatted = `${Number(piAmount).toFixed(2)} π`;
  const rateInLocalFiat = computeRealPiRate(currency.rateToEur || 1.0);
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
  } catch {
    return new Date().toLocaleTimeString('it-IT');
  }
}
