import { describe, it, expect } from 'vitest';
import {
  buildEngineeredSpacecraft,
  createSharedAerospaceMaterials,
  getSatelliteLightMode,
} from '../src/components/have2want/spacecraft3D/SpacecraftModelsBuilder';
import { INITIAL_SATELLITES_CATALOG } from '../src/lib/satelliteModularEngine';

describe('Satellite Light Modes, Scale 0.50 & Specs – 11 Satelliti Definitivi', () => {
  it('Differenzia correttamente le luci dei satelliti (BLINKING, NORMAL, BRIGHT)', () => {
    expect(getSatelliteLightMode('METEO_SAT')).toBe('BLINKING');
    expect(getSatelliteLightMode('MAP_SAT')).toBe('BLINKING');
    expect(getSatelliteLightMode('RADAR_SAT')).toBe('BLINKING');
    expect(getSatelliteLightMode('EXTERNAL_MARKET_SAT')).toBe('NORMAL');
    expect(getSatelliteLightMode('KM0_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('GLOBAL_MARKET_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('BUSINESS_ADS_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('PI_CHAT_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('COMMUNITY_RESCUE_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('ACTIONFLOW_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('DEFIANCE_PULSE_SAT')).toBe('BRIGHT');
  });

  it('Costruisce tutti gli 11 satelliti con scala 0.50 e strobeBeacons solo per BLINKING', () => {
    const mats = createSharedAerospaceMaterials();
    for (const sat of INITIAL_SATELLITES_CATALOG) {
      const built = buildEngineeredSpacecraft(sat, mats);
      expect(built.craftGroup.scale.x).toBeCloseTo(0.5, 4);
      expect(built.craftGroup.scale.y).toBeCloseTo(0.5, 4);
      expect(built.craftGroup.scale.z).toBeCloseTo(0.5, 4);

      if (sat.id === 'METEO_SAT' || sat.id === 'MAP_SAT' || sat.id === 'RADAR_SAT') {
        expect(built.lightMode).toBe('BLINKING');
        expect(built.strobeBeacons?.length).toBe(2);
      } else if (sat.id === 'EXTERNAL_MARKET_SAT') {
        expect(built.lightMode).toBe('NORMAL');
        expect(built.strobeBeacons?.length).toBe(0);
      } else {
        expect(built.lightMode).toBe('BRIGHT');
        expect(built.strobeBeacons?.length).toBe(0);
      }
    }
  });

  it('Catalogo contiene esattamente 11 satelliti', () => {
    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(11);
  });

  it('Satelliti rimossi non sono più nel catalogo', () => {
    const removedIds = [
      'LAVORO_SAT',
      'STREET_360_SAT',
      'CONOSCENZE_MESTIERI_SAT',
      'WEBCAM',
      'METEO_ROUTE',
    ];
    for (const id of removedIds) {
      expect(INITIAL_SATELLITES_CATALOG.find((s) => s.id === id)).toBeUndefined();
    }
  });

  it('Nuovi satelliti definitivi hanno lightMode corretto', () => {
    // MAP_SAT = BLINKING (unisce STREET_360_SAT + WEBCAM + METEO_ROUTE)
    expect(getSatelliteLightMode('MAP_SAT')).toBe('BLINKING');
    // COMMUNITY_RESCUE_SAT = BRIGHT (emergenza = alta visibilità)
    expect(getSatelliteLightMode('COMMUNITY_RESCUE_SAT')).toBe('BRIGHT');
    // ACTIONFLOW_SAT = BRIGHT (hub operativo)
    expect(getSatelliteLightMode('ACTIONFLOW_SAT')).toBe('BRIGHT');
    // DEFIANCE_PULSE_SAT = BRIGHT (multimedia AI)
    expect(getSatelliteLightMode('DEFIANCE_PULSE_SAT')).toBe('BRIGHT');
    // RADAR_SAT = BLINKING (scansione radar attiva)
    expect(getSatelliteLightMode('RADAR_SAT')).toBe('BLINKING');
  });
});