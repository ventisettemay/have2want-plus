import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  Coins,
  HeartHandshake,
  Sparkles,
  MapPin,
  GraduationCap,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  Mic,
  MicOff,
  Upload,
  Camera,
  Trash2,
  FlaskConical,
  Globe,
  ArrowRightLeft
} from "lucide-react";
import {
  HaveWantListing,
  InteractionIntent,
  RealCategoryKey,
  RealSubcategoryKey,
  PioneerUser
} from "../types";
import { REAL_CATEGORIES_MATRIX } from "../categories";
import { toast } from "sonner";
import { publishProductApi } from "../lib/testnetEngine";
import { spendPoints } from "../lib/communityRewardsService";
import {
  getCachedPiMarketData,
  PI_COMMUNITY_BASELINE_EUR,
  PI_COMMUNITY_BASELINE_USD
} from "../lib/piRealPriceService";
import { findCountryByNameOrCode, isValidCoord, WORLD_COUNTRIES } from "../lib/worldAtlas";

// Coordinates dictionary for major Italian cities and default centroid
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  asti: { lat: 44.9008, lng: 8.2068 },
  torino: { lat: 45.0703, lng: 7.6869 },
  milano: { lat: 45.4642, lng: 9.1900 },
  roma: { lat: 41.9028, lng: 12.4964 },
  firenze: { lat: 43.7696, lng: 11.2558 },
  bologna: { lat: 44.4949, lng: 11.3426 },
  genova: { lat: 44.4056, lng: 8.9463 },
  napoli: { lat: 40.8518, lng: 14.2681 },
  verona: { lat: 45.4384, lng: 10.9916 },
  padova: { lat: 45.4064, lng: 11.8768 },
  biella: { lat: 45.5637, lng: 8.0577 },
  alessandria: { lat: 44.9126, lng: 8.6153 },
  cuneo: { lat: 44.3845, lng: 7.5427 }
};

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing: (listing: HaveWantListing) => void;
  currentUser: PioneerUser;
  defaultIntent?: InteractionIntent;
  defaultCategory?: RealCategoryKey;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onAddListing,
  currentUser,
  defaultIntent = "BARATTO_SCAMBIO",
  defaultCategory = "casa_fai_da_te"
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newIntent, setNewIntent] = useState<InteractionIntent>(defaultIntent);
  const [newCategory, setNewCategory] = useState<RealCategoryKey>(defaultCategory);
  const [newSubcategory, setNewSubcategory] = useState<RealSubcategoryKey>("arredamento_mobili");
  const [newDescription, setNewDescription] = useState("");
  const [newPiPrice, setNewPiPrice] = useState<number>(148.37);
  const [localFiatPrice, setLocalFiatPrice] = useState<number>(10.00);
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
  const [newCity, setNewCity] = useState(currentUser.city?.split("/")[0]?.trim() || "");
  const [newProvince, setNewProvince] = useState(currentUser.province || "");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDemoListing, setIsDemoListing] = useState<boolean>(false);
  const [dictatingField, setDictatingField] = useState<"title" | "description" | "exchange" | null>(null);
  const [hasUsedVoiceAI, setHasUsedVoiceAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRecognitionRef = useRef<any>(null);

  const startVoiceDictation = (field: "title" | "description" | "exchange") => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Riconoscimento vocale non supportato dal browser in uso");
      return;
    }

    if (dictatingField === field) {
      if (activeRecognitionRef.current) {
        try {
          activeRecognitionRef.current.stop();
        } catch (e) {}
      }
      setDictatingField(null);
      return;
    }

    if (activeRecognitionRef.current) {
      try {
        activeRecognitionRef.current.abort();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = (typeof navigator !== "undefined" && navigator.language) || "it-IT";
    rec.interimResults = false;

    rec.onstart = () => {
      setDictatingField(field);
      toast.info(`Ascolto attivo per: ${field === "title" ? "Titolo" : field === "description" ? "Descrizione" : "Cosa cerchi"}`);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (field === "title") {
        setNewTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
      } else if (field === "description") {
        setNewDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      } else if (field === "exchange") {
        setNewDesiredExchange((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setHasUsedVoiceAI(true);
      setDictatingField(null);
      toast.success("Testo acquisito a voce!");
    };

    rec.onerror = (err: any) => {
      console.warn("Errore vocale:", err.error);
      setDictatingField(null);
    };

    rec.onend = () => {
      setDictatingField(null);
    };

    activeRecognitionRef.current = rec;
    rec.start();
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un file immagine valido (JPEG, PNG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine non deve superare 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setNewImageUrl(result);
      toast.success("Immagine caricata con successo!");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Compila titolo e descrizione per pubblicare");
      return;
    }

    // === COSTO IN PUNTI ===
    // Semplice (scritto a mano) = 2 punti | Con aiuto AI (voce) = 4 punti
    const cost = hasUsedVoiceAI ? 4 : 2;
    const spend = spendPoints(cost, `Pubblicazione annuncio: "${newTitle.trim()}"`);
    if (!spend.success) {
      toast.error(`Ti servono ${cost} punti per pubblicare.`, {
        description: `Saldo attuale: ${spend.newBalance} punti. Guarda un video nell'Hub Ricompense per guadagnarli.`,
      });
      return;
    }

    const normCity = newCity.trim().toLowerCase();
    let cityCoord: { lat: number; lng: number } | null = CITY_COORDINATES[normCity] || null;
    let resolvedCountryCode: string | undefined;

    if (!cityCoord && normCity) {
      const matchedCountry = findCountryByNameOrCode(newCity.trim());
      if (matchedCountry && isValidCoord(matchedCountry.lat, matchedCountry.lng)) {
        cityCoord = { lat: matchedCountry.lat, lng: matchedCountry.lng };
        resolvedCountryCode = matchedCountry.code;
      } else {
        for (const c of WORLD_COUNTRIES) {
          const reg = c.regions?.find(
            (r) => r.name.toLowerCase() === normCity || (r.capital && r.capital.toLowerCase() === normCity)
          );
          if (reg && isValidCoord(reg.lat, reg.lng)) {
            cityCoord = { lat: reg.lat, lng: reg.lng };
            resolvedCountryCode = c.code;
            break;
          }
        }
      }
    }

    if (!cityCoord && isValidCoord((currentUser as any)?.lat, (currentUser as any)?.lng)) {
      cityCoord = { lat: (currentUser as any).lat, lng: (currentUser as any).lng };
    }

    const fuzzyOffsetLat = (Math.random() - 0.5) * 0.012;
    const fuzzyOffsetLng = (Math.random() - 0.5) * 0.012;

    const newListing: HaveWantListing = {
      id: `list-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
          condition: "usato_ottimo"
        },
        wanted: {
          item: newDesiredExchange.trim(),
          quantity: 1,
          unit: "pezzi"
        },
        territorialScope: "citta_area",
        itemOrServiceAccepted: newDesiredExchange.trim()
      } : undefined,
      author: {
        name: currentUser.name || "Pioniere Solidale",
        username: currentUser.username || "@pioniere_001",
        avatar: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        reputation: currentUser.reputation || 5.0,
        isPioneerVerified: true,
        city: newCity.trim(),
        province: newProvince.trim().toUpperCase()
      },
      ...(cityCoord && isValidCoord(cityCoord.lat, cityCoord.lng)
        ? { lat: cityCoord.lat + fuzzyOffsetLat, lng: cityCoord.lng + fuzzyOffsetLng }
        : {}),
      ...(resolvedCountryCode ? { countryCode: resolvedCountryCode } : {}),
      locationArea: `${newCity.trim()} (${newProvince.trim().toUpperCase()})`,
      isFuzzyLocation: true,
      imageUrl: newImageUrl.trim() || (
        newCategory === "libri_scuola_cultura"
          ? "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80"
          : newCategory === "auto_moto_veicoli"
          ? "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80"
          : newCategory === "elettronica_informatica"
          ? "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80"
      ),
      createdAt: new Date().toISOString(),
      tags: [newCategory, newIntent, newSubcategory],
      status: "active",
      planetId: "planet-possibilita",
      satelliteId: "sat-scambi",
      isDemo: isDemoListing
    };

    onAddListing(newListing);

    // Sincronizzazione con il Flat DB / Backend API REST Testnet
    publishProductApi({
      product_name: newTitle.trim(),
      specs_anno: "2024",
      user_lat: cityCoord.lat + fuzzyOffsetLat,
      user_lng: cityCoord.lng + fuzzyOffsetLng,
      is_18_plus: false,
      imageFile: selectedFile,
      imageUrl: newImageUrl.trim() || undefined
    }).catch((err) => {
      console.warn("Testnet sync notification:", err);
    });

    toast.success("🎉 Annuncio Pubblicato!", {
      description: `Spesi ${cost} punti. Saldo rimasto: ${spend.newBalance} punti.`,
    });

    setHasUsedVoiceAI(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-700/80 p-5 sm:p-7 space-y-4 sm:space-y-5 shadow-2xl my-6 text-slate-100 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Pubblica Nuovo Annuncio</h3>
              <p className="text-xs text-slate-400">What you have → What you want • 0 Commissioni</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 💡 AIUTO AUTOMATICO NON INVASIVO */}
        <div className="px-3.5 py-2 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
          <span className="text-base shrink-0">💡</span>
          <p className="text-[11px] leading-tight text-emerald-300">
            <strong className="text-white font-semibold">Consiglio pratico:</strong> Scatta una foto dal vivo o usa il microfono per dettare. Il tuo indirizzo privato resta protetto: sulla mappa appare solo il centroide comunale (~2.5km).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 3 Action Switches */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Intento di Scambio <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewIntent("VENDO")}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  newIntent === "VENDO"
                    ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-300"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>VENDO (in π)</span>
              </button>

              <button
                type="button"
                onClick={() => setNewIntent("BARATTO_SCAMBIO")}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  newIntent === "BARATTO_SCAMBIO"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-300"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span>SCAMBIO</span>
              </button>

              <button
                type="button"
                onClick={() => setNewIntent("ACQUISTO_CERCO")}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  newIntent === "ACQUISTO_CERCO"
                    ? "bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 ring-2 ring-sky-300"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>CERCO</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Titolo dell'Oggetto, Bene o Servizio <span className="text-amber-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => startVoiceDictation("title")}
                className={`text-[11px] px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  dictatingField === "title"
                    ? "bg-red-500 text-white border-red-400 animate-pulse"
                    : "bg-slate-950 text-slate-400 hover:text-amber-300 border-slate-800"
                }`}
                title="Detta il titolo a voce"
              >
                {dictatingField === "title" ? <Mic className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
                <span>{dictatingField === "title" ? "In ascolto..." : "Detta a Voce"}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Es: Libri di Matematica 3° Superiore, Trapano Bosch, Bicicletta..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Quick preset for Libri Scolastici */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNewCategory("libri_scuola_cultura");
                setNewSubcategory("libri_scolastici");
                if (!newTitle) setNewTitle("Libri Scolastici Usati");
                toast.info("Impostata categoria: Libri Scolastici e Cultura");
              }}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Imposta per Libri Scolastici</span>
            </button>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Categoria Reale</label>
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
                className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {REAL_CATEGORIES_MATRIX.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {newIntent === "VENDO" || newIntent === "ACQUISTO_CERCO" ? (
              <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="block text-xs font-bold text-slate-200">
                    {newIntent === "VENDO" ? "Prezzo di Vendita" : "Budget / Prezzo d'Acquisto"} (Conversione Automatica)
                  </label>
                  {/* Riferimento Reale CoinMarketCap */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CoinMarketCap Live: 1 π ≈ {currentRate} {selectedCurrency}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2.5">
                  {/* Input Valuta Locale */}
                  <div className="relative">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      Prezzo in Valuta Locale ({selectedCurrency})
                    </label>
                    <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700 overflow-hidden focus-within:border-amber-400">
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="bg-slate-900 text-white font-bold text-xs px-2.5 py-2 border-r border-slate-800 focus:outline-none cursor-pointer"
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
                        className="w-full px-3 py-2 bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Icona Sync Bidirezionale */}
                  <div className="hidden sm:flex items-center justify-center pt-5 text-amber-400">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>

                  {/* Input Pi Coin Calcolato Automaticamente */}
                  <div className="relative">
                    <label className="text-[10px] text-amber-400 font-bold block mb-1">
                      Equivalente Convertito in Pi Coin (π)
                    </label>
                    <div className="flex items-center rounded-xl bg-slate-950 border border-amber-500/50 overflow-hidden focus-within:border-amber-400">
                      <span className="px-3 py-2 bg-amber-500/10 text-amber-400 font-bold text-xs border-r border-slate-800 font-mono">
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
                        className="w-full px-3 py-2 bg-transparent text-amber-300 font-mono font-bold text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Tasso di cambio: <strong>1 π ≈ {currentRate} {selectedCurrency}</strong></span>
                  <span className="text-emerald-400 font-mono">Conversione automatica attiva ✓</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">Formula Baratto: Cosa cerchi in cambio</label>
                  <button
                    type="button"
                    onClick={() => startVoiceDictation("exchange")}
                    className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all cursor-pointer ${
                      dictatingField === "exchange"
                        ? "bg-red-500 text-white border-red-400 animate-pulse"
                        : "bg-slate-950 text-slate-400 hover:text-amber-300 border-slate-800"
                    }`}
                  >
                    <Mic className="w-2.5 h-2.5" />
                    <span>{dictatingField === "exchange" ? "Ascolto..." : "Detta"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Es: Libri di narrativa, attrezzi..."
                  value={newDesiredExchange}
                  onChange={(e) => setNewDesiredExchange(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Descrizione Dettagliata <span className="text-amber-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => startVoiceDictation("description")}
                className={`text-[11px] px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                  dictatingField === "description"
                    ? "bg-red-500 text-white border-red-400 animate-pulse"
                    : "bg-slate-950 text-slate-400 hover:text-amber-300 border-slate-800"
                }`}
                title="Detta la descrizione a voce"
              >
                <Mic className="w-3 h-3" />
                <span>{dictatingField === "description" ? "In ascolto..." : "Detta Descrizione"}</span>
              </button>
            </div>
            <textarea
              rows={3}
              required
              placeholder="Descrivi dettagli, condizioni d'uso, disponibilità per lo scambio in presenza..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Location Area & Privacy Masking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Città o Territorio</label>
              <input
                type="text"
                required
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Es. Roma, Paris, Madrid, New York..."
                className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Regione / Sigla Territoriale</label>
              <input
                type="text"
                maxLength={4}
                value={newProvince}
                onChange={(e) => setNewProvince(e.target.value.toUpperCase())}
                placeholder="Es. RM, 75, NY, 28..."
                className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400 uppercase font-mono"
              />
            </div>
          </div>

          {/* Image Upload & Drag-and-Drop */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Foto dell'Articolo (Carica File o Incolla URL)
            </label>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {imagePreview || newImageUrl ? (
              <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 p-2 flex items-center gap-3">
                <img
                  src={imagePreview || newImageUrl}
                  alt="Anteprima"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">Immagine allegata</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Pronta per la pubblicazione
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setNewImageUrl("");
                  }}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                  title="Rimuovi immagine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Clicca per scattare o scegliere una foto, oppure trascinala qui
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supporta fotocamera smartphone, PNG, JPG, WEBP fino a 5MB
                  </p>
                </div>
              </div>
            )}

            {/* Optional URL input fallback */}
            <div className="mt-2">
              <input
                type="url"
                placeholder="Oppure inserisci URL immagine (https://...)"
                value={imagePreview?.startsWith("data:") ? "" : newImageUrl}
                onChange={(e) => {
                  setNewImageUrl(e.target.value);
                  setImagePreview(e.target.value || null);
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-white text-[11px] focus:outline-none focus:border-amber-400 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Natura dell'Annuncio: Trasparenza Community (Reale vs Di Prova) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Natura dell'Annuncio (Trasparenza)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">Etichetta Pubblica</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDemoListing(false)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isDemoListing
                    ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/40"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${!isDemoListing ? "text-emerald-400" : "text-slate-600"}`} />
                <div>
                  <div className="text-xs font-black">Annuncio Reale</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Oggetto o servizio realmente disponibile per lo scambio locale.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsDemoListing(true)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  isDemoListing
                    ? "bg-sky-500/10 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/40"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300"
                }`}
              >
                <FlaskConical className={`w-4 h-4 shrink-0 mt-0.5 ${isDemoListing ? "text-sky-400" : "text-slate-600"}`} />
                <div>
                  <div className="text-xs font-black flex items-center gap-1">
                    <span>Di Prova / Test</span>
                    <span className="text-[9px] px-1 py-0.2 bg-sky-400/20 text-sky-300 rounded font-mono">🧪</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Per prendere confidenza con l'app senza vincoli fisici di scambio.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Protezione Privacy:</strong> La posizione viene posizionata come baricentro urbano fuzzy per proteggere l'indirizzo privato. L'incontro avverrà nei Punti Certificati.
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Pubblica Subito
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
export default CreateListingModal;
