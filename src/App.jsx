import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Toaster, toast } from 'sonner';
import MapView3DContainer from '@/components/have2want/MapView3DContainer';
import StrettaDiMano from '@/components/have2want/StrettaDiMano';
import AdRewardHub from '@/components/have2want/AdRewardHub';
import { HomeFeedView } from '@/components/HomeFeedView';
import { ClassicEssentialView } from '@/components/have2want/ClassicEssentialView';
import { CreateListingModal } from '@/components/CreateListingModal';
import { CertifiedMeetingPointsModal } from '@/components/CertifiedMeetingPointsModal';
import { DiscreetAIAssistant } from '@/components/DiscreetAIAssistant';
import { ConoscenzeMestieriArchive } from '@/components/SalvavatuttoArchive';
import { DriveExporter } from '@/components/DriveExporter';
import { LegalWelcomeShield } from '@/components/LegalWelcomeShield';
import { AuthorshipCertificateModal } from '@/components/AuthorshipCertificateModal';
import { PiVerificationModal } from '@/components/PiVerificationModal';
import WorldEmergencyModal from '@/components/have2want/WorldEmergencyModal';
import GlobalCarpoolModal from '@/components/have2want/GlobalCarpoolModal';
import CraftMemoryModal from '@/components/have2want/CraftMemoryModal';
import AppTutorModal from '@/components/have2want/AppTutorModal';
import InterruttoriRapidiModal from '@/components/have2want/InterruttoriRapidiModal';
import AutoTutorPill from '@/components/have2want/AutoTutorPill';
import OrbitalSatellitesHub from '@/components/have2want/OrbitalSatellitesHub';
import { SATELLITE_TO_CHANNEL } from '@/lib/satelliteModularEngine';
import { DedicatedCategoryPage } from '@/components/DedicatedCategoryPage';
import { CountrySelectorModal } from '@/components/CountrySelectorModal';
import { COUNTRIES, getCountryForListing } from '@/data/countries';
import {
  findCountryByNameOrCode,
  WORLD_COUNTRIES,
  isValidCoord,
  searchAnyWorldPlace,
} from '@/lib/worldAtlas';
import {
  calculateMunicipalityCentroid,
  applyGeoPrivacy,
  haversineDistanceKm,
  passesModerationFilter,
  isWithinProximityPreference,
  filterVisibleListings,
} from '@/lib/geoPrivacy';
import { INITIAL_LISTINGS, SALVAVATUTTO_GUIDES } from '@/data';
import { REAL_CATEGORIES_MATRIX } from '@/categories';
import { fetchExternal, getMarketplaces } from '@/lib/externalMarketplaces';
import { subscribeToCloudListings, publishListingToCloud } from '@/lib/firestoreService';

export {
  calculateMunicipalityCentroid,
  applyGeoPrivacy,
  haversineDistanceKm,
  passesModerationFilter,
  isWithinProximityPreference,
  filterVisibleListings,
};
import {
  Globe,
  Globe2,
  Building2,
  LayoutGrid,
  Plus,
  Sparkles,
  ShieldCheck,
  BookOpen,
  CloudUpload,
  Scale,
  X,
  Lock,
  Eye,
  EyeOff,
  Compass,
  CheckCircle2,
  MapPin,
  Handshake,
  SlidersHorizontal,
  ChevronDown,
  Award,
  Store,
  Mic,
  Search,
  Car,
  Wrench,
  Zap,
  ExternalLink
} from 'lucide-react';

// Le funzioni geoPrivacy e Visibility Manager sono centralizzate e re-esportate da @/lib/geoPrivacy.

const MASTER_SPEC_DOCUMENT = `# HAVE2WANT PLUS — MANIFESTO & SPECIFICHE TECNICHE COMPLETE
Denominazione Ufficiale: HAVE2WANT PLUS
Ideatore e Paternità: brandoriginalword@gmail.com
Slogan Identitario: "Molto di più di una bacheca: L'Ecosistema P2P Territoriale & Pi Network"
Flusso Fondamentale: WHAT YOU HAVE → WHAT YOU WANT

## IL MANIFESTO: PERCHÉ PLUS? (I 5 PILASTRI FONDAMENTALI)
1. NON UNA BACHECA, MA IL TUO TERRITORIO 3D
   Non una lista fredda di annunci: vedi il tuo quartiere, la tua città e il mondo in 3D con ciò che accade realmente intorno a te (Globo astronomico, Urbano 3D, botteghe locali).

2. RECIPROCITÀ UMANA INTEGRALE (Cosa Ho ➔ Cosa Cerco)
   Non solo compravendita: scambio diretto di beni inutilizzati, attrezzi, libri, competenze artigiane, passaggi in auto (carpooling) e tempo condiviso.

3. ZERO BANCHE & ECONOMIA PI NETWORK (π)
   Libertà totale da commissioni parassitarie e costi di transazione tradizionali: scambi P2P diretti a costo zero o valorizzati tramite la criptovaluta sociale Pi Network.

4. SALVAVATUTTO & MEMORIA COLLETTIVA
   Rigenerare anziché gettare. Guide pratiche comunitarie di autoproduzione, riparazione, ecologia applicata e conservazione dei saperi artigiani locali.

5. SICUREZZA REALE & GEOPRIVACY ASSOLUTA
   Nessun indirizzo privato esposto (sfocatura centroide protetta ~2.5km). Punti d'incontro pubblici certificati, firma della Stretta di Mano e codice PIN a 4 cifre per la massima serenità.

---
Specifiche Moduli di Sicurezza e Privacy:
- geoPrivacy: Posizionamento su centroide comunale (~2.5km) in Modalità Discreta.
- Visibility Manager: Filtro moderazione integrato + preferenze di vicinanza (Near You / Community / Everywhere).
- Stretta di Mano: Accordo sicuro e riservato con protocollo crittografico, PIN e conferma dal vivo.`;

/* =========================================================================
   COMPONENTE PRINCIPALE DI APPLICAZIONE (HAVE2WANT PLUS)
   ========================================================================= */
function Have2WantPlusMain() {
  const { user, updateUser } = useAuth();

  // 1. STATO CATEGORIE & ESIGENZE UTENTE (Filtri distinti per richiesta: VENDO, SCAMBIO, CERCO, TRASFERTE, SERVIZI, LIBRI)
  const [activeFilter, setActiveFilter] = useState(null); // null = "La bacheca e la mappa sono pulite"
  const [searchQuery, setSearchQuery] = useState(''); // Ricerca per esigenza o città

  // 2. MODULO PRIVACY GEOGRAFICA: Modalità Discreta attiva di default
  const [isDiscreetMode, setIsDiscreetMode] = useState(true);

  // 3. PREFERENZE DI VICINANZA: 'NEAR_YOU' | 'COMMUNITY' | 'EVERYWHERE'
  const [proximityPreference, setProximityPreference] = useState('EVERYWHERE');
  const [showProximityMenu, setShowProximityMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 4. SELETTORE VISTA: 'GLOBO' | 'URBANO_3D' | 'BACHECA'
// viewMode === 'URBANO_3D' — modalità territorio 3D (OrbitalSatellitesHub)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = (params.get('view') || params.get('tab') || '').toLowerCase();
      if (v === 'bacheca' || v === 'home' || window.location.hash === '#home' || window.location.hash === '#bacheca') {
        return 'BACHECA';
      }
    }
    return 'GLOBO';
  });
  const [resetWorldCount, setResetWorldCount] = useState(0);

  // CATEGORIA SELEZIONATA DAL MENU A TENDINA & PAGINA DEDICATA
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedDedicatedCategory, setSelectedDedicatedCategory] = useState(null);

  // INTERFACE DUAL MODE: "Vista 3D" (Cinematografica, Globo e Volumi) vs "Vista Classica" (Testi grandi, alto contrasto, semplificata)
  const [isClassicMode, setIsClassicMode] = useState(false);

  // Dataset Annunci e Guide
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [guides, setGuides] = useState(SALVAVATUTTO_GUIDES);

  // Sincronizzazione in tempo reale con Firebase Firestore Cloud Database
  useEffect(() => {
    const unsubscribe = subscribeToCloudListings((cloudListings) => {
      if (cloudListings && cloudListings.length > 0) {
        setListings((prev) => {
          const cloudIds = new Set(cloudListings.map((c) => c.id));
          const localRemaining = prev.filter((p) => !cloudIds.has(p.id));
          return [...cloudListings, ...localRemaining];
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Conteggio annunci per ogni categoria (per la Barra Rotante)
  const listingsCountsByCategory = useMemo(() => {
    const counts = {};
    listings.forEach((item) => {
      const cat = item.category || item.category_key;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [listings]);

  // 5. 3. LOGICA "STRETTA DI MANO" (Transaction Flow Modal)
  const [selectedHandshakeListing, setSelectedHandshakeListing] = useState(null);

  // Modali secondarie
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showMeetingPoints, setShowMeetingPoints] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [showDriveExport, setShowDriveExport] = useState(false);
  const [showLegalShield, setShowLegalShield] = useState(false);
  const [showAdHub, setShowAdHub] = useState(false);
  const [showAuthorshipModal, setShowAuthorshipModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showCarpoolModal, setShowCarpoolModal] = useState(false);
  const [showCraftMemoryModal, setShowCraftMemoryModal] = useState(false);
  const [activeSatelliteChannel, setActiveSatelliteChannel] = useState(null);
  const [showPiVerification, setShowPiVerification] = useState(false);

  // Scorrimento della barra superiore: attivo di default per scorrere dolcemente e mostrare tutte le voci
  const scrollBarRef = useRef(null);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [isBarHovered, setIsBarHovered] = useState(false);
  const scrollDirectionRef = useRef(1); // 1 = avanti (destra), -1 = indietro (sinistra)
  const pauseTimeoutRef = useRef(null);
  const isPausedAtEdgeRef = useRef(false);

  useEffect(() => {
    if (!isAutoScrollActive || isBarHovered) return;

    let animFrameId;
    const scrollStep = () => {
      const el = scrollBarRef.current;
      if (el && !isPausedAtEdgeRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 10) {
          if (scrollDirectionRef.current === 1) {
            el.scrollLeft += 0.45; // Velocità morbida e rilassante
            if (el.scrollLeft >= maxScroll - 2) {
              isPausedAtEdgeRef.current = true;
              pauseTimeoutRef.current = setTimeout(() => {
                scrollDirectionRef.current = -1;
                isPausedAtEdgeRef.current = false;
              }, 2500); // Pausa di 2.5s all'estremità
            }
          } else {
            el.scrollLeft -= 0.55;
            if (el.scrollLeft <= 2) {
              isPausedAtEdgeRef.current = true;
              pauseTimeoutRef.current = setTimeout(() => {
                scrollDirectionRef.current = 1;
                isPausedAtEdgeRef.current = false;
              }, 2500);
            }
          }
        }
      }
      animFrameId = requestAnimationFrame(scrollStep);
    };

    animFrameId = requestAnimationFrame(scrollStep);
    return () => {
      cancelAnimationFrame(animFrameId);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [isAutoScrollActive, isBarHovered]);

  const pioneerUser = {
    name: user?.name || "Utente Have2Want",
    username: user?.username || "@utente_locale",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    piBalance: typeof user?.credit_balance === 'number' ? user.credit_balance : 12.5,
    reputation: typeof user?.trust_rating === 'number' ? user.trust_rating : 4.9,
    city: user?.city || "Territorio Globale",
    verifiedKYC: true,
  };

  // Gestione toggle filtri ed esigenze utente (VENDO, SCAMBIO, CERCO, TRASFERTE, SERVIZI, LIBRI)
  const handleFilterClick = (filterName) => {
    if (activeFilter === filterName) {
      setActiveFilter(null);
      toast.info('🌍 Filtro rimosso: Mostro tutti gli annunci');
    } else {
      setActiveFilter(filterName);
      if (filterName === 'VENDO') toast.success('🟢 Filtro attivo: Annunci e oggetti disponibili');
      else if (filterName === 'SCAMBIO' || filterName === 'BARATTO') toast.success('🟡 Filtro attivo: Baratto e scambi diretti');
      else if (filterName === 'CERCO') toast.success('🔵 Filtro attivo: Richieste di cose cercate');
      else if (filterName === 'TRASFERTE') toast.success('🚗 Filtro attivo: Passaggi auto e viaggi condivisi');
      else if (filterName === 'SERVIZI') toast.success('🛠️ Filtro attivo: Servizi, manodopera e riparazioni');
      else if (filterName === 'LIBRI') toast.success('📚 Filtro attivo: Libri e testi scolastici');
    }
  };

  // 3 SCHEDE CHIAVE (VENDO, SCAMBIO, CERCO) basate sulla ricerca e sulla categoria
  const { matchedListings, vendoCount, scambioCount, cercoCount } = useMemo(() => {
    let pool = listings;

    // Filtro per categoria se selezionata
    if (selectedCategory && selectedCategory !== 'ALL') {
      pool = pool.filter((item) => {
        const catKey = item.category_key || item.category || '';
        return catKey === selectedCategory;
      });
    }

    // Filtro per ricerca testuale se inserita
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      pool = pool.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const city = (item.city || item.location_name || '').toLowerCase();
        const category = (item.category || item.category_label || '').toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
        return title.includes(q) || desc.includes(q) || city.includes(q) || category.includes(q) || tags.includes(q);
      });
    }

    const vendo = pool.filter((item) => item.action_type === 'vendo' || item.intent === 'VENDO');
    const scambio = pool.filter((item) =>
      item.action_type === 'baratto_scambio' ||
      item.intent === 'BARATTO_SCAMBIO' ||
      item.action_type === 'scambio' ||
      item.action_type === 'baratto'
    );
    const cerco = pool.filter((item) => item.action_type === 'cerco' || item.intent === 'ACQUISTO_CERCO' || item.intent === 'CERCO');

    return {
      matchedListings: pool,
      vendoCount: vendo.length,
      scambioCount: scambio.length,
      cercoCount: cerco.length,
    };
  }, [listings, selectedCategory, searchQuery]);

  // Integrazione pubblicazione trasferte da utente: crea l'annuncio sulla bacheca/mappa (risoluzione globale senza fallback a Roma o 0,0)
  const handlePublishTripToListing = async (trip) => {
    const originRaw = (trip.originCity || '').trim();
    const originLower = originRaw.toLowerCase();
    let resolvedLat;
    let resolvedLng;
    let resolvedCountryCode;

    // 1. Cerca prima tra stati, capitali e regioni in WORLD_COUNTRIES
    const directCountry = originRaw ? findCountryByNameOrCode(originRaw) : null;
    if (directCountry) {
      resolvedCountryCode = directCountry.code;
      if (isValidCoord(directCountry.lat, directCountry.lng)) {
        resolvedLat = directCountry.lat;
        resolvedLng = directCountry.lng;
      }
    }

    if (originLower) {
      for (const c of WORLD_COUNTRIES) {
        if (c.capital && c.capital.toLowerCase() === originLower && isValidCoord(c.lat, c.lng)) {
          resolvedLat = c.lat;
          resolvedLng = c.lng;
          resolvedCountryCode = c.code;
          break;
        }
        const reg = c.regions?.find(
          (r) =>
            r.name.toLowerCase() === originLower ||
            (r.capital && r.capital.toLowerCase() === originLower)
        );
        if (reg && isValidCoord(reg.lat, reg.lng)) {
          resolvedLat = reg.lat;
          resolvedLng = reg.lng;
          resolvedCountryCode = c.code;
          break;
        }
      }
    }

    // 2. Geocodifica mondiale per città specifiche (qualsiasi città del mondo)
    if (!isValidCoord(resolvedLat, resolvedLng) && originRaw.length >= 2) {
      try {
        const hits = await searchAnyWorldPlace(originRaw);
        const validHit = hits.find((h) => isValidCoord(h.lat, h.lng));
        if (validHit) {
          resolvedLat = validHit.lat;
          resolvedLng = validHit.lng;
          resolvedCountryCode = resolvedCountryCode || validHit.countryCode;
        }
      } catch {
        // Ignora errore rete geocodifica
      }
    }

    // 3. Eventuale fallback sul Paese esplicitamente selezionato dall'utente (se valido)
    if (!isValidCoord(resolvedLat, resolvedLng) && isValidCoord(selectedCountry?.lat, selectedCountry?.lng)) {
      resolvedLat = selectedCountry.lat;
      resolvedLng = selectedCountry.lng;
      resolvedCountryCode = resolvedCountryCode || selectedCountry.id?.toUpperCase();
    }

    const newListing = {
      id: `carpool-${Date.now()}`,
      title: `Trasferta ${trip.originCity} ➔ ${trip.destinationCity}`,
      description: `${trip.notes} • Partenza: ${trip.departureDate} ore ${trip.departureTime} • Posti liberi: ${trip.availableSeats} • Accordo: ${trip.suggestedPiContribution}`,
      category: 'auto_moto_veicoli',
      subcategory: 'trasferte_passaggi_carpool',
      intent: 'OFFRO_SERVIZIO',
      action_type: 'vendo',
      ...(isValidCoord(resolvedLat, resolvedLng) ? { lat: resolvedLat, lng: resolvedLng } : {}),
      ...(resolvedCountryCode ? { countryCode: resolvedCountryCode } : {}),
      city: trip.originCity,
      locationArea: `${trip.originCity} ➔ ${trip.destinationCity}`,
      price: 0,
      tags: ['trasferte', 'carpool', 'passaggi', trip.originCity.toLowerCase(), trip.destinationCity.toLowerCase()],
      author: {
        id: 'usr-pioneer',
        name: trip.driverName || 'Pioniere Conducente',
        trustRating: trip.driverRating || 5.0,
        city: trip.originCity,
      },
      created_at: new Date().toISOString(),
    };

    setListings((prev) => [newListing, ...prev]);
    setActiveFilter('TRASFERTE');
    toast.success(`🚗 Nuova trasferta ${trip.originCity} ➔ ${trip.destinationCity} pubblicata con successo!`);
  };

  // Selettore Territoriale / Nazione: impostato a null di default (Mondo intero pulito all'avvio)
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [countrySelectCount, setCountrySelectCount] = useState(0);

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setCountrySelectCount((prev) => prev + 1);
    if (viewMode !== 'GLOBO') setViewMode('GLOBO');
    if (country) {
      toast.success(`${country.flag} Destinazione selezionata: ${country.name}`);
    } else {
      setResetWorldCount((prev) => prev + 1);
      toast.info('🌍 Vista globale: Tutto il Mondo');
    }
  };

  const listingsCountsByCountry = useMemo(() => {
    const counts = {};
    listings.forEach((item) => {
      const country = getCountryForListing(item, COUNTRIES);
      if (country && country.id) {
        const id = country.id.toLowerCase();
        counts[id] = (counts[id] || 0) + 1;
      }
    });
    return counts;
  }, [listings]);

  // Reset telecamera al Mondo intero ("🌍 MONDO")
  const handleResetToWorld = () => {
    setSelectedCountry(null);
    setCountrySelectCount((prev) => prev + 1);
    if (viewMode !== 'GLOBO') setViewMode('GLOBO');
    setResetWorldCount((prev) => prev + 1);
    toast.info('🌍 Vista Macro Globale (Tutto il Mondo)');
  };

  // Centratura istantanea su Italia e le sue 20 Regioni ("🇮🇹 ITALIA")
  const [focusItalyCount, setFocusItalyCount] = useState(0);
  const handleFocusItaly = () => {
    const italy = COUNTRIES.find((c) => c.id === 'it');
    setSelectedCountry(italy || null);
    setCountrySelectCount((prev) => prev + 1);
    if (viewMode !== 'GLOBO') setViewMode('GLOBO');
    setFocusItalyCount((prev) => prev + 1);
    toast.success('🇮🇹 Centratura istantanea su Italia e 20 Regioni');
  };

  // Triggers modali integrate nella mappa 3D (Pi Hub, Pubblicizza Negozio, Note Vocali)
  const [openPiHubCount, setOpenPiHubCount] = useState(0);
  const [openAdModalCount, setOpenAdModalCount] = useState(0);
  const [openVoiceChatCount, setOpenVoiceChatCount] = useState(0);

  // Modali Tutor Ufficiale & Pannello Interruttori
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [showInterruttoriModal, setShowInterruttoriModal] = useState(false);
  const [isAutoTutorActive, setIsAutoTutorActive] = useState(true);

  const handleOpenPiHub = () => setOpenPiHubCount((prev) => prev + 1);
  const handleOpenAdModal = () => setOpenAdModalCount((prev) => prev + 1);
  const handleOpenVoiceChat = () => setOpenVoiceChatCount((prev) => prev + 1);

  // Toggle Modalità Discreta (geoPrivacy)
  const handleToggleDiscreetMode = () => {
    const nextState = !isDiscreetMode;
    setIsDiscreetMode(nextState);
    if (nextState) {
      toast.success('🔒 Modalità Discreta Attiva', {
        description: 'Gli annunci sono posizionati sul centroide del comune con raggio approssimato (~2.5km) per tutelare la privacy.',
      });
    } else {
      toast.warning('📍 Modalità Esatta Attiva', {
        description: 'La mappa visualizza le coordinate specifiche ove fornite.',
      });
    }
  };

  // Attivazione flusso protetto "Consegna a Mano" da popup o scheda
  const handleTriggerHandshake = (listing) => {
    setSelectedHandshakeListing(listing);
    toast.info('🤝 Inizializzazione Consegna a Mano Protetta', {
      description: `Accordo sicuro di persona con ${listing?.author?.name || 'l\'offerente'}.`,
    });
  };

  const handleAddListing = async (newListing) => {
    setListings((prev) => [newListing, ...prev]);
    try {
      await publishListingToCloud(newListing);
      toast.success('☁️ Annuncio sincronizzato in tempo reale sul Cloud mondiale!');
    } catch (err) {
      console.warn("Sync cloud warning:", err);
    }
  };

  const handleOpenAdHub = () => {
    setShowAdHub(true);
  };

  const hasActiveModal = Boolean(
    showCreateModal ||
    showCarpoolModal ||
    showEmergencyModal ||
    showAdHub ||
    showAIAssistant ||
    showMeetingPoints ||
    showGuides ||
    showDriveExport ||
    showLegalShield ||
    showAuthorshipModal ||
    showCountrySelector ||
    showInterruttoriModal ||
    showTutorModal ||
    showCraftMemoryModal ||
    selectedHandshakeListing
  );

  return (
    <div className="w-full h-full max-h-[100dvh] relative overflow-hidden bg-black text-white select-none flex flex-col font-sans">
      {/* =================================================================
          SEZIONE SUPERIORE: HEADER & BARRA AZIONI SCORREVOLE ORIZZONTALMENTE
          ================================================================= */}
      <header
        id="main-app-header"
        className="relative shrink-0 w-full z-30 flex flex-col gap-1 px-3 py-2 bg-black border-b border-zinc-900 shadow-none pointer-events-auto"
      >
        {/* RIGA 1: LOGO IDENTITY COMPATTO & AZIONI PRINCIPALI */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Wordmark & Tagline (Cliccabile per aprire la Home o tornare al Globo 3D) */}
          <div 
            onClick={() => {
              if (viewMode !== 'BACHECA') {
                setViewMode('BACHECA');
                toast.info('🏠 Apertura Home & Bacheca Annunci');
              } else {
                setViewMode('GLOBO');
                toast.info('🌍 Ritorno alla Vista Globo 3D');
              }
            }}
            className="flex items-center gap-2 min-w-0 cursor-pointer group"
            title="Clicca per aprire la Home & Bacheca Annunci (oppure tornare al Globo 3D)"
          >
            <div className="p-1.5 rounded-xl bg-zinc-900 group-hover:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-800 transition-colors">
              <Globe className="w-4 h-4 text-[#00ff66] stroke-[2.5]" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-wider text-white group-hover:text-[#00ff66] transition-colors truncate">
                  HAVE2WANT <span className="text-[#00ff66]">PLUS</span>
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-zinc-900 text-[#00ff66] border border-zinc-800">
                  BARATTO & PI
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-300 hidden sm:inline truncate">
                Mappa Solidale: <span className="text-white font-bold">Cosa Hai</span> <span className="text-[#00ff66] font-black">➔</span> <span className="text-white font-bold">Cosa Cerchi</span>
              </span>
            </div>
          </div>

          {/* Azioni Primarie a Destra: Tutor, Dual Mode & + Pubblica */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 🎓 TUTOR UFFICIALE DIRETTO & BEN VISIBILE */}
            <button
              id="btn-header-tutor"
              onClick={() => setShowTutorModal(true)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-black tracking-wide flex items-center gap-1.5 cursor-pointer transition-colors bg-zinc-900 hover:bg-zinc-800 text-white hover:text-[#00ff66] border border-zinc-800 active:scale-95"
              title="Apri il Tutor Ufficiale: Guida interattiva e spiegazione delle funzioni"
            >
              <span className="hidden xs:inline">TUTOR</span>
            </button>

            {/* INTERRUTTORE DUAL MODE: Vista 3D vs Vista Classica */}
            <button
              id="btn-toggle-dual-mode"
              onClick={() => {
                const nextMode = !isClassicMode;
                setIsClassicMode(nextMode);
                toast.info(nextMode ? "👓 Modalità Classica Attiva: testi grandi e layout essenziale" : "🌐 Modalità 3D Immersiva Attiva");
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-wide flex items-center gap-1.5 cursor-pointer transition-colors ${
                isClassicMode
                  ? 'bg-[#00ff66] text-black font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
              }`}
              title={isClassicMode ? "Passa a Vista 3D Immersiva" : "Passa a Vista Classica (alta leggibilità)"}
            >
              <span>{isClassicMode ? '👓 Classica' : '🌐 3D'}</span>
            </button>

            {/* + Pubblica */}
            <button
              id="btn-create-listing"
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#00ff66] hover:bg-[#00e65c] text-black flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 shadow-sm"
              title="Pubblica un nuovo annuncio (What you have → What you want)"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Pubblica</span>
            </button>
          </div>
        </div>

        {/* RIGA 2: BARRA SCORREVOLE AUTOMATICAMENTE (ROTANTE / AUTO-PAN CON PAUSA AL TOCCO) */}
        <div className="relative w-full flex items-center">
          <div
            id="unified-horizontal-scroll-bar"
            ref={scrollBarRef}
            onMouseEnter={() => setIsBarHovered(true)}
            onMouseLeave={() => setIsBarHovered(false)}
            onTouchStart={() => setIsBarHovered(true)}
            onTouchEnd={() => setTimeout(() => setIsBarHovered(false), 2000)}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5 border-t border-zinc-900 touch-pan-x w-full"
          >
            {/* 🌍 1. IN PRIMO PIANO: SELETTORE NAZIONE & MONDO (SUBITO VISIBILE A TUTTI) */}
            <button
              id="btn-open-country-selector"
              onClick={() => setShowCountrySelector(true)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-2 shadow-sm ${
                selectedCountry
                  ? 'bg-emerald-950/90 text-emerald-300 border-[#00ff66]/70 shadow-[0_0_12px_rgba(0,255,102,0.25)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700 hover:border-[#00ff66]'
              }`}
              title="Cambia Nazione / Territorio: seleziona qualsiasi paese del mondo a tendina"
            >
              <span className="text-base">{selectedCountry ? selectedCountry.flag : '🌍'}</span>
              <span className="font-mono font-bold">
                {selectedCountry ? selectedCountry.name.toUpperCase() : 'SCEGLI STATO'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#00ff66]" />
            </button>

            <button
              id="btn-nav-world"
              onClick={handleResetToWorld}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                !selectedCountry
                  ? 'bg-[#00ff66] text-black font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title="Vista Macro Globale: Reset telecamera con fly-to al Mondo intero"
            >
              <span>🌍</span>
              <span>MONDO</span>
            </button>

            {/* TASTINO DI CONTROLLO ROTAZIONE CONTINUA */}
            <button
              id="btn-toggle-autoscroll"
              onClick={() => {
                const next = !isAutoScrollActive;
                setIsAutoScrollActive(next);
                toast.info(next ? "▶️ Scorrimento automatico attivo" : "⏸️ Scorrimento automatico in pausa");
              }}
              className={`px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                isAutoScrollActive ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              }`}
              title={isAutoScrollActive ? "Metti in pausa lo scorrimento automatico della barra" : "Avvia lo scorrimento automatico"}
            >
              <span>{isAutoScrollActive ? '⏸️' : '▶️'}</span>
              <span className="hidden xs:inline">{isAutoScrollActive ? 'Auto' : 'Fermo'}</span>
            </button>

            {/* Separatore */}
            <div className="w-[1px] h-5 bg-zinc-800 shrink-0" />

            {/* 🛰️ SERVIZI CHIAVE CON CONTORNO LED LUMINOSO (CUORE DELL'APP) — 10 SATELLITI DEFINITIVI */}




            {/* 3. Prodotti del Mondo (Marketplace Interno): Contorno LED Viola Neon */}
            <button
              id="btn-scroll-channel-prodotti-mondo"
              onClick={() => {
                setActiveSatelliteChannel(SATELLITE_TO_CHANNEL.GLOBAL_MARKET_SAT);
                toast.info("🌐 PRODOTTI DEL MONDO — Marketplace Interno Utenti");
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-zinc-950 hover:bg-purple-950/60 border-2 border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.45)] text-white flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              title="PRODOTTI DEL MONDO — Annunci Utenti HAVE2WANT, Compravendita P2P, Pagamenti Pi"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7] animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[12px] font-black text-purple-300">🌐 PRODOTTI MONDO</span>
                <span className="text-[9px] font-bold text-purple-400/80 uppercase tracking-tighter">Marketplace Interno</span>
              </div>
            </button>



            {/* 5. Soccorso: Contorno LED Rosso Emergenza */}
            <button
              id="btn-scroll-channel-soccorso"
              onClick={() => {
                setActiveSatelliteChannel(SATELLITE_TO_CHANNEL.SOCCORSO_SAT);
                toast.info("🆘 SOCCORSO — Emergenze Mondiali, Carpooling Solidale, Punti Incontro Certificati");
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-zinc-950 hover:bg-red-950/60 border-2 border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.45)] text-white flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              title="SOCCORSO — Numeri Emergenza Globali, Mutuo Aiuto, Presidi Civici — SEPARATO da Chat/Video"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[12px] font-black text-red-300">🆘 SOCCORSO</span>
                <span className="text-[9px] font-bold text-red-400/80 uppercase tracking-tighter">Emergenze Globali</span>
              </div>
            </button>

            {/* 6. Creazione Pubblicità: Contorno LED Viola/Fucsia */}
            <button
              id="btn-scroll-channel-creazione-pubblicita"
              onClick={() => {
                setActiveSatelliteChannel(SATELLITE_TO_CHANNEL.BUSINESS_ADS_SAT);
                toast.info("🏪 CREAZIONE PUBBLICITÀ — Vetrine Sponsorizzate 7gg Pi + AI Creator");
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-zinc-950 hover:bg-purple-950/60 border-2 border-[#e11d48] shadow-[0_0_12px_rgba(225,29,72,0.45)] text-white flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              title="CREAZIONE PUBBLICITÀ — Pubblicità Commercianti, AI Creator per Contenuti, Vetrine Geolocalizzate"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] shadow-[0_0_8px_#e11d48] animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[12px] font-black text-pink-300">🏪 CREAZIONE ADS</span>
                <span className="text-[9px] font-bold text-pink-400/80 uppercase tracking-tighter">Vetrine + AI</span>
              </div>
            </button>

            {/* 7. Marketplace Esterni: Contorno LED Arancione */}
            <button
              id="btn-scroll-channel-marketplace-esterni"
              onClick={() => {
                setActiveSatelliteChannel(SATELLITE_TO_CHANNEL.EXTERNAL_MARKET_SAT);
                toast.info("🛒 MARKETPLACE ESTERNI — Amazon, eBay, AliExpress, Link Affiliati, Commissioni Crypto");
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-zinc-950 hover:bg-amber-950/60 border-2 border-[#f97316] shadow-[0_0_12px_rgba(249,115,22,0.45)] text-white flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              title="MARKETPLACE ESTERNI — Ricerca Prodotti Esterni, Link Affiliati Tracciati, Pagamento Criptovaluta"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_8px_#f97316] animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[12px] font-black text-amber-300">🛒 MARKET ESTERNI</span>
                <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-tighter">Canali Esterni</span>
              </div>
            </button>



            {/* 9. PI Chat: Contorno LED Verde Neon */}
            <button
              id="btn-scroll-channel-pi-chat"
              onClick={() => {
                setActiveSatelliteChannel(SATELLITE_TO_CHANNEL.PI_CHAT_SAT);
                toast.info("🎙️ PI CHAT — Messaggistica, Note Vocali, Videochiamata, Gruppi Comunità/Quartiere");
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-zinc-950 hover:bg-emerald-950/60 border-2 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.45)] text-white flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              title="PI CHAT — Chat Vocale & Video, Gruppi Comunità/Quartiere — SEPARATO da SOCCORSO"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[12px] font-black text-emerald-300">🎙️ PI CHAT</span>
                <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-tighter">Chat & Video</span>
              </div>
            </button>





            {/* Separatore */}
            <div className="w-[1px] h-5 bg-zinc-800 shrink-0" />



            {/* ⚙️ PANNELLO IMPOSTAZIONI COMPLETO */}
            <button
              id="btn-scroll-interruttori"
              onClick={() => setShowInterruttoriModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 border border-zinc-800"
              title="Pannello Impostazioni: Opzioni, privacy, tutor e configurazioni"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>IMPOSTAZIONI</span>
            </button>

            {/* 🔒 INTERRUTTORE MODALITÀ DISCRETA */}
            <button
              id="btn-scroll-discreet-mode"
              onClick={handleToggleDiscreetMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                isDiscreetMode
                  ? 'bg-zinc-900 text-[#00ff66] border border-emerald-500/30'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
              title={isDiscreetMode ? "Modalità Discreta attiva: centroide comunale (~2.5km)" : "Modalità Esatta"}
            >
              {isDiscreetMode ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span>DISCRETA ON</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ESATTA</span>
                </>
              )}
            </button>

          <button
            id="btn-nav-bacheca"
            onClick={() => {
              if (viewMode === 'BACHECA') {
                setViewMode('GLOBO');
                toast.info('🌍 Vista Globo 3D Attiva');
              } else {
                setViewMode('BACHECA');
                toast.info('🏠 Home & Bacheca Annunci Aperta');
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-md ${
              viewMode === 'BACHECA'
                ? 'bg-white text-black ring-2 ring-[#00ff66]'
                : 'bg-[#00ff66] hover:bg-[#00e65c] text-black font-black'
            }`}
            title="Apri la Home con tutti gli annunci, foto e categorie (o torna al Globo 3D)"
          >
            <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
            <span>{viewMode === 'BACHECA' ? '🌐 VISTA GLOBO 3D' : '🏠 HOME / TUTTI GLI ANNUNCI'}</span>
          </button>



          {/* Separatore */}
          <div className="w-[1px] h-6 bg-zinc-800 shrink-0" />

          {/* MENU A TENDINA CATEGORIE + BARRA DI RICERCA GRANDE AD ALTO CONTRASTO */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. SELETTORE A TENDINA VERTICALE DELLE CATEGORIE */}
            <div className="relative">
              <button
                type="button"
                id="btn-category-dropdown-trigger"
                onClick={() => setShowCategoryDropdown((prev) => !prev)}
                className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  selectedCategory !== 'ALL'
                    ? 'bg-[#00ff66] text-black border-[#00ff66]'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'
                }`}
                title="Scegli una categoria dal menu a tendina"
              >
                <span>📂</span>
                <span className="max-w-[130px] truncate">
                  {selectedCategory === 'ALL'
                    ? 'Tutte le Categorie'
                    : REAL_CATEGORIES_MATRIX.find((c) => c.key === selectedCategory)?.label || selectedCategory}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* TENDINA VERTICALE A SCOMPARSA */}
              {showCategoryDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-64 max-h-80 overflow-y-auto bg-zinc-950 border-2 border-emerald-500/50 rounded-2xl p-1.5 z-50 shadow-2xl space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setShowCategoryDropdown(false);
                        toast.info('Mostro tutte le categorie');
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 cursor-pointer transition-colors ${
                        selectedCategory === 'ALL'
                          ? 'bg-[#00ff66] text-black'
                          : 'text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <span>🌍</span>
                      <span>Tutte le Categorie</span>
                    </button>
                    {REAL_CATEGORIES_MATRIX.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.key);
                          setShowCategoryDropdown(false);
                          toast.success(`Categoria: ${cat.label}`);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 cursor-pointer transition-colors ${
                          selectedCategory === cat.key
                            ? 'bg-[#00ff66] text-black'
                            : 'text-zinc-200 hover:bg-zinc-900'
                        }`}
                      >
                        <span className="text-sm">📌</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 2. BARRA DI RICERCA GRANDE, LUMINOSA E AD ALTO CONTRASTO */}
            <div className="relative flex items-center min-w-[220px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-[#00ff66] absolute left-3 pointer-events-none stroke-[2.5]" />
              <input
                type="text"
                id="input-user-need-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cosa cerchi? (es. libro, trapano, bici...)"
                className="w-full h-9 pl-9 pr-8 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 hover:bg-zinc-850 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#00ff66] focus:bg-zinc-950 transition-all border-2 border-zinc-700 focus:border-[#00ff66] shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 w-5 h-5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                  title="Cancella testo"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pulsante reset rapido se attivo */}
            {(selectedCategory !== 'ALL' || searchQuery || activeFilter) && (
              <button
                type="button"
                id="btn-reset-filter"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setActiveFilter(null);
                  toast.info('🌍 Ricerca azzerata: mostro tutto');
                }}
                className="h-9 px-2.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                title="Azzera filtri e ricerca"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Pulisci</span>
              </button>
            )}
          </div>

          {/* Separatore */}
          <div className="w-[1px] h-5 bg-zinc-800 shrink-0" />

          {/* GRUPPO 3: PI NETWORK, NEGOZI & NOTE VOCALI */}
          <button
            id="btn-pi-hub"
            onClick={handleOpenPiHub}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            title="Integrazione Pi App Studio & SDK"
          >
            <span className="w-4 h-4 rounded-full bg-[#00ff66] text-black font-black flex items-center justify-center text-[10px]">π</span>
            <span>Pi Studio Hub</span>
          </button>





          {/* Separatore */}
          <div className="w-[1px] h-5 bg-zinc-800 shrink-0" />

          {/* GRUPPO 4: VICINANZA & STRUMENTI DI SICUREZZA */}
          <div className="relative shrink-0">
            <button
              id="btn-toggle-proximity-menu"
              onClick={() => setShowProximityMenu(!showProximityMenu)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
              title="Preferenze di vicinanza"
            >
              <Compass className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>
                {proximityPreference === 'NEAR_YOU' ? 'Vicinanza: Near You (≤25km)' : proximityPreference === 'COMMUNITY' ? 'Vicinanza: Community (≤80km)' : 'Vicinanza: Everywhere'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#00ff66]" />
            </button>

            {showProximityMenu && (
              <div
                id="proximity-dropdown-menu"
                className="absolute left-0 top-full mt-1.5 w-52 bg-[#0e0e11] border border-zinc-900 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 text-xs"
              >
                <div className="px-2 py-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                  Preferenze di Vicinanza
                </div>
                <button
                  onClick={() => {
                    setProximityPreference('NEAR_YOU');
                    setShowProximityMenu(false);
                    toast.info('📍 Vicinanza: Near You (entro 25 km)');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left font-bold flex items-center justify-between cursor-pointer ${
                    proximityPreference === 'NEAR_YOU' ? 'bg-[#00ff66] text-black font-black' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span>Near You</span>
                  <span className="text-[10px] opacity-80">≤ 25 km</span>
                </button>
                <button
                  onClick={() => {
                    setProximityPreference('COMMUNITY');
                    setShowProximityMenu(false);
                    toast.info('🏘️ Vicinanza: In Your Community (entro 80 km)');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left font-bold flex items-center justify-between cursor-pointer ${
                    proximityPreference === 'COMMUNITY' ? 'bg-[#00ff66] text-black font-black' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span>In Your Community</span>
                  <span className="text-[10px] opacity-80">≤ 80 km</span>
                </button>
                <button
                  onClick={() => {
                    setProximityPreference('EVERYWHERE');
                    setShowProximityMenu(false);
                    toast.info('🌍 Vicinanza: Everywhere (Globale)');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left font-bold flex items-center justify-between cursor-pointer ${
                    proximityPreference === 'EVERYWHERE' ? 'bg-[#00ff66] text-black font-black' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span>Everywhere</span>
                  <span className="text-[10px] opacity-80">Mondo</span>
                </button>
              </div>
            )}
          </div>

          {/* 10 SATELLITI DEFINITIVI + DEFIANCE PULSE */}
          <OrbitalSatellitesHub
            currentUser={pioneerUser}
            country={selectedCountry}
            onOpenChat={(mId) => {
              toast.success(`💬 Handshake chat avviato per: ${mId}`);
            }}
            onOpenSatelliteChannel={(channel) => setActiveSatelliteChannel(channel)}
            onOpenDefiancePulse={() => setActiveSatelliteChannel('DEFIANCE_PULSE')}
          />

          <button
            id="btn-meeting-points"
            onClick={() => setShowMeetingPoints(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            title="Punti d'Incontro Certificati (Sicurezza 3D)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Punti Sicuri</span>
          </button>

          <button
            id="btn-ai-assistant"
            onClick={() => setShowAIAssistant(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            title="Assistente AI Discreto (Simply Discreet)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>AI Discreta</span>
          </button>

          <button
            id="btn-guides"
            onClick={() => setShowGuides(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            title="Guide Pratiche, Fai-da-Te e Riparazioni"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Guide</span>
          </button>

          <button
            id="btn-drive-export"
            onClick={() => setShowDriveExport(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            title="Salva o esporta ricevute e accordi (Backup)"
          >
            <CloudUpload className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Backup Accordi</span>
          </button>

          <button
            id="btn-legal-shield"
            onClick={() => setShowLegalShield(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-sm"
            title="Guida Introduttiva, Zero Fiat, Pi SDK, Privacy GDPR e Regolamento Comunità"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Regolamento & Privacy</span>
          </button>

          <button
            id="btn-pi-verification"
            onClick={() => setShowPiVerification(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-sm"
            title="Verifica Stato Connessione Pi Network & Portale Sviluppatori"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>⚡ Stato Pi</span>
          </button>

          {/* SIGILLO DI PATERNITÀ & CREDITI ESCLUSIVI DELL'IDEATORE */}
          <button
            id="btn-authorship-seal-owner"
            onClick={() => setShowAuthorshipModal(true)}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-500/25 to-yellow-500/15 hover:from-amber-500/35 hover:to-yellow-500/25 text-amber-300 border border-amber-500/50 hover:border-amber-400 flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md shadow-amber-500/10 active:scale-95"
            title="Certificato Ufficiale di Paternità & Ideatore: brandoriginalword@gmail.com (HAVE2WANT PLUS)"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>© Paternità & Crediti</span>
          </button>
          </div>
        </div>
      </header>


      {/* =================================================================
          PANNELLO RISULTATI A 3 SCHEDE CHIAVE: VENDO • SCAMBIO • CERCO
          Compare quando l'utente cerca nella barra o seleziona una categoria
          ================================================================= */}
      {(searchQuery.trim() || selectedCategory !== 'ALL' || activeFilter) && (
        <div className="bg-zinc-950/95 border-b-2 border-emerald-500/40 px-3 sm:px-6 py-3 z-30 shrink-0 backdrop-blur-md shadow-2xl">
          <div className="max-w-5xl mx-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ff66] animate-ping" />
                <span className="text-xs sm:text-sm font-black text-white">
                  Risultati per:{' '}
                  <span className="text-[#00ff66]">
                    {searchQuery ? `"${searchQuery}"` : ''}
                    {searchQuery && selectedCategory !== 'ALL' ? ' in ' : ''}
                    {selectedCategory !== 'ALL'
                      ? REAL_CATEGORIES_MATRIX.find((c) => c.key === selectedCategory)?.label || selectedCategory
                      : ''}
                    {!searchQuery && selectedCategory === 'ALL' && activeFilter ? activeFilter : ''}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter(null);
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  toast.info('🌍 Ricerca azzerata: mostro tutto');
                }}
                className="text-[11px] font-bold text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                ✕ Chiudi ricerca
              </button>
            </div>

            {/* LE 3 GRANDI SCHEDE SOLUZIONE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* SCHEDA 1: VENDO */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('VENDO');
                  setViewMode('BACHECA');
                  toast.success(`🟢 Entro in VENDO: ${vendoCount} annunci trovati`);
                }}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer border-2 flex items-center justify-between group ${
                  activeFilter === 'VENDO'
                    ? 'bg-emerald-950/90 border-[#00ff66] ring-2 ring-[#00ff66]/30'
                    : 'bg-zinc-900/90 hover:bg-zinc-850 border-emerald-500/30 hover:border-[#00ff66]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00ff66]" />
                    <span className="text-sm font-black text-white group-hover:text-[#00ff66] transition-colors">
                      VENDO
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Chi offre questo bene</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-black text-[#00ff66] block">
                    {vendoCount}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-300 group-hover:underline">
                    Vedi →
                  </span>
                </div>
              </button>

              {/* SCHEDA 2: SCAMBIO */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('SCAMBIO');
                  setViewMode('BACHECA');
                  toast.success(`🟡 Entro in SCAMBIO: ${scambioCount} annunci trovati`);
                }}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer border-2 flex items-center justify-between group ${
                  activeFilter === 'SCAMBIO' || activeFilter === 'BARATTO'
                    ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/30'
                    : 'bg-zinc-900/90 hover:bg-zinc-850 border-amber-500/30 hover:border-amber-400'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                      SCAMBIO
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Chi vuole scambiare</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-black text-amber-400 block">
                    {scambioCount}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-300 group-hover:underline">
                    Vedi →
                  </span>
                </div>
              </button>

              {/* SCHEDA 3: CERCO */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('CERCO');
                  setViewMode('BACHECA');
                  toast.success(`🔵 Entro in CERCO: ${cercoCount} annunci trovati`);
                }}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer border-2 flex items-center justify-between group ${
                  activeFilter === 'CERCO'
                    ? 'bg-blue-950/90 border-blue-400 ring-2 ring-blue-400/30'
                    : 'bg-zinc-900/90 hover:bg-zinc-850 border-blue-500/30 hover:border-blue-400'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                      CERCO
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Chi lo sta cercando</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-black text-blue-400 block">
                    {cercoCount}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-300 group-hover:underline">
                    Vedi →
                  </span>
                </div>
              </button>
            </div>

            {/* 🌍 MARKETPLACE MONDIALI COLLEGATI (EBAY & LEADER GLOBALI) */}
            {searchQuery.trim() && (
              <div className="pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold">
                  <span className="text-base">🌐</span>
                  <span>Cerca <strong>"{searchQuery}"</strong> sui Marketplace del Mondo:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('ESTERNI');
                      setViewMode('BACHECA');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-[#00ff66] border border-emerald-500/50 text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>📦</span>
                    <span>Catalogo Fisico & Wallet USDT</span>
                  </button>
                  {getMarketplaces(selectedCountry?.id || 'GLOBAL').slice(0, 6).map((mp) => {
                    const searchUrl = mp.url.replace('{query}', encodeURIComponent(searchQuery.trim()));
                    return (
                      <a
                        key={mp.id}
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-[#00ff66] text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        title={`Apri ricerca in tempo reale su ${mp.name}`}
                      >
                        <span>{mp.flag || '🌐'}</span>
                        <span>{mp.name}</span>
                        <ExternalLink className="w-3 h-3 text-[#00ff66]" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================
          AREA CENTRALE: MAPPA & STATO VUOTO (O VISTA CLASSICA ACCESSIBILE)
          ================================================================= */}
      <main className="w-full flex-1 min-h-0 relative overflow-hidden">
        {isClassicMode ? (
          <ClassicEssentialView
            listings={listings}
            currentUser={pioneerUser}
            onSelectListing={(item) => handleTriggerHandshake(item)}
            onTriggerHandshake={(item) => handleTriggerHandshake(item)}
            onBackTo3D={() => setIsClassicMode(false)}
            onOpenEmergency={() => setShowEmergencyModal(true)}
            onOpenCarpool={() => setShowCarpoolModal(true)}
            onOpenMemory={() => setShowCraftMemoryModal(true)}
            onOpenLegalShield={() => setShowLegalShield(true)}
          />
        ) : selectedDedicatedCategory ? (
          <div className="fixed inset-0 z-50 bg-black overflow-y-auto w-full h-full">
            <DedicatedCategoryPage
              categoryKey={selectedDedicatedCategory}
              listings={listings}
              currentUser={pioneerUser}
              onBack={() => setSelectedDedicatedCategory(null)}
              onSelectCategory={(key) => setSelectedDedicatedCategory(key)}
              onTriggerHandshake={(item) => handleTriggerHandshake(item)}
              onOpenCreateListing={(catKey) => {
                if (catKey) setSelectedCategory(catKey);
                setShowCreateModal(true);
              }}
              onOpenWeather={() => {
                const btn = document.getElementById('btn-orbital-satellites-menu');
                if (btn) btn.click();
              }}
            />
          </div>
        ) : viewMode === 'BACHECA' ? (
          <div className="fixed inset-0 z-50 bg-black overflow-y-auto w-full h-full">
            <HomeFeedView
              listings={listings}
              currentUser={pioneerUser}
              onAddListing={handleAddListing}
              onSelectListingForTrade={(item) => handleTriggerHandshake(item)}
              onReportAbuse={() => {
                toast.success("Segnalazione inviata al Comitato di Moderazione Etico.");
              }}
              initialFilter={activeFilter}
              onSectionSelect={(sec) => setActiveFilter(sec)}
              onOpenCarpoolModal={() => setShowCarpoolModal(true)}
              onBackToMap={() => setViewMode('GLOBO')}
              selectedCountry={selectedCountry}
              onSelectCountry={handleSelectCountry}
              onOpenCountrySelector={() => setShowCountrySelector(true)}
              globalSearchQuery={searchQuery}
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <MapView3DContainer
              listings={listings}
              currentProfile={user}
              filter={activeFilter}
              searchQuery={searchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onResetFilter={() => {
                setActiveFilter(null);
                setSearchQuery('');
              }}
              resetWorldTrigger={resetWorldCount}
              onResetToWorld={handleResetToWorld}
              focusItalyTrigger={focusItalyCount}
              selectedCountryId={selectedCountry?.id || null}
              countrySelectTrigger={countrySelectCount}
              onSelectCountry={setSelectedCountry}
              openPiHubTrigger={openPiHubCount}
              openAdModalTrigger={openAdModalCount}
              openVoiceChatTrigger={openVoiceChatCount}
              isDiscreetMode={isDiscreetMode}
              onToggleDiscreetMode={handleToggleDiscreetMode}
              proximityPreference={proximityPreference}
              onProximityPreferenceChange={setProximityPreference}
              onTriggerHandshake={handleTriggerHandshake}
              onSelectListing={(item) => {
                // Selezione listing
              }}
              onOpenAdHub={handleOpenAdHub}
              onOpenTutor={() => setShowTutorModal(true)}
              activeSatelliteChannel={activeSatelliteChannel}
              onActiveSatelliteChannelChange={setActiveSatelliteChannel}
            />
          </div>
        )}
      </main>

      {/* 💡 TUTOR AUTOMATICO: Attivo nelle viste testuali e bacheca, nascosto sul Globo 3D per visuale 100% pulita */}
      {viewMode !== 'GLOBO' && (
        <AutoTutorPill
          currentView={viewMode}
          isClassicMode={isClassicMode}
          isDiscreetMode={isDiscreetMode}
          activeFilter={activeFilter}
          selectedCountry={selectedCountry}
          hasActiveModal={hasActiveModal}
          isEnabled={isAutoTutorActive}
          onToggleEnabled={() => setIsAutoTutorActive((prev) => !prev)}
          onOpenInterruttori={() => setShowInterruttoriModal(true)}
          onOpenTutor={() => setShowTutorModal(true)}
        />
      )}

      {/* =================================================================
          3. LOGICA "STRETTA DI MANO" (Transaction Flow Modal)
          Accordo sicuro e anonimo tra chi offre e chi cerca con messaggio
          di conferma a schermo.
          ================================================================= */}
      {selectedHandshakeListing && (
        <div
          id="handshake-flow-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setSelectedHandshakeListing(null)}
              className="absolute -top-3 -right-3 z-20 p-2 rounded-full bg-[#070b19] hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl cursor-pointer"
              title="Chiudi accordo"
            >
              ✕
            </button>
            <StrettaDiMano
              listing={selectedHandshakeListing}
              currentProfile={pioneerUser}
              onVerificationSuccess={() => {
                // Aggiornamento locale dello stato dell'annuncio
                setListings((prev) =>
                  prev.map((l) =>
                    l.id === selectedHandshakeListing.id ? { ...l, handshake_confirmed: true, status: 'completed' } : l
                  )
                );
              }}
              onClose={() => setSelectedHandshakeListing(null)}
            />
          </div>
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAddListing={handleAddListing}
        currentUser={pioneerUser}
        defaultIntent={activeFilter === 'VENDO' ? 'VENDO' : activeFilter === 'CERCO' ? 'ACQUISTO_CERCO' : 'BARATTO_SCAMBIO'}
        defaultCategory={activeFilter === 'LIBRI' ? 'libri_scuola_cultura' : 'casa_fai_da_te'}
      />

      {/* ASSISTENTE AI DISCRETO */}
      {showAIAssistant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#070b19] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Assistente AI Discreto</h3>
                  <p className="text-xs text-slate-400">Simply Discreet • Zero tracciamento • Risponde a comando</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-3">
              <DiscreetAIAssistant
                listings={listings}
                guides={guides}
                onNavigate={(target) => {
                  if (target === 'BACHECA') setViewMode('BACHECA');
                  else if (target === 'SALVAVATUTTO') setShowGuides(true);
                  else if (target === 'PI_HUB') setOpenPiHubCount((c) => c + 1);
                  setShowAIAssistant(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PUNTI D'INCONTRO CERTIFICATI */}
      {showMeetingPoints && (
        <CertifiedMeetingPointsModal
          city={selectedHandshakeListing?.city || user?.city || selectedCountry?.name || "Territorio"}
          country={selectedHandshakeListing?.country || selectedCountry?.name || ''}
          lat={selectedHandshakeListing?.lat ?? selectedCountry?.lat}
          lng={selectedHandshakeListing?.lng ?? selectedCountry?.lng}
          onSelectMeetingPoint={(point) => {
            toast.success(`Punto Certificato selezionato: ${point.name} (${point.address})`);
            setShowMeetingPoints(false);
          }}
          onClose={() => setShowMeetingPoints(false)}
        />
      )}

      {/* SALVAVATUTTO — GUIDE PRATICHE */}
      {showGuides && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#070b19] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Guide Pratiche & Riparazioni</h3>
                  <p className="text-xs text-slate-400">Manuali fai-da-te, consigli di riuso e autoproduzione per la comunità</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuides(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-3">
              <ConoscenzeMestieriArchive
                guides={guides}
                onAddGuide={(newGuide) => {
                  setGuides((prev) => [newGuide, ...prev]);
                  toast.success("Conoscenza aggiunta in Conoscenze & Mestieri!");
                }}
                onSelectListingForTrade={(item) => handleTriggerHandshake(item)}
              />
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE DRIVE EXPORT */}
      {showDriveExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#070b19] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Google Drive Export</h3>
                  <p className="text-xs text-slate-400">Archiviazione documentale crittografata</p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveExport(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-3">
              <DriveExporter
                documentTitle="HAVE2WANT_SPECIFICHE_TECNICHE"
                markdownContent={MASTER_SPEC_DOCUMENT}
              />
            </div>
          </div>
        </div>
      )}

      {/* AD REWARD HUB MODAL */}
      {showAdHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAdHub(false)}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-[#070b19] hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl cursor-pointer"
            >
              ✕
            </button>
            <AdRewardHub />
          </div>
        </div>
      )}

      {/* LEGAL SHIELD */}
      {showLegalShield && (
        <LegalWelcomeShield onAcceptTerms={() => setShowLegalShield(false)} />
      )}

      {/* AUTHORSHIP & COPYRIGHT CERTIFICATE MODAL */}
      <AuthorshipCertificateModal
        isOpen={showAuthorshipModal}
        onClose={() => setShowAuthorshipModal(false)}
      />

      {/* PI NETWORK VERIFICATION & DIAGNOSTICS MODAL */}
      <PiVerificationModal
        isOpen={showPiVerification}
        onClose={() => setShowPiVerification(false)}
      />

      {/* MODALI EMERGENZE, TRASFERTE E MEMORIA STORICA (Trigger da Vista Classica) */}
      <WorldEmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        defaultCountryCode={selectedCountry?.code || selectedCountry?.id || 'GLOBAL'}
      />

      <GlobalCarpoolModal
        isOpen={showCarpoolModal}
        onClose={() => setShowCarpoolModal(false)}
        onPublishTripToListing={handlePublishTripToListing}
      />

      <CraftMemoryModal
        isOpen={showCraftMemoryModal}
        onClose={() => setShowCraftMemoryModal(false)}
      />

      {/* SELETTORE TERRITORIALE DINAMICO GLOBALE */}
      <CountrySelectorModal
        isOpen={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        selectedCountry={selectedCountry}
        onSelectCountry={handleSelectCountry}
        listingsCountsByCountry={listingsCountsByCountry}
      />

      {/* 🎓 TUTOR UFFICIALE APP (GUIDA PASSO-PASSO) */}
      <AppTutorModal
        isOpen={showTutorModal}
        onClose={() => setShowTutorModal(false)}
        onActionTrigger={(action) => {
          if (action === 'open_create') {
            setShowTutorModal(false);
            setShowCreateModal(true);
          } else if (action === 'open_voice') {
            setShowTutorModal(false);
            handleOpenVoiceChat();
          } else if (action === 'open_carpool') {
            setShowTutorModal(false);
            setShowCarpoolModal(true);
          } else if (action === 'open_meeting') {
            setShowTutorModal(false);
            setShowMeetingPoints(true);
          } else if (action === 'open_legal') {
            setShowTutorModal(false);
            setShowLegalShield(true);
          } else if (action === 'reset_world') {
            setShowTutorModal(false);
            handleResetToWorld();
          }
        }}
      />

      {/* 🎛️ PANNELLO INTERRUTTORI RAPIDI */}
      <InterruttoriRapidiModal
        isOpen={showInterruttoriModal}
        onClose={() => setShowInterruttoriModal(false)}
        isClassicMode={isClassicMode}
        onToggleClassicMode={() => {
          setIsClassicMode((prev) => !prev);
          toast.info(!isClassicMode ? "👓 Modalità Classica Attiva" : "🌐 Modalità 3D Attiva");
        }}
        isDiscreetMode={isDiscreetMode}
        onToggleDiscreetMode={handleToggleDiscreetMode}
        isAutoTutorActive={isAutoTutorActive}
        onToggleAutoTutor={() => {
          setIsAutoTutorActive((prev) => !prev);
          toast.info(!isAutoTutorActive ? "💡 Aiuto Automatico Contestuale Attivato" : "Aiuto Automatico Disattivato");
        }}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenVoiceChat={handleOpenVoiceChat}
        onOpenCarpool={() => setShowCarpoolModal(true)}
        onOpenShops={handleOpenAdModal}
        onOpenTutor={() => setShowTutorModal(true)}
        onOpenLegalShield={() => setShowLegalShield(true)}
        onOpenSafePoints={() => setShowMeetingPoints(true)}
        onResetWorld={handleResetToWorld}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="w-full h-[100dvh] overflow-hidden bg-black text-white relative selection:bg-[#00ff66]/30 selection:text-[#00ff66] font-sans antialiased">
        <Have2WantPlusMain />
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          theme="dark" 
          duration={5000}
          toastOptions={{
            className: '!text-sm sm:!text-[15px] !font-bold !py-3.5 !px-4 !bg-[#070b14] !border-2 !border-[#00ff66]/70 !shadow-[0_10px_30px_rgba(0,0,0,0.9)] !text-white',
            descriptionClassName: '!text-xs !text-zinc-300',
          }}
        />
      </div>
    </AuthProvider>
  );
}
