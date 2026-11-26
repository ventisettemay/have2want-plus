// rainViewerGlobeLayer.ts
// Proiezione reale dei frame RainViewer (Doppler Radar + Satellite IR) da Web Mercator a sfera equirettangolare 3D

import { getRainViewerRadarData } from './weatherService';
import { buildApiUrl } from './apiConfig';

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

function buildProxiedTileUrl(rawUrl: string): string {
  const isBrowserHttp =
    typeof window !== 'undefined' &&
    window.location &&
    typeof window.location.protocol === 'string' &&
    window.location.protocol.startsWith('http');

  if (isBrowserHttp && rawUrl.startsWith('https://')) {
    return buildApiUrl(`/api/weather/rainviewer/tile?url=${encodeURIComponent(rawUrl)}`);
  }
  return rawUrl;
}

function loadCorsImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeoutId = setTimeout(() => resolve(null), 6500);
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(null);
    };
    img.src = buildProxiedTileUrl(url);
  });
}

export interface RainViewerTimelineFrame extends RainViewerFrame {
  kind: 'past' | 'nowcast';
}

export function collectRainViewerTimelineFrames(
  data?: RainViewerRadarPayload | null
): RainViewerTimelineFrame[] {
  if (!data) return [];
  const past: RainViewerTimelineFrame[] = (data.pastFrames || [])
    .filter((f) => Boolean(f?.path))
    .map((f) => ({ ...f, kind: 'past' as const }));
  const nowcast: RainViewerTimelineFrame[] = (data.nowcastFrames || [])
    .filter((f) => Boolean(f?.path))
    .map((f) => ({ ...f, kind: 'nowcast' as const }));
  return [...past, ...nowcast];
}

export function buildRainViewerMapLibreTileUrl(
  host: string,
  frame: RainViewerFrame,
  isSatellite = false
): string {
  const cleanHost = host || 'https://tilecache.rainviewer.com';
  const suffix = isSatellite ? '0/0_0.png' : '2/1_1.png';
  const rawUrl = `${cleanHost}${frame.path}/256/{z}/{x}/{y}/${suffix}`;
  const isBrowserHttp =
    typeof window !== 'undefined' &&
    window.location &&
    typeof window.location.protocol === 'string' &&
    window.location.protocol.startsWith('http');

  if (isBrowserHttp && rawUrl.startsWith('https://')) {
    return `${buildApiUrl('/api/weather/rainviewer/tile')}?path=${encodeURIComponent(
      `${frame.path}/256/{z}/{x}/{y}/${suffix}`
    )}`;
  }
  return rawUrl;
}

/**
 * Disegna uno specifico frame RainViewer (satellite IR + radar precipitazioni Doppler)
 * su un canvas equirettangolare ad alta risoluzione pronto per THREE.CanvasTexture sulla sfera terrestre.
 */
export async function composeRainViewerFrameCanvas(
  canvas: HTMLCanvasElement,
  data: RainViewerRadarPayload | null | undefined,
  radarFrameOverride?: RainViewerFrame | null,
  satelliteFrameOverride?: RainViewerFrame | null
): Promise<ComposedGlobeRadarResult> {
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

  const width = canvas.width || 2048;
  const height = canvas.height || 1024;
  ctx.clearRect(0, 0, width, height);

  const host = data.host || 'https://tilecache.rainviewer.com';
  const targetSatellite =
    satelliteFrameOverride !== undefined
      ? satelliteFrameOverride
      : data.satelliteFrames && data.satelliteFrames.length > 0
      ? data.satelliteFrames[data.satelliteFrames.length - 1]
      : null;
  const targetRadar =
    radarFrameOverride !== undefined
      ? radarFrameOverride
      : data.pastFrames && data.pastFrames.length > 0
      ? data.pastFrames[data.pastFrames.length - 1]
      : data.nowcastFrames && data.nowcastFrames.length > 0
      ? data.nowcastFrames[0]
      : null;

  const zoom = 3; // Griglia 8x8 (48 tile max per layer) bilanciata per desktop e smartphone senza saturare memoria/rete
  const n = Math.pow(2, zoom);
  const tilePx = 256;
  let tilesLoaded = 0;

  async function loadTilesBatched(urls: Array<{ tx: number; ty: number; url: string }>) {
    const results: Array<{ tx: number; ty: number; img: HTMLImageElement | null }> = [];
    const batchSize = 12;
    for (let i = 0; i < urls.length; i += batchSize) {
      const chunk = urls.slice(i, i + batchSize);
      const chunkLoaded = await Promise.all(
        chunk.map((item) => loadCorsImage(item.url).then((img) => ({ tx: item.tx, ty: item.ty, img })))
      );
      results.push(...chunkLoaded);
    }
    return results;
  }

  async function projectLayerTiles(
    frame: RainViewerFrame | null,
    suffix: string,
    alpha: number
  ) {
    if (!frame || !frame.path) return;
    const tileQueue: Array<{ tx: number; ty: number; url: string }> = [];
    for (let tx = 0; tx < n; tx++) {
      // Salta le fasce polari estreme (>~79°) prive di stazioni radar per accelerare il caricamento
      for (let ty = 1; ty < n - 1; ty++) {
        const url = `${host}${frame.path}/${tilePx}/${zoom}/${tx}/${ty}/${suffix}`;
        tileQueue.push({ tx, ty, url });
      }
    }

    const loaded = await loadTilesBatched(tileQueue);
    const grid: (HTMLImageElement | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
    let layerCount = 0;
    loaded.forEach(({ tx, ty, img }) => {
      if (img) {
        grid[tx][ty] = img;
        layerCount++;
        tilesLoaded++;
      }
    });

    if (layerCount === 0) return;

    // Proietta senza filtro su scratch canvas (velocissimo su CPU/GPU mobile), poi applica UN solo pass blur
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = width;
    scratchCanvas.height = height;
    const scratchCtx = scratchCanvas.getContext('2d');
    if (!scratchCtx) return;

    if ('imageSmoothingEnabled' in scratchCtx) {
      scratchCtx.imageSmoothingEnabled = true;
    }
    if ('imageSmoothingQuality' in scratchCtx) {
      scratchCtx.imageSmoothingQuality = 'high';
    }

    const stripHeight = 2;
    const colWidth = width / n;

    for (let dy = 0; dy < height; dy += stripHeight) {
      const lat = 90 - ((dy + stripHeight * 0.5) / height) * 180;
      if (Math.abs(lat) > 80) continue;

      const mercY = latLngToMercatorTileFrac(lat, 0, zoom).y;
      const ty = Math.min(n - 1, Math.max(0, Math.floor(mercY)));
      const srcY = Math.min(tilePx - 2, Math.max(0, Math.floor((mercY - ty) * tilePx)));

      for (let tx = 0; tx < n; tx++) {
        const tileImg = grid[tx][ty];
        if (!tileImg) continue;
        scratchCtx.drawImage(
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

    ctx.save();
    ctx.globalAlpha = alpha;
    if ('imageSmoothingEnabled' in ctx) {
      ctx.imageSmoothingEnabled = true;
    }
    if ('filter' in ctx) {
      ctx.filter = 'blur(2.5px)';
    }
    ctx.drawImage(scratchCanvas, 0, 0, width, height);
    if ('filter' in ctx) {
      ctx.filter = 'none';
    }
    ctx.restore();

    scratchCanvas.width = 0;
    scratchCanvas.height = 0;
  }

  // 1. Strato nuvoloso reale all'infrarosso satellitare RainViewer
  await projectLayerTiles(targetSatellite, '0/0_0.png', 0.42);
  // 2. Strato precipitazioni radar Doppler reale RainViewer sfumato e morbido
  await projectLayerTiles(targetRadar, '2/1_1.png', 0.62);

  return {
    radarFrame: targetRadar,
    satelliteFrame: targetSatellite,
    radarTimestamp: targetRadar?.time ?? null,
    satelliteTimestamp: targetSatellite?.time ?? null,
    tilesLoaded,
    source: data.source || 'RainViewer International Doppler Radar Network',
  };
}

/**
 * Disegna i veri tile RainViewer più recenti (retrocompatibile).
 */
export async function composeRainViewerGlobeCanvas(
  canvas: HTMLCanvasElement,
  providedData?: RainViewerRadarPayload | null
): Promise<ComposedGlobeRadarResult> {
  const data = providedData ?? (await getRainViewerRadarData());
  return composeRainViewerFrameCanvas(canvas, data);
}
