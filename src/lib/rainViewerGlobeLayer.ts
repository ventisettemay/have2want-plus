// rainViewerGlobeLayer.ts
// Proiezione reale dei frame RainViewer (Doppler Radar + Satellite IR) da Web Mercator a sfera equirettangolare 3D

import { getRainViewerRadarData } from './weatherService';

export interface RainViewerFrame {
  time: number;
  path: string;
}

export interface RainViewerRadarPayload {
  host: string;
  pastFrames: RainViewerFrame[];
  nowcastFrames: RainViewerFrame[];
  satelliteFrames: RainViewerFrame[];
  generated?: number;
  source?: string;
}

export interface ComposedGlobeRadarResult {
  radarFrame: RainViewerFrame | null;
  satelliteFrame: RainViewerFrame | null;
  radarTimestamp: number | null;
  satelliteTimestamp: number | null;
  tilesLoaded: number;
  source: string;
}

/**
 * Converte latitudine (-85.0511 .. +85.0511) e longitudine (-180 .. +180)
 * in coordinate tile Web Mercator normalizzate [0..n]
 */
export function latLngToMercatorTileFrac(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/**
 * Converte una riga verticale equirettangolare [0..height] (latitudine +90..-90)
 * nella coordinata frazionaria Y della griglia Mercator di RainViewer
 */
export function equirectangularYToMercatorY(rowY: number, height: number, zoom: number): number {
  const lat = 90 - (rowY / height) * 180;
  return latLngToMercatorTileFrac(lat, 0, zoom).y;
}

function loadCorsImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeoutId = setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Disegna i veri tile RainViewer (satellite IR + radar precipitazioni Doppler)
 * su un canvas equirettangolare pronto per THREE.CanvasTexture sulla sfera terrestre.
 */
export async function composeRainViewerGlobeCanvas(
  canvas: HTMLCanvasElement,
  providedData?: RainViewerRadarPayload | null
): Promise<ComposedGlobeRadarResult> {
  const data = providedData ?? (await getRainViewerRadarData());
  const emptyResult: ComposedGlobeRadarResult = {
    radarFrame: null,
    satelliteFrame: null,
    radarTimestamp: null,
    satelliteTimestamp: null,
    tilesLoaded: 0,
    source: data?.source || 'RainViewer Doppler Radar Network',
  };

  if (!data || !canvas) return emptyResult;
  const ctx = canvas.getContext('2d');
  if (!ctx) return emptyResult;

  const width = canvas.width || 1024;
  const height = canvas.height || 512;
  ctx.clearRect(0, 0, width, height);

  const host = data.host || 'https://tilecache.rainviewer.com';
  const latestSatellite =
    data.satelliteFrames && data.satelliteFrames.length > 0
      ? data.satelliteFrames[data.satelliteFrames.length - 1]
      : null;
  const latestRadar =
    data.pastFrames && data.pastFrames.length > 0
      ? data.pastFrames[data.pastFrames.length - 1]
      : data.nowcastFrames && data.nowcastFrames.length > 0
      ? data.nowcastFrames[0]
      : null;

  const zoom = 2; // griglia globale 4x4 (16 tile totali) per resa fluida su globo 3D
  const n = Math.pow(2, zoom);
  const tilePx = 256;
  let tilesLoaded = 0;

  async function projectLayerTiles(
    frame: RainViewerFrame | null,
    suffix: string,
    alpha: number
  ) {
    if (!frame || !frame.path) return;
    const tilePromises: Promise<{ tx: number; ty: number; img: HTMLImageElement | null }>[] = [];
    for (let tx = 0; tx < n; tx++) {
      for (let ty = 0; ty < n; ty++) {
        const url = `${host}${frame.path}/${tilePx}/${zoom}/${tx}/${ty}/${suffix}`;
        tilePromises.push(
          loadCorsImage(url).then((img) => ({ tx, ty, img }))
        );
      }
    }

    const loaded = await Promise.all(tilePromises);
    const grid: (HTMLImageElement | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
    loaded.forEach(({ tx, ty, img }) => {
      if (img) {
        grid[tx][ty] = img;
        tilesLoaded++;
      }
    });

    ctx.save();
    ctx.globalAlpha = alpha;
    const stripHeight = 4;
    const colWidth = width / n;

    // Proietta per bande di latitudine da equirettangolare -> Mercator
    for (let dy = 0; dy < height; dy += stripHeight) {
      const lat = 90 - ((dy + stripHeight * 0.5) / height) * 180;
      if (Math.abs(lat) > 85) continue;

      const mercY = latLngToMercatorTileFrac(lat, 0, zoom).y;
      const ty = Math.min(n - 1, Math.max(0, Math.floor(mercY)));
      const srcY = Math.min(tilePx - 2, Math.max(0, Math.floor((mercY - ty) * tilePx)));

      for (let tx = 0; tx < n; tx++) {
        const tileImg = grid[tx][ty];
        if (!tileImg) continue;
        ctx.drawImage(
          tileImg,
          0,
          srcY,
          tilePx,
          2,
          tx * colWidth,
          dy,
          colWidth + 0.5,
          stripHeight + 0.5
        );
      }
    }
    ctx.restore();
  }

  // 1. Strato nuvoloso reale all'infrarosso satellitare RainViewer
  await projectLayerTiles(latestSatellite, '0/0_0.png', 0.45);
  // 2. Strato precipitazioni radar Doppler reale RainViewer (color scheme 2 = Universal Blue, smooth + snow)
  await projectLayerTiles(latestRadar, '2/1_1.png', 0.88);

  return {
    radarFrame: latestRadar,
    satelliteFrame: latestSatellite,
    radarTimestamp: latestRadar?.time ?? null,
    satelliteTimestamp: latestSatellite?.time ?? null,
    tilesLoaded,
    source: data.source || 'RainViewer International Doppler Radar Network',
  };
}
