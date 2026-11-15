// MODULO GEOGRAFICO (Data)
// Database mondiale esteso con i territori principali del pianeta
// Per ogni paese: id, name, flag, currency, lang, lat, lng, capital, continent

export interface CountryData {
  id: string;
  name: string;
  flag: string;
  currency: string;
  lang: string;
  lat: number;
  lng: number;
  capital: string;
  continent: 'Europa' | 'Nord America' | 'Sud America' | 'Asia' | 'Africa' | 'Oceania';
}

export type Country = CountryData;

export const COUNTRIES: CountryData[] = [
  // EUROPA
  {
    id: 'it',
    name: 'Italia',
    flag: '🇮🇹',
    currency: 'EUR (€)',
    lang: 'Italiano',
    lat: 41.8902,
    lng: 12.4922,
    capital: 'Roma',
    continent: 'Europa'
  },
  {
    id: 'es',
    name: 'Spagna',
    flag: '🇪🇸',
    currency: 'EUR (€)',
    lang: 'Spagnolo',
    lat: 40.4168,
    lng: -3.7038,
    capital: 'Madrid',
    continent: 'Europa'
  },
  {
    id: 'fr',
    name: 'Francia',
    flag: '🇫🇷',
    currency: 'EUR (€)',
    lang: 'Francese',
    lat: 48.8566,
    lng: 2.3522,
    capital: 'Parigi',
    continent: 'Europa'
  },
  {
    id: 'de',
    name: 'Germania',
    flag: '🇩🇪',
    currency: 'EUR (€)',
    lang: 'Tedesco',
    lat: 52.5200,
    lng: 13.4050,
    capital: 'Berlino',
    continent: 'Europa'
  },
  {
    id: 'gb',
    name: 'Regno Unito',
    flag: '🇬🇧',
    currency: 'GBP (£)',
    lang: 'Inglese',
    lat: 51.5074,
    lng: -0.1278,
    capital: 'Londra',
    continent: 'Europa'
  },
  {
    id: 'ch',
    name: 'Svizzera',
    flag: '🇨🇭',
    currency: 'CHF (CHF)',
    lang: 'Italiano, Tedesco, Francese, Romancio',
    lat: 46.8182,
    lng: 8.2275,
    capital: 'Berna',
    continent: 'Europa'
  },
  {
    id: 'pt',
    name: 'Portogallo',
    flag: '🇵🇹',
    currency: 'EUR (€)',
    lang: 'Portoghese',
    lat: 38.7223,
    lng: -9.1393,
    capital: 'Lisbona',
    continent: 'Europa'
  },
  {
    id: 'nl',
    name: 'Paesi Bassi',
    flag: '🇳🇱',
    currency: 'EUR (€)',
    lang: 'Olandese',
    lat: 52.3676,
    lng: 4.9041,
    capital: 'Amsterdam',
    continent: 'Europa'
  },
  {
    id: 'gr',
    name: 'Grecia',
    flag: '🇬🇷',
    currency: 'EUR (€)',
    lang: 'Greco',
    lat: 37.9838,
    lng: 23.7275,
    capital: 'Atene',
    continent: 'Europa'
  },
  {
    id: 'se',
    name: 'Svezia',
    flag: '🇸🇪',
    currency: 'SEK (kr)',
    lang: 'Svedese',
    lat: 59.3293,
    lng: 18.0686,
    capital: 'Stoccolma',
    continent: 'Europa'
  },
  {
    id: 'no',
    name: 'Norvegia',
    flag: '🇳🇴',
    currency: 'NOK (kr)',
    lang: 'Norvegese',
    lat: 59.9139,
    lng: 10.7522,
    capital: 'Oslo',
    continent: 'Europa'
  },
  {
    id: 'ie',
    name: 'Irlanda',
    flag: '🇮🇪',
    currency: 'EUR (€)',
    lang: 'Inglese, Irlandese',
    lat: 53.3498,
    lng: -6.2603,
    capital: 'Dublino',
    continent: 'Europa'
  },
  {
    id: 'pl',
    name: 'Polonia',
    flag: '🇵🇱',
    currency: 'PLN (zł)',
    lang: 'Polacco',
    lat: 52.2297,
    lng: 21.0122,
    capital: 'Varsavia',
    continent: 'Europa'
  },

  // NORD AMERICA
  {
    id: 'us',
    name: 'Stati Uniti',
    flag: '🇺🇸',
    currency: 'USD ($)',
    lang: 'Inglese',
    lat: 38.8951,
    lng: -77.0364,
    capital: 'Washington D.C.',
    continent: 'Nord America'
  },
  {
    id: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD (C$)',
    lang: 'Inglese, Francese',
    lat: 45.4215,
    lng: -75.6972,
    capital: 'Ottawa',
    continent: 'Nord America'
  },
  {
    id: 'mx',
    name: 'Messico',
    flag: '🇲🇽',
    currency: 'MXN ($)',
    lang: 'Spagnolo',
    lat: 19.4326,
    lng: -99.1332,
    capital: 'Città del Messico',
    continent: 'Nord America'
  },

  // SUD AMERICA
  {
    id: 'br',
    name: 'Brasile',
    flag: '🇧🇷',
    currency: 'BRL (R$)',
    lang: 'Portoghese',
    lat: -15.7975,
    lng: -47.8919,
    capital: 'Brasilia',
    continent: 'Sud America'
  },
  {
    id: 'ar',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS ($)',
    lang: 'Spagnolo',
    lat: -34.6037,
    lng: -58.3816,
    capital: 'Buenos Aires',
    continent: 'Sud America'
  },
  {
    id: 'co',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP ($)',
    lang: 'Spagnolo',
    lat: 4.7110,
    lng: -74.0721,
    capital: 'Bogotà',
    continent: 'Sud America'
  },
  {
    id: 'cl',
    name: 'Cile',
    flag: '🇨🇱',
    currency: 'CLP ($)',
    lang: 'Spagnolo',
    lat: -33.4489,
    lng: -70.6693,
    capital: 'Santiago',
    continent: 'Sud America'
  },

  // ASIA & MEDIO ORIENTE
  {
    id: 'cn',
    name: 'Cina',
    flag: '🇨🇳',
    currency: 'CNY (¥)',
    lang: 'Cinese Mandarino',
    lat: 39.9042,
    lng: 116.4074,
    capital: 'Pechino',
    continent: 'Asia'
  },
  {
    id: 'jp',
    name: 'Giappone',
    flag: '🇯🇵',
    currency: 'JPY (¥)',
    lang: 'Giapponese',
    lat: 35.6762,
    lng: 139.6503,
    capital: 'Tokyo',
    continent: 'Asia'
  },
  {
    id: 'in',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR (₹)',
    lang: 'Hindi, Inglese',
    lat: 28.6139,
    lng: 77.2090,
    capital: 'Nuova Delhi',
    continent: 'Asia'
  },
  {
    id: 'kr',
    name: 'Corea del Sud',
    flag: '🇰🇷',
    currency: 'KRW (₩)',
    lang: 'Coreano',
    lat: 37.5665,
    lng: 126.9780,
    capital: 'Seul',
    continent: 'Asia'
  },
  {
    id: 'sg',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD (S$)',
    lang: 'Inglese, Malese, Mandarino, Tamil',
    lat: 1.3521,
    lng: 103.8198,
    capital: 'Singapore',
    continent: 'Asia'
  },
  {
    id: 'ae',
    name: 'Emirati Arabi Uniti',
    flag: '🇦🇪',
    currency: 'AED (د.إ)',
    lang: 'Arabo',
    lat: 24.4539,
    lng: 54.3773,
    capital: 'Abu Dhabi',
    continent: 'Asia'
  },
  {
    id: 'sa',
    name: 'Arabia Saudita',
    flag: '🇸🇦',
    currency: 'SAR (﷼)',
    lang: 'Arabo',
    lat: 24.7136,
    lng: 46.6753,
    capital: 'Riyadh',
    continent: 'Asia'
  },
  {
    id: 'id',
    name: 'Indonesia',
    flag: '🇮🇩',
    currency: 'IDR (Rp)',
    lang: 'Indonesiano',
    lat: -6.2088,
    lng: 106.8456,
    capital: 'Giacarta',
    continent: 'Asia'
  },
  {
    id: 'tr',
    name: 'Turchia',
    flag: '🇹🇷',
    currency: 'TRY (₺)',
    lang: 'Turco',
    lat: 39.9334,
    lng: 32.8597,
    capital: 'Ankara',
    continent: 'Asia'
  },

  // OCEANIA
  {
    id: 'au',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD (A$)',
    lang: 'Inglese',
    lat: -35.2809,
    lng: 149.1300,
    capital: 'Canberra',
    continent: 'Oceania'
  },
  {
    id: 'nz',
    name: 'Nuova Zelanda',
    flag: '🇳🇿',
    currency: 'NZD (NZ$)',
    lang: 'Inglese, Maori',
    lat: -41.2865,
    lng: 174.7762,
    capital: 'Wellington',
    continent: 'Oceania'
  },

  // AFRICA
  {
    id: 'za',
    name: 'Sudafrica',
    flag: '🇿🇦',
    currency: 'ZAR (R)',
    lang: 'Inglese, Afrikaans, Zulu, Xhosa',
    lat: -25.7479,
    lng: 28.2293,
    capital: 'Pretoria',
    continent: 'Africa'
  },
  {
    id: 'eg',
    name: 'Egitto',
    flag: '🇪🇬',
    currency: 'EGP (E£)',
    lang: 'Arabo',
    lat: 30.0444,
    lng: 31.2357,
    capital: 'Il Cairo',
    continent: 'Africa'
  },
  {
    id: 'ma',
    name: 'Marocco',
    flag: '🇲🇦',
    currency: 'MAD (د.م.)',
    lang: 'Arabo, Berbero',
    lat: 34.0209,
    lng: -6.8416,
    capital: 'Rabat',
    continent: 'Africa'
  },
  {
    id: 'ng',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN (₦)',
    lang: 'Inglese, Hausa, Yoruba, Igbo',
    lat: 9.0765,
    lng: 7.3986,
    capital: 'Abuja',
    continent: 'Africa'
  },
  {
    id: 'ke',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES (KSh)',
    lang: 'Swahili, Inglese',
    lat: -1.2921,
    lng: 36.8219,
    capital: 'Nairobi',
    continent: 'Africa'
  },
  {
    id: 'gh',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS (GH₵)',
    lang: 'Inglese, Akan, Twi',
    lat: 5.6037,
    lng: -0.1870,
    capital: 'Accra',
    continent: 'Africa'
  },
  {
    id: 'sn',
    name: 'Senegal',
    flag: '🇸🇳',
    currency: 'XOF (CFA)',
    lang: 'Francese, Wolof',
    lat: 14.7167,
    lng: -17.4677,
    capital: 'Dakar',
    continent: 'Africa'
  },
  {
    id: 'dz',
    name: 'Algeria',
    flag: '🇩🇿',
    currency: 'DZD (DA)',
    lang: 'Arabo, Berbero, Francese',
    lat: 36.7538,
    lng: 3.0588,
    capital: 'Algeri',
    continent: 'Africa'
  },
  {
    id: 'tn',
    name: 'Tunisia',
    flag: '🇹🇳',
    currency: 'TND (DT)',
    lang: 'Arabo, Francese',
    lat: 36.8065,
    lng: 10.1815,
    capital: 'Tunisi',
    continent: 'Africa'
  },
  {
    id: 'et',
    name: 'Etiopia',
    flag: '🇪🇹',
    currency: 'ETB (Br)',
    lang: 'Amarico, Oromo, Inglese',
    lat: 9.0320,
    lng: 38.7469,
    capital: 'Addis Abeba',
    continent: 'Africa'
  },
  {
    id: 'ci',
    name: "Costa d'Avorio",
    flag: '🇨🇮',
    currency: 'XOF (CFA)',
    lang: 'Francese, Dioula',
    lat: 5.3600,
    lng: -4.0083,
    capital: 'Abidjan',
    continent: 'Africa'
  },
  {
    id: 'cm',
    name: 'Camerun',
    flag: '🇨🇲',
    currency: 'XAF (FCFA)',
    lang: 'Francese, Inglese',
    lat: 3.8480,
    lng: 11.5021,
    capital: 'Yaoundé',
    continent: 'Africa'
  },
  {
    id: 'tz',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS (TSh)',
    lang: 'Swahili, Inglese',
    lat: -6.7924,
    lng: 39.2083,
    capital: 'Dar es Salaam',
    continent: 'Africa'
  },
  {
    id: 'ug',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX (USh)',
    lang: 'Inglese, Swahili',
    lat: 0.3476,
    lng: 32.5825,
    capital: 'Kampala',
    continent: 'Africa'
  }
];

/**
 * Risolve ad altissima fedeltà a quale Paese (o nazione limitrofa) appartiene un annuncio
 */
export function getCountryForListing(listing: any, countriesList: CountryData[] = COUNTRIES): CountryData {
  if (!listing) return countriesList.find((c) => c.id === 'it') || countriesList[0];

  const text = `${listing.city || ''} ${listing.locationArea || ''} ${listing.author?.city || ''} ${(listing.tags || []).join(' ')}`.toLowerCase();

  if (text.includes('francia') || text.includes('france') || text.includes('parigi') || text.includes('paris') || text.includes('lione') || text.includes('lyon') || text.includes('marsiglia')) {
    return countriesList.find((c) => c.id === 'fr') || countriesList[0];
  }
  if (text.includes('spagna') || text.includes('spain') || text.includes('madrid') || text.includes('barcellona') || text.includes('barcelona') || text.includes('valencia') || text.includes('siviglia')) {
    return countriesList.find((c) => c.id === 'es') || countriesList[0];
  }
  if (text.includes('germania') || text.includes('germany') || text.includes('deutschland') || text.includes('berlino') || text.includes('berlin') || text.includes('monaco') || text.includes('munich') || text.includes('francoforte')) {
    return countriesList.find((c) => c.id === 'de') || countriesList[0];
  }
  if (text.includes('regno unito') || text.includes('united kingdom') || text.includes('londra') || text.includes('london')) {
    return countriesList.find((c) => c.id === 'gb') || countriesList[0];
  }
  if (text.includes('svizzera') || text.includes('switzerland') || text.includes('berna') || text.includes('zurigo') || text.includes('ginevra')) {
    return countriesList.find((c) => c.id === 'ch') || countriesList[0];
  }
  if (text.includes('stati uniti') || text.includes('usa') || text.includes('new york') || text.includes('california')) {
    return countriesList.find((c) => c.id === 'us') || countriesList[0];
  }
  if (
    text.includes('asti') || text.includes('torino') || text.includes('milano') ||
    text.includes('roma') || text.includes('bologna') || text.includes('firenze') ||
    text.includes('napoli') || text.includes('palermo') || text.includes('bari') ||
    text.includes('venezia') || text.includes('biella') || text.includes('matera') ||
    text.includes('italia') || text.includes('italy')
  ) {
    return countriesList.find((c) => c.id === 'it') || countriesList[0];
  }

  // Risoluzione per coordinate se lat e lng sono numeriche
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    let closest = countriesList[0];
    let minDist = Infinity;
    for (const c of countriesList) {
      if (typeof c.lat === 'number' && typeof c.lng === 'number') {
        const dLat = c.lat - listing.lat;
        const dLng = c.lng - listing.lng;
        const dist = dLat * dLat + dLng * dLng;
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      }
    }
    return closest;
  }

  return countriesList.find((c) => c.id === 'it') || countriesList[0];
}
