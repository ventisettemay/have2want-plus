// BUILDER 3D DEI 10 VEICOLI SPAZIALI INGEGNERISTICI – HAVE2WANT PLUS
// Ciascun modello rappresenta i 10 canali canonici (6 fisici NORAD + 4 relay logici H2W)
// con geometrie metalliche PBR ad alta fedeltà, pannelli solari fotovoltaici, parabole,
// sensori ottici, alone orbitale luminoso e targhetta billboard nitida.
// Geometrie e materiali condivisi per 60 FPS fluidi su Pi Browser, Mobile e Desktop.

import * as THREE from 'three';
import { SatelliteConfig, SatelliteId } from '@/lib/satelliteModularEngine';

export type SatelliteLightMode = 'BLINKING' | 'NORMAL' | 'BRIGHT';

export function getSatelliteLightMode(id: SatelliteId): SatelliteLightMode {
  if (id === 'METEO_SAT') return 'BLINKING';
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
  badgeSprite?: THREE.Sprite;
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
  badgeSprite?: THREE.Sprite;
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
    dishMeshMat,
    ionPlasmaMat,
  };
}

// Crea la targhetta billboard sempre orientata verso la camera con identificativo e canale
export function createCraftBadge(
  codeName: string,
  h2wName: string,
  colorHex: string,
  icon = '🛰️'
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 208;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (typeof ctx.clearRect === 'function') {
      ctx.clearRect(0, 0, 768, 208);
    }

    // Sfondo scuro ad alto contrasto con cornice luminosa del satellite
    const radius = 28;
    const x = 10;
    const y = 10;
    const w = 748;
    const h = 188;
    if (typeof ctx.beginPath === 'function' && typeof ctx.quadraticCurveTo === 'function') {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(3, 6, 14, 0.97)';
      ctx.fill();
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 10;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#03060e';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 10;
      ctx.strokeRect(x, y, w, h);
    }

    // Nome Canale HAVE2WANT (grande e immediato anche su mobile)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 60px "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${icon} ${h2wName.toUpperCase()}`, 384, 96);

    // Codice identificativo orbitale / missione
    ctx.fillStyle = colorHex;
    ctx.font = '800 36px "Inter", -apple-system, sans-serif';
    ctx.fillText(codeName.toUpperCase(), 384, 158);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  // Posizionato radialmente sopra il satellite (+Y = lontano dalla superficie terrestre)
  sprite.position.set(0, 13.8, 0);
  sprite.scale.set(20.5, 5.6, 1);
  sprite.renderOrder = 30;
  sprite.userData = { baseLocalY: 13.8 };
  return sprite;
}

// Costruzione geometrica ingegneristica per ciascuno dei 10 veicoli spaziali canonici
export function buildEngineeredSpacecraft(
  sat: SatelliteConfig,
  materials: ReturnType<typeof createSharedAerospaceMaterials>,
  _textureLoader?: any
): SpacecraftBuildResult {
  const craftGroup = new THREE.Group();
  // Contenitore interno ingrandito (2.35x) così il veicolo è ben visibile su mobile/desktop
  // mantenendo craftGroup.scale = 0.50 per compatibilità orbitale
  const group = new THREE.Group();
  group.scale.set(2.35, 2.35, 2.35);
  craftGroup.add(group);
  const clickables: THREE.Object3D[] = [];
  const {
    goldFoilMat,
    silverFoilMat,
    titaniumMat,
    carbonFiberMat,
    solarCellMat,
    rescueRedMat,
    whiteRadiatorMat,
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
    // 2B. MAP_SAT: COPERNICUS SENTINEL-2B – Mappa 3D, Stradario 360°, Webcam & Meteo
    // -------------------------------------------------------------------------
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
    // 13. COMMUNITY_RESCUE_SAT: COSPAS-SARSAT MEOSAR – Soccorso & Emergenza
    // -------------------------------------------------------------------------
    case 'COMMUNITY_RESCUE_SAT': {
      // Chassis ad alta visibilità con bande alternate bianche e rosso soccorso (#dc2626)
      const busWhite = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3.4), whiteRadiatorMat);
      const busRedStripe = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.4, 3.5), rescueRedMat);
      group.add(busWhite, busRedStripe);
      clickables.push(busWhite, busRedStripe);

      // Antenna SAR elicoidale spirale a 406 MHz per localizzazione beacon di soccorso
      const spiralMast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 12), titaniumMat);
      spiralMast.rotation.x = Math.PI / 2;
      spiralMast.position.set(0, 0, 3.2);
      const helixRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.12, 8, 24), neonMat);
      helixRing1.position.set(0, 0, 2.4);
      const helixRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 8, 24), neonMat);
      helixRing2.position.set(0, 0, 3.4);
      const helixRing3 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 8, 24), neonMat);
      helixRing3.position.set(0, 0, 4.4);
      group.add(spiralMast, helixRing1, helixRing2, helixRing3);
      clickables.push(spiralMast, helixRing1, helixRing2, helixRing3);

      // Ali solari rinforzate con cerniere in lamina dorata
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 0.18), solarCellMat);
      wingL.position.set(-5.4, 0, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 0.18), solarCellMat);
      wingR.position.set(5.4, 0, 0);
      group.add(wingL, wingR);
      clickables.push(wingL, wingR);

      // Fari stroboscopici di soccorso ad alta intensità
      leftBeaconPos.set(-8.2, 0, 0);
      rightBeaconPos.set(8.2, 0, 0);
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

    // -------------------------------------------------------------------------
    // 9. ACTIONFLOW_SAT: NODO MODULARE HUB APP ESTERNE
    // -------------------------------------------------------------------------
    case 'ACTIONFLOW_SAT': {
      const corePrism = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.8, 3), carbonFiberMat);
      corePrism.rotation.x = Math.PI / 2;
      const emeraldRing = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.18, 12, 32), ionPlasmaMat);
      emeraldRing.rotation.y = Math.PI / 2;
      group.add(corePrism, emeraldRing);
      clickables.push(corePrism, emeraldRing);

      // 3 moduli ponte esterni simbolici (slot App Esterne ActionFlow)
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.8, 0.22), solarCellMat);
        arm.position.set(Math.cos(angle) * 4.4, Math.sin(angle) * 4.4, 0);
        arm.rotation.z = angle;
        group.add(arm);
        clickables.push(arm);
      }

      leftBeaconPos.set(-6.8, 0, 0);
      rightBeaconPos.set(6.8, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // 10. DEFIANCE_PULSE_SAT: SATELLITE CREATIVO MEDIA, MUSICA & VIDEO
    // -------------------------------------------------------------------------
    case 'DEFIANCE_PULSE_SAT': {
      const pulseCore = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 1), goldFoilMat);
      const harmonicRing = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.2, 12, 36), neonMat);
      harmonicRing.rotation.x = Math.PI / 3;
      group.add(pulseCore, harmonicRing);
      clickables.push(pulseCore, harmonicRing);

      const sailL = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.8, 0.2), solarCellMat);
      sailL.position.set(-6.4, 0, 0);
      const sailR = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.8, 0.2), solarCellMat);
      sailR.position.set(6.4, 0, 0);
      group.add(sailL, sailR);
      clickables.push(sailL, sailR);

      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.6, 8), titaniumMat);
      antenna.position.set(0, 3.4, 0);
      group.add(antenna);
      clickables.push(antenna);

      leftBeaconPos.set(-9.8, 0, 0);
      rightBeaconPos.set(9.8, 0, 0);
      break;
    }

    // -------------------------------------------------------------------------
    // DEFAULT: modello satellitare stile NASA per canali senza case dedicato
    // Bus rivestito MLI Kapton (oro/argento), ali fotovoltaiche blu-scuro con celle
    // e telaio metallico, antenna parabolica bianca con feed centrale.
    // Orbite ed etichette distanziate per evitare sovrapposizioni e tagli ai bordi.
    // -------------------------------------------------------------------------
    default: {
      // Bus centrale: strato MLI dorato esterno + pannello argentato superiore
      const bus = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 3.6), goldFoilMat);
      const silverDeck = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.7, 0.35), silverFoilMat);
      silverDeck.position.set(0, 0, 1.85);
      group.add(bus, silverDeck);
      clickables.push(bus, silverDeck);

      // Strati MLI laterali (coperta termica Kapton) sui lati del bus
      const mliLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.6, 3.0), goldFoilMat);
      mliLeft.position.set(-1.42, 0, 0);
      const mliRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.6, 3.0), goldFoilMat);
      mliRight.position.set(1.42, 0, 0);
      const mliFront = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 3.0), goldFoilMat);
      mliFront.position.set(0, -1.42, 0);
      const mliBack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 3.0), goldFoilMat);
      mliBack.position.set(0, 1.42, 0);
      group.add(mliLeft, mliRight, mliFront, mliBack);
      clickables.push(mliLeft, mliRight, mliFront, mliBack);

      // Antenna parabolica bianca (stile NASA DSN) con feed centrale
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2), whiteRadiatorMat);
      dish.rotation.x = Math.PI;
      dish.position.set(0, 0, 3.75);
      const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.55, 10), whiteRadiatorMat);
      feed.position.set(0, 0, 4.15);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 3.3, 8), titaniumMat);
      mast.position.set(0, 0, 2.05);
      group.add(dish, feed, mast);
      clickables.push(dish, feed, mast);

      // Ali fotovoltaiche blu-scuro con telaio metallico (titanium) ai lati
      const frameW = 0.16;
      const frameL = 6.4;
      const frameH = 3.0;
      const cellW = 6.0;
      const cellH = 2.6;

      const frameLMesh = new THREE.Mesh(new THREE.BoxGeometry(frameL, frameH, frameW), titaniumMat);
      frameLMesh.position.set(-frameL / 2 - 0.3, 0, 0);
      const frameRMesh = new THREE.Mesh(new THREE.BoxGeometry(frameL, frameH, frameW), titaniumMat);
      frameRMesh.position.set(frameL / 2 + 0.3, 0, 0);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(cellW, cellH, 0.14), solarCellMat);
      wingL.position.set(-5.35, 0, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(cellW, cellH, 0.14), solarCellMat);
      wingR.position.set(5.35, 0, 0);
      group.add(frameLMesh, frameRMesh, wingL, wingR);
      clickables.push(frameLMesh, frameRMesh, wingL, wingR);

      // Beacon distanziati ai bordi esterni delle ali per evitare sovrapposizioni col bus
      leftBeaconPos.set(-10.6, 0, 0);
      rightBeaconPos.set(10.6, 0, 0);
      break;
    }
  }

  // Targhetta billboard ad alta leggibilità sopra il satellite (+Y radiale lontano dalla Terra)
  const badgeSprite = createCraftBadge(sat.codeName, sat.name, sat.color, sat.icon || '🛰️');
  craftGroup.add(badgeSprite);
  clickables.push(badgeSprite);

  // Fari differenziati in base alla missione del satellite:
  // - BLINKING (METEO_SAT, MAP_SAT): Luce lampeggiante (ON/OFF)
  // - NORMAL (EXTERNAL_MARKET_SAT): Luce normale continua a bassa intensità
  // - BRIGHT (tutti gli altri): Luce brillante continua ad alta intensità
  const isBlinking = lightMode === 'BLINKING';
  const isBright = lightMode === 'BRIGHT';

  const beaconRadius = isBright ? 0.92 : isBlinking ? 0.85 : 0.62;
  const beaconGeo = new THREE.SphereGeometry(beaconRadius, 12, 12);
  const leftColor = isBright ? new THREE.Color(sat.color) : new THREE.Color(0xef4444);
  const rightColor = isBright ? new THREE.Color(0xffffff) : new THREE.Color(0x10b981);

  const leftMat = new THREE.MeshBasicMaterial({
    color: leftColor,
    transparent: !isBlinking,
    opacity: isBright ? 1.0 : isBlinking ? 1.0 : 0.68,
  });
  const leftBeacon = new THREE.Mesh(beaconGeo, leftMat);
  leftBeacon.position.copy(leftBeaconPos);
  group.add(leftBeacon);

  const rightMat = new THREE.MeshBasicMaterial({
    color: rightColor,
    transparent: !isBlinking,
    opacity: isBright ? 1.0 : isBlinking ? 1.0 : 0.68,
  });
  const rightBeacon = new THREE.Mesh(beaconGeo, rightMat);
  rightBeacon.position.copy(rightBeaconPos);
  group.add(rightBeacon);

  // Alone luminoso ai fari laterali e corona orbitale per riconoscere i satelliti a colpo d'occhio
  if (isBright) {
    const haloGeo = new THREE.SphereGeometry(1.75, 12, 12);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(sat.color),
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const leftHalo = new THREE.Mesh(haloGeo, haloMat);
    leftHalo.position.copy(leftBeaconPos);
    const rightHalo = new THREE.Mesh(haloGeo, haloMat);
    rightHalo.position.copy(rightBeaconPos);
    group.add(leftHalo, rightHalo);
  }

  // Corona luminosa centrale attorno al satellite (AdditiveBlending)
  const coronaGeo = new THREE.SphereGeometry(9.0, 16, 16);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(sat.color),
    transparent: true,
    opacity: isBright ? 0.26 : isBlinking ? 0.22 : 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
  craftGroup.add(coronaMesh);

  // Sfera invisibile ampia di aggancio tocco/clic per facilitare il tap su smartphone e desktop
  const hitGeo = new THREE.SphereGeometry(17.5, 12, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: false });
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  craftGroup.add(hitSphere);
  clickables.push(hitSphere);

  // Anello radar luminoso ben visibile attorno al satellite in orbita
  const pulseGeo = new THREE.RingGeometry(8.2, isBright ? 10.4 : 9.6, 32);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(sat.color),
    transparent: true,
    opacity: isBright ? 0.6 : isBlinking ? 0.5 : 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const radarPulse = new THREE.Mesh(pulseGeo, pulseMat);
  radarPulse.rotation.x = Math.PI / 2;
  craftGroup.add(radarPulse);

  // Scala esterna 0.50 invariata (geometria interna scalata 2.35x + corona + badge grande)
  craftGroup.scale.set(0.50, 0.50, 0.50);

  // Metadati per interazione raycasting touch/click (preservando eventuali campi esistenti es. baseLocalY)
  clickables.forEach((mesh) => {
    mesh.userData = {
      ...(mesh.userData || {}),
      isSatellite: true,
      satelliteId: sat.id,
      lightMode,
      name: `${sat.name} (${sat.codeName})`,
      description: sat.h2wRole,
    };
  });

  return {
    group: craftGroup,
    craftGroup,
    clickables,
    leftBeacon,
    rightBeacon,
    strobeBeacons: isBlinking ? [leftBeacon, rightBeacon] : [],
    radarPulse,
    badgeSprite,
    lightMode,
  };
}
