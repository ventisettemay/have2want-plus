import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateRealRoute } from '../src/lib/routingService';
import { getRealtimeWeather } from '../src/lib/weatherService';

describe('MeteoNavigazioneModal — Meteo Lungo Percorso', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calculateRealRoute calcola percorso OSRM con passi in italiano', async () => {
    const mockOsrm = {
      code: 'Ok',
      routes: [{
        geometry: { coordinates: [[12.5, 41.9], [12.6, 42.0]] },
        distance: 15000,
        duration: 1200,
        legs: [{ steps: [{ maneuver: { type: 'depart' }, name: 'Via Test', distance: 5000, duration: 400 }] }],
      }],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockOsrm,
    } as unknown as Response);

    const route = await calculateRealRoute(41.9, 12.5, 42.0, 12.6, 'driving');
    expect(route).not.toBeNull();
    expect(route?.totalDistanceKm).toBeCloseTo(15, 1);
    expect(route?.totalDurationMinutes).toBeGreaterThan(0);
  });

  it('getRealtimeWeather restituisce null se rete non disponibile', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    const weather = await getRealtimeWeather(41.9, 12.5);
    expect(weather).toBeNull();
  });

  it('getRealtimeWeather decodifica dati Open-Meteo reali', async () => {
    const mockData = {
      timezone: 'Europe/Rome',
      current_units: { temperature_2m: '°C', wind_speed_10m: 'km/h', relative_humidity_2m: '%', precipitation: 'mm', surface_pressure: 'hPa' },
      current: { temperature_2m: 22, relative_humidity_2m: 60, apparent_temperature: 21, is_day: 1, precipitation: 0, weather_code: 1, cloud_cover: 20, wind_speed_10m: 10, wind_direction_10m: 180, surface_pressure: 1014 },
      hourly: { time: ['2026-01-01T10:00'], temperature_2m: [22], precipitation_probability: [10], wind_speed_10m: [10], cloud_cover: [20], weather_code: [1] },
      daily: { time: ['2026-01-01'], temperature_2m_max: [24], temperature_2m_min: [15], precipitation_sum: [0], precipitation_probability_max: [10], wind_speed_10m_max: [15], weather_code: [1] },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as unknown as Response);

    const weather = await getRealtimeWeather(45.0, 7.0);
    expect(weather).not.toBeNull();
    expect(weather?.temperature).toBe(22);
    expect(weather?.windDirection).toBe('Sud (S)');
    expect(weather?.isRealData).toBe(true);
  });
});