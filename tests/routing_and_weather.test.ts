import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateRealRoute,
  calculateRealRoutes,
  distanceToRouteMeters,
  type RealRouteResult,
} from '../src/lib/routingService';
import {
  getRealtimeWeather,
  getRainViewerRadarData,
  getWindDirectionLabel,
  getRouteWeatherForecast,
} from '../src/lib/weatherService';

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

    it('restituisce null se OSRM non risponde (nessuna linea retta spacciata per percorso)', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

      const fallbackRoute = await calculateRealRoute(41.8902, 12.4922, 45.4642, 9.1900, 'driving');
      expect(fallbackRoute).toBeNull();
    });

    it('supporta rotte alternative OSRM e profilo bici (cycling)', async () => {
      const mockAlternativesResponse = {
        code: 'Ok',
        routes: [
          {
            geometry: {
              coordinates: [
                [7.6869, 45.0703],
                [7.6900, 45.0750],
              ],
            },
            distance: 900,
            duration: 210,
            legs: [{ steps: [{ maneuver: { type: 'depart' }, name: 'Corso Vittorio', distance: 900, duration: 210 }] }],
          },
          {
            geometry: {
              coordinates: [
                [7.6869, 45.0703],
                [7.6920, 45.0750],
              ],
            },
            distance: 1150,
            duration: 250,
            legs: [{ steps: [{ maneuver: { type: 'depart' }, name: 'Via Po', distance: 1150, duration: 250 }] }],
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlternativesResponse,
      } as unknown as Response);

      const routes = await calculateRealRoutes(45.0703, 7.6869, 45.0750, 7.6900, 'cycling', true);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/route/v1/cycling/'), expect.anything());
      expect(routes).toHaveLength(2);
      expect(routes[0].totalDistanceMeters).toBe(900);
      expect(routes[1].totalDistanceMeters).toBe(1150);
    });

    it('calcola correttamente la distanza dalla rotta per il ricalcolo GPS off-route', () => {
      const polyline: [number, number][] = [
        [12.4922, 41.8902],
        [12.4940, 41.8902],
      ];
      expect(distanceToRouteMeters(41.8902, 12.4931, polyline)).toBeLessThan(10);
      expect(distanceToRouteMeters(41.8915, 12.4931, polyline)).toBeGreaterThan(55);
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

    it('getRealtimeWeather restituisce null se Open-Meteo non risponde (zero dati meteo inventati)', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Open-Meteo unreachable'));

      const weather = await getRealtimeWeather(41.9028, 12.4964);
      expect(weather).toBeNull();
    });

    it('getRouteWeatherForecast interroga Open-Meteo lungo partenza, punto intermedio e arrivo', async () => {
      const mockWeatherPayload = (temp: number) => ({
        timezone: 'Europe/Rome',
        current: {
          temperature_2m: temp,
          relative_humidity_2m: 60,
          apparent_temperature: temp,
          is_day: 1,
          precipitation: 0,
          weather_code: 1,
          cloud_cover: 20,
          surface_pressure: 1015,
          wind_speed_10m: 8,
          wind_direction_10m: 180,
          wind_gusts_10m: 12,
        },
        hourly: {
          time: ['2026-01-01T10:00'],
          temperature_2m: [temp],
          precipitation_probability: [10],
          precipitation: [0],
          weather_code: [1],
          wind_speed_10m: [8],
          visibility: [10000],
        },
        daily: {
          time: ['2026-01-01'],
          weather_code: [1],
          temperature_2m_max: [temp + 2],
          temperature_2m_min: [temp - 4],
          precipitation_sum: [0],
        },
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [
          mockWeatherPayload(14),
          mockWeatherPayload(16),
          mockWeatherPayload(18),
        ],
      } as unknown as Response);

      const routeForecast = await getRouteWeatherForecast([
        [7.68, 45.07],
        [9.19, 45.46],
        [12.49, 41.89],
      ]);

      expect(routeForecast.points).toHaveLength(3);
      expect(routeForecast.points[0].label).toBe('Partenza');
      expect(routeForecast.points[0].temp).toBe(14);
      expect(routeForecast.points[1].label).toBe('Metà percorso');
      expect(routeForecast.points[1].temp).toBe(16);
      expect(routeForecast.points[2].label).toBe('Arrivo');
      expect(routeForecast.points[2].temp).toBe(18);
    });
  });
});
