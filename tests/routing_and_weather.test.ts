import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateRealRoute, type RealRouteResult } from '../src/lib/routingService';
import { getRealtimeWeather, getRainViewerRadarData, getWindDirectionLabel } from '../src/lib/weatherService';

describe('Servizio Routing Reale OSRM & Meteorologia Avanzata', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Routing OSRM Reale A-B', () => {
    it('calcola correttamente una rotta con OSRM e formatta passi di manovra in italiano', async () => {
      const mockOsrmResponse = {
        code: 'Ok',
        routes: [
          {
            geometry: {
              coordinates: [
                [12.4922, 41.8902],
                [12.4930, 41.8910],
                [12.4940, 41.8920],
              ],
            },
            distance: 1450,
            duration: 180,
            legs: [
              {
                steps: [
                  {
                    maneuver: { type: 'depart', modifier: '' },
                    name: 'Via dei Fori Imperiali',
                    distance: 600,
                    duration: 60,
                  },
                  {
                    maneuver: { type: 'turn', modifier: 'right' },
                    name: 'Via Cavour',
                    distance: 850,
                    duration: 120,
                  },
                  {
                    maneuver: { type: 'arrive', modifier: '' },
                    name: '',
                    distance: 0,
                    duration: 0,
                  },
                ],
              },
            ],
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockOsrmResponse,
      } as unknown as Response);

      const route: RealRouteResult | null = await calculateRealRoute(41.8902, 12.4922, 41.8920, 12.4940, 'driving');
      expect(route).not.toBeNull();
      if (!route) return;

      expect(route.totalDistanceKm).toBe(1.5);
      expect(route.totalDistanceMeters).toBe(1450);
      expect(route.totalDurationMinutes).toBe(3);
      expect(route.coordinates).toHaveLength(3);
      expect(route.steps.length).toBe(3);
      expect(route.steps[0].instruction).toContain('Parti');
      expect(route.steps[1].instruction).toContain('destra');
    });

    it('restituisce linea geodetica diretta di fallback in caso di mancata risposta del server OSRM', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

      const fallbackRoute = await calculateRealRoute(41.8902, 12.4922, 45.4642, 9.1900, 'driving');
      expect(fallbackRoute).not.toBeNull();
      if (!fallbackRoute) return;

      expect(fallbackRoute.coordinates).toHaveLength(2);
      expect(fallbackRoute.totalDistanceKm).toBeGreaterThan(400); // Roma-Milano ~470km
      expect(fallbackRoute.steps).toHaveLength(2);
      expect(fallbackRoute.steps[0].instruction).toContain('Procedi verso destinazione');
    });

    it('gestisce punti coincidenti con arrivo immediato a 0 metri', async () => {
      const route = await calculateRealRoute(41.8902, 12.4922, 41.8902, 12.4922, 'walking');
      expect(route).not.toBeNull();
      expect(route?.totalDistanceMeters).toBe(0);
      expect(route?.steps[0].instruction).toContain('punto di destinazione');
    });
  });

  describe('Dati Radar RainViewer & Open-Meteo', () => {
    it('getWindDirectionLabel calcola la corretta rosa dei venti in italiano', () => {
      expect(getWindDirectionLabel(0)).toBe('Nord (N)');
      expect(getWindDirectionLabel(90)).toBe('Est (E)');
      expect(getWindDirectionLabel(180)).toBe('Sud (S)');
      expect(getWindDirectionLabel(270)).toBe('Ovest (O)');
    });

    it('getRainViewerRadarData recupera i frame radar Doppler globali', async () => {
      const mockRainViewer = {
        version: 'v2',
        radar: {
          past: [
            { time: 1700000000, path: '/v2/radar/1700000000' },
            { time: 1700000600, path: '/v2/radar/1700000600' },
          ],
          nowcast: [
            { time: 1700001200, path: '/v2/radar/1700001200' },
          ],
        },
        host: 'https://tilecache.rainviewer.com',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockRainViewer,
      } as unknown as Response);

      const radar = await getRainViewerRadarData();
      expect(radar).not.toBeNull();
      expect(radar?.pastFrames).toHaveLength(2);
      expect(radar?.nowcastFrames).toHaveLength(1);
      expect(radar?.host).toBe('https://tilecache.rainviewer.com');
    });

    it('getRealtimeWeather genera dati meteo e fallback coerente', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Open-Meteo unreachable'));

      const weather = await getRealtimeWeather(41.9028, 12.4964);
      expect(weather).toBeDefined();
      expect(weather.temperature).toBeDefined();
      expect(weather.pressure).toBeGreaterThan(950);
      expect(weather.windDirection).toBeDefined();
      expect(weather.units.temperature).toBe('°C');
    });
  });
});
