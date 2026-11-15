import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Store,
  X,
  MapPin,
  CheckCircle2,
  Euro,
  Coins,
  ArrowRightLeft,
  ShieldCheck,
  Building,
  Info,
  Globe,
  Lock
} from "lucide-react";
import { CommerceShop } from "../types";
import { fuzzyGeocode } from "../lib/fuzzyGeocoding";

interface RegisterShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (shop: CommerceShop) => void;
}

export const RegisterShopModal: React.FC<RegisterShopModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("");
  const [type, setType] = useState<CommerceShop["type"]>("bottega_artigiana");
  const [description, setDescription] = useState("");
  
  // Privacy-by-Design Flexible Location inputs
  const [locationInput, setLocationInput] = useState("");
  const [isExactAddressAllowed, setIsExactAddressAllowed] = useState(false);
  const [externalWebsiteUrl, setExternalWebsiteUrl] = useState("");
  const [featuredOffer, setFeaturedOffer] = useState("");
  
  // Payment methods
  const [acceptsPi, setAcceptsPi] = useState(true);
  const [acceptsBarter, setAcceptsBarter] = useState(false);
  const [barterConditions, setBarterConditions] = useState("");
  const [isLocalSponsor, setIsLocalSponsor] = useState(false);
  const [sponsorInitiative, setSponsorInitiative] = useState("");

  // Form submission feedback
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim() || !description.trim()) return;

    // Execute Fuzzy Geocoding with Privacy-by-Design Centroid Computation
    const geocoded = fuzzyGeocode(locationInput, isExactAddressAllowed);

    const newShop: CommerceShop = {
      id: `shop-${Date.now()}`,
      name: name.trim(),
      owner: {
        name: ownerName.trim(),
        username: ownerUsername.trim().startsWith("@") ? ownerUsername.trim() : `@${ownerUsername.trim() || "commerciante"}`,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      },
      type,
      description: description.trim(),
      acceptsPi,
      acceptsBarter,
      barterConditions: acceptsBarter ? barterConditions.trim() : undefined,
      isKYCVerified: true,
      isLocalSponsor,
      sponsorInitiative: isLocalSponsor ? sponsorInitiative.trim() : undefined,
      itemsCount: 1,
      rating: 5.0,
      featuredOffer: featuredOffer.trim() || "Benvenuti nella nostra attività!",
      realAddress: isExactAddressAllowed ? locationInput.trim() : geocoded.displayName,
      city: geocoded.displayName,
      lat: geocoded.lat,
      lng: geocoded.lng,
      externalWebsiteUrl: externalWebsiteUrl.trim() || undefined,
      isFuzzyLocation: geocoded.isFuzzyCentroid,
    };

    onRegister(newShop);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-sky-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Attiva la tua Attività sul Territorio
                </h3>
                <p className="text-xs text-slate-400">
                  Registrazione Opt-in per comparire sulla mappa 3D geolocalizzata
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-black text-white">Attività Attivata sulla Mappa!</h4>
              <p className="text-sm text-slate-300 max-w-md">
                La tua bottega è ora georeferenziata nel sistema e fungerà da vettore promozionale verso il tuo canale esterno.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              
              {/* Privacy & B2B Architecture Banner */}
              <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sky-300">Disaccoppiamento Commerciale e Privacy:</strong> HAVE2WANT non ospita cataloghi inventario proprietari. I visitatori sulla mappa vedranno la tua posizione e verranno reindirizzati direttamente sul tuo sito web o punto di contatto.
                </div>
              </div>

              {/* Shop & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nome dell'Attività *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Bottega del Legno, Pescheria del Porto..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nome Titolare / Referente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Mastro Antonio, Dott.ssa Clara..."
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Website URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tipologia di Attività *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CommerceShop["type"])}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="bottega_artigiana">Bottega Artigiana & Falegnameria</option>
                    <option value="bazar_usato">Bazar, Usato & Collezionismo</option>
                    <option value="emporio_bio">Emporio Agricolo & Bio</option>
                    <option value="pescheria">Pescheria Reale</option>
                    <option value="gelateria">Gelateria Artigianale</option>
                    <option value="supermercato">Supermercato / Alimentari</option>
                    <option value="ciclofficina">Ciclofficina & Riparazioni</option>
                    <option value="servizi_consulenza">Studio Medico / Professionale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Sito Web / Link Esterno (Vettore B2B)</span>
                    <span className="text-[10px] text-sky-400 font-mono">Redirect</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://tuosito.com o link social"
                    value={externalWebsiteUrl}
                    onChange={(e) => setExternalWebsiteUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Flexible Geocoding Input (Privacy-by-Design) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Localizzazione Geografica Flessibile (Fuzzy Geocoding)</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                    Privacy-by-Design
                  </span>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Inserisci solo Comune, Quartiere o Indirizzo (es. Asti, Torino San Salvario, Firenze...)"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none placeholder:text-slate-500"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isExactAddressAllowed}
                      onChange={(e) => setIsExactAddressAllowed(e.target.checked)}
                      className="rounded text-sky-500"
                    />
                    <span>Autorizzo a mostrare l'indirizzo civico esatto (altrimenti verrà usato il centroide di quartiere)</span>
                  </label>
                </div>
              </div>

              {/* Description & Featured Offer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Descrizione dell'Attività *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Descrivi la tua bottega..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Offerta / Proposta in Evidenza
                  </label>
                  <textarea
                    rows={2}
                    placeholder="es. Spigola fresca o Baratto con olio extravergine..."
                    value={featuredOffer}
                    onChange={(e) => setFeaturedOffer(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modalità di Pagamento & Scambio */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  Modalità Accettate
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    acceptsPi ? "bg-amber-500/10 border-amber-500/40 text-white" : "bg-slate-800/40 border-slate-700 text-slate-400"
                  }`}>
                    <input
                      type="checkbox"
                      checked={acceptsPi}
                      onChange={(e) => setAcceptsPi(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Pi Network (π)</span>
                  </label>

                  <label className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    acceptsBarter ? "bg-sky-500/10 border-sky-500/40 text-white" : "bg-slate-800/40 border-slate-700 text-slate-400"
                  }`}>
                    <input
                      type="checkbox"
                      checked={acceptsBarter}
                      onChange={(e) => setAcceptsBarter(e.target.checked)}
                      className="rounded text-sky-500"
                    />
                    <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold">Baratto Diretto</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 hover:scale-[1.01] transition-transform cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Attiva Presidio sulla Mappa 3D</span>
                </button>
              </div>

            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
