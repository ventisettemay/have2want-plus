import { describe, it, expect } from 'vitest';
import {
  INITIAL_PI_MERCHANTS,
  haversineMeters,
  computeBearingDeg,
  buildNextTurnBanner,
  computeGpsCameraEaseOptions,
} from '../src/components/have2want/Urbano3D';
import { classifyMerchantPin } from '../src/lib/merchantPinClassifier';

describe('Urbano3D — Commercianti Sempre Visibili & Navigazione Turn-by-Turn', () => {
  it('INITIAL_PI_MERCHANTS include tutte e 3 le tipologie (π, 🏪, Doppio Anello)', () => {
    expect(INITIAL_PI_MERCHANTS.length).toBeGreaterThanOrEqual(3);
    const categories = new Set(INITIAL_PI_MERCHANTS.map((m) => classifyMerchantPin(m).type));
    expect(categories.has('PI_ACCEPTED')).toBe(true);
    expect(categories.has('AD_ONLY')).toBe(true);
    expect(categories.has('DOUBLE_RING')).toBe(true);
  });

  it('Calcola correttamente distanza geodetica in metri e direzione (bearing)', () => {
    const northBearing = computeBearingDeg(41.89, 12.49, 41.90, 12.49);
    expect(northBearing).toBeCloseTo(0, 0);

    const eastBearing = computeBearingDeg(41.89, 12.49, 41.89, 12.50);
    expect(eastBearing).toBeCloseTo(90, 0);

    const dist = haversineMeters(41.89, 12.49, 41.89, 12.49);
    expect(dist).toBe(0);

    const distNorth = haversineMeters(41.89, 12.49, 41.891, 12.49);
    expect(distNorth).toBeGreaterThan(100);
    expect(distNorth).toBeLessThan(125);
  });

  it('Formatta correttamente il banner turn-by-turn "Tra [X] metri: [Svolta]"', () => {
    const sampleRoute = {
      totalDistanceMeters: 620,
      steps: [
        {
          instruction: 'Parti su Via del Corso',
          distanceMeters: 80,
          location: [12.49, 41.89],
        },
        {
          instruction: 'Svolta a destra su Via Condotti',
          distanceMeters: 150,
          location: [12.491, 41.89],
        },
      ],
    };

    const banner = buildNextTurnBanner(sampleRoute, 41.89, 12.49);
    expect(banner.text).toMatch(/^Tra \d+ metri: Svolta a destra su Via Condotti$/);
    expect(banner.distanceMeters).toBeGreaterThan(50);
  });

  it('Sblocca zoom e pan manuali durante navigazione GPS senza forzare zoom >= 17.4', () => {
    const defaultFollow = computeGpsCameraEaseOptions({
      uLat: 41.891,
      uLng: 12.492,
      heading: 45,
      userHasAdjustedZoom: false,
      userHasPanned: false,
    });
    expect(defaultFollow).toEqual({
      center: [12.492, 41.891],
      bearing: 45,
      pitch: 62,
      duration: 550,
    });
    expect((defaultFollow as any).zoom).toBeUndefined();

    const zoomedFollow = computeGpsCameraEaseOptions({
      uLat: 41.891,
      uLng: 12.492,
      heading: 90,
      userHasAdjustedZoom: true,
      userHasPanned: false,
    });
    expect(zoomedFollow).toEqual({
      center: [12.492, 41.891],
      bearing: 90,
      duration: 550,
    });
    expect((zoomedFollow as any).pitch).toBeUndefined();
    expect((zoomedFollow as any).zoom).toBeUndefined();

    const pannedPause = computeGpsCameraEaseOptions({
      uLat: 41.891,
      uLng: 12.492,
      heading: 90,
      userHasAdjustedZoom: true,
      userHasPanned: true,
    });
    expect(pannedPause).toBeNull();
  });
});
