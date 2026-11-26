import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export type ModelProvenanceTier =
  | 'VERIFIED_REAL'
  | 'GENERIC_CATEGORY'
  | 'OSM_PARAMETRIC'
  | 'TEMPORARY_PLACEHOLDER';

export type ModelAssetKey =
  | 'merchant_pavilion'
  | 'commercial_hub'
  | 'civic_landmark'
  | 'urban_tree'
  | 'nav_vehicle';

export interface ModelCatalogEntry {
  key: ModelAssetKey;
  url: string;
  tier: ModelProvenanceTier;
  tierLabel: string;
  license: string;
  defaultScaleMeters: number;
  maxVisibleDistanceMeters: number;
}

export const MODEL_ASSET_CATALOG: Record<ModelAssetKey, ModelCatalogEntry> = {
  merchant_pavilion: {
    key: 'merchant_pavilion',
    url: '/models/merchant_pavilion.glb',
    tier: 'GENERIC_CATEGORY',
    tierLabel: 'Livello 2 • Modello Architettonico GLB (Commercio)',
    license: 'CC0 / Project Asset',
    defaultScaleMeters: 1.35,
    maxVisibleDistanceMeters: 850,
  },
  commercial_hub: {
    key: 'commercial_hub',
    url: '/models/commercial_hub.glb',
    tier: 'GENERIC_CATEGORY',
    tierLabel: 'Livello 2 • Modello Architettonico GLB (Hub Commerciale)',
    license: 'CC0 / Project Asset',
    defaultScaleMeters: 1.15,
    maxVisibleDistanceMeters: 1100,
  },
  civic_landmark: {
    key: 'civic_landmark',
    url: '/models/civic_landmark.glb',
    tier: 'GENERIC_CATEGORY',
    tierLabel: 'Livello 2 • Modello Architettonico GLB (Presidio Civico)',
    license: 'CC0 / Project Asset',
    defaultScaleMeters: 1.25,
    maxVisibleDistanceMeters: 1250,
  },
  urban_tree: {
    key: 'urban_tree',
    url: '/models/urban_tree.glb',
    tier: 'GENERIC_CATEGORY',
    tierLabel: 'Livello 2 • Elemento Verde Urbano GLB',
    license: 'CC0 / Project Asset',
    defaultScaleMeters: 1.1,
    maxVisibleDistanceMeters: 520,
  },
  nav_vehicle: {
    key: 'nav_vehicle',
    url: '/models/nav_vehicle.glb',
    tier: 'GENERIC_CATEGORY',
    tierLabel: 'Livello 2 • Veicolo Navigazione 3D GLB',
    license: 'CC0 / Project Asset',
    defaultScaleMeters: 2.1,
    maxVisibleDistanceMeters: 2500,
  },
};

export interface LodBudgetConfig {
  isMobile: boolean;
  isSoftwareGl: boolean;
  maxRadiusMeters: number;
  maxActiveModels: number;
  pixelRatioCap: number;
}

export function detectLodBudget(): LodBudgetConfig {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      isMobile: false,
      isSoftwareGl: false,
      maxRadiusMeters: 900,
      maxActiveModels: 36,
      pixelRatioCap: 2,
    };
  }

  const isMobile =
    window.innerWidth < 768 ||
    (typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent));

  let isSoftwareGl = false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      isSoftwareGl = true;
    } else {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const rendererName = String(gl.getParameter(param) || '');
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererName);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    isSoftwareGl = false;
  }

  if (isSoftwareGl) {
    return {
      isMobile,
      isSoftwareGl: true,
      maxRadiusMeters: 1800,
      maxActiveModels: 18,
      pixelRatioCap: 1,
    };
  }

  if (isMobile) {
    return {
      isMobile: true,
      isSoftwareGl: false,
      maxRadiusMeters: 1200,
      maxActiveModels: 22,
      pixelRatioCap: 1.5,
    };
  }

  return {
    isMobile: false,
    isSoftwareGl: false,
    maxRadiusMeters: 2200,
    maxActiveModels: 48,
    pixelRatioCap: 2,
  };
}

export function selectLodLevel(distanceMeters: number, budget: LodBudgetConfig): 'HIGH' | 'MEDIUM' | 'CULLED' {
  if (!Number.isFinite(distanceMeters) || distanceMeters > budget.maxRadiusMeters) {
    return 'CULLED';
  }
  if (distanceMeters <= budget.maxRadiusMeters * 0.45) {
    return 'HIGH';
  }
  return 'MEDIUM';
}

export function normalizeGroupBottomPivot(group: THREE.Object3D): THREE.Object3D {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  if (!box.isEmpty()) {
    const centerX = (box.min.x + box.max.x) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;
    group.position.x -= centerX;
    group.position.z -= centerZ;
    group.position.y -= box.min.y;
  }
  return group;
}

export function disposeThreeObject(root: THREE.Object3D | null | undefined): void {
  if (!root) return;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => disposeMaterial(m));
    } else if (mat) {
      disposeMaterial(mat);
    }
  });
}

function disposeMaterial(mat: THREE.Material): void {
  const std = mat as unknown as Record<string, any>;
  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach((slot) => {
    if (std[slot] && typeof std[slot].dispose === 'function') {
      std[slot].dispose();
    }
  });
  if (typeof mat.dispose === 'function') {
    mat.dispose();
  }
}

class ModelAssetService {
  private cache = new Map<ModelAssetKey, THREE.Group>();
  private inFlight = new Map<ModelAssetKey, Promise<THREE.Group | null>>();
  private loader: GLTFLoader | null = null;
  private dracoLoader: DRACOLoader | null = null;

  private ensureLoader(): GLTFLoader {
    if (!this.loader) {
      this.loader = new GLTFLoader();
      if (typeof window !== 'undefined') {
        try {
          this.dracoLoader = new DRACOLoader();
          this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
          this.loader.setDRACOLoader(this.dracoLoader);
        } catch {
          // Draco optional when GLBs are uncompressed binary glTF
        }
      }
    }
    return this.loader;
  }

  public getCatalogEntry(key: ModelAssetKey): ModelCatalogEntry {
    return MODEL_ASSET_CATALOG[key];
  }

  public getCachedKeys(): ModelAssetKey[] {
    return Array.from(this.cache.keys());
  }

  public async loadTemplate(key: ModelAssetKey): Promise<THREE.Group | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!;
    }

    const entry = MODEL_ASSET_CATALOG[key];
    if (!entry || typeof window === 'undefined') {
      return null;
    }

    const promise = (async () => {
      try {
        const loader = this.ensureLoader();
        const gltf = await loader.loadAsync(entry.url);
        const root = new THREE.Group();
        root.name = `asset_${key}`;
        root.userData = {
          assetKey: key,
          provenanceTier: entry.tier,
          tierLabel: entry.tierLabel,
          license: entry.license,
        };
        if (gltf?.scene) {
          root.add(gltf.scene);
        }
        normalizeGroupBottomPivot(root);
        this.cache.set(key, root);
        return root;
      } catch (err) {
        console.warn(`[ModelAssetService] Impossibile caricare modello ${entry.url}:`, err);
        return null;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  public async instantiateModel(
    key: ModelAssetKey,
    options?: { scale?: number; tintHex?: number }
  ): Promise<THREE.Group | null> {
    const template = await this.loadTemplate(key);
    if (!template) return null;

    const clone = template.clone(true);
    clone.userData = { ...template.userData };

    if (typeof options?.scale === 'number' && options.scale > 0) {
      clone.scale.setScalar(options.scale);
    }

    if (typeof options?.tintHex === 'number') {
      clone.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          // Clone only when tinting to preserve shared cache materials otherwise
          const mat = (mesh.material as THREE.Material).clone();
          if ('emissive' in mat && mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive = new THREE.Color(options.tintHex);
            mat.emissiveIntensity = 0.14;
          }
          mesh.material = mat;
        }
      });
    }

    return clone;
  }

  public clearCache(): void {
    this.cache.forEach((group) => disposeThreeObject(group));
    this.cache.clear();
    this.inFlight.clear();
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
      this.dracoLoader = null;
    }
    this.loader = null;
  }
}

export const modelAssetService = new ModelAssetService();
