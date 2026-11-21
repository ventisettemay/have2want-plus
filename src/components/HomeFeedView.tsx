import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  MapPin,
  Sparkles,
  Coins,
  HeartHandshake,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  X,
  Mic,
  MicOff,
  GraduationCap,
  Wrench,
  Car,
  Home,
  Laptop,
  Shirt,
  MessageSquare,
  Globe,
  ChevronDown,
  FlaskConical,
  CheckCircle2,
  Filter,
  ArrowRightLeft
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  getCachedPiMarketData,
  PI_COMMUNITY_BASELINE_EUR,
  PI_COMMUNITY_BASELINE_USD,
  PI_REAL_PRICE_EUR
} from "@/lib/piRealPriceService";
import { GLOBAL_PHYSICAL_PRODUCTS } from "@/lib/globalProductsCatalog";
import {
  HaveWantListing,
  InteractionIntent,
  RealCategoryKey,
  RealSubcategoryKey,
  PioneerUser,
  AbuseReportPayload
} from "../types";
import { REAL_CATEGORIES_MATRIX } from "../categories";
import { spendPoints, awardPoints } from "@/lib/communityRewardsService";
import { Country, COUNTRIES, getCountryForListing } from "@/data/countries";
import { ListingOriginBadge } from "@/components/have2want/ListingOriginBadge";
import { getListingOriginBadge } from "@/lib/listingOrigin";
import { PioneerRewardsHubModal } from "@/components/have2want/PioneerRewardsHubModal";
import { TerritorialAdBanner } from "@/components/have2want/TerritorialAdBanner";
import { ListingDetailModal } from "@/components/have2want/ListingDetailModal";
import MarketplaceOrderModal from "@/components/have2want/MarketplaceOrderModal";
import MarketplaceOrdersModal from "@/components/have2want/MarketplaceOrdersModal";
import { DedicatedCategoryPage } from "@/components/DedicatedCategoryPage";
import { GlobalMarketplaceView } from "@/components/have2want/GlobalMarketplaceView";

export type SectionKey = 'VENDO' | 'SCAMBIO' | 'CERCO' | 'TRASFERTE' | 'SERVIZI' | 'LIBRI' | 'ESTERNI' | 'ALL';

interface HomeFeedViewProps {
  listings: HaveWantListing[];
  currentUser: PioneerUser;
  onAddListing: (listing: HaveWantListing) => void;
  onSelectListingForTrade: (listing: HaveWantListing) => void;
  onReportAbuse?: (payload: AbuseReportPayload) => void;
  initialFilter?: string | null;
  onSectionSelect?: (section: string | null) => void;
  onOpenCarpoolModal?: () => void;
  onBackToMap?: () => void;
  selectedCountry?: Country | null;
  onSelectCountry?: (country: Country | null) => void;
  onOpenCountrySelector?: () => void;
  globalSearchQuery?: string;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  listings,
  currentUser,
  onAddListing,
  onSelectListingForTrade,
  initialFilter,
  onSectionSelect,
  onOpenCarpoolModal,
  onBackToMap,
  selectedCountry,
  onSelectCountry,
  onOpenCountrySelector,
  globalSearchQuery = ""
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery);

  // La ricerca globale dell'header si propaga alla bacheca
  React.useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const voiceRecRef = React.useRef<any>(null);
  const [dictatingField, setDictatingField] = useState<"title" | "description" | "exchange" | null>(null);

  // Auto-scroll morbido per le categorie della bacheca (rotazione continua)
  const sectionsBarRef = React.useRef<HTMLDivElement>(null);
  const [isSectionsHovered, setIsSectionsHovered] = useState(false);
  const sectionsDirectionRef = React.useRef(1);
  const sectionsPauseRef = React.useRef<any>(null);
  const sectionsIsPausedRef = React.useRef(false);

  React.useEffect(() => {
    if (isSectionsHovered) return;

    let animId: number;
    const runScroll = () => {
      const el = sectionsBarRef.current;
      if (el && !sectionsIsPausedRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 10) {
          if (sectionsDirectionRef.current === 1) {
            el.scrollLeft += 0.45;
            if (el.scrollLeft >= maxScroll - 2) {
              sectionsIsPausedRef.current = true;
              sectionsPauseRef.current = setTimeout(() => {
                sectionsDirectionRef.current = -1;
                sectionsIsPausedRef.current = false;
              }, 2500);
            }
          } else {
            el.scrollLeft -= 0.55;
            if (el.scrollLeft <= 2) {
              sectionsIsPausedRef.current = true;
              sectionsPauseRef.current = setTimeout(() => {
                sectionsDirectionRef.current = 1;
                sectionsIsPausedRef.current = false;
              }, 2500);
            }
          }
        }
      }
      animId = requestAnimationFrame(runScroll);
    };

    animId = requestAnimationFrame(runScroll);
    return () => {
      cancelAnimationFrame(animId);
      if (sectionsPauseRef.current) clearTimeout(sectionsPauseRef.current);
    };
  }, [isSectionsHovered]);

  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Riconoscimento vocale non supportato da questo browser.");
      return;
    }

    if (isVoiceListening) {
      if (voiceRecRef.current) {
        try {
          voiceRecRef.current.stop();
        } catch (e) {}
      }
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = (typeof navigator !== "undefined" && navigator.language) || "it-IT";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsVoiceListening(false);
        toast.success(`Ricerca vocale: "${transcript}"`);
      };
      recognition.onerror = () => setIsVoiceListening(false);
      recognition.onend = () => setIsVoiceListening(false);

      voiceRecRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsVoiceListening(false);
    }
  };

  const startVoiceDictation = (field: "title" | "description" | "exchange") => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Riconoscimento vocale non supportato.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "it-IT";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setDictatingField(field);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (field === "title") setNewTitle(text);
        else if (field === "description") setNewDescription(text);
        else if (field === "exchange") setNewDesiredExchange(text);
        setDictatingField(null);
        toast.success("Dettatura acquisita!");
      };
      recognition.onerror = () => setDictatingField(null);
      recognition.onend = () => setDictatingField(null);

      recognition.start();
    } catch (err) {
      setDictatingField(null);
    }
  };

  // Sections & Categories
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(() => {
    if (!initialFilter) return null;
    const f = initialFilter.toUpperCase();
    if (f === 'VENDO') return 'VENDO';
    if (f === 'SCAMBIO' || f === 'BARATTO') return 'SCAMBIO';
    if (f === 'CERCO') return 'CERCO';
    if (f === 'TRASFERTE') return 'TRASFERTE';
    if (f === 'SERVIZI') return 'SERVIZI';
    if (f === 'LIBRI') return 'LIBRI';
    return null;
  });

  const handleSelectSection = (sec: SectionKey | null) => {
    setSelectedSection(sec);
    if (onSectionSelect) onSectionSelect(sec);
  };

  const [activeCategory, setActiveCategory] = useState<RealCategoryKey | "ALL">("ALL");
  const [dedicatedCategory, setDedicatedCategory] = useState<string | null>(null);
  const [activeProvince, setActiveProvince] = useState<string>("ALL");
  const [activeOriginFilter, setActiveOriginFilter] = useState<"ALL" | "REAL_ONLY" | "EXTERNAL_ONLY" | "DEMO_ONLY">("ALL");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach((item: any) => {
      const k = item.category || item.category_key;
      if (k) counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [listings]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRewardsHub, setShowRewardsHub] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [orderModalListing, setOrderModalListing] = useState<HaveWantListing | null>(null);
  const [orderModalMode, setOrderModalMode] = useState<'self' | 'gift'>('self');
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<HaveWantListing | null>(null);
  const [quickContactListing, setQuickContactListing] = useState<HaveWantListing | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [messageSentToast, setMessageSentToast] = useState(false);

  // New Listing Form State
  const [newTitle, setNewTitle] = useState("");
  const [newIntent, setNewIntent] = useState<InteractionIntent>("BARATTO_SCAMBIO");
  const [newCategory, setNewCategory] = useState<RealCategoryKey>("casa_fai_da_te");
  const [newSubcategory, setNewSubcategory] = useState<RealSubcategoryKey>("arredamento_mobili");
  const [newDescription, setNewDescription] = useState("");
  const [newPiPrice, setNewPiPrice] = useState<number>(148.37);
  const [localFiatPrice, setLocalFiatPrice] = useState<number>(10);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("EUR");

  const marketData = getCachedPiMarketData();
  const currentRate = selectedCurrency === "USD" ? marketData.marketPrice.priceUsd : marketData.marketPrice.priceEur;

  const handleFiatChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) {
      setLocalFiatPrice(0);
      setNewPiPrice(0);
      return;
    }
    setLocalFiatPrice(val);
    const convertedPi = Number((val / (currentRate || 1)).toFixed(2));
    setNewPiPrice(convertedPi);
  };

  const handlePiChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) {
      setNewPiPrice(0);
      setLocalFiatPrice(0);
      return;
    }
    setNewPiPrice(val);
    const convertedFiat = Number((val * (currentRate || 1)).toFixed(2));
    setLocalFiatPrice(convertedFiat);
  };

  const [newDesiredExchange, setNewDesiredExchange] = useState("");
  const [newCity, setNewCity] = useState(currentUser.city || "");
  const [newProvince, setNewProvince] = useState(currentUser.province || "");
  const [newImageUrl, setNewImageUrl] = useState("");

  const getCategoryIcon = (catKey: RealCategoryKey) => {
    switch (catKey) {
      case "auto_moto_veicoli":
        return Car;
      case "casa_fai_da_te":
        return Home;
      case "elettronica_informatica":
        return Laptop;
      case "libri_scuola_cultura":
        return GraduationCap;
      case "servizi_lavoro_buoni":
        return Wrench;
      case "abbigliamento_accessori":
        return Shirt;
      case "rete_specialisti_supporto":
        return Sparkles;
      default:
        return ShoppingBag;
    }
  };

  // Section Counts
  const sectionCounts = useMemo(() => {
    const isVendo = (l: any) => l.intent === 'VENDO' || l.action_type === 'vendo';
    const isScambio = (l: any) => l.intent === 'BARATTO_SCAMBIO' || l.action_type === 'baratto' || l.action_type === 'baratto_scambio';
    const isCerco = (l: any) => l.intent === 'ACQUISTO_CERCO' || l.intent === 'CERCO' || l.action_type === 'acquisto_cerco';
    const isTrasferte = (l: any) =>
      (l.category === 'auto_moto_veicoli' && (l.subcategory === 'trasferte_passaggi_carpool' || l.tags?.includes('trasferte') || l.tags?.includes('carpool'))) ||
      (l.title && /trasfert|carpool|passagg/i.test(l.title));
    const isServizi = (l: any) =>
      l.category === 'servizi_lavoro_buoni' || l.category === 'rete_specialisti_supporto' || l.intent === 'OFFRO_SERVIZIO' ||
      (l.title && /serviz|lezion|riparaz|manodop/i.test(l.title));
    const isLibri = (l: any) =>
      l.category === 'libri_scuola_cultura' || (l.title && /libr|scuol|testi|manual/i.test(l.title));
    const isEsterni = (l: any) =>
      Boolean(l.isExternal || l.externalPortal || l.source_type === 'external');

    return {
      VENDO: listings.filter(isVendo).length,
      SCAMBIO: listings.filter(isScambio).length,
      CERCO: listings.filter(isCerco).length,
      TRASFERTE: listings.filter(isTrasferte).length,
      SERVIZI: listings.filter(isServizi).length,
      LIBRI: listings.filter(isLibri).length,
      ESTERNI: listings.filter(isEsterni).length,
      ALL: listings.length,
    };
  }, [listings]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter((listing: any) => {
      // 1. Section filter
      if (selectedSection === 'VENDO') {
        if (listing.intent !== 'VENDO' && listing.action_type !== 'vendo') return false;
      } else if (selectedSection === 'SCAMBIO') {
        if (listing.intent !== 'BARATTO_SCAMBIO' && listing.action_type !== 'baratto' && listing.action_type !== 'baratto_scambio') return false;
      } else if (selectedSection === 'CERCO') {
        if (listing.intent !== 'ACQUISTO_CERCO' && listing.intent !== 'CERCO' && listing.action_type !== 'acquisto_cerco') return false;
      } else if (selectedSection === 'TRASFERTE') {
        const isCarpool = (listing.category === 'auto_moto_veicoli' && (listing.subcategory === 'trasferte_passaggi_carpool' || listing.tags?.includes('trasferte') || listing.tags?.includes('carpool'))) ||
          (listing.title && /trasfert|carpool|passagg/i.test(listing.title));
        if (!isCarpool) return false;
      } else if (selectedSection === 'SERVIZI') {
        const isServizio = listing.category === 'servizi_lavoro_buoni' || listing.category === 'rete_specialisti_supporto' || listing.intent === 'OFFRO_SERVIZIO' ||
          (listing.title && /serviz|lezion|riparaz|manodop/i.test(listing.title));
        if (!isServizio) return false;
      } else if (selectedSection === 'LIBRI') {
        const isLibro = listing.category === 'libri_scuola_cultura' || (listing.title && /libr|scuol|testi|manual/i.test(listing.title));
        if (!isLibro) return false;
      } else if (selectedSection === 'ESTERNI') {
        const isExt = Boolean(listing.isExternal || listing.externalPortal || listing.source_type === 'external');
        if (!isExt) return false;
      }

      // 2. Category filter
      if (activeCategory !== "ALL" && listing.category !== activeCategory) {
        return false;
      }

      // 3. Province filter
      if (activeProvince !== "ALL" && listing.author?.province) {
        if (listing.author.province.toUpperCase() !== activeProvince.toUpperCase()) return false;
      }

      // 3.5. Country filter (selezionabile liberamente, non bloccato su Italia)
      if (selectedCountry && selectedCountry.id) {
        const itemCountry = getCountryForListing(listing, COUNTRIES);
        if (itemCountry && itemCountry.id && itemCountry.id.toLowerCase() !== selectedCountry.id.toLowerCase()) {
          return false;
        }
      }

      // 3.6. Filtro Origine/Provenienza (Tutti / Solo Reali / Solo Esterni / Solo Di Prova)
      if (activeOriginFilter !== "ALL") {
        const origin = getListingOriginBadge(listing);
        if (activeOriginFilter === "REAL_ONLY" && (origin.isExternal || origin.isDemo)) return false;
        if (activeOriginFilter === "EXTERNAL_ONLY" && !origin.isExternal) return false;
        if (activeOriginFilter === "DEMO_ONLY" && !origin.isDemo) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (listing.title || "").toLowerCase().includes(query);
        const matchesDesc = (listing.description || "").toLowerCase().includes(query);
        const matchesAuthor = (listing.author?.name || "").toLowerCase().includes(query);
        const matchesTags = (listing.tags || []).some((t: string) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesTags) return false;
      }

      return true;
    });
  }, [listings, selectedSection, activeCategory, activeProvince, searchQuery, selectedCountry]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const defaultImages: Record<string, string> = {
      casa_fai_da_te: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80",
      auto_moto_veicoli: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
      elettronica_informatica: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
      libri_scuola_cultura: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      servizi_lavoro_buoni: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
      abbigliamento_accessori: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80",
      rete_specialisti_supporto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    };

    const created: HaveWantListing = {
      id: `listing-${Date.now()}`,
      intent: newIntent,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      subcategory: newSubcategory,
      piPrice: (newIntent === "VENDO" || newIntent === "ACQUISTO_CERCO") ? Number(newPiPrice) : 0,
      price: (newIntent === "VENDO" || newIntent === "ACQUISTO_CERCO") ? Number(localFiatPrice) : 0,
      currency: selectedCurrency,
      concreteExchange: newIntent !== "VENDO" && newDesiredExchange.trim() ? {
        offer: {
          item: newTitle.trim(),
          quantity: 1,
          unit: "pezzi",
          condition: "usato_ottimo",
        },
        wanted: {
          item: newDesiredExchange.trim(),
          quantity: 1,
          unit: "pezzi",
        },
        territorialScope: "citta_area",
      } : undefined,
      author: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        reputation: currentUser.reputationStars || 4.95,
        isPioneerVerified: true,
        city: newCity || "Territorio Locale",
        province: newProvince || "",
      },
      lat: (typeof currentUser.lat === "number" ? currentUser.lat : 41.8902) + (Math.random() - 0.5) * 0.04,
      lng: (typeof currentUser.lng === "number" ? currentUser.lng : 12.4922) + (Math.random() - 0.5) * 0.04,
      locationArea: newProvince ? `${newCity || "Territorio"} (${newProvince})` : (newCity || "Territorio"),
      isFuzzyLocation: true,
      imageUrl: newImageUrl.trim() || defaultImages[newCategory] || defaultImages.casa_fai_da_te,
      createdAt: "Pochi istanti fa",
      tags: [newCategory, newIntent, newCity],
      status: "active",
    };

    // Costo in punti: 2 punti per la pubblicazione manuale, 4 se è stata usata la dettatura vocale
    const cost = 2;
    const spent = spendPoints(cost, `Pubblicazione annuncio: "${newTitle.trim()}"`);
    if (!spent.success) {
      toast.error(`Ti servono ${cost} punti per pubblicare.`, {
        description: `Saldo attuale: ${spent.newBalance} punti.`,
      });
      return;
    }

    onAddListing(created);
    awardPoints("REAL_LISTING_BASIC", `Pubblicazione annuncio: "${newTitle.trim()}"`);
    setShowCreateModal(false);
    setNewTitle("");
    setNewDescription("");
    setNewDesiredExchange("");
    setNewPiPrice(0);
    setNewImageUrl("");
    toast.success("Annuncio pubblicato!");
  };

  const handleSendQuickMessage = () => {
    if (!quickContactListing || !contactMessage.trim()) return;
    setMessageSentToast(true);
    setTimeout(() => {
      setMessageSentToast(false);
      setQuickContactListing(null);
      setContactMessage("");
    }, 1500);
  };

  const SECTIONS_CATALOG = [
    {
      key: 'VENDO' as SectionKey,
      title: 'VENDO con Pi',
      subtitle: 'Beni, tecnologia, oggetti per la casa con pagamenti diretti.',
      count: sectionCounts.VENDO,
      icon: Coins,
    },
    {
      key: 'SCAMBIO' as SectionKey,
      title: 'SCAMBIO',
      subtitle: 'Scambio diretto senza denaro: proponi quello che hai in cambio.',
      count: sectionCounts.SCAMBIO,
      icon: HeartHandshake,
    },
    {
      key: 'CERCO' as SectionKey,
      title: 'CERCO',
      subtitle: 'Richieste e bisogni specifici inseriti dalla comunità.',
      count: sectionCounts.CERCO,
      icon: Sparkles,
    },
    {
      key: 'TRASFERTE' as SectionKey,
      title: 'TRASFERTE & CARPOOL',
      subtitle: 'Passaggi condivisi da città a città a zero commissioni.',
      count: sectionCounts.TRASFERTE,
      icon: Car,
    },
    {
      key: 'SERVIZI' as SectionKey,
      title: 'SERVIZI & COMPETENZE',
      subtitle: 'Manodopera, lezioni, riparazioni pratiche e supporto.',
      count: sectionCounts.SERVIZI,
      icon: Wrench,
    },
    {
      key: 'LIBRI' as SectionKey,
      title: 'LIBRI & SCUOLA',
      subtitle: 'Scambio e donazione testi scolastici, saggi e manuali.',
      count: sectionCounts.LIBRI,
      icon: GraduationCap,
    },
    {
      key: 'ESTERNI' as SectionKey,
      title: '📦 PRODOTTI FISICI MONDO & WALLET',
      subtitle: 'Catalogo prodotti reali con spedizione a casa & commissioni crypto USDT su wallet privato.',
      count: GLOBAL_PHYSICAL_PRODUCTS.length,
      icon: Globe,
    },
    {
      key: 'ALL' as SectionKey,
      title: 'TUTTI GLI ANNUNCI',
      subtitle: 'Tutte le categorie e proposte attive nel mercatino.',
      count: sectionCounts.ALL,
      icon: ShoppingBag,
    },
  ];

  if (selectedSection === 'ESTERNI') {
    return (
      <GlobalMarketplaceView
        onBack={() => handleSelectSection(null)}
        onAddWantListing={(item) => {
          onAddListing(item);
          handleSelectSection(null);
        }}
        currentUser={currentUser}
      />
    );
  }

  if (dedicatedCategory) {
    return (
      <DedicatedCategoryPage
        categoryKey={dedicatedCategory}
        listings={listings}
        currentUser={currentUser}
        onBack={() => setDedicatedCategory(null)}
        onSelectCategory={(key) => setDedicatedCategory(key)}
        onTriggerHandshake={(item) => onSelectListingForTrade(item)}
        onOpenCreateListing={(catKey) => {
          if (catKey) setNewCategory(catKey as any);
          setShowCreateModal(true);
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col selection:bg-[#00ff66] selection:text-black">
      
      {/* 1. TOP BAR INTEGRATA (SOLO NERO, NEON, BIANCO - SENZA CORNICETTE) */}
      <header className="sticky top-0 z-30 w-full bg-black/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-zinc-900">
        
        {/* Sinistra: Ritorno Mappa & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          {onBackToMap && (
            <button
              onClick={onBackToMap}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#00ff66] text-xs font-black flex items-center gap-2 transition-all cursor-pointer"
              title="Torna alla Mappa 3D"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mappa 3D</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black tracking-tight text-white">
              HAVE2WANT <span className="text-[#00ff66]">ANNUNCI</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-emerald-950 text-[#00ff66] border border-emerald-500/50">
              LIVE PI-BUILD
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowRewardsHub(true)}
              className="md:hidden px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-xs flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              title="Hub Punti Comunitari e Prelievo Pi"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>π Hub</span>
            </button>
            <button
              onClick={() => setShowOrdersModal(true)}
              className="md:hidden px-2.5 py-1.5 rounded-xl bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 font-black text-xs flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              title="I Miei Ordini del Marketplace Interno"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ordini</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="md:hidden px-3 py-2 rounded-xl bg-[#00ff66] text-black font-black text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Pubblica</span>
            </button>
          </div>
        </div>

        {/* Centro: Barra Ricerca Grande, Visibile e Voce */}
        <div className="relative w-full md:max-w-xl flex items-center rounded-2xl border-2 border-zinc-700 focus-within:border-[#00ff66] bg-zinc-900 transition-all shadow-md">
          <Search className="w-4 h-4 text-[#00ff66] absolute left-3.5 pointer-events-none stroke-[2.5]" />
          <input
            type="text"
            placeholder="Cerca cosa ti serve (es. libro, bicicletta, riparazione...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-transparent text-white text-xs sm:text-sm font-medium placeholder-zinc-400 focus:outline-none transition-all"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isVoiceListening
                  ? "bg-[#00ff66] text-black animate-pulse"
                  : "text-zinc-400 hover:text-[#00ff66]"
              }`}
              title="Ricerca Vocale"
            >
              {isVoiceListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Destra: Desktop Pubblica Annuncio & Hub Pi Network */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={() => setShowOrdersModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="I Miei Ordini del Marketplace Interno"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ordini</span>
          </button>
          <button
            onClick={() => setShowRewardsHub(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-black text-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="Hub Punti Comunitari & Prelievo Pi su Wallet"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>π Punti & Prelievo (0.50 π)</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Pubblica Annuncio</span>
          </button>
        </div>
      </header>


      {/* 2. CORPO PRINCIPALE: O LE SEZIONI/CATEGORIE O GLI ANNUNCI FILTRATI */}
      <main className="flex-1 w-full px-4 sm:px-8 py-6 max-w-none">

        {/* CASO A: NESSUNA SEZIONE SELEZIONATA E NESSUNA RICERCA ATTIVA -> 3 SCHEDE CHIAVE CHIARE E INTUITIVE */}
        {selectedSection === null && !searchQuery.trim() ? (
          <div className="w-full space-y-8 animate-in fade-in duration-200 max-w-6xl mx-auto">
            
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                Cosa vuoi fare oggi?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Scegli tra le opzioni della comunità locale o apri il catalogo internazionale di prodotti fisici.
              </p>
            </div>

            {/* BANNER PRODOTTI DAL MONDO & BARATTO PI NETWORK */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950/70 border-2 border-emerald-500/50 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl relative overflow-hidden group">
              <div className="space-y-2 text-left relative z-10 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#00ff66]/15 border border-[#00ff66]/40 text-[#00ff66] text-[11px] font-mono font-black uppercase tracking-wider">
                    🌐 Prodotti Fisici dal Mondo
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                    Spedizioni a Casa • Rete Pi Network
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Catalogo Internazionale & Conversione in Baratto
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Scopri prodotti fisici autentici dai partner mondiali con consegna a domicilio. Vuoi scambiare senza spendere denaro? Clicca <strong className="text-[#00ff66]">"Cerco in Baratto"</strong> per trasformare qualsiasi prodotto in una richiesta nella bacheca Have2Want in Pi Coin!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectSection('ESTERNI')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-[#00ff66]/20 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span>Apri Prodotti dal Mondo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LE 3 GRANDI SCHEDE REGINE: VENDO • SCAMBIO • CERCO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* 1. VENDO */}
              <button
                onClick={() => handleSelectSection('VENDO')}
                className="p-6 sm:p-7 rounded-3xl bg-zinc-950 hover:bg-[#0c1f13] border-2 border-emerald-500/40 hover:border-[#00ff66] transition-all text-left flex flex-col justify-between gap-6 cursor-pointer group shadow-xl hover:shadow-[#00ff66]/10"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-[#00ff66] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Coins className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-black px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[#00ff66]">
                    {sectionCounts.VENDO} annunci
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#00ff66]" />
                    <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#00ff66] transition-colors">
                      VENDO
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Cosa offrono gli utenti: beni, oggetti, artigianato e prodotti locali disponibili subito.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-xs font-black text-[#00ff66] group-hover:underline">
                    Entra e vedi annunci
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#00ff66] group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>

              {/* 2. SCAMBIO */}
              <button
                onClick={() => handleSelectSection('SCAMBIO')}
                className="p-6 sm:p-7 rounded-3xl bg-zinc-950 hover:bg-[#1f190a] border-2 border-amber-500/40 hover:border-amber-400 transition-all text-left flex flex-col justify-between gap-6 cursor-pointer group shadow-xl hover:shadow-amber-400/10"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HeartHandshake className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-black px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400">
                    {sectionCounts.SCAMBIO} annunci
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                    <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-400 transition-colors">
                      SCAMBIO
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Scambi diretti senza denaro: proponi ciò che hai in cambio di ciò che ti serve.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-xs font-black text-amber-400 group-hover:underline">
                    Entra e vedi annunci
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>

              {/* 3. CERCO */}
              <button
                onClick={() => handleSelectSection('CERCO')}
                className="p-6 sm:p-7 rounded-3xl bg-zinc-950 hover:bg-[#0a1526] border-2 border-blue-500/40 hover:border-blue-400 transition-all text-left flex flex-col justify-between gap-6 cursor-pointer group shadow-xl hover:shadow-blue-400/10"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-black px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/50 text-blue-400">
                    {sectionCounts.CERCO} annunci
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-400" />
                    <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                      CERCO
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Richieste e bisogni specifici inseriti dalle persone della tua zona da soddisfare.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-xs font-black text-blue-400 group-hover:underline">
                    Entra e vedi annunci
                  </span>
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>
            </div>

            {/* SEZIONI SPECIALI RAPIDE (LIBRI, TRASFERTE, SERVIZI) */}
            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Sezioni Speciali della Comunità
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSelectSection('LIBRI')}
                  className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-sm font-bold text-white">📚 Libri & Testi Scolastici</h4>
                      <p className="text-[11px] text-zinc-400">Scambio e adozione testi usati</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">{sectionCounts.LIBRI}</span>
                </button>

                <button
                  onClick={() => handleSelectSection('TRASFERTE')}
                  className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-sm font-bold text-white">🚗 Passaggi Auto & Viaggi</h4>
                      <p className="text-[11px] text-zinc-400">Carpooling tra città e borghi</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">{sectionCounts.TRASFERTE}</span>
                </button>

                <button
                  onClick={() => handleSelectSection('SERVIZI')}
                  className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-sm font-bold text-white">🛠️ Servizi & Riparazioni</h4>
                      <p className="text-[11px] text-zinc-400">Manodopera, lezioni e assistenza</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">{sectionCounts.SERVIZI}</span>
                </button>
              </div>
            </div>

            {/* Catalogo Categorie Merceologiche Dirette con Fotografie Reali */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  Pagine Dedicate per Tipologia
                </h2>
                <span className="text-[11px] text-[#00ff66] font-mono font-bold">
                  8 Pagine Indipendenti
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {REAL_CATEGORIES_MATRIX.map((cat) => {
                  const count = categoryCounts[cat.key] || 0;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setDedicatedCategory(cat.key);
                      }}
                      className="relative h-28 rounded-2xl overflow-hidden border-2 border-zinc-800 hover:border-[#00ff66] transition-all text-left flex flex-col justify-end p-3 cursor-pointer group shadow-lg"
                    >
                      <img
                        src={cat.realImage}
                        alt={cat.label}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-75 contrast-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      <div className="relative z-10 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#00ff66] bg-black/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            PAGINA
                          </span>
                          {count > 0 && (
                            <span className="text-[10px] font-mono font-bold text-zinc-300">
                              {count}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-white group-hover:text-[#00ff66] transition-colors line-clamp-1 drop-shadow-sm">
                          {cat.label}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* CASO B: SEZIONE O RICERCA ATTIVA -> ELENCO ANNUNCI PULITO CON FILTRI */
          <div className="w-full space-y-6 animate-in fade-in duration-200">
            
            {/* Barra Superiore di Navigazione e Filtri */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e0e11]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleSelectSection(null);
                    setActiveCategory("ALL");
                    setSearchQuery("");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-black hover:bg-zinc-900 text-[#00ff66] text-xs font-black flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tutte le Categorie</span>
                </button>

                <div>
                  <span className="text-xs text-zinc-400 block font-medium">Visualizzando:</span>
                  <span className="text-sm sm:text-base font-black text-white">
                    {selectedSection === 'VENDO' && 'VENDO con Pi Coin'}
                    {selectedSection === 'SCAMBIO' && 'SCAMBIO & BARATTO'}
                    {selectedSection === 'CERCO' && 'CERCO'}
                    {selectedSection === 'TRASFERTE' && 'TRASFERTE & PASSAGGI'}
                    {selectedSection === 'SERVIZI' && 'SERVIZI & COMPETENZE'}
                    {selectedSection === 'LIBRI' && 'LIBRI & SCUOLA'}
                    {selectedSection === 'ALL' && 'TUTTI GLI ANNUNCI'}
                    {!selectedSection && searchQuery && `Ricerca: "${searchQuery}"`}
                  </span>
                </div>
              </div>

              {/* Filtri Nazione, Provincia e Reset */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                {onOpenCountrySelector && (
                  <button
                    onClick={onOpenCountrySelector}
                    className="px-3 py-2 rounded-xl bg-black hover:bg-zinc-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-0"
                    title="Cambia Paese / Nazione"
                  >
                    <span>{selectedCountry ? selectedCountry.flag : '🌍'}</span>
                    <span className="uppercase">{selectedCountry ? selectedCountry.name : 'Tutti i Paesi'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#00ff66]" />
                  </button>
                )}

                <select
                  value={activeProvince}
                  onChange={(e) => setActiveProvince(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black text-white text-xs font-bold focus:outline-none cursor-pointer border-0"
                >
                  <option value="ALL">Tutti i Territori / Province</option>
                  <option value="LOCAL">📍 Più Vicini a Te</option>
                  <option value="RM">Roma & Lazio</option>
                  <option value="MI">Milano & Lombardia</option>
                  <option value="TO">Torino & Piemonte</option>
                  <option value="NA">Napoli & Campania</option>
                  <option value="PARIS">Parigi / Île-de-France</option>
                  <option value="MADRID">Madrid & Centro</option>
                  <option value="BERLIN">Berlino & Brandeburgo</option>
                  <option value="LONDON">Londra & Greater London</option>
                  <option value="NEWYORK">New York & Tri-State</option>
                  <option value="TOKYO">Tokyo & Kanto</option>
                </select>

                <button
                  onClick={() => {
                    handleSelectSection(null);
                    setActiveCategory("ALL");
                    setActiveProvince("ALL");
                    setSearchQuery("");
                    if (onSelectCountry) onSelectCountry(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Azzera
                </button>
              </div>
            </div>

            {/* Quick Pills di Switch Sezione (Rotazione Morbida Automatica con Pausa al Tocco) */}
            <div
              ref={sectionsBarRef}
              onMouseEnter={() => setIsSectionsHovered(true)}
              onMouseLeave={() => setIsSectionsHovered(false)}
              onTouchStart={() => setIsSectionsHovered(true)}
              onTouchEnd={() => setTimeout(() => setIsSectionsHovered(false), 2000)}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x"
            >
              {SECTIONS_CATALOG.map((sec) => (
                <button
                  key={sec.key}
                  onClick={() => handleSelectSection(sec.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedSection === sec.key
                      ? "bg-[#00ff66] text-black font-black shadow-[0_0_12px_rgba(0,255,102,0.3)]"
                      : "bg-[#0e0e11] text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-900"
                  }`}
                >
                  {sec.title} ({sec.count})
                </button>
              ))}
            </div>

            {/* SELETTORE RAPIDO: FONTE & NATURA ANNUNCIO (TUTTI / REALI P2P / ESTERNI / DI PROVA) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0a0a0d] border border-zinc-900 text-xs">
              <div className="flex items-center gap-2 text-zinc-400 font-bold shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>Filtra per Fonte:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveOriginFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    activeOriginFilter === "ALL"
                      ? "bg-white text-black font-black"
                      : "bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  Tutte le fonti
                </button>
                <button
                  onClick={() => setActiveOriginFilter("REAL_ONLY")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                    activeOriginFilter === "REAL_ONLY"
                      ? "bg-emerald-500 text-black font-black"
                      : "bg-zinc-900 text-emerald-400 hover:bg-zinc-800"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Solo Reali P2P</span>
                </button>
                <button
                  onClick={() => setActiveOriginFilter("EXTERNAL_ONLY")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                    activeOriginFilter === "EXTERNAL_ONLY"
                      ? "bg-amber-400 text-black font-black"
                      : "bg-zinc-900 text-amber-300 hover:bg-zinc-800"
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Solo Esterni</span>
                </button>
                <button
                  onClick={() => setActiveOriginFilter("DEMO_ONLY")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                    activeOriginFilter === "DEMO_ONLY"
                      ? "bg-sky-400 text-black font-black"
                      : "bg-zinc-900 text-sky-300 hover:bg-zinc-800"
                  }`}
                >
                  <FlaskConical className="w-3 h-3" />
                  <span>Solo Di Prova</span>
                </button>
              </div>
            </div>

            {/* BANNER PUBBLICITARIO TERRITORIALE & REWARD PI */}
            <TerritorialAdBanner
              onOpenRewardsHub={() => setShowRewardsHub(true)}
              variant="feed_inline"
            />

            {/* Griglia Annunci (Nero, Neon, Bianco - NO cornicette) */}
            {filteredListings.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#0e0e11] text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Nessun annuncio presente per questi parametri</h3>
                <p className="text-xs text-zinc-400">
                  Vuoi essere il primo a pubblicare in questa categoria?
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#00ff66] text-black font-black text-xs"
                >
                  Pubblica Annuncio Ora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredListings.map((item) => {
                  const isVendo = item.intent === "VENDO";
                  const isBaratto = item.intent === "BARATTO_SCAMBIO";
                  const isInternal = item.originType === 'REAL_P2P' || (!item.isExternal && item.originType !== 'EXTERNAL');

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedListingForDetail(item)}
                      className={`group relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                        isInternal
                          ? "border-2 border-[#00ff66] shadow-[0_0_18px_rgba(0,255,102,0.42)] ring-1 ring-[#00ff66]/40 hover:shadow-[0_0_28px_rgba(0,255,102,0.7)]"
                          : "border border-zinc-800 hover:border-zinc-500 shadow-lg"
                      }`}
                    >
                      {/* Foto Reale a Schermo Intero */}
                      <img
                        src={item.imageUrl || "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />

                      {/* Gradiente Scuro Cinematografico per Massima Leggibilità */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/60 pointer-events-none" />

                      {/* Top Bar: Intento/Prezzo + Segnalatore LED Interno H2W + Territorio */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#00ff66] text-black shadow-lg tracking-wider">
                            {isVendo 
                              ? (item.piPrice && item.piPrice > 0 
                                  ? `${item.piPrice} π (≈ ${item.price !== undefined && item.price > 0 ? `${item.price}€` : (item.piPrice * PI_REAL_PRICE_EUR).toFixed(item.piPrice >= 15 ? 0 : 2) + '€'})` 
                                  : `VENDO`) 
                              : isBaratto 
                              ? "SCAMBIO" 
                              : (item.piPrice && item.piPrice > 0 
                                  ? `CERCO • ${item.piPrice} π (≈ ${item.price !== undefined && item.price > 0 ? `${item.price}€` : (item.piPrice * PI_REAL_PRICE_EUR).toFixed(item.piPrice >= 15 ? 0 : 2) + '€'})` 
                                  : "CERCO")}
                          </span>
                          {isInternal ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/85 text-[#00ff66] border border-[#00ff66]/70 shadow-[0_0_10px_rgba(0,255,102,0.5)] flex items-center gap-1 backdrop-blur-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
                              H2W Diretto
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-900/90 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                              {item.sourceMarketplace || 'Portale Esterno'}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/80 text-white backdrop-blur-md border border-white/10 shadow-md flex items-center gap-1 shrink-0">
                          <MapPin className="w-3 h-3 text-[#00ff66]" />
                          <span className="truncate max-w-[110px]">{item.author?.city || item.city || "Mondo"}</span>
                        </span>
                      </div>

                      {/* Bottom Overlay: SOLO Titolo Pulito + Categoria + 'Tocca per specifiche' (Zero muri di testo) */}
                      <div className="absolute bottom-0 inset-x-0 p-4 pointer-events-none flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-1">
                          {item.category && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/15 text-zinc-200 backdrop-blur-sm">
                              {item.category.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md group-hover:text-[#00ff66] transition-colors line-clamp-1">
                          {item.title}
                        </h3>

                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-300">
                          <span className="flex items-center gap-1 font-semibold text-[#00ff66] group-hover:underline">
                            <Sparkles className="w-3 h-3 text-[#00ff66]" />
                            Tocca per specifiche complete
                          </span>
                          <span className="text-zinc-400 font-mono text-[10px]">
                            {item.images && item.images.length > 1 ? `📷 ${item.images.length} foto` : '📷 Foto'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </main>

      {/* 3. MODAL: CREA NUOVO ANNUNCIO (NERO, NEON, BIANCO - SENZA CORNICETTE) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0e0e11] rounded-2xl p-6 space-y-5 text-white my-8 relative shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                <div>
                  <h3 className="text-base font-black text-white">Pubblica Nuovo Annuncio</h3>
                  <p className="text-xs text-zinc-400">Zero commissioni bancarie • P2P Diretto</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg bg-black text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                
                {/* 3 Intenti Principali */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewIntent("VENDO")}
                    className={`py-2.5 px-2 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                      newIntent === "VENDO"
                        ? "bg-[#00ff66] text-black"
                        : "bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    VENDO (Pi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIntent("BARATTO_SCAMBIO")}
                    className={`py-2.5 px-2 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                      newIntent === "BARATTO_SCAMBIO"
                        ? "bg-[#00ff66] text-black"
                        : "bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    SCAMBIO
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIntent("ACQUISTO_CERCO")}
                    className={`py-2.5 px-2 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                      newIntent === "ACQUISTO_CERCO"
                        ? "bg-[#00ff66] text-black"
                        : "bg-black text-zinc-400 hover:text-white"
                    }`}
                  >
                    CERCO
                  </button>
                </div>

                {/* Titolo */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs font-bold text-zinc-300">
                    <span>Titolo</span>
                    <button
                      type="button"
                      onClick={() => startVoiceDictation("title")}
                      className="text-[10px] text-[#00ff66] hover:underline"
                    >
                      {dictatingField === "title" ? "Ascolto..." : "Dettatura Vocale"}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Es: Bicicletta da città, Lezioni di Chitarra, Trapano..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00ff66]"
                  />
                </div>

                {/* Categoria & Prezzo/Scambio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        const catKey = e.target.value as RealCategoryKey;
                        setNewCategory(catKey);
                        const catObj = REAL_CATEGORIES_MATRIX.find((c) => c.key === catKey);
                        if (catObj && catObj.subcategories[0]) {
                          setNewSubcategory(catObj.subcategories[0].key as RealSubcategoryKey);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-black text-white text-xs focus:outline-none cursor-pointer"
                    >
                      {REAL_CATEGORIES_MATRIX.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {newIntent === "VENDO" || newIntent === "ACQUISTO_CERCO" ? (
                    <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <label className="block text-xs font-bold text-zinc-300">
                          {newIntent === "VENDO" ? "Prezzo di Vendita" : "Budget / Prezzo d'Acquisto"} (Conversione Automatica)
                        </label>
                        {/* Riferimento Reale CoinMarketCap */}
                        <div className="flex items-center gap-1.5 bg-black px-2.5 py-1 rounded-lg border border-zinc-800 text-[10px] text-emerald-400 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          CoinMarketCap Live: 1 π ≈ {currentRate} {selectedCurrency}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2">
                        {/* Valuta Locale */}
                        <div>
                          <label className="text-[10px] text-zinc-400 font-bold block mb-1">
                            Valuta Locale ({selectedCurrency})
                          </label>
                          <div className="flex items-center rounded-lg bg-black border border-zinc-700 overflow-hidden focus-within:border-[#00ff66]">
                            <select
                              value={selectedCurrency}
                              onChange={(e) => setSelectedCurrency(e.target.value)}
                              className="bg-zinc-900 text-white font-bold text-xs px-2 py-2 border-r border-zinc-800 focus:outline-none cursor-pointer"
                            >
                              <option value="EUR">€ EUR</option>
                              <option value="USD">$ USD</option>
                              <option value="GBP">£ GBP</option>
                              <option value="CHF">CHF</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={localFiatPrice || ""}
                              onChange={(e) => handleFiatChange(e.target.value)}
                              placeholder="Es: 50.00"
                              className="w-full px-2.5 py-2 bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Icona Sync */}
                        <div className="hidden sm:flex items-center justify-center pt-4 text-[#00ff66]">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </div>

                        {/* Equivalente Pi Coin */}
                        <div>
                          <label className="text-[10px] text-[#00ff66] font-bold block mb-1">
                            Equivalente Pi Coin (π)
                          </label>
                          <div className="flex items-center rounded-lg bg-black border border-[#00ff66]/50 overflow-hidden focus-within:border-[#00ff66]">
                            <span className="px-2.5 py-2 bg-[#00ff66]/10 text-[#00ff66] font-bold text-xs border-r border-zinc-800 font-mono">
                              π
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={newPiPrice || ""}
                              onChange={(e) => handlePiChange(e.target.value)}
                              placeholder="Es: 1.59"
                              className="w-full px-2.5 py-2 bg-transparent text-[#00ff66] font-mono font-bold text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-0.5">
                        <span>1 π ≈ {currentRate} {selectedCurrency}</span>
                        <span className="text-[#00ff66] font-mono">Conversione automatica attiva ✓</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Cosa accetti in cambio</label>
                      <input
                        type="text"
                        placeholder="Es: Altri attrezzi, libri, aiuto..."
                        value={newDesiredExchange}
                        onChange={(e) => setNewDesiredExchange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-black text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#00ff66]"
                      />
                    </div>
                  )}
                </div>

                {/* Descrizione */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs font-bold text-zinc-300">
                    <span>Descrizione</span>
                    <button
                      type="button"
                      onClick={() => startVoiceDictation("description")}
                      className="text-[10px] text-[#00ff66] hover:underline"
                    >
                      {dictatingField === "description" ? "Ascolto..." : "Dettatura Vocale"}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Descrivi lo stato dell'oggetto, caratteristiche o dettagli..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00ff66]"
                  />
                </div>

                {/* Città */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Città</label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Provincia</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={newProvince}
                      onChange={(e) => setNewProvince(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs uppercase focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-900 text-zinc-400 text-xs font-bold"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black"
                  >
                    Pubblica Ora
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL: CONTATTO RAPIDO CHAT */}
      <AnimatePresence>
        {quickContactListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0e0e11] rounded-2xl p-6 space-y-4 text-white relative shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">Contatta {quickContactListing.author.name}</h3>
                    <ListingOriginBadge listing={quickContactListing} size="xs" />
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{quickContactListing.title}</p>
                </div>
                <button
                  onClick={() => setQuickContactListing(null)}
                  className="p-1.5 rounded-lg bg-black text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {messageSentToast ? (
                <div className="p-6 text-center space-y-2">
                  <span className="text-2xl">✓</span>
                  <p className="text-sm font-bold text-[#00ff66]">Messaggio inviato con successo!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Scrivi il tuo messaggio o accordo diretto..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#00ff66]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setQuickContactListing(null)}
                      className="px-4 py-2 rounded-xl bg-black text-zinc-400 text-xs font-bold"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleSendQuickMessage}
                      className="px-4 py-2 rounded-xl bg-[#00ff66] text-black text-xs font-black"
                    >
                      Invia Messaggio
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HUB DEDICATO PUNTI COMUNITARI & PRELIEVO PI NETWORK (0.50 Pi SOGLIA) */}
      <PioneerRewardsHubModal
        isOpen={showRewardsHub}
        onClose={() => setShowRewardsHub(false)}
        onOpenCreateListing={() => setShowCreateModal(true)}
      />

      {/* SCHEDA DETTAGLIO COMPLETA DELL'ANNUNCIO (DENTRO L'OFFERTA) */}
      {selectedListingForDetail && (
        <ListingDetailModal
          isOpen={!!selectedListingForDetail}
          listing={{
            id: selectedListingForDetail.id,
            title: selectedListingForDetail.title,
            description: selectedListingForDetail.description,
            category: selectedListingForDetail.category || 'Generale',
            price: selectedListingForDetail.price,
            currency: '€',
            imageUrl: selectedListingForDetail.imageUrl,
            images: selectedListingForDetail.images || [],
            city: selectedListingForDetail.author?.city || 'Territorio Locale',
            authorName: selectedListingForDetail.author?.name,
            authorUsername: selectedListingForDetail.author?.username,
            originType: selectedListingForDetail.originType,
            piPrice: selectedListingForDetail.piPrice,
            intent: selectedListingForDetail.intent,
            wantsInExchange: selectedListingForDetail.concreteExchange?.itemOrServiceAccepted,
          }}
          onClose={() => setSelectedListingForDetail(null)}
          onProposeBarter={() => {
            if (selectedListingForDetail) {
              onSelectListingForTrade(selectedListingForDetail);
            }
          }}
          onContactSeller={() => {
            if (selectedListingForDetail) {
              setQuickContactListing(selectedListingForDetail);
            }
          }}
          onBuy={() => {
            setOrderModalMode('self');
            setOrderModalListing(selectedListingForDetail);
          }}
          onGift={() => {
            setOrderModalMode('gift');
            setOrderModalListing(selectedListingForDetail);
          }}
        />
      )}

      {orderModalListing && (
        <MarketplaceOrderModal
          isOpen={!!orderModalListing}
          listing={{
            id: orderModalListing.id,
            title: orderModalListing.title,
            price: orderModalListing.price,
            piPrice: orderModalListing.piPrice,
            sellerName: orderModalListing.author?.name,
            sellerUsername: orderModalListing.author?.username,
          }}
          currentUser={{ name: currentUser.name, username: currentUser.username }}
          initialMode={orderModalMode}
          onClose={() => setOrderModalListing(null)}
          onOpenOrders={() => setShowOrdersModal(true)}
        />
      )}

      <MarketplaceOrdersModal
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
        currentUser={{ name: currentUser.name, username: currentUser.username }}
      />

    </div>
  );
};
