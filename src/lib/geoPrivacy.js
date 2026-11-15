import { spendPoints, pointsToPi } from '@/lib/communityRewardsService';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Centroidi noti dei principali comuni e capoluoghi per la privacy geografica
 */
const KNOWN_MUNICIPALITY_CENTROIDS = {
  'roma': { lat: 41.8931, lng: 12.4828 },
  'milano': { lat: 45.4642, lng: 9.1900 },
  'torino': { lat: 45.0703, lng: 7.6869 },
  'asti': { lat: 44.9008, lng: 8.2065 },
  'napoli': { lat: 40.8518, lng: 14.2681 },
  'firenze': { lat: 43.7696, lng: 11.2558 },
  'bologna': { lat: 44.4949, lng: 11.3426 },
  'genova': { lat: 44.4056, lng: 8.9463 },
  'palermo': { lat: 38.1157, lng: 13.3615 },
  'bari': { lat: 41.1171, lng: 16.8719 },
  'catania': { lat: 37.5079, lng: 15.0830 },
  'venezia': { lat: 45.4408, lng: 12.3155 },
  'verona': { lat: 45.4384, lng: 10.9916 },
  'cagliari': { lat: 39.2238, lng: 9.1217 },
  'trieste': { lat: 45.6495, lng: 13.7768 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'tokyo': { lat: 35.6762, lng: 139.6503 }
};

/**
 * Risoluzione dinamica delle coordinate territoriali di base (evita vincoli obbligatori su un singolo Paese)
 */
export function getDefaultTerritoryCoordinates() {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('h2w_user_country_coords') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    // fallback sicuro
  }
  return { lat: 41.8902, lng: 12.4922, label: 'Territorio di Riferimento' };
}

export function setDefaultTerritoryCoordinates(lat, lng, label = 'Territorio Selezionato') {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('h2w_user_country_coords', JSON.stringify({ lat, lng, label }));
    }
  } catch (e) {}
}

/**
 * Calcola in modo deterministico il centroide di un comune partendo dal nome o dalle coordinate di base,
 * applicando un raggio di approssimazione (1.5 - 2.5 km) per proteggere l'utente.
 */
export function calculateMunicipalityCentroid(cityName = '', rawLat = null, rawLng = null) {
  const defaultCoords = getDefaultTerritoryCoordinates();
  const effectiveLat = typeof rawLat === 'number' ? rawLat : defaultCoords.lat;
  const effectiveLng = typeof rawLng === 'number' ? rawLng : defaultCoords.lng;

  const normalized = (cityName || '').trim().toLowerCase();
  if (KNOWN_MUNICIPALITY_CENTROIDS[normalized]) {
    return {
      lat: KNOWN_MUNICIPALITY_CENTROIDS[normalized].lat,
      lng: KNOWN_MUNICIPALITY_CENTROIDS[normalized].lng,
      radiusKm: 2.0,
      label: `Centroide Comunale di ${cityName || 'Comune'}`
    };
  }

  // Offset pseudo-deterministico per evitare che coordinate precise a livello di civico/via siano svelate
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const offsetLat = ((Math.abs(hash) % 100) / 1000) - 0.05; // ~±2 km
  const offsetLng = (((Math.abs(hash >> 3)) % 100) / 1000) - 0.05;

  // Arrotonda le coordinate a 2 decimali per rimuovere la granularità civica
  const approxLat = Number((Math.round((effectiveLat + offsetLat) * 100) / 100).toFixed(4));
  const approxLng = Number((Math.round((effectiveLng + offsetLng) * 100) / 100).toFixed(4));

  return {
    lat: approxLat,
    lng: approxLng,
    radiusKm: 2.5,
    label: `Centroide Territoriale (${cityName || 'Territorio'})`
  };
}

/**
 * 1. MODULO PRIVACY GEOGRAFICA (geoPrivacy)
 * Gestisce la precisione della geolocalizzazione degli annunci.
 * Se "Modalità Discreta" è attiva (a livello globale o sull'annuncio),
 * la mappa NON mostra le coordinate esatte, ma posiziona l'annuncio
 * sul centroide del comune (municipality_centroid) con un raggio di approssimazione per tutelare l'utente.
 */
export function applyGeoPrivacy(listing, isGlobalDiscreetMode = false) {
  if (!listing) {
    return {
      lat: 41.8902,
      lng: 12.4922,
      isMasked: false,
      mode: 'STANDARD',
      radiusKm: 0,
      label: 'Posizione predefinita'
    };
  }

  const isDiscreet = isGlobalDiscreetMode ||
    listing.privacy_mode_active === true ||
    listing.is_discrete_mode === true ||
    listing.isFuzzyLocation === true ||
    listing.discrete_mode === true;

  if (isDiscreet) {
    // Se l'annuncio ha già il centroide salvato nel record, usalo
    if (typeof listing.municipality_centroid_lat === 'number' && typeof listing.municipality_centroid_lng === 'number') {
      return {
        lat: listing.municipality_centroid_lat,
        lng: listing.municipality_centroid_lng,
        isMasked: true,
        mode: 'DISCRETA',
        radiusKm: listing.approximation_radius_km || 2.0,
        label: `Centroide Comune (${listing.city || 'Comune'}) • Raggio tutela ~2 km`
      };
    }

    // Altrimenti calcola il centroide comunale sicuro
    const defaultCoords = getDefaultTerritoryCoordinates();
    const rawLat = listing.exact_lat ?? listing.lat ?? defaultCoords.lat;
    const rawLng = listing.exact_lng ?? listing.lng ?? defaultCoords.lng;
    const centroid = calculateMunicipalityCentroid(listing.city || listing.locationArea, rawLat, rawLng);

    return {
      lat: centroid.lat,
      lng: centroid.lng,
      isMasked: true,
      mode: 'DISCRETA',
      radiusKm: centroid.radiusKm,
      label: `${centroid.label} • Modalità Discreta Attiva`
    };
  }

  // Modalità standard con coordinate esatte
  const defaultCoords = getDefaultTerritoryCoordinates();
  return {
    lat: listing.exact_lat ?? listing.lat ?? defaultCoords.lat,
    lng: listing.exact_lng ?? listing.lng ?? defaultCoords.lng,
    isMasked: false,
    mode: 'ESATTA',
    radiusKm: 0,
    label: 'Coordinate dell\'annuncio'
  };
}

/**
 * Funzione di compatibilità retroattiva per i componenti esistenti
 */
export function getDisplayCoordinates(listing, isGlobalDiscreetMode = false) {
  return applyGeoPrivacy(listing, isGlobalDiscreetMode);
}

/**
 * Calcola la distanza geodetica (Formula di Haversine) tra due punti in km
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }
  const R = 6371; // Raggio medio della Terra in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 2. VISIBILITY MANAGER & FILTRI:
 * Filtro di moderazione integrato: gli annunci compaiono solo se approvati e privi di segnalazioni
 */
const BANNED_KEYWORDS = ['scam', 'truffa', 'armi', 'droghe', 'illecito', 'contraffatto'];

export function passesModerationFilter(listing) {
  if (!listing) return false;

  // Controllo status esplicito
  if (listing.moderation_status === 'rejected' || listing.moderation_status === 'flagged') {
    return false;
  }
  if (listing.status === 'suspended' || listing.status === 'banned' || listing.status === 'draft') {
    return false;
  }

  // Controllo etico e reputazione minima
  const trustRating = listing.author?.reputation ?? listing.author?.trust_rating ?? 5.0;
  if (trustRating < 2.5) {
    return false;
  }

  // Scansione automatica parole proibite o spam
  const fullText = `${listing.title || ''} ${listing.description || ''} ${listing.have_description || ''} ${listing.want_description || ''}`.toLowerCase();
  for (const word of BANNED_KEYWORDS) {
    if (fullText.includes(word)) {
      return false;
    }
  }

  return true;
}

/**
 * Filtro per preferenze di vicinanza impostate dall'utente:
 * - 'NEAR_YOU' (entro 25 km)
 * - 'COMMUNITY' (entro 80 km)
 * - 'EVERYWHERE' (nessun limite)
 */
export function isWithinProximityPreference(listing, userLocation = null, proximityPreference = 'EVERYWHERE') {
  if (proximityPreference === 'EVERYWHERE' || !proximityPreference) {
    return true;
  }

  const effectiveLocation = userLocation || getDefaultTerritoryCoordinates();
  const rawLat = listing.lat ?? listing.exact_lat ?? listing.municipality_centroid_lat;
  const rawLng = listing.lng ?? listing.exact_lng ?? listing.municipality_centroid_lng;
  if (rawLat === undefined || rawLng === undefined) return true;

  const distance = haversineDistanceKm(effectiveLocation.lat, effectiveLocation.lng, rawLat, rawLng);

  if (proximityPreference === 'NEAR_YOU') {
    return distance <= 25;
  }
  if (proximityPreference === 'COMMUNITY') {
    return distance <= 80;
  }
  return true;
}

/**
 * Visibility Manager completo che applica tutti i filtri:
 * Categoria + Moderazione + Vicinanza + Privacy Geografica
 */
export function filterVisibleListings({
  listings = [],
  activeFilter = null,
  userLocation = null,
  proximityPreference = 'EVERYWHERE',
  isDiscreetMode = false
}) {
  const effectiveLocation = userLocation || getDefaultTerritoryCoordinates();
  // Se nessun filtro specifico è selezionato, mostriamo tutti gli annunci attivi e conformi (l'app non appare mai vuota)
  const hasSpecificFilter = Boolean(activeFilter);

  return listings.filter((item) => {
    // 1. Filtro di moderazione
    if (!passesModerationFilter(item)) return false;

    // 2. Filtro preferenze di vicinanza
    if (!isWithinProximityPreference(item, effectiveLocation, proximityPreference)) return false;

    // 3. Filtro per Categoria (VENDO, BARATTO, CERCO, LIBRI)
    if (activeFilter === 'VENDO') {
      return item.action_type === 'vendo' || item.intent === 'VENDO';
    }
    if (activeFilter === 'BARATTO_SCAMBIO' || activeFilter === 'BARATTO') {
      return item.action_type === 'baratto_scambio' || item.intent === 'BARATTO_SCAMBIO' || item.action_type === 'baratto';
    }
    if (activeFilter === 'CERCO' || activeFilter === 'ACQUISTO_CERCO') {
      return item.action_type === 'acquisto_cerco' || item.intent === 'ACQUISTO_CERCO' || item.intent === 'CERCO';
    }
    if (activeFilter === 'LIBRI_SCOLASTICI' || activeFilter === 'LIBRI') {
      const isBookCat = item.category === 'libri_scuola_cultura' || item.subcategory === 'scambio_libri_scolastici';
      const text = `${item.title || ''} ${item.description || ''} ${item.have_description || ''} ${item.want_description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
      return isBookCat || text.includes('libr') || text.includes('scolastic') || text.includes('testi') || text.includes('manual') || text.includes('saggi');
    }

    return true;
  }).map((item) => {
    // Integra le coordinate protette con geoPrivacy
    const privacyCoords = applyGeoPrivacy(item, isDiscreetMode);
    return {
      ...item,
      displayLat: privacyCoords.lat,
      displayLng: privacyCoords.lng,
      isMasked: privacyCoords.isMasked,
      approximationRadiusKm: privacyCoords.radiusKm,
      privacyLabel: privacyCoords.label
    };
  });
}

/**
 * Limita l'accesso ai professionisti sociali (Cap: max 1 ogni 2500 abitanti del comune)
 */
export async function verifySpecialistCap(cityName, currentAbitanti) {
  try {
    const maxAllowed = Math.max(1, Math.floor((currentAbitanti || 2500) / 2500));
    if (!cityName) return true;
    const normalizedCity = String(cityName).trim();
    const q = query(
      collection(db, 'shops'),
      where('city', '==', normalizedCity),
      where('category', '==', 'PROFESSIONISTA_SOCIALE')
    );
    const snap = await getDocs(q);
    let verifiedCount = 0;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.specialist_municipality_cap_verified) {
        verifiedCount++;
      }
    });
    return verifiedCount < maxAllowed;
  } catch (err) {
    // Consente l'accesso in assenza di rete o indice Firestore, evitando blocchi offline
    return true;
  }
}

/**
 * Gestore della Tokenomics: Controlla ed addebita la Quota X (0.15 π = 150 punti) dal saldo comunitario unificato
 */
export async function processChatInteractionBilling(profileId) {
  try {
    const QUOTA_POINTS = 150; // 0.15 π equivalenti (1000 punti = 1.0 π)
    const spend = spendPoints(
      QUOTA_POINTS,
      `Sblocco interazione chat discreta (${profileId || 'pioneer'})`
    );

    if (!spend.success) {
      return {
        success: false,
        reason: `Saldo insufficiente: servono ${QUOTA_POINTS} punti (0.15 π) per avviare la chat discreta.`,
        pointsRemaining: spend.newBalance,
      };
    }

    return {
      success: true,
      newBalance: pointsToPi(spend.newBalance),
      pointsRemaining: spend.newBalance,
    };
  } catch (err) {
    return { success: false, reason: "Errore nell'addebito della quota chat" };
  }
}
