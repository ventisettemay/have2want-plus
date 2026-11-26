import * as THREE from 'three';
import * as maplibregl from 'maplibre-gl';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  modelAssetService,
  detectLodBudget,
  selectLodLevel,
  disposeThreeObject,
  type ModelAssetKey,
  type LodBudgetConfig,
} from './modelAssetService';
import { isValidCoord } from './worldAtlas';

export interface UrbanoSceneEntity {
  id: string;
  assetKey: ModelAssetKey;
  lat: number;
  lng: number;
  altitudeMeters?: number;
  scale?: number;
  rotationYRad?: number;
  tintHex?: number;
}

function approxDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class UrbanoThreeCustomLayer implements maplibregl.CustomLayerInterface {
  public readonly id = 'urbano-three-models-layer';
  public readonly type = 'custom' as const;
  public readonly renderingMode = '3d' as const;

  private map: maplibregl.Map | null = null;
  private camera: THREE.Camera | null = null;
  private scene: THREE.Scene | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;
  private budget: LodBudgetConfig = detectLodBudget();

  private entities: UrbanoSceneEntity[] = [];
  private activeNodes = new Map<string, { group: THREE.Group; entity: UrbanoSceneEntity }>();
  private loadingKeys = new Set<string>();
  private navVehicleNode: THREE.Group | null = null;
  private navState: { active: boolean; lat: number; lng: number; headingDeg: number } = {
    active: false,
    lat: 0,
    lng: 0,
    headingDeg: 0,
  };
  private visible = true;
  private disposed = false;

  public setVisible(isVisible: boolean): void {
    this.visible = isVisible;
    if (this.map) {
      this.map.triggerRepaint();
    }
  }

  public setEntities(nextEntities: UrbanoSceneEntity[]): void {
    this.entities = nextEntities.filter((e) => isValidCoord(e.lat, e.lng));
    void this.syncEntitiesWithBudget();
  }

  public updateNavVehicle(active: boolean, lat?: number, lng?: number, headingDeg = 0): void {
    this.navState = {
      active: Boolean(active && isValidCoord(lat, lng)),
      lat: lat ?? 0,
      lng: lng ?? 0,
      headingDeg: Number.isFinite(headingDeg) ? headingDeg : 0,
    };

    if (this.navState.active && !this.navVehicleNode && !this.disposed) {
      void modelAssetService.instantiateModel('nav_vehicle', { scale: 2.2 }).then((node) => {
        if (!node || this.disposed || !this.scene) {
          disposeThreeObject(node);
          return;
        }
        this.navVehicleNode = node;
        this.scene.add(node);
        this.map?.triggerRepaint();
      });
    } else if (!this.navState.active && this.navVehicleNode) {
      this.navVehicleNode.visible = false;
    }

    this.map?.triggerRepaint();
  }

  public onAdd(map: maplibregl.Map, gl: WebGLRenderingContext): void {
    this.disposed = false;
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sunLight.position.set(40, 120, 60).normalize();
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    fillLight.position.set(-50, 40, -60).normalize();
    this.scene.add(fillLight);

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: !this.budget.isSoftwareGl,
    });
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.envRenderTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
      this.scene.environment = this.envRenderTarget.texture;
      pmrem.dispose();
    } catch {
      // Optional studio env fallback to scene lights
    }

    void this.syncEntitiesWithBudget();
  }

  private async syncEntitiesWithBudget(): Promise<void> {
    if (this.disposed || !this.scene || !this.map) return;

    const center = this.map.getCenter();
    const sorted = this.entities
      .map((entity) => ({
        entity,
        dist: approxDistanceMeters(center.lat, center.lng, entity.lat, entity.lng),
      }))
      .filter((item) => selectLodLevel(item.dist, this.budget) !== 'CULLED')
      .sort((a, b) => a.dist - b.dist)
      .slice(0, this.budget.maxActiveModels);

    const wantedIds = new Set(sorted.map((s) => s.entity.id));

    // Rimuovi e libera nodi fuori raggio / non più presenti
    for (const [id, entry] of this.activeNodes.entries()) {
      if (!wantedIds.has(id)) {
        this.scene.remove(entry.group);
        disposeThreeObject(entry.group);
        this.activeNodes.delete(id);
      }
    }

    for (const { entity } of sorted) {
      if (this.activeNodes.has(entity.id) || this.loadingKeys.has(entity.id)) continue;
      this.loadingKeys.add(entity.id);

      const scale =
        entity.scale ?? modelAssetService.getCatalogEntry(entity.assetKey).defaultScaleMeters;

      modelAssetService
        .instantiateModel(entity.assetKey, { scale, tintHex: entity.tintHex })
        .then((group) => {
          this.loadingKeys.delete(entity.id);
          if (!group || this.disposed || !this.scene) {
            disposeThreeObject(group);
            return;
          }
          if (this.activeNodes.has(entity.id)) {
            disposeThreeObject(group);
            return;
          }
          group.userData.entityId = entity.id;
          this.scene.add(group);
          this.activeNodes.set(entity.id, { group, entity });
          this.map?.triggerRepaint();
        })
        .catch(() => {
          this.loadingKeys.delete(entity.id);
        });
    }
  }

  public render(_gl: WebGLRenderingContext, options: any): void {
    if (!this.renderer || !this.scene || !this.camera || !this.map || !this.visible) return;
    const matrixArray: number[] = Array.isArray(options)
      ? options
      : options?.defaultProjectionData?.mainMatrix || options?.modelViewProjectionMatrix;
    if (!matrixArray) return;

    const projMatrix = new THREE.Matrix4().fromArray(matrixArray);
    const center = this.map.getCenter();

    // Posiziona ogni modello GLB sul proprio punto reale in MercatorCoordinate
    this.activeNodes.forEach(({ group, entity }) => {
      const dist = approxDistanceMeters(center.lat, center.lng, entity.lat, entity.lng);
      const lod = selectLodLevel(dist, this.budget);
      group.visible = lod !== 'CULLED';
      if (!group.visible) return;

      const merc = maplibregl.MercatorCoordinate.fromLngLat(
        [entity.lng, entity.lat],
        entity.altitudeMeters ?? 0
      );
      const unitScale = merc.meterInMercatorCoordinateUnits();
      const baseScale =
        entity.scale ?? modelAssetService.getCatalogEntry(entity.assetKey).defaultScaleMeters;

      group.position.set(merc.x, merc.y, merc.z ?? 0);
      // In MercatorCoordinate: +X est, +Y sud, +Z su (rotazione X +90° porta +Y Three.js verso +Z altitudine)
      group.rotation.set(Math.PI / 2, entity.rotationYRad ?? 0, 0);
      group.scale.set(
        unitScale * baseScale,
        unitScale * baseScale,
        -unitScale * baseScale
      );
    });

    // Posiziona veicolo di navigazione 3D GPS se attivo
    if (this.navVehicleNode) {
      if (this.navState.active) {
        const merc = maplibregl.MercatorCoordinate.fromLngLat(
          [this.navState.lng, this.navState.lat],
          0.5
        );
        const unitScale = merc.meterInMercatorCoordinateUnits();
        const headingRad = ((180 - this.navState.headingDeg) * Math.PI) / 180;
        this.navVehicleNode.visible = true;
        this.navVehicleNode.position.set(merc.x, merc.y, merc.z ?? 0);
        this.navVehicleNode.rotation.set(Math.PI / 2, headingRad, 0);
        this.navVehicleNode.scale.set(unitScale * 2.4, unitScale * 2.4, -unitScale * 2.4);
      } else {
        this.navVehicleNode.visible = false;
      }
    }

    this.camera.projectionMatrix = projMatrix;
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }

  public onRemove(): void {
    this.disposed = true;
    this.activeNodes.forEach(({ group }) => {
      this.scene?.remove(group);
      disposeThreeObject(group);
    });
    this.activeNodes.clear();
    if (this.navVehicleNode) {
      this.scene?.remove(this.navVehicleNode);
      disposeThreeObject(this.navVehicleNode);
      this.navVehicleNode = null;
    }
    if (this.envRenderTarget) {
      this.envRenderTarget.dispose();
      this.envRenderTarget = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.map = null;
  }
}
