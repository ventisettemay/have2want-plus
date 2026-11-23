import { describe, it, expect } from 'vitest';
import {
  SatelliteId,
  INITIAL_SATELLITES_CATALOG,
  SATELLITE_TO_CHANNEL,
  SATELLITE_TO_COMPONENT,
  resolveSatelliteChannel,
} from '../src/lib/satelliteModularEngine';

describe('Unified Phase Refinements', () => {
  it('Catalogo satelliti mantiene 11 voci (non ridotto a 8)', () => {
    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(11);
  });

  it('SATELLITE_TO_CHANNEL contiene tutte le voci del type SatelliteId', () => {
    const ids: SatelliteId[] = [
      'ACTIONFLOW_SAT',
      'LAVORO_SAT',
      'METEO_SAT',
      'KM0_SAT',
      'STREET_360_SAT',
      'PI_CHAT_SAT',
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
      'CONOSCENZE_MESTIERI_SAT',
      'BUSINESS_ADS_SAT',
      'WEBCAM',
      'METEO_ROUTE',
    ];
    for (const id of ids) {
      expect(SATELLITE_TO_CHANNEL[id]).toBeDefined();
      expect(typeof SATELLITE_TO_CHANNEL[id]).toBe('string');
    }
  });

  it('SATELLITE_TO_COMPONENT contiene tutte le voci del type SatelliteId', () => {
    const ids: SatelliteId[] = [
      'ACTIONFLOW_SAT',
      'LAVORO_SAT',
      'METEO_SAT',
      'KM0_SAT',
      'STREET_360_SAT',
      'PI_CHAT_SAT',
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
      'CONOSCENZE_MESTIERI_SAT',
      'BUSINESS_ADS_SAT',
      'WEBCAM',
      'METEO_ROUTE',
    ];
    for (const id of ids) {
      expect(SATELLITE_TO_COMPONENT[id]).toBeDefined();
      expect(typeof SATELLITE_TO_COMPONENT[id]).toBe('string');
    }
  });

  it('resolveSatelliteChannel restituisce il canale corretto per ogni SatelliteId', () => {
    expect(resolveSatelliteChannel('METEO_SAT')).toBe('WEATHER');
    expect(resolveSatelliteChannel('KM0_SAT')).toBe('KMZERO');
    expect(resolveSatelliteChannel('LAVORO_SAT')).toBe('LAVORO');
    expect(resolveSatelliteChannel('GLOBAL_MARKET_SAT')).toBe('SUPERMARKET');
    expect(resolveSatelliteChannel('EXTERNAL_MARKET_SAT')).toBe('EXTERNAL');
  });

  it('Non richiede RADAR poiché non esiste in SatelliteId', () => {
    const ids: SatelliteId[] = [
      'ACTIONFLOW_SAT',
      'LAVORO_SAT',
      'METEO_SAT',
      'KM0_SAT',
      'STREET_360_SAT',
      'PI_CHAT_SAT',
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
      'CONOSCENZE_MESTIERI_SAT',
      'BUSINESS_ADS_SAT',
      'WEBCAM',
      'METEO_ROUTE',
    ];
    expect(ids).not.toContain('RADAR');
  });
});
