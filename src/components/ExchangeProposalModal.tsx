import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  HeartHandshake,
  Coins,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowRight,
  Package,
  Clock,
  HelpCircle,
  Lock
} from "lucide-react";
import { HaveWantListing, PioneerUser, ConcreteExchangeSpec } from "../types";
import { fuzzyGeocode } from "../lib/fuzzyGeocoding";
import { ListingOriginBadge } from "@/components/have2want/ListingOriginBadge";

interface ExchangeProposalModalProps {
  listing: HaveWantListing;
  currentUser: PioneerUser;
  onClose: () => void;
  onSubmitTrade: (proposal: {
    listingId: string;
    offeredItem: string;
    offeredQuantity: number;
    offeredUnit: string;
    message: string;
    piOffered: number;
    meetingLocation?: string;
    meetingLat?: number;
    meetingLng?: number;
  }) => void;
}

export const ExchangeProposalModal: React.FC<ExchangeProposalModalProps> = ({
  listing,
  currentUser,
  onClose,
  onSubmitTrade,
}) => {
  const [offeredItem, setOfferedItem] = useState(
    listing.concreteExchange?.wanted.item || ""
  );
  const [offeredQty, setOfferedQty] = useState(
    listing.concreteExchange?.wanted.quantity || 1
  );
  const [offeredUnit, setOfferedUnit] = useState(
    listing.concreteExchange?.wanted.unit || "pezzi"
  );
  const [offeredPi, setOfferedPi] = useState(0);
  const [noteMessage, setNoteMessage] = useState("");
  
  // Privacy-by-Design Meeting Point / Location Input
  const [meetingLocationInput, setMeetingLocationInput] = useState(listing.locationArea || listing.author.city || "");
  const [allowExactMeetingLocation, setAllowExactMeetingLocation] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fuzzy Geocoding for Meeting / Exchange point
    const geocodedMeeting = fuzzyGeocode(meetingLocationInput, allowExactMeetingLocation);

    onSubmitTrade({
      listingId: listing.id,
      offeredItem,
      offeredQuantity: offeredQty,
      offeredUnit,
      message: noteMessage,
      piOffered: offeredPi,
      meetingLocation: allowExactMeetingLocation ? meetingLocationInput : geocodedMeeting.displayName,
      meetingLat: geocodedMeeting.lat,
      meetingLng: geocodedMeeting.lng,
    });
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#030712] border-2 border-amber-400/80 rounded-[32px] sm:rounded-[36px] shadow-[0_0_100px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 font-mono tracking-widest block">
                Formula di Baratto Concreta & Integrata
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Proponi Baratto a {listing.author.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">
              Proposta di Scambio Inviata con Successo!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              La tua offerta è stata notificata direttamente a <b>{listing.author.name}</b>. L'incontro e lo scambio sono pronti per essere attivati sul territorio georeferenziato.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Riepilogo Oggetto Desiderato */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 flex-wrap gap-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  {listing.locationArea || listing.author.city}
                </span>
                <div className="flex items-center gap-1.5">
                  <ListingOriginBadge listing={listing} size="xs" />
                  <span className="text-amber-400 font-bold">{listing.category}</span>
                </div>
              </div>
              <h4 className="text-sm font-black text-white">
                {listing.title}
              </h4>
              <p className="text-xs text-slate-300">
                {listing.description}
              </p>

              {/* Specifiche Richieste dall'Autore */}
              {listing.concreteExchange && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-amber-200 bg-amber-950/30 p-2.5 rounded-xl">
                  <span className="font-bold block text-amber-400 text-[10px] uppercase font-mono">
                    Contropartita Desiderata dall'Autore:
                  </span>
                  <b>{listing.concreteExchange.wanted.quantity} {listing.concreteExchange.wanted.unit} di {listing.concreteExchange.wanted.item}</b>
                  {listing.concreteExchange.wanted.acceptableAlternatives && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      Alternative gradite: {listing.concreteExchange.wanted.acceptableAlternatives.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Configurazione Contropartita Concreta */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-amber-400 font-mono block">
                Formula Baratto: Cosa Offri in Cambio (Contropartita Concreta):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Oggetto / Bene / Servizio offerto *</label>
                  <input
                    type="text"
                    required
                    value={offeredItem}
                    onChange={(e) => setOfferedItem(e.target.value)}
                    placeholder="Es. 2 kg Pasta artigianale grano antico"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Quantità & Unità</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={offeredQty}
                      onChange={(e) => setOfferedQty(Number(e.target.value))}
                      className="w-16 px-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs text-center font-bold focus:outline-none focus:border-amber-400"
                    />
                    <select
                      value={offeredUnit}
                      onChange={(e) => setOfferedUnit(e.target.value)}
                      className="flex-1 px-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="litri">litri</option>
                      <option value="pezzi">pezzi</option>
                      <option value="ore_lavoro">ore lavoro</option>
                      <option value="confezioni">conf.</option>
                      <option value="set">set</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Flexible Meeting Point Input (Fuzzy Geocoding & Privacy) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Punto o Area di Incontro per lo Scambio (Fuzzy Geocoding)</span>
                  </label>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                    Privacy-by-Design
                  </span>
                </div>

                <input
                  type="text"
                  value={meetingLocationInput}
                  onChange={(e) => setMeetingLocationInput(e.target.value)}
                  placeholder="Inserisci solo Quartiere, Comune o Luogo pubblico (es. Asti Centro, Piazza Campo del Palio...)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />

                <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={allowExactMeetingLocation}
                    onChange={(e) => setAllowExactMeetingLocation(e.target.checked)}
                    className="rounded text-amber-400"
                  />
                  <span>Condividi indirizzo esatto solo con la controparte dello scambio</span>
                </label>
              </div>

              {/* Integrazione Opzionale Pi Network */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Integrazione in Pi Network (Opzionale)</span>
                  <span className="text-[11px] text-slate-400">Aggiungi Pi per conguaglio o riconoscimento</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={offeredPi}
                    onChange={(e) => setOfferedPi(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 text-xs font-bold text-center"
                  />
                  <span className="text-xs font-bold text-amber-400">Pi</span>
                </div>
              </div>

              {/* Messaggio Personale di Accordo */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Messaggio per {listing.author.name}</label>
                <textarea
                  rows={2}
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  placeholder="Es. Posso portarti la pasta domani mattina verso le 10:00 direttamente in piazza!"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>

            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <HeartHandshake className="w-5 h-5" />
                <span>Invia Proposta di Baratto Concreto</span>
              </button>
            </div>

          </form>
        )}

      </motion.div>
    </div>
  );
};
