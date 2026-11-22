// BUILDER 3D DEI 14 VEICOLI SPAZIALI INGEGNERISTICI – HAVE2WANT PLUS
// Ciascun modello è ispirato a vere missioni spaziali (Meteosat, Sentinel, Starlink,
// WorldView, Iridium, Telstar, NOAA, Inmarsat, Terra/Aqua, SES, OneWeb, Cospas-Sarsat, Intelsat)
// con geometrie metalliche PBR ad alta fedeltà, pannelli solari fotovoltaici, parabole,
// sensori ottici, radar C-SAR e propulsori al plasma.
// Geometrie e materiali condivisi per 60 FPS fluidi su Pi Browser, Mobile e Desktop.

import * as THREE from 'three';
import { SatelliteConfig, SatelliteId } from '@/lib/satelliteModularEngine';

export type SatelliteLightMode = 'BLINKING' | 'NORMAL' | 'BRIGHT';

export function getSatelliteLightMode(id: SatelliteId): SatelliteLightMode {
  if (id === 'METEO_SAT' || id === 'STREET_360_SAT') return 'BLINKING';
  if (id === 'EXTERNAL_MARKET_SAT') return 'NORMAL';
  return 'BRIGHT';
}

export interface SpacecraftRenderInstance {
  config: SatelliteConfig;
  craftGroup: THREE.Group;
  orbitLine: THREE.LineLoop;
  clickables: THREE.Object3D[];
  leftBeacon?: THREE.Mesh;
  rightBeacon?: THREE.Mesh;
  strobeBeacons?: THREE.Mesh[];
  radarPulse?: THREE.Mesh;
  lightMode: SatelliteLightMode;
  angle: number;
  orbitRadius: number;
}

export interface SpacecraftBuildResult {
  group: THREE.Group;
  craftGroup: THREE.Group;
  clickables: THREE.Object3D[];
  leftBeacon?: THREE.Mesh;
  rightBeacon?: THREE.Mesh;
  strobeBeacons?: THREE.Mesh[];
  radarPulse?: THREE.Mesh;
  lightMode: SatelliteLightMode;
}

// Generatore procedurale di texture fotovoltaica ad alta definizione con celle e busbars
function createSolarCellCanvasTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#061126';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 8;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      ctx.fillStyle = '#0b2046';
      ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

      if (typeof ctx.beginPath === 'function') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1;
        for (let l = 6; l < cellH - 4; l += 5) {
          ctx.beginPath();
          ctx.moveTo(x + 3, y + l);
          ctx.lineTo(x + cellW - 5, y + l);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(241, 245, 249, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + cellW / 3, y + 2);
        ctx.lineTo(x + cellW / 3, y + cellH - 2);
        ctx.moveTo(x + (cellW * 2) / 3, y + 2);
        ctx.lineTo(x + (cellW * 2) / 3, y + cellH - 2);
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Generatore procedurale di normal map delle pieghe termiche MLI (Kapton / Mylar)
function createMliNormalTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, 256, 256);

  if (typeof ctx.beginPath === 'function') {
    ctx.strokeStyle = 'rgba(175, 145, 255, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 35; i++) {
      const x0 = (i * 31) % 256;
      const y0 = (i * 47) % 256;
      const x1 = (x0 + (i % 2 === 0 ? 30 : -30)) % 256;
      const y1 = (y0 + 40) % 256;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// Materiali PBR aerospaziali condivisi per massime prestazioni senza sprechi GPU
export function createSharedAerospaceMaterials() {
  const solarTexture = createSolarCellCanvasTexture();
  const mliNormal = createMliNormalTexture();

  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.94,
    roughness: 0.22,
    emissive: 0x241502,
    emissiveIntensity: 0.15,
    ...(mliNormal ? { normalMap: mliNormal, normalScale: new THREE.Vector2(0.35, 0.35) } : {}),
  });

  const silverFoilMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.25,
    ...(mliNormal ? { normalMap: mliNormal, normalScale: new THREE.Vector2(0.25, 0.25) } : {}),
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.88,
    roughness: 0.32,
  });

  const carbonFiberMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.35,
    roughness: 0.70,
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    color: 0x0d2146,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.35,
    metalness: 0.88,
    roughness: 0.16,
    ...(solarTexture ? { map: solarTexture } : {}),
  });

  const rescueRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.70,
    roughness: 0.30,
    emissive: 0x991b1b,
    emissiveIntensity: 0.25,
  });

  const whiteRadiatorMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.20,
    roughness: 0.35,
  });

  const amberAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.75,
    roughness: 0.25,
    emissive: 0x7c4d06,
    emissiveIntensity: 0.3,
  });

  const dishMeshMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.92,
    roughness: 0.20,
    side: THREE.DoubleSide,
  });

  const ionPlasmaMat = new THREE.MeshStandardMaterial({
    color: 0x00f5ff,
    emissive: 0x00f5ff,
    emissiveIntensity: 1.6,
    roughness: 0.1,
  });

  return {
    goldFoilMat,
    silverFoilMat,
    titaniumMat,
    carbonFiberMat,
    solarCellMat,
    rescueRedMat,
    whiteRadiatorMat,
    amberAccentMat,
    dishMeshMat,
    ionPlasmaMat,
  };
}

// Crea la targhetta scientifica aerospaziale con identificativo e funzione
export function createCraftBadge(codeName: string, h2wName: string, colorHex: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, 1024, 240);
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(6, 6, 1012, 228);

    // Titolo Missione Spaziale
    ctx.fillStyle = colorHex;
    ctx.font = '900 62px "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🛰️ ${codeName.toUpperCase()}`, 512, 85);

    // Canale Have2Want
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 80px "Inter", -apple-system, sans-serif';
    ctx.fillText(h2wName.toUpperCase(), 512, 185);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, depthTest: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 2.1), mat);
  mesh.position.set(0, -4.8, 0);
  return mesh;
}

// Costruzione geometrica ingegneristica per ciascuno dei 14 veicoli spaziali
export function buildEngineeredSpacecraft(
  sat: SatelliteConfig,
  materials: ReturnType<typeof createSharedAerospaceMaterials>,
  _textureLoader?: any
): SpacecraftBuildResult {
  const group = new THREE.Group();
  const clickables: THREE.Object3D[] = [];
  const {
    goldFoilMat,
    silverFoilMat,
    titaniumMat,
    carbonFiberMat,
    solarCellMat,
    rescueRedMat,
    whiteRadiatorMat,
    amberAccentMat,
    dishMeshMat,
    ionPlasmaMat,
  } = materials;

  const lightMode = getSatelliteLightMode(sat.id);
  const neonEmissiveIntensity =
    lightMode === 'BRIGHT' ? 2.2 : lightMode === 'BLINKING' ? 1.5 : 0.35;

  const neonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(sat.color),
    emissive: new THREE.Color(sat.color),
    emissiveIntensity: neonEmissiveIntensity,
    roughness: 0.1,
  });

  let leftBeaconPos = new THREE.Vector3(-6, 0, 0);
  let rightBeaconPos = new THREE.Vector3(6, 0, 0);

  switch (sat.id) {
    // -------------------------------------------------------------------------
    // 1. METEO_SAT: METEOSAT THIRD GENERATION (MTG) – Osservatorio Meteo GEO
    // -------------------------------------------------------------------------
    case 'METEO_SAT': {
      // Chassis centrale cubico con radiatori termici nord/sud e lamina d'oro nadir
      const bus = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.8, 4.6), whiteRadiatorMat);
      const goldDeck = new THREE.Mesh(new THREE.BoxGeometry(3.9, 3.9, 0.4), goldFoilMat);
      goldDeck.position.set(0, 0, 2.3);
      group.add(bus, goldDeck);
      clickables.push(bus, goldDeck);

      // Strumento FCI (Flexible Combined Imager): barilotto telescopico con cono ottico rivolto alla Terra
      const fciBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.2, 24), titaniumMat);
      fciBase.rotation.x = Math.PI / 2;
      fciBase.position.set(0, 0, 3.0);
      const fciHood = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 2.0, 24, 1, true), carbonFiberMat);
      fciHood.rotation.x = Math.PI / 2;
      fciHood.position.set(0, 0, 4.2);
      const fciLens = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), neonMat);
      fciLens.position.set(0, 0, 4.2);
      group.add(fciBase, fciHood, fciLens);
      clickables.push(fciBase, fciHood, fciLens);

      // Sensore Lightning Imager (LI) secondario
      const liSensor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.4), carbonFiberMat);
      liSensor.position.set(1.4, -1.4, 2.8);
      group.add(liSensor);
      clickables.push(liSensor);

      // Singola ala fotovoltaica asimmetrica a 6 segmenti (design MTG autentico)
      const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.6, 8), titaniumMat);
      yoke.rotation.z = Math.PI / 2;
      yoke.position.set(-2.8, 0, 0);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.2, 0.22), solarCellMat);
      wing.position.set(-7.5, 0, 0);
      group.add(yoke, wing);
      clickables.push(wing);

      // Vela solare di controbilanciamento sul lato opposto (solar sail boom)
      const sailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 8), titaniumMat);
      sailBoom.rotation.z = Math.PI / 2;
      sailBoom.position.set(3.8, 0, 0);
      const sailFin = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 4), goldFoilMat);
      sailFin.rotation.z = -Math.PI / 2;
      sailFin.position.set(6.2, 0, 0);
      group.add(sailBoom, sailFin);
      clickables.push(sailBoom, sailFin);

      // Parabole di telemetria Ka-band & antenna SAR
      const dish = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), dishMeshMat);
      dish.rotation.x = Math.PI;
      dish.position.set(1.4, 1.4, 2.6);
      group.add(dish);
      clickables.push(dish);

      leftBeaconPos.set(-11.5, 0, 0);
      rightBeaconPos.set(6.8, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // 2. KM0_SAT: COPERNICUS SENTINEL-2 (ESA) – Multispettrale Agricolo & Suolo
    // -------------------------------------------------------------------------
    case 'KM0_SAT': {
      // Corpo cilindrico-ottagonale in lamina dorata multistrato (MLI oro)
      const bus = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 5.2, 8), goldFoilMat);
      bus.rotation.z = Math.PI / 2;
      group.add(bus);
      clickables.push(bus);

      // Strumento MSI (MultiSpectral Instrument): cono ottico a specchi con lente VNIR/SWIR
      const msiHousing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 2.4), carbonFiberMat);
      msiHousing.position.set(0, -0.6, 1.8);
      const msiBaffle = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 1.6, 16, 1, true), titaniumMat);
      msiBaffle.rotation.x = Math.PI / 2;
      msiBaffle.position.set(0, -0.6, 3.2);
      const msiLens = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), neonMat);
      msiLens.position.set(0, -0.6, 3.2);
      group.add(msiHousing, msiBaffle, msiLens);
      clickables.push(msiHousing, msiBaffle, msiLens);

      // Pannello solare articolato a 3 sezioni su un lato
      const solarArm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.2, 8), titaniumMat);
      solarArm.rotation.z = Math.PI / 2;
      solarArm.position.set(-3.2, 0, 0);
      const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.8, 0.2), solarCellMat);
      solarPanel.position.set(-7.2, 0, 0);
      group.add(solarArm, solarPanel);
      clickables.push(solarPanel);

      // Antenna circolare di downlink X-Band per trasmissione dati territoriali
      const xBandDish = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16), dishMeshMat);
      xBandDish.rotation.x = Math.PI / 2;
      xBandDish.position.set(1.5, 0.8, 1.8);
      group.add(xBandDish);
      clickables.push(xBandDish);

      leftBeaconPos.set(-10.6, 0, 0);
      rightBeaconPos.set(3.4, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // 4. STREET_360_SAT: WORLDVIEW-3 – Fotogrammetria Stradale Sub-Metrica
    // -------------------------------------------------------------------------
    case 'STREET_360_SAT': {
      // Imponente telescopio Cassegrain ottico da 1.1m (barilotto in fibra di carbonio)
      const telescopeTube = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 5.8, 24), carbonFiberMat);
      telescopeTube.rotation.x = Math.PI / 2;
      telescopeTube.position.set(0, 0, 1.4);
      const sunshadeRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.14, 16, 24), goldFoilMat);
      sunshadeRing.position.set(0, 0, 4.3);
      const apertureLens = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), neonMat);
      apertureLens.position.set(0, 0, 4.25);
      group.add(telescopeTube, sunshadeRing, apertureLens);
      clickables.push(telescopeTube, apertureLens);

      // Modulo avionico e giroscopi CMG posteriore
      const avionicsBus = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 2.2), silverFoilMat);
      avionicsBus.position.set(0, 0, -1.8);
      group.add(avionicsBus);
      clickables.push(avionicsBus);

      // Pannelli solari ad angolo per massimizzare la ricarica in orbita eliosincrona
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.6, 0.2), solarCellMat);
      wingL.position.set(-4.8, 0, -1.4);
      wingL.rotation.y = 0.25;
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.6, 0.2), solarCellMat);
      wingR.position.set(4.8, 0, -1.4);
      wingR.rotation.y = -0.25;
      group.add(wingL, wingR);
      clickables.push(wingL, wingR);

      // Antenna X-band ad alto guadagno orientabile per download 3.2 Gbps
      const xBandDish = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), dishMeshMat);
      xBandDish.rotation.x = Math.PI / 2;
      xBandDish.position.set(1.4, 1.4, 0);
      group.add(xBandDish);

      leftBeaconPos.set(-7.4, 0, -1.4);
      rightBeaconPos.set(7.4, 0, -1.4);
      break;
    }

    // -------------------------------------------------------------------------
    // 5. PI_CHAT_SAT: IRIDIUM-NEXT – Costellazione Mesh & Canale Pi Chat
    // -------------------------------------------------------------------------
    case 'PI_CHAT_SAT': {
      // Iconico chassis a prisma triangolare con coperte termiche argento e bianco
      const prismGeo = new THREE.CylinderGeometry(2.0, 2.0, 5.4, 3);
      const bus = new THREE.Mesh(prismGeo, silverFoilMat);
      bus.rotation.y = Math.PI / 6;
      group.add(bus);
      clickables.push(bus);

      // 3 Grandi Antenne phased-array MMA (Main Mission Antennas) disposte sui 3 lati
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3;
        const mma = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.4, 0.22), whiteRadiatorMat);
        mma.position.set(Math.cos(angle) * 1.6, 0, Math.sin(angle) * 1.6);
        mma.rotation.y = -angle + Math.PI / 2;
        group.add(mma);
        clickables.push(mma);
      }

      // Parabole orientabili per cross-link laser e Ka-band inter-satellite
      const dishL = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), dishMeshMat);
      dishL.position.set(-1.6, 2.6, 0);
      const dishR = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), dishMeshMat);
      dishR.position.set(1.6, 2.6, 0);
      group.add(dishL, dishR);
      clickables.push(dishL, dishR);

      // Ali fotovoltaiche bilaterali
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 0.18), solarCellMat);
      wingL.position.set(-5.6, 0, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 0.18), solarCellMat);
      wingR.position.set(5.6, 0, 0);
      group.add(wingL, wingR);
      clickables.push(wingL, wingR);

      leftBeaconPos.set(-8.4, 0, 0);
      rightBeaconPos.set(8.4, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // 9. GLOBAL_MARKET_SAT: INMARSAT-6 – Antenna Riflettente Gigante da 9m
    // -------------------------------------------------------------------------
    case 'GLOBAL_MARKET_SAT': {
      // Chassis principale ottagonale in alluminio e fibra di carbonio
      const bus = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4.4, 8), silverFoilMat);
      group.add(bus);
      clickables.push(bus);

      // Braccio carbonio estendibile con gigantesca parabola ombrello unfurlable da 9 metri
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.8, 8), titaniumMat);
      boom.position.set(0, 2.4, 1.6);
      boom.rotation.x = Math.PI / 4;
      const bigMeshDish = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.4), dishMeshMat);
      bigMeshDish.position.set(0, 4.2, 3.2);
      bigMeshDish.rotation.x = Math.PI / 4;
      group.add(boom, bigMeshDish);
      clickables.push(bigMeshDish);

      // Ali solari ad altissimo rendimento energetico
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.2, 0.22), solarCellMat);
      wingL.position.set(-6.8, 0, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.2, 0.22), solarCellMat);
      wingR.position.set(6.8, 0, 0);
      group.add(wingL, wingR);
      clickables.push(wingL, wingR);

      leftBeaconPos.set(-10.4, 0, 0);
      rightBeaconPos.set(10.4, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // 11. EXTERNAL_MARKET_SAT: SES-17 – Spacebus NEO con 4 Parabole Ka-Band
    // -------------------------------------------------------------------------
    case 'EXTERNAL_MARKET_SAT': {
      // Chassis spaziale Spacebus NEO in alluminio e carbonio
      const bus = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.6, 4.4), silverFoilMat);
      group.add(bus);
      clickables.push(bus);

      // 4 Parabole riflettenti orientabili (Ka-band spot-beams indipendenti)
      const dishPositions = [
        new THREE.Vector3(-2.6, 1.6, 1.2),
        new THREE.Vector3(2.6, 1.6, 1.2),
        new THREE.Vector3(-2.6, -1.6, 1.2),
        new THREE.Vector3(2.6, -1.6, 1.2),
      ];
      dishPositions.forEach((pos) => {
        const dish = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2), dishMeshMat);
        dish.position.copy(pos);
        dish.rotation.y = pos.x > 0 ? -0.4 : 0.4;
        group.add(dish);
        clickables.push(dish);
      });

      // Ali fotovoltaiche con concentratori solari laterali
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.0, 0.2), solarCellMat);
      wingL.position.set(-6.8, 0, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.0, 0.2), solarCellMat);
      wingR.position.set(6.8, 0, 0);
      group.add(wingL, wingR);
      clickables.push(wingL, wingR);

      leftBeaconPos.set(-10.2, 0, 0);
      rightBeaconPos.set(10.2, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // 13. CONOSCENZE_MESTIERI_SAT: ARCHIVE-SAT – Archivio Guide & Saperi
    // -------------------------------------------------------------------------
    case 'CONOSCENZE_MESTIERI_SAT': {
      // Chassis in lamina oro simbolo di valore e conservazione della conoscenza
      const busGold = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.0, 3.2), goldFoilMat);
      const busAmberStripe = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.2, 3.3), amberAccentMat);
      group.add(busGold, busAmberStripe);
      clickables.push(busGold, busAmberStripe);

      // Antenna a libro aperto (simbolo di conoscenza condivisa)
      const bookSpine = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.0, 2.0), titaniumMat);
      bookSpine.position.set(0, 0, 2.8);
      const bookPageL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), whiteRadiatorMat);
      bookPageL.position.set(-0.65, 0, 2.8);
      bookPageL.rotation.y = -0.2;
      const bookPageR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), whiteRadiatorMat);
      bookPageR.position.set(0.65, 0, 2.8);
      bookPageR.rotation.y = 0.2;
      group.add(bookSpine, bookPageL, bookPageR);
      clickables.push(bookSpine, bookPageL, bookPageR);

      // Anello di dati orbitale (raccolta distribuita)
      const dataRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.1, 8, 32), neonMat);
      dataRing.rotation.x = Math.PI / 2;
      dataRing.position.set(0, 0, 2.0);
      group.add(dataRing);
      clickables.push(dataRing);

      // Ali solari a forma di pagina (simbolo di archivio)
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.8, 0.15), solarCellMat);
      wingL.position.set(-5.5, 0, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.8, 0.15), solarCellMat);
      wingR.position.set(5.5, 0, 0);
      group.add(wingL, wingR);
      clickables.push(wingL, wingR);

      leftBeaconPos.set(-8.5, 0, 0);
      rightBeaconPos.set(8.5, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // 14. BUSINESS_ADS_SAT: INTELSAT-40E / TEMPO – Piattaforma Spettrometro
    // -------------------------------------------------------------------------
    case 'BUSINESS_ADS_SAT': {
      // Piattaforma commerciale geostazionaria Maxar 1300 con lamina Kapton oro
      const bus = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.2, 4.6), goldFoilMat);
      group.add(bus);
      clickables.push(bus);

      // Strumento NASA TEMPO (spettrometro UV/visibile per monitoraggio urbano commerciale)
      const tempoPod = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 2.2), carbonFiberMat);
      tempoPod.position.set(0, -1.4, 2.8);
      const tempoAperture = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.8, 16), titaniumMat);
      tempoAperture.rotation.x = Math.PI / 2;
      tempoAperture.position.set(0, -1.4, 3.8);
      const opticalSensor = new THREE.Mesh(new THREE.CircleGeometry(0.65, 16), neonMat);
      opticalSensor.position.set(0, -1.4, 4.2);
      group.add(tempoPod, tempoAperture, opticalSensor);
      clickables.push(tempoPod, tempoAperture, opticalSensor);

      // Doppie parabole orientabili in fibra di carbonio per trasmissione ad aziende e sponsor
      const dishL = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2.2), dishMeshMat);
      dishL.rotation.y = Math.PI / 3;
      dishL.position.set(-2.8, 0.8, 1.2);
      const dishR = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2.2), dishMeshMat);
      dishR.rotation.y = -Math.PI / 3;
      dishR.position.set(2.8, 0.8, 1.2);
      group.add(dishL, dishR);
      clickables.push(dishL, dishR);

      // Ali solari a 5 segmenti ad altissima ampiezza
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.2, 0.22), solarCellMat);
      wingL.position.set(-7.8, 0, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.2, 0.22), solarCellMat);
      wingR.position.set(7.8, 0, 0);
      group.add(wingL, wingR);
      clickables.push(wingL, wingR);

      leftBeaconPos.set(-11.8, 0, 0);
      rightBeaconPos.set(11.8, 0, 0);
      break;
    }
  }

  // Targhetta scientifica di identificazione visibile nello spazio
  const badge = createCraftBadge(sat.codeName, sat.name, sat.color);
  group.add(badge);
  clickables.push(badge);

  // Fari differenziati in base alla missione del satellite:
  // - BLINKING (METEO_SAT, STREET_360_SAT): Luce lampeggiante (ON/OFF)
  // - NORMAL (EXTERNAL_MARKET_SAT): Luce normale continua a bassa intensità
  // - BRIGHT (KM0_SAT, GLOBAL_MARKET_SAT, BUSINESS_ADS_SAT, PI_CHAT_SAT, CONOSCENZE_MESTIERI_SAT): Luce brillante continua ad alta intensità
  const isBlinking = lightMode === 'BLINKING';
  const isBright = lightMode === 'BRIGHT';

  const beaconRadius = isBright ? 0.62 : isBlinking ? 0.56 : 0.40;
  const beaconGeo = new THREE.SphereGeometry(beaconRadius, 12, 12);
  const leftColor = isBright ? new THREE.Color(sat.color) : new THREE.Color(0xef4444);
  const rightColor = isBright ? new THREE.Color(0xffffff) : new THREE.Color(0x10b981);

  const leftMat = new THREE.MeshBasicMaterial({
    color: leftColor,
    transparent: !isBlinking,
    opacity: isBright ? 1.0 : isBlinking ? 1.0 : 0.55,
  });
  const leftBeacon = new THREE.Mesh(beaconGeo, leftMat);
  leftBeacon.position.copy(leftBeaconPos);
  group.add(leftBeacon);

  const rightMat = new THREE.MeshBasicMaterial({
    color: rightColor,
    transparent: !isBlinking,
    opacity: isBright ? 1.0 : isBlinking ? 1.0 : 0.55,
  });
  const rightBeacon = new THREE.Mesh(beaconGeo, rightMat);
  rightBeacon.position.copy(rightBeaconPos);
  group.add(rightBeacon);

  // Alone luminoso continuo ad alta intensità esclusivamente per i satelliti BRIGHT
  if (isBright) {
    const haloGeo = new THREE.SphereGeometry(1.15, 12, 12);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(sat.color),
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const leftHalo = new THREE.Mesh(haloGeo, haloMat);
    leftHalo.position.copy(leftBeaconPos);
    const rightHalo = new THREE.Mesh(haloGeo, haloMat);
    rightHalo.position.copy(rightBeaconPos);
    group.add(leftHalo, rightHalo);
  }

  // Sfera invisibile di aggancio tocco/clic per facilitare il tap su mobile
  const hitGeo = new THREE.SphereGeometry(4.0, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: false });
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  group.add(hitSphere);
  clickables.push(hitSphere);

  // Indicatore radar di prossimità discreto proporzionato alla modalità luce
  const pulseGeo = new THREE.RingGeometry(1.1, isBright ? 1.6 : 1.35, 24);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(sat.color),
    transparent: true,
    opacity: isBright ? 0.36 : isBlinking ? 0.24 : 0.08,
    side: THREE.DoubleSide,
  });
  const radarPulse = new THREE.Mesh(pulseGeo, pulseMat);
  radarPulse.rotation.x = Math.PI / 2;
  group.add(radarPulse);

  // Scala visibile aumentata da 0.36 a 0.50 per maggiore visibilità orbitale senza coprire la Terra
  group.scale.set(0.50, 0.50, 0.50);

  // Metadati per interazione raycasting touch/click
  clickables.forEach((mesh) => {
    mesh.userData = {
      isSatellite: true,
      satelliteId: sat.id,
      lightMode,
      name: `${sat.name} (${sat.codeName})`,
      description: sat.h2wRole,
    };
  });

  return {
    group,
    craftGroup: group,
    clickables,
    leftBeacon,
    rightBeacon,
    strobeBeacons: isBlinking ? [leftBeacon, rightBeacon] : [],
    radarPulse,
    lightMode,
  };
}
