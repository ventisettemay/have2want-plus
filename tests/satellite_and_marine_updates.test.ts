import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import {
  buildEngineeredSpacecraft,
  createSharedAerospaceMaterials,
  getSatelliteLightMode,
} from '../src/components/have2want/spacecraft3D/SpacecraftModelsBuilder';
import { INITIAL_SATELLITES_CATALOG } from '../src/lib/satelliteModularEngine';

describe('Satellite Light Modes, Scale 0.50 & Specs', () => {
  it('Differenzia correttamente le luci dei 10 satelliti (BLINKING, NORMAL, BRIGHT)', () => {
    expect(getSatelliteLightMode('METEO_SAT')).toBe('BLINKING');
    expect(getSatelliteLightMode('EXTERNAL_MARKET_SAT')).toBe('NORMAL');
    expect(getSatelliteLightMode('KM0_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('GLOBAL_MARKET_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('BUSINESS_ADS_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('PI_CHAT_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('COMMUNITY_RESCUE_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('ACTIONFLOW_SAT')).toBe('BRIGHT');
    expect(getSatelliteLightMode('DEFIANCE_PULSE_SAT')).toBe('BRIGHT');
  });

  it('Costruisce tutti i 10 satelliti con scala 0.50, billboard Sprite badge, hitbox ampliata e strobeBeacons solo per BLINKING', () => {
    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(10);
    const mats = createSharedAerospaceMaterials();
    for (const sat of INITIAL_SATELLITES_CATALOG) {
      const built = buildEngineeredSpacecraft(sat, mats);
      expect(built.craftGroup.scale.x).toBeCloseTo(0.5, 4);
      expect(built.craftGroup.scale.y).toBeCloseTo(0.5, 4);
      expect(built.craftGroup.scale.z).toBeCloseTo(0.5, 4);

      expect(built.badgeSprite).toBeInstanceOf(THREE.Sprite);
      expect(built.badgeSprite!.position.y).toBeGreaterThan(8);
      expect(built.badgeSprite!.userData.isSatellite).toBe(true);
      expect(built.badgeSprite!.userData.satelliteId).toBe(sat.id);

      const hitSpheres = built.clickables.filter(
        (obj) =>
          obj instanceof THREE.Mesh &&
          obj.geometry instanceof THREE.SphereGeometry &&
          (obj.geometry.parameters?.radius ?? 0) >= 17
      );
      expect(hitSpheres.length).toBeGreaterThanOrEqual(1);

      if (sat.id === 'METEO_SAT') {
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

  it('Globo3D apre i satelliti al tocco diretto senza legenda meteo e rimuove SATELLITES_CONFIG; App.jsx nasconde la barra rotante in URBANO_3D', () => {
    const globoSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/have2want/Globo3D.jsx'),
      'utf8'
    );
    expect(globoSrc).not.toContain('showWeatherLegend');
    expect(globoSrc).not.toContain('SATELLITES_CONFIG');
    expect(globoSrc).toContain('flyToSatellite(satId, true)');
    expect(globoSrc).toContain('isGlobeToolsOpen');

    const appSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/App.jsx'), 'utf8');
    expect(appSrc).not.toContain('CraftMemoryModal');
    expect(appSrc).toContain("viewMode === 'URBANO_3D'");
    const removedButtonIds = [
      'btn-scroll-channel-km0',
      'btn-scroll-channel-meteo',
      'btn-scroll-channel-map',
      'btn-scroll-channel-marketplace',
      'btn-scroll-channel-lavoro',
      'btn-scroll-channel-emergency',
      'btn-scroll-botteghe',
      'btn-scroll-channel-actionflow',
      'btn-scroll-channel-defiance-pulse',
      'btn-scroll-tutor',
      'btn-nav-global-market',
      'btn-open-ad-modal',
      'btn-open-voice-chat',
    ];
    for (const id of removedButtonIds) {
      expect(appSrc).not.toContain(`id="${id}"`);
    }

    const urbanoSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/have2want/Urbano3D.jsx'),
      'utf8'
    );
    expect(urbanoSrc).toContain('showRoutePlanner');
    expect(urbanoSrc).toContain('isUrbanToolsOpen');

    const hubSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/have2want/OrbitalSatellitesHub.tsx'),
      'utf8'
    );
    expect(hubSrc).not.toContain('VetrinaKmZero');
    expect(hubSrc).not.toContain('GlobalMarketplaceView');

    const typesSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/types.ts'), 'utf8');
    expect(typesSrc).not.toContain('SATELLITE_ORBIT_CONFIG');
    expect(typesSrc).not.toContain('SatelliteType');

    expect(
      fs.existsSync(path.resolve(process.cwd(), 'src/components/have2want/CraftMemoryModal.tsx'))
    ).toBe(false);
    expect(
      fs.existsSync(path.resolve(process.cwd(), 'src/data/craftMemoryGuides.ts'))
    ).toBe(false);
  });
});
