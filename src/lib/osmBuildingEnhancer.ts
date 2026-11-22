// OSM ARCHITECTURAL BUILDING & TERRAIN ENHANCER – HAVE2WANT PLUS
// Sostituisce le scatole piatte monocolore con:
// 1. Terreno Orografico Reale AWS Mapzen Terrarium DEM (maxzoom 15, CORS-enabled, gratuito)
// 2. Edifici parametrici guidati dai tag reali OpenStreetMap (building:colour, building:material,
//    roof:shape, roof:colour, roof:height, building:levels, render_min_height)
// 3. Basamento architettonico (plinth) + coronamento tetti distinti dalle facciate

export const TERRARIUM_DEM_SOURCE_CONFIG = {
  type: 'raster-dem' as const,
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium' as const,
  tileSize: 256,
  maxzoom: 15,
  attribution: 'Terrain © Mapzen / AWS Open Data (SRTM, NED)',
};

export interface OsmArchitecturalStyleMode {
  mode: 'satellite' | 'vector3d' | 'night3d';
  showBuildings3D: boolean;
}

export function buildOsmBuildingLayers({ mode, showBuildings3D }: OsmArchitecturalStyleMode): any[] {
  const isSatellite = mode === 'satellite';
  const isNight = mode === 'night3d';
  const visibility = showBuildings3D ? 'visible' : 'none';

  const safeMinHeight: any = [
    'max',
    ['coalesce', ['get', 'render_min_height'], ['*', ['coalesce', ['get', 'building:min_level'], 0], 3.2], 0],
    0,
  ];

  // Altezza reale dai metadati OpenMapTiles o building:levels * 3.4m (mai zero sui palazzi censiti)
  const rawTotalHeight: any = [
    'coalesce',
    ['get', 'render_height'],
    ['*', ['coalesce', ['get', 'building:levels'], 3], 3.4],
    12,
  ];

  const roofHeightExpr: any = [
    'min',
    [
      'max',
      [
        'coalesce',
        ['get', 'roof:height'],
        ['case', ['in', ['coalesce', ['get', 'roof:shape'], 'flat'], ['literal', ['gabled', 'hipped', 'pyramidal', 'dome', 'pitched']]], 3.2, 0.9],
      ],
      0.8,
    ],
    ['*', rawTotalHeight, 0.35],
  ];

  const facadeTopHeight: any = ['max', ['-', rawTotalHeight, roofHeightExpr], ['+', safeMinHeight, 4.5]];
  const roofTopHeight: any = ['max', rawTotalHeight, ['+', facadeTopHeight, 0.8]];

  // Palette architettonica reale guidata da OSM `building:colour` e `building:material`
  const materialFallbackColor: any = [
    'match',
    ['coalesce', ['get', 'building:material'], ''],
    'brick', isNight ? '#5c332b' : '#b86b52',
    'stone', isNight ? '#475569' : '#d6cfc2',
    'limestone', isNight ? '#4b5563' : '#e5dfd3',
    'marble', isNight ? '#64748b' : '#edeae2',
    'glass', isNight ? '#0f4c75' : '#5ba4cf',
    'concrete', isNight ? '#334155' : '#aeb8c4',
    'wood', isNight ? '#4a3525' : '#9c714e',
    'plaster', isNight ? '#3e4c5e' : '#e8dfd1',
    // Fallback per fascia altimetrica architettonica sobria (zero blocchi fluo artificiali)
    [
      'interpolate',
      ['linear'],
      rawTotalHeight,
      0, isNight ? '#1e293b' : isSatellite ? '#dcd6cb' : '#cfd6de',
      14, isNight ? '#283548' : isSatellite ? '#cfc6b8' : '#b9c3cf',
      35, isNight ? '#1e3a5f' : isSatellite ? '#9fb3c8' : '#8ea6bd',
      90, isNight ? '#164e63' : isSatellite ? '#7395b5' : '#6389ad',
    ],
  ];

  const facadeColorExpr: any = [
    'coalesce',
    ['get', 'building:colour'],
    ['get', 'colour'],
    materialFallbackColor,
  ];

  const roofColorExpr: any = [
    'coalesce',
    ['get', 'roof:colour'],
    [
      'match',
      ['coalesce', ['get', 'roof:material'], ''],
      'roof_tiles', isNight ? '#5a2a22' : '#9e4733',
      'copper', isNight ? '#115e59' : '#2f857a',
      'slate', isNight ? '#1f2937' : '#475569',
      'metal', isNight ? '#334155' : '#64748b',
      'concrete', isNight ? '#334155' : '#94a3b8',
      [
        'case',
        ['in', ['coalesce', ['get', 'roof:shape'], 'flat'], ['literal', ['gabled', 'hipped', 'pyramidal', 'pitched']]],
        isNight ? '#5c2d24' : '#9b4a36',
        isNight ? '#0f172a' : '#64748b',
      ],
    ],
  ];

  const plinthColor = isNight ? '#0f172a' : '#6b7280';

  return [
    // 1. Basamento/Zoccolatura architettonica al piede dell'edificio
    {
      id: '3d-buildings-plinth',
      source: 'openmaptiles',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 14,
      filter: ['all', ['!=', ['get', 'hide_3d'], true], ['==', ['coalesce', ['get', 'render_min_height'], 0], 0]],
      layout: { visibility },
      paint: {
        'fill-extrusion-color': plinthColor,
        'fill-extrusion-base': 0,
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15, 1.4],
        'fill-extrusion-opacity': 0.94,
      },
    },
    // 2. Corpo facciata principale con materiali e colori OSM reali
    {
      id: '3d-buildings',
      source: 'openmaptiles',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 12,
      filter: ['!=', ['get', 'hide_3d'], true],
      layout: { visibility },
      paint: {
        'fill-extrusion-color': facadeColorExpr,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 0,
          13, facadeTopHeight,
          16, facadeTopHeight,
        ],
        'fill-extrusion-base': safeMinHeight,
        'fill-extrusion-opacity': isSatellite ? 0.92 : 0.95,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    // 3. Coronamento / Tetto architettonico distinto dalla facciata
    {
      id: '3d-buildings-roofs',
      source: 'openmaptiles',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 13.5,
      filter: ['!=', ['get', 'hide_3d'], true],
      layout: { visibility },
      paint: {
        'fill-extrusion-color': roofColorExpr,
        'fill-extrusion-base': facadeTopHeight,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13.5, facadeTopHeight,
          14.5, roofTopHeight,
        ],
        'fill-extrusion-opacity': 0.96,
        'fill-extrusion-vertical-gradient': false,
      },
    },
  ];
}
