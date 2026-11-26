// Servizio di Routing Stradale Reale con OSRM (Open Source Routing Machine) & OpenStreetMap
// Calcolo percorsi reali A-B per Auto, Pedoni e Biciclette con indicazioni svolta per svolta e tracciato GeoJSON

export type RoutingProfile = 'driving' | 'walking' | 'cycling';

export interface RouteStep {
  name: string;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType: string;
  maneuverModifier?: string;
  location: [number, number]; // [lng, lat]
}

export interface RealRouteResult {
  profile: RoutingProfile;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  coordinates: [number, number][]; // GeoJSON LineString coordinates [lng, lat]
  steps: RouteStep[];
  originName?: string;
  destinationName?: string;
  source: string;
  calculatedAt: string;
  routeIndex?: number;
  summaryLabel?: string;
}

// Mappatura tradotta delle manovre OSRM in italiano naturale
function formatInstruction(step: any): string {
  const name = step.name ? `su ${step.name}` : '';
  const type = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;

  switch (type) {
    case 'depart':
      return `Parti verso ${modifier ? modifier : 'destinazione'} ${name}`.trim();
    case 'arrive':
      return 'Sei arrivato a destinazione';
    case 'turn':
      if (modifier === 'left') return `Svolta a sinistra ${name}`.trim();
      if (modifier === 'right') return `Svolta a destra ${name}`.trim();
      if (modifier === 'sharp left') return `Svolta stretta a sinistra ${name}`.trim();
      if (modifier === 'sharp right') return `Svolta stretta a destra ${name}`.trim();
      if (modifier === 'slight left') return `Tieni la sinistra ${name}`.trim();
      if (modifier === 'slight right') return `Tieni la destra ${name}`.trim();
      return `Svolta ${name}`.trim();
    case 'roundabout':
    case 'rotary': {
      const exit = step.maneuver?.exit ? `la ${step.maneuver.exit}ª uscita` : 'l\'uscita';
      return `Alla rotonda prendi ${exit} ${name}`.trim();
    }
    case 'continue':
    case 'new name':
      return `Prosegui dritto ${name}`.trim();
    case 'merge':
      return `Immettiti ${name}`.trim();
    case 'on ramp':
      return `Prendi lo svincolo ${name}`.trim();
    case 'off ramp':
      return `Prendi l'uscita ${name}`.trim();
    case 'fork':
      return `Al bivio tieni la ${modifier === 'left' ? 'sinistra' : 'destra'} ${name}`.trim();
    default:
      return `${name ? 'Continua ' + name : 'Prosegui lungo la strada'}`.trim();
  }
}

function mapOsrmRoute(
  route: any,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: RoutingProfile,
  routeIndex: number
): RealRouteResult {
  const rawSteps = route.legs?.[0]?.steps || [];

  const steps: RouteStep[] = rawSteps.map((st: any) => ({
    name: st.name || 'Strada locale',
    instruction: formatInstruction(st),
    distanceMeters: Math.round(st.distance || 0),
    durationSeconds: Math.round(st.duration || 0),
    maneuverType: st.maneuver?.type || 'turn',
    maneuverModifier: st.maneuver?.modifier,
    location: st.maneuver?.location || [startLng, startLat],
  }));

  if (steps.length === 0) {
    steps.push({
      name: 'Tracciato Stradale',
      instruction: 'Procedi lungo il percorso evidenziato',
      distanceMeters: Math.round(route.distance || 0),
      durationSeconds: Math.round(route.duration || 0),
      maneuverType: 'depart',
      location: [startLng, startLat],
    });
  }

  const distKm = Math.round(((route.distance || 0) / 1000) * 10) / 10;
  const durMin = Math.max(1, Math.round((route.duration || 0) / 60));

  return {
    profile,
    totalDistanceMeters: Math.round(route.distance || 0),
    totalDistanceKm: distKm,
    totalDurationSeconds: Math.round(route.duration || 0),
    totalDurationMinutes: durMin,
    coordinates: route.geometry?.coordinates || [[startLng, startLat], [endLng, endLat]],
    steps,
    source: 'OSRM Open Source Routing Machine (OpenStreetMap)',
    calculatedAt: new Date().toISOString(),
    routeIndex,
    summaryLabel: route.legs?.[0]?.summary || `${distKm} km • ${durMin} min`,
  };
}

/**
 * Calcola uno o più percorsi stradali reali (inclusi alternativi OSRM se disponibili).
 * Se OSRM non risponde o fallisce, restituisce [] senza inventare linee rette.
 */
export async function calculateRealRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: RoutingProfile = 'driving',
  alternatives = true
): Promise<RealRouteResult[]> {
  if (
    typeof startLat !== 'number' || typeof startLng !== 'number' ||
    typeof endLat !== 'number' || typeof endLng !== 'number' ||
    Number.isNaN(startLat) || Number.isNaN(startLng) || Number.isNaN(endLat) || Number.isNaN(endLng)
  ) {
    return [];
  }

  const straightDist = Math.hypot(endLat - startLat, endLng - startLng) * 111000;
  if (straightDist < 5) {
    return [
      {
        profile,
        totalDistanceMeters: 0,
        totalDistanceKm: 0,
        totalDurationSeconds: 0,
        totalDurationMinutes: 0,
        coordinates: [[startLng, startLat], [endLng, endLat]],
        steps: [
          {
            name: 'Punto di Incontro',
            instruction: 'Sei già esattamente nel punto di destinazione',
            distanceMeters: 0,
            durationSeconds: 0,
            maneuverType: 'arrive',
            location: [endLng, endLat],
          }
        ],
        source: 'OSRM Open Source Routing Machine (OpenStreetMap)',
        calculatedAt: new Date().toISOString(),
        routeIndex: 0,
        summaryLabel: 'A destinazione',
      },
    ];
  }

  try {
    const altParam = alternatives ? '&alternatives=true' : '';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true${altParam}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const json = await res.json();
    if (json.code !== 'Ok' || !Array.isArray(json.routes) || json.routes.length === 0) {
      throw new Error(`OSRM code: ${json.code || 'Unknown'}`);
    }

    return json.routes.map((route: any, idx: number) =>
      mapOsrmRoute(route, startLat, startLng, endLat, endLng, profile, idx)
    );
  } catch (err) {
    console.warn('[RoutingService] Percorso OSRM reale non disponibile:', err);
    return [];
  }
}

/**
 * Calcola il percorso stradale reale principale tra punto A e punto B.
 * Se OSRM non risponde, ritorna null (nessuna linea retta simulata).
 */
export async function calculateRealRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: RoutingProfile = 'driving'
): Promise<RealRouteResult | null> {
  const routes = await calculateRealRoutes(startLat, startLng, endLat, endLng, profile, false);
  return routes[0] || null;
}

/**
 * Calcola la distanza minima in metri tra la posizione GPS attuale e il tracciato GeoJSON OSRM
 * per rilevare deviazioni e attivare il ricalcolo automatico.
 */
export function distanceToRouteMeters(
  lat: number,
  lng: number,
  coordinates: [number, number][]
): number {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return Infinity;

  const cosLat = Math.cos((lat * Math.PI) / 180);
  const toXY = (pLat: number, pLng: number) => ({
    x: (pLng - lng) * 111320 * cosLat,
    y: (pLat - lat) * 110540,
  });

  let minDist = Infinity;
  for (let i = 0; i < coordinates.length; i++) {
    const [lngA, latA] = coordinates[i];
    const pA = toXY(latA, lngA);

    if (i === coordinates.length - 1) {
      minDist = Math.min(minDist, Math.hypot(pA.x, pA.y));
      break;
    }

    const [lngB, latB] = coordinates[i + 1];
    const pB = toXY(latB, lngB);
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, -(pA.x * dx + pA.y * dy) / lenSq));
    }
    const projX = pA.x + t * dx;
    const projY = pA.y + t * dy;
    minDist = Math.min(minDist, Math.hypot(projX, projY));
  }

  return Math.round(minDist);
}
