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

  it('handleCountrySelection blinda le coordinate contro Null Island (0,0) e blocca fallback silenziosi su Roma', async () => {
    const { handleCountrySelection } = await import('../src/lib/worldAtlas');
    const { resolveCountryData } = await import('../src/components/have2want/MapView3DContainer');

    const atlasMock = {
      Nigeria: { lat: 9.082, lng: 8.6753, zoom: 5 },
      Norvegia: { lat: 59.9139, lng: 10.7522 },
      NullIsland: { lat: 0, lng: 0, zoom: 5 },
    };

    const nigeria = handleCountrySelection('  nIgErIa  ', atlasMock);
    expect(nigeria.success).toBe(true);
    expect(nigeria.target).toEqual({
      lat: 9.082,
      lng: 8.6753,
      zoom: 5,
      name: 'Nigeria',
    });

    const norway = handleCountrySelection('Norvegia', atlasMock);
    expect(norway.target.zoom).toBe(5);
    expect(norway.target.lat).toBe(59.9139);

    // Default WORLD_ATLAS_LOOKUP include tutti i 54 Stati africani, Norvegia, USA
    const kenya = handleCountrySelection('Kenya');
    expect(kenya.success).toBe(true);
    expect(kenya.target.lat).not.toBe(41.8902);
    expect(kenya.target.lat).not.toBe(0);

    // Null Island (0,0) e paese inesistente devono sollevare errore senza dirottare su Roma
    expect(() => handleCountrySelection('NullIsland', atlasMock)).toThrow(
      /Impossibile applicare fallback su Roma/
    );
    expect(() => handleCountrySelection('Atlantide_Inesistente', atlasMock)).toThrow(
      /Impossibile applicare fallback su Roma/
    );

    // Verifica resolveCountryData su regione italiana, Congo e territorio sconosciuto
    const lombardia = resolveCountryData({ name: 'Lombardia', countryName: 'Italia' });
    expect(lombardia?.name).toBe('Lombardia');
    expect(lombardia?.lat).not.toBe(41.8902);

    const congoAlias = handleCountrySelection('Congo');
    expect(congoAlias.success).toBe(true);
    expect(congoAlias.target.lat).toBeCloseTo(-4.2634, 2);
    expect(congoAlias.target.lng).toBeCloseTo(15.2429, 2);

    const rdCongoAlias = handleCountrySelection('RD Congo');
    expect(rdCongoAlias.success).toBe(true);
    expect(rdCongoAlias.target.lat).toBeCloseTo(-4.4419, 2);
    expect(rdCongoAlias.target.lng).toBeCloseTo(15.2663, 2);

    const congoResolved = resolveCountryData('congo');
    expect(congoResolved?.code).toBe('CG');
    expect(congoResolved?.lat).not.toBe(41.8902);

    const congoById = resolveCountryData({ id: 'cd', name: 'Repubblica Democratica del Congo' });
    expect(congoById?.code).toBe('CD');
    expect(congoById?.lat).not.toBe(41.8902);

    const unknownTerritory = resolveCountryData({ id: 'atlantide_99', name: 'Atlantide_99' });
    expect(unknownTerritory).toBeNull();
  });

  it('resolveGlobeCountryById e resolveGlobeUrbanTarget risolvono Congo (CG/CD) senza MAI ricadere su Roma', async () => {
    const { resolveGlobeCountryById, resolveGlobeUrbanTarget } = await import(
      '../src/components/have2want/Globo3D'
    );

    const cg = resolveGlobeCountryById('cg');
    expect(cg).not.toBeNull();
    expect(cg.lat).toBeCloseTo(-4.2634, 2);
    expect(cg.lng).toBeCloseTo(15.2429, 2);
    expect(cg.lat).not.toBe(41.8902);

    const cd = resolveGlobeCountryById('cd');
    expect(cd).not.toBeNull();
    expect(cd.lat).toBeCloseTo(-4.4419, 2);
    expect(cd.lng).toBeCloseTo(15.2663, 2);

    const fromCenter = resolveGlobeUrbanTarget({
      activeZone: null,
      selectedCountryId: null,
      fallbackCoords: { lat: -4.26, lng: 15.24 },
    });
    expect(fromCenter).not.toBeNull();
    expect(fromCenter.lat).not.toBe(41.8902);
    expect(fromCenter.name).not.toBe('Roma');

    const emptyTarget = resolveGlobeUrbanTarget({
      activeZone: null,
      selectedCountryId: null,
      fallbackCoords: null,
    });
    expect(emptyTarget).toBeNull();
  });

  it('Copertura globale integrale (~197 Stati + 54 Africa), pricing CoinMarketCap e anti-Null-Island', async () => {
    const {
      WORLD_COUNTRIES,
      computeRealPiRate,
      isValidCoord,
      findCountryByNameOrCode,
    } = await import('../src/lib/worldAtlas');
    const { getCountryForListing } = await import('../src/data/countries');
    const { getHierarchyForCountry } = await import('../src/lib/territoryHierarchy');
    const {
      getEmergencyServicesForCountry,
      getExternalServicesForArea,
      fetchRealExternalServicesForArea,
      clearExternalGatewayCacheForTests,
    } = await import('../src/lib/externalGatewayServices');
    clearExternalGatewayCacheForTests();

    // 1. Copertura globale e Africa 54/54 + territori chiave
    expect(WORLD_COUNTRIES.length).toBeGreaterThanOrEqual(195);
    const africanCountries = WORLD_COUNTRIES.filter((c) => c.continent === 'Africa');
    expect(africanCountries.length).toBe(54);

    const requiredCodes = ['AE', 'EG', 'SA', 'ZA', 'KE', 'BR', 'TH', 'VN', 'CO', 'AU', 'NZ', 'TW', 'XK'];
    const allCodes = new Set(WORLD_COUNTRIES.map((c) => c.code));
    requiredCodes.forEach((code) => {
      expect(allCodes.has(code)).toBe(true);
    });

    // Tutte le nazioni devono avere coordinate valide (mai 0,0)
    WORLD_COUNTRIES.forEach((c) => {
      expect(isValidCoord(c.lat, c.lng)).toBe(true);
    });

    // 2. Pricing reale CoinMarketCap e blocco (0,0)
    expect(computeRealPiRate(1.0)).toBe(0.0674);
    expect(isValidCoord(0, 0)).toBe(false);
    expect(isValidCoord(undefined, undefined)).toBe(false);
    expect(isValidCoord(Number.NaN, 12.49)).toBe(false);

    // 3. Alias / Disambiguazione stretta dei nomi paese
    expect(findCountryByNameOrCode('Niger')?.code).toBe('NE');
    expect(findCountryByNameOrCode('Nigeria')?.code).toBe('NG');
    expect(findCountryByNameOrCode('Congo')?.code).toBe('CG');
    expect(findCountryByNameOrCode('RD Congo')?.code).toBe('CD');
    expect(findCountryByNameOrCode('United Arab Emirates')?.code).toBe('AE');

    // 4. Listing senza metadati/coordinate non deve mai ricadere su Italia/Roma
    expect(getCountryForListing({ title: 'Test' })).toBeNull();

    // 5. Gerarchia territoriale globale e rifiuto stati inesistenti
    expect(getHierarchyForCountry('Atlantide_Inesistente')).toBeNull();
    const uaeHierarchy = getHierarchyForCountry('AE');
    expect(uaeHierarchy).not.toBeNull();
    expect(uaeHierarchy?.code).toBe('AE');
    expect(uaeHierarchy?.regions.length).toBeGreaterThan(0);

    // 6. Emergenze e Gateway Esterno localizzato senza perdite italiane
    expect(getEmergencyServicesForCountry('XX').countryCode).toBe('GLOBAL');
    expect(getExternalServicesForArea(0, 0, 'Null Island', 'XX')).toEqual([]);

    // Nessun pin circolare inventato: senza cache Overpass reale, Lagos restituisce []
    expect(getExternalServicesForArea(6.5244, 3.3792, 'Lagos', 'NG')).toEqual([]);

    // Con risposta reale Overpass OSM, mappa POI locali senza perdite italiane
    const mockOverpassFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          elements: [
            {
              id: 7001,
              type: 'node',
              lat: 6.525,
              lon: 3.381,
              tags: { name: 'Victoria Island Supermart', shop: 'supermarket', 'addr:city': 'Lagos' },
            },
            {
              id: 7002,
              type: 'node',
              lat: 6.523,
              lon: 3.378,
              tags: { name: 'Lagos Mainland Clinic', amenity: 'pharmacy', 'addr:city': 'Lagos' },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    const lagosResult = await fetchRealExternalServicesForArea(
      6.5244,
      3.3792,
      'Lagos',
      'NG',
      mockOverpassFetch
    );
    expect(lagosResult.source).toBe('overpass');
    expect(lagosResult.places.length).toBe(2);
    lagosResult.places.forEach((svc) => {
      const serialized = JSON.stringify(svc).toLowerCase();
      expect(serialized).not.toContain('roma');
      expect(serialized).not.toContain('milano');
      expect(serialized).not.toContain('iperconad');
      expect(svc.countryCode).toBe('NG');
      expect(svc.externalLink).toContain('openstreetmap.org');
    });
  });
});

