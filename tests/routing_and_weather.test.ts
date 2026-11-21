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

    it('getRealtimeWeather restituisce null quando la rete non è disponibile (nessun dato simulato)', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Open-Meteo unreachable'));

      const weather = await getRealtimeWeather(41.9028, 12.4964);
      expect(weather).toBeNull();
    });

    it('getRealtimeWeather decodifica i dati reali restituiti da Open-Meteo', async () => {
      const mockOpenMeteo = {
        timezone: 'Europe/Rome',
        current_units: {
          temperature_2m: '°C',
          wind_speed_10m: 'km/h',
          relative_humidity_2m: '%',
          precipitation: 'mm',
          surface_pressure: 'hPa',
        },
        current: {
          temperature_2m: 23.4,
          relative_humidity_2m: 61,
          apparent_temperature: 24.1,
          is_day: 1,
          precipitation: 0,
          rain: 0,
          showers: 0,
          snowfall: 0,
          weather_code: 1,
          cloud_cover: 22,
          wind_speed_10m: 11,
          wind_direction_10m: 180,
          surface_pressure: 1014.2,
        },
        hourly: {
          time: ['2026-11-21T10:00', '2026-11-21T11:00'],
          temperature_2m: [22.5, 23.0],
          precipitation_probability: [10, 20],
          wind_speed_10m: [9, 12],
          cloud_cover: [20, 25],
          weather_code: [1, 2],
        },
        daily: {
          time: ['2026-11-21', '2026-11-22'],
          temperature_2m_max: [24, 22],
          temperature_2m_min: [14, 13],
          precipitation_sum: [0, 2],
          precipitation_probability_max: [10, 40],
          wind_speed_10m_max: [15, 18],
          weather_code: [1, 3],
        },
      };

      // Coordinate diverse per non usare la cache del test precedente
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpenMeteo,
      } as unknown as Response);

      const weather = await getRealtimeWeather(45.0, 7.0);
      expect(weather).not.toBeNull();
      expect(weather?.temperature).toBe(23);
      expect(weather?.pressure).toBe(1014);
      expect(weather?.windDirection).toBe('Sud (S)');
      expect(weather?.units.temperature).toBe('°C');
      expect(weather?.isRealData).toBe(true);
      expect(weather?.hourlyForecast).toHaveLength(2);
      expect(weather?.dailyForecast).toHaveLength(2);
      expect(weather?.dataSource).toContain('ECMWF');
    });
  });
});
