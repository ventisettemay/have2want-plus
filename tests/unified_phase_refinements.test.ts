import { describe, it, expect } from 'vitest';
import {
  SatelliteId,
  INITIAL_SATELLITES_CATALOG,
  SATELLITE_TO_CHANNEL,
  SATELLITE_TO_COMPONENT,
  resolveSatelliteChannel,
} from '../src/lib/satelliteModularEngine';

describe('Unified Phase Refinements – 11 Satelliti Ufficiali', () => {
  it('Catalogo satelliti mantiene 11 voci', () => {
    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(11);
  });

  it('SATELLITE_TO_CHANNEL contiene tutte le voci del type SatelliteId', () => {
    const ids: SatelliteId[] = [
      'MAP_SAT',
      'METEO_SAT',
      'KM0_SAT',
      'GLOBAL_MARKET_SAT',
      'PI_CHAT_SAT',
      'SOCCORSO_SAT',
      'DEFIANCE_PULSE_SAT',
      'ACTIONFLOW_SAT',
      'EXTERNAL_MARKET_SAT',
      'CREATOR_ADS_SAT',
      'PUBLISH_STORE_SAT',
    ];
    for (const id of ids) {
      expect(SATELLITE_TO_CHANNEL[id]).toBeDefined();
      expect(typeof SATELLITE_TO_CHANNEL[id]).toBe('string');
    }
  });

  it('SATELLITE_TO_COMPONENT contiene tutte le voci del type SatelliteId', () => {
    const ids: SatelliteId[] = [
      'MAP_SAT',
      'METEO_SAT',
      'KM0_SAT',
      'GLOBAL_MARKET_SAT',
      'PI_CHAT_SAT',
      'SOCCORSO_SAT',
      'DEFIANCE_PULSE_SAT',
      'ACTIONFLOW_SAT',
      'EXTERNAL_MARKET_SAT',
      'CREATOR_ADS_SAT',
      'PUBLISH_STORE_SAT',
    ];
    for (const id of ids) {
      expect(SATELLITE_TO_COMPONENT[id]).toBeDefined();
      expect(typeof SATELLITE_TO_COMPONENT[id]).toBe('string');
    }
  });

  it('resolveSatelliteChannel restituisce il canale corretto per ogni SatelliteId', () => {
    expect(resolveSatelliteChannel('MAP_SAT')).toBe('MAP');
    expect(resolveSatelliteChannel('METEO_SAT')).toBe('WEATHER');
    expect(resolveSatelliteChannel('KM0_SAT')).toBe('KMZERO');
    expect(resolveSatelliteChannel('GLOBAL_MARKET_SAT')).toBe('SUPERMARKET');
    expect(resolveSatelliteChannel('PI_CHAT_SAT')).toBe('CHAT');
    expect(resolveSatelliteChannel('SOCCORSO_SAT')).toBe('EMERGENCY');
    expect(resolveSatelliteChannel('DEFIANCE_PULSE_SAT')).toBe('DEFIANCE_PULSE');
    expect(resolveSatelliteChannel('ACTIONFLOW_SAT')).toBe('ACTIONFLOW');
    expect(resolveSatelliteChannel('EXTERNAL_MARKET_SAT')).toBe('EXTERNAL');
    expect(resolveSatelliteChannel('CREATOR_ADS_SAT')).toBe('CREATOR_ADS');
    expect(resolveSatelliteChannel('PUBLISH_STORE_SAT')).toBe('PUBLISH_STORE');
  });

  it('Non contiene satelliti rimossi: RADAR_SAT, BUSINESS_ADS_SAT, LAVORO_SAT, STREET_360_SAT, CONOSCENZE_MESTIERI_SAT, WEBCAM, METEO_ROUTE', () => {
    const removedIds = [
      'RADAR_SAT',
      'BUSINESS_ADS_SAT',
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
      'METEO_SAT',
      'KM0_SAT',
      'GLOBAL_MARKET_SAT',
      'PI_CHAT_SAT',
      'SOCCORSO_SAT',
      'DEFIANCE_PULSE_SAT',
      'ACTIONFLOW_SAT',
      'EXTERNAL_MARKET_SAT',
      'CREATOR_ADS_SAT',
      'PUBLISH_STORE_SAT',
    ];
    for (const id of newIds) {
      expect(INITIAL_SATELLITES_CATALOG.find((s) => s.id === id)).toBeDefined();
    }
  });
});
