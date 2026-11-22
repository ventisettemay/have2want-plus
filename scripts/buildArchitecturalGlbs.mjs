import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill minimal FileReader for Node.js so Three.js GLTFExporter binary mode works natively
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    constructor() {
      this.result = null;
      this.onload = null;
      this.onloadend = null;
      this.onerror = null;
    }
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          if (typeof this.onload === 'function') this.onload({ target: this });
          if (typeof this.onloadend === 'function') this.onloadend({ target: this });
        })
        .catch((err) => {
          if (typeof this.onerror === 'function') this.onerror(err);
        });
    }
    readAsDataURL(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          const b64 = Buffer.from(buf).toString('base64');
          const mime = blob.type || 'application/octet-stream';
          this.result = `data:${mime};base64,${b64}`;
          if (typeof this.onload === 'function') this.onload({ target: this });
          if (typeof this.onloadend === 'function') this.onloadend({ target: this });
        })
        .catch((err) => {
          if (typeof this.onerror === 'function') this.onerror(err);
        });
    }
  };
}

const OUT_DIR = path.resolve(process.cwd(), 'public', 'models');
fs.mkdirSync(OUT_DIR, { recursive: true });

function buildMerchantPavilion() {
  const group = new THREE.Group();
  group.name = 'MerchantPavilion';

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.85, metalness: 0.05 });
  const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.72, metalness: 0.04 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.12, metalness: 0.35 });
  const awningMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65, metalness: 0.08 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.78, metalness: 0.08 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3, metalness: 0.5 });

  // 1. Stone foundation plinth (bottom flush at y = 0)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.7, 8.6), stoneMat);
  plinth.position.y = 0.35;
  group.add(plinth);

  // 2. Main structural body
  const body = new THREE.Mesh(new THREE.BoxGeometry(10.0, 5.2, 8.0), stuccoMat);
  body.position.y = 3.3;
  group.add(body);

  // 3. Storefront recessed glass bay + upper transom
  const glassFront = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.9, 0.25), glassMat);
  glassFront.position.set(0, 2.25, 4.02);
  group.add(glassFront);

  // 4. Facade architectural pilasters (4 vertical ribs)
  [-4.6, -2.0, 2.0, 4.6].forEach((x) => {
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.2, 0.35), stoneMat);
    pilaster.position.set(x, 3.3, 4.08);
    group.add(pilaster);
  });

  // 5. Sloped entrance awning canopy
  const awning = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.24, 1.9), awningMat);
  awning.position.set(0, 3.75, 4.85);
  awning.rotation.x = 0.28;
  group.add(awning);

  // 6. Cornice band & accent sign fascia
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.45, 8.6), trimMat);
  cornice.position.y = 6.05;
  group.add(cornice);

  const fascia = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.55, 0.25), accentMat);
  fascia.position.set(0, 4.55, 4.15);
  group.add(fascia);

  // 7. Pitched gable roof extruded prism
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-5.4, 0);
  roofShape.lineTo(5.4, 0);
  roofShape.lineTo(0, 2.3);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 8.6,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  roofGeo.translate(0, 0, -4.3);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 6.25;
  group.add(roof);

  // 8. Rooftop solar panel array
  const solar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.8), trimMat);
  solar.position.set(1.6, 7.25, -1.6);
  solar.rotation.z = -0.36;
  group.add(solar);

  return group;
}

function buildCommercialHub() {
  const group = new THREE.Group();
  group.name = 'CommercialHub';

  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.72, metalness: 0.15 });
  const limestoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.68, metalness: 0.06 });
  const curtainGlassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.45 });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.32, metalness: 0.65 });
  const slateRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.2 });

  // 1. Granite podium base (y=0..4)
  const podium = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.0, 12.0), graniteMat);
  podium.position.y = 2.0;
  group.add(podium);

  // 2. Entrance canopy portico
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 2.4), bronzeMat);
  canopy.position.set(0, 3.6, 6.9);
  group.add(canopy);

  // 3. Curtain-wall mid-rise tower (y=4..16)
  const towerCore = new THREE.Mesh(new THREE.BoxGeometry(12.2, 12.0, 10.2), curtainGlassMat);
  towerCore.position.y = 10.0;
  group.add(towerCore);

  // 4. Horizontal limestone floor spandrels (4 structural floor bands)
  [6.0, 9.0, 12.0, 15.0].forEach((yPos) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.48, 10.6), limestoneMat);
    band.position.y = yPos;
    group.add(band);
  });

  // 5. Corner limestone structural piers
  [
    [-5.9, -4.9],
    [5.9, -4.9],
    [-5.9, 4.9],
    [5.9, 4.9],
  ].forEach(([cx, cz]) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.9, 12.2, 0.9), limestoneMat);
    pier.position.set(cx, 10.1, cz);
    group.add(pier);
  });

  // 6. Stepped penthouse setback + sloped mansard crown
  const setback = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.2, 7.8), limestoneMat);
  setback.position.y = 17.6;
  group.add(setback);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 5.8, 2.6, 4), slateRoofMat);
  crown.rotation.y = Math.PI / 4;
  crown.position.y = 20.5;
  group.add(crown);

  // 7. Rooftop spire/comms mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.4, 8), bronzeMat);
  mast.position.y = 22.8;
  group.add(mast);

  return group;
}

function buildCivicLandmark() {
  const group = new THREE.Group();
  group.name = 'CivicLandmark';

  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe7e2d8, roughness: 0.72, metalness: 0.05 });
  const travertineMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc0, roughness: 0.82, metalness: 0.04 });
  const copperDomeMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.42, metalness: 0.45 });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.75 });
  const darkPortalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.25 });

  // 1. Two-step podium base (flush at y=0)
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.7, 13.0), travertineMat);
  step1.position.y = 0.35;
  group.add(step1);

  const step2 = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.7, 11.6), travertineMat);
  step2.position.y = 1.05;
  group.add(step2);

  // 2. Main neoclassical hall body
  const hall = new THREE.Mesh(new THREE.BoxGeometry(11.6, 6.2, 8.8), marbleMat);
  hall.position.set(0, 4.5, -0.8);
  group.add(hall);

  // 3. Recessed dark arched portal
  const portal = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.2, 0.4), darkPortalMat);
  portal.position.set(0, 3.5, 3.65);
  group.add(portal);

  // 4. Four cylindrical Corinthian-style portico columns
  [-4.2, -1.8, 1.8, 4.2].forEach((x) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 5.8, 14), marbleMat);
    col.position.set(x, 4.3, 4.8);
    group.add(col);
  });

  // 5. Triangular classical pediment over portico
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-5.8, 0);
  pedShape.lineTo(5.8, 0);
  pedShape.lineTo(0, 2.2);
  pedShape.closePath();
  const pedGeo = new THREE.ExtrudeGeometry(pedShape, {
    depth: 2.2,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 2,
  });
  const pediment = new THREE.Mesh(pedGeo, travertineMat);
  pediment.position.set(0, 7.2, 3.4);
  group.add(pediment);

  // 6. Octagonal drum + copper dome + lantern finial
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.7, 2.4, 8), marbleMat);
  drum.position.set(0, 8.8, -0.8);
  group.add(drum);

  const domeGeo = new THREE.SphereGeometry(3.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, copperDomeMat);
  dome.position.set(0, 10.0, -0.8);
  group.add(dome);

  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.3, 8), bronzeMat);
  lantern.position.set(0, 13.7, -0.8);
  group.add(lantern);

  return group;
}

function buildUrbanTree() {
  const group = new THREE.Group();
  group.name = 'UrbanTree';

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92, metalness: 0.02 });
  const leafDarkMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.82, metalness: 0.02 });
  const leafMidMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.78, metalness: 0.02 });
  const leafBrightMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75, metalness: 0.02 });

  // 1. Flared root collar (flush at y=0) + tapered trunk
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 0.6, 10), barkMat);
  collar.position.y = 0.3;
  group.add(collar);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 10), barkMat);
  trunk.position.y = 1.9;
  group.add(trunk);

  // 2. Three angled structural limbs
  [
    { x: 0.55, y: 3.3, z: 0.2, rz: -0.45, rx: 0.18 },
    { x: -0.5, y: 3.4, z: -0.25, rz: 0.42, rx: -0.2 },
    { x: 0.05, y: 3.5, z: -0.5, rz: 0.05, rx: -0.4 },
  ].forEach((b) => {
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.4, 8), barkMat);
    limb.position.set(b.x * 0.6, b.y, b.z * 0.6);
    limb.rotation.set(b.rx, 0, b.rz);
    group.add(limb);
  });

  // 3. Multi-cluster organic crown
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, 1), leafDarkMat);
  c1.position.set(0, 4.6, 0);
  c1.scale.set(1.1, 0.9, 1.1);
  group.add(c1);

  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), leafMidMat);
  c2.position.set(1.05, 4.15, 0.45);
  group.add(c2);

  const c3 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), leafMidMat);
  c3.position.set(-0.95, 4.25, -0.4);
  group.add(c3);

  const c4 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), leafBrightMat);
  c4.position.set(0.1, 5.6, -0.2);
  group.add(c4);

  return group;
}

function buildNavVehicle() {
  const group = new THREE.Group();
  group.name = 'NavVehicle';

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.65 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.08, metalness: 0.4 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.05 });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85,
    roughness: 0.15,
    metalness: 0.2,
  });

  // 1. Sculpted beveled aerodynamic lower chassis (oriented +Z forward)
  const profile = new THREE.Shape();
  profile.moveTo(-2.1, 0.35);
  profile.lineTo(2.1, 0.35);
  profile.lineTo(2.2, 0.82);
  profile.lineTo(1.2, 1.05);
  profile.lineTo(0.55, 1.65);
  profile.lineTo(-1.05, 1.65);
  profile.lineTo(-1.9, 1.05);
  profile.lineTo(-2.15, 0.78);
  profile.closePath();

  const chassisGeo = new THREE.ExtrudeGeometry(profile, {
    depth: 1.76,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 2,
  });
  chassisGeo.translate(0, 0, -0.88);
  chassisGeo.rotateY(-Math.PI / 2); // Align forward nose with +Z
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  group.add(chassis);

  // 2. Cabin glass shell
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.56, 1.75), glassMat);
  cabin.position.set(0, 1.32, -0.18);
  group.add(cabin);

  // 3. Four wheels with rims resting at y = 0
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12);
  rimGeo.rotateZ(Math.PI / 2);

  [
    [-0.92, 0.4, 1.32],
    [0.92, 0.4, 1.32],
    [-0.92, 0.4, -1.32],
    [0.92, 0.4, -1.32],
  ].forEach(([wx, wy, wz]) => {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.position.set(wx, wy, wz);
    group.add(tire);
    const rim = new THREE.Mesh(rimGeo, trimMat);
    rim.position.set(wx, wy, wz);
    group.add(rim);
  });

  // 4. Front LED headlights & rooftop beacon
  [-0.58, 0.58].forEach((hx) => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.12), headlightMat);
    light.position.set(hx, 0.74, 2.2);
    group.add(light);
  });

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.18, 12), trimMat);
  beacon.position.set(0, 1.82, -0.2);
  group.add(beacon);

  return group;
}

const exporter = new GLTFExporter();

async function exportGlb(sceneOrGroup, filename) {
  const glbBuffer = await exporter.parseAsync(sceneOrGroup, { binary: true });
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(glbBuffer));
  const stats = fs.statSync(outPath);
  console.log(`Generated ${filename}: ${(stats.size / 1024).toFixed(2)} KB`);
}

await exportGlb(buildMerchantPavilion(), 'merchant_pavilion.glb');
await exportGlb(buildCommercialHub(), 'commercial_hub.glb');
await exportGlb(buildCivicLandmark(), 'civic_landmark.glb');
await exportGlb(buildUrbanTree(), 'urban_tree.glb');
await exportGlb(buildNavVehicle(), 'nav_vehicle.glb');
