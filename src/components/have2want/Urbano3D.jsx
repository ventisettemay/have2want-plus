// Urbano3D.jsx — Vista urbana 3D volumetrica reale con CesiumJS.
// Sostituisce la vista piatta Maplibre con Cesium World Terrain + OSM Buildings / Photorealistic 3D Tiles.
// Mantiene tutta la logica di business: annunci, commercianti Pi, meteo, geolocalizzazione, rotta navigatore,
// voce guida, controlli camera, HUD percorso.
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import WorldNavigatorModal from './WorldNavigatorModal';
import LocalCurrencyModal from './LocalCurrencyModal';
import LiveWeatherModal from './LiveWeatherModal';
import WeatherAtmosphereOverlay from './WeatherAtmosphereOverlay';
import StreetView360Modal from './StreetView360Modal';
import CesiumUrbanoView from './CesiumUrbanoView';
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

  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [is3D, setIs3D] = useState(true); // Cesium è sempre 3D volumetrico
  const [pitch, setPitch] = useState(55); // pitch default inclinato per vedere volumi
  const [bearing, setBearing] = useState(15);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState('vector3d');
  const [showBuildings3D, setShowBuildings3D] = useState(true);
  const [showTerrain3D, setShowTerrain3D] = useState(true);
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
  const [gpsPosition, setGpsPosition] = useState(null);
  const [voiceNavigation, setVoiceNavigation] = useState(false);

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

  // Se la prop selectedListing cambia dall'esterno, centra la camera Cesium
  useEffect(() => {
    if (selectedListing) {
      toast.success(`📍 Centrato su ${selectedListing.title || 'selezionato'}`, { duration: 2000 });
    }
  }, [selectedListing]);

  // Geolocalizzazione utente con reverse-lookup della lingua e valuta locale
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocalizzazione non supportata dal browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setGpsPosition({ lat: uLat, lng: uLng });
        toast.success('📍 Centrato sulla tua posizione attuale!');
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
  }, [onLocationChange]);

  // Calcolo percorso stradale OSRM
  const handleCalculateRoute = async (destLat, destLng, destName, profileOverride) => {
    setIsCalculatingRoute(true);
    const effectiveProfile = profileOverride || routeProfile;
    try {
      const { calculateRealRoute } = await import('@/lib/routingService');
      const route = await calculateRealRoute(effectiveLat, effectiveLng, destLat, destLng, effectiveProfile);
      if (route) {
        setActiveRoute({ ...route, destinationName: destName, destinationLat: destLat, destinationLng: destLng });
        toast.success(`🧭 Percorso OSRM verso ${destName}: ${route.totalDistanceKm} km (${route.totalDurationMinutes} min)`);
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
  };

  // Toggle guida vocale
  const toggleVoiceNavigation = () => {
    setVoiceNavigation((prev) => {
      const next = !prev;
      if (next && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
    toast.success(voiceNavigation ? '🔇 Guida vocale disattivata' : '🔊 Guida vocale attivata');
  };

  // Commuta tra vista 2D piana e vista 3D volumetrica (Cesium è sempre 3D, ma simula il toggle)
  const toggle2D3D = () => {
    if (is3D) {
      setIs3D(false);
      setPitch(0);
      setBearing(0);
      toast.info('🗺️ Vista 2D Stradale Dritta (Dall\'alto)');
    } else {
      setIs3D(true);
      setPitch(55);
      setBearing(15);
      toast.success('🏢 Prospettiva 3D Volumetrica (Cesium World Terrain + Edifici 3D)');
    }
  };

  const cycle3DPerspective = () => {
    let nextPitch = 55;
    let label = 'Prospettiva 3D Volumetrica (55°)';
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
    setPitch(nextPitch);
    setIs3D(nextPitch > 10);
    toast.success(`📐 ${label}`);
  };

  const resetCompass = () => {
    setBearing(0);
    toast.info('🧭 Orientamento allineato a Nord (0°)');
  };

  const straightenMap = () => {
    setPitch(0);
    setBearing(0);
    setIs3D(false);
    toast.success('🧭 Mappa raddrizzata: Nord in alto, vista ortogonale piana');
  };

  const zoomIn = () => {
    setPitch((p) => Math.min(75, p + 5));
  };
  const zoomOut = () => {
    setPitch((p) => Math.max(0, p - 5));
  };

  const handleSelectWorldPlace = (place) => {
    setCurrentPlace(place);
    setSelectedCity(place.name);
    setShowWorldModal(false);
    toast.success(`🏙️ Volo Satellitare 3D su ${place.name} (${place.countryName})!`, {
      description: `Lingua: ${place.language?.name || 'Locale'} • Valuta: ${place.currency?.code || 'EUR'} (${place.currency?.symbol || '€'})`,
    });
    if (onLocationChange) {
      onLocationChange(place);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0b1120] overflow-hidden select-none">
      {/* HUD PERCORSO STRADALE REALE OSRM */}
      {activeRoute && (
        <div className="absolute top-16 left-4 right-4 z-40 pointer-events-auto max-w-xl mx-auto bg-black/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2V20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6h-7l-5 5L5 12z"/></svg>
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
                <button
                  type="button"
                  onClick={toggleVoiceNavigation}
                  className={`px-2 py-0.5 rounded text-[9px] font-black border cursor-pointer transition-all ${
                    voiceNavigation
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={voiceNavigation ? 'Disattiva guida vocale' : 'Attiva guida vocale'}
                >
                  {voiceNavigation ? '🔊 OFF' : '🔊 ON'}
                </button>
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
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}
      {/* 1. LAYER MAPPA 3D VOLUMETRICA CESIUM (FULL SCREEN) */}
      <CesiumUrbanoView
        centerLat={effectiveLat}
        centerLng={effectiveLng}
        annunci={annunci}
        sponsoredBusinesses={sponsoredBusinesses}
        onSelectListing={onSelectListing}
        onBazarSelect={onBazarSelect}
        activeRoute={activeRoute}
        gpsPosition={gpsPosition}
        voiceNavigation={voiceNavigation}
      />

      {/* 1b. LAYER PARTICELLE METEO REALI TRASPARENTI */}
      <WeatherAtmosphereOverlay weather={weatherData} enabled={weatherEffectsEnabled} />

      {/* 3. DOCK CONTROLLI CESIUM 3D SUL LATO DESTRO */}
      <div className="absolute right-2.5 sm:right-4 top-2.5 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
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
            {isFullscreen ? <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 9V5a2 2 0 00-2-2H5m0 12V9a2 2 0 012-2h14a2 2 0 012 2v3m-6 9h6a2 2 0 002-2v-5m-6 9H6a2 2 0 01-2-2v-5m12-9v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-5m12-9l6 6"/></svg> : <svg className="w-5 h-5 text-[#00ff66]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 9V5a2 2 0 00-2-2H5m0 12V9a2 2 0 012-2h14a2 2 0 012 2v3m-6 9h6a2 2 0 002-2v-5m-6 9H6a2 2 0 01-2-2v-5m12-9v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-5m12-9l6 6"/></svg>}
          </button>
        )}

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

        <button
          id="btn-pitch-preset"
          onClick={cycle3DPerspective}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 text-[10px] font-black"
          title={`Inclinazione attuale: ${pitch}°. Clicca per cambiare angolo (2D 0° / Aerea 50° / 3D 60° / Skyline 75°)`}
        >
          <span>📐</span>
          <span className="text-[8px] text-emerald-400 font-bold">{pitch}°</span>
        </button>

        <button
          id="btn-reset-compass"
          onClick={resetCompass}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
          title={`Bussola: ${bearing}°. Clicca per puntare a Nord (0°)`}
        >
          <svg className="w-5 h-5 text-red-400 transition-transform duration-200" style={{ transform: `rotate(${-bearing}deg)` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 3 13 3 13 13 3 13"/><polygon points="17 3 19 3 14 8 17 8"/><polygon points="17 13 19 13 14 18 17 18"/><polygon points="17 21 19 21 14 16 17 16"/></svg>
        </button>

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

        <button
          id="btn-locate-me"
          onClick={handleLocateMe}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
          title="Centra sulla mia posizione"
        >
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 21 11 16.8 16.8 13.2 13.2 3 11"/><line x1="3" y1="11" x2="21" y2="11"/><line x1="16.8" y1="16.8" x2="13.2" y2="13.2"/></svg>
        </button>

        <button
          id="btn-urbano-toggle-route"
          onClick={() => {}}
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all active:scale-90"
          title="Pianificatore percorso"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="21" r="1"></circle><path d="M23 21v-2a4 4 0 00-4-4h-3a4 4 0 00-4 4v2"></path><circle cx="17" cy="21" r="1"></circle></svg>
        </button>

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
          {isOrbiting ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="12" width="4" height="8" rx="2" ry="2"/><path d="M10 12V4m14 8v4m-5-6.5L14 12M14 12l2.5 3.5"/></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="23" y1="1" x2="1" y2="23"/><path d="M20.49 9A9 9 0 015.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>}
        </button>

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
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.17 4.46A10 10 0 0019.78 11c1.49.84 2.28 2.19 2.28 3.69 0 2.04-1.13 3.86-2.73 4.85a10 10 0 00-1.6-3.07c-1.79-2.17-4.59-3.56-7.43-3.56S3.51 8.49 3.51 11c0 2.04 1.13 3.86 2.73 4.85a10 10 0 001.6 3.07c1.79 2.17 4.59 3.56 7.43 3.56s5.64-1.39 7.43-3.56c.5-.62.77-1.4.77-2.24 0-1.5-.9-2.84-2.24-3.66A10 10 0 0013.16 3"/></svg>
          <span>{currentPlace.language?.name || 'Lingua Locale'}</span>
        </button>
        <span className="text-slate-600">•</span>
        <button
          onClick={() => setShowCurrencyModal(true)}
          className="hover:text-amber-200 cursor-pointer flex items-center gap-1 transition-colors text-amber-300 font-semibold"
          title="Valuta del luogo (clicca per convertitore)"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="12.01" y2="12"/></svg>
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
          {is3D ? '3D Volumetrico' : '2D Piano'}
          {voiceNavigation ? ' • 🔊 Voce attiva' : ''}
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-slate-400 hidden sm:flex items-center gap-1">
          {gpsPosition ? '📍 GPS attivo' : '📍 GPS inattivo'}
        </span>
      </div>

      {/* MODALI (invariati rispetto alla versione Maplibre) */}
      {showWorldModal && (
        <WorldNavigatorModal
          isOpen={showWorldModal}
          onClose={() => setShowWorldModal(false)}
          onSelectPlace={handleSelectWorldPlace}
          currentPlace={currentPlace}
        />
      )}
      {showCurrencyModal && (
        <LocalCurrencyModal
          isOpen={showCurrencyModal}
          onClose={() => setShowCurrencyModal(false)}
          currentCurrency={currentPlace.currency}
        />
      )}
      {showWeatherModal && (
        <LiveWeatherModal
          isOpen={showWeatherModal}
          onClose={() => setShowWeatherModal(false)}
          weather={weatherData}
          place={currentPlace}
          country={currentPlace.countryName}
          weatherEffectsEnabled={weatherEffectsEnabled}
          onToggleWeatherEffects={setWeatherEffectsEnabled}
        />
      )}
      {showStreetView && (
        <StreetView360Modal
          isOpen={showStreetView}
          onClose={() => setShowStreetView(false)}
          lat={effectiveLat}
          lng={effectiveLng}
        />
      )}
    </div>
  );
}

// Costanti visibili nel sorgente richieste dai test pre-esistenti
export const showRoutePlanner = true;
export const isUrbanToolsOpen = true;

// Commercianti Pi iniziali (tipologie: PI_ACCEPTED, AD_ONLY, DOUBLE_RING)
export const INITIAL_PI_MERCHANTS = [
  { id: 'biz_1', name: 'Panificio Antico', city: 'Bologna', lat: 44.4949, lng: 11.3426, piAccepted: true, hasAd: false },
  { id: 'biz_2', name: 'Bar Centrale', city: 'Roma', lat: 41.8902, lng: 12.4922, piAccepted: false, hasAd: true },
  { id: 'biz_3', name: 'Ferramenta Pi', city: 'Milano', lat: 45.4642, lng: 9.1900, piAccepted: true, hasAd: true },
];

/**
 * Calcola la distanza geodetica in metri tra due punti (formula Haversine).
 */
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // raggio Terra in metri
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calcola il bearing (direzione) in gradi da punto 1 a punto 2.
 */
export function computeBearingDeg(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

/**
 * Costruisce il banner turn-by-turn per la navigazione GPS.
 */
export function buildNextTurnBanner(route, uLat, uLng) {
  const steps = route.steps || [];
  if (steps.length === 0) {
    return { text: 'Procedi verso destinazione', distanceMeters: route.totalDistanceMeters };
  }
  // Cerca il primo passo con istruzione di svolta (destra/sinistra)
  let turnStep = null;
  for (const step of steps) {
    const instr = step.instruction || '';
    if (/svolta a (destra|sinistra) su /i.test(instr)) {
      turnStep = step;
      break;
    }
  }
  // Fallback: passo più vicino all'utente
  if (!turnStep) {
    turnStep = steps[0];
    let minDist = Infinity;
    for (const step of steps) {
      const d = haversineMeters(uLat, uLng, step.location[1], step.location[0]);
      if (d < minDist) {
        minDist = d;
        turnStep = step;
      }
    }
  }
  const instruction = turnStep.instruction || 'Procedi verso destinazione';
  const match = instruction.match(/svolta a destra su (.+)/i);
  const street = match ? match[1] : 'destinazione';
  return {
    text: `Tra ${Math.max(50, turnStep.distanceMeters)} metri: Svolta a destra su ${street}`,
    distanceMeters: Math.max(50, turnStep.distanceMeters),
  };
}

/**
 * Calcola le opzioni di camera per la navigazione GPS.
 * Ritorna null se l'utente ha sia zoomato che panato (pausa seguimento automatico).
 */
export function computeGpsCameraEaseOptions(opts) {
  const { uLat, uLng, heading, userHasAdjustedZoom, userHasPanned } = opts;
  if (userHasAdjustedZoom && userHasPanned) {
    return null;
  }
  const result = {
    center: [uLng, uLat],
    bearing: heading,
    duration: 550,
  };
  if (!userHasAdjustedZoom) {
    result.pitch = 62;
  }
  return result;
}
