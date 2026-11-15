import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Search,
  Globe,
  MapPin,
  Package,
  ArrowRight,
  Sparkles,
  X,
  Compass,
  Store,
  Layers,
  Zap,
  Tag,
  Mic,
  MicOff
} from "lucide-react";
import { HaveWantListing, CommerceShop } from "../types";
import { ListingOriginBadge } from "@/components/have2want/ListingOriginBadge";

export type SearchTargetType = "nation" | "city" | "product";

export interface FlightTarget {
  type: SearchTargetType;
  query: string;
  name: string;
  lat: number;
  lng: number;
  lod: "macro" | "urban" | "product";
  description?: string;
  count?: number;
  matchedShop?: CommerceShop;
  matchedListing?: HaveWantListing;
}

interface GlobalSearchBarProps {
  shops: CommerceShop[];
  listings: HaveWantListing[];
  onFlyToTarget: (target: FlightTarget) => void;
  className?: string;
}

// Rigorous geographical index for macro/urban target flight
const KNOWN_NATIONS = [
  { name: "Italia", query: "italia", lat: 41.8719, lng: 12.5674, lod: "macro" as const, desc: "Centroide Geografico Nazionale • Aggregazione Territoriale" },
  { name: "Francia", query: "francia", lat: 46.2276, lng: 2.2137, lod: "macro" as const, desc: "Centroide Geografico Nazionale • Aggregazione Territoriale" },
  { name: "Spagna", query: "spagna", lat: 40.4637, lng: -3.7492, lod: "macro" as const, desc: "Centroide Geografico Nazionale • Aggregazione Territoriale" },
  { name: "Germania", query: "germania", lat: 51.1657, lng: 10.4515, lod: "macro" as const, desc: "Centroide Geografico Nazionale • Aggregazione Territoriale" },
  { name: "Svizzera", query: "svizzera", lat: 46.8182, lng: 8.2275, lod: "macro" as const, desc: "Centroide Geografico Nazionale • Aggregazione Territoriale" },
];

const KNOWN_CITIES = [
  { name: "Asti", query: "asti", lat: 44.9008, lng: 8.2065, lod: "urban" as const, desc: "Nucleo Territoriale Attivo • Piemonte" },
  { name: "Torino", query: "torino", lat: 45.0703, lng: 7.6869, lod: "urban" as const, desc: "Area Urbana Attiva • Piemonte" },
  { name: "Firenze", query: "firenze", lat: 43.7696, lng: 11.2558, lod: "urban" as const, desc: "Distretto Ciclofficine & Artigiani • Toscana" },
  { name: "Bologna", query: "bologna", lat: 44.4949, lng: 11.3426, lod: "urban" as const, desc: "Centroide Salute & Erboristeria • Emilia-Romagna" },
  { name: "Milano", query: "milano", lat: 45.4642, lng: 9.1900, lod: "urban" as const, desc: "Polo Formazione Digitale & Servizi • Lombardia" },
  { name: "Roma", query: "roma", lat: 41.9028, lng: 12.4964, lod: "urban" as const, desc: "Capitale & Macro Centroide • Lazio" },
  { name: "Matera", query: "matera", lat: 40.6664, lng: 16.6043, lod: "urban" as const, desc: "Custodi Memoria & Tradizioni • Basilicata" },
  { name: "Parigi", query: "parigi", lat: 48.8566, lng: 2.3522, lod: "urban" as const, desc: "Nucleo Rurale Marittimo / Île-de-France" },
];

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  shops,
  listings,
  onFlyToTarget,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "nation" | "city" | "product">("all");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Riconoscimento vocale non supportato da questo browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = "it-IT";
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      setIsOpen(true);
      setIsListening(false);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cleanQuery = searchTerm.trim().toLowerCase();

  // Polymorphic Match Calculations
  // 1. Nations Match (Macro LOD)
  const matchedNations: FlightTarget[] = KNOWN_NATIONS
    .filter((n) => !cleanQuery || n.query.includes(cleanQuery) || n.name.toLowerCase().includes(cleanQuery))
    .map((n) => {
      const relatedListings = listings.filter((l) => l.locationArea.toLowerCase().includes(n.query) || l.author.city.toLowerCase().includes(n.query));
      const relatedShops = shops.filter((s) => s.city.toLowerCase().includes(n.query));
      return {
        type: "nation" as const,
        query: n.query,
        name: n.name,
        lat: n.lat,
        lng: n.lng,
        lod: n.lod,
        description: n.desc,
        count: relatedListings.length + relatedShops.length,
      };
    });

  // 2. Cities Match (Urban LOD)
  const matchedCities: FlightTarget[] = KNOWN_CITIES
    .filter((c) => !cleanQuery || c.query.includes(cleanQuery) || c.name.toLowerCase().includes(cleanQuery))
    .map((c) => {
      const cityListings = listings.filter((l) => l.locationArea.toLowerCase().includes(c.query) || l.author.city.toLowerCase().includes(c.query));
      const cityShops = shops.filter((s) => s.city.toLowerCase().includes(c.query));
      return {
        type: "city" as const,
        query: c.query,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        lod: c.lod,
        description: c.desc,
        count: cityListings.length + cityShops.length,
      };
    });

  // 3. Products & Items Match (Pinpoint Product LOD)
  const matchedProducts: FlightTarget[] = [
    ...listings
      .filter((l) => {
        if (!cleanQuery) return true;
        return (
          l.title.toLowerCase().includes(cleanQuery) ||
          l.description.toLowerCase().includes(cleanQuery) ||
          l.category.toLowerCase().includes(cleanQuery) ||
          l.tags.some((t) => t.toLowerCase().includes(cleanQuery)) ||
          (l.concreteExchange && l.concreteExchange.offer.item.toLowerCase().includes(cleanQuery)) ||
          (l.concreteExchange && l.concreteExchange.wanted.item.toLowerCase().includes(cleanQuery))
        );
      })
      .map((l) => ({
        type: "product" as const,
        query: l.title,
        name: l.title,
        lat: l.lat,
        lng: l.lng,
        lod: "product" as const,
        description: `Annuncio (${l.mode}): ${l.locationArea} • ${l.concreteExchange ? l.concreteExchange.offer.item : l.category}`,
        matchedListing: l,
      })),
    ...shops
      .filter((s) => {
        if (!cleanQuery) return true;
        return (
          s.name.toLowerCase().includes(cleanQuery) ||
          s.description.toLowerCase().includes(cleanQuery) ||
          s.featuredOffer.toLowerCase().includes(cleanQuery) ||
          s.type.toLowerCase().includes(cleanQuery)
        );
      })
      .map((s) => ({
        type: "product" as const,
        query: s.name,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        lod: "product" as const,
        description: `Bottega Opt-in: ${s.city} • ${s.featuredOffer}`,
        matchedShop: s,
      }))
  ];

  const handleSelectTarget = (target: FlightTarget) => {
    onFlyToTarget(target);
    setSearchTerm(target.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Pick best match automatically
      const topMatch = 
        (matchedProducts.length > 0 && matchedProducts[0]) ||
        (matchedCities.length > 0 && matchedCities[0]) ||
        (matchedNations.length > 0 && matchedNations[0]);
      if (topMatch) {
        handleSelectTarget(topMatch);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative z-30 ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center bg-slate-900/95 border-2 border-slate-700/80 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 rounded-2xl shadow-xl transition-all">
        <div className="pl-4 pr-2 text-sky-400 flex items-center">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cerca Nazione (Macro), Città (Urbano) o Oggetto (es. Bici, Pomodori, Trapano)..."
          className="w-full py-2.5 pr-10 text-xs sm:text-sm bg-transparent text-white placeholder-slate-400 font-medium focus:outline-none"
        />

        {/* Voice Search Button */}
        <button
          type="button"
          onClick={toggleVoiceSearch}
          title={isListening ? "Ascolto vocale attivo..." : "Cerca a voce"}
          className={`p-1.5 mr-1 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            isListening
              ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40"
              : "text-slate-400 hover:text-sky-300 hover:bg-slate-800"
          }`}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm("");
              setIsOpen(false);
            }}
            className="p-1.5 mr-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => {
            const topMatch = 
              (matchedProducts.length > 0 && matchedProducts[0]) ||
              (matchedCities.length > 0 && matchedCities[0]) ||
              (matchedNations.length > 0 && matchedNations[0]);
            if (topMatch) handleSelectTarget(topMatch);
          }}
          className="mr-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <span>Vola</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Polymorphic Flight Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-[80vh] flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Quick LOD Filters */}
          <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-1.5 text-[11px] overflow-x-auto">
            <span className="text-slate-400 font-mono uppercase text-[10px] mr-1">Filtro Bersaglio:</span>
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === "all" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Tutti ({matchedNations.length + matchedCities.length + matchedProducts.length})
            </button>
            <button
              onClick={() => setActiveFilter("nation")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "nation" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Nazioni ({matchedNations.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter("city")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "city" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Città ({matchedCities.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter("product")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "product" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Oggetti & Botteghe ({matchedProducts.length})</span>
            </button>
          </div>

          <div className="overflow-y-auto p-2 space-y-3">
            
            {/* 1. SECTION: NAZIONI (Macro LOD) */}
            {(activeFilter === "all" || activeFilter === "nation") && matchedNations.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase font-black text-sky-400 tracking-wider">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-sky-400" />
                    Macro LOD • Nazione (Vista Alta Quota)
                  </span>
                  <span>{matchedNations.length} nazioni</span>
                </div>
                {matchedNations.map((nat) => (
                  <div
                    key={nat.query}
                    onClick={() => handleSelectTarget(nat)}
                    className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                        🌍
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white group-hover:text-sky-300">{nat.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                            Macro LOD
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{nat.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
                      Vola Quota Alta →
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 2. SECTION: CITTÀ (Urban LOD) */}
            {(activeFilter === "all" || activeFilter === "city") && matchedCities.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase font-black text-emerald-400 tracking-wider">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    Urban LOD • Città / Comune (Transizione Strade Reali)
                  </span>
                  <span>{matchedCities.length} comuni</span>
                </div>
                {matchedCities.map((city) => (
                  <div
                    key={city.query}
                    onClick={() => handleSelectTarget(city)}
                    className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                        📍
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white group-hover:text-emerald-300">{city.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            Urban LOD
                          </span>
                          {city.count !== undefined && city.count > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                              {city.count} attivi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{city.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
                      Atterra in Città →
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 3. SECTION: PRODOTTI / OGGETTI (Pinpoint Product LOD) */}
            {(activeFilter === "all" || activeFilter === "product") && matchedProducts.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase font-black text-purple-400 tracking-wider">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-purple-400" />
                    Product LOD • Oggetti, Scambi & Botteghe Reali
                  </span>
                  <span>{matchedProducts.length} risultati</span>
                </div>
                {matchedProducts.slice(0, 8).map((prod, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectTarget(prod)}
                    className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {prod.matchedShop ? "🏪" : "📦"}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white group-hover:text-purple-300 truncate">
                            {prod.name}
                          </span>
                          {prod.matchedListing ? (
                            <ListingOriginBadge listing={prod.matchedListing} size="xs" compact={true} />
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono shrink-0">
                              Bottega
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{prod.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
                      Punta Telecamera →
                    </span>
                  </div>
                ))}
              </div>
            )}

            {matchedNations.length === 0 && matchedCities.length === 0 && matchedProducts.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nessun bersaglio geografico trovato per "{searchTerm}". Prova con "Italia", "Asti", "Bici" o "Pomodori".
              </div>
            )}

          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Orchestratore Google Earth Flight-to-Target</span>
            <span>LOD Automatico: Macro / Urban / Product</span>
          </div>

        </div>
      )}
    </div>
  );
};
