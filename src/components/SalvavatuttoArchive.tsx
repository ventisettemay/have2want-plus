import React from "react";
import { Archive, ArrowRight, Sparkles, Brain, Shield, BookOpen } from "lucide-react";

interface ConoscenzeMestieriArchiveProps {
  guides: any[];
  onAddGuide: (guide: any) => void;
  onOpenDefiancePulse?: () => void;
}

export const ConoscenzeMestieriArchive: React.FC<ConoscenzeMestieriArchiveProps> = ({
  guides,
  onAddGuide,
  onOpenDefiancePulse,
}) => {
  return (
    <div className="space-y-4">
      {/* Redirect Card to DEFIANCE PULSE CREATOR */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-purple-900/40 border border-violet-500/40 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-violet-300 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5">
              <Archive className="w-4 h-4" />
              CONOSCENZE & MESTIERI
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Guide, Saperi Artigianali ed Esperienze di Vita</h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
              L'archivio comunitario è ora integrato in <strong className="text-violet-200">DEFIANCE PULSE → CREATOR</strong>.
              Ritrova qui le guide per riparazioni, autoproduzione, riuso e saperi tramandati, potenziate da AI.
            </p>
          </div>

          <button
            onClick={onOpenDefiancePulse}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-violet-500/25 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-5 h-5 stroke-[3]" />
            <span>Apri DEFIANCE PULSE CREATOR</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Preview categorie principali */}
        <div className="mt-6 pt-5 border-t border-violet-500/20 flex flex-wrap gap-3">
          {[
            { icon: Brain, label: "Riparazioni & Meccanica", color: "violet" },
            { icon: BookOpen, label: "Autoproduzione & Alimentazione", color: "purple" },
            { icon: Shield, label: "Costruzioni & Bricolage", color: "indigo" },
            { icon: Sparkles, label: "Energia & Sostenibilità", color: "blue" },
          ].map((cat, i) => (
            <button
              key={i}
              onClick={onOpenDefiancePulse}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm whitespace-nowrap transition-all font-semibold cursor-pointer flex items-center gap-2 ${
                `bg-${cat.color}-950/50 border-${cat.color}-500/30 text-${cat.color}-300 hover:bg-${cat.color}-950 hover:border-${cat.color}-400`
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legacy notice - minimal */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <p className="text-xs text-slate-500">
          Le {guides.length} guide esistenti sono state migrate. Usa DEFIANCE PULSE CREATOR per crearne di nuove con AI.
        </p>
      </div>
    </div>
  );
};