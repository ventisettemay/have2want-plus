// CesiumUrbanoView.jsx — Vista 3D volumetrica reale con CesiumJS 1.147.
// Sostituisce la vista piatta Maplibre con un globo/terreno 3D vero:
// - Cesium World Terrain (rilievo altimetrico reale 3D)
// - OSM Buildings / Photorealistic 3D Tiles (facciate, tetti, volumi edifici)
//   Fallback gratuito a OpenStreetMapImageryProvider se VITE_CESIUM_ION_TOKEN non è impostato.
// - Pin commercianti Pi (Viola / Oro / Doppio Anello)
// - Posizione GPS utente + rotta navigatore con guida vocale opzionale
// - Camera inclinata 45°–60°, rotazione 360° libera (mouse/touch)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CESIUM_BASE_URL = '/cesium/';

// Imposta BASE_URL e Ion Token PRIMA di creare qualsiasi Viewer/primitiva Cesium.
// window.CESIUM_BASE_URL viene letto da Cesium al momento della costruzione del Viewer
// (non si può riassegnare Cesium.BASE_URL su un import namespace: Rollup lo rifiuta).
if (typeof window !== 'undefined') {
  window.CESIUM_BASE_URL = CESIUM_BASE_URL;
}
if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CESIUM_ION_TOKEN) {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
}

/* ------------------------------------------------------------------ */
/* Colori e stili pin commercianti Pi                                */
/* ------------------------------------------------------------------ */
const PIN_COLORS = {
  DOUBLE_RING: { fill: '#7c3aed', stroke: '#ffd700', glyph: '👑', label: 'DOPPIO ANELLO (Accetta Pi + Vetrina)' },
  PI_ACCEPTED: { fill: '#6b21a8', stroke: '#ffd700', glyph: '🪙', label: 'ACCETTA PI NETWORK' },
  AD_ONLY: { fill: '#fbbf24', stroke: '#ffffff', glyph: '📢', label: 'VETRINA PUBBLICITARIA' },
};

/* ------------------------------------------------------------------ */
/* Helper: costruisce il viewer Cesium con terreno e edifici 3D     */
/* ------------------------------------------------------------------ */
function createCesiumViewer(container) {
  const viewer = new Cesium.Viewer(container, {
    baseLayerPicker: false,
    homeButton: false,
    geocoder: false,
    navigationHelpButton: false,
    infoBox: false,
    selectionIndicator: false,
    timeline: false,
    animation: false,
    sceneMode: Cesium.SceneMode.SCENE3D,
    requestRenderMode: true,
    maximumRenderTimeChange: 0,
  });

  // Attiva profondità e illuminazione per volumi realistici
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.globe.enableLighting = true;
  viewer.scene.screenSpaceCameraController.maximumZoomLevel = 20;
  viewer.scene.screenSpaceCameraController.minimumZoomLevel = 1.5;
  viewer.scene.screenSpaceCameraController.enableTilt = true;
  viewer.scene.screenSpaceCameraController.enableRotate = true;
  viewer.scene.screenSpaceCameraController.enableZoom = true;
  viewer.scene.screenSpaceCameraController.enablePan = true;

  // Luce solare per ombre realistiche su facciate e tetti
  viewer.scene.light = new Cesium.DirectionalLight();
  viewer.scene.light.direction = new Cesium.Cartesian3(-0.5, -0.5, -0.8);

  return viewer;
}

/* ------------------------------------------------------------------ */
/* Helper: aggiunge edifici 3D fotorealistici / OSM                  */
/* ------------------------------------------------------------------ */
async function addBuildings3D(viewer) {
  const ionToken = typeof import.meta !== 'undefined' && import.meta.env?.VITE_CESIUM_ION_TOKEN;

  if (ionToken) {
    try {
      // Photorealistic 3D Tiles da Cesium Ion (richiede token)
      const osmBuildings = await Cesium.createOsmBuildingsAsync();
      viewer.scene.primitives.add(osmBuildings);
      return;
    } catch (e) {
      console.warn('Cesium OSM Buildings (Ion) non disponibile:', e.message);
    }
  }

  // Senza token: fallback gratuito a OpenStreetMapImageryProvider (2D, nessun 404)
  try {
    viewer.imageryLayers.addImageryProvider(new Cesium.OpenStreetMapImageryProvider());
  } catch (e) {
    console.warn('OpenStreetMapImageryProvider fallback non disponibile:', e.message);
  }
}

/* ------------------------------------------------------------------ */
/* Componente principale                                               */
/* ------------------------------------------------------------------ */
export default function CesiumUrbanoView({
  centerLat = 41.8902,
  centerLng = 12.4922,
  annunci = [],
  sponsoredBusinesses = [],
  onSelectListing = () => {},
  onBazarSelect = () => {},
  activeRoute = null,
  gpsPosition = null,
  voiceNavigation = false,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef(new Map());
  const routeEntityRef = useRef(null);
  const gpsEntityRef = useRef(null);
  const speechRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Inizializzazione viewer Cesium
  useEffect(() => {
    if (!containerRef.current) return;
    if (viewerRef.current) return;

    try {
      const viewer = createCesiumViewer(containerRef.current);
      viewerRef.current = viewer;

      // Posiziona camera con pitch inclinato (~55°) e rotazione libera
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, 500),
        orientation: {
          heading: Cesium.Math.toRadians(15),
          pitch: Cesium.Math.toRadians(-55),
          roll: 0.0,
        },
      });

      // Terreno 3D reale (World Terrain, API async cesium 1.147)
      Cesium.createWorldTerrainAsync().then((terrainProvider) => {
        viewer.terrainProvider = terrainProvider;
      }).catch((err) => {
        console.warn('World Terrain non disponibile:', err.message);
      });

      // Edifici 3D (OSM Buildings con token, OpenStreetMapImageryProvider senza)
      addBuildings3D(viewer);

      setIsInitialized(true);
    } catch (err) {
      setCameraError(err.message);
      console.error('Cesium inizializzazione fallita:', err);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Ri-posiziona camera quando cambiano le coordinate centro
  useEffect(() => {
    if (!viewerRef.current || !isInitialized) return;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, 500),
      orientation: {
        heading: Cesium.Math.toRadians(15),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0.0,
      },
      duration: 2.0,
    });
  }, [centerLat, centerLng, isInitialized]);

  // Renderizza annunci come pin sulla mappa 3D
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;
    const existing = entitiesRef.current;

    const currentIds = new Set(annunci.map((a) => `ann_${a.id}`));
    existing.forEach((entity, id) => {
      if (id.startsWith('ann_') && !currentIds.has(id)) {
        viewer.entities.remove(entity);
        existing.delete(id);
      }
    });

    annunci.forEach((item) => {
      const entityId = `ann_${item.id}`;
      if (existing.has(entityId)) return;

      const isBook = Boolean(item.isSchoolBook);
      const isVendo = item.intent === 'VENDO' || item.action_type === 'vendo';
      const isBaratto = item.intent === 'BARATTO_SCAMBIO' || item.action_type === 'baratto_scambio';
      const isCerco = item.intent === 'ACQUISTO_CERCO' || item.action_type === 'acquisto_cerco';

      const color = isBook
        ? Cesium.Color.fromBytes(245, 158, 11, 200)
        : isVendo
        ? Cesium.Color.fromBytes(16, 185, 129, 200)
        : isBaratto
        ? Cesium.Color.fromBytes(245, 158, 11, 200)
        : isCerco
        ? Cesium.Color.fromBytes(14, 165, 233, 200)
        : Cesium.Color.fromBytes(16, 185, 129, 200);

      const glyph = isBook ? '📖' : isBaratto ? '🔄' : isCerco ? '🔍' : '●';

      const entity = viewer.entities.add({
        id: entityId,
        position: Cesium.Cartesian3.fromDegrees(item.lng, item.lat),
        billboard: {
          image: glyph,
          font: 'bold 18px sans-serif',
          width: 32,
          height: 32,
          color: color,
        },
        label: {
          text: `${item.title} (${item.price || (item.piPrice ? `${item.piPrice} π` : 'Scambio')})`,
          font: 'bold 12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -40),
          show: false,
        },
        description: item.title,
      });

      entity._onSelectListing = () => {
        onBazarSelect(item.raw || item);
        onSelectListing(item.raw || item);
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(item.lng, item.lat, 300),
          duration: 1.5,
        });
      };

      existing.set(entityId, entity);
    });
  }, [annunci, onSelectListing, onBazarSelect, viewerRef.current, isInitialized]);

  // Renderizza commercianti Pi (Viola / Oro / Doppio Anello)
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;
    const existing = entitiesRef.current;

    const currentIds = new Set(sponsoredBusinesses.map((b) => `biz_${b.id || b.name}`));
    existing.forEach((entity, id) => {
      if (id.startsWith('biz_') && !currentIds.has(id)) {
        viewer.entities.remove(entity);
        existing.delete(id);
      }
    });

    sponsoredBusinesses.forEach((biz, idx) => {
      const bizLat = biz.lat || (centerLat + (idx === 0 ? 0.002 : -0.002) + (Math.sin(idx) * 0.001));
      const bizLng = biz.lng || (centerLng + (idx === 0 ? 0.0025 : -0.0015) + (Math.cos(idx) * 0.001));
      const entityId = `biz_${biz.id || biz.name}`;

      if (existing.has(entityId)) return;

      // Classifica pin
      let pinType = 'AD_ONLY';
      const nameLower = (biz.name || '').toLowerCase();
      const categoryLower = (biz.category || '').toLowerCase();
      if (nameLower.includes('pi') || categoryLower.includes('pi') || biz.acceptsPi) {
        pinType = biz.hasAd ? 'DOUBLE_RING' : 'PI_ACCEPTED';
      } else if (biz.hasAd) {
        pinType = 'AD_ONLY';
      }

      const style = PIN_COLORS[pinType];
      const color = Cesium.Color.fromCssColorString(style.fill).withAlpha(0.85);

      const entity = viewer.entities.add({
        id: entityId,
        position: Cesium.Cartesian3.fromDegrees(bizLng, bizLat),
        billboard: {
          image: style.glyph,
          font: 'bold 20px sans-serif',
          width: 36,
          height: 36,
          color: color,
        },
        label: {
          text: `${style.label}\n${biz.name} • ${biz.promo || biz.category || 'Esercizio Locale'}`,
          font: 'bold 12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -45),
          show: false,
        },
        description: biz.name,
      });

      entity._onSelectBiz = () => {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(bizLng, bizLat, 300),
          duration: 1.5,
        });
      };

      existing.set(entityId, entity);
    });
  }, [sponsoredBusinesses, centerLat, centerLng, viewerRef.current, isInitialized]);

  // Renderizza rotta navigatore
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;

    if (routeEntityRef.current) {
      viewer.entities.remove(routeEntityRef.current);
      routeEntityRef.current = null;
    }

    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) return;

    const positions = activeRoute.coordinates.map((c) =>
      Cesium.Cartesian3.fromDegrees(c[0], c[1], 10)
    );

    routeEntityRef.current = viewer.entities.add({
      polyline: {
        positions: positions,
        width: 8,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Cesium.Color.fromCssColorString('#00ff66').withAlpha(0.9),
        }),
        depthTestAgainstTerrain: true,
      },
    });

    // Guida vocale opzionale
    if (voiceNavigation && window.speechSynthesis) {
      if (speechRef.current) {
        speechRef.current.cancel();
        speechRef.current = null;
      }
      const utterance = new SpeechSynthesisUtterance(
        `Percorso verso ${activeRoute.destinationName}: ${activeRoute.totalDistanceKm} chilometri, ${activeRoute.totalDurationMinutes} minuti stimati. ${activeRoute.steps?.[0]?.instruction || 'Procedi lungo il percorso'}.`
      );
      utterance.lang = 'it-IT';
      utterance.rate = 0.9;
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [activeRoute, voiceNavigation, viewerRef.current]);

  // Renderizza posizione GPS utente
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;

    if (gpsEntityRef.current) {
      viewer.entities.remove(gpsEntityRef.current);
      gpsEntityRef.current = null;
    }

    if (!gpsPosition) return;

    gpsEntityRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(gpsPosition.lng, gpsPosition.lat, 50),
      billboard: {
        image: '📍',
        font: 'bold 24px sans-serif',
        width: 32,
        height: 32,
      },
      label: {
        text: 'Posizione GPS',
        font: 'bold 12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -35),
      },
    });

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(gpsPosition.lng, gpsPosition.lat, 500),
      duration: 2.0,
    });
  }, [gpsPosition, viewerRef.current]);

  // Gestione click su entità per selezionare annunci/commercianti
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    handler.setInputAction((click) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (!pickedObject || !pickedObject.id) return;
      const entity = pickedObject.id;
      if (entity._onSelectListing) entity._onSelectListing();
      else if (entity._onSelectBiz) entity._onSelectBiz();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [viewerRef.current]);

  // Cleanup speech synthesis al unmount
  useEffect(() => {
    return () => {
      if (speechRef.current && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (cameraError) {
    return (
      <div className="absolute inset-0 z-10 bg-black/90 flex flex-col items-center justify-center text-white p-6">
        <h3 className="text-red-400 font-black mb-2">Cesium 3D non disponibile</h3>
        <p className="text-zinc-300 text-center max-w-md">{cameraError}</p>
        <p className="text-xs text-zinc-500 mt-4">
          Assicurati che VITE_CESIUM_ION_TOKEN sia configurato o usa il fallback OpenStreetMap.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-0 bg-[#0b1120] outline-none"
      tabIndex={-1}
      aria-label="Vista 3D volumetrica Cesium"
    />
  );
}
