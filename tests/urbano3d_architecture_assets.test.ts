import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import {
  TERRARIUM_DEM_SOURCE_CONFIG,
  buildOsmBuildingLayers,
} from '../src/lib/osmBuildingEnhancer';
import {
  MODEL_ASSET_CATALOG,
  detectLodBudget,
  selectLodLevel,
  modelAssetService,
} from '../src/lib/modelAssetService';
import { fetchNearbyLiveWebcams } from '../src/lib/webcamService';
import LiveWebcamsModal from '../src/components/have2want/LiveWebcamsModal';
import Google3DUrbanLayer, {
  getConfiguredGoogleMapsKey,
} from '../src/components/have2want/Google3DUrbanLayer';

describe('Urbano 3D Hybrid Architecture (Option A) – DEM, OSM Buildings, GLB & Webcams', () => {
  it('TERRARIUM_DEM_SOURCE_CONFIG configura Mapzen AWS Terrarium maxzoom 15', () => {
    expect(TERRARIUM_DEM_SOURCE_CONFIG.type).toBe('raster-dem');
    expect(TERRARIUM_DEM_SOURCE_CONFIG.encoding).toBe('terrarium');
    expect(TERRARIUM_DEM_SOURCE_CONFIG.maxzoom).toBe(15);
    expect(TERRARIUM_DEM_SOURCE_CONFIG.tiles[0]).toContain('elevation-tiles-prod');
  });

  it('buildOsmBuildingLayers genera plinth, edifici e tetti con attributi reali OSM per ogni stile', () => {
    const styles = ['vector3d', 'satellite', 'night3d'] as const;
    for (const style of styles) {
      const layers = buildOsmBuildingLayers({ mode: style, showBuildings3D: true });
      const ids = layers.map((l) => l.id);
      expect(ids).toEqual(['3d-buildings-plinth', '3d-buildings', '3d-buildings-roofs']);
      const serialized = JSON.stringify(layers);
      expect(serialized).toContain('building:colour');
      expect(serialized).toContain('building:material');
      expect(serialized).toContain('roof:colour');
      expect(serialized).toContain('roof:shape');
    }
  });

  it('Tutti e 5 gli asset GLB architettonici esistono su disco con header binario glTF valido', () => {
    const expectedFiles = Object.values(MODEL_ASSET_CATALOG);
    expect(expectedFiles).toHaveLength(5);

    for (const entry of expectedFiles) {
      const relative = entry.url.replace(/^\//, '');
      const absPath = path.resolve(process.cwd(), 'public', relative);
      expect(fs.existsSync(absPath)).toBe(true);
      const buf = fs.readFileSync(absPath);
      expect(buf.byteLength).toBeGreaterThan(5000);
      // glTF binary magic header "glTF" (0x67 0x6c 0x54 0x46)
      expect(buf.subarray(0, 4).toString('ascii')).toBe('glTF');
    }
  });

  it('ModelAssetService applica selezione LOD adattiva per distanza e capability dispositivo', () => {
    const budget = detectLodBudget();
    expect(typeof budget.isMobile).toBe('boolean');
    expect(typeof budget.isSoftwareGl).toBe('boolean');
    expect(budget.maxActiveModels).toBeGreaterThan(0);

    const desktopBudget = {
      isMobile: false,
      isSoftwareGl: false,
      maxRadiusMeters: 950,
      maxActiveModels: 48,
      pixelRatioCap: 2,
    };
    expect(selectLodLevel(50, desktopBudget)).toBe('HIGH');
    expect(selectLodLevel(600, desktopBudget)).toBe('MEDIUM');
    expect(selectLodLevel(2000, desktopBudget)).toBe('CULLED');
    expect(Array.isArray(modelAssetService.getCachedKeys())).toBe(true);
  });

  it('fetchNearbyLiveWebcams rifiuta (0,0) e gestisce stato non configurato senza inventare webcam', async () => {
    const invalidRes = await fetchNearbyLiveWebcams(0, 0, 25);
    expect(invalidRes.configured).toBe(false);
    expect(invalidRes.webcams).toEqual([]);

    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          configured: false,
          webcams: [],
          message: 'Chiave server WINDY_WEBCAMS_API_KEY non configurata.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    const res = await fetchNearbyLiveWebcams(41.89, 12.49, 30, mockFetch);
    expect(res.configured).toBe(false);
    expect(res.webcams).toEqual([]);
    expect(res.message).toContain('WINDY_WEBCAMS_API_KEY');
  });

  it('LiveWebcamsModal e Google3DUrbanLayer renderizzano fallback onesti senza chiavi a pagamento', () => {
    expect(getConfiguredGoogleMapsKey()).toBe('');

    const googleHtml = renderToStaticMarkup(
      React.createElement(Google3DUrbanLayer, {
        lat: 41.8902,
        lng: 12.4922,
        cityName: 'Roma',
        onFallbackToOpenData: () => {},
      })
    );
    expect(googleHtml).toContain('Google Photorealistic 3D Tiles');
    expect(googleHtml).toContain('VITE_GOOGLE_MAPS_API_KEY');

    const webcamHtml = renderToStaticMarkup(
      React.createElement(LiveWebcamsModal, {
        isOpen: true,
        onClose: () => {},
        lat: 41.8902,
        lng: 12.4922,
        cityName: 'Roma',
      })
    );
    expect(webcamHtml).toContain('Webcam Live Territoriali');
    expect(webcamHtml).toContain('Windy Webcams API v3');
  });
});
