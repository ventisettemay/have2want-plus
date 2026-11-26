// MODULO GEOGRAFICO (Data)
// Database mondiale completo derivato da worldAtlas (~197 Stati Sovrani e Territori)
// Nessun fallback silenzioso su Italia/Roma.

import { WORLD_COUNTRIES, findCountryByNameOrCode, isValidCoord } from '@/lib/worldAtlas';

export interface CountryData {
  id: string;
  name: string;
  nativeName?: string;
  flag: string;
  currency: string;
  lang: string;
  lat: number;
  lng: number;
  capital: string;
  continent: 'Europa' | 'Nord America' | 'Sud America' | 'Asia' | 'Africa' | 'Oceania';
}

export type Country = CountryData;

function mapAtlasContinent(
  continent: 'Europa' | 'Americhe' | 'Asia' | 'Africa' | 'Oceania',
  subContinent?: 'Nord America' | 'Sud America'
): CountryData['continent'] {
  if (continent === 'Americhe') {
    return subContinent || 'Nord America';
  }
  return continent;
}

export const COUNTRIES: CountryData[] = WORLD_COUNTRIES.map((c) => ({
  id: c.code.toLowerCase(),
  name: c.name,
  nativeName: c.nativeName,
  flag: c.flag,
  currency: `${c.currency.code} (${c.currency.symbol})`,
  lang: c.language.name,
  lat: c.lat,
  lng: c.lng,
  capital: c.capital,
  continent: mapAtlasContinent(c.continent, c.subContinent),
}));

const KNOWN_CITY_TO_COUNTRY_CODE: Record<string, string> = {
  roma: 'it', rome: 'it', milano: 'it', milan: 'it', torino: 'it', turin: 'it',
  napoli: 'it', naples: 'it', bologna: 'it', firenze: 'it', florence: 'it',
  palermo: 'it', bari: 'it', venezia: 'it', venice: 'it', asti: 'it',
  biella: 'it', matera: 'it', genova: 'it', verona: 'it', catania: 'it', cagliari: 'it',
  parigi: 'fr', paris: 'fr', lione: 'fr', lyon: 'fr', marsiglia: 'fr', marseille: 'fr', nizza: 'fr',
  madrid: 'es', barcellona: 'es', barcelona: 'es', valencia: 'es', siviglia: 'es', sevilla: 'es',
  berlino: 'de', berlin: 'de', monaco: 'de', munich: 'de', francoforte: 'de', frankfurt: 'de', amburgo: 'de',
  londra: 'gb', london: 'gb', manchester: 'gb', edimburgo: 'gb', edinburgh: 'gb',
  berna: 'ch', zurigo: 'ch', zurich: 'ch', ginevra: 'ch', geneva: 'ch', lugano: 'ch',
  'new york': 'us', 'los angeles': 'us', miami: 'us', chicago: 'us', 'san francisco': 'us', california: 'us',
  toronto: 'ca', montreal: 'ca', vancouver: 'ca',
  'san paolo': 'br', 'sao paulo': 'br', 'rio de janeiro': 'br',
  tokyo: 'jp', osaka: 'jp', kyoto: 'jp',
  pechino: 'cn', beijing: 'cn', shanghai: 'cn',
  dubai: 'ae', 'abu dhabi': 'ae',
  cairo: 'eg', 'il cairo': 'eg', alessandria: 'eg',
  lagos: 'ng', abuja: 'ng',
  nairobi: 'ke', mombasa: 'ke',
  brazzaville: 'cg', kinshasa: 'cd',
  johannesburg: 'za', 'cape town': 'za', 'citta del capo': 'za',
  sydney: 'au', melbourne: 'au',
};

/**
 * Risolve a quale Paese appartiene un annuncio senza fallback arbitrari su Italia/Roma.
 * Restituisce null se non ci sono metadati geografici né coordinate valide.
 */
export function getCountryForListing(
  listing: any,
  countriesList: CountryData[] = COUNTRIES
): CountryData | null {
  if (!listing) return null;

  // 1. Codice Paese o Nome Paese esplicito
  const explicitCountryRaw = listing.countryCode || listing.country_code || listing.country || '';
  if (explicitCountryRaw) {
    const byId = countriesList.find(
      (c) => c.id.toLowerCase() === String(explicitCountryRaw).trim().toLowerCase()
    );
    if (byId) return byId;

    const fromAtlas = findCountryByNameOrCode(String(explicitCountryRaw));
    if (fromAtlas) {
      const matched = countriesList.find((c) => c.id.toLowerCase() === fromAtlas.code.toLowerCase());
      if (matched) return matched;
    }
  }

  // 2. Corrispondenza testuale controllata su città / area / autore / tag
  const candidates = [
    listing.city,
    listing.locationArea,
    listing.author?.city,
    ...(Array.isArray(listing.tags) ? listing.tags : []),
  ]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter(Boolean);

  for (const raw of candidates) {
    const norm = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Cerca nomi esatti di città note (match per parola o token completo)
    for (const [cityKey, cId] of Object.entries(KNOWN_CITY_TO_COUNTRY_CODE)) {
      const escaped = cityKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(^|\\s|,|\\(|-)${escaped}($|\\s|,|\\)|-)`, 'i').test(norm)) {
        const hit = countriesList.find((c) => c.id.toLowerCase() === cId);
        if (hit) return hit;
      }
    }

    // Cerca nazione / capitale nell'atlante
    const tokens = norm.split(/[,/()|-]+/).map((t) => t.trim()).filter(Boolean);
    for (const tok of [norm, ...tokens]) {
      const resolved = findCountryByNameOrCode(tok);
      if (resolved) {
        const hit = countriesList.find((c) => c.id.toLowerCase() === resolved.code.toLowerCase());
        if (hit) return hit;
      }
    }
  }

  // 3. Risoluzione geodetica per coordinate valide (esclude (0,0) Null Island e NaN)
  const rawLat = listing.lat ?? listing.exact_lat;
  const rawLng = listing.lng ?? listing.exact_lng;
  if (isValidCoord(rawLat, rawLng)) {
    let closest: CountryData | null = null;
    let minDist = Infinity;
    for (const c of countriesList) {
      if (!isValidCoord(c.lat, c.lng)) continue;
      const dLat = (c.lat - rawLat) * (Math.PI / 180);
      const dLng = (c.lng - rawLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rawLat * (Math.PI / 180)) *
          Math.cos(c.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const angularDist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (angularDist < minDist) {
        minDist = angularDist;
        closest = c;
      }
    }
    return closest;
  }

  return null;
}
