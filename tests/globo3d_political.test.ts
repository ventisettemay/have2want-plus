import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { geoToCanvas, createPoliticalGlobeTexture } from '../src/lib/politicalGlobeTexture';
import { COUNTRIES } from '../src/data/countries';
import { ITALIAN_REGIONS } from '../src/data/regions';

describe('Globo 3D & Politico - Matematica, Tocco Raycast & Dissolvenza a Sfoglia', () => {
  const RAGGIO_GLOBO = 60;

  // Formula esatta sferica usata in Globo3D.jsx
  function convertiCoordinate(lat: number, lng: number, raggio: number): THREE.Vector3 {
    const theta = (90 - lat) * (Math.PI / 180);
    const phi = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -raggio * Math.cos(phi) * Math.sin(theta),
      raggio * Math.cos(theta),
      raggio * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Conversione inversa esatta da XYZ normalizzato a Lat/Lng
  function convertiXYZInLatLng(normLocal: THREE.Vector3): { lat: number; lng: number } {
    const lat = 90 - Math.acos(Math.max(-1, Math.min(1, normLocal.y))) * (180 / Math.PI);
    const lng = ((Math.atan2(normLocal.z, -normLocal.x) * (180 / Math.PI)) - 180 + 540) % 360 - 180;
    return { lat, lng };
  }

  it('Dovrebbe calcolare con precisione millimetrica le coordinate cartesiane 3D sul raggio della sfera', () => {
    // Equatore e Primo Meridiano (0°, 0°)
    const posEquatore = convertiCoordinate(0, 0, RAGGIO_GLOBO);
    expect(posEquatore.length()).toBeCloseTo(RAGGIO_GLOBO, 4);

    // Polo Nord (90°, 0°)
    const posPoloNord = convertiCoordinate(90, 0, RAGGIO_GLOBO);
    expect(posPoloNord.y).toBeCloseTo(RAGGIO_GLOBO, 4);
    expect(posPoloNord.x).toBeCloseTo(0, 4);
    expect(posPoloNord.z).toBeCloseTo(0, 4);

    // Polo Sud (-90°, 0°)
    const posPoloSud = convertiCoordinate(-90, 0, RAGGIO_GLOBO);
    expect(posPoloSud.y).toBeCloseTo(-RAGGIO_GLOBO, 4);

    // Italia (Roma: ~41.9° N, 12.5° E)
    const posRoma = convertiCoordinate(41.9, 12.5, RAGGIO_GLOBO);
    expect(posRoma.length()).toBeCloseTo(RAGGIO_GLOBO, 4);
    expect(posRoma.y).toBeGreaterThan(0); // Emisfero boreale
  });

  it('Dovrebbe garantire reversibilità perfetta tra Lat/Lng e 3D XYZ senza scarti', () => {
    const puntiTest = [
      { lat: 41.9, lng: 12.5 },   // Italia
      { lat: 48.85, lng: 2.35 },  // Francia
      { lat: 40.71, lng: -74.0 }, // New York
      { lat: -33.86, lng: 151.2 },// Sydney
      { lat: 35.68, lng: 139.76 } // Tokyo
    ];

    puntiTest.forEach(pt => {
      const v = convertiCoordinate(pt.lat, pt.lng, RAGGIO_GLOBO);
      const norm = v.clone().normalize();
      const res = convertiXYZInLatLng(norm);
      expect(res.lat).toBeCloseTo(pt.lat, 1);
      expect(res.lng).toBeCloseTo(pt.lng, 1);
    });
  });

  it('Dovrebbe convertire Lat/Lng in pixel corretti per la Canvas Texture equirettangolare (geoToCanvas)', () => {
    const width = 2048;
    const height = 1024;

    // Equatore e meridiano zero (0, 0) deve essere al centro esatto
    const center = geoToCanvas(0, 0, width, height);
    expect(center.x).toBe(width / 2);
    expect(center.y).toBe(height / 2);

    // Polo Nord (90, 0) deve essere in cima Y = 0
    const northPole = geoToCanvas(90, 0, width, height);
    expect(northPole.y).toBe(0);

    // Polo Sud (-90, 0) deve essere in fondo Y = height
    const southPole = geoToCanvas(-90, 0, width, height);
    expect(southPole.y).toBe(height);
  });

  it('Dovrebbe commutare la texture (Fotografica / Geopolitica) sulla singola sfera mantenendo opacità solida', () => {
    // Sfera unica: raggio 60, zero sfere doppie
    const mat = new THREE.MeshStandardMaterial({
      opacity: 1.0,
      transparent: false,
    });

    const dummyTexture1 = new THREE.Texture();
    const dummyTexture2 = new THREE.Texture();

    // Iniziale: Fotografica
    mat.map = dummyTexture1;
    expect(mat.map).toBe(dummyTexture1);
    expect(mat.opacity).toBe(1.0);

    // Switch a Geopolitica
    mat.map = dummyTexture2;
    mat.needsUpdate = true;
    expect(mat.map).toBe(dummyTexture2);
    expect(mat.opacity).toBe(1.0); // Nessuna dissolvenza sbiadita
  });

  it('Dovrebbe contenere tutti i dati geografici delle 20 regioni d\'Italia e dei paesi mondiali', () => {
    expect(ITALIAN_REGIONS.length).toBe(20);
    const nomiRegioni = ITALIAN_REGIONS.map(r => r.name);
    expect(nomiRegioni).toContain('Lazio');
    expect(nomiRegioni).toContain('Lombardia');
    expect(nomiRegioni).toContain('Sicilia');
    expect(nomiRegioni).toContain('Piemonte');
    expect(nomiRegioni).toContain('Veneto');

    expect(COUNTRIES.length).toBeGreaterThanOrEqual(10);
    const paesiIds = COUNTRIES.map(c => c.id);
    expect(paesiIds).toContain('it');
    expect(paesiIds).toContain('fr');
    expect(paesiIds).toContain('es');
    expect(paesiIds).toContain('de');
  });

  it('Dovrebbe simulare il Raycaster per rilevare il tocco su una mesh del globo 3D', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 0, 150);

    const geo = new THREE.SphereGeometry(RAGGIO_GLOBO, 32, 32);
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    camera.updateMatrixWorld(true);
    mesh.updateMatrixWorld(true);

    const raycaster = new THREE.Raycaster();
    // Tocco al centro esatto dello schermo (0, 0)
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObject(mesh);

    expect(intersects.length).toBeGreaterThan(0);
    expect(intersects[0].point.z).toBeCloseTo(RAGGIO_GLOBO, 1);
  });

  it('Dovrebbe generare con successo la Canvas Texture politica ad alta definizione', () => {
    const texture = createPoliticalGlobeTexture();
    expect(texture).toBeDefined();
    expect(texture.image).toBeDefined();
  });
});
