/**
 * FUZZY GEOCODING & TERRITORIAL PRIVACY BY DESIGN MODULE
 * 
 * SPECIFICHE CHIAVE:
 * 1. Privacy Territoriale Georeferenziata: Se l'utente occulta l'indirizzo civico,
 *    il sistema calcola il centroide geometrico del quartiere o del comune.
 * 2. Indicizzatore Spaziale Testuale Puro: Vincolato alla gerarchia reale del database:
 *    country (Stato) ➡️ region (Regione) ➡️ province (Provincia) ➡️ city (Città/Comune).
 * 3. DIVIETO TASSATIVO: Formula di Haversine o filtri radiali in km arbitrari rimossi.
 */

export interface CentroidCoords {
  lat: number;
  lng: number;
  areaLabel: string;
}

export interface TerritoryHierarchyMatch {
  country: string;
  region: string;
  province: string;
  city: string;
}

// Coordinate Centroidi Municipali di Riferimento (Bacheca Reale)
export const MUNICIPAL_CENTROIDS: Record<string, CentroidCoords> = {
  asti: { lat: 44.9008, lng: 8.2065, areaLabel: "Centro Urbano / Piazza Alfieri (Centroide)" },
  torino: { lat: 45.0703, lng: 7.6869, areaLabel: "Area Comunale Centrale (Centroide)" },
  cuneo: { lat: 44.3845, lng: 7.5427, areaLabel: "Area Comunale Cuneo (Centroide)" },
  alessandria: { lat: 44.9129, lng: 8.6154, areaLabel: "Area Comunale Alessandria (Centroide)" },
  firenze: { lat: 43.7696, lng: 11.2558, areaLabel: "Area Comunale Firenze (Centroide)" },
  pisa: { lat: 43.7228, lng: 10.4017, areaLabel: "Area Comunale Pisa (Centroide)" },
  bologna: { lat: 44.4949, lng: 11.3426, areaLabel: "Area Comunale Bologna (Centroide)" },
  roma: { lat: 41.9028, lng: 12.4964, areaLabel: "Area Comunale Roma Capitale (Centroide)" },
  milano: { lat: 45.4642, lng: 9.1900, areaLabel: "Area Metropolitana Milano (Centroide)" },
  parigi: { lat: 48.8566, lng: 2.3522, areaLabel: "Area Comunale Paris (Centroide)" },
};

/**
 * Calcola le coordinate geospaziali applicando la Privacy by Design.
 * Se isPrivateAddress è true, restituisce il centroide municipale con un micro-offset deterministico
 * per evitare la sovrapposizione esatta di pin nello stesso punto senza rivelare il civico.
 */
export function computeFuzzyCoordinates(
  city: string,
  exactLat?: number,
  exactLng?: number,
  isPrivateAddress = true,
  seedString = ""
): { lat: number; lng: number; areaLabel: string; isFuzzy: boolean } {
  const normalizedCity = (city || "asti").trim().toLowerCase();
  const centroid = MUNICIPAL_CENTROIDS[normalizedCity] || MUNICIPAL_CENTROIDS["asti"];

  if (!isPrivateAddress && exactLat && exactLng) {
    return {
      lat: exactLat,
      lng: exactLng,
      areaLabel: `Civico Verificato (${city})`,
      isFuzzy: false,
    };
  }

  // Genera un micro-spostamento controllato all'interno del centroide (entro 300m geometrici)
  // calcolato via hash seed per consistenza visiva tra sessioni
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const deltaLat = ((hash % 100) / 10000) * 0.4;
  const deltaLng = (((hash >> 2) % 100) / 10000) * 0.4;

  return {
    lat: centroid.lat + deltaLat,
    lng: centroid.lng + deltaLng,
    areaLabel: centroid.areaLabel,
    isFuzzy: true,
  };
}

/**
 * Filtro Gerarchico Territoriale Puro (Exact String Match Hierarchy)
 * Nessun calcolo radiale o distanza Haversine.
 */
export function matchesTerritorialHierarchy(
  itemTerritory: { country?: string; region?: string; province?: string; city?: string },
  selectedHierarchy: { country: string; region: string; province: string; city: string }
): boolean {
  const itemCountry = (itemTerritory.country || "Italia").trim().toLowerCase();
  const itemRegion = (itemTerritory.region || "").trim().toLowerCase();
  const itemProvince = (itemTerritory.province || "").trim().toLowerCase();
  const itemCity = (itemTerritory.city || "").trim().toLowerCase();

  // 1. Filtro Paese
  if (selectedHierarchy.country !== "ALL") {
    if (itemCountry !== selectedHierarchy.country.trim().toLowerCase()) {
      return false;
    }
  }

  // 2. Filtro Regione
  if (selectedHierarchy.region !== "ALL") {
    if (itemRegion && itemRegion !== selectedHierarchy.region.trim().toLowerCase()) {
      return false;
    }
  }

  // 3. Filtro Provincia
  if (selectedHierarchy.province !== "ALL") {
    if (itemProvince && itemProvince !== selectedHierarchy.province.trim().toLowerCase()) {
      return false;
    }
  }

  // 4. Filtro Città / Comune
  if (selectedHierarchy.city !== "ALL") {
    if (itemCity && !itemCity.includes(selectedHierarchy.city.trim().toLowerCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Formattatore Breadcrumb Gerarchico
 */
export function formatTerritorialBreadcrumb(hierarchy: {
  country: string;
  region: string;
  province: string;
  city: string;
}): string {
  const parts = [
    hierarchy.country === "ALL" ? "Tutti i Paesi" : hierarchy.country,
    hierarchy.region === "ALL" ? "Tutte le Regioni" : hierarchy.region,
    hierarchy.province === "ALL" ? "Tutte le Province" : `Provincia (${hierarchy.province})`,
    hierarchy.city === "ALL" ? "Tutte le Città" : hierarchy.city,
  ];
  return parts.join(" ➡️ ");
}
