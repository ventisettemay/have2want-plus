import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, ShieldCheck, AlertCircle, X, Store, ArrowUpRight } from "lucide-react";
import { CommerceShop } from "../types";

interface ExternalRedirectModalProps {
  shop: CommerceShop | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExternalRedirectModal: React.FC<ExternalRedirectModalProps> = ({
  shop,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !shop) return null;

  const targetUrl = shop.externalWebsiteUrl || `https://www.google.com/search?q=${encodeURIComponent(shop.name + " " + shop.city)}`;

  const handleProceed = () => {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(56,189,248,0.25)] text-slate-100 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-black">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-sky-400 tracking-wider">
                  Vettore Pubblicitario & Disaccoppiamento B2B
                </span>
                <h3 className="text-lg font-black text-white">{shop.name}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy & B2B Disclosure */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Transizione verso Canale Diretto del Commerciante</span>
            </div>
            <p className="leading-relaxed">
              HAVE2WANT agisce come <b>vettore promozionale geolocalizzato</b>. Non tratteniamo percentuali né gestiamo l'inventario proprietario di questa attività.
            </p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span>Destinazione esterna:</span>
              <span className="font-mono text-sky-300 truncate max-w-[220px]">{targetUrl}</span>
            </div>
          </div>

          {/* Business Info Quick View */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="text-[11px] text-slate-400">Offerta in evidenza sul territorio:</div>
            <div className="text-xs font-bold text-white">{shop.featuredOffer}</div>
            <div className="text-[11px] text-emerald-400 font-mono">
              {shop.acceptsPi ? "🪙 Accetta Pi Network" : ""} {shop.acceptsEuro ? "💶 Accetta Euro" : ""} {shop.acceptsBarter ? "⇄ Accetta Baratto" : ""}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Rimani sulla Mappa
            </button>
            <button
              onClick={handleProceed}
              className="py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 hover:from-sky-300 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <span>Visita Sito Esterno</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
