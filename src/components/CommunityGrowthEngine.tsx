import React from "react";
import { motion } from "motion/react";
import {
  Users,
  MessageSquare,
  Sparkles,
  Store,
  Building,
  TrendingUp,
  MapPin,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info
} from "lucide-react";
import { TerritoryNucleus } from "../types";

interface CommunityGrowthEngineProps {
  nuclei: TerritoryNucleus[];
  totalCitizens: number;
  totalMessages: number;
  totalListings: number;
  totalShops: number;
  onOpenGeographicMap: () => void;
  onOpenRegisterShop: () => void;
}

export const CommunityGrowthEngine: React.FC<CommunityGrowthEngineProps> = ({
  nuclei,
  totalCitizens,
  totalMessages,
  totalListings,
  totalShops,
  onOpenGeographicMap,
  onOpenRegisterShop,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      
      {/* Header with Definitive Rule */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            REGOLA FONDATIVA DI CRESCITA
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Dal Paese Primo all'Evoluzione del Mondo
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            <strong>Paese Primo</strong> è sempre il punto di ingresso per tutti. Gli edifici e i luoghi compaiono nel Paese in funzione delle attività reali. Quando un'area geografica raggiunge sufficiente massa critica, nasce un <strong>Nuovo Paese</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRegisterShop}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Store className="w-4 h-4" />
            <span>Registra Commerciante</span>
          </button>
        </div>
      </div>

      {/* 7-Step Organic Chain Visualization */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
          La Catena Organica di Generazione
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <Users className="w-4 h-4 text-sky-400 mb-1" />
            <span className="text-xs font-bold text-white">1. Persone</span>
            <span className="text-[10px] text-slate-400">{totalCitizens} membri</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <MessageSquare className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-xs font-bold text-white">2. Chat</span>
            <span className="text-[10px] text-slate-400">{totalMessages} messaggi</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-xs font-bold text-white">3. Annunci</span>
            <span className="text-[10px] text-slate-400">{totalListings} HAVE/WANT</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <Store className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-xs font-bold text-white">4. Commercio</span>
            <span className="text-[10px] text-slate-400">{totalShops} botteghe</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center">
            <Building className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-xs font-bold text-emerald-300">5. Edifici</span>
            <span className="text-[10px] text-emerald-400">7 Luoghi Attivi</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <TrendingUp className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-xs font-bold text-white">6. Massa Critica</span>
            <span className="text-[10px] text-slate-400">3 Nuclei in corso</span>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 flex flex-col items-center">
            <Compass className="w-4 h-4 text-emerald-300 mb-1" />
            <span className="text-xs font-black text-white">7. Nuovi Paesi</span>
            <span className="text-[10px] text-emerald-300">Verso il Mondo</span>
          </div>
        </div>
      </div>

      {/* Emerging Nuclei Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Nuclei Territoriali Reali in Aggregazione
          </span>
          <span className="text-slate-400">
            Nessun paese artificiale: solo aggregazione reale
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nuclei.map((nuc) => (
            <div
              key={nuc.id}
              className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{nuc.areaName}</h4>
                  <p className="text-[11px] text-slate-400">{nuc.region}, {nuc.nation}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                  {nuc.criticalMassPercentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${nuc.criticalMassPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{nuc.activeUsersCount} persone</span>
                <span>{nuc.conversationsCount} chat</span>
                <span>{nuc.shopsCount} botteghe</span>
              </div>

              {nuc.firstCommerceCategory && (
                <div className="text-[11px] text-emerald-300/80 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                  Primo commercio: {nuc.firstCommerceCategory}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
