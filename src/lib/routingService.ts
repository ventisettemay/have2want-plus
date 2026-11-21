// Servizio di Routing Stradale Reale con OSRM (Open Source Routing Machine) & OpenStreetMap
// Calcolo percorsi reali A-B per Auto, Pedoni e Biciclette con indicazioni svolta per svolta e tracciato GeoJSON
// Include: ricalcolo percorso, traffico simulato (OSRM non ha traffico live gratuito), profili multipli

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
  // Traffic & Recalculation fields
  trafficLevel?: 'free' | 'moderate' | 'heavy' | 'blocked';
  trafficDelayMinutes?: number;
  alternativeRoutes?: RealRouteResult[];
  recalculatedAt?: string;
  recalculationReason?: 'traffic' | 'deviation' | 'user_request' | 'road_closure';
}

export interface TrafficIncident {
  type: 'congestion' | 'accident' | 'roadwork' | 'closure' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: [number, number]; // [lng, lat]
  description: string;
  delayMinutes: number;
  startTime: string;
  endTime?: string;
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
      trafficLevel: 'free',
      trafficDelayMinutes: 0,
    };
  }
}

/**
 * Simula dati traffico per un percorso (OSRM non fornisce traffico live gratuito)
 * In produzione: integrare TomTom Traffic API, Mapbox Traffic, o HERE Traffic (tutti con tier gratuiti limitati)
 */
export async function getTrafficForRoute(
  coordinates: [number, number][],
  profile: RoutingProfile = 'driving'
): Promise<{ trafficLevel: RealRouteResult['trafficLevel']; incidents: TrafficIncident[]; delayMinutes: number }> {
  // NOTE: OSRM non ha endpoint traffico. Questa funzione simula traffico basato su orario/percorso.
  // Per traffico reale gratuito: TomTom Traffic API (2.500 req/giorno free), Mapbox Traffic (100.000 req/mese free), HERE Traffic (250.000 req/mese free)
  
  const hour = new Date().getHours();
  let trafficLevel: RealRouteResult['trafficLevel'] = 'free';
  let delayMinutes = 0;
  const incidents: TrafficIncident[] = [];
  
  // Simulazione oraria: ora di punta = traffico moderato/forte
  const isMorningRush = hour >= 7 && hour <= 9;
  const isEveningRush = hour >= 17 && hour <= 19;
  const isNight = hour >= 22 || hour <= 5;
  
  if (isNight) {
    trafficLevel = 'free';
    delayMinutes = 0;
  } else if (isMorningRush || isEveningRush) {
    trafficLevel = Math.random() > 0.5 ? 'moderate' : 'heavy';
    delayMinutes = trafficLevel === 'heavy' ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 8) + 3;
    
    // Aggiunge incidenti simulati in ora di punta
    if (trafficLevel === 'heavy' && coordinates.length > 2) {
      const midIdx = Math.floor(coordinates.length / 2);
      incidents.push({
        type: 'congestion',
        severity: 'high',
        location: coordinates[midIdx],
        description: 'Rallentamento per traffico intenso',
        delayMinutes: delayMinutes,
        startTime: new Date().toISOString(),
      });
    }
  } else {
    trafficLevel = 'free';
    delayMinutes = 0;
  }
  
  return { trafficLevel, incidents, delayMinutes };
}

/**
 * Ricalcola percorso considerando traffico e deviazioni
 */
export async function recalculateRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: RoutingProfile = 'driving',
  previousRoute?: RealRouteResult,
  reason: RealRouteResult['recalculationReason'] = 'traffic'
): Promise<RealRouteResult | null> {
  const newRoute = await calculateRealRoute(startLat, startLng, endLat, endLng, profile);
  if (!newRoute) return null;
  
  // Se c'era un percorso precedente, confronta per rilevare cambiamenti significativi
  if (previousRoute) {
    const distanceDiff = Math.abs(newRoute.totalDistanceMeters - previousRoute.totalDistanceMeters);
    const durationDiff = Math.abs(newRoute.totalDurationSeconds - previousRoute.totalDurationSeconds);
    
    // Se la differenza è significativa (>10% distanza o >15% durata), marca come ricalcolato
    if (distanceDiff > previousRoute.totalDistanceMeters * 0.1 || durationDiff > previousRoute.totalDurationSeconds * 0.15) {
      newRoute.recalculatedAt = new Date().toISOString();
      newRoute.recalculationReason = reason;
    }
  }
  
  // Aggiunge info traffico
  const { trafficLevel, incidents, delayMinutes } = await getTrafficForRoute(newRoute.coordinates, profile);
  newRoute.trafficLevel = trafficLevel;
  newRoute.trafficDelayMinutes = delayMinutes;
  newRoute.alternativeRoutes = undefined; // OSRM non restituisce alternative nativamente senza parametri extra
  
  return newRoute;
}

/**
 * Ottiene percorsi alternativi (usa parametro alternatives=true di OSRM)
 */
export async function getAlternativeRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: RoutingProfile = 'driving',
  maxAlternatives = 2
): Promise<RealRouteResult[]> {
  if (
    typeof startLat !== 'number' || typeof startLng !== 'number' ||
    typeof endLat !== 'number' || typeof endLng !== 'number' ||
    isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)
  ) {
    return [];
  }
  
  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&alternatives=true&number_of_alternatives=${maxAlternatives}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
      return [];
    }
    
    return json.routes.slice(0, maxAlternatives + 1).map((route: any) => {
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
        trafficLevel: 'free',
        trafficDelayMinutes: 0,
      };
    });
  } catch (err) {
    console.warn('[RoutingService] Errore percorsi alternativi:', err);
    return [];
  }
}
