import { describe, it, expect, beforeEach } from 'vitest';
import {
  SatelliteId,
  PresetType,
  INITIAL_SATELLITES_CATALOG,
  satelliteEngine,
} from '../src/lib/satelliteModularEngine';
import * as THREE from 'three';
import {
  buildEngineeredSpacecraft,
  createSharedAerospaceMaterials,
} from '../src/components/have2want/spacecraft3D/SpacecraftModelsBuilder';

describe('Satellite Modular Fleet Engine – HAVE2WANT PLUS', () => {
  beforeEach(() => {
    // Reset to all satellites ON
    satelliteEngine.applyPreset('RIPRISTINA_TUTTI');
  });

  it('Dovrebbe contenere esattamente i 10 identificativi satellite ufficiali (8 originali + 2 estensioni VIEW)', () => {
    const EXPECTED_10_IDS: SatelliteId[] = [
      'METEO_SAT',
      'KM0_SAT',
      'STREET_360_SAT',
      'PI_CHAT_SAT',
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
      'COMMUNITY_RESCUE_SAT',
      'BUSINESS_ADS_SAT',
      'WEBCAM',
      'METEO_ROUTE',
    ];

    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(10);
    const catalogIds = INITIAL_SATELLITES_CATALOG.map((s) => s.id);

    EXPECTED_10_IDS.forEach((expectedId) => {
      expect(catalogIds).toContain(expectedId);
    });
  });

  it('Ciascun satellite deve avere parametri fisici e aerospaziali validi (orbita, velocità, inclinazione, modello scientifico)', () => {
    INITIAL_SATELLITES_CATALOG.forEach((sat) => {
      expect(sat.orbitMultiplier).toBeGreaterThan(1.15);
      expect(sat.orbitMultiplier).toBeLessThan(2.0);
      expect(typeof sat.inclination).toBe('number');
      expect(typeof sat.speed).toBe('number');
      expect(sat.speed).toBeGreaterThan(0);
      expect(sat.codeName.length).toBeGreaterThan(3);
      expect(sat.h2wRole.length).toBeGreaterThan(5);
      expect(sat.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('Dovrebbe consentire l\'attivazione e disattivazione (ON/OFF) singola di qualsiasi satellite', () => {
    expect(satelliteEngine.isSatelliteActive('METEO_SAT')).toBe(true);

    // Spegni METEO_SAT
    const nextState1 = satelliteEngine.toggleSatellite('METEO_SAT');
    expect(nextState1).toBe(false);
    expect(satelliteEngine.isSatelliteActive('METEO_SAT')).toBe(false);

    // Gli altri satelliti restano accesi senza interferenze
    expect(satelliteEngine.isSatelliteActive('KM0_SAT')).toBe(true);
    expect(satelliteEngine.isSatelliteActive('PI_CHAT_SAT')).toBe(true);

    // Riaccendi METEO_SAT
    const nextState2 = satelliteEngine.toggleSatellite('METEO_SAT');
    expect(nextState2).toBe(true);
    expect(satelliteEngine.isSatelliteActive('METEO_SAT')).toBe(true);
  });

  it('Dovrebbe applicare correttamente il preset SPEGNI_TUTTI e ACCENDI_TUTTI', () => {
    satelliteEngine.applyPreset('SPEGNI_TUTTI');
    INITIAL_SATELLITES_CATALOG.forEach((sat) => {
      expect(satelliteEngine.isSatelliteActive(sat.id)).toBe(false);
    });
    expect(satelliteEngine.getActiveCount()).toBe(0);

    satelliteEngine.applyPreset('ACCENDI_TUTTI');
    INITIAL_SATELLITES_CATALOG.forEach((sat) => {
      expect(satelliteEngine.isSatelliteActive(sat.id)).toBe(true);
    });
    expect(satelliteEngine.getActiveCount()).toBe(10);
  });

  it('Dovrebbe applicare il preset SOLO_METEO (lasciando acceso solo METEO_SAT)', () => {
    satelliteEngine.applyPreset('SOLO_METEO');
    expect(satelliteEngine.isSatelliteActive('METEO_SAT')).toBe(true);
    expect(satelliteEngine.getActiveCount()).toBe(1);

    const otherSats = INITIAL_SATELLITES_CATALOG.filter((s) => s.id !== 'METEO_SAT');
    otherSats.forEach((s) => {
      expect(satelliteEngine.isSatelliteActive(s.id)).toBe(false);
    });
  });

  it('Dovrebbe applicare il preset SOLO_CHAT (lasciando acceso solo PI_CHAT_SAT)', () => {
    satelliteEngine.applyPreset('SOLO_CHAT');
    expect(satelliteEngine.isSatelliteActive('PI_CHAT_SAT')).toBe(true);
    expect(satelliteEngine.getActiveCount()).toBe(1);

    const otherSats = INITIAL_SATELLITES_CATALOG.filter((s) => s.id !== 'PI_CHAT_SAT');
    otherSats.forEach((s) => {
      expect(satelliteEngine.isSatelliteActive(s.id)).toBe(false);
    });
  });

  it('Dovrebbe applicare il preset KM0_METEO (KM0_SAT + METEO_SAT)', () => {
    satelliteEngine.applyPreset('KM0_METEO');
    expect(satelliteEngine.isSatelliteActive('KM0_SAT')).toBe(true);
    expect(satelliteEngine.isSatelliteActive('METEO_SAT')).toBe(true);
    expect(satelliteEngine.getActiveCount()).toBe(2);

    expect(satelliteEngine.isSatelliteActive('GLOBAL_MARKET_SAT')).toBe(false);
    expect(satelliteEngine.isSatelliteActive('BUSINESS_ADS_SAT')).toBe(false);
  });

  it('Dovrebbe applicare il preset SOLO_MERCATI (2 satelliti commerciali)', () => {
    satelliteEngine.applyPreset('SOLO_MERCATI');
    const expectedActive: SatelliteId[] = [
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
    ];

    expectedActive.forEach((id) => {
      expect(satelliteEngine.isSatelliteActive(id)).toBe(true);
    });
    expect(satelliteEngine.getActiveCount()).toBe(2);

    expect(satelliteEngine.isSatelliteActive('METEO_SAT')).toBe(false);
    expect(satelliteEngine.isSatelliteActive('COMMUNITY_RESCUE_SAT')).toBe(false);
  });

  it('Dovrebbe applicare il preset SOLO_TERRITORIO (5 satelliti di prossimità e navigazione)', () => {
    satelliteEngine.applyPreset('SOLO_TERRITORIO');
    const expectedTerritory: SatelliteId[] = [
      'KM0_SAT',
      'STREET_360_SAT',
      'BUSINESS_ADS_SAT',
      'WEBCAM',
      'METEO_ROUTE',
    ];

    expectedTerritory.forEach((id) => {
      expect(satelliteEngine.isSatelliteActive(id)).toBe(true);
    });
    expect(satelliteEngine.getActiveCount()).toBe(5);

    expect(satelliteEngine.isSatelliteActive('GLOBAL_MARKET_SAT')).toBe(false);
  });

  it('Dovrebbe notificare i listener registrati e pulire le sottoscrizioni (zero memory leak)', () => {
    let notifiedStates: Record<SatelliteId, boolean> | null = null;
    let callCount = 0;

    const unsubscribe = satelliteEngine.subscribe((states) => {
      notifiedStates = states;
      callCount++;
    });

    // Iniziale subscription trigger
    expect(callCount).toBe(1);

    // Cambia stato
    satelliteEngine.toggleSatellite('COMMUNITY_RESCUE_SAT');
    expect(callCount).toBe(2);
    expect(notifiedStates!['COMMUNITY_RESCUE_SAT']).toBe(false);

    // Disiscrizione
    unsubscribe();
    satelliteEngine.toggleSatellite('COMMUNITY_RESCUE_SAT');
    // Non deve essere più chiamato
    expect(callCount).toBe(2);
  });

  it('SpacecraftModelsBuilder deve creare modelli 3D Three.js validi con geometrie, materiali e metadati cliccabili', () => {
    const sharedMaterials = createSharedAerospaceMaterials();
    const fakeTextureLoader = {
      load: () => new THREE.Texture(),
    };

    INITIAL_SATELLITES_CATALOG.forEach((sat) => {
      const craft = buildEngineeredSpacecraft(sat, sharedMaterials, fakeTextureLoader);

      expect(craft.craftGroup).toBeInstanceOf(THREE.Group);
      expect(craft.craftGroup.children.length).toBeGreaterThan(0);
      expect(craft.clickables.length).toBeGreaterThan(0);

      // Verifica metadati di interazione raycasting
      craft.clickables.forEach((mesh) => {
        expect(mesh.userData.isSatellite).toBe(true);
        expect(mesh.userData.satelliteId).toBe(sat.id);
        expect(mesh.userData.name).toContain(sat.name);
        expect(mesh.userData.description).toBe(sat.h2wRole);
      });
    });
  });
});
