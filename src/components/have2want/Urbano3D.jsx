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
  Search,
  Volume2,
  VolumeX,
  Play,
  Radar,
  Mountain,
  Camera,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import WorldNavigatorModal from './WorldNavigatorModal';
import LocalCurrencyModal from './LocalCurrencyModal';
import LiveWeatherModal from './LiveWeatherModal';
import LiveWebcamsModal from './LiveWebcamsModal';
import Google3DUrbanLayer, { getConfiguredGoogleMapsKey } from './Google3DUrbanLayer';
import WeatherAtmosphereOverlay from './WeatherAtmosphereOverlay';
import StreetView360Modal from './StreetView360Modal';
import MerchantDetailModal from './MerchantDetailModal';
import { getRealtimeWeather, getRainViewerRadarData, getRouteWeatherForecast } from '@/lib/weatherService';
import { getExternalServicesForArea, fetchRealExternalServicesForArea } from '@/lib/externalGatewayServices';
import { calculateRealRoutes, distanceToRouteMeters } from '@/lib/routingService';
import { collectRainViewerTimelineFrames, buildRainViewerMapLibreTileUrl } from '@/lib/rainViewerGlobeLayer';
import { buildOsmBuildingLayers, TERRARIUM_DEM_SOURCE_CONFIG } from '@/lib/osmBuildingEnhancer';
import { UrbanoThreeCustomLayer } from '@/lib/urbanoThreeLayer';
import { SPONSORED_BUSINESSES } from '@/data/regions';
import { subscribeToCloudShops } from '@/lib/firestoreService';
import {
  formatLocalPrice,
  lookupLocationFromCoords,
  getLocalTimeString,
  searchAnyWorldPlace,
  WORLD_COUNTRIES,
  isValidCoord,
} from '@/lib/worldAtlas';
import { getCachedPiRealPrice, PI_REAL_PRICE_EUR } from '@/lib/piRealPriceService';
import { getListingOriginBadge } from '@/lib/listingOrigin';
import { classifyMerchantPin } from '@/lib/merchantPinClassifier';

export const INITIAL_PI_MERCHANTS = SPONSORED_BUSINESSES;

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeBearingDeg(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lng2 - lng1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function buildNextTurnBanner(route, curLat, curLng) {
  if (!route || !Array.isArray(route.steps) || route.steps.length === 0) {
    return { distanceMeters: 0, instruction: 'Procedi lungo il percorso', text: 'Tra 0 metri: Procedi lungo il percorso' };
  }
  const steps = route.steps;
  // Preferisci il prossimo passo significativo dopo la partenza se disponibile
  let chosenStep = steps.length > 1 ? steps[1] : steps[0];
  let bestDist = Infinity;

  if (typeof curLat === 'number' && typeof curLng === 'number') {
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      if (!Array.isArray(st.location) || st.location.length < 2) continue;
      const d = haversineMeters(curLat, curLng, st.location[1], st.location[0]);
      if (i === 0 && steps.length > 1 && d < 25) continue;
      if (d < bestDist) {
        bestDist = d;
        chosenStep = st;
      }
    }
  }

  const distMeters = Number.isFinite(bestDist)
    ? Math.max(0, Math.round(bestDist))
    : Math.max(0, Math.round(chosenStep.distanceMeters || route.totalDistanceMeters || 0));
  const instruction = chosenStep.instruction || 'Prosegui dritto';
  return {
    distanceMeters: distMeters,
    instruction,
    text: `Tra ${distMeters} metri: ${instruction}`,
  };
}

function getInitialTargetCoords(selectedCountry) {
  if (
    selectedCountry &&
    typeof selectedCountry.lat === 'number' &&
    !Number.isNaN(selectedCountry.lat) &&
    typeof selectedCountry.lng === 'number' &&
    !Number.isNaN(selectedCountry.lng) &&
    !(selectedCountry.lat === 0 && selectedCountry.lng === 0)
  ) {
    return { lat: selectedCountry.lat, lng: selectedCountry.lng };
  }
  return null;
}

export function computeGpsCameraEaseOptions({
  uLat,
  uLng,
  heading = 0,
  userHasAdjustedZoom = false,
  userHasPanned = false,
}) {
  if (userHasPanned) return null;
  const options = {
    center: [uLng, uLat],
    bearing: heading,
    duration: 550,
  };
  if (!userHasAdjustedZoom) {
    options.pitch = 62;
  }
  return options;
}

export default function Urbano3D({
  centroLat,
  centroLng,
  lat,
  lng,
  countryName = 'Territorio',
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
  activeChannel = null,
}) {
  const initialPlaceCoords = getInitialTargetCoords(placeData);
  const effectiveLat =
    typeof centroLat === 'number' && !Number.isNaN(centroLat)
      ? centroLat
      : typeof placeData?.lat === 'number' && !Number.isNaN(placeData.lat)
      ? placeData.lat
      : typeof lat === 'number' && !Number.isNaN(lat)
      ? lat
      : initialPlaceCoords?.lat ?? null;
  const effectiveLng =
    typeof centroLng === 'number' && !Number.isNaN(centroLng)
      ? centroLng
      : typeof placeData?.lng === 'number' && !Number.isNaN(placeData.lng)
      ? placeData.lng
      : typeof lng === 'number' && !Number.isNaN(lng)
      ? lng
      : initialPlaceCoords?.lng ?? null;
  const hasValidCoords = isValidCoord(effectiveLat, effectiveLng);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const merchantMarkersRef = useRef([]);
  const userArrowMarkerRef = useRef(null);
  const userArrowInnerRef = useRef(null);
  const threeLayerRef = useRef(null);
  const threeSceneEntitiesRef = useRef([]);
  const watchIdRef = useRef(null);
  const prevGpsRef = useRef(null);
  const activeRouteRef = useRef(null);
  const orbitIntervalRef = useRef(null);
  const userHasAdjustedZoomRef = useRef(false);
  const userHasPannedRef = useRef(false);
  const lastRerouteAtRef = useRef(0);
  const isReroutingRef = useRef(false);
  const lastSpokenBannerRef = useRef('');

  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [selectedMerchantModal, setSelectedMerchantModal] = useState(null);
  const [cloudMerchants, setCloudMerchants] = useState([]);
  const [realExternalServices, setRealExternalServices] = useState([]);
  const [pitch, setPitch] = useState(60); // 60° = Prospettiva 3D volumetrica reale per visualizzare gli edifici che sorgono
  const [bearing, setBearing] = useState(15);
  const [is3D, setIs3D] = useState(true); // 3D attivo di default
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState('vector3d'); // DEFAULT: 'vector3d' con confini nitidi
  const [showBuildings3D, setShowBuildings3D] = useState(true); // EDIFICI 3D SEMPRE ATTIVI DI DEFAULT
  const [showTerrain3D, setShowTerrain3D] = useState(true);
  const [selectedCity, setSelectedCity] = useState(countryName || placeData?.name || 'Territorio');
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showWebcamsModal, setShowWebcamsModal] = useState(false);
  const [useGooglePhotorealistic, setUseGooglePhotorealistic] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherEffectsEnabled, setWeatherEffectsEnabled] = useState(true);
  const [radarOverlayEnabled, setRadarOverlayEnabled] = useState(false);
  const [radarHost, setRadarHost] = useState('');
  const [radarFrames, setRadarFrames] = useState([]);
  const [radarFrameIdx, setRadarFrameIdx] = useState(0);
  const [radarPlaying, setRadarPlaying] = useState(false);
  const [radarSourceLabel, setRadarSourceLabel] = useState('');
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarError, setRadarError] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeWeather, setRouteWeather] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isGpsFollowPaused, setIsGpsFollowPaused] = useState(false);
  const [navProfile, setNavProfile] = useState('driving'); // 'driving' | 'walking' | 'cycling'
  const navProfileRef = useRef('driving');
  navProfileRef.current = navProfile;
  const [userLocation, setUserLocation] = useState(null);
  const [navDestination, setNavDestination] = useState(null);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

  activeRouteRef.current = activeRoute;

  // Unisci sempre INITIAL_PI_MERCHANTS + prop sponsoredBusinesses + Firestore senza duplicati
  const allMerchants = useMemo(() => {
    const merged = new Map();
    INITIAL_PI_MERCHANTS.forEach((b) => {
      if (b && b.id) merged.set(b.id, b);
    });
    if (Array.isArray(sponsoredBusinesses)) {
      sponsoredBusinesses.forEach((b) => {
        if (b && b.id) merged.set(b.id, b);
      });
    }
    cloudMerchants.forEach((b) => {
      if (b && b.id) merged.set(b.id, b);
    });
    return Array.from(merged.values());
  }, [sponsoredBusinesses, cloudMerchants]);

  // Ricerca immediata di vie, città, piazze o commercianti direttamente dalla barra in Urbano 3D
  useEffect(() => {
    const clean = placeSearchQuery.trim();
    if (clean.length < 2) {
      setPlaceSearchResults([]);
      setIsSearchingPlace(false);
      return;
    }
    let active = true;
    setIsSearchingPlace(true);
    const timer = setTimeout(async () => {
      try {
        const lower = clean.toLowerCase();
        const localMatches = allMerchants
          .filter((b) =>
            (b.name || '').toLowerCase().includes(lower) ||
            (b.city || '').toLowerCase().includes(lower) ||
            (b.address || '').toLowerCase().includes(lower)
          )
          .slice(0, 3)
          .map((b) => {
            const hasBizCoords = isValidCoord(b.lat, b.lng);
            return {
              id: `biz_${b.id}`,
              name: b.name,
              displayName: `🏪 ${b.name} (${b.city || selectedCity})`,
              lat: hasBizCoords ? b.lat : effectiveLat,
              lng: hasBizCoords ? b.lng : effectiveLng,
              countryName: b.country || placeData?.countryName || (countryName !== 'Territorio' ? countryName : '') || 'Mondo',
              flag: '🏪',
              isMerchant: true,
            };
          })
          .filter((item) => isValidCoord(item.lat, item.lng));

        const worldPlaces = await searchAnyWorldPlace(clean);
        if (!active) return;
        setPlaceSearchResults([...localMatches, ...worldPlaces.slice(0, 6)]);
      } catch {
        if (active) setPlaceSearchResults([]);
      } finally {
        if (active) setIsSearchingPlace(false);
      }
    }, 260);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [placeSearchQuery, allMerchants, selectedCity, effectiveLat, effectiveLng]);

  // Carica in tempo reale eventuali commercianti da Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCloudShops((shops) => {
      if (Array.isArray(shops)) {
        setCloudMerchants(shops);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

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
        ? {
            code: 'EUR',
            symbol: '€',
            name: 'Euro',
            piRate: getCachedPiRealPrice()?.priceEur || PI_REAL_PRICE_EUR,
          }
        : { code: 'PI', symbol: 'π', name: 'Pi Coin', piRate: 1.0 },
      timezone: isIt ? 'Europe/Rome' : 'UTC',
      greeting: `Benvenuto in ${countryName || 'Have2Want'}!`
    };
  });

  // Carica i dati meteo in tempo reale sincronizzati con il fuso orario del luogo
  useEffect(() => {
    if (!hasValidCoords) return;
    let isMounted = true;
    getRealtimeWeather(effectiveLat, effectiveLng).then((w) => {
      if (isMounted && w) {
        setWeatherData(w);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [hasValidCoords, effectiveLat, effectiveLng, selectedCity, currentPlace?.name]);

  // Sincronizza se il parent passa nuovi placeData
  useEffect(() => {
    if (placeData) {
      setCurrentPlace(placeData);
      setSelectedCity(placeData.name || countryName);
    }
  }, [placeData, countryName]);

  // Carica servizi territoriali reali da OpenStreetMap Overpass API per l'area corrente (zero coordinate inventate)
  useEffect(() => {
    if (!hasValidCoords) {
      setRealExternalServices([]);
      return;
    }
    let alive = true;
    fetchRealExternalServicesForArea(
      effectiveLat,
      effectiveLng,
      selectedCity,
      currentPlace?.countryCode || ''
    )
      .then((res) => {
        if (!alive) return;
        if (Array.isArray(res?.places)) {
          setRealExternalServices(res.places);
        }
      })
      .catch(() => {
        if (alive) setRealExternalServices([]);
      });
    return () => {
      alive = false;
    };
  }, [hasValidCoords, effectiveLat, effectiveLng, selectedCity, currentPlace?.countryCode]);

  // Elenco entità 3D GLB architettoniche ancorate a coordinate reali verificabili (Zero box fittizi)
  const threeSceneEntities = useMemo(() => {
    const entities = [];
    allMerchants.forEach((biz) => {
      if (!isValidCoord(biz?.lat, biz?.lng)) return;
      const pinVisual = classifyMerchantPin(biz);
      const isDouble = pinVisual.type === 'DOUBLE_RING';
      const isPi = pinVisual.type === 'PI_ACCEPTED';
      entities.push({
        id: `merchant_glb_${biz.id}`,
        assetKey: isDouble ? 'commercial_hub' : 'merchant_pavilion',
        lat: biz.lat,
        lng: biz.lng,
        scale: isDouble ? 12 : 9,
        tintHex: isPi ? 0x8b5cf6 : 0xfbbf24,
      });
    });

    let civicTreeCount = 0;
    realExternalServices.slice(0, 14).forEach((svc) => {
      if (!isValidCoord(svc?.lat, svc?.lng)) return;
      if (svc.category === 'event_fair' || svc.category === 'pro_ethical') {
        entities.push({
          id: `civic_glb_${svc.id}`,
          assetKey: 'civic_landmark',
          lat: svc.lat,
          lng: svc.lng,
          scale: 13,
        });
        if (civicTreeCount < 3) {
          civicTreeCount += 1;
          entities.push({
            id: `tree_glb_${svc.id}`,
            assetKey: 'urban_tree',
            lat: svc.lat + 0.00009,
            lng: svc.lng + 0.00011,
            scale: 4.5,
          });
        }
      } else if (svc.category === 'supermarket_flyer' || svc.category === 'nightlife') {
        entities.push({
          id: `hub_glb_${svc.id}`,
          assetKey: 'commercial_hub',
          lat: svc.lat,
          lng: svc.lng,
          scale: 11,
        });
      } else if (svc.category === 'locker') {
        entities.push({
          id: `pavilion_glb_${svc.id}`,
          assetKey: 'merchant_pavilion',
          lat: svc.lat,
          lng: svc.lng,
          scale: 8.5,
        });
      }
    });
    return entities;
  }, [allMerchants, realExternalServices]);

  threeSceneEntitiesRef.current = threeSceneEntities;

  // Normalizza esclusivamente gli annunci reali dotati di coordinate geografiche valide
  const annunci = useMemo(() => {
    if (!hasValidCoords || !Array.isArray(filteredListings) || filteredListings.length === 0) {
      return [];
    }

    return filteredListings
      .filter((item) => isValidCoord(item?.lat, item?.lng))
      .slice(0, 40)
      .map((item, idx) => {
        const isSchool =
          item.category === 'libri_scuola_cultura' ||
          item.subcategory === 'scambio_libri_scolastici';
        return {
          id: item.id || `ann_${idx}`,
          title: item.title || item.have_description || `Annuncio ${idx + 1}`,
          category: item.category || 'Generale',
          subcategory: item.subcategory,
          intent:
            item.intent ||
            (item.action_type === 'vendo'
              ? 'VENDO'
              : item.action_type === 'acquisto_cerco'
              ? 'ACQUISTO_CERCO'
              : 'BARATTO_SCAMBIO'),
          action_type: item.action_type,
          price: item.piPrice ? `${item.piPrice} π` : item.want_description || 'Scambio',
          author: item.author?.name || item.owner_name || '@pioniere',
          city: item.city || item.locationArea || selectedCity,
          privacy_mode_active: Boolean(item.privacy_mode_active),
          lat: item.lat,
          lng: item.lng,
          isSchoolBook: isSchool,
          raw: item,
        };
      });
  }, [filteredListings, hasValidCoords, selectedCity]);

  // Se la prop selectedListing cambia dall'esterno, centra la mappa
  useEffect(() => {
    if (selectedListing && hasValidCoords && mapRef.current) {
      mapRef.current.flyTo({
        center: [effectiveLng, effectiveLat],
        zoom: 17,
        pitch: 65,
        duration: 1000,
      });
    }
  }, [selectedListing, hasValidCoords, effectiveLat, effectiveLng]);

  // Inizializzazione Mappa WebGL 3D ad alta definizione (Google Earth 3D, Google Maps 3D e Stradale HD)
  useEffect(() => {
    if (!mapContainerRef.current || !hasValidCoords) return;

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

    const sourcesConfig = isSatellite
      ? {
          'satellite-base': {
            type: 'raster',
            tiles: esriSatelliteTiles,
            tileSize: 256,
            maxzoom: 18,
            attribution: '© Esri, Maxar',
          },
          'roads-overlay': {
            type: 'raster',
            tiles: esriRoadsTiles,
            tileSize: 256,
            maxzoom: 18,
          },
          'openmaptiles': {
            type: 'vector',
            url: 'https://tiles.openfreemap.org/planet',
          },
          'places-overlay': {
            type: 'raster',
            tiles: esriPlacesTiles,
            tileSize: 256,
            maxzoom: 18,
          },
          'terrain-dem': TERRARIUM_DEM_SOURCE_CONFIG,
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
          'terrain-dem': TERRARIUM_DEM_SOURCE_CONFIG,
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
          'terrain-dem': TERRARIUM_DEM_SOURCE_CONFIG,
        };

    const osmBuildingLayers = buildOsmBuildingLayers({
      mode: mapStyleMode,
      showBuildings3D: showBuildings3D && activeChannel !== 'STRADARIO',
    });

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
          ...osmBuildingLayers,
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
          ...osmBuildingLayers,
        ]
      : [
          {
            id: 'night-base-layer',
            type: 'raster',
            source: 'night-base',
            minzoom: 0,
            maxzoom: 20,
          },
          ...osmBuildingLayers,
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
      zoom: 16.5, // Vista a livello strada: edifici 3D immediatamente visibili con strade e piazze
      pitch: 60,  // Prospettiva 3D inclinata a 60°
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

    let envApplied = false;
    const setup3DEnvironment = () => {
      if (envApplied) return;
      envApplied = true;
      try {
        if (!map.getSource('terrain-dem')) {
          map.addSource('terrain-dem', TERRARIUM_DEM_SOURCE_CONFIG);
        }

        // 1. Rilievo Orografico 3D Reale AWS Mapzen Terrarium DEM (1.8x)
        if (showTerrain3D && map.getSource('terrain-dem')) {
          map.setTerrain({ source: 'terrain-dem', exaggeration: 1.8 });
        }

        // 2. Luce Direzionale 3D (Crea ombre realistiche sulle facciate e sui tetti)
        map.setLight({
          anchor: 'viewport',
          color: '#ffffff',
          intensity: 0.75,
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

        // 4. Monta il CustomLayer Three.js GLB/PBR (pavilion, commercial hub, civic landmark, vehicle GPS)
        if (!threeLayerRef.current) {
          const threeLayer = new UrbanoThreeCustomLayer();
          threeLayerRef.current = threeLayer;
          if (!map.getLayer(threeLayer.id)) {
            map.addLayer(threeLayer);
          }
          threeLayer.setEntities(threeSceneEntitiesRef.current || []);
          threeLayer.setVisible(showBuildings3D && activeChannel !== 'STRADARIO');
        }

        // 5. Ripristina l'eventuale rotta OSRM attiva dopo cambio stile mappa
        if (activeRouteRef.current?.coordinates?.length >= 2) {
          renderRouteOnMap(activeRouteRef.current.coordinates);
        }
      } catch (e) {
        console.warn('Configurazione 3D notice:', e);
      }
    };

    map.on('load', setup3DEnvironment);
    map.on('moveend', () => {
      if (threeLayerRef.current) {
        threeLayerRef.current.setEntities(threeSceneEntitiesRef.current || []);
      }
    });
    map.on('error', (err) => {
      console.warn('MapLibre Urbano 3D notice:', err?.error?.message || err?.message || err);
    });

    map.on('pitch', () => {
      const currentPitch = Math.round(map.getPitch());
      setPitch(currentPitch);
      setIs3D(currentPitch > 10);
    });

    map.on('rotate', () => {
      setBearing(Math.round(map.getBearing()));
    });

    map.on('zoomstart', (e) => {
      if (e?.originalEvent) {
        userHasAdjustedZoomRef.current = true;
      }
    });

    map.on('dragstart', (e) => {
      if (e?.originalEvent) {
        userHasPannedRef.current = true;
        setIsGpsFollowPaused(true);
      }
    });

    map.on('pitchstart', (e) => {
      if (e?.originalEvent) {
        userHasAdjustedZoomRef.current = true;
      }
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
      merchantMarkersRef.current.forEach((m) => m.remove());
      merchantMarkersRef.current = [];
      if (userArrowMarkerRef.current) {
        userArrowMarkerRef.current.remove();
        userArrowMarkerRef.current = null;
      }
      if (threeLayerRef.current) {
        try {
          if (map.getLayer(threeLayerRef.current.id)) {
            map.removeLayer(threeLayerRef.current.id);
          }
        } catch {
          // ignore if map already removing
        }
        threeLayerRef.current = null;
      }
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (orbitIntervalRef.current) clearInterval(orbitIntervalRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyleMode, hasValidCoords]);

  // Gestione dinamica visibilità Palazzi OSM + Modelli GLB 3D (nascosti temporaneamente se il filtro STRADARIO mostra solo le strade)
  useEffect(() => {
    const isVisible = showBuildings3D && activeChannel !== 'STRADARIO';
    if (threeLayerRef.current) {
      threeLayerRef.current.setVisible(isVisible);
    }
    if (!mapRef.current) return;
    const map = mapRef.current;
    const applyBuildingsVisibility = () => {
      try {
        if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) return;
        const visibility = isVisible ? 'visible' : 'none';
        ['3d-buildings-plinth', '3d-buildings', '3d-buildings-roofs', 'building-3d'].forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
          }
        });
      } catch (e) {
        console.warn('Toggle palazzi 3D error:', e);
      }
    };
    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
      map.once('load', applyBuildingsVisibility);
      return () => {
        map.off('load', applyBuildingsVisibility);
      };
    }
    applyBuildingsVisibility();
  }, [showBuildings3D, activeChannel]);

  // Sincronizza entità GLB e veicolo di navigazione GPS con Three.js CustomLayer
  useEffect(() => {
    if (threeLayerRef.current) {
      threeLayerRef.current.setEntities(threeSceneEntities);
    }
  }, [threeSceneEntities]);

  useEffect(() => {
    if (threeLayerRef.current) {
      threeLayerRef.current.updateNavVehicle(
        isNavigating,
        userLocation?.lat,
        userLocation?.lng,
        userLocation?.heading ?? 0
      );
    }
  }, [isNavigating, userLocation]);

  // Gestione dinamica visibilità Terreno DEM 3D (attende sempre isStyleLoaded prima di setTerrain)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const applyTerrain = () => {
      try {
        if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) return;
        if (showTerrain3D) {
          if (!map.getSource('terrain-dem')) {
            map.addSource('terrain-dem', TERRARIUM_DEM_SOURCE_CONFIG);
          }
          if (map.getSource('terrain-dem')) {
            map.setTerrain({ source: 'terrain-dem', exaggeration: 1.8 });
          }
        } else {
          map.setTerrain(null);
        }
      } catch (e) {
        console.warn('Toggle terreno 3D error:', e);
      }
    };
    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
      map.once('load', applyTerrain);
      return () => {
        map.off('load', applyTerrain);
      };
    }
    applyTerrain();
  }, [showTerrain3D]);

  // Aggiorna posizione quando cambiano le coordinate del centro
  useEffect(() => {
    if (mapRef.current && hasValidCoords) {
      mapRef.current.flyTo({
        center: [effectiveLng, effectiveLat],
        zoom: 16.5, // Quota urbana 3D: edifici volumetrici e strade dettagliate
        pitch: 60,  // Prospettiva 3D volumetrica a 60°
        bearing: 15,
        duration: 1200,
        essential: true,
      });
    }
  }, [hasValidCoords, effectiveLat, effectiveLng]);

  // Renderizza i Marker interattivi sulla mappa
  useEffect(() => {
    if (!mapRef.current || !hasValidCoords) return;
    const map = mapRef.current;

    // Pulisci vecchi marker
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    annunci.forEach((item) => {
      if (!isValidCoord(item.lat, item.lng)) return;
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

    // I commercianti sono gestiti in merchantMarkersRef dedicata (sempre visibile sopra tutto, anche in navigazione)

    // RENDER PIN DIRETTO SERVIZI REALI (OPENSTREETMAP OVERPASS + LINK DIRETTI VERIFICATI, ZERO COORDINATE INVENTATE)
    const fallbackExternalServices = getExternalServicesForArea(
      effectiveLat,
      effectiveLng,
      selectedCity,
      currentPlace?.countryCode || ''
    );
    const mergedExternalMap = new Map();
    fallbackExternalServices.forEach((svc) => {
      if (svc?.id) mergedExternalMap.set(svc.id, svc);
    });
    realExternalServices.forEach((svc) => {
      if (svc?.id) mergedExternalMap.set(svc.id, svc);
    });
    const externalServices = Array.from(mergedExternalMap.values());
    externalServices.forEach((svc) => {
      if (!isValidCoord(svc.lat, svc.lng)) return;
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
  }, [annunci, realExternalServices, mapStyleMode, onBazarSelect, onSelectListing, onSelectExternalPlace, selectedCity, effectiveLat, effectiveLng]);

  // 1B. RENDER SEMPRE VISIBILE DI TUTTI I COMMERCIANTI (INITIAL_PI_MERCHANTS + Firestore)
  // Rimangono visibili sia a mappa ferma che durante la navigazione a piedi/in auto e SOPRA il percorso
  useEffect(() => {
    if (!mapRef.current || !hasValidCoords) return;
    const map = mapRef.current;

    merchantMarkersRef.current.forEach((m) => m.remove());
    merchantMarkersRef.current = [];

    allMerchants.forEach((biz) => {
      if (!isValidCoord(biz.lat, biz.lng)) return;
      const bizLat = biz.lat;
      const bizLng = biz.lng;

      const pinType = classifyMerchantPin(biz);

      const el = document.createElement('div');
      el.className = 'merchant-pin-always-visible cursor-pointer select-none';
      el.style.position = 'relative';
      el.style.width = pinType.type === 'DOUBLE_RING' ? '54px' : '46px';
      el.style.height = '46px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.zIndex = '60';

      if (pinType.type === 'DOUBLE_RING') {
        // Entrambi: Doppio Anello (Viola e Oro) con entrambi i simboli π e 🏪
        const outerRing = document.createElement('div');
        outerRing.style.position = 'absolute';
        outerRing.style.inset = '-7px';
        outerRing.style.borderRadius = '999px';
        outerRing.style.border = '2.5px solid #ffd700';
        outerRing.style.boxShadow = '0 0 16px rgba(255, 215, 0, 0.8)';
        outerRing.style.pointerEvents = 'none';

        const innerRing = document.createElement('div');
        innerRing.style.position = 'absolute';
        innerRing.style.inset = '-2px';
        innerRing.style.borderRadius = '999px';
        innerRing.style.border = '2px solid #a855f7';
        innerRing.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.75)';
        innerRing.style.pointerEvents = 'none';

        el.appendChild(outerRing);
        el.appendChild(innerRing);
      } else if (pinType.type === 'PI_ACCEPTED') {
        // Accetta Pi: icona π (Viola/Oro lampeggiante)
        const blinkRing = document.createElement('div');
        blinkRing.style.position = 'absolute';
        blinkRing.style.inset = '-6px';
        blinkRing.style.borderRadius = '50%';
        blinkRing.style.backgroundColor = 'rgba(168, 85, 247, 0.45)';
        blinkRing.style.border = '2px solid #ffd700';
        blinkRing.style.animation = 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite';
        blinkRing.style.pointerEvents = 'none';
        el.appendChild(blinkRing);
      } else {
        // Solo Pubblicità: icona 🏪 (Oro fisso)
        const solidRing = document.createElement('div');
        solidRing.style.position = 'absolute';
        solidRing.style.inset = '-4px';
        solidRing.style.borderRadius = '50%';
        solidRing.style.border = '2px solid #ffd700';
        solidRing.style.boxShadow = '0 0 12px rgba(255, 215, 0, 0.65)';
        solidRing.style.pointerEvents = 'none';
        el.appendChild(solidRing);
      }

      const dot = document.createElement('div');
      dot.style.position = 'relative';
      dot.style.height = '36px';
      dot.style.width = pinType.type === 'DOUBLE_RING' ? '48px' : '36px';
      dot.style.borderRadius = pinType.type === 'DOUBLE_RING' ? '999px' : '50%';
      dot.style.display = 'flex';
      dot.style.alignItems = 'center';
      dot.style.justifyContent = 'center';
      dot.style.gap = '2px';
      dot.style.fontWeight = '900';
      dot.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';

      if (pinType.type === 'DOUBLE_RING') {
        dot.style.background = 'linear-gradient(135deg, #7c3aed 0%, #d97706 100%)';
        dot.style.border = '2.5px solid #ffd700';
        dot.style.boxShadow = '0 6px 20px rgba(0,0,0,0.92), 0 0 16px rgba(255, 215, 0, 0.85)';
        dot.style.color = '#ffd700';
        dot.style.fontSize = '14px';
        dot.innerHTML = '<span style="font-family:serif;font-weight:900;color:#ffffff">π</span><span style="font-size:13px">🏪</span>';
      } else if (pinType.type === 'PI_ACCEPTED') {
        dot.style.background = 'linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)';
        dot.style.border = '2.5px solid #ffd700';
        dot.style.boxShadow = '0 6px 20px rgba(0,0,0,0.9), 0 0 16px rgba(168, 85, 247, 0.9)';
        dot.style.color = '#ffd700';
        dot.style.fontSize = '19px';
        dot.style.animation = 'pulse 1.5s ease-in-out infinite';
        dot.innerHTML = '<span style="font-family:serif;font-weight:900;">π</span>';
      } else {
        dot.style.background = 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)';
        dot.style.border = '2.5px solid #ffffff';
        dot.style.boxShadow = '0 6px 20px rgba(0,0,0,0.85), 0 0 14px rgba(251, 191, 36, 0.85)';
        dot.style.fontSize = '16px';
        dot.innerHTML = '<span>🏪</span>';
      }

      const tooltip = document.createElement('div');
      tooltip.style.position = 'absolute';
      tooltip.style.bottom = '125%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.padding = '7px 14px';
      tooltip.style.borderRadius = '12px';
      tooltip.style.backgroundColor = '#05070e';
      tooltip.style.border = `2px solid ${pinType.type === 'PI_ACCEPTED' ? '#a855f7' : '#ffd700'}`;
      tooltip.style.color = '#ffffff';
      tooltip.style.fontSize = '12px';
      tooltip.style.fontWeight = '800';
      tooltip.style.whiteSpace = 'nowrap';
      tooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.95)';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.opacity = '0';
      tooltip.style.transition = 'opacity 0.15s ease';
      tooltip.style.zIndex = '80';

      const badgeLabel = pinType.type === 'DOUBLE_RING'
        ? 'π 🏪 DOPPIO ANELLO (Accetta Pi + Vetrina)'
        : pinType.type === 'PI_ACCEPTED'
        ? 'π ACCETTA PI NETWORK'
        : '🏪 VETRINA PUBBLICITARIA (ORO FISSO)';

      tooltip.innerHTML = `<span style="color:${pinType.badgeBg}; font-size:10px; display:block;">${badgeLabel}</span><strong>${biz.name}</strong> • ${biz.city || selectedCity}`;

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

      // Al click su un pin commerciante -> apre sempre MerchantDetailModal
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedSponsor(null);
        setSelectedMerchantModal(biz);
        map.easeTo({
          center: [bizLng, bizLat],
          zoom: Math.max(map.getZoom(), 17.0),
          duration: 600,
        });
      });

      const bizMarker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([bizLng, bizLat])
        .addTo(map);

      if (bizMarker.getElement()) {
        bizMarker.getElement().style.zIndex = '60';
      }

      merchantMarkersRef.current.push(bizMarker);
    });
  }, [allMerchants, mapStyleMode, hasValidCoords, effectiveLat, effectiveLng, selectedCity]);

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

  const renderRouteOnMap = (routeCoordinates) => {
    const map = mapRef.current;
    if (!map || !Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return;
    const geojsonData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates,
      },
    };

    const applyRouteGeometry = () => {
      try {
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

        // Assicura che i marker commercianti restino sempre in primo piano sopra la linea del percorso
        merchantMarkersRef.current.forEach((m) => {
          if (m && typeof m.getElement === 'function' && m.getElement()) {
            m.getElement().style.zIndex = '60';
          }
        });
      } catch (err) {
        console.warn('Route render notice:', err);
      }
    };

    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
      map.once('styledata', applyRouteGeometry);
      return;
    }
    applyRouteGeometry();
  };

  const ensureBlueArrowMarker = (uLat, uLng, headingDeg = 0) => {
    const map = mapRef.current;
    if (!map) return;

    if (!userArrowMarkerRef.current) {
      const containerEl = document.createElement('div');
      containerEl.style.width = '46px';
      containerEl.style.height = '46px';
      containerEl.style.display = 'flex';
      containerEl.style.alignItems = 'center';
      containerEl.style.justifyContent = 'center';
      containerEl.style.position = 'relative';
      containerEl.style.zIndex = '70';
      containerEl.style.pointerEvents = 'none';

      const halo = document.createElement('div');
      halo.style.position = 'absolute';
      halo.style.inset = '-4px';
      halo.style.borderRadius = '50%';
      halo.style.backgroundColor = 'rgba(59, 130, 246, 0.35)';
      halo.style.animation = 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite';

      const inner = document.createElement('div');
      inner.style.width = '36px';
      inner.style.height = '36px';
      inner.style.borderRadius = '50%';
      inner.style.background = 'rgba(15, 23, 42, 0.85)';
      inner.style.border = '2.5px solid #60a5fa';
      inner.style.boxShadow = '0 0 18px rgba(37, 99, 235, 0.9)';
      inner.style.display = 'flex';
      inner.style.alignItems = 'center';
      inner.style.justifyContent = 'center';
      inner.style.transition = 'transform 0.3s ease';
      inner.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L20 20L12 16L4 20L12 2Z" fill="#3b82f6" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/></svg>`;

      containerEl.appendChild(halo);
      containerEl.appendChild(inner);
      userArrowInnerRef.current = inner;

      const marker = new maplibregl.Marker({
        element: containerEl,
        anchor: 'center',
      })
        .setLngLat([uLng, uLat])
        .addTo(map);

      if (marker.getElement()) {
        marker.getElement().style.zIndex = '70';
      }
      userArrowMarkerRef.current = marker;
    } else {
      userArrowMarkerRef.current.setLngLat([uLng, uLat]);
    }

    if (userArrowInnerRef.current && Number.isFinite(headingDeg)) {
      userArrowInnerRef.current.style.transform = `rotate(${headingDeg}deg)`;
    }
  };

  const handleCalculateRoute = async (destLat, destLng, destName, customProfile = navProfile, startCoords = null, silent = false) => {
    if (!mapRef.current || !isValidCoord(destLat, destLng)) {
      if (!silent) toast.error('Coordinate di destinazione reali non valide');
      return null;
    }
    const startLat = startCoords?.lat ?? userLocation?.lat ?? effectiveLat;
    const startLng = startCoords?.lng ?? userLocation?.lng ?? effectiveLng;
    if (!isValidCoord(startLat, startLng)) return null;

    setIsCalculatingRoute(true);
    try {
      const routes = await calculateRealRoutes(startLat, startLng, destLat, destLng, customProfile, true);
      if (!routes || routes.length === 0) {
        if (!silent) {
          setActiveRoute(null);
          setRouteWeather(null);
          if (mapRef.current.getSource('real-route-source')) {
            mapRef.current.getSource('real-route-source').setData({
              type: 'FeatureCollection',
              features: [],
            });
          }
          toast.error('Percorso stradale non disponibile da OSRM', {
            description: 'Il servizio di routing reale non ha trovato un itinerario valido per questa modalità.',
          });
        }
        return null;
      }

      const primaryRoute = routes[0];
      const nextRoute = {
        ...primaryRoute,
        destinationName: destName,
        destLat,
        destLng,
        alternatives: routes,
        selectedAlternativeIdx: 0,
      };
      setActiveRoute(nextRoute);
      setNavDestination({ lat: destLat, lng: destLng, name: destName });

      const profileLabel =
        customProfile === 'walking' ? 'A piedi' : customProfile === 'cycling' ? 'In bici' : 'In auto';
      if (!silent) {
        toast.success(
          `🧭 Percorso (${profileLabel}) verso ${destName}: ${primaryRoute.totalDistanceKm} km (${primaryRoute.totalDurationMinutes} min)`
        );
      }

      renderRouteOnMap(primaryRoute.coordinates);

      if (!silent) {
        const bounds = new maplibregl.LngLatBounds();
        primaryRoute.coordinates.forEach((coord) => bounds.extend(coord));
        mapRef.current.fitBounds(bounds, { padding: 70, duration: 800 });
      }

      // Carica meteo reale lungo il percorso (Open-Meteo Partenza / Metà / Arrivo)
      getRouteWeatherForecast(primaryRoute.coordinates)
        .then((forecast) => {
          setRouteWeather(forecast);
        })
        .catch(() => {
          setRouteWeather(null);
        });

      return nextRoute;
    } catch (err) {
      console.error('Errore calcolo percorso:', err);
      if (!silent) toast.error('Percorso stradale non disponibile da OSRM');
    } finally {
      setIsCalculatingRoute(false);
    }
    return null;
  };

  const selectAlternativeRoute = (idx) => {
    if (!activeRoute || !Array.isArray(activeRoute.alternatives) || !activeRoute.alternatives[idx]) return;
    const alt = activeRoute.alternatives[idx];
    const updated = {
      ...activeRoute,
      ...alt,
      selectedAlternativeIdx: idx,
    };
    setActiveRoute(updated);
    renderRouteOnMap(alt.coordinates);
    getRouteWeatherForecast(alt.coordinates)
      .then((forecast) => setRouteWeather(forecast))
      .catch(() => {});
  };

  const stopTurnByTurnNavigation = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (userArrowMarkerRef.current) {
      userArrowMarkerRef.current.remove();
      userArrowMarkerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    lastSpokenBannerRef.current = '';
    userArrowInnerRef.current = null;
    prevGpsRef.current = null;
    userHasAdjustedZoomRef.current = false;
    userHasPannedRef.current = false;
    setIsGpsFollowPaused(false);
    setIsNavigating(false);
    toast.info('🛑 Navigazione terminata');
  };

  const recenterGpsNavigation = () => {
    userHasPannedRef.current = false;
    userHasAdjustedZoomRef.current = false;
    setIsGpsFollowPaused(false);
    if (mapRef.current && userLocation) {
      mapRef.current.easeTo({
        center: [userLocation.lng, userLocation.lat],
        bearing: userLocation.heading || 0,
        pitch: 62,
        zoom: 17.5,
        duration: 600,
      });
    }
  };

  const startTurnByTurnNavigation = async (targetDest = null, forcedProfile = null) => {
    if (!mapRef.current || !hasValidCoords) return;
    const profileToUse = forcedProfile || navProfile;

    // Determina destinazione reale (niente offset +0.004 inventati)
    let dest = targetDest && isValidCoord(targetDest.lat, targetDest.lng) ? targetDest : null;
    if (!dest && navDestination && isValidCoord(navDestination.lat, navDestination.lng)) {
      dest = navDestination;
    }
    if (!dest && (selectedMerchantModal || selectedSponsor)) {
      const biz = selectedMerchantModal || selectedSponsor;
      if (isValidCoord(biz.lat, biz.lng)) {
        dest = { lat: biz.lat, lng: biz.lng, name: biz.name };
      }
    }
    if (!dest && allMerchants.length > 0) {
      let nearestBiz = null;
      let minD = Infinity;
      allMerchants.forEach((b) => {
        if (isValidCoord(b.lat, b.lng)) {
          const d = haversineMeters(effectiveLat, effectiveLng, b.lat, b.lng);
          if (d < minD) {
            minD = d;
            nearestBiz = b;
          }
        }
      });
      if (nearestBiz) {
        dest = { lat: nearestBiz.lat, lng: nearestBiz.lng, name: nearestBiz.name };
      }
    }
    if (!dest) {
      toast.error('Seleziona una destinazione reale dalla ricerca o da un pin sulla mappa');
      return;
    }

    // Ottieni posizione iniziale GPS se disponibile (con fallback rapido alla vista corrente)
    const getStartPosition = () =>
      new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          resolve({ lat: effectiveLat, lng: effectiveLng, heading: 0 });
          return;
        }
        let settled = false;
        const fallbackTimer = setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve({ lat: effectiveLat, lng: effectiveLng, heading: 0 });
          }
        }, 2500);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!settled) {
              settled = true;
              clearTimeout(fallbackTimer);
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                heading: Number.isFinite(pos.coords.heading) ? pos.coords.heading : 0,
              });
            }
          },
          () => {
            if (!settled) {
              settled = true;
              clearTimeout(fallbackTimer);
              resolve({ lat: effectiveLat, lng: effectiveLng, heading: 0 });
            }
          },
          { enableHighAccuracy: true, timeout: 2200 }
        );
      });

    const initialPos = await getStartPosition();
    const calculated = await handleCalculateRoute(dest.lat, dest.lng, dest.name, profileToUse, initialPos);
    if (!calculated) return;

    const initialHeading = computeBearingDeg(initialPos.lat, initialPos.lng, dest.lat, dest.lng);
    userHasAdjustedZoomRef.current = false;
    userHasPannedRef.current = false;
    lastRerouteAtRef.current = Date.now();
    setIsGpsFollowPaused(false);
    setUserLocation({ lat: initialPos.lat, lng: initialPos.lng, heading: initialHeading });
    ensureBlueArrowMarker(initialPos.lat, initialPos.lng, initialHeading);
    setIsNavigating(true);

    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [initialPos.lng, initialPos.lat],
        bearing: initialHeading,
        pitch: 62,
        zoom: 17.5,
        duration: 800,
      });
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation && typeof navigator.geolocation.watchPosition === 'function') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          let heading = pos.coords.heading;
          if (typeof heading !== 'number' || Number.isNaN(heading)) {
            if (prevGpsRef.current) {
              const moved = haversineMeters(prevGpsRef.current.lat, prevGpsRef.current.lng, uLat, uLng);
              if (moved > 2) {
                heading = computeBearingDeg(prevGpsRef.current.lat, prevGpsRef.current.lng, uLat, uLng);
              }
            }
            if (typeof heading !== 'number' || Number.isNaN(heading)) {
              heading = computeBearingDeg(uLat, uLng, dest.lat, dest.lng);
            }
          }
          prevGpsRef.current = { lat: uLat, lng: uLng };
          setUserLocation({ lat: uLat, lng: uLng, heading });
          ensureBlueArrowMarker(uLat, uLng, heading);

          // Ricalcolo automatico se il dispositivo devia oltre 55 metri dalla linea stradale OSRM
          const currentRoute = activeRouteRef.current;
          if (
            currentRoute &&
            Array.isArray(currentRoute.coordinates) &&
            currentRoute.coordinates.length >= 2 &&
            isValidCoord(currentRoute.destLat, currentRoute.destLng) &&
            !isReroutingRef.current &&
            Date.now() - lastRerouteAtRef.current > 12000
          ) {
            const devMeters = distanceToRouteMeters(uLat, uLng, currentRoute.coordinates);
            if (devMeters > 55) {
              isReroutingRef.current = true;
              lastRerouteAtRef.current = Date.now();
              toast.info('🔄 Deviazione rilevata: ricalcolo percorso reale...');
              handleCalculateRoute(
                currentRoute.destLat,
                currentRoute.destLng,
                currentRoute.destinationName || dest.name,
                navProfileRef.current,
                { lat: uLat, lng: uLng },
                true
              ).finally(() => {
                isReroutingRef.current = false;
              });
            }
          }

          const easeOptions = computeGpsCameraEaseOptions({
            uLat,
            uLng,
            heading,
            userHasAdjustedZoom: userHasAdjustedZoomRef.current,
            userHasPanned: userHasPannedRef.current,
          });
          if (mapRef.current && easeOptions) {
            mapRef.current.easeTo(easeOptions);
          }
        },
        (err) => {
          console.warn('GPS watchPosition notice:', err?.message || err);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  };

  const handleClearRoute = () => {
    stopTurnByTurnNavigation();
    setActiveRoute(null);
    setRouteWeather(null);
    setNavDestination(null);
    if (mapRef.current && mapRef.current.getSource('real-route-source')) {
      mapRef.current.getSource('real-route-source').setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  };

  const nextTurnBanner = useMemo(
    () => buildNextTurnBanner(activeRoute, userLocation?.lat ?? effectiveLat, userLocation?.lng ?? effectiveLng),
    [activeRoute, userLocation, effectiveLat, effectiveLng]
  );

  // Sintesi vocale indicazioni svolta-per-svolta (Web Speech API)
  useEffect(() => {
    if (!isNavigating || !voiceEnabled || !nextTurnBanner?.text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (lastSpokenBannerRef.current === nextTurnBanner.text) return;
    lastSpokenBannerRef.current = nextTurnBanner.text;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(nextTurnBanner.text);
      utter.lang = 'it-IT';
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignora eventuali restrizioni browser autoplay
    }
  }, [isNavigating, voiceEnabled, nextTurnBanner]);

  // Caricamento e rimozione overlay radar RainViewer direttamente su MapLibre
  const updateMapLibreRadarLayer = (host, frame) => {
    const map = mapRef.current;
    if (!map || !frame) return;
    const tileUrl = buildRainViewerMapLibreTileUrl(host, frame, false);
    const applyLayer = () => {
      try {
        if (map.getLayer('rainviewer-radar-layer')) {
          map.removeLayer('rainviewer-radar-layer');
        }
        if (map.getSource('rainviewer-radar-source')) {
          map.removeSource('rainviewer-radar-source');
        }
        map.addSource('rainviewer-radar-source', {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          maxzoom: 12,
          attribution: 'RainViewer Radar',
        });
        const beforeId = map.getLayer('3d-buildings') ? '3d-buildings' : undefined;
        map.addLayer(
          {
            id: 'rainviewer-radar-layer',
            type: 'raster',
            source: 'rainviewer-radar-source',
            paint: { 'raster-opacity': 0.58 },
          },
          beforeId
        );
      } catch (e) {
        console.warn('RainViewer MapLibre layer notice:', e);
      }
    };
    if (map.isStyleLoaded()) {
      applyLayer();
    } else {
      map.once('load', applyLayer);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!radarOverlayEnabled) {
      setRadarPlaying(false);
      if (map) {
        try {
          if (map.getLayer('rainviewer-radar-layer')) map.removeLayer('rainviewer-radar-layer');
          if (map.getSource('rainviewer-radar-source')) map.removeSource('rainviewer-radar-source');
        } catch {
          // ignore
        }
      }
      return;
    }

    let alive = true;
    setRadarLoading(true);
    setRadarError(false);
    getRainViewerRadarData()
      .then((payload) => {
        if (!alive) return;
        const frames = collectRainViewerTimelineFrames(payload);
        if (!payload || frames.length === 0) {
          setRadarError(true);
          setRadarFrames([]);
          toast.error('Radar meteorologico RainViewer non disponibile');
          return;
        }
        const host = payload.host || 'https://tilecache.rainviewer.com';
        const lastIdx = Math.max(0, frames.length - 1);
        setRadarHost(host);
        setRadarFrames(frames);
        setRadarFrameIdx(lastIdx);
        setRadarSourceLabel(payload.source || 'RainViewer Doppler Radar');
        updateMapLibreRadarLayer(host, frames[lastIdx]);
      })
      .catch(() => {
        if (alive) setRadarError(true);
      })
      .finally(() => {
        if (alive) setRadarLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [radarOverlayEnabled, mapStyleMode]);

  useEffect(() => {
    if (!radarOverlayEnabled || !radarPlaying || radarFrames.length <= 1 || !radarHost) return;
    const timer = setInterval(() => {
      setRadarFrameIdx((prev) => {
        const nextIdx = (prev + 1) % radarFrames.length;
        updateMapLibreRadarLayer(radarHost, radarFrames[nextIdx]);
        return nextIdx;
      });
    }, 1700);
    return () => clearInterval(timer);
  }, [radarOverlayEnabled, radarPlaying, radarFrames, radarHost]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${mapStyleMode === 'night3d' ? 'bg-[#0b1120]' : 'bg-[#e2e8f0]'}`}>
      {/* BANNER SUPERIORE NAVIGAZIONE ATTIVA (Turn-by-Turn) OPPURE BARRA DI RICERCA DESTINAZIONE */}
      {isNavigating && activeRoute ? (
        <div className="absolute top-14 left-2.5 right-14 z-40 pointer-events-auto max-w-xl bg-gradient-to-r from-sky-950/95 via-slate-950/95 to-emerald-950/95 backdrop-blur-md p-3 rounded-2xl border-2 border-sky-400/80 shadow-2xl flex flex-col gap-2 text-white">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-sky-500/40 animate-pulse">
                <Navigation className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-sky-300 truncate">
                  {nextTurnBanner.text}
                </div>
                <div className="text-[11px] text-zinc-200 font-bold flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>{navProfile === 'walking' ? '🚶 A piedi' : navProfile === 'cycling' ? '🚲 In bici' : '🚗 In auto'} • Verso {activeRoute.destinationName}</span>
                  <span className="text-[#00ff66]">{activeRoute.totalDistanceKm} km ({activeRoute.totalDurationMinutes} min)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setVoiceEnabled((prev) => !prev)}
                className={`p-2 rounded-xl border text-xs font-black cursor-pointer ${
                  voiceEnabled ? 'bg-emerald-500/20 border-emerald-400 text-[#00ff66]' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                }`}
                title={voiceEnabled ? 'Disattiva voce guida' : 'Attiva voce guida italiana'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {isGpsFollowPaused && (
                <button
                  id="btn-recenter-gps"
                  type="button"
                  onClick={recenterGpsNavigation}
                  className="px-2.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[11px] shrink-0 cursor-pointer shadow-lg active:scale-95"
                >
                  🎯 Ricentra GPS
                </button>
              )}
              <button
                id="btn-stop-turn-by-turn"
                type="button"
                onClick={stopTurnByTurnNavigation}
                className="px-2.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-[11px] shrink-0 cursor-pointer shadow-lg active:scale-95"
              >
                Termina
              </button>
            </div>
          </div>
          {routeWeather?.points?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[10px] text-zinc-300 border-t border-white/10 pt-1.5">
              <span className="text-sky-300 font-bold">Meteo percorso:</span>
              {routeWeather.points.map((pt, i) => (
                <span key={i} className="bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                  {pt.label} {pt.icon || pt.condition?.icon || '🌤️'} {pt.temp ?? pt.temperature ?? '--'}°C
                </span>
              ))}
              <span className="text-zinc-500 ml-auto">Traffico live: non disponibile</span>
            </div>
          )}
        </div>
      ) : activeRoute ? (
        <div className="absolute top-14 left-2.5 right-14 z-40 pointer-events-auto max-w-xl bg-black/95 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/50 shadow-2xl flex flex-col gap-2 text-white">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/30">
                <Navigation className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black flex items-center gap-2 truncate">
                  <span>Verso: {activeRoute.destinationName}</span>
                </div>
                <div className="text-[11px] text-zinc-300 font-bold mt-0.5">
                  {activeRoute.totalDistanceKm} km • {activeRoute.totalDurationMinutes} min ({navProfile === 'walking' ? '🚶 A piedi' : navProfile === 'cycling' ? '🚲 In bici' : '🚗 In auto'})
                </div>
                <div className="text-[10px] text-sky-300 font-bold truncate max-w-xs mt-0.5">
                  {nextTurnBanner.text}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="btn-start-turn-by-turn"
                type="button"
                onClick={() => startTurnByTurnNavigation()}
                className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[11px] cursor-pointer shadow-md"
              >
                Avvia Navigazione
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

          <div className="flex items-center justify-between gap-2 flex-wrap border-t border-zinc-800 pt-1.5 text-[10px]">
            {Array.isArray(activeRoute.alternatives) && activeRoute.alternatives.length > 1 ? (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-zinc-400 font-bold">Alternative OSRM:</span>
                {activeRoute.alternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectAlternativeRoute(idx)}
                    className={`px-2 py-0.5 rounded-md font-bold cursor-pointer border ${
                      activeRoute.selectedAlternativeIdx === idx
                        ? 'bg-[#00ff66] text-black border-[#00ff66]'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    #{idx + 1}: {alt.totalDistanceKm} km ({alt.totalDurationMinutes}m)
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-zinc-400 font-semibold">Fonte: OSRM (OpenStreetMap)</span>
            )}
            <span className="text-amber-400/90">Traffico live: fonte non configurata</span>
          </div>

          {routeWeather?.points?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[10px] text-zinc-300">
              <span className="text-sky-400 font-bold">Open-Meteo tratta:</span>
              {routeWeather.points.map((pt, i) => (
                <span key={i} className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {pt.label}: {pt.icon || pt.condition?.icon || '🌤️'} {pt.temp ?? pt.temperature ?? '--'}°C ({pt.windSpeed ?? '--'} km/h)
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* BARRA DI RICERCA DESTINAZIONE DIRETTA: Scrivi città, via, piazza o negozio */
        <div className="absolute top-14 left-2.5 right-14 z-30 pointer-events-auto max-w-lg">
          <div className="flex items-center gap-1.5 bg-black/90 backdrop-blur-md border border-zinc-700 focus-within:border-[#00ff66] rounded-xl px-2.5 py-1.5 shadow-2xl">
            <Search className="w-4 h-4 text-[#00ff66] shrink-0" />
            <input
              id="input-urbano-search-place"
              type="text"
              value={placeSearchQuery}
              onChange={(e) => setPlaceSearchQuery(e.target.value)}
              placeholder="Scrivi città, via, piazza o negozio..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-400 outline-none font-medium"
            />
            {placeSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setPlaceSearchQuery('');
                  setPlaceSearchResults([]);
                }}
                className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
                title="Cancella ricerca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowWorldModal(true)}
              className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-black text-sky-300 shrink-0 cursor-pointer"
              title="Sfoglia Paesi, Regioni e Comuni"
            >
              🌍 Città
            </button>
          </div>

          {(isSearchingPlace || placeSearchResults.length > 0) && (
            <div className="mt-1 bg-black/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
              {isSearchingPlace && placeSearchResults.length === 0 && (
                <div className="px-3 py-2 text-xs text-zinc-400">Cerco luoghi e vie in corso...</div>
              )}
              {placeSearchResults.map((resItem) => (
                <div
                  key={resItem.id}
                  className="px-3 py-2 border-b border-zinc-900 last:border-b-0 flex items-center justify-between gap-2 hover:bg-zinc-900/80"
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectWorldPlace(resItem);
                      setPlaceSearchQuery('');
                      setPlaceSearchResults([]);
                    }}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white truncate">{resItem.displayName || resItem.name}</div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectWorldPlace(resItem);
                        setPlaceSearchQuery('');
                        setPlaceSearchResults([]);
                      }}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black cursor-pointer"
                    >
                      👁️ Vedi 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaceSearchQuery('');
                        setPlaceSearchResults([]);
                        startTurnByTurnNavigation({
                          lat: resItem.lat,
                          lng: resItem.lng,
                          name: resItem.name,
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black text-[10px] font-black cursor-pointer"
                    >
                      🧭 Naviga
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BARRA RAPIDA AVVIO / MODALITÀ NAVIGAZIONE GPS SEMPRE ACCESSIBILE IN BASSO A SINISTRA */}
      {!isNavigating && (
        <div className="absolute bottom-12 left-3 sm:left-4 z-30 pointer-events-auto flex items-center gap-1 bg-black/90 border border-zinc-800 rounded-xl p-1 shadow-xl">
          <button
            type="button"
            onClick={() => setNavProfile('walking')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
              navProfile === 'walking' ? 'bg-sky-500 text-slate-950' : 'text-zinc-300 hover:bg-zinc-900'
            }`}
            title="Modalità navigazione a piedi"
          >
            🚶 Piedi
          </button>
          <button
            type="button"
            onClick={() => setNavProfile('cycling')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
              navProfile === 'cycling' ? 'bg-sky-500 text-slate-950' : 'text-zinc-300 hover:bg-zinc-900'
            }`}
            title="Modalità navigazione in bicicletta"
          >
            🚲 Bici
          </button>
          <button
            type="button"
            onClick={() => setNavProfile('driving')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
              navProfile === 'driving' ? 'bg-sky-500 text-slate-950' : 'text-zinc-300 hover:bg-zinc-900'
            }`}
            title="Modalità navigazione in auto"
          >
            🚗 Auto
          </button>
          <button
            id="btn-quick-start-navigation"
            type="button"
            onClick={() => startTurnByTurnNavigation()}
            disabled={isCalculatingRoute}
            className="px-2.5 py-1 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-md"
          >
            <Navigation className="w-3 h-3" />
            <span>{isCalculatingRoute ? 'Calcolo...' : 'Avvia Navigazione'}</span>
          </button>
        </div>
      )}
      {/* 1. LAYER MAPPA SATELLITARE WEBGL (FULL SCREEN) */}
      <div ref={mapContainerRef} className={`absolute inset-0 w-full h-full z-0 ${mapStyleMode === 'night3d' ? 'bg-[#0b1120]' : 'bg-[#e2e8f0]'}`} />

      {/* 1A. MODALITÀ OPZIONALE GOOGLE PHOTOREALISTIC 3D TILES (Strict API-key gated, costo zero di default) */}
      {useGooglePhotorealistic && hasValidCoords && (
        <Google3DUrbanLayer
          lat={effectiveLat}
          lng={effectiveLng}
          pitch={pitch}
          bearing={bearing}
          cityName={selectedCity}
          onFallbackToOpenData={() => setUseGooglePhotorealistic(false)}
        />
      )}

      {!hasValidCoords && (
        <div className="absolute inset-0 z-20 bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-[#00ff66] flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Seleziona un Territorio o una Città</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Nessuna coordinata territoriale preselezionata. Scegli un Paese o una città dal navigatore globale oppure torna al Globo 3D.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowWorldModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black cursor-pointer transition-colors"
              >
                🌍 Scegli Paese / Città
              </button>
              {onBackToGlobe && (
                <button
                  type="button"
                  onClick={onBackToGlobe}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  ← Torna al Globo 3D
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

        {/* CICLO STILE CARTOGRAFICO: STRADALE 3D -> SATELLITE -> NOTTE */}
        <button
          id="btn-urbano-style-mode"
          type="button"
          onClick={() => {
            setMapStyleMode((prev) => {
              const next = prev === 'vector3d' ? 'satellite' : prev === 'satellite' ? 'night3d' : 'vector3d';
              toast.info(
                next === 'satellite'
                  ? '🛰️ Vista Satellitare + Edifici OSM 3D'
                  : next === 'night3d'
                  ? '🌙 Vista Notturna Urbana 3D'
                  : '🗺️ Vista Stradale Architettonica 3D'
              );
              return next;
            });
          }}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 font-black text-[8px]"
          title="Cambia stile cartografico (Stradale 3D / Satellite / Notte)"
        >
          <Layers className="w-4 h-4 text-[#00ff66]" />
          <span className="leading-none mt-0.5 uppercase">
            {mapStyleMode === 'satellite' ? 'SAT' : mapStyleMode === 'night3d' ? 'NOTTE' : 'MAPPA'}
          </span>
        </button>

        {/* TOGGLE RILIEVO OROGRAFICO TERRARIUM DEM 3D */}
        <button
          id="btn-urbano-terrain-dem"
          type="button"
          onClick={() => setShowTerrain3D((prev) => !prev)}
          className={`w-10 h-10 rounded-xl shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all border active:scale-90 font-black text-[8px] ${
            showTerrain3D
              ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/30'
              : 'bg-slate-900/90 text-emerald-300 border-slate-700/80 hover:bg-slate-800'
          }`}
          title="Attiva/Disattiva rilievo orografico reale DEM Terrarium"
        >
          <Mountain className="w-4 h-4" />
          <span className="leading-none mt-0.5">DEM</span>
        </button>

        {/* TOGGLE GOOGLE PHOTOREALISTIC 3D TILES OPZIONALE (GATED DA CHIAVE API) */}
        <button
          id="btn-urbano-photorealistic"
          type="button"
          onClick={() => {
            const hasKey = Boolean(getConfiguredGoogleMapsKey());
            if (!useGooglePhotorealistic && !hasKey) {
              toast.info('Google Photorealistic 3D Tiles richiede VITE_GOOGLE_MAPS_API_KEY', {
                description: 'Apro l’informativa sicura a costo zero con fallback Open-Data 3D.',
              });
            }
            setUseGooglePhotorealistic((prev) => !prev);
          }}
          className={`w-10 h-10 rounded-xl shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all border active:scale-90 font-black text-[8px] ${
            useGooglePhotorealistic
              ? 'bg-[#00ff66] text-black border-[#00ff66] shadow-[#00ff66]/30'
              : 'bg-slate-900/90 text-amber-300 border-slate-700/80 hover:bg-slate-800'
          }`}
          title="Google Photorealistic 3D Tiles (Opzionale con API Key)"
        >
          <Building2 className="w-4 h-4" />
          <span className="leading-none mt-0.5">FOTO3D</span>
        </button>

        {/* WEBCAM LIVE WINDY V3 */}
        <button
          id="btn-urbano-webcams"
          type="button"
          onClick={() => setShowWebcamsModal(true)}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700/80 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 font-black text-[8px]"
          title="Webcam Live territoriali (Windy Webcams API v3)"
        >
          <Camera className="w-4 h-4" />
          <span className="leading-none mt-0.5">CAM</span>
        </button>

        {/* TOGGLE RADAR PRECIPITAZIONI RAINVIEWER SU MAPPA */}
        <button
          id="btn-urbano-radar"
          type="button"
          onClick={() => setRadarOverlayEnabled((prev) => !prev)}
          className={`w-10 h-10 rounded-xl shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all border active:scale-90 font-black text-[9px] ${
            radarOverlayEnabled
              ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-sky-500/30'
              : 'bg-slate-900/90 text-sky-400 border-slate-700/80 hover:bg-slate-800'
          }`}
          title="Mostra/Nascondi radar meteorologico reale RainViewer sulla mappa"
        >
          <Radar className="w-4 h-4" />
          <span className="text-[7px] leading-none mt-0.5">RADAR</span>
        </button>

        {/* STREET VIEW 360° & NAVIGAZIONE STRADALE INTEGRATA */}
        <button
          id="btn-open-street-view-360"
          type="button"
          onClick={() => {
            setShowStreetView(true);
            toast.success(`🚶 Entro in Street View 360° a ${selectedCity}`, {
              description: 'Ricerca fotografie stradali reali Panoramax / Mapillary',
              duration: 3000,
            });
          }}
          className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-300 shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all active:scale-90 font-black text-[11px]"
          title="Street View 360°: Visualizza foto panoramiche stradali reali"
        >
          <span>360°</span>
        </button>
      </div>

      {/* CONTROLLO TIMELINE RADAR METEO IN MAPPA URBANA QUANDO ATTIVO */}
      {radarOverlayEnabled && (
        <div className="absolute bottom-14 right-14 z-30 pointer-events-auto bg-black/90 backdrop-blur-md border border-sky-500/50 rounded-xl px-2.5 py-1.5 text-[10px] text-white shadow-xl flex items-center gap-2">
          <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          {radarLoading ? (
            <span className="text-zinc-300">Caricamento radar RainViewer...</span>
          ) : radarError || radarFrames.length === 0 ? (
            <span className="text-amber-300">Radar RainViewer non disponibile</span>
          ) : (
            <>
              <span className="text-sky-200 font-bold">
                {radarSourceLabel} •{' '}
                {radarFrames[radarFrameIdx]?.time
                  ? new Date(radarFrames[radarFrameIdx].time * 1000).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Live'}
              </span>
              {radarFrames.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRadarPlaying((prev) => !prev)}
                  className="px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 font-black flex items-center gap-1 cursor-pointer"
                >
                  {radarPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                  <span>{radarFrameIdx + 1}/{radarFrames.length}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

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
        {weatherData ? (
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
        ) : (
          <>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setShowWeatherModal(true)}
              className="hover:text-sky-300 cursor-pointer flex items-center gap-1 transition-colors text-slate-400 font-semibold"
              title="Apri pannello meteo Open-Meteo"
            >
              <CloudSun className="w-3 h-3 text-sky-400" />
              <span>Meteo</span>
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
      {showWeatherModal && (
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
                      {isValidCoord(selectedSponsor.lat ?? effectiveLat, selectedSponsor.lng ?? effectiveLng)
                        ? `Lat: ${(selectedSponsor.lat ?? effectiveLat).toFixed(4)} • Lng: ${(selectedSponsor.lng ?? effectiveLng).toFixed(4)}`
                        : 'Coordinate non disponibili'}
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
                  if (!isValidCoord(selectedSponsor.lat, selectedSponsor.lng)) {
                    toast.error('Coordinate reali di questo esercente non disponibili');
                    return;
                  }
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

      {/* MODALE UFFICIALE DETTAGLIO COMMERCIANTE (Aperto al click su qualsiasi pin commerciante) */}
      <MerchantDetailModal
        isOpen={Boolean(selectedMerchantModal)}
        onClose={() => setSelectedMerchantModal(null)}
        businesses={allMerchants}
        selectedBusiness={selectedMerchantModal}
        onSelectBusiness={(biz) => setSelectedMerchantModal(biz)}
        onOpenVoiceChat={(biz) => {
          if (onOpenVoiceChat) onOpenVoiceChat(biz);
        }}
        onFlyToBusiness={(biz) => {
          if (mapRef.current && isValidCoord(biz.lat, biz.lng)) {
            mapRef.current.flyTo({
              center: [biz.lng, biz.lat],
              zoom: 17.5,
              pitch: 60,
              duration: 900,
            });
          }
        }}
        onNavigateToBusiness={(biz) => {
          if (!isValidCoord(biz.lat, biz.lng)) {
            toast.error('Coordinate reali di questa attività non disponibili');
            return;
          }
          startTurnByTurnNavigation({
            lat: biz.lat,
            lng: biz.lng,
            name: biz.name,
          });
        }}
      />

      {/* MODAL WEBCAM LIVE WINDY V3 */}
      <LiveWebcamsModal
        isOpen={showWebcamsModal}
        onClose={() => setShowWebcamsModal(false)}
        lat={hasValidCoords ? effectiveLat : null}
        lng={hasValidCoords ? effectiveLng : null}
        cityName={selectedCity}
      />

      {/* MODAL STREET VIEW 360° CON NAVIGAZIONE STRADALE SVOLTA PER SVOLTA */}
      <StreetView360Modal
        isOpen={showStreetView}
        onClose={() => setShowStreetView(false)}
        lat={isValidCoord(selectedSponsor?.lat, selectedSponsor?.lng) ? selectedSponsor.lat : effectiveLat}
        lng={isValidCoord(selectedSponsor?.lat, selectedSponsor?.lng) ? selectedSponsor.lng : effectiveLng}
        cityName={selectedSponsor?.city || selectedCity}
        streetName={selectedSponsor?.address || `Via ${selectedCity}`}
      />
    </div>
  );
}
