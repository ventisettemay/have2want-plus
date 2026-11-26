// SATELLITE REAL TRACKING SERVICE – HAVE2WANT PLUS
// Calcolo astronomico e tracciamento orbitale REALE tramite API pubblica CelesTrak GP/OMM.
// Regole rigorose:
// 1. Nessuna orbita, coordinata geografica o telemetria inventata o simulata.
// 2. I 6 satelliti corrispondenti a veicoli spaziali fisici reali usano esclusivamente elementi OMM ufficiali CelesTrak (NORAD CATNR).
// 3. I 2 canali logici esclusivamente applicativi (GATEWAY-RELAIS, BEACON-BUSINESS) hanno noradId = null e dichiarano esplicitamente l'assenza di tracciamento orbitale fisico.
// 4. Se i dati reali non sono disponibili (rete assente / errore CelesTrak), lo stato viene dichiarato esplicitamente come 'unavailable' con lat/lng/quota null.

import {
  json2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
  type OMMJsonObject,
  type SatRec,
} from 'satellite.js';
import type { SatelliteId } from './satelliteModularEngine';

export type SatelliteTrackStatus =
  | 'loading'
  | 'live'
  | 'unavailable'
  | 'logical_channel';

export interface CelesTrakOmmRecord {
  OBJECT_NAME: string;
  OBJECT_ID?: string;
  EPOCH: string;
  MEAN_MOTION: number; // rev/day
  ECCENTRICITY: number;
  INCLINATION: number; // deg
  RA_OF_ASC_NODE: number; // deg
  ARG_OF_PERICENTER: number; // deg
  MEAN_ANOMALY: number; // deg
  NORAD_CAT_ID: number;
  MEAN_MOTION_DOT?: number;
  MEAN_MOTION_DDOT?: number;
  BSTAR?: number;
  ELEMENT_SET_NO?: number;
  REV_AT_EPOCH?: number;
  EPHEMERIS_TYPE?: 0 | '0';
  CLASSIFICATION_TYPE?: 'U' | 'C';
}

export interface SatelliteCatalogTarget {
  satelliteId: SatelliteId;
  noradId: number | null;
  officialName: string;
  operator: string;
  orbitRegime: 'GEO' | 'LEO-SSO' | 'LEO' | 'MEO' | 'LOGICAL';
  isPhysicalSpacecraft: boolean;
  nonPhysicalReason?: string;
}

export interface SatelliteTelemetry {
  satelliteId: SatelliteId;
  noradId: number | null;
  officialName: string;
  objectName: string | null;
  internationalDesignator: string | null;
  operator: string;
  orbitRegime: 'GEO' | 'LEO-SSO' | 'LEO' | 'MEO' | 'LOGICAL';
  isPhysicalSpacecraft: boolean;
  status: SatelliteTrackStatus;
  lat: number | null;
  lng: number | null;
  altitudeKm: number | null;
  velocityKms: number | null;
  inclinationDeg: number | null;
  periodMinutes: number | null;
  epochIso: string | null;
  fetchedAtIso: string | null;
  computedAtIso: string | null;
  source: string | null;
  propagationModel?: string;
  unavailableReason: string | null;
}

export interface OrbitTrackPoint {
  lat: number;
  lng: number;
  altitudeKm: number;
}

export const TRACKABLE_SATELLITES_METADATA: Record<SatelliteId, SatelliteCatalogTarget> = {
  METEO_SAT: {
    satelliteId: 'METEO_SAT',
    noradId: 54743,
    officialName: 'METEOSAT-12 (MTG-I1)',
    operator: 'EUMETSAT (Open Weather Data)',
    orbitRegime: 'GEO',
    isPhysicalSpacecraft: true,
  },
  KM0_SAT: {
    satelliteId: 'KM0_SAT',
    noradId: 40697,
    officialName: 'SENTINEL-2A',
    operator: 'ESA Copernicus (Open License)',
    orbitRegime: 'LEO-SSO',
    isPhysicalSpacecraft: true,
  },
  MAP_SAT: {
    satelliteId: 'MAP_SAT',
    noradId: 42063,
    officialName: 'SENTINEL-2B',
    operator: 'ESA Copernicus (Open License)',
    orbitRegime: 'LEO-SSO',
    isPhysicalSpacecraft: true,
  },
  PI_CHAT_SAT: {
    satelliteId: 'PI_CHAT_SAT',
    noradId: 49143,
    officialName: 'STARLINK-3109',
    operator: 'SpaceX (Public CelesTrak Telemetry)',
    orbitRegime: 'LEO',
    isPhysicalSpacecraft: true,
  },
  GLOBAL_MARKET_SAT: {
    satelliteId: 'GLOBAL_MARKET_SAT',
    noradId: 43562,
    officialName: 'TELSTAR 19V',
    operator: 'Telesat (Public CelesTrak Telemetry)',
    orbitRegime: 'GEO',
    isPhysicalSpacecraft: true,
  },
  COMMUNITY_RESCUE_SAT: {
    satelliteId: 'COMMUNITY_RESCUE_SAT',
    noradId: 43566,
    officialName: 'GSAT0219 (GALILEO 23 · SAR/COSPAS-SARSAT)',
    operator: 'EU / ESA / Cospas-Sarsat MEOSAR (Open)',
    orbitRegime: 'MEO',
    isPhysicalSpacecraft: true,
  },
  EXTERNAL_MARKET_SAT: {
    satelliteId: 'EXTERNAL_MARKET_SAT',
    noradId: null,
    officialName: 'GATEWAY-RELAIS (Marketplace Esterni Crypto Only)',
    operator: 'HAVE2WANT Network',
    orbitRegime: 'LOGICAL',
    isPhysicalSpacecraft: false,
    nonPhysicalReason:
      'Canale logico HAVE2WANT (eBay/Amazon): nessun satellite fisico associato su NORAD/CelesTrak.',
  },
  BUSINESS_ADS_SAT: {
    satelliteId: 'BUSINESS_ADS_SAT',
    noradId: null,
    officialName: 'BEACON-BUSINESS (Creazione Pubblicità Locali)',
    operator: 'HAVE2WANT Network',
    orbitRegime: 'LOGICAL',
    isPhysicalSpacecraft: false,
    nonPhysicalReason:
      'Canale logico HAVE2WANT (Pubblicità Locali Pi/USDT): nessun satellite fisico associato su NORAD/CelesTrak.',
  },
  ACTIONFLOW_SAT: {
    satelliteId: 'ACTIONFLOW_SAT',
    noradId: null,
    officialName: 'ACTIONFLOW-HUB (Bridge App Esterne)',
    operator: 'HAVE2WANT Network',
    orbitRegime: 'LOGICAL',
    isPhysicalSpacecraft: false,
    nonPhysicalReason:
      'Canale logico HAVE2WANT (ActionFlow Hub): nessun satellite fisico associato su NORAD/CelesTrak.',
  },
  DEFIANCE_PULSE_SAT: {
    satelliteId: 'DEFIANCE_PULSE_SAT',
    noradId: null,
    officialName: 'DEFIANCE-PULSE (Creator, Musica, Video & Promo)',
    operator: 'HAVE2WANT Network',
    orbitRegime: 'LOGICAL',
    isPhysicalSpacecraft: false,
    nonPhysicalReason:
      'Canale logico HAVE2WANT (Defiance Pulse): nessun satellite fisico associato su NORAD/CelesTrak.',
  },
};

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const CELESTRAK_SOURCE_LABEL = 'CelesTrak GP/OMM (NORAD SGP4/SDP4)';
const SGP4_MODEL_LABEL = 'SGP4/SDP4 (satellite.js)';

function normalizeRad(angle: number): number {
  const m = angle % TWO_PI;
  return m < 0 ? m + TWO_PI : m;
}

export function parseCelesTrakEpochMs(epochStr: string): number | null {
  if (!epochStr || typeof epochStr !== 'string') return null;
  const trimmed = epochStr.trim();
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed) ? trimmed : `${trimmed}Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

export function computeGmstRad(date: Date): number {
  return normalizeRad(gstime(date));
}

function isValidOmmRecord(raw: any): raw is CelesTrakOmmRecord {
  if (!raw || typeof raw !== 'object') return false;
  return (
    typeof raw.OBJECT_NAME === 'string' &&
    typeof raw.EPOCH === 'string' &&
    parseCelesTrakEpochMs(raw.EPOCH) !== null &&
    typeof raw.NORAD_CAT_ID === 'number' &&
    Number.isFinite(raw.MEAN_MOTION) &&
    raw.MEAN_MOTION > 0 &&
    typeof raw.ECCENTRICITY === 'number' &&
    raw.ECCENTRICITY >= 0 &&
    raw.ECCENTRICITY < 1 &&
    typeof raw.INCLINATION === 'number' &&
    Number.isFinite(raw.INCLINATION) &&
    typeof raw.RA_OF_ASC_NODE === 'number' &&
    Number.isFinite(raw.RA_OF_ASC_NODE) &&
    typeof raw.ARG_OF_PERICENTER === 'number' &&
    Number.isFinite(raw.ARG_OF_PERICENTER) &&
    typeof raw.MEAN_ANOMALY === 'number' &&
    Number.isFinite(raw.MEAN_ANOMALY)
  );
}

function toSgp4OmmJson(omm: CelesTrakOmmRecord): OMMJsonObject {
  const epochTrimmed = omm.EPOCH.trim().replace(/Z$/i, '');
  return {
    OBJECT_NAME: omm.OBJECT_NAME,
    OBJECT_ID: omm.OBJECT_ID || '2000-001A',
    EPOCH: epochTrimmed,
    MEAN_MOTION: omm.MEAN_MOTION,
    ECCENTRICITY: omm.ECCENTRICITY,
    INCLINATION: omm.INCLINATION,
    RA_OF_ASC_NODE: omm.RA_OF_ASC_NODE,
    ARG_OF_PERICENTER: omm.ARG_OF_PERICENTER,
    MEAN_ANOMALY: omm.MEAN_ANOMALY,
    EPHEMERIS_TYPE: omm.EPHEMERIS_TYPE ?? 0,
    CLASSIFICATION_TYPE: omm.CLASSIFICATION_TYPE ?? 'U',
    NORAD_CAT_ID: omm.NORAD_CAT_ID,
    ELEMENT_SET_NO: omm.ELEMENT_SET_NO ?? 999,
    REV_AT_EPOCH: omm.REV_AT_EPOCH ?? 0,
    BSTAR: omm.BSTAR ?? 0,
    MEAN_MOTION_DOT: omm.MEAN_MOTION_DOT ?? 0,
    MEAN_MOTION_DDOT: omm.MEAN_MOTION_DDOT ?? 0,
  };
}

function buildSatRec(omm: CelesTrakOmmRecord): SatRec | null {
  try {
    const satrec = json2satrec(toSgp4OmmJson(omm));
    if (!satrec || satrec.error !== 0) return null;
    return satrec;
  } catch {
    return null;
  }
}

function propagateSgp4ToGeodetic(
  satrec: SatRec,
  date: Date,
  gmstOverrideRad?: number
): {
  lat: number;
  lng: number;
  altitudeKm: number;
  velocityKms: number;
} | null {
  try {
    const pv = propagate(satrec, date);
    if (!pv || !pv.position || !pv.velocity) return null;

    const gmst = typeof gmstOverrideRad === 'number' ? gmstOverrideRad : gstime(date);
    const geodetic = eciToGeodetic(pv.position, gmst);
    const lat = degreesLat(geodetic.latitude);
    const lng = degreesLong(geodetic.longitude);
    const altitudeKm = geodetic.height;
    const velocityKms = Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      !Number.isFinite(altitudeKm) ||
      !Number.isFinite(velocityKms)
    ) {
      return null;
    }

    return {
      lat,
      lng,
      altitudeKm,
      velocityKms,
    };
  } catch {
    return null;
  }
}

export function buildUnavailableTelemetry(
  satelliteId: SatelliteId,
  reason: string,
  status: 'loading' | 'unavailable' | 'logical_channel' = 'unavailable'
): SatelliteTelemetry {
  const meta = TRACKABLE_SATELLITES_METADATA[satelliteId];
  return {
    satelliteId,
    noradId: meta.noradId,
    officialName: meta.officialName,
    objectName: meta.isPhysicalSpacecraft ? meta.officialName : null,
    internationalDesignator: null,
    operator: meta.operator,
    orbitRegime: meta.orbitRegime,
    isPhysicalSpacecraft: meta.isPhysicalSpacecraft,
    status: meta.isPhysicalSpacecraft ? status : 'logical_channel',
    lat: null,
    lng: null,
    altitudeKm: null,
    velocityKms: null,
    inclinationDeg: null,
    periodMinutes: null,
    epochIso: null,
    fetchedAtIso: null,
    computedAtIso: new Date().toISOString(),
    source: meta.isPhysicalSpacecraft ? CELESTRAK_SOURCE_LABEL : 'HAVE2WANT Logical Channel',
    propagationModel: meta.isPhysicalSpacecraft ? SGP4_MODEL_LABEL : 'LOGICAL',
    unavailableReason: meta.isPhysicalSpacecraft
      ? reason
      : meta.nonPhysicalReason || 'Canale logico senza satellite fisico tracciabile',
  };
}

export function computeSatelliteTelemetryFromOmm(
  satelliteId: SatelliteId,
  omm: CelesTrakOmmRecord,
  date: Date = new Date(),
  fetchedAtIso: string | null = null
): SatelliteTelemetry {
  const meta = TRACKABLE_SATELLITES_METADATA[satelliteId];
  if (!meta.isPhysicalSpacecraft) {
    return buildUnavailableTelemetry(
      satelliteId,
      meta.nonPhysicalReason || 'Canale logico',
      'logical_channel'
    );
  }
  if (!isValidOmmRecord(omm)) {
    return buildUnavailableTelemetry(satelliteId, 'Dati orbitali CelesTrak OMM non validi o incompleti');
  }

  const satrec = buildSatRec(omm);
  const propagated = satrec ? propagateSgp4ToGeodetic(satrec, date) : null;
  if (!propagated) {
    return buildUnavailableTelemetry(satelliteId, 'Impossibile propagare i parametri orbitali CelesTrak via SGP4/SDP4');
  }

  return {
    satelliteId,
    noradId: omm.NORAD_CAT_ID,
    officialName: meta.officialName,
    objectName: omm.OBJECT_NAME,
    internationalDesignator: omm.OBJECT_ID || null,
    operator: meta.operator,
    orbitRegime: meta.orbitRegime,
    isPhysicalSpacecraft: true,
    status: 'live',
    lat: propagated.lat,
    lng: propagated.lng,
    altitudeKm: propagated.altitudeKm,
    velocityKms: propagated.velocityKms,
    inclinationDeg: omm.INCLINATION,
    periodMinutes: 1440 / omm.MEAN_MOTION,
    epochIso: omm.EPOCH,
    fetchedAtIso: fetchedAtIso || new Date().toISOString(),
    computedAtIso: date.toISOString(),
    source: CELESTRAK_SOURCE_LABEL,
    propagationModel: SGP4_MODEL_LABEL,
    unavailableReason: null,
  };
}

/**
 * Calcola la geometria istantanea reale del piano orbitale via SGP4/SDP4 da CelesTrak OMM (nessuna orbita inventata).
 * Fissa il tempo siderale GMST all'istante `date` e campiona un periodo orbitale completo attorno a `date`
 * in modo che la traiettoria 3D passi esattamente attraverso la posizione geografica reale del satellite.
 */
export function computeInstantaneousOrbitTrack(
  omm: CelesTrakOmmRecord,
  date: Date = new Date(),
  segments = 96
): OrbitTrackPoint[] {
  if (!isValidOmmRecord(omm) || segments <= 0) return [];
  const satrec = buildSatRec(omm);
  if (!satrec) return [];

  const gmstFixed = gstime(date);
  const periodMinutes = 1440 / omm.MEAN_MOTION;
  const periodMs = periodMinutes * 60 * 1000;
  const points: OrbitTrackPoint[] = [];

  for (let i = 0; i < segments; i++) {
    const sampleDate = new Date(date.getTime() + (i / segments) * periodMs);
    const sample = propagateSgp4ToGeodetic(satrec, sampleDate, gmstFixed);
    if (sample) {
      points.push({
        lat: sample.lat,
        lng: sample.lng,
        altitudeKm: sample.altitudeKm,
      });
    }
  }
  return points;
}

/**
 * Converte la quota orbitale reale (km) in raggio leggibile sulla scena Globo 3D (raggio Terra = 60).
 * Preserva la distinzione gerarchica reale LEO (550-800 km) < MEO (23.222 km) < GEO (35.786 km)
 * mantenendo tutti i veicoli visibili nell'inquadratura della camera orbitale.
 */
export function altitudeKmToGlobeRadius(altitudeKm: number | null, earthRadius = 60): number {
  if (typeof altitudeKm !== 'number' || !Number.isFinite(altitudeKm) || altitudeKm <= 0) {
    return earthRadius * 1.25;
  }
  const scaledOffset = 8 + Math.log10(1 + altitudeKm / 250) * 16.5;
  return earthRadius + Math.min(46, Math.max(8, scaledOffset));
}

export async function fetchSatelliteOmmFromCelesTrak(
  noradId: number,
  fetchImpl: typeof fetch = globalThis.fetch
): Promise<{ ok: true; omm: CelesTrakOmmRecord } | { ok: false; error: string }> {
  if (typeof fetchImpl !== 'function') {
    return { ok: false, error: 'Fetch API non disponibile in questo ambiente' };
  }
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), 9000) : null;

  try {
    const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${encodeURIComponent(String(noradId))}&FORMAT=json`;
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(controller ? { signal: controller.signal } : {}),
    });
    if (!res.ok) {
      return { ok: false, error: `CelesTrak HTTP ${res.status}` };
    }
    const data = await res.json();
    const record = Array.isArray(data) ? data[0] : data;
    if (!isValidOmmRecord(record)) {
      return { ok: false, error: `Nessun record OMM valido restituito per NORAD ${noradId}` };
    }
    return { ok: true, omm: record };
  } catch (err: any) {
    const msg =
      err?.name === 'AbortError'
        ? 'Timeout connessione CelesTrak'
        : err?.message || 'Errore di rete CelesTrak';
    return { ok: false, error: msg };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

type TelemetryListener = (telemetryMap: Record<SatelliteId, SatelliteTelemetry>) => void;

class SatelliteTelemetryStore {
  private ommCache = new Map<SatelliteId, { omm: CelesTrakOmmRecord; fetchedAtIso: string }>();
  private errorCache = new Map<SatelliteId, string>();
  private loadingSet = new Set<SatelliteId>();
  private listeners = new Set<TelemetryListener>();
  private inFlightPromise: Promise<Record<SatelliteId, SatelliteTelemetry>> | null = null;
  private lastRefreshMs = 0;

  constructor() {
    (Object.keys(TRACKABLE_SATELLITES_METADATA) as SatelliteId[]).forEach((id) => {
      const meta = TRACKABLE_SATELLITES_METADATA[id];
      if (meta.isPhysicalSpacecraft) {
        this.loadingSet.add(id);
      }
    });
  }

  public getOmmRecord(satelliteId: SatelliteId): CelesTrakOmmRecord | null {
    return this.ommCache.get(satelliteId)?.omm || null;
  }

  public getSatelliteTelemetry(satelliteId: SatelliteId, date: Date = new Date()): SatelliteTelemetry {
    const meta = TRACKABLE_SATELLITES_METADATA[satelliteId];
    if (!meta.isPhysicalSpacecraft || meta.noradId === null) {
      return buildUnavailableTelemetry(
        satelliteId,
        meta.nonPhysicalReason || 'Canale logico HAVE2WANT',
        'logical_channel'
      );
    }

    const cached = this.ommCache.get(satelliteId);
    if (cached) {
      return computeSatelliteTelemetryFromOmm(satelliteId, cached.omm, date, cached.fetchedAtIso);
    }

    if (this.loadingSet.has(satelliteId)) {
      return buildUnavailableTelemetry(
        satelliteId,
        'Recupero elementi orbitali reali CelesTrak in corso...',
        'loading'
      );
    }

    const err = this.errorCache.get(satelliteId) || 'Dati orbitali reali CelesTrak non disponibili';
    return buildUnavailableTelemetry(satelliteId, err, 'unavailable');
  }

  public getSnapshot(date: Date = new Date()): Record<SatelliteId, SatelliteTelemetry> {
    const map = {} as Record<SatelliteId, SatelliteTelemetry>;
    (Object.keys(TRACKABLE_SATELLITES_METADATA) as SatelliteId[]).forEach((id) => {
      map[id] = this.getSatelliteTelemetry(id, date);
    });
    return map;
  }

  private notify(date: Date = new Date()) {
    const snap = this.getSnapshot(date);
    this.listeners.forEach((listener) => {
      try {
        listener(snap);
      } catch (err) {
        console.error('Errore listener telemetria satelliti:', err);
      }
    });
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot(new Date()));
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async refreshAll(force = false, fetchImpl: typeof fetch = globalThis.fetch): Promise<Record<SatelliteId, SatelliteTelemetry>> {
    const nowMs = Date.now();
    // Evita richieste ridondanti ravvicinate se gli OMM reali sono già freschi (< 10 min)
    if (!force && this.inFlightPromise) {
      return this.inFlightPromise;
    }
    if (!force && this.ommCache.size > 0 && nowMs - this.lastRefreshMs < 10 * 60 * 1000) {
      return this.getSnapshot(new Date());
    }

    const physicalEntries = (Object.values(TRACKABLE_SATELLITES_METADATA)).filter(
      (m) => m.isPhysicalSpacecraft && m.noradId !== null
    );

    physicalEntries.forEach((m) => {
      this.loadingSet.add(m.satelliteId);
    });
    this.notify();

    this.inFlightPromise = (async () => {
      await Promise.all(
        physicalEntries.map(async (meta) => {
          const result = await fetchSatelliteOmmFromCelesTrak(meta.noradId!, fetchImpl);
          this.loadingSet.delete(meta.satelliteId);
          if ('omm' in result) {
            this.ommCache.set(meta.satelliteId, {
              omm: result.omm,
              fetchedAtIso: new Date().toISOString(),
            });
            this.errorCache.delete(meta.satelliteId);
          } else {
            this.errorCache.set(
              meta.satelliteId,
              `Dati orbitali reali non disponibili (${result.error})`
            );
          }
        })
      );
      this.lastRefreshMs = Date.now();
      this.inFlightPromise = null;
      const snap = this.getSnapshot(new Date());
      this.notify(new Date());
      return snap;
    })();

    return this.inFlightPromise;
  }

  public resetForTests() {
    this.ommCache.clear();
    this.errorCache.clear();
    this.loadingSet.clear();
    this.inFlightPromise = null;
    this.lastRefreshMs = 0;
  }
}

export const satelliteTelemetryStore = new SatelliteTelemetryStore();

export function formatCoordLat(lat: number | null): string {
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return 'N/D';
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
}

export function formatCoordLng(lng: number | null): string {
  if (typeof lng !== 'number' || !Number.isFinite(lng)) return 'N/D';
  return `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'O'}`;
}
