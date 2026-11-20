import React, { useState, useEffect, useMemo } from 'react';
import Globo3D from './Globo3D';
import Urbano3D from './Urbano3D';
import VoiceNoteChat from './VoiceNoteChat';
import PiNetworkHub from './PiNetworkHub';
import { PioneerRewardsHubModal } from './PioneerRewardsHubModal';
import BusinessSponsorModal from './BusinessSponsorModal';
import WorldEmergencyModal from './WorldEmergencyModal';
import GlobalCarpoolModal from './GlobalCarpoolModal';
import CraftMemoryModal from './CraftMemoryModal';
import ExternalPlaceDetailModal from './ExternalPlaceDetailModal';
import VetrinaKmZero from './VetrinaKmZero';
import { GlobalMarketplaceView } from './GlobalMarketplaceView';
import BachecaLavoroP2P from './BachecaLavoroP2P';
import LiveWeatherModal from './LiveWeatherModal';
import StreetView360Modal from './StreetView360Modal';
import SpacecraftInspectorModal from './SpacecraftInspectorModal';
import { ExternalListings } from './ExternalListings';
import { COUNTRIES } from '@/data/countries';
import { SPONSORED_BUSINESSES, ITALIAN_REGIONS } from '@/data/regions';
import {
  WORLD_COUNTRIES,
  WORLD_ATLAS_LOOKUP,
  findCountryByNameOrCode,
  handleCountrySelection as selectAtlasCountryTarget,
  formatLocalPrice,
  isValidCoord,
} from '@/lib/worldAtlas';
import { getCachedPiRealPrice, PI_REAL_PRICE_EUR } from '@/lib/piRealPriceService';
import { getDisplayCoordinates, filterVisibleListings, applyGeoPrivacy, setDefaultTerritoryCoordinates } from '@/lib/geoPrivacy';
import { publishShopToCloud, subscribeToCloudShops } from '@/lib/firestoreService';
import MerchantDetailModal from './MerchantDetailModal';
import StrettaDiMano from './StrettaDiMano';
import { toast } from 'sonner';
import {
  Globe2,
  Building2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Zap,
  MapPin,
  MessageCircle,
  Handshake,
  CheckCircle2,
  ShieldCheck,
  EyeOff,
  Eye,
  Compass,
  Mic,
  Store,
  Megaphone,
  Car,
  BookOpen,
  GraduationCap,
  Maximize2,
  Minimize2,
} from 'lucide-react';

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

// Helper di risoluzione geografica ad altissima precisione (Atlante Mondiale + Regioni)
export function resolveCountryData(countryInput) {
  if (!countryInput) return null;

  const countryData =
    typeof countryInput === 'string'
      ? { id: countryInput, name: countryInput }
      : countryInput;

  const rawId = (countryData.id || countryData.code || '').toString().toLowerCase().trim();
  const rawName = (countryData.name || '').toString().toLowerCase().trim();
  const rawCountry = (countryData.countryName || countryData.country || '').toString().toLowerCase().trim();
  const rawCapital = (countryData.capital || '').toString().toLowerCase().trim();

  // 1. Verifica prima se è una delle 20 Regioni Italiane specifiche (evitando che countryName="Italia" dirotti su Roma)
  const regMatch = ITALIAN_REGIONS.find((r) => {
    const rId = (r.id || '').toLowerCase();
    const rName = (r.name || '').toLowerCase();
    const rCap = (r.capital || '').toLowerCase();
    return rId === rawId || rName === rawName || (rawCapital && rCap === rawCapital);
  });

  if (regMatch && rawName !== 'italia') {
    return {
      id: regMatch.id || 'it-reg',
      code: 'IT',
      name: regMatch.name,
      countryName: 'Italia',
      capital: regMatch.capital || 'Roma',
      flag: '🇮🇹',
      lat: regMatch.lat,
      lng: regMatch.lng,
      lang: 'Italiano',
      currency: 'EUR (€)',
      language: { code: 'it-IT', name: 'Italiano' },
      currencyData: {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        piRate: getCachedPiRealPrice()?.priceEur || PI_REAL_PRICE_EUR,
      },
      timezone: 'Europe/Rome',
      regions: regMatch.regions || [],
      provinces: regMatch.provinces || [],
    };
  }

  // 2. Cerca in WORLD_COUNTRIES (include tutti i 54 Stati africani, Norvegia, USA, alias inglesi, ecc.)
  const worldMatch =
    findCountryByNameOrCode(rawId) ||
    findCountryByNameOrCode(rawName) ||
    WORLD_COUNTRIES.find((c) => {
      const cCode = c.code.toLowerCase();
      const cCode3 = (c.code3 || '').toLowerCase();
      const cName = c.name.toLowerCase();
      const cNative = (c.nativeName || '').toLowerCase();
      const cCapital = (c.capital || '').toLowerCase();

      return (
        cCode === rawId ||
        cCode3 === rawId ||
        cName === rawName ||
        cNative === rawName ||
        (rawCapital && cCapital === rawCapital) ||
        (rawName.length >= 3 && cName.includes(rawName)) ||
        (rawName.length >= 3 && rawName.includes(cName))
      );
    }) ||
    findCountryByNameOrCode(rawCountry);

  if (worldMatch && !(worldMatch.lat === 0 && worldMatch.lng === 0)) {
    return {
      ...worldMatch,
      id: worldMatch.code.toLowerCase(),
      code: worldMatch.code,
      name: worldMatch.name,
      countryName: worldMatch.name,
      capital: worldMatch.capital,
      flag: worldMatch.flag,
      lat: worldMatch.lat,
      lng: worldMatch.lng,
      lang: worldMatch.language?.name || 'Lingua Locale',
      currency: `${worldMatch.currency?.code || 'EUR'} (${worldMatch.currency?.symbol || '€'})`,
      language: worldMatch.language,
      currencyData: worldMatch.currency,
      timezone: worldMatch.timezone,
      regions: worldMatch.regions || [],
      provinces: worldMatch.provinces || [],
    };
  }

  // 3. Cerca in COUNTRIES (database storico)
  const countryMatch = COUNTRIES.find((c) => {
    const cId = (c.id || '').toLowerCase();
    const cName = (c.name || '').toLowerCase();
    return cId === rawId || cName === rawName;
  });

  if (countryMatch) {
    return {
      id: countryMatch.id,
      code: countryMatch.id.toUpperCase(),
      name: countryMatch.name,
      countryName: countryMatch.name,
      capital: countryMatch.capital,
      flag: countryMatch.flag,
      lat: countryMatch.lat,
      lng: countryMatch.lng,
      lang: countryMatch.lang || 'Lingua Locale',
      currency: countryMatch.currency || 'EUR (€)',
      language: { name: countryMatch.lang || 'Italiano' },
      currencyData: { code: countryMatch.currency || 'EUR', symbol: '€' },
      timezone: 'UTC',
      regions: countryMatch.regions || [],
      provinces: countryMatch.provinces || [],
    };
  }

  // 4. Continenti Diretti (es. Africa)
  if (rawId === 'africa' || rawName === 'africa') {
    return {
      id: 'africa',
      code: 'AF',
      name: 'Africa',
      countryName: 'Africa',
      capital: 'Continente Africano',
      flag: '🌍',
      lat: countryData.lat ?? 2.0,
      lng: countryData.lng ?? 21.0,
      lang: 'Lingue Africane',
      currency: 'Valute Locali (Pi Network)',
      language: { code: 'af', name: 'Lingue Africane', greeting: 'Benvenuto in Africa!' },
      currencyData: { code: 'AFR', symbol: 'π', name: 'Pi Coin & Valute Africane' },
      timezone: 'Africa/Cairo',
      regions: [
        { name: 'Egitto', capital: 'Il Cairo', lat: 30.0444, lng: 31.2357 },
        { name: 'Nigeria', capital: 'Abuja', lat: 9.0765, lng: 7.3986 },
        { name: 'Kenya', capital: 'Nairobi', lat: -1.2921, lng: 36.8219 },
        { name: 'Sudafrica', capital: 'Città del Capo', lat: -33.9249, lng: 18.4241 },
        { name: 'Marocco', capital: 'Rabat', lat: 34.0209, lng: -6.8416 },
      ],
      provinces: [],
    };
  }

  // 5. Nessun fallback silenzioso su Roma per territori sconosciuti o con coordinate (0,0)
  const hasExplicitValidCoords =
    typeof countryData.lat === 'number' &&
    !Number.isNaN(countryData.lat) &&
    typeof countryData.lng === 'number' &&
    !Number.isNaN(countryData.lng) &&
    !(countryData.lat === 0 && countryData.lng === 0);

  if (!hasExplicitValidCoords) {
    try {
      const atlasHit = selectAtlasCountryTarget(
        countryData.name || countryData.countryName || rawId,
        WORLD_ATLAS_LOOKUP
      );
      if (atlasHit?.success && atlasHit.target) {
        return {
          id: rawId || atlasHit.target.name.toLowerCase(),
          code: (countryData.code || rawId || 'XX').toUpperCase(),
          name: atlasHit.target.name,
          countryName: atlasHit.target.name,
          capital: countryData.capital || '',
          flag: countryData.flag || '🌍',
          lat: atlasHit.target.lat,
          lng: atlasHit.target.lng,
          zoom: atlasHit.target.zoom,
          lang: countryData.lang || 'Lingua Locale',
          currency: countryData.currency || 'Valuta Locale',
          language: countryData.language || { name: countryData.lang || 'Lingua Locale' },
          currencyData: countryData.currencyData || { code: 'VAL', symbol: 'π' },
          timezone: countryData.timezone || 'UTC',
          regions: countryData.regions || [],
          provinces: countryData.provinces || [],
        };
      }
    } catch (err) {
      console.error('[ERRORE ATLANTE] Risoluzione bloccata senza fallback su Roma:', err?.message || err);
      return null;
    }
    return null;
  }

  return {
    id: countryData.id || rawId || 'unknown',
    code: countryData.code || rawId.toUpperCase() || 'XX',
    name: countryData.name || rawId || 'Territorio',
    countryName: countryData.countryName || countryData.name || rawId || 'Territorio',
    capital: countryData.capital || '',
    flag: countryData.flag || '🌍',
    lat: countryData.lat,
    lng: countryData.lng,
    lang: countryData.lang || 'Lingua Locale',
    currency: countryData.currency || 'Valuta Locale',
    language: countryData.language || { name: countryData.lang || 'Lingua Locale' },
    currencyData: countryData.currencyData || { code: 'VAL', symbol: 'π' },
    timezone: countryData.timezone || 'UTC',
    regions: countryData.regions || [],
    provinces: countryData.provinces || [],
  };
}

export default function MapView3DContainer({
  listings = [],
  currentProfile,
  onSelectListing,
  onOpenAdHub,
  filter = null, // null = nessun filtro cliccato ('La mappa è pulita')
  searchQuery = '', // Ricerca per esigenza libera
  viewMode = 'GLOBO',
  onViewModeChange,
  onResetFilter,
  resetWorldTrigger = 0,
  focusItalyTrigger = 0,
  selectedCountryId = null,
  countrySelectTrigger = 0,
  onSelectCountry,
  openPiHubTrigger = 0,
  openAdModalTrigger = 0,
  openVoiceChatTrigger = 0,
  onResetToWorld,
  isDiscreetMode = false,
  onToggleDiscreetMode,
  proximityPreference = 'EVERYWHERE',
  onProximityPreferenceChange,
  onTriggerHandshake,
  onOpenCreateListing,
  onOpenGuides,
  onOpenTutor,
  activeSatelliteChannel = null,
  onActiveSatelliteChannelChange = null,
}) {
  const [internalLodLevel, setInternalLodLevel] = useState('GLOBO');
  const lodLevel = viewMode || internalLodLevel;
  const setLodLevel = (lvl) => {
    setInternalLodLevel(lvl);
    if (onViewModeChange) onViewModeChange(lvl);
  };

  // Sottomodalità per il Globo: '3D' (Fotografico) o 'GEO' (Geopolitico)
  const [globeSubMode, setGlobeSubMode] = useState('3D');

  const handleSelectGlobe3D = () => {
    setLodLevel('GLOBO');
    setGlobeSubMode('3D');
  };

  const handleSelectGlobeGeo = () => {
    setLodLevel('GLOBO');
    setGlobeSubMode('GEO');
    toast.info("🗺️ Modalità Geopolitica attiva: confini e territori");
  };

  const [internalResetTrigger, setInternalResetTrigger] = useState(0);
  const [zoomMode, setZoomMode] = useState('MACRO');

  // Modulo Geografico: Paese selezionato per il popup informativo (null di default per non applicare fallback silenziosi)
  const [selectedCountry, setSelectedCountry] = useState(() => resolveCountryData(selectedCountryId));
  const [targetCoords, setTargetCoords] = useState(() => getInitialTargetCoords(resolveCountryData(selectedCountryId)));
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [handshakeListing, setHandshakeListing] = useState(null);

  const [identifiedZone, setIdentifiedZone] = useState(null);
  const [isZoomingToZone, setIsZoomingToZone] = useState(false);

  // Inserzionisti & Sponsor Mappa 3D, Hub Pi Network e Note Vocali
  const [sponsoredBusinesses, setSponsoredBusinesses] = useState(SPONSORED_BUSINESSES);
  const [selectedMerchantModal, setSelectedMerchantModal] = useState(null);
  const [isPiHubOpen, setIsPiHubOpen] = useState(false);
  const [isRewardsHubOpen, setIsRewardsHubOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  // Modali Servizi Diretti & Utilità Globali (Zero spese, zero database interno)
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isCarpoolModalOpen, setIsCarpoolModalOpen] = useState(false);
  const [communityModalMode, setCommunityModalMode] = useState('EMERGENCY');
  const [isCraftMemoryOpen, setIsCraftMemoryOpen] = useState(false);
  const [selectedExternalPlace, setSelectedExternalPlace] = useState(null);
  const [activeSatellite, setActiveSatellite] = useState(null);
  const [scientificSatellite, setScientificSatellite] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('INSPECTOR');
  const [externalSearchQuery, setExternalSearchQuery] = useState('offerte');
  const [externalCountryCode, setExternalCountryCode] = useState(
    () => resolveCountryData(selectedCountryId)?.code || 'GLOBAL'
  );

  useEffect(() => {
    const unsubscribe = subscribeToCloudShops((cloudShops) => {
      if (cloudShops && cloudShops.length > 0) {
        setSponsoredBusinesses(() => {
          const merged = new Map();
          SPONSORED_BUSINESSES.forEach((b) => merged.set(b.id, b));
          cloudShops.forEach((b) => merged.set(b.id, b));
          return Array.from(merged.values());
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCountrySelection = (selectedIdOrObj) => {
    const countryData = resolveCountryData(selectedIdOrObj);
    if (
      !countryData ||
      typeof countryData.lat !== 'number' ||
      typeof countryData.lng !== 'number' ||
      (countryData.lat === 0 && countryData.lng === 0)
    ) {
      const label =
        typeof selectedIdOrObj === 'string'
          ? selectedIdOrObj
          : selectedIdOrObj?.name || selectedIdOrObj?.id || 'sconosciuto';
      console.error(`[ERRORE ATLANTE] Selezione bloccata per "${label}": coordinate assenti o (0,0).`);
      toast.error(`Coordinate non trovate per il territorio: ${label}`);
      return null;
    }

    let resolvedCoords = { lat: countryData.lat, lng: countryData.lng };
    try {
      const atlasMatch = selectAtlasCountryTarget(
        countryData.name || countryData.countryName || countryData.code,
        WORLD_ATLAS_LOOKUP
      );
      if (atlasMatch?.success && atlasMatch.target) {
        resolvedCoords = { lat: atlasMatch.target.lat, lng: atlasMatch.target.lng };
      }
    } catch {
      // Mantiene le coordinate reali della regione / città italiana o custom già validate (non-0,0)
    }

    setTargetCoords(resolvedCoords);
    setSelectedCountry(countryData);
    setDefaultTerritoryCoordinates(resolvedCoords.lat, resolvedCoords.lng, countryData.name);
    setIsZoomingToZone(false);
    setIdentifiedZone(null);
    if (countryData.code && countryData.code !== 'ALL' && countryData.code !== 'GLOBO') {
      setExternalCountryCode(countryData.code.toUpperCase());
    }
    return countryData;
  };

  useEffect(() => {
    if (selectedCountryId) {
      handleCountrySelection(selectedCountryId);
    } else if (selectedCountryId === null && resetWorldTrigger > 0) {
      setSelectedCountry(null);
      setTargetCoords(null);
      setIdentifiedZone(null);
      setIsZoomingToZone(false);
    }
  }, [selectedCountryId, countrySelectTrigger]);

  useEffect(() => {
    if (openPiHubTrigger > 0) setIsPiHubOpen(true);
  }, [openPiHubTrigger]);

  useEffect(() => {
    if (openAdModalTrigger > 0) setIsAdModalOpen(true);
  }, [openAdModalTrigger]);

  useEffect(() => {
    if (openVoiceChatTrigger > 0) setIsVoiceChatOpen(true);
  }, [openVoiceChatTrigger]);

  useEffect(() => {
    if (activeSatelliteChannel) {
      setActiveSatellite(activeSatelliteChannel);
      if (activeSatelliteChannel === 'CHAT') {
        setIsVoiceChatOpen(true);
      } else if (activeSatelliteChannel === 'COMUNITA') {
        if (communityModalMode === 'CARPOOL') {
          setIsEmergencyModalOpen(false);
          setIsCarpoolModalOpen(true);
        } else {
          setCommunityModalMode('EMERGENCY');
          setIsEmergencyModalOpen(true);
          setIsCarpoolModalOpen(false);
        }
      }
    }
  }, [activeSatelliteChannel]);

  const handleCloseSatelliteModal = () => {
    setActiveSatellite(null);
    setIsEmergencyModalOpen(false);
    setIsCarpoolModalOpen(false);
    if (onActiveSatelliteChannelChange) {
      onActiveSatelliteChannelChange(null);
    }
  };

  const [voiceChatRecipient, setVoiceChatRecipient] = useState({
    name: 'Inserzionista / Negozio Pi',
    role: 'Pi Merchant Gold',
    intro: 'Ciao! Benvenuto sulla mappa 3D Have2Want. Lascia una nota vocale per chiedere informazioni su prodotti, sconti Pi Coin o concordare uno scambio!',
  });

  const handleOpenVoiceChatForStore = (store) => {
    setVoiceChatRecipient({
      name: store?.name || 'Inserzionista Pi',
      role: store?.badge || 'Negozio Verificato',
      intro: store?.voiceIntro || `Ciao! Benvenuti da ${store?.name || 'la nostra attività'}. Come possiamo aiutarti? Lasciaci una nota vocale!`,
    });
    setIsVoiceChatOpen(true);
  };

  const handleAddSponsoredBusiness = (newBiz) => {
    setSponsoredBusinesses((prev) => [newBiz, ...prev]);
    publishShopToCloud(newBiz).catch(() => {});
  };

  // Stato compattamento barra comandi inferiore (per lasciare il globo visibile al 100%)
  const [isBottomBarCollapsed, setIsBottomBarCollapsed] = useState(true);

  // Stato allargamento cartina a tutto schermo (Fullscreen immersive mode)
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);

  const handleToggleFullscreen = () => {
    setIsFullscreenMap((prev) => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 80);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 250);
      if (next) {
        toast.success("⛶ Cartina allargata a tutto schermo!", {
          description: "La mappa occupa il 100% dello schermo. Clicca 'Riduci' per tornare alla vista normale.",
          duration: 3000,
        });
      } else {
        toast.info("↙ Vista cartina ridotta alla schermata standard");
      }
      return next;
    });
  };

  // Handler globale per il pulsante Mondo
  const handleResetToWorld = () => {
    if (lodLevel !== 'GLOBO') {
      setLodLevel('GLOBO');
    }
    setSelectedCountry(null);
    setIdentifiedZone(null);
    setIsZoomingToZone(false);
    setInternalResetTrigger(prev => prev + 1);
    if (onResetToWorld) onResetToWorld();
  };

  // 2. VISIBILITY MANAGER & FILTRI:
  // Combina filtro categoria/richiesta specifica, query di ricerca, moderazione, vicinanza e geoPrivacy
  const filteredListings = useMemo(() => {
    let result = filterVisibleListings({
      listings,
      activeFilter: filter,
      searchQuery,
      userLocation: targetCoords,
      proximityPreference,
      isDiscreetMode
    });

    // Filtro orbitale selettivo degli 8 satelliti (I marker non pertinenti vengono nascosti):
    if (activeSatellite === 'KMZERO') {
      result = result.filter((item) => {
        const cat = ((item.category || item.subcategory || '') + ' ' + (item.title || '')).toLowerCase();
        return cat.includes('km0') || cat.includes('agricol') || cat.includes('cibo') || cat.includes('fresco') || cat.includes('terra') || item.isKm0;
      });
    } else if (activeSatellite === 'WEATHER' || activeSatellite === 'METEO') {
      result = result.filter((item) => {
        const txt = ((item.category || '') + ' ' + (item.title || '') + ' ' + (item.have_description || '')).toLowerCase();
        return txt.includes('mare') || txt.includes('meteo') || txt.includes('barc') || txt.includes('agricol') || txt.includes('km0') || txt.includes('sport') || txt.includes('trasfert') || txt.includes('bici');
      });
    } else if (activeSatellite === 'STRADARIO') {
      result = result.filter((item) => {
        const txt = ((item.category || '') + ' ' + (item.subcategory || '') + ' ' + (item.title || '')).toLowerCase();
        return txt.includes('mobilit') || txt.includes('bici') || txt.includes('auto') || txt.includes('strad') || txt.includes('trasfert') || txt.includes('carpool') || txt.includes('serviz');
      });
    } else if (activeSatellite === 'SUPERMARKET' || activeSatellite === 'MONDO') {
      result = result.filter((item) => {
        const intent = (item.intent || '').toUpperCase();
        const cat = ((item.category || '') + ' ' + (item.title || '')).toLowerCase();
        return intent === 'VENDO' || item.action_type === 'vendo' || cat.includes('tecnolog') || cat.includes('casa') || cat.includes('moda') || cat.includes('bricolage') || Boolean(item.piPrice);
      });
    } else if (activeSatellite === 'EXTERNAL') {
      result = result.filter((item) => {
        const txt = ((item.source || '') + ' ' + (item.category || '') + ' ' + (item.title || '')).toLowerCase();
        return Boolean(item.isExternal) || txt.includes('external') || txt.includes('ebay') || txt.includes('amazon') || txt.includes('tecnolog') || txt.includes('elettronic');
      });
    } else if (activeSatellite === 'COMUNITA') {
      result = result.filter((item) => {
        const txt = ((item.category || '') + ' ' + (item.subcategory || '') + ' ' + (item.title || '')).toLowerCase();
        return txt.includes('carpool') || txt.includes('trasfert') || txt.includes('passagg') || txt.includes('emergenz') || txt.includes('soccors') || txt.includes('aiuto') || txt.includes('comunit');
      });
    } else if (activeSatellite === 'BARATTO') {
      result = result.filter((item) => {
        const intent = (item.intent || '').toUpperCase();
        return intent === 'BARATTO' || intent === 'BARATTO_SCAMBIO' || intent === 'SCAMBIO' || intent === 'WANT' || item.isBaratto;
      });
    } else if (activeSatellite === 'LAVORO' || activeSatellite === 'P2P') {
      result = result.filter((item) => {
        const cat = ((item.category || item.subcategory || '') + ' ' + (item.title || '')).toLowerCase();
        return cat.includes('lavor') || cat.includes('serviz') || cat.includes('artigian') || cat.includes('riparaz') || cat.includes('competenze');
      });
    } else if (activeSatellite === 'RADAR') {
      // Scansione radar di prossimità territoriale (raggio 35 km)
      if (targetCoords && typeof targetCoords.lat === 'number' && typeof targetCoords.lng === 'number') {
        result = result.filter((item) => {
          if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return false;
          const dLat = (item.lat - targetCoords.lat) * 111;
          const dLng = (item.lng - targetCoords.lng) * 111 * Math.cos(targetCoords.lat * (Math.PI / 180));
          return Math.hypot(dLat, dLng) <= 35;
        });
      }
    } else if (activeSatellite === 'CHAT') {
      // Canale Chat Esclusivo: i marker standard lasciano spazio agli utenti Pioneer attivi 👨 / 👩
      result = [];
    } else if (activeSatellite === 'BUSINESS_ADS') {
      // Canale Commercianti Esclusivo: i marker standard lasciano spazio agli esercizi e convenzioni Pi
      result = [];
    }

    return result;
  }, [listings, filter, searchQuery, targetCoords, proximityPreference, isDiscreetMode, activeSatellite]);

  // 1. Individuazione della zona (dal tap sul marker 3D o dalla barra rapida)
  const handleZoneIdentified = (countryData) => {
    if (!countryData) return;
    const matched = resolveCountryData(countryData);
    if (!matched) return;
    setIdentifiedZone(matched);
    setIsZoomingToZone(true);
    setSelectedCountry(matched);
    setTargetCoords(getInitialTargetCoords(matched));
    if (onSelectCountry) onSelectCountry(matched);
  };

  // 2. Solo dopo l'arrivo dello zoom completiamo l'allineamento (SENZA aprire schede o toast invasivi)
  const handleZoneZoomArrived = (countryData) => {
    if (!countryData) return;
    const matched = handleCountrySelection(countryData);
    if (matched && onSelectCountry) onSelectCountry(matched);
  };

  const handleExploreUrban3D = (country) => {
    const matched = resolveCountryData(country) || selectedCountry || identifiedZone;
    const nextCoords = getInitialTargetCoords(matched) || targetCoords;
    if (!nextCoords || (nextCoords.lat === 0 && nextCoords.lng === 0)) {
      toast.info('🌍 Seleziona prima un Paese o tocca un punto sul globo per aprire gli edifici 3D');
      return;
    }
    if (matched) {
      setTargetCoords(nextCoords);
      setSelectedCountry(matched);
      setDefaultTerritoryCoordinates(nextCoords.lat, nextCoords.lng, matched.name);
      if (onSelectCountry) onSelectCountry(matched);
    }
    setIsZoomingToZone(false);
    setIdentifiedZone(null);
    setLodLevel('URBANO_3D');
  };

  const handleBuildingSelect = (item) => {
    setSelectedListing(item);
    setIsBottomSheetOpen(true);
    if (onSelectListing) {
      onSelectListing(item);
    }
  };

  return (
    <div
      className={
        isFullscreenMap
          ? 'fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden select-none flex flex-col text-white'
          : 'relative w-full h-full flex-1 min-h-0 bg-black overflow-hidden select-none flex flex-col text-white'
      }
    >
      {/* PULSANTE FLUTTUANTE RIDUCI QUANDO LA CARTINA È ALLARGATA A TUTTO SCHERMO (solo vista Globo) */}
      {isFullscreenMap && lodLevel === 'GLOBO' && (
        <div className="absolute top-3.5 left-3.5 z-30 pointer-events-auto flex items-center gap-2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700 shadow-2xl">
          <button
            id="btn-exit-fullscreen"
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 text-xs font-black text-white hover:text-[#00ff66] cursor-pointer"
            title="Riduci cartina alla vista standard"
          >
            <Minimize2 className="w-4 h-4 text-[#00ff66]" />
            <span>Riduci cartina</span>
          </button>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px] font-mono text-zinc-300">
            {globeSubMode === 'GEO' ? '🗺️ Cartina Geo' : '🌍 Globo 3D'}
          </span>
        </div>
      )}

      {/* 3D Scene Container: situato nell'area visibile sopra il footer (flex-1 min-h-0), così il globo è intero e mai coperto dai comandi */}
      <div className="w-full flex-1 relative z-0 overflow-hidden min-h-0">
        {/* Nessun banner invasivo sopra il globo */}

        {/* BARRA SUPERIORE IN URBANO 3D CON TASTO RITORNO, RIDUCI (SE FULLSCREEN) E SCROLL REGIONI */}
        {lodLevel === 'URBANO_3D' && (
          <div className="absolute top-2.5 left-2.5 right-14 z-20 pointer-events-auto flex items-center gap-1.5 overflow-hidden bg-black/85 backdrop-blur-md p-1 rounded-2xl border border-zinc-800 shadow-2xl">
            {isFullscreenMap && (
              <button
                id="btn-exit-fullscreen"
                onClick={handleToggleFullscreen}
                className="px-2.5 py-1.5 rounded-xl bg-[#00ff66] text-black text-xs font-black flex items-center gap-1 shadow-lg shrink-0 cursor-pointer"
                title="Riduci cartina alla vista standard"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Riduci</span>
              </button>
            )}
            <button
              onClick={() => setLodLevel('GLOBO')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#00ff66] text-white text-xs font-black flex items-center gap-1 shadow-lg shrink-0 cursor-pointer transition-all active:scale-95"
              title="Torna al Globo 3D"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Globo</span>
            </button>

            <div className="h-5 w-[1px] bg-zinc-800 shrink-0" />

            {/* SELETTORE A SCORRIMENTO DELLE REGIONI / TERRITORI */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-black uppercase text-zinc-400 shrink-0 px-1">
                {selectedCountry && selectedCountry.name !== 'Italia' ? `Territorio: ${selectedCountry.name}` : 'Scegli Regione:'}
              </span>
              {(selectedCountry && selectedCountry.name !== 'Italia') ? (
                (selectedCountry.regions || [
                  { name: selectedCountry.capital || selectedCountry.name, lat: selectedCountry.lat, lng: selectedCountry.lng }
                ]).map((reg, idx) => (
                  <button
                    key={reg.name || idx}
                    onClick={() => {
                      setTargetCoords({ lat: reg.lat, lng: reg.lng });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-[#00ff66] hover:text-black border border-zinc-700 hover:border-[#00ff66] text-xs font-bold text-zinc-200 shrink-0 transition-all cursor-pointer"
                  >
                    {reg.name}
                  </button>
                ))
              ) : (
                ITALIAN_REGIONS.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => {
                      setTargetCoords({ lat: reg.lat, lng: reg.lng });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-[#00ff66] hover:text-black border border-zinc-700 hover:border-[#00ff66] text-xs font-bold text-zinc-200 shrink-0 transition-all cursor-pointer"
                  >
                    {reg.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {lodLevel === 'GLOBO' ? (
          <Globo3D
            listings={filteredListings}
            allListings={listings}
            onSelectListing={handleBuildingSelect}
            sponsoredBusinesses={sponsoredBusinesses}
            onSelectSponsor={(biz) => {
              setSelectedMerchantModal(biz);
              toast.success(`🏪 Scheda Commerciante: ${biz.name}`);
            }}
            activeChannel={activeSatellite}
            onSelectChatUser={(user) => {
              setVoiceChatRecipient({
                name: user.name,
                role: user.gender === 'woman' ? 'Pioneer Donna 👩' : 'Pioneer Uomo 👨',
                intro: `Ciao! Sono ${user.name}. ${user.status || 'Disponibile per scambi locali e contatto P2P!'}`
              });
              setIsVoiceChatOpen(true);
              toast.success(`💬 Chat Pioneer: ${user.name} (${user.gender === 'woman' ? 'Donna 👩' : 'Uomo 👨'})`);
            }}
            onCountrySelect={(country) => {
              const matched = handleCountrySelection(country);
              if (matched && onSelectCountry) onSelectCountry(matched);
            }}
            onZoneIdentified={handleZoneIdentified}
            onZoneZoomArrived={handleZoneZoomArrived}
            selectedCountryId={selectedCountryId || selectedCountry?.id || identifiedZone?.id}
            resetWorldTrigger={resetWorldTrigger + internalResetTrigger}
            focusItalyTrigger={focusItalyTrigger}
            onZoomModeChange={setZoomMode}
            onEnterUrban3D={handleExploreUrban3D}
            isGeoMode={globeSubMode === 'GEO'}
            isFullscreen={isFullscreenMap}
            onToggleFullscreen={handleToggleFullscreen}
            onOpenSatellite={(satIdentifier) => {
              if (satIdentifier === 'FLEET_CONTROLS') {
                setInspectorTab('CONTROLS');
                setScientificSatellite('METEO_SAT');
                return;
              }

              // COMANDO OPERATIVO DIRETTO A TOCCO SINGOLO (Zero finestre intermedie)
              // 1 tocco = attiva il filtro specifico. 2° tocco = disattiva e ripristina la visuale.
              switch (satIdentifier) {
                case 'METEO_SAT':
                case 'METEO':
                case 'WEATHER':
                  if (activeSatellite === 'WEATHER') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🌦️ METEOSAT-3G: Telemetria e Nubi Disattivate', { duration: 1800 });
                  } else {
                    setActiveSatellite('WEATHER');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('WEATHER');
                    toast.success('🌦️ METEOSAT-3G: Telemetria Meteo e Nubi Attivate');
                  }
                  break;

                case 'KM0_SAT':
                case 'KMZERO':
                  if (activeSatellite === 'KMZERO') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🌾 SENTINEL-2: Filtro Produttori Km 0 Disattivato', { duration: 1800 });
                  } else {
                    setActiveSatellite('KMZERO');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('KMZERO');
                    toast.success('🌾 SENTINEL-2: Botteghe e Produttori Km 0 Attivati');
                  }
                  break;

                case 'RADAR':
                  if (activeSatellite === 'RADAR') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('📡 Scansione Radar Disattivata', { duration: 1800 });
                  } else {
                    setActiveSatellite('RADAR');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('RADAR');
                    toast.success('📡 Scansione Radar Territoriale 25 km Attiva');
                  }
                  break;

                case 'STREET_360_SAT':
                case 'STRADARIO':
                  if (activeSatellite === 'STRADARIO') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🧭 WORLDVIEW-3: Passeggiata Stradale Chiusa', { duration: 1800 });
                  } else {
                    setActiveSatellite('STRADARIO');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('STRADARIO');
                    toast.success('🧭 WORLDVIEW-3: Passeggiata Stradale 360° Panoramax Attiva');
                  }
                  break;

                case 'PI_CHAT_SAT':
                case 'VOICE_CHAT':
                case 'CHAT':
                  if (activeSatellite === 'CHAT') {
                    setActiveSatellite(null);
                    setIsVoiceChatOpen(false);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🎙️ STARLINK-COMM: Canale Chat Pioneer Disattivato', { duration: 1800 });
                  } else {
                    setActiveSatellite('CHAT');
                    setIsVoiceChatOpen(true);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('CHAT');
                    toast.success('🎙️ STARLINK-COMM: Pannello Chat & Vocale Aperto');
                  }
                  break;

                case 'BARATTO':
                  if (activeSatellite === 'BARATTO') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🔄 Filtro Baratto Disattivato', { duration: 1800 });
                  } else {
                    setActiveSatellite('BARATTO');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('BARATTO');
                    toast.success('🔄 Pubblicazione HAVE/WANT & Baratto Puro');
                  }
                  break;

                case 'GLOBAL_MARKET_SAT':
                  if (activeSatellite === 'SUPERMARKET') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🌐 TELSTAR 19V: Commercio Globale Chiuso', { duration: 1800 });
                  } else {
                    setActiveSatellite('SUPERMARKET');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('SUPERMARKET');
                    toast.success('🌐 TELSTAR 19V: Marketplace Internazionale Attivo');
                  }
                  break;

                case 'EXTERNAL_MARKET_SAT':
                  if (activeSatellite === 'EXTERNAL') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🛒 GATEWAY-RELAIS: Mercati Esteri (eBay/Amazon) Chiusi', { duration: 1800 });
                  } else {
                    setActiveSatellite('EXTERNAL');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('EXTERNAL');
                    toast.success('🛒 GATEWAY-RELAIS: Mercati Esteri eBay/Amazon Attivi');
                  }
                  break;

                case 'LAVORO':
                case 'P2P':
                  if (activeSatellite === 'LAVORO') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('💼 Bacheca Lavoro Chiusa', { duration: 1800 });
                  } else {
                    setActiveSatellite('LAVORO');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('LAVORO');
                    toast.success('💼 Bacheca Lavoro P2P e Competenze Attiva');
                  }
                  break;

                case 'COMMUNITY_RESCUE_SAT':
                case 'COMUNITA':
                  if (activeSatellite === 'COMUNITA') {
                    setActiveSatellite(null);
                    setIsEmergencyModalOpen(false);
                    setIsCarpoolModalOpen(false);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🤝 COSPAS-SARSAT: Canale Comunità Chiuso', { duration: 1800 });
                  } else {
                    setActiveSatellite('COMUNITA');
                    if (communityModalMode === 'CARPOOL') {
                      setIsEmergencyModalOpen(false);
                      setIsCarpoolModalOpen(true);
                    } else {
                      setCommunityModalMode('EMERGENCY');
                      setIsEmergencyModalOpen(true);
                      setIsCarpoolModalOpen(false);
                    }
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('COMUNITA');
                    toast.success('🤝 COSPAS-SARSAT: Canale Comunità Attivo');
                  }
                  break;

                case 'BUSINESS_ADS_SAT':
                case 'BUSINESS_ADS':
                  if (activeSatellite === 'BUSINESS_ADS') {
                    setActiveSatellite(null);
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange(null);
                    toast.info('🏪 INTELSAT-40E: Canale Commercianti Disattivato', { duration: 1800 });
                  } else {
                    setActiveSatellite('BUSINESS_ADS');
                    if (onActiveSatelliteChannelChange) onActiveSatelliteChannelChange('BUSINESS_ADS');
                    toast.success('🏪 INTELSAT-40E: Canale Commercianti & Convenzioni Pi Attivo');
                  }
                  break;

                default:
                  setInspectorTab('INSPECTOR');
                  setScientificSatellite(satIdentifier);
                  break;
              }
            }}
          />
        ) : (
          <Urbano3D
            centroLat={targetCoords?.lat ?? selectedCountry?.lat}
            centroLng={targetCoords?.lng ?? selectedCountry?.lng}
            lat={targetCoords?.lat ?? selectedCountry?.lat}
            lng={targetCoords?.lng ?? selectedCountry?.lng}
            onBazarSelect={handleBuildingSelect}
            countryName={selectedCountry?.name || 'Territorio'}
            isFullscreen={isFullscreenMap}
            onToggleFullscreen={handleToggleFullscreen}
            activeChannel={activeSatellite}
            placeData={selectedCountry ? {
              name: selectedCountry.capital || selectedCountry.name,
              displayName: selectedCountry.capital ? `${selectedCountry.capital}, ${selectedCountry.name}` : selectedCountry.name,
              countryName: selectedCountry.name,
              countryCode: selectedCountry.code || 'GLOBO',
              flag: selectedCountry.flag,
              language: selectedCountry.language || { name: selectedCountry.lang || 'Lingua Locale' },
              currency: selectedCountry.currencyData || { code: selectedCountry.currency || 'EUR', symbol: '€' },
              lat: selectedCountry.lat,
              lng: selectedCountry.lng,
              timezone: selectedCountry.timezone,
            } : null}
            onLocationChange={(place) => {
              if (place && isValidCoord(place.lat, place.lng)) {
                setTargetCoords({ lat: place.lat, lng: place.lng });
              }
            }}
            filter={filter}
            filteredListings={filteredListings}
            onSelectListing={handleBuildingSelect}
            selectedListing={selectedListing}
            onBackToGlobe={() => setLodLevel('GLOBO')}
            sponsoredBusinesses={sponsoredBusinesses}
            onOpenVoiceChat={handleOpenVoiceChatForStore}
            onSelectExternalPlace={(place) => setSelectedExternalPlace(place)}
          />
        )}
      </div>

      {/* Badge del filtro o ricerca attiva se presente (solo vista Globo per non sovrapporsi in Urbano) */}
      {(filter || searchQuery) && lodLevel === 'GLOBO' && (
        <div className="absolute top-3 left-3 sm:left-4 z-20 pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black border border-zinc-800 text-xs font-black text-white flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping" />
            <span>
              {filter === 'TRASFERTE'
                ? '🚗 TRASFERTE & PASSAGGI'
                : filter === 'VENDO'
                ? 'VENDO'
                : filter === 'SCAMBIO' || filter === 'BARATTO'
                ? 'SCAMBIO & BARATTO'
                : filter === 'CERCO'
                ? 'CERCO'
                : filter === 'LIBRI'
                ? 'LIBRI'
                : filter === 'SERVIZI'
                ? 'SERVIZI'
                : filter
                ? `Filtro: ${filter}`
                : ''}
              {filter && searchQuery ? ' • ' : ''}
              {searchQuery ? `Cerca: "${searchQuery}"` : ''}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#00ff66] text-black text-[10px] font-black">
              {filteredListings.length}
            </span>
            {onResetFilter && (
              <button
                onClick={onResetFilter}
                className="ml-1 p-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                title="Pulisci e torna a mappa neutra"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3B. STATUS DISCRETO INDIVIDUAZIONE ZONA (TEMPORANEO, SOLO IN VISTA GLOBO) */}
      {lodLevel === 'GLOBO' && isZoomingToZone && identifiedZone && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="px-4 py-2 rounded-xl bg-black border border-zinc-800 shadow-2xl flex items-center gap-2.5 text-white">
            <span className="text-xl animate-bounce">{identifiedZone.flag}</span>
            <div className="text-left">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span className="text-[#00ff66]">{identifiedZone.name}</span>
                {identifiedZone.capital && (
                  <span className="text-[10px] text-zinc-400 font-normal">({identifiedZone.capital})</span>
                )}
              </div>
              <div className="text-[9px] text-zinc-300 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-ping" />
                <span>Allineamento telecamera...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista pulita senza overlay o testi invasivi sul globo */}

      {/* Nessuna cartella o badge a comparsa sul globo */}

      {/* Digital Handshake Modal */}
      {handshakeListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setHandshakeListing(null)}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-[#070b19] hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl cursor-pointer"
            >
              ✕
            </button>
            <StrettaDiMano
              listing={handshakeListing}
              currentProfile={currentProfile || { id: "pioneer_001", trust_rating: 4.9 }}
              onVerificationSuccess={() => {
                toast.success("Stretta di mano registrata con successo!");
                setHandshakeListing(null);
              }}
              onClose={() => setHandshakeListing(null)}
            />
          </div>
        </div>
      )}

      {/* 5. FOOTER NON INVASIVO: Barra comandi ultra-compatta e richiudibile con un click */}
      <footer
        id="main-app-footer"
        className="relative z-20 mt-auto bg-black border-t border-zinc-900 text-white flex flex-col pointer-events-auto shrink-0 transition-all duration-200"
      >
        {/* Barra di controllo visibilità / Toggle minimale */}
        <div className="flex items-center justify-between px-3 py-1 bg-black text-[11px] text-zinc-400 border-b border-zinc-950 select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            <span className="font-mono text-[10px] text-zinc-300">CONTROLLI NAVIGAZIONE 3D</span>
          </div>

          <button
            onClick={() => setIsBottomBarCollapsed((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-900 text-[10px] font-bold cursor-pointer transition-colors"
            title={isBottomBarCollapsed ? "Mostra comandi estesi" : "Riduci comandi per massima visione del globo"}
          >
            <span>{isBottomBarCollapsed ? "Espandi" : "Riduci vista"}</span>
            {isBottomBarCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Contenuto comandi: Visibile per esteso o in formato ultra-compatto a riga singola */}
        {!isBottomBarCollapsed ? (
          <div className="px-2.5 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-1.5">
            {/* Riga 1: Selettore vista MONDO / 3D / GEO / URBANO */}
            <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 gap-0.5">
              <button
                id="btn-footer-world-reset"
                onClick={handleResetToWorld}
                className="px-2.5 py-1 rounded text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-white"
                title="Reset telecamera: Torna alla vista macro del Mondo intero"
              >
                <span>🌍</span>
                <span>MONDO</span>
              </button>

              <button
                id="btn-view-globo"
                onClick={handleSelectGlobe3D}
                className={`px-2.5 py-1 rounded text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer ${
                  lodLevel === 'GLOBO' && globeSubMode === '3D'
                    ? 'bg-[#00ff66] text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
                title="Globo 3D: Superficie fotografica terrestre reale"
              >
                <Globe2 className="w-3 h-3" />
                <span>3D</span>
              </button>

              <button
                id="btn-view-globo-geo"
                onClick={handleSelectGlobeGeo}
                className={`px-2.5 py-1 rounded text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer ${
                  lodLevel === 'GLOBO' && globeSubMode === 'GEO'
                    ? 'bg-[#00ff66] text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
                title="Globo Geopolitico: Confini internazionali, stati e territori"
              >
                <span>🗺️</span>
                <span>GEO</span>
              </button>

              <button
                id="btn-view-urbano-3d"
                onClick={() => {
                  handleExploreUrban3D(selectedCountry || identifiedZone);
                  toast.info("Modalità Urbano 3D attiva: fotogrammetria volumetrica");
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer ${
                  lodLevel === 'URBANO_3D'
                    ? 'bg-[#00ff66] text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
                title="Urbano 3D: Mappa volumetrica delle città"
              >
                <Building2 className="w-3 h-3" />
                <span>URBANO</span>
              </button>

              <button
                id="btn-footer-toggle-fullscreen"
                onClick={handleToggleFullscreen}
                className={`px-2.5 py-1 rounded text-[11px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer border ${
                  isFullscreenMap
                    ? 'bg-[#00ff66] text-black border-[#00ff66]'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700 hover:border-[#00ff66]'
                }`}
                title={isFullscreenMap ? "Riduci cartina alla vista standard" : "Allarga la cartina a tutto schermo (100% display)"}
              >
                {isFullscreenMap ? <Minimize2 className="w-3 h-3 text-black" /> : <Maximize2 className="w-3 h-3 text-[#00ff66]" />}
                <span>{isFullscreenMap ? "RIDUCI" : "ALLARGA CARTINA"}</span>
              </button>
            </div>

          </div>
        ) : (
          /* Mini bar compattata: una sola linea essenziale che lascia libero il 98% dello schermo */
          <div className="px-3 py-1 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetToWorld}
                className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 text-[10px] font-black cursor-pointer"
                title="Reset telecamera al Mondo intero"
              >
                🌍 MONDO
              </button>
              <button
                onClick={handleSelectGlobe3D}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                  lodLevel === 'GLOBO' && globeSubMode === '3D'
                    ? 'bg-[#00ff66] text-black border-[#00ff66]'
                    : 'bg-zinc-950 text-zinc-300 hover:text-white border-zinc-800'
                }`}
                title="Globo 3D Fotografico"
              >
                🌐 3D
              </button>
              <button
                onClick={handleSelectGlobeGeo}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                  lodLevel === 'GLOBO' && globeSubMode === 'GEO'
                    ? 'bg-[#00ff66] text-black border-[#00ff66]'
                    : 'bg-zinc-950 text-zinc-300 hover:text-white border-zinc-800'
                }`}
                title="Globo Geopolitico"
              >
                🗺️ GEO
              </button>
              <button
                onClick={() => {
                  handleExploreUrban3D(selectedCountry || identifiedZone);
                  toast.info("Modalità Urbano 3D attiva: fotogrammetria volumetrica");
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                  lodLevel === 'URBANO_3D'
                    ? 'bg-[#00ff66] text-black border-[#00ff66]'
                    : 'bg-zinc-950 text-zinc-300 hover:text-white border-zinc-800'
                }`}
                title="Urbano 3D"
              >
                🏙️ URBANO
              </button>
              <button
                onClick={handleToggleFullscreen}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border flex items-center gap-1 ${
                  isFullscreenMap
                    ? 'bg-[#00ff66] text-black border-[#00ff66]'
                    : 'bg-zinc-900 text-white hover:text-[#00ff66] border-zinc-700'
                }`}
                title={isFullscreenMap ? "Riduci cartina" : "Allarga cartina a tutto schermo"}
              >
                {isFullscreenMap ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5 text-[#00ff66]" />}
                <span>{isFullscreenMap ? "RIDUCI" : "ALLARGA"}</span>
              </button>
              {onOpenTutor && (
                <button
                  onClick={onOpenTutor}
                  className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-900 text-white hover:text-[#00ff66] border border-zinc-800 text-[10px] font-black cursor-pointer flex items-center gap-1"
                  title="Apri Tutor"
                >
                  <GraduationCap className="w-3 h-3 text-[#00ff66]" />
                  <span>TUTOR</span>
                </button>
              )}
            </div>
            <span className="hidden md:inline-block text-[10px] text-zinc-500 font-mono">VISTA A SCHERMO MASSIMO ATTIVA</span>
          </div>
        )}
      </footer>

      {/* MODALI PI NETWORK HUB, INSERZIONISTI & CHAT VOCALE */}
      <PiNetworkHub
        isOpen={isPiHubOpen}
        onClose={() => setIsPiHubOpen(false)}
        onOpenAdModal={() => setIsAdModalOpen(true)}
        onOpenRewardsHub={() => setIsRewardsHubOpen(true)}
      />

      <PioneerRewardsHubModal
        isOpen={isRewardsHubOpen}
        onClose={() => setIsRewardsHubOpen(false)}
      />

      <BusinessSponsorModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onAddSponsoredBusiness={handleAddSponsoredBusiness}
        currentLocation={{
          lat: targetCoords?.lat ?? selectedCountry?.lat,
          lng: targetCoords?.lng ?? selectedCountry?.lng,
          city: selectedCountry?.name || '',
          region: selectedCountry?.name || '',
          countryCode: selectedCountry?.code || '',
        }}
      />

      <VoiceNoteChat
        isOpen={isVoiceChatOpen}
        onClose={() => {
          setIsVoiceChatOpen(false);
          if (activeSatellite === 'CHAT') {
            handleCloseSatelliteModal();
          }
        }}
        recipientName={voiceChatRecipient.name}
        recipientRole={voiceChatRecipient.role}
        initialVoiceIntro={voiceChatRecipient.intro}
      />

      {/* MODALI EMERGENZE, TRASFERTE E MEMORIA STORICA (Zero spese, Zero server) */}
      {activeSatellite !== 'COMUNITA' && (
        <>
          <WorldEmergencyModal
            isOpen={isEmergencyModalOpen}
            onClose={() => setIsEmergencyModalOpen(false)}
            defaultCountryCode={selectedCountry?.code || selectedCountry?.id || 'GLOBAL'}
          />

          <GlobalCarpoolModal
            isOpen={isCarpoolModalOpen}
            onClose={() => setIsCarpoolModalOpen(false)}
          />
        </>
      )}

      <CraftMemoryModal
        isOpen={isCraftMemoryOpen}
        onClose={() => setIsCraftMemoryOpen(false)}
      />

      <ExternalPlaceDetailModal
        place={selectedExternalPlace}
        isOpen={Boolean(selectedExternalPlace)}
        onClose={() => setSelectedExternalPlace(null)}
        onNavigateInApp={(place) => {
          setSelectedExternalPlace(null);
          if (isValidCoord(place?.lat, place?.lng)) {
            setTargetCoords({ lat: place.lat, lng: place.lng });
            setLodLevel('URBANO_3D');
            toast.success(`🧭 Calcolo itinerario interno OSRM per ${place.name}...`);
          } else {
            toast.error(`Coordinate non disponibili per ${place?.name || 'questo luogo'}`);
          }
        }}
      />

      {/* 🛰️ SPACECRAFT INSPECTOR & PANNELLO CONTROLLO FLOTTA (8 SATELLITI & 7 PRESET) */}
      <SpacecraftInspectorModal
        isOpen={Boolean(scientificSatellite)}
        selectedSatelliteId={scientificSatellite}
        initialTab={inspectorTab}
        onClose={() => setScientificSatellite(null)}
        onLaunchChannel={(satId) => {
          setScientificSatellite(null);
          const CHANNEL_MAP = {
            METEO_SAT: 'WEATHER',
            KM0_SAT: 'KMZERO',
            STREET_360_SAT: 'STRADARIO',
            PI_CHAT_SAT: 'CHAT',
            GLOBAL_MARKET_SAT: 'MONDO',
            EXTERNAL_MARKET_SAT: 'EXTERNAL',
            COMMUNITY_RESCUE_SAT: 'COMUNITA',
            BUSINESS_ADS_SAT: 'BUSINESS_ADS',
            KMZERO: 'KMZERO',
            WEATHER: 'WEATHER',
            MONDO: 'MONDO',
            EXTERNAL: 'EXTERNAL',
            P2P: 'P2P',
            RADAR: 'RADAR',
            COMUNITA: 'COMUNITA',
            BARATTO: 'BARATTO',
            STRADARIO: 'STRADARIO',
            CHAT: 'CHAT',
            BUSINESS_ADS: 'BUSINESS_ADS',
          };
          const targetChannel = CHANNEL_MAP[satId] || satId;
          setActiveSatellite(targetChannel);
        }}
        onSelectSatellite={(satId) => setScientificSatellite(satId)}
      />

      {/* 🏪 MODALE COMMERCIANTI & PUBBLICITÀ (Collegato a BUSINESS_ADS_SAT e Pin 3D) */}
      {(activeSatellite === 'BUSINESS_ADS' || Boolean(selectedMerchantModal)) && (
        <MerchantDetailModal
          isOpen={true}
          onClose={() => {
            setSelectedMerchantModal(null);
            if (activeSatellite === 'BUSINESS_ADS') {
              handleCloseSatelliteModal();
            }
          }}
          businesses={sponsoredBusinesses}
          selectedBusiness={selectedMerchantModal}
          onSelectBusiness={(biz) => setSelectedMerchantModal(biz)}
          onOpenVoiceChat={(biz) => handleOpenVoiceChatForStore(biz)}
          onFlyToBusiness={(biz) => {
            if (isValidCoord(biz?.lat, biz?.lng)) {
              setTargetCoords({ lat: biz.lat, lng: biz.lng });
              setLodLevel('URBANO_3D');
            } else {
              toast.error(`Coordinate non disponibili per ${biz?.name || 'questa attività'}`);
            }
          }}
          onOpenPromoteModal={() => setIsAdModalOpen(true)}
        />
      )}

      {/* 🛰️ MODALI DEGLI 8 SATELLITI ORBITANTI OPERATIVI */}
      {activeSatellite === 'KMZERO' && (
        <VetrinaKmZero
          isOpen={true}
          onClose={handleCloseSatelliteModal}
          currentUser={currentProfile}
          onTriggerHandshake={onTriggerHandshake}
        />
      )}
      {(activeSatellite === 'MONDO' || activeSatellite === 'SUPERMARKET') && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
          <GlobalMarketplaceView
            onBack={handleCloseSatelliteModal}
            currentUser={currentProfile}
            onAddWantListing={(listing) => {
              if (onTriggerHandshake) onTriggerHandshake(listing);
              handleCloseSatelliteModal();
            }}
          />
        </div>
      )}
      {activeSatellite === 'EXTERNAL' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-zinc-950 border border-orange-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    GATEWAY-RELAIS • MERCATI ESTERI & INTERNAZIONALI
                  </div>
                  <h3 className="text-lg font-black text-white">Ricerca su eBay, Amazon & Store Esteri</h3>
                </div>
              </div>
              <button
                onClick={handleCloseSatelliteModal}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                title="Chiudi Mercati Esteri"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={externalSearchQuery}
                onChange={(e) => setExternalSearchQuery(e.target.value)}
                placeholder="Cerca prodotti esteri su Amazon, eBay..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-400"
              />
              <select
                value={externalCountryCode}
                onChange={(e) => setExternalCountryCode(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:border-orange-400 max-w-[190px]"
              >
                <option value="GLOBAL">🌐 Globale</option>
                {WORLD_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <ExternalListings
              country={externalCountryCode}
              query={externalSearchQuery || 'offerte'}
            />
          </div>
        </div>
      )}
      {(activeSatellite === 'P2P' || activeSatellite === 'LAVORO') && (
        <BachecaLavoroP2P
          isOpen={true}
          onClose={handleCloseSatelliteModal}
          currentUser={currentProfile}
        />
      )}
      {(activeSatellite === 'WEATHER' || activeSatellite === 'METEO') && (
        <LiveWeatherModal
          isOpen={true}
          onClose={handleCloseSatelliteModal}
          country={selectedCountry}
        />
      )}
      {activeSatellite === 'STRADARIO' && (
        <StreetView360Modal
          isOpen={true}
          onClose={handleCloseSatelliteModal}
          lat={targetCoords?.lat ?? selectedCountry?.lat}
          lng={targetCoords?.lng ?? selectedCountry?.lng}
          cityName={selectedCountry?.name || 'Mondo'}
        />
      )}
      {activeSatellite === 'COMUNITA' && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto flex flex-col gap-4">
          <div className="max-w-4xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-red-400">
                  COSPAS-SARSAT • COMUNITÀ, SOCCORSO & MOBILITÀ SOLIDALE
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {communityModalMode === 'CARPOOL' ? 'Carpool Solidale Attivo' : 'Presidi Emergenze Globali'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCommunityModalMode('EMERGENCY');
                    setIsEmergencyModalOpen(true);
                    setIsCarpoolModalOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                    communityModalMode === 'EMERGENCY'
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🚨 Emergenze
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommunityModalMode('CARPOOL');
                    setIsEmergencyModalOpen(false);
                    setIsCarpoolModalOpen(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                    communityModalMode === 'CARPOOL'
                      ? 'bg-[#00ff66] text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🚗 Carpool
                </button>
              </div>

              <button
                type="button"
                onClick={handleCloseSatelliteModal}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Chiudi</span>
              </button>
            </div>
          </div>

          <div className="max-w-4xl w-full mx-auto">
            {communityModalMode === 'CARPOOL' ? (
              <div className="w-full [&>div]:!static [&>div]:!inset-auto [&>div]:!bg-transparent [&>div]:!backdrop-blur-none [&>div]:!p-0 [&>div]:!animate-none">
                <GlobalCarpoolModal
                  isOpen={isCarpoolModalOpen && communityModalMode === 'CARPOOL'}
                  onClose={handleCloseSatelliteModal}
                />
              </div>
            ) : (
              <div className="w-full [&>div]:!static [&>div]:!inset-auto [&>div]:!bg-transparent [&>div]:!backdrop-blur-none [&>div]:!p-0 [&>div]:!animate-none">
                <WorldEmergencyModal
                  isOpen={isEmergencyModalOpen && communityModalMode !== 'CARPOOL'}
                  onClose={handleCloseSatelliteModal}
                  defaultCountryCode={selectedCountry?.code || selectedCountry?.id || 'GLOBAL'}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {activeSatellite === 'RADAR' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <span className="text-4xl">📡</span>
            <h3 className="text-lg font-black text-white">Radar Territoriale di Prossimità</h3>
            <p className="text-xs text-zinc-300">
              Scansione attiva per le coordinate di <strong>{selectedCountry?.name || 'questo territorio'}</strong>. Raggio di copertura P2P impostato su prossimità locale.
            </p>
            <button
              onClick={handleCloseSatelliteModal}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-colors cursor-pointer"
            >
              Conferma Scansione Radar
            </button>
          </div>
        </div>
      )}
      {activeSatellite === 'BARATTO' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-zinc-950 border border-pink-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <span className="text-4xl">🔄</span>
            <h3 className="text-lg font-black text-white">Filtro Baratto Puro & WANT</h3>
            <p className="text-xs text-zinc-300">
              Visualizzazione esclusiva di scambi reciproci merce contro merce, senza moneta fiat. Risoluzione desideri con matching algoritmico inverso.
            </p>
            <button
              onClick={handleCloseSatelliteModal}
              className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-black text-xs transition-colors cursor-pointer"
            >
              Attiva Filtro Baratto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
