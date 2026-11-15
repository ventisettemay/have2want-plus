import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Flame,
  X,
  Coins
} from "lucide-react";
import { HaveWantListing, ListingLifecycleRecord } from "../types";
import { ListingOriginBadge } from "@/components/have2want/ListingOriginBadge";

interface ListingExpiryManagerProps {
  userListings: HaveWantListing[];
  onToggleAutoRenew: (listingId: string, enabled: boolean) => void;
  onManualRenew: (listingId: string) => void;
  onClose?: () => void;
}

export const ListingExpiryManager: React.FC<ListingExpiryManagerProps> = ({
  userListings,
  onToggleAutoRenew,
  onManualRenew,
  onClose,
}) => {
  // Generate mock lifecycle state for user listings (30-day persistence, 5-day warning)
  const [lifecycles, setLifecycles] = useState<Record<string, ListingLifecycleRecord>>(() => {
    const initial: Record<string, ListingLifecycleRecord> = {};
    userListings.forEach((l, idx) => {
      const daysRemaining = idx === 0 ? 4 : idx === 1 ? 18 : 27; // simulate one near expiration (4 days)
      initial[l.id] = {
        listingId: l.id,
        publishedAt: new Date(Date.now() - (30 - daysRemaining) * 86400000).toISOString(),
        expiresAt: new Date(Date.now() + daysRemaining * 86400000).toISOString(),
        autoRenewEnabled: true,
        notificationSent5DaysBefore: daysRemaining <= 5,
        daysRemaining,
        status: daysRemaining <= 0 ? "scaduto_disattivato" : daysRemaining <= 5 ? "in_scadenza" : "attivo",
      };
    });
    return initial;
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    const current = lifecycles[id]?.autoRenewEnabled ?? true;
    const nextVal = !current;
    setLifecycles((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        autoRenewEnabled: nextVal,
      },
    }));
    onToggleAutoRenew(id, nextVal);
    setToastMsg(nextVal ? "Rinnovo automatico ATTIVATO" : "Rinnovo automatico DISATTIVATO (l'annuncio scadrà dopo 30 giorni)");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRenewNow = (id: string) => {
    setLifecycles((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        daysRemaining: 30,
        status: "rinnovato",
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        notificationSent5DaysBefore: false,
      },
    }));
    onManualRenew(id);
    setToastMsg("Annuncio rinnovato per ulteriori 30 giorni su Google Earth 3D!");
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>Scadenza & Persistenza Annunci (30 Giorni)</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                Pulizia Mappa 3D
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Mantenimento e rinnovo automatico con preavviso 5 giorni prima del termine
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Policy Notice Box */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <b>Regola di Igiene Geospaziale</b>: Ogni annuncio resta visibile sulla mappa 3D per <b>30 giorni</b>. Se il <i>Rinnovo Automatico</i> è <b>ON</b>, si prolunga scalando una micro-frazione di crediti Ad-Reward; se è <b>OFF</b>, scompare automaticamente per evitare annunci fantasma o obsoleti.
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center"
        >
          {toastMsg}
        </motion.div>
      )}

      {/* Listings List */}
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold uppercase text-slate-400">
          I Tuoi Annunci Attivi nella Bacheca Privata ({userListings.length}):
        </span>

        {userListings.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
            Nessun annuncio pubblicato attualmente dal tuo profilo.
          </div>
        ) : (
          userListings.map((listing) => {
            const cycle = lifecycles[listing.id] || {
              daysRemaining: 25,
              autoRenewEnabled: true,
              status: "attivo",
              notificationSent5DaysBefore: false,
            };

            const isNearExpiry = cycle.daysRemaining <= 5;

            return (
              <div
                key={listing.id}
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                  isNearExpiry
                    ? "bg-amber-950/25 border-amber-500/50 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                        listing.intent === "VENDO"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : listing.intent === "BARATTO_SCAMBIO"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-purple-500/20 text-purple-300"
                      }`}>
                        {listing.intent}
                      </span>
                      <ListingOriginBadge listing={listing} size="xs" compact={true} />
                      <h4 className="text-xs font-bold text-white line-clamp-1">{listing.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Città: <b className="text-slate-200">{listing.author.city}</b></span>
                      <span>•</span>
                      <span className={`flex items-center gap-1 font-bold ${
                        isNearExpiry ? "text-amber-400 animate-pulse" : "text-emerald-400"
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>Scadenza: {cycle.daysRemaining} giorni rimasti</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions & Auto-Renew Switch */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Auto-renew Switch */}
                    <button
                      onClick={() => handleToggle(listing.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        cycle.autoRenewEnabled
                          ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      <span>Rinnovo Auto:</span>
                      <b className={cycle.autoRenewEnabled ? "text-emerald-400" : "text-slate-400"}>
                        {cycle.autoRenewEnabled ? "ON" : "OFF"}
                      </b>
                    </button>

                    {/* Manual Renew Button if near expiry */}
                    {isNearExpiry && (
                      <button
                        onClick={() => handleRenewNow(listing.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Prolunga Ora (+30gg)</span>
                      </button>
                    )}
                  </div>
                </div>

                {isNearExpiry && (
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <b>Notifica di preavviso:</b> Questo annuncio scadrà tra {cycle.daysRemaining} giorni. Con il rinnovo automatico attivo, verrà esteso senza interruzioni su Google Earth 3D.
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
