import React, { useState } from 'react';
import {
  BookOpen,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  HeartHandshake,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';
import {
  CraftMemoryGuide,
  PRACTICAL_MEMORY_GUIDES
} from '@/data/craftMemoryGuides';

interface CraftMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CraftMemoryModal({
  isOpen,
  onClose
}: CraftMemoryModalProps) {
  const [guides] = useState<CraftMemoryGuide[]>(PRACTICAL_MEMORY_GUIDES);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuide, setActiveGuide] = useState<CraftMemoryGuide | null>(null);

  if (!isOpen) return null;

  const filteredGuides = guides.filter((g) => {
    const matchesCategory =
      selectedCategory === 'ALL' || g.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.sayingOrWisdom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'elettricita':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'idraulica':
        return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'vecchi-mestieri':
        return <Hammer className="w-4 h-4 text-amber-600" />;
      case 'casa-ecologica':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Wrench className="w-4 h-4 text-teal-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Memoria Storica & Saper Fare Artigiano
              </h2>
              <p className="text-xs text-slate-400">
                Soluzioni pratiche, antichi mestieri e saggezza popolare tramandata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca un problema pratico (es. lampadina, rubinetto, cigolio, orto...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Categorie */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'Tutti i Saperi' },
              { id: 'elettricita', label: 'Elettricità' },
              { id: 'idraulica', label: 'Idraulica' },
              { id: 'fai-da-te', label: 'Fai-da-Te' },
              { id: 'vecchi-mestieri', label: 'Mestieri Antichi' },
              { id: 'casa-ecologica', label: 'Orto & Casa' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guides List or Selected Guide */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {activeGuide ? (
            /* Dettaglio Guida Pratica */
            <div className="space-y-4 animate-fade-in text-xs text-slate-300">
              <button
                onClick={() => setActiveGuide(null)}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                ← Torna all'elenco delle guide pratiche
              </button>

              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/40">
                    {activeGuide.categoryLabel}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Tempo: {activeGuide.timeEstimate} • Difficoltà: {activeGuide.difficulty}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {activeGuide.title}
                </h3>

                {/* Proverbio / Detto Popolare */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 italic flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block not-italic text-[10px] uppercase text-amber-400 tracking-wider">
                      Saggezza del Maestro Artigiano
                    </span>
                    {activeGuide.sayingOrWisdom}
                  </div>
                </div>

                {/* Materiali */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                    Cosa ti occorre (a costo zero o pochi centesimi):
                  </h4>
                  <ul className="space-y-1">
                    {activeGuide.materialsNeeded.map((mat, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{mat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Passaggi Pratici */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                    Come fare passo dopo passo:
                  </h4>
                  <div className="space-y-2">
                    {activeGuide.practicalSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 leading-relaxed"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-right text-[11px] text-slate-500">
                  Condiviso da: <span className="text-slate-300 font-medium">{activeGuide.authorSign}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Lista Guide */
            <div className="space-y-3">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => setActiveGuide(guide)}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                        {getCategoryIcon(guide.category)}
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        {guide.categoryLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {guide.timeEstimate}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {guide.title}
                  </h3>

                  <p className="text-[11px] text-slate-400 italic line-clamp-1">
                    {guide.sayingOrWisdom}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" /> Archivio etico di utilità pubblica e tradizione artigiana • Nessun costo, pura conoscenza condivisa
          </p>
        </div>
      </div>
    </div>
  );
}
