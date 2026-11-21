import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Compass,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Pause,
  MapPin,
  X,
  MessageCircle,
  Handshake,
  Navigation,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Globe,
  Coins,
  Languages,
  Clock,
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';
import WorldNavigatorModal from './WorldNavigatorModal';
import LocalCurrencyModal from './LocalCurrencyModal';
import LiveWeatherModal from './LiveWeatherModal';
import WeatherAtmosphereOverlay from './WeatherAtmosphereOverlay';
import StreetView360Modal from './StreetView360Modal';
import { getRealtimeWeather } from '@/lib/weatherService';
import { getExternalServicesForArea } from '@/lib/externalGatewayServices';
import {
  formatLocalPrice,
  lookupLocationFromCoords,
  getLocalTimeString,
  WORLD_COUNTRIES
} from '@/lib/worldAtlas';
import { getListingOriginBadge } from '@/lib/listingOrigin';
import { classifyMerchantPin } from '@/lib/merchantPinClassifier';
import { PI_REAL_PRICE_EUR } from '@/lib/piRealPriceService';

// Generatore procedurale di edifici 3D volumetrici realistici ad alta definizione
// Garantisce la presenza immediata di palazzi 3D volumetrici estrusi in qualsiasi città o quartiere
function generateProceduralBuildingsGeoJSON(centerLat, centerLng) {
  const features = [];
  const rows = 11;
  const cols = 11;
  const stepLat = 0.00062;
  const stepLng = 0.00092;
  const sizeLat = 0.00045;
  const sizeLng = 0.00068;

  let id = 1;
  for (let r = -Math.floor(rows / 2); r <= Math.floor(rows / 2); r++) {
    for (let c = -Math.floor(cols / 2); c <= Math.floor(cols / 2); c++) {
      // Lascia spazio per i viali principali e le piazze centrali
      if ((r % 4 === 0 && Math.abs(c) <= 2) || (c % 4 === 0 && Math.abs(r) <= 2)) continue;

      const jitterLat = Math.sin(id * 2.1) * 0.00010;
      const jitterLng = Math.cos(id * 2.7) * 0.00014;
      const bLat = centerLat + r * stepLat + jitterLat;
      const bLng = centerLng + c * stepLng + jitterLng;

      // Altezze volumetriche variabili realistiche: palazzi da 18m fino a grattacieli di 85m
      const isCorner = Math.abs(r) >= 3 || Math.abs(c) >= 3;
      const baseH = isCorner ? 22 + Math.abs(Math.sin(id * 3.1)) * 35 : 32 + Math.abs(Math.sin(id * 2.4)) * 52;
      const height = Math.round(id % 5 === 0 ? baseH + 25 : baseH);
      const isCommercial = id % 3 === 0;

      features.push({
        type: 'Feature',
        id: id++,
        properties: {
          render_height: height,
          render_min_height: 0,
          name: isCommercial ? `Complesso Commerciale 3D #${id}` : `Edificio Residenziale 3D #${id}`,
          building_type: isCommercial ? 'commercial' : 'residential',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [bLng - sizeLng / 2, bLat - sizeLat / 2],
            [bLng + sizeLng / 2, bLat - sizeLat / 2],
            [bLng + sizeLng / 2, bLat + sizeLat / 2],
            [bLng - sizeLng / 2, bLat + sizeLat / 2],
            [bLng - sizeLng / 2, bLat - sizeLat / 2],
          ]],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export default function Urbano3D({
  centroLat = 41.8902,
  centroLng = 12.4922,
  lat,
  lng,
  countryName = 'Roma',
  placeData = null,
  onLocationChange,
  filter = 'ALL',
  filteredListings = [],
  onBazarSelect,
  onSelectListing,
  selectedListing,
  onHandshake,
  onBackToGlobe,
  sponsoredBusinesses = [],
  onOpenVoiceChat = () => {},
  onSelectExternalPlace = () => {},
  isFullscreen = false,
  onToggleFullscreen = null,
}) {
  const effectiveLat = typeof centroLat === 'number' && !isNaN(centroLat) ? centroLat : (typeof lat === 'number' ? lat : 41.8902);
  const effectiveLng = typeof centroLng === 'number' && !isNaN(centroLng) ? centroLng : (typeof lng === 'number' ? lng : 12.4922);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const orbitIntervalRef = useRef(null);

  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [pitch, setPitch] = useState(58); // 58° = Prospettiva 3D volumetrica reale per visualizzare gli edifici che sorgono
  const [bearing, setBearing] = useState(15);
  const [is3D, setIs3D] = useState(true); // 3D attivo di default
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState('vector3d'); // DEFAULT: 'vector3d' con confini nitidi
  const [showBuildings3D, setShowBuildings3D] = useState(true); // EDIFICI 3D SEMPRE ATTIVI DI DEFAULT
  const [showTerrain3D, setShowTerrain3D] = useState(false);
  const [selectedCity, setSelectedCity] = useState(countryName || 'Roma');
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherEffectsEnabled, setWeatherEffectsEnabled] = useState(true);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeProfile, setRouteProfile] = useState('driving');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Stato luogo corrente con Nazione, Lingua, Valuta e Fuso Orario
  const [currentPlace, setCurrentPlace] = useState(() => {
    if (placeData) return placeData;
    const isIt = countryName === 'Italia';
    return {
      name: countryName || 'Territorio',
      displayName: countryName || 'Territorio 3D',
      countryName: countryName || 'Mondo',
      countryCode: isIt ? 'IT' : 'GLOBO',
      stateOrRegion: isIt ? 'Lazio' : '',
      flag: isIt ? '🇮🇹' : '🌍',
      language: isIt
        ? { code: 'it-IT', name: 'Italiano', greeting: 'Benvenuto in Italia!' }
        : { code: 'und', name: 'Lingua Locale', greeting: `Benvenuto in ${countryName || 'Have2Want'}!` },
      currency: isIt
        ? { code: 'EUR', symbol: '€', name: 'Euro', piRate: PI_REAL_PRICE_EUR }
        : { code: 'PI', symbol: 'π', name: 'Pi Coin', piRate: 1.0 },
      timezone: isIt ? 'Europe/Rome' : 'UTC',
      greeting: `Benvenuto in ${countryName || 'Have2Want'}!`
    };
  });

  // Carica i dati meteo in tempo reale sincronizzati con il fuso orario del luogo
  useEffect(() => {
    let isMounted = true;
    getRealtimeWeather(effectiveLat, effectiveLng).then((w) => {
      if (isMounted && w) {
        setWeatherData(w);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [effectiveLat, effectiveLng, selectedCity, currentPlace?.name]);

  // Sincronizza se il parent passa nuovi placeData
  useEffect(() => {
    if (placeData) {
      setCurrentPlace(placeData);
      setSelectedCity(placeData.name || countryName);
    }
  }, [placeData, countryName]);

  // Normalizza gli annunci con coordinate visibili e supporto dedicato a ogni città
  const annunci = useMemo(() => {
    // Se il filtro è LIBRI_SCOLASTICI, genera punti di scambio libri scolastici usati attivi per la città corrente
    if (filter === 'LIBRI_SCOLASTICI' || filter === 'LIBRI') {
      const schoolBooksForCity = [
        {
          id: `book_${selectedCity}_1`,
          title: `Scambio Testi 3ª Media: Matematica, Scienze e Storia (${selectedCity})`,
          category: 'libri_scuola_cultura',
          subcategory: 'scambio_libri_scolastici',
          action_type: 'baratto_scambio',
          intent: 'BARATTO_SCAMBIO',
          price: 'Scambio con 1° Superiore o 0.5 π',
          piPrice: 0.5,
          author: `@famiglia_${selectedCity.toLowerCase().replace(/\s+/g, '')}`,
          city: selectedCity,
          privacy_mode_active: false,
          lat: effectiveLat + 0.0014,
          lng: effectiveLng + 0.0016,
          have_description: 'Testi 3ª Media in ottimo stato con copertine protettive',
          want_description: 'Libri 1° Superiore o 0.5 Pi Coin',
          isSchoolBook: true,
        },
        {
          id: `book_${selectedCity}_2`,
          title: `Manuali Liceo Scientifico (Fisica e Chimica Zanichelli) - ${selectedCity}`,
          category: 'libri_scuola_cultura',
          subcategory: 'scambio_libri_scolastici',
          action_type: 'baratto_scambio',
          intent: 'BARATTO_SCAMBIO',
          price: 'Scambio o 1.2 π',
          piPrice: 1.2,
          author: `@studente_${selectedCity.toLowerCase().replace(/\s+/g, '')}`,
          city: selectedCity,
          privacy_mode_active: true,
          lat: effectiveLat - 0.0012,
          lng: effectiveLng - 0.0014,
          have_description: 'Manuali biennio sottolineati solo a matita, completi di fascicoli',
          want_description: 'Testi 3° Anno o 1.2 Pi',
          isSchoolBook: true,
        },
        {
          id: `book_${selectedCity}_3`,
          title: `CERCO: Testo Inglese Cambridge B2 & Storia - ${selectedCity}`,
          category: 'libri_scuola_cultura',
          subcategory: 'scambio_libri_scolastici',
          action_type: 'acquisto_cerco',
          intent: 'ACQUISTO_CERCO',
          price: 'Cerco • Offro 1 π',
          piPrice: 1.0,
          author: `@chiara_liceo`,
          city: selectedCity,
          privacy_mode_active: false,
          lat: effectiveLat + 0.0009,
          lng: effectiveLng - 0.0022,
          have_description: 'Offro 1 Pi o ripetizioni di matematica di base',
          want_description: 'Testo Cambridge B2 4° anno liceo',
          isSchoolBook: true,
        },
        {
          id: `book_${selectedCity}_4`,
          title: `Blocco Libri 1ª Superiore Istituto Tecnico - ${selectedCity}`,
          category: 'libri_scuola_cultura',
          subcategory: 'scambio_libri_scolastici',
          action_type: 'vendo',
          intent: 'VENDO',
          price: '2.5 π (Intero Blocco)',
          piPrice: 2.5,
          author: `@genitori_solidali`,
          city: selectedCity,
          privacy_mode_active: false,
          lat: effectiveLat - 0.0017,
          lng: effectiveLng + 0.0018,
          have_description: 'Intero blocco 1° anno ITI integro',
          want_description: '2.5 Pi per acquisto libri 2° anno',
          isSchoolBook: true,
        },
        {
          id: `book_${selectedCity}_5`,
          title: `Dizionario Latino Castiglioni Mariotti + Antologia (${selectedCity})`,
          category: 'libri_scuola_cultura',
          subcategory: 'scambio_libri_scolastici',
          action_type: 'baratto_scambio',
          intent: 'BARATTO_SCAMBIO',
          price: 'Baratto con Dizionario Greco',
          piPrice: 0.8,
          author: `@lucia_classico`,
          city: selectedCity,
          privacy_mode_active: true,
          lat: effectiveLat + 0.0021,
          lng: effectiveLng - 0.0011,
          have_description: 'Dizionario perfetto per ginnasio e liceo classico',
          want_description: 'Vocabolario Greco antico Rocci o 0.8 Pi',
          isSchoolBook: true,
        },
      ];

      return schoolBooksForCity;
    }

    if (filteredListings && filteredListings.length > 0) {
      return filteredListings.slice(0, 15).map((item, idx) => {
        const offsetLat = (idx % 3 === 0 ? 0.0015 : idx % 3 === 1 ? -0.0012 : 0.0008) * (Math.floor(idx / 3) + 1);
        const offsetLng = (idx % 2 === 0 ? 0.0018 : -0.0015) * (Math.floor(idx / 2) + 1);
        const isSchool = item.category === 'libri_scuola_cultura' || item.subcategory === 'scambio_libri_scolastici';
        return {
          id: item.id || `ann_${idx}`,
          title: item.title || item.have_description || `Annuncio ${idx + 1}`,
          category: item.category || 'Generale',
          subcategory: item.subcategory,
          intent: item.intent || (item.action_type === 'vendo' ? 'VENDO' : item.action_type === 'acquisto_cerco' ? 'ACQUISTO_CERCO' : 'BARATTO_SCAMBIO'),
          action_type: item.action_type,
          price: item.piPrice ? `${item.piPrice} π` : (item.want_description || 'Scambio'),
          author: item.author?.name || item.owner_name || '@pioniere',
          city: item.city || item.locationArea || selectedCity,
          privacy_mode_active: Boolean(item.privacy_mode_active ?? (idx % 2 === 1)),
          lat: effectiveLat + offsetLat,
          lng: effectiveLng + offsetLng,
          isSchoolBook: isSchool,
          raw: item,
        };
      });
    }

    // Demo listings precaricati attorno alla coordinata se non ce ne sono
    return [
      {
        id: '1',
        title: `Libri Scolastici & Saggi (${selectedCity})`,
        category: 'libri_scuola_cultura',
        subcategory: 'scambio_libri_scolastici',
        intent: 'BARATTO_SCAMBIO',
        price: 'Scambio o 0.5 π',
        author: '@famiglia_pi',
        city: selectedCity,
        privacy_mode_active: false,
        lat: effectiveLat + 0.0012,
        lng: effectiveLng + 0.0015,
        isSchoolBook: true,
      },
      {
        id: '2',
        title: `Scambio Manuali Liceo & Medie (${selectedCity})`,
        category: 'libri_scuola_cultura',
        subcategory: 'scambio_libri_scolastici',
        intent: 'BARATTO_SCAMBIO',
        price: 'Baratto',
        author: '@chiara_studenti',
        city: selectedCity,
        privacy_mode_active: true,
        lat: effectiveLat - 0.0014,
        lng: effectiveLng - 0.0011,
        isSchoolBook: true,
      },
      {
        id: '3',
        title: `Smartphone Ricondizionato 5G (${selectedCity})`,
        category: 'Elettronica',
        intent: 'VENDO',
        price: '18 π',
        author: '@tech_pioneer',
        city: selectedCity,
        privacy_mode_active: false,
        lat: effectiveLat + 0.0008,
        lng: effectiveLng - 0.002,
      },
      {
        id: '4',
        title: `CERCO: Bicicletta per Studente (${selectedCity})`,
        category: 'Mobilita',
        intent: 'ACQUISTO_CERCO',
        price: 'Cerco • Offro 6 π',
        author: '@elena_bici',
        city: selectedCity,
        privacy_mode_active: true,
        lat: effectiveLat - 0.0018,
        lng: effectiveLng + 0.0019,
      },
    ];
  }, [filteredListings, effectiveLat, effectiveLng, selectedCity, filter]);

  // Se la prop selectedListing cambia dall'esterno, centra la mappa
  useEffect(() => {
    if (selectedListing && mapRef.current) {
      mapRef.current.flyTo({
        center: [effectiveLng, effectiveLat],
        zoom: 17,
        pitch: 65,
        duration: 1000,
      });
    }
  }, [selectedListing, effectiveLat, effectiveLng]);

  // Inizializzazione Mappa WebGL 3D ad alta definizione (Google Earth 3D, Google Maps 3D e Stradale HD)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Tile Raster Satellitari HD (Esri World Imagery)
    const esriSatelliteTiles = [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ];
    const esriRoadsTiles = [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    ];
    const esriPlacesTiles = [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    ];

    // Tile Stradali Esri World Street Map HD (Senza filigrana, Zero API key)
    const esriStreetTiles = [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    ];

    // Tile Notturne Esri Dark Gray Base (Notturno HD pulito, Zero filigrana)
    const esriDarkTiles = [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    ];
    const esriDarkLabelsTiles = [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    ];

    const isSatellite = mapStyleMode === 'satellite';
    const isVector3D = mapStyleMode === 'vector3d';
    const isNight3D = mapStyleMode === 'night3d';

    let mapStyle;

    const proceduralBuildingsSource = {
      type: 'geojson',
      data: generateProceduralBuildingsGeoJSON(effectiveLat, effectiveLng),
    };

    const sourcesConfig = isSatellite
      ? {
          'satellite-base': {
            type: 'raster',
            tiles: esriSatelliteTiles,
            tileSize: 256,
            maxzoom: 20,
            attribution: '© Esri, Maxar',
          },
          'roads-overlay': {
            type: 'raster',
            tiles: esriRoadsTiles,
            tileSize: 256,
            maxzoom: 20,
          },
          'openmaptiles': {
            type: 'vector',
            url: 'https://tiles.openfreemap.org/planet',
          },
          'procedural-buildings': proceduralBuildingsSource,
          'places-overlay': {
            type: 'raster',
            tiles: esriPlacesTiles,
            tileSize: 256,
            maxzoom: 20,
          },
          'terrain-dem': {
            type: 'raster-dem',
            tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
            encoding: 'mapbox',
            tileSize: 256,
            maxzoom: 12,
          },
        }
      : isVector3D
      ? {
          'vector-base': {
            type: 'raster',
            tiles: esriStreetTiles,
            tileSize: 256,
            maxzoom: 19,
            attribution: '© Esri, HERE, Garmin, USGS, OpenStreetMap',
          },
          'openmaptiles': {
            type: 'vector',
            url: 'https://tiles.openfreemap.org/planet',
          },
          'procedural-buildings': proceduralBuildingsSource,
          'terrain-dem': {
            type: 'raster-dem',
            tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
            encoding: 'mapbox',
            tileSize: 256,
            maxzoom: 12,
          },
        }
      : {
          'night-base': {
            type: 'raster',
            tiles: esriDarkTiles,
            tileSize: 256,
            maxzoom: 19,
            attribution: '© Esri, DeLorme, NAVTEQ',
          },
          'night-labels': {
            type: 'raster',
            tiles: esriDarkLabelsTiles,
            tileSize: 256,
            maxzoom: 19,
          },
          'openmaptiles': {
            type: 'vector',
            url: 'https://tiles.openfreemap.org/planet',
          },
          'procedural-buildings': proceduralBuildingsSource,
          'terrain-dem': {
            type: 'raster-dem',
            tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
            encoding: 'mapbox',
            tileSize: 256,
            maxzoom: 12,
          },
        };

    const procedural3DLayer = {
      id: 'procedural-3d-buildings-layer',
      source: 'procedural-buildings',
      type: 'fill-extrusion',
      minzoom: 12,
      layout: {
        visibility: showBuildings3D ? 'visible' : 'none',
      },
      paint: {
        'fill-extrusion-color': isNight3D
          ? [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              15, '#0f172a',
              30, '#0369a1',
              50, '#0284c7',
              75, '#38bdf8',
            ]
          : isSatellite
          ? [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              15, '#64748b',
              30, '#0284c7',
              50, '#38bdf8',
              75, '#f8fafc',
            ]
          : [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              15, '#94a3b8',
              30, '#0284c7',
              50, '#0ea5e9',
              75, '#38bdf8',
            ],
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 24],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.88,
        'fill-extrusion-vertical-gradient': true,
      },
    };

    const layersConfig = isSatellite
      ? [
          {
            id: 'satellite-base-layer',
            type: 'raster',
            source: 'satellite-base',
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'roads-overlay-layer',
            type: 'raster',
            source: 'roads-overlay',
            minzoom: 4,
            maxzoom: 20,
            paint: { 'raster-opacity': 0.75 },
          },
          {
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 12,
            layout: {
              visibility: showBuildings3D ? 'visible' : 'none',
            },
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0, '#94a3b8',
                15, '#64748b',
                35, '#0ea5e9',
                80, '#38bdf8',
                150, '#f8fafc',
              ],
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 0,
                13, ['coalesce', ['get', 'render_height'], 18],
                16, ['coalesce', ['get', 'render_height'], 24],
              ],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.85,
              'fill-extrusion-vertical-gradient': true,
            },
          },
          procedural3DLayer,
          {
            id: 'places-overlay-layer',
            type: 'raster',
            source: 'places-overlay',
            minzoom: 2,
            maxzoom: 20,
            paint: { 'raster-opacity': 0.95 },
          },
        ]
      : isVector3D
      ? [
          {
            id: 'vector-base-layer',
            type: 'raster',
            source: 'vector-base',
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 12,
            layout: {
              visibility: showBuildings3D ? 'visible' : 'none',
            },
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0, '#e2e8f0',
                15, '#cbd5e1',
                35, '#94a3b8',
                70, '#0ea5e9',
                140, '#0284c7',
              ],
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 0,
                13, ['coalesce', ['get', 'render_height'], 18],
                16, ['coalesce', ['get', 'render_height'], 26],
              ],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.88,
              'fill-extrusion-vertical-gradient': true,
            },
          },
          procedural3DLayer,
        ]
      : [
          {
            id: 'night-base-layer',
            type: 'raster',
            source: 'night-base',
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 12,
            layout: {
              visibility: showBuildings3D ? 'visible' : 'none',
            },
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0, '#0f172a',
                15, '#1e293b',
                40, '#0369a1',
                80, '#06b6d4',
                160, '#38bdf8',
              ],
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 0,
                13, ['coalesce', ['get', 'render_height'], 18],
                16, ['coalesce', ['get', 'render_height'], 26],
              ],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.90,
              'fill-extrusion-vertical-gradient': true,
            },
          },
          procedural3DLayer,
          {
            id: 'night-labels-layer',
            type: 'raster',
            source: 'night-labels',
            minzoom: 1,
            maxzoom: 20,
            paint: { 'raster-opacity': 0.95 },
          },
        ];

    mapStyle = {
      version: 8,
      sources: sourcesConfig,
      layers: layersConfig,
    };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [effectiveLng, effectiveLat],
      zoom: 16.4, // Vista a livello strada: edifici 3D immediatamente visibili con strade e piazze
      pitch: 58,  // Prospettiva 3D inclinata
      bearing: 15,
      minPitch: 0,
      maxPitch: 85,
      dragRotate: true,
      touchPitch: true,
      touchZoomRotate: true,
      doubleClickZoom: true,
      dragPan: true,
      scrollZoom: true,
      minZoom: 1.5,
      maxZoom: 20,
      antialias: true,
    });

    mapRef.current = map;

    const setup3DEnvironment = () => {
      try {
        // Se siamo in modalità Liberty vettoriale, aggiungiamo la sorgente DEM se non presente
        if (isVector3D && !map.getSource('terrain-dem')) {
          map.addSource('terrain-dem', {
            type: 'raster-dem',
            tiles: ['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'],
            encoding: 'mapbox',
            tileSize: 256,
            maxzoom: 12,
          });
        }

        // 1. Rilievo Orografico 3D Reale (DEM 2.2x)
        if (showTerrain3D && map.getSource('terrain-dem')) {
          map.setTerrain({ source: 'terrain-dem', exaggeration: 2.2 });
        }

        // 2. Luce Direzionale 3D (Crea ombre realistiche sulle facciate e sui tetti)
        map.setLight({
          anchor: 'viewport',
          color: '#ffffff',
          intensity: 0.7,
          position: [1.5, 210, 50],
        });

        // 3. Atmosfera e Orizzonte Aereo Blu Profondo Google Earth (Senza foschia sbiancante al suolo)
        if (typeof map.setSky === 'function') {
          map.setSky({
            'sky-color': isSatellite ? '#0284c7' : '#0369a1',
            'sky-horizon-blend': 0.8,
            'horizon-color': isSatellite ? '#38bdf8' : '#60a5fa',
            'horizon-fog-blend': 0.3,
            'fog-color': isSatellite ? '#0c4a6e' : '#082f49',
            'fog-ground-blend': 0.02, // Quasi zero nebbia al suolo per massima nitidezza fotografica e colori reali
          });
        }
      } catch (e) {
        console.warn('Configurazione 3D notice:', e);
      }
    };

    map.on('load', setup3DEnvironment);
    map.on('styledata', setup3DEnvironment);

    map.on('moveend', () => {
      try {
        const c = map.getCenter();
        const src = map.getSource('procedural-buildings');
        if (src && typeof src.setData === 'function') {
          src.setData(generateProceduralBuildingsGeoJSON(c.lat, c.lng));
        }
      } catch {
        // non-blocking
      }
    });

    map.on('pitch', () => {
      const currentPitch = Math.round(map.getPitch());
      setPitch(currentPitch);
      setIs3D(currentPitch > 10);
    });

    map.on('rotate', () => {
      setBearing(Math.round(map.getBearing()));
    });

    // ResizeObserver per aggiornare costantemente il viewport WebGL
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }
    requestAnimationFrame(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 200);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (orbitIntervalRef.current) clearInterval(orbitIntervalRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyleMode]);

  // Gestione dinamica visibilità Palazzi 3D
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    try {
      const visibility = showBuildings3D ? 'visible' : 'none';
      if (map.getLayer('3d-buildings')) {
        map.setLayoutProperty('3d-buildings', 'visibility', visibility);
      }
      if (map.getLayer('procedural-3d-buildings-layer')) {
        map.setLayoutProperty('procedural-3d-buildings-layer', 'visibility', visibility);
      }
      if (map.getLayer('building-3d')) {
        map.setLayoutProperty('building-3d', 'visibility', visibility);
      }
    } catch (e) {
      console.warn('Toggle palazzi 3D error:', e);
    }
  }, [showBuildings3D]);

  // Gestione dinamica visibilità Terreno DEM 3D
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    try {
      if (showTerrain3D && map.getSource('terrain-dem')) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: 2.2 });
      } else {
        map.setTerrain(null);
      }
    } catch (e) {
      console.warn('Toggle terreno 3D error:', e);
    }
  }, [showTerrain3D]);

  // Aggiorna posizione quando cambiano le coordinate del centro
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [effectiveLng, effectiveLat],
        zoom: 16.2, // Quota urbana 3D: edifici volumetrici e strade dettagliate
        pitch: 58,  // Prospettiva 3D volumetrica
        bearing: 15,
        duration: 1200,
        essential: true,
      });
    }
  }, [effectiveLat, effectiveLng]);

  // Renderizza i Marker interattivi sulla mappa
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Pulisci vecchi marker
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    annunci.forEach((item) => {
      // Elemento DOM per il punto (Ingrandito ed Accentuato ad Alta Visibilità)
      const el = document.createElement('div');
      el.className = 'group cursor-pointer select-none';
      el.style.position = 'relative';
      el.style.width = '38px';
      el.style.height = '38px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';

      const isBook = Boolean(item.isSchoolBook);
      const isVendo = item.intent === 'VENDO' || item.action_type === 'vendo';
      const isBaratto = item.intent === 'BARATTO_SCAMBIO' || item.action_type === 'baratto_scambio';
      const isCerco = item.intent === 'ACQUISTO_CERCO' || item.intent === 'CERCO' || item.action_type === 'acquisto_cerco';

      const themeColor = isBook
        ? 'rgba(245, 158, 11, 0.7)'
        : isVendo
        ? 'rgba(16, 185, 129, 0.7)'
        : isBaratto
        ? 'rgba(245, 158, 11, 0.7)'
        : isCerco
        ? 'rgba(14, 165, 233, 0.7)'
        : 'rgba(16, 185, 129, 0.7)';

      // 1. Primo Alone Radar ad ampio raggio (ping fluido per visibilità dall'alto)
      const ring = document.createElement('div');
      ring.style.position = 'absolute';
      ring.style.inset = '-10px';
      ring.style.borderRadius = '50%';
      ring.style.backgroundColor = themeColor;
      ring.style.animation = 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite';
      ring.style.pointerEvents = 'none';

      // 2. Secondo Anello Radiante concentrico
      const ring2 = document.createElement('div');
      ring2.style.position = 'absolute';
      ring2.style.inset = '-4px';
      ring2.style.borderRadius = '50%';
      ring2.style.border = `2px solid ${themeColor}`;
      ring2.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
      ring2.style.pointerEvents = 'none';

      // 3. Punto centrale solido, ingrandito e brillante (diametro 30px con bordo bianco e shadow 3D)
      const dot = document.createElement('div');
      dot.style.position = 'relative';
      dot.style.width = '30px';
      dot.style.height = '30px';
      dot.style.borderRadius = '50%';
      dot.style.background = isBook
        ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
        : isVendo
        ? 'linear-gradient(135deg, #10b981, #047857)'
        : isBaratto
        ? 'linear-gradient(135deg, #f59e0b, #b45309)'
        : isCerco
        ? 'linear-gradient(135deg, #0ea5e9, #0369a1)'
        : item.privacy_mode_active
        ? 'linear-gradient(135deg, #f59e0b, #b45309)'
        : 'linear-gradient(135deg, #10b981, #047857)';
      dot.style.border = '3px solid #ffffff';
      dot.style.boxShadow = `0 6px 18px rgba(0,0,0,0.85), 0 0 14px ${themeColor}`;
      dot.style.display = 'flex';
      dot.style.alignItems = 'center';
      dot.style.justifyContent = 'center';
      dot.style.color = '#ffffff';
      dot.style.fontSize = isBook ? '14px' : '13px';
      dot.style.fontWeight = '900';
      dot.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease';

      if (isBook) {
        dot.innerHTML = '📖';
      } else if (item.privacy_mode_active) {
        dot.innerHTML = '🔒';
      } else if (isBaratto) {
        dot.innerHTML = '🔄';
      } else if (isCerco) {
        dot.innerHTML = '🔍';
      } else {
        dot.innerHTML = '●';
      }

      // 4. Etichetta / Tooltip Flottante al Passaggio del Mouse (Grande e ad Altissima Leggibilità)
      const tooltip = document.createElement('div');
      tooltip.style.position = 'absolute';
      tooltip.style.bottom = '125%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.padding = '7px 14px';
      tooltip.style.borderRadius = '12px';
      tooltip.style.backgroundColor = '#05070e';
      tooltip.style.border = `2px solid ${themeColor || '#00ff66'}`;
      tooltip.style.color = '#ffffff';
      tooltip.style.fontSize = '13px';
      tooltip.style.fontWeight = '900';
      tooltip.style.letterSpacing = '0.02em';
      tooltip.style.whiteSpace = 'nowrap';
      tooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.9), 0 0 15px rgba(0,255,102,0.3)';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.opacity = '0';
      tooltip.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      tooltip.style.zIndex = '40';

      const origin = getListingOriginBadge(item.raw || item);
      const badgePrefix = origin.isExternal
        ? `[🌐 ${origin.sublabel || 'Esterno'}] `
        : origin.isDemo
        ? `[🧪 ${origin.label || 'Di prova'}] `
        : '';

      tooltip.innerText = `${badgePrefix}${item.title} (${item.price || (item.piPrice ? `${item.piPrice} π` : 'Scambio')})`;

      el.appendChild(ring);
      el.appendChild(ring2);
      el.appendChild(dot);
      el.appendChild(tooltip);

      el.addEventListener('mouseenter', () => {
        dot.style.transform = 'scale(1.35)';
        dot.style.boxShadow = `0 8px 24px rgba(0,0,0,0.95), 0 0 20px ${themeColor}`;
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateX(-50%) translateY(-3px)';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.transform = 'scale(1)';
        dot.style.boxShadow = `0 6px 18px rgba(0,0,0,0.85), 0 0 14px ${themeColor}`;
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateX(-50%)';
      });

      // Al click: centra la mappa e apre direttamente la pagina/pannello delle inserzioni
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onBazarSelect) onBazarSelect(item.raw || item);
        if (onSelectListing) onSelectListing(item.raw || item);

        // Centra leggermente sopra al punto
        map.easeTo({
          center: [item.lng, item.lat],
          zoom: Math.max(map.getZoom(), 17),
          duration: 500,
        });
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([item.lng, item.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // RENDER MARKER COMMERCIANTI SECONDO GRAMMATICA A 3 LIVELLI
    // 1. Viola e oro lampeggiante (Accetta Pi)
    // 2. Oro puro (Solo Vetrina / Pubblicità)
    // 3. Doppio anello concentrico (Accetta Pi + Vetrina / Pubblicità)
    if (Array.isArray(sponsoredBusinesses)) {
      sponsoredBusinesses.forEach((biz, idx) => {
        const bizLat = biz.lat || (effectiveLat + (idx === 0 ? 0.002 : -0.002) + (Math.sin(idx) * 0.001));
        const bizLng = biz.lng || (effectiveLng + (idx === 0 ? 0.0025 : -0.0015) + (Math.cos(idx) * 0.001));
        const pinType = classifyMerchantPin(biz);

        const el = document.createElement('div');
        el.className = 'group cursor-pointer select-none';
        el.style.position = 'relative';
        el.style.width = '46px';
        el.style.height = '46px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.zIndex = '28';

        // Anello / Alone esterno
        if (pinType.type === 'DOUBLE_RING') {
          // DOPPIO ANELLO CONCENTRICO: Oro esterno + Viola interno
          const outerRing = document.createElement('div');
          outerRing.style.position = 'absolute';
          outerRing.style.inset = '-8px';
          outerRing.style.borderRadius = '50%';
          outerRing.style.border = '2.5px solid #ffd700';
          outerRing.style.boxShadow = '0 0 16px rgba(255, 215, 0, 0.7)';
          outerRing.style.animation = 'ping 2.6s cubic-bezier(0, 0, 0.2, 1) infinite';
          outerRing.style.pointerEvents = 'none';

          const innerRing = document.createElement('div');
          innerRing.style.position = 'absolute';
          innerRing.style.inset = '-3px';
          innerRing.style.borderRadius = '50%';
          innerRing.style.border = '2px solid #a855f7';
          innerRing.style.boxShadow = '0 0 10px rgba(168, 85, 247, 0.6)';
          innerRing.style.pointerEvents = 'none';

          el.appendChild(outerRing);
          el.appendChild(innerRing);
        } else if (pinType.type === 'PI_ACCEPTED') {
          // VIOLA E ORO LAMPEGGIANTE (Circuito Pi Coin)
          const ring = document.createElement('div');
          ring.style.position = 'absolute';
          ring.style.inset = '-6px';
          ring.style.borderRadius = '50%';
          ring.style.backgroundColor = 'rgba(168, 85, 247, 0.4)';
          ring.style.border = '2px solid #ffd700';
          ring.style.animation = 'ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite';
          ring.style.pointerEvents = 'none';
          el.appendChild(ring);
        } else {
          // ORO PURO (Solo Pubblicità / Vetrina)
          const ring = document.createElement('div');
          ring.style.position = 'absolute';
          ring.style.inset = '-6px';
          ring.style.borderRadius = '50%';
          ring.style.backgroundColor = 'rgba(245, 158, 11, 0.4)';
          ring.style.border = '2px solid #ffd700';
          ring.style.animation = 'ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite';
          ring.style.pointerEvents = 'none';
          el.appendChild(ring);
        }

        // Badge centrale sagomato
        const dot = document.createElement('div');
        dot.style.position = 'relative';
        dot.style.width = '36px';
        dot.style.height = '36px';
        dot.style.borderRadius = '50%';
        dot.style.display = 'flex';
        dot.style.alignItems = 'center';
        dot.style.justifyContent = 'center';
        dot.style.fontSize = '16px';
        dot.style.fontWeight = '900';
        dot.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';

        if (pinType.type === 'DOUBLE_RING') {
          dot.style.background = 'linear-gradient(135deg, #7c3aed 0%, #d97706 100%)';
          dot.style.border = '3px solid #ffd700';
          dot.style.boxShadow = '0 6px 20px rgba(0,0,0,0.9), 0 0 16px rgba(255, 215, 0, 0.9)';
          dot.innerHTML = '👑';
        } else if (pinType.type === 'PI_ACCEPTED') {
          dot.style.background = 'linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)';
          dot.style.border = '2.5px solid #ffd700';
          dot.style.boxShadow = '0 6px 20px rgba(0,0,0,0.8), 0 0 14px rgba(168, 85, 247, 0.8)';
          dot.innerHTML = '🪙';
        } else {
          dot.style.background = 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)';
          dot.style.border = '2.5px solid #ffffff';
          dot.style.boxShadow = '0 6px 20px rgba(0,0,0,0.8), 0 0 14px rgba(251, 191, 36, 0.8)';
          dot.innerHTML = '📢';
        }

        // Tooltip fluttuante informativo
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '125%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.padding = '7px 14px';
        tooltip.style.borderRadius = '12px';
        tooltip.style.backgroundColor = '#05070e';
        tooltip.style.border = `2px solid ${pinType.type === 'DOUBLE_RING' ? '#ffd700' : pinType.type === 'PI_ACCEPTED' ? '#a855f7' : '#f59e0b'}`;
        tooltip.style.color = '#ffffff';
        tooltip.style.fontSize = '12px';
        tooltip.style.fontWeight = '800';
        tooltip.style.letterSpacing = '0.02em';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.95)';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.15s ease';
        tooltip.style.zIndex = '40';

        const badgeLabel = pinType.type === 'DOUBLE_RING'
          ? '👑 DOPPIO ANELLO (Accetta Pi + Vetrina)'
          : pinType.type === 'PI_ACCEPTED'
          ? '🪙 ACCETTA PI NETWORK'
          : '📢 VETRINA PUBBLICITARIA';

        tooltip.innerHTML = `<span style="color:${pinType.badgeBg}; font-size:10px; display:block;">${badgeLabel}</span><strong>${biz.name}</strong> • ${biz.promo || biz.category || 'Esercizio Locale'}`;

        el.appendChild(dot);
        el.appendChild(tooltip);

        el.addEventListener('mouseenter', () => {
          dot.style.transform = 'scale(1.3)';
          tooltip.style.opacity = '1';
        });
        el.addEventListener('mouseleave', () => {
          dot.style.transform = 'scale(1)';
          tooltip.style.opacity = '0';
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedSponsor(biz);
          map.easeTo({
            center: [bizLng, bizLat],
            zoom: Math.max(map.getZoom(), 17.2),
            duration: 600,
          });
        });

        const bizMarker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([bizLng, bizLat])
          .addTo(map);

        markersRef.current.push(bizMarker);
      });
    }

    // RENDER PIN DIRETTO SERVIZI REALI (GATEWAY ESTERNO: SUPERMERCATI, VOLANTINI, NOTTE, LOCKER, SANITÀ)
    // Nessun database o spesa interna: solo link e navigatore nativo
    const externalServices = getExternalServicesForArea(effectiveLat, effectiveLng, selectedCity);
    externalServices.forEach((svc) => {
      const el = document.createElement('div');
      el.className = 'group cursor-pointer select-none';
      el.style.position = 'relative';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.zIndex = '22';

      // Cerchio con colore in base alla categoria
      const dot = document.createElement('div');
      dot.style.position = 'relative';
      dot.style.width = '28px';
      dot.style.height = '28px';
      dot.style.borderRadius = '50%';
      dot.style.border = '2px solid #ffffff';
      dot.style.boxShadow = '0 4px 14px rgba(0,0,0,0.7)';
      dot.style.display = 'flex';
      dot.style.alignItems = 'center';
      dot.style.justifyContent = 'center';
      dot.style.fontSize = '12px';
      dot.style.transition = 'transform 0.2s ease';

      if (svc.category === 'supermarket_flyer') {
        dot.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        dot.innerHTML = '🛒';
      } else if (svc.category === 'nightlife') {
        dot.style.background = 'linear-gradient(135deg, #a855f7, #6b21a8)';
        dot.innerHTML = '🎉';
      } else if (svc.category === 'event_fair') {
        dot.style.background = 'linear-gradient(135deg, #ec4899, #be185d)';
        dot.innerHTML = '🎪';
      } else if (svc.category === 'locker') {
        dot.style.background = 'linear-gradient(135deg, #10b981, #047857)';
        dot.innerHTML = '📦';
      } else {
        dot.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
        dot.innerHTML = '⚕️';
      }

      // Tooltip (Grande e ad Altissima Leggibilità)
      const tooltip = document.createElement('div');
      tooltip.style.position = 'absolute';
      tooltip.style.bottom = '125%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.padding = '7px 14px';
      tooltip.style.borderRadius = '12px';
      tooltip.style.backgroundColor = '#05070e';
      tooltip.style.border = '2px solid #38bdf8';
      tooltip.style.color = '#ffffff';
      tooltip.style.fontSize = '13px';
      tooltip.style.fontWeight = '900';
      tooltip.style.letterSpacing = '0.02em';
      tooltip.style.whiteSpace = 'nowrap';
      tooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.9), 0 0 15px rgba(56,189,248,0.3)';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.opacity = '0';
      tooltip.style.transition = 'opacity 0.15s ease';
      tooltip.style.zIndex = '40';
      tooltip.innerText = `${svc.name} (${svc.categoryLabel})`;

      el.appendChild(dot);
      el.appendChild(tooltip);

      el.addEventListener('mouseenter', () => {
        dot.style.transform = 'scale(1.25)';
        tooltip.style.opacity = '1';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.transform = 'scale(1)';
        tooltip.style.opacity = '0';
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectExternalPlace) onSelectExternalPlace(svc);
      });

      const svcMarker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([svc.lng, svc.lat])
        .addTo(map);

      markersRef.current.push(svcMarker);
    });
  }, [annunci, sponsoredBusinesses, onBazarSelect, onSelectListing, onSelectExternalPlace, selectedCity, effectiveLat, effectiveLng]);

  // Gestione Rotazione Automatica 360°
  useEffect(() => {
    if (isOrbiting) {
      orbitIntervalRef.current = setInterval(() => {
        if (mapRef.current) {
          const currentBearing = mapRef.current.getBearing();
          mapRef.current.setBearing((currentBearing + 0.6) % 360);
        }
      }, 40);
    } else if (orbitIntervalRef.current) {
      clearInterval(orbitIntervalRef.current);
      orbitIntervalRef.current = null;
    }
    return () => {
      if (orbitIntervalRef.current) clearInterval(orbitIntervalRef.current);
    };
  }, [isOrbiting]);

  // Commuta tra vista 2D piana ortogonale (0°) e vista 3D volumetrica (60°)
  const toggle2D3D = () => {
    if (!mapRef.current) return;
    if (pitch > 10) {
      // Passa a 2D Dritto
      mapRef.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 500,
      });
      setPitch(0);
      setBearing(0);
      setIs3D(false);
      toast.info('🗺️ Vista 2D Stradale Dritta (Dall\'alto, Nord in alto)');
    } else {
      // Passa a 3D Prospettiva Volumetrica
      mapRef.current.easeTo({
        pitch: 60,
        duration: 600,
      });
      setPitch(60);
      setIs3D(true);
      toast.success('🏢 Prospettiva 3D Volumetrica (Edifici ed estrusioni 3D)');
    }
  };

  // Cicla tra le prospettive (inclusa la vista 2D dritta a 0°)
  const cycle3DPerspective = () => {
    if (!mapRef.current) return;
    let nextPitch = 60;
    let label = 'Prospettiva 3D Volumetrica (60°)';
    if (pitch >= 65) {
      nextPitch = 0;
      label = 'Vista 2D Piana Dritta (0°)';
    } else if (pitch >= 45) {
      nextPitch = 75;
      label = 'Vista Skyline 3D Radente (75°)';
    } else if (pitch > 10) {
      nextPitch = 60;
      label = 'Prospettiva 3D Volumetrica (60°)';
    } else {
      nextPitch = 50;
      label = 'Prospettiva Aerea 3D (50°)';
    }
    mapRef.current.easeTo({
      pitch: nextPitch,
      duration: 600,
    });
    setPitch(nextPitch);
    setIs3D(nextPitch > 10);
    toast.success(`📐 ${label}`);
  };

  const toggle3D = () => {
    toggle2D3D();
  };

  // Resetta Bussola a Nord (0°)
  const resetCompass = () => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      bearing: 0,
      duration: 450,
    });
    setBearing(0);
    toast.info('🧭 Orientamento allineato a Nord (0°)');
  };

  // Raddrizza completamente la mappa (Nord 0° e Pitch 0°)
  const straightenMap = () => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 500,
    });
    setPitch(0);
    setBearing(0);
    setIs3D(false);
    toast.success('🧭 Mappa raddrizzata: Nord in alto, vista ortogonale piana');
  };

  // Zoom In / Out reattivo ed immediato
  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        zoom: Math.min(20, mapRef.current.getZoom() + 1.5),
        duration: 300,
      });
    }
  };
  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        zoom: Math.max(1.5, mapRef.current.getZoom() - 1.5),
        duration: 300,
      });
    }
  };

  // Volo su qualsiasi luogo nel mondo (Stato, Regione, Città o Paese)
  const handleSelectWorldPlace = (place) => {
    setCurrentPlace(place);
    setSelectedCity(place.name);
    setShowWorldModal(false);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [place.lng, place.lat],
        zoom: 16.5,
        pitch: 65,
        bearing: 25,
        duration: 2000,
        essential: true,
      });
      toast.success(`🏙️ Volo Satellitare 3D su ${place.name} (${place.countryName})!`, {
        description: `Lingua: ${place.language?.name || 'Locale'} • Valuta: ${place.currency?.code || 'EUR'} (${place.currency?.symbol || '€'})`,
      });
    }
    if (onLocationChange) {
      onLocationChange(place);
    }
  };

  // Geolocalizzazione utente con reverse-lookup della lingua e valuta locale
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalizzazione non supportata dal browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [uLng, uLat],
            zoom: 17,
            pitch: 65,
            duration: 1800,
          });
          toast.success('📍 Centrato sulla tua posizione attuale!');
        }
        lookupLocationFromCoords(uLat, uLng).then((place) => {
          setCurrentPlace(place);
          setSelectedCity(place.name);
          if (onLocationChange) onLocationChange(place);
        }).catch(() => {
          setSelectedCity('Mia Posizione');
        });
      },
      () => {
        toast.error('Impossibile rilevare la posizione GPS');
      }
    );
  };

  const handleCalculateRoute = async (destLat, destLng, destName, profileOverride) => {
    if (!mapRef.current) return;
    setIsCalculatingRoute(true);
    const effectiveProfile = profileOverride || routeProfile;
    try {
      const { calculateRealRoute } = await import('@/lib/routingService');
      const route = await calculateRealRoute(effectiveLat, effectiveLng, destLat, destLng, effectiveProfile);
      if (route) {
        setActiveRoute({ ...route, destinationName: destName, destinationLat: destLat, destinationLng: destLng });
        toast.success(`🧭 Percorso OSRM verso ${destName}: ${route.totalDistanceKm} km (${route.totalDurationMinutes} min)`);
        
        const map = mapRef.current;
        const geojsonData = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
        };

        if (map.getSource('real-route-source')) {
          map.getSource('real-route-source').setData(geojsonData);
        } else {
          map.addSource('real-route-source', {
            type: 'geojson',
            data: geojsonData,
          });
          map.addLayer({
            id: 'real-route-line',
            type: 'line',
            source: 'real-route-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#00ff66',
              'line-width': 6,
              'line-opacity': 0.9,
            },
          });
        }

        const bounds = new maplibregl.LngLatBounds();
        route.coordinates.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 60, duration: 800 });
      }
    } catch (err) {
      console.error('Errore calcolo percorso:', err);
      toast.error('Impossibile calcolare il percorso stradale');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    if (mapRef.current && mapRef.current.getSource('real-route-source')) {
      mapRef.current.getSource('real-route-source').setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0b1120] overflow-hidden select-none">
      {/* HUD PERCORSO STRADALE REALE OSRM */}
      {activeRoute && (
        <div className="absolute top-16 left-4 right-4 z-40 pointer-events-auto max-w-xl mx-auto bg-black/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/30">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>Verso: {activeRoute.destinationName}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-[#00ff66] font-mono border border-emerald-500/30">OSRM REALE</span>
              </div>
              <div className="text-[11px] text-zinc-300 font-bold mt-0.5">
                {activeRoute.totalDistanceKm} km • {activeRoute.totalDurationMinutes} min stimati
              </div>
              <div className="text-[10px] text-zinc-400 truncate max-w-xs mt-0.5">
                {activeRoute.steps?.[0]?.instruction || 'Procedi lungo il percorso'}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[
                  { id: 'driving', label: 'Auto' },
                  { id: 'walking', label: 'Piedi' },
                  { id: 'cycling', label: 'Bici' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setRouteProfile(p.id);
                      if (typeof activeRoute.destinationLat === 'number' && typeof activeRoute.destinationLng === 'number') {
                        handleCalculateRoute(activeRoute.destinationLat, activeRoute.destinationLng, activeRoute.destinationName, p.id);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-black border cursor-pointer transition-all ${
                      routeProfile === p.id
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowStreetView(true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow-md"
            >
              360°
            </button>
            <button
              type="button"
              onClick={handleClearRoute}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
              title="Chiudi percorso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* 1. LAYER MAPPA SATELLITARE WEBGL (FULL SCREEN) */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 bg-[#0b1120]" />

      {/* 1b. LAYER PARTICELLE METEO REALI TRASPARENTI (Pioggia fine, neve o nubi leggere senza oscurare la visuale 3D) */}
      <WeatherAtmosphereOverlay weather={weatherData} enabled={weatherEffectsEnabled} />

      {/* 2. AREA MAPPA PULITA: La barra superiore ordinata con il ritorno al Globo e il selettore delle 20 Regioni è gestita dal container */}

      {/* 3. DOCK CONTROLLI GOOGLE MAPS / GOOGLE EARTH SUL LATO DESTRO */}
      <div className="absolute right-2.5 sm:right-4 top-2.5 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
        {/* PULSANTE ALLARGA CARTINA A TUTTO SCHERMO */}
        {onToggleFullscreen && (
          <button
            id="btn-urbano-toggle-fullscreen"
            onClick={onToggleFullscreen}
            className={`w-10 h-10 rounded-xl shadow-xl flex flex-col items-center justify-center font-black text-xs cursor-pointer transition-all border active:scale-95 ${
              isFullscreen
                ? 'bg-[#00ff66] text-black font-black border-[#00ff66] shadow-[#00ff66]/25 ring-2 ring-[#00ff66]'
                : 'bg-slate-900/90 text-[#00ff66] border-slate-700/80 hover:bg-slate-800'
            }`}
            title={isFullscreen ? 'Riduci cartina alla vista standard' : 'Allarga cartina a schermo intero (100% display)'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 text-black" /> : <Maximize2 className="w-5 h-5 text-[#00ff66]" />}
          </button>
        )}

        {/* TASTO PRINCIPALE 2D / 3D */}
        <button
          id="btn-toggle-2d-3d"
          onClick={toggle2D3D}
          className={`w-10 h-10 rounded-xl shadow-xl flex flex-col items-center justify-center font-black text-xs cursor-pointer transition-all border active:scale-95 ${
            is3D
              ? 'bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400'
              : 'bg-slate-900/90 text-sky-400 border-slate-700/80 hover:bg-slate-800'
          }`}
          title={is3D ? 'Attualmente in 3D. Clicca per Vista 2D Piana e Dritta (0°)' : 'Attualmente in 2D. Clicca per Prospettiva 3D Volumetrica'}
        >
          <span className="text-[11px] font-black leading-none">{is3D ? '3D' : '2D'}</span>
          <span className="text-[8px] font-mono leading-none opacity-85 font-black">{pitch}°</span>
        </button>

        {/* PRESET INCLINAZIONE RAPIDA (0° PIANA / 50° AEREA / 60° 3D / 75° SKYLINE) */}
        <button
          id="btn-pitch-preset"
          onClick={cycle3DPerspective}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 text-[10px] font-black"
          title={`Inclinazione attuale: ${pitch}°. Clicca per cambiare angolo (2D 0° / Aerea 50° / 3D 60° / Skyline 75°)`}
        >
          <span>📐</span>
          <span className="text-[8px] text-emerald-400 font-bold">{pitch}°</span>
        </button>

        {/* BUSSOLA NORD (0°) */}
        <button
          id="btn-reset-compass"
          onClick={resetCompass}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
          title={`Bussola: ${bearing}°. Clicca per puntare a Nord (0°)`}
        >
          <Compass
            className="w-5 h-5 text-red-400 transition-transform duration-200"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>

        {/* PULSANTE RADDRIZZA RAPIDO (SE INCLINATA O RUOTATA) */}
        {(bearing !== 0 || pitch !== 0) && (
          <button
            id="btn-straighten-map"
            onClick={straightenMap}
            className="w-10 h-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 text-[8px] font-black"
            title="Raddrizza: orienta a Nord e imposta vista ortogonale piana (0°)"
          >
            <span>🧭</span>
            <span className="text-[7px]">DRITTO</span>
          </button>
        )}

        {/* LOCALIZZAMI */}
        <button
          id="btn-locate-me"
          onClick={handleLocateMe}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
          title="Centra sulla mia posizione"
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
        </button>

        {/* ORBITA 360° */}
        <button
          id="btn-orbit-360"
          onClick={() => setIsOrbiting(!isOrbiting)}
          className={`w-10 h-10 rounded-xl shadow-xl flex items-center justify-center cursor-pointer transition-all border ${
            isOrbiting
              ? 'bg-blue-500 text-white border-blue-300 animate-spin shadow-blue-500/25'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800'
          }`}
          title={isOrbiting ? 'Ferma Volo 360°' : 'Volo Panoramico Orbitale 360°'}
        >
          {isOrbiting ? <Pause className="w-4 h-4" /> : <RotateCw className="w-4 h-4" />}
        </button>

        {/* APRI IN GOOGLE EARTH WEB */}
        {/* STREET VIEW 360° & NAVIGAZIONE STRADALE INTEGRATA */}
        <button
          id="btn-open-street-view-360"
          type="button"
          onClick={() => {
            setShowStreetView(true);
            toast.success(`🚶 Entro in Street View 360° a ${selectedCity}`, {
              description: 'Navigazione per le strade e indicazioni svolta per svolta attive',
              duration: 3000,
            });
          }}
          className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-300 shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all active:scale-90 font-black text-[11px]"
          title="Street View 360°: Gira per le strade con il nostro sistema di navigazione"
        >
          <span>360°</span>
        </button>
      </div>

      {/* FOOTER INFORMATIVO & TELEMETRIA 3D IN BASSO A SINISTRA */}
      <div className="absolute bottom-2 left-4 z-20 pointer-events-auto text-[10px] text-slate-300 font-medium flex flex-wrap items-center gap-2 bg-slate-950/90 px-3.5 py-1.5 rounded-2xl backdrop-blur-md border border-slate-800 shadow-2xl">
        <span className="flex items-center gap-1.5 font-bold text-white">
          <span className="text-xs">{currentPlace.flag || '📍'}</span>
          <span>{currentPlace.name}</span>
          <span className="text-slate-400 font-normal">({currentPlace.countryName})</span>
        </span>
        <span className="text-slate-600">•</span>
        <button
          onClick={() => setShowCurrencyModal(true)}
          className="hover:text-emerald-300 cursor-pointer flex items-center gap-1 transition-colors text-sky-300 font-semibold"
          title="Lingua del luogo (clicca per ascoltare)"
        >
          <Languages className="w-3 h-3" />
          <span>{currentPlace.language?.name || 'Lingua Locale'}</span>
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={() => setShowCurrencyModal(true)}
          className="hover:text-amber-200 cursor-pointer flex items-center gap-1 transition-colors text-amber-300 font-semibold"
          title="Valuta del luogo (clicca per convertitore)"
        >
          <Coins className="w-3 h-3" />
          <span>{currentPlace.currency?.code} ({currentPlace.currency?.symbol})</span>
        </button>
        {weatherData && (
          <>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setShowWeatherModal(true)}
              className="hover:text-sky-300 cursor-pointer flex items-center gap-1 transition-colors text-slate-300 font-semibold"
              title="Meteo in tempo reale (clicca per dettagli)"
            >
              <span>{weatherData.condition?.icon || '🌤️'}</span>
              <span>{weatherData.temperature}°C</span>
              <span className="text-slate-400 hidden sm:inline">({weatherData.condition?.label})</span>
            </button>
          </>
        )}
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-slate-400 hidden sm:flex items-center gap-1">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>{getLocalTimeString(currentPlace.timezone)}</span>
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-emerald-400 font-semibold">
          {pitch}° 3D
        </span>
      </div>

      {/* MODALE DI NAVIGAZIONE MONDO (QUALSIASI CITTÀ, STATO O REGIONE) */}
      {showWorldModal && (
        <WorldNavigatorModal
          isOpen={showWorldModal}
          onClose={() => setShowWorldModal(false)}
          onSelectLocation={handleSelectWorldPlace}
          currentCountry={currentPlace.countryName}
          currentCity={currentPlace.name}
        />
      )}

      {/* MODALE CONVERTITORE E LINGUA DEL LUOGO */}
      {showCurrencyModal && (
        <LocalCurrencyModal
          place={currentPlace}
          onClose={() => setShowCurrencyModal(false)}
        />
      )}

      {/* MODALE METEO IN TEMPO REALE & FUSO ORARIO */}
      {showWeatherModal && weatherData && (
        <LiveWeatherModal
          isOpen={showWeatherModal}
          onClose={() => setShowWeatherModal(false)}
          weather={weatherData}
          place={currentPlace}
          weatherEffectsEnabled={weatherEffectsEnabled}
          onToggleWeatherEffects={setWeatherEffectsEnabled}
        />
      )}

      {/* SCHEDA VERIFICA SUL POSTO: SPONSOR / ATTIVITÀ VERIFICATA SUL LUOGO */}
      {selectedSponsor && (() => {
        const pinType = classifyMerchantPin(selectedSponsor);
        return (
          <div className="absolute bottom-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-[430px] z-30 pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className={`p-4 rounded-2xl bg-black/95 backdrop-blur-2xl border-2 ${pinType.type === 'DOUBLE_RING' ? 'border-[#ffd700] shadow-amber-500/30' : pinType.type === 'PI_ACCEPTED' ? 'border-[#a855f7] shadow-purple-500/30' : 'border-[#f59e0b] shadow-amber-500/30'} shadow-2xl text-white flex flex-col gap-3`}>
              {/* Header con Badge Verifica Sede */}
              <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-11 h-11 rounded-xl text-black font-black text-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: pinType.type === 'DOUBLE_RING'
                        ? 'linear-gradient(135deg, #7c3aed 0%, #ffd700 100%)'
                        : pinType.type === 'PI_ACCEPTED'
                        ? 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)'
                        : 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                    }}
                  >
                    {pinType.type === 'DOUBLE_RING' ? '👑' : pinType.type === 'PI_ACCEPTED' ? '🪙' : '📢'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-black text-amber-300">{selectedSponsor.name}</h3>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 border"
                        style={{
                          backgroundColor: `${pinType.badgeBg}22`,
                          color: pinType.badgeBg,
                          borderColor: `${pinType.badgeBg}66`,
                        }}
                      >
                        <span>✓</span> {pinType.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{selectedSponsor.address || `${selectedCity}, Centro`}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-[10px] font-mono text-amber-300/90">Edificio 3D #{(selectedSponsor.id || '12').slice(-3)}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSponsor(null)}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title="Chiudi scheda"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Certificato di Presenza Fisica */}
              <div className="bg-zinc-950/90 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏢</span>
                  <div>
                    <span className="font-bold text-white block">Posizione Edificio 3D Accertata</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Lat: {(selectedSponsor.lat || effectiveLat).toFixed(4)} • Lng: {(selectedSponsor.lng || effectiveLng).toFixed(4)}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Quota: ~32m
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900">
                {selectedSponsor.description || 'Attività commerciale verificata sul posto. Disponibile per transazioni P2P dirette e scambi concordati.'}
              </p>

              {/* Sezione 1: Condizioni Pi Network (Se accetta Pi Coin o Doppio Anello) */}
              {pinType.hasPi && (
                <div className="flex flex-col gap-1 text-xs bg-purple-950/40 border border-purple-500/40 px-3 py-2 rounded-xl text-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="text-sm">🪙</span>
                      <span>Condizioni Pi Network:</span>
                      <span className="text-amber-400 font-extrabold">{selectedSponsor.promo || 'Accetta Pagamenti Pi Coin (π)'}</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">{selectedSponsor.hours || 'Aperto'}</span>
                  </div>
                  <span className="text-[10px] text-purple-300/80">Transazioni P2P verificate sulla Pi Mainnet / Tasso e modalità concordate con l'esercente.</span>
                </div>
              )}

              {/* Sezione 2: Volantino & Vetrina Pubblicitaria (Se ha Pubblicità o Doppio Anello) */}
              {pinType.hasAd && (
                <div className="flex flex-col gap-1 text-xs bg-amber-950/40 border border-amber-500/40 px-3 py-2 rounded-xl text-amber-200">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="text-sm">📢</span>
                    <span>Vetrina & Volantino Offerte:</span>
                    <span className="text-amber-300 font-extrabold">{selectedSponsor.adHeadline || selectedSponsor.promo || 'Promozione Attiva'}</span>
                  </span>
                  <span className="text-[10px] text-amber-300/80">
                    {selectedSponsor.flyerUrl ? 'Volantino promozionale disponibile per consultazione diretta.' : 'Prodotti e promozioni in vetrina verificati direttamente presso il punto vendita.'}
                  </span>
                </div>
              )}

            {/* Azioni: Street View 360, Nota Vocale, Raggiungi */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowStreetView(true);
                  toast.success(`🚶 Visualizzazione Street View per ${selectedSponsor.name}`);
                }}
                className="py-2.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-400 text-white text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Guarda la facciata dell'edificio e la strada in 360°"
              >
                <span className="text-sm">🚶</span>
                <span>Street View 360°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenVoiceChat) onOpenVoiceChat(selectedSponsor);
                }}
                className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-[11px] font-black flex flex-col items-center justify-center gap-1 shadow-lg shadow-sky-500/25 cursor-pointer active:scale-95 transition-all"
                title="Lascia una nota vocale o avvia una chat con il titolare"
              >
                <span className="text-sm">🎙️</span>
                <span>Nota Vocale</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCalculateRoute(selectedSponsor.lat, selectedSponsor.lng, selectedSponsor.name);
                }}
                disabled={isCalculatingRoute}
                className="py-2.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
                title="Calcola percorso stradale reale OSRM per raggiungere la sede"
              >
                <Navigation className="w-4 h-4 text-slate-950" />
                <span>{isCalculatingRoute ? 'Calcolo...' : 'Raggiungi'}</span>
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* MODAL STREET VIEW 360° CON NAVIGAZIONE STRADALE SVOLTA PER SVOLTA */}
      <StreetView360Modal
        isOpen={showStreetView}
        onClose={() => setShowStreetView(false)}
        lat={effectiveLat}
        lng={effectiveLng}
        cityName={selectedCity}
        streetName={`Via ${selectedCity}`}
      />
    </div>
  );
}
