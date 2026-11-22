import { describe, it, expect } from 'vitest';
import {
  buildEngineeredSpacecraft,
  createSharedAerospaceMaterials,
  getSatelliteLightMode,
} from '../src/components/have2want/spacecraft3D/SpacecraftModelsBuilder';
import { INITIAL_SATELLITES_CATALOG } from '../src/lib/satelliteModularEngine';

describe('Satellite Light Modes, Scale 0.50 & Specs', () => {
  it('Differenzia correttamente le luci dei satelliti (BLINKING, NORMAL, BRIGHT)', () => {
    expect(getSatelliteLightMode('METEO_SAT')).toBe('BLINKING');
    expect(getSatelliteLightMode('STREET_360_SAT')).toBe('BLINKING');
    expect(getSatelliteLightMode('EXTERNAL_MARKET_SAT')).toBe('NORMAL');
    expect(getSatelliteLightMode('KM0_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('GLOBAL_MARKET_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('BUSINESS_ADS_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('PI_CHAT_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('CONOSCENZE_MESTIERI_SAT')).toBe('BRIGHT');
  });

  it('Costruisce tutti gli 8 satelliti con scala 0.50 e strobeBeacons solo per BLINKING', () => {
    const mats = createSharedAerospaceMaterials();
    for (const sat of INITIAL_SATELLITES_CATALOG) {
      const built = buildEngineeredSpacecraft(sat, mats);
      expect(built.craftGroup.scale.x).toBeCloseTo(0.5, 4);
      expect(built.craftGroup.scale.y).toBeCloseTo(0.5, 4);
      expect(built.craftGroup.scale.z).toBeCloseTo(0.5, 4);

      if (sat.id === 'METEO_SAT' || sat.id === 'STREET_360_SAT') {
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
});
