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
    case 'rotary':
      const exit = step.maneuver?.exit ? `la ${step.maneuver.exit}ª uscita` : 'l\'uscita';
      return `Alla rotonda prendi ${exit} ${name}`.trim();
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

/**
 * Calcola il percorso stradale reale tra punto A e punto B
 */
export async function calculateRealRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: RoutingProfile = 'driving'
): Promise<RealRouteResult | null> {
  if (
    typeof startLat !== 'number' || typeof startLng !== 'number' ||
    typeof endLat !== 'number' || typeof endLng !== 'number' ||
    isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)
  ) {
    return null;
  }

  // Se i due punti sono identici o distanti meno di 2 metri, ritorna arrivo immediato
  const straightDist = Math.hypot(endLat - startLat, endLng - startLng) * 111000;
  if (straightDist < 5) {
    return {
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
      source: 'OSRM Open Source Routing Machine',
      calculatedAt: new Date().toISOString(),
    };
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
      throw new Error(`OSRM code: ${json.code}`);
    }

    const route = json.routes[0];
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

    // Se per qualche motivo OSRM non ha generato passi, creiamo un passo di inizio e arrivo
    if (steps.length === 0) {
      steps.push({
        name: 'Tracciato Stradale',
        instruction: 'Procedi lungo il percorso evidenziato',
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
        maneuverType: 'depart',
        location: [startLng, startLat],
      });
    }

    return {
      profile,
      totalDistanceMeters: Math.round(route.distance),
      totalDistanceKm: Math.round((route.distance / 1000) * 10) / 10,
      totalDurationSeconds: Math.round(route.duration),
      totalDurationMinutes: Math.max(1, Math.round(route.duration / 60)),
      coordinates: route.geometry?.coordinates || [[startLng, startLat], [endLng, endLat]],
      steps,
      source: 'OSRM Open Source Routing Machine (OpenStreetMap)',
      calculatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[RoutingService] Fallback su calcolo geodetico stradale:', err);
    // Fallback matematico lineare se l'endpoint OSRM è momentaneamente irraggiungibile
    const approxMeters = Math.round(straightDist * 1.25); // Fattore di tortuosità stradale media 1.25
    const speedKmH = profile === 'driving' ? 40 : profile === 'cycling' ? 15 : 4.5;
    const durationSeconds = Math.round((approxMeters / 1000 / speedKmH) * 3600);

    return {
      profile,
      totalDistanceMeters: approxMeters,
      totalDistanceKm: Math.round((approxMeters / 1000) * 10) / 10,
      totalDurationSeconds: durationSeconds,
      totalDurationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      coordinates: [[startLng, startLat], [endLng, endLat]],
      steps: [
        {
          name: 'Percorso Diretto',
          instruction: `Procedi verso destinazione (${Math.round((approxMeters / 1000) * 10) / 10} km)`,
          distanceMeters: approxMeters,
          durationSeconds,
          maneuverType: 'depart',
          location: [startLng, startLat],
        },
        {
          name: 'Destinazione',
          instruction: 'Arrivo al punto d\'incontro o negozio',
          distanceMeters: 0,
          durationSeconds: 0,
          maneuverType: 'arrive',
          location: [endLng, endLat],
        }
      ],
      source: 'Stima Geodetica Fallback',
      calculatedAt: new Date().toISOString(),
    };
  }
}
