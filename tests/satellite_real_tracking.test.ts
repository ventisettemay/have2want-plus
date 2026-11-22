import { describe, it, expect, beforeEach } from 'vitest';
import {
  TRACKABLE_SATELLITES_METADATA,
  computeSatelliteTelemetryFromOmm,
  computeInstantaneousOrbitTrack,
  altitudeKmToGlobeRadius,
  fetchSatelliteOmmFromCelesTrak,
  satelliteTelemetryStore,
  CelesTrakOmmRecord,
} from '../src/lib/satelliteTrackingService';
import { INITIAL_SATELLITES_CATALOG } from '../src/lib/satelliteModularEngine';

const SENTINEL_2A_OMM: CelesTrakOmmRecord = {
  OBJECT_NAME: 'SENTINEL-2A',
  OBJECT_ID: '2015-028A',
  EPOCH: '2026-11-21T15:03:06.236928',
  MEAN_MOTION: 14.30819076,
  ECCENTRICITY: 0.0001177,
  INCLINATION: 98.5667,
  RA_OF_ASC_NODE: 38.1671,
  ARG_OF_PERICENTER: 91.0729,
  MEAN_ANOMALY: 269.0588,
  NORAD_CAT_ID: 40697,
  MEAN_MOTION_DOT: 1.84e-6,
};

const METEOSAT_12_OMM: CelesTrakOmmRecord = {
  OBJECT_NAME: 'METEOSAT-12 (MTG-I1)',
  OBJECT_ID: '2022-170C',
  EPOCH: '2026-11-21T12:49:38.619264',
  MEAN_MOTION: 1.0026901,
  ECCENTRICITY: 0.00029589,
  INCLINATION: 0.7713,
  RA_OF_ASC_NODE: 24.4325,
  ARG_OF_PERICENTER: 81.6993,
  MEAN_ANOMALY: 146.5292,
  NORAD_CAT_ID: 54743,
  MEAN_MOTION_DOT: 1.6e-7,
};

const WORLDVIEW_3_OMM: CelesTrakOmmRecord = {
  OBJECT_NAME: 'WORLDVIEW-3 (WV-3)',
  OBJECT_ID: '2014-048A',
  EPOCH: '2026-11-21T14:59:32.957664',
  MEAN_MOTION: 14.84929614,
  ECCENTRICITY: 0.00017746,
  INCLINATION: 97.8617,
  RA_OF_ASC_NODE: 38.1744,
  ARG_OF_PERICENTER: 92.2749,
  MEAN_ANOMALY: 267.8669,
  NORAD_CAT_ID: 40115,
  MEAN_MOTION_DOT: 6.0e-6,
};

const STARLINK_3109_OMM: CelesTrakOmmRecord = {
  OBJECT_NAME: 'STARLINK-3109',
  OBJECT_ID: '2021-082P',
  EPOCH: '2026-11-21T14:00:01.999872',
  MEAN_MOTION: 15.08123485,
  ECCENTRICITY: 0.00022272,
  INCLINATION: 69.9999,
  RA_OF_ASC_NODE: 348.177,
  ARG_OF_PERICENTER: 272.4726,
  MEAN_ANOMALY: 286.5433,
  NORAD_CAT_ID: 49143,
  MEAN_MOTION_DOT: 0.00047045,
};

const TELSTAR_19V_OMM: CelesTrakOmmRecord = {
  OBJECT_NAME: 'TELSTAR 19V',
  OBJECT_ID: '2018-059A',
  EPOCH: '2026-11-20T10:01:24.248064',
  MEAN_MOTION: 1.00270281,
  ECCENTRICITY: 0.0002584,
  INCLINATION: 0.0133,
  RA_OF_ASC_NODE: 293.0618,
  ARG_OF_PERICENTER: 299.0514,
  MEAN_ANOMALY: 274.7022,
  NORAD_CAT_ID: 43562,
  MEAN_MOTION_DOT: -2.57e-6,
};

const GALILEO_23_OMM: CelesTrakOmmRecord = {
  OBJECT_NAME: 'GSAT0219 (GALILEO 23)',
  OBJECT_ID: '2018-060C',
  EPOCH: '2026-11-21T02:57:35.203104',
  MEAN_MOTION: 1.70475802,
  ECCENTRICITY: 0.00054397,
  INCLINATION: 57.1088,
  RA_OF_ASC_NODE: 337.5402,
  ARG_OF_PERICENTER: 286.5916,
  MEAN_ANOMALY: 73.3926,
  NORAD_CAT_ID: 43566,
  MEAN_MOTION_DOT: -4.9e-7,
};

const OMM_BY_NORAD: Record<number, CelesTrakOmmRecord> = {
  54743: METEOSAT_12_OMM,
  40697: SENTINEL_2A_OMM,
  40115: WORLDVIEW_3_OMM,
  49143: STARLINK_3109_OMM,
  43562: TELSTAR_19V_OMM,
  43566: GALILEO_23_OMM,
};

describe('Satellite Real CelesTrak Orbital Tracking – HAVE2WANT PLUS', () => {
  beforeEach(() => {
    satelliteTelemetryStore.resetForTests();
  });

  it('Distingue esattamente i 6 satelliti fisici NORAD dai 2 canali logici senza inventare NORAD ID', () => {
    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(8);
    const physical = INITIAL_SATELLITES_CATALOG.filter((s) => s.isPhysicalSpacecraft);
    const logical = INITIAL_SATELLITES_CATALOG.filter((s) => !s.isPhysicalSpacecraft);

    expect(physical).toHaveLength(6);
    expect(logical).toHaveLength(2);
    physical.forEach((s) => {
      expect(typeof s.noradId).toBe('number');
      expect(TRACKABLE_SATELLITES_METADATA[s.id].noradId).toBe(s.noradId);
    });
    logical.forEach((s) => {
      expect(s.noradId).toBeNull();
      expect(s.altitudeKm).toBeNull();
      expect(['EXTERNAL_MARKET_SAT', 'BUSINESS_ADS_SAT']).toContain(s.id);
    });
  });

  it('Calcola latitudine, longitudine, quota orbitale e velocità reali da CelesTrak OMM', () => {
    const t0 = new Date('2026-11-21T15:10:00Z');
    const sentinel = computeSatelliteTelemetryFromOmm('KM0_SAT', SENTINEL_2A_OMM, t0);
    expect(sentinel.status).toBe('live');
    expect(sentinel.lat).not.toBeNull();
    expect(sentinel.lng).not.toBeNull();
    expect(sentinel.lat!).toBeGreaterThanOrEqual(-90);
    expect(sentinel.lat!).toBeLessThanOrEqual(90);
    expect(sentinel.lng!).toBeGreaterThanOrEqual(-180);
    expect(sentinel.lng!).toBeLessThanOrEqual(180);
    expect(sentinel.altitudeKm!).toBeGreaterThan(750);
    expect(sentinel.altitudeKm!).toBeLessThan(830);
    expect(sentinel.velocityKms!).toBeGreaterThan(7.0);
    expect(sentinel.velocityKms!).toBeLessThan(8.0);
    expect(sentinel.source).toContain('CelesTrak');
    expect(sentinel.propagationModel).toBe('SGP4/SDP4 (satellite.js)');

    const meteosat = computeSatelliteTelemetryFromOmm('METEO_SAT', METEOSAT_12_OMM, t0);
    expect(meteosat.status).toBe('live');
    expect(meteosat.propagationModel).toBe('SGP4/SDP4 (satellite.js)');
    expect(Math.abs(meteosat.lat!)).toBeLessThan(2.5);
    expect(meteosat.altitudeKm!).toBeGreaterThan(35400);
    expect(meteosat.altitudeKm!).toBeLessThan(36200);
  });

  it('Aggiorna dinamicamente la posizione reale di un satellite LEO nel tempo (nessuna orbita statica)', () => {
    const t1 = new Date('2026-11-21T15:05:00Z');
    const t2 = new Date('2026-11-21T15:20:00Z');

    const pos1 = computeSatelliteTelemetryFromOmm('KM0_SAT', SENTINEL_2A_OMM, t1);
    const pos2 = computeSatelliteTelemetryFromOmm('KM0_SAT', SENTINEL_2A_OMM, t2);

    expect(pos1.status).toBe('live');
    expect(pos2.status).toBe('live');
    const deltaDeg = Math.hypot(pos2.lat! - pos1.lat!, pos2.lng! - pos1.lng!);
    expect(deltaDeg).toBeGreaterThan(20);
  });

  it('Calcola la geometria reale della traiettoria orbitale su 96 punti per il Globo 3D e preserva gerarchia LEO < MEO < GEO', () => {
    const t = new Date('2026-11-21T15:10:00Z');
    const track = computeInstantaneousOrbitTrack(STARLINK_3109_OMM, t, 96);
    expect(track).toHaveLength(96);
    track.forEach((pt) => {
      expect(Number.isFinite(pt.lat)).toBe(true);
      expect(Number.isFinite(pt.lng)).toBe(true);
      expect(Number.isFinite(pt.altitudeKm)).toBe(true);
      expect(pt.lat).toBeGreaterThanOrEqual(-90);
      expect(pt.lat).toBeLessThanOrEqual(90);
      expect(pt.lng).toBeGreaterThanOrEqual(-180);
      expect(pt.lng).toBeLessThanOrEqual(180);
      expect(pt.altitudeKm).toBeGreaterThan(450);
    });

    const rLeo = altitudeKmToGlobeRadius(550, 60);
    const rMeo = altitudeKmToGlobeRadius(23222, 60);
    const rGeo = altitudeKmToGlobeRadius(35786, 60);
    expect(rLeo).toBeGreaterThan(60);
    expect(rMeo).toBeGreaterThan(rLeo);
    expect(rGeo).toBeGreaterThan(rMeo);
  });

  it('Dichiara esplicitamente dati non disponibili quando CelesTrak è offline o fallisce (ZERO coordinate inventate)', async () => {
    const failingFetch: typeof fetch = async () => {
      throw new Error('Network offline');
    };

    const singleResult = await fetchSatelliteOmmFromCelesTrak(40697, failingFetch);
    expect(singleResult.ok).toBe(false);

    const snap = await satelliteTelemetryStore.refreshAll(true, failingFetch);
    expect(snap.KM0_SAT.status).toBe('unavailable');
    expect(snap.KM0_SAT.lat).toBeNull();
    expect(snap.KM0_SAT.lng).toBeNull();
    expect(snap.KM0_SAT.altitudeKm).toBeNull();
    expect(snap.KM0_SAT.unavailableReason).toContain('non disponibili');

    expect(snap.EXTERNAL_MARKET_SAT.status).toBe('logical_channel');
    expect(snap.EXTERNAL_MARKET_SAT.lat).toBeNull();
    expect(snap.BUSINESS_ADS_SAT.status).toBe('logical_channel');
    expect(snap.BUSINESS_ADS_SAT.lat).toBeNull();
  });

  it('Popola lo store reale per tutti i 6 satelliti fisici quando CelesTrak risponde e mantiene logici i 2 canali H2W', async () => {
    const mockCelesTrakFetch: typeof fetch = async (input) => {
      const url = String(input);
      const match = url.match(/CATNR=(\d+)/);
      const noradId = match ? Number(match[1]) : 0;
      const omm = OMM_BY_NORAD[noradId];
      return new Response(JSON.stringify(omm ? [omm] : []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const snap = await satelliteTelemetryStore.refreshAll(true, mockCelesTrakFetch);

    (['METEO_SAT', 'KM0_SAT', 'STREET_360_SAT', 'PI_CHAT_SAT', 'GLOBAL_MARKET_SAT', 'COMMUNITY_RESCUE_SAT'] as const).forEach(
      (id) => {
        expect(snap[id].status).toBe('live');
        expect(typeof snap[id].lat).toBe('number');
        expect(typeof snap[id].lng).toBe('number');
        expect(typeof snap[id].altitudeKm).toBe('number');
        expect(typeof snap[id].velocityKms).toBe('number');
      }
    );

    expect(snap.EXTERNAL_MARKET_SAT.status).toBe('logical_channel');
    expect(snap.EXTERNAL_MARKET_SAT.lat).toBeNull();
    expect(snap.BUSINESS_ADS_SAT.status).toBe('logical_channel');
    expect(snap.BUSINESS_ADS_SAT.lat).toBeNull();
  });
});
