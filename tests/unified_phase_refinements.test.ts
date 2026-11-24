import { describe, it, expect } from 'vitest';
import {
  SatelliteId,
  INITIAL_SATELLITES_CATALOG,
  SATELLITE_TO_CHANNEL,
  SATELLITE_TO_COMPONENT,
  resolveSatelliteChannel,
} from '../src/lib/satelliteModularEngine';

describe('Unified Phase Refinements – 11 Satelliti Definitivi', () => {
  it('Catalogo satelliti mantiene 11 voci', () => {
    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(11);
  });

  it('SATELLITE_TO_CHANNEL contiene tutte le voci del type SatelliteId', () => {
    const ids: SatelliteId[] = [
      'KM0_SAT',
      'METEO_SAT',
      'PI_CHAT_SAT',
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
      'BUSINESS_ADS_SAT',
      'MAP_SAT',
      'COMMUNITY_RESCUE_SAT',
      'ACTIONFLOW_SAT',
      'DEFIANCE_PULSE_SAT',
      'RADAR_SAT',
    ];
    for (const id of ids) {
      expect(SATELLITE_TO_CHANNEL[id]).toBeDefined();
      expect(typeof SATELLITE_TO_CHANNEL[id]).toBe('string');
    }
  });

  it('SATELLITE_TO_COMPONENT contiene tutte le voci del type SatelliteId', () => {
    const ids: SatelliteId[] = [
      'KM0_SAT',
      'METEO_SAT',
      'PI_CHAT_SAT',
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
      'BUSINESS_ADS_SAT',
      'MAP_SAT',
      'COMMUNITY_RESCUE_SAT',
      'ACTIONFLOW_SAT',
      'DEFIANCE_PULSE_SAT',
      'RADAR_SAT',
    ];
    for (const id of ids) {
      expect(SATELLITE_TO_COMPONENT[id]).toBeDefined();
      expect(typeof SATELLITE_TO_COMPONENT[id]).toBe('string');
    }
  });

  it('resolveSatelliteChannel restituisce il canale corretto per ogni SatelliteId', () => {
    expect(resolveSatelliteChannel('METEO_SAT')).toBe('WEATHER');
    expect(resolveSatelliteChannel('KM0_SAT')).toBe('KMZERO');
    expect(resolveSatelliteChannel('PI_CHAT_SAT')).toBe('CHAT');
    expect(resolveSatelliteChannel('GLOBAL_MARKET_SAT')).toBe('SUPERMARKET');
    expect(resolveSatelliteChannel('EXTERNAL_MARKET_SAT')).toBe('EXTERNAL');
    expect(resolveSatelliteChannel('BUSINESS_ADS_SAT')).toBe('BUSINESS_ADS');
    expect(resolveSatelliteChannel('MAP_SAT')).toBe('MAP');
    expect(resolveSatelliteChannel('COMMUNITY_RESCUE_SAT')).toBe('EMERGENCY');
    expect(resolveSatelliteChannel('ACTIONFLOW_SAT')).toBe('ACTIONFLOW');
    expect(resolveSatelliteChannel('DEFIANCE_PULSE_SAT')).toBe('DEFIANCE_PULSE');
    expect(resolveSatelliteChannel('RADAR_SAT')).toBe('RADAR');
  });

  it('Non contiene satelliti rimossi: LAVORO_SAT, STREET_360_SAT, CONOSCENZE_MESTIERI_SAT, WEBCAM, METEO_ROUTE', () => {
    const removedIds = [
      'LAVORO_SAT',
      'STREET_360_SAT',
      'CONOSCENZE_MESTIERI_SAT',
      'WEBCAM',
      'METEO_ROUTE',
    ];
    for (const id of removedIds) {
      expect(INITIAL_SATELLITES_CATALOG.find((s) => s.id === id)).toBeUndefined();
      expect(SATELLITE_TO_CHANNEL[id as SatelliteId]).toBeUndefined();
      expect(SATELLITE_TO_COMPONENT[id as SatelliteId]).toBeUndefined();
    }
  });

  it('Nuovi satelliti definitivi sono presenti nel catalogo', () => {
    const newIds = [
      'MAP_SAT',
      'COMMUNITY_RESCUE_SAT',
      'ACTIONFLOW_SAT',
      'DEFIANCE_PULSE_SAT',
      'RADAR_SAT',
    ];
    for (const id of newIds) {
      expect(INITIAL_SATELLITES_CATALOG.find((s) => s.id === id)).toBeDefined();
    }
  });
});