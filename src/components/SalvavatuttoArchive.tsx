import React, { useState, useMemo } from "react";
import { SalvavatuttoGuide } from "@/types";
import {
  Archive,
  Plus,
  Search,
  Shield,
  ThumbsUp,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Brain
} from "lucide-react";
import { hybridSearch } from "@/lib/semanticSearch";

interface SalvavatuttoArchiveProps {
  guides: SalvavatuttoGuide[];
  onAddGuide: (guide: SalvavatuttoGuide) => void;
}

const GuideCard = ({
  guide,
  isExpanded,
  onToggleExpand,
}: {
  key?: React.Key;
  guide: SalvavatuttoGuide;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  return (
    <div
      className={`rounded-3xl border transition-all overflow-hidden shadow-xl backdrop-blur-sm ${
        isExpanded
          ? "bg-slate-900 border-sky-400/50 shadow-sky-950/30"
          : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div
        onClick={onToggleExpand}
        className="p-6 cursor-pointer flex items-start justify-between gap-5"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {guide.category}
            </span>
            {guide.isEssential && (
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Essenziale
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {guide.readTimeMin} min lettura
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white hover:text-sky-300 transition-colors">
            {guide.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 line-clamp-2 leading-relaxed">
            {guide.summary}
          </p>
        </div>

        <div className="flex items-center gap-3.5 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">Autore: {guide.author}</div>
            <div className="text-xs text-slate-500">{guide.lastUpdated}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-3 border-t border-slate-800 space-y-4 text-sm animate-in fade-in duration-200">
          <div>
            <h4 className="text-xs font-black text-sky-300 uppercase tracking-wider mb-3">
              Procedura & Passaggi Operativi
            </h4>
            <div className="space-y-3">
              {guide.steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-sky-500/30">
                    {idx + 1}
                  </div>
                  <p className="text-slate-200 leading-relaxed text-sm sm:text-base">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex flex-wrap gap-2">
              {guide.tags.map((t, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                  #{t}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-sky-300 font-bold text-sm">
                <ThumbsUp className="w-4 h-4" /> {guide.upvotes} apprezzamenti
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SalvavatuttoArchive: React.FC<SalvavatuttoArchiveProps> = ({
  guides,
  onAddGuide,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>("salv-1");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"hybrid" | "exact" | "semantic">("hybrid");

  // Auto-scroll categorie guide
  const catBarRef = React.useRef<HTMLDivElement>(null);
  const [isCatHovered, setIsCatHovered] = useState(false);
  const catDirectionRef = React.useRef(1);
  const catPauseRef = React.useRef<any>(null);
  const catIsPausedRef = React.useRef(false);

  React.useEffect(() => {
    if (isCatHovered) return;

    let animId: number;
    const runScroll = () => {
      const el = catBarRef.current;
      if (el && !catIsPausedRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 10) {
          if (catDirectionRef.current === 1) {
            el.scrollLeft += 0.45;
            if (el.scrollLeft >= maxScroll - 2) {
              catIsPausedRef.current = true;
              catPauseRef.current = setTimeout(() => {
                catDirectionRef.current = -1;
                catIsPausedRef.current = false;
              }, 2500);
            }
          } else {
            el.scrollLeft -= 0.55;
            if (el.scrollLeft <= 2) {
              catIsPausedRef.current = true;
              catPauseRef.current = setTimeout(() => {
                catDirectionRef.current = 1;
                catIsPausedRef.current = false;
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
      if (catPauseRef.current) clearTimeout(catPauseRef.current);
    };
  }, [isCatHovered]);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Autonomia & Alimentazione");
  const [newSummary, setNewSummary] = useState("");
  const [newStepsText, setNewStepsText] = useState("");
  const [newAuthor, setNewAuthor] = useState("Autore Locale");
  const [newTags, setNewTags] = useState("");

  // Ricerca ibrida: exact + semantica (BM25 + sinonimi)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return guides;
    return hybridSearch(searchQuery, guides, { topK: guides.length });
  }, [searchQuery, guides]);

  const filteredGuides = searchResults.filter((g) => {
    if (selectedCategory !== "ALL" && g.category !== selectedCategory) return false;
    return true;
  });

  const handleCreateGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const steps = newStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const newGuide: SalvavatuttoGuide = {
      id: `salv-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      summary: newSummary.trim(),
      steps: steps.length > 0 ? steps : ["Passaggio 1: Segui le indicazioni della guida."],
      author: newAuthor.trim() || "Autore Locale",
      upvotes: 1,
      readTimeMin: Math.max(2, Math.round(newSummary.length / 100)),
      lastUpdated: "Oggi",
      tags: newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isEssential: false,
    };

    onAddGuide(newGuide);
    setExpandedGuideId(newGuide.id);
    setIsModalOpen(false);

    setNewTitle("");
    setNewSummary("");
    setNewStepsText("");
    setNewTags("");
  };

  return (
    <div className="space-y-6">
      {/* Luminous Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-sky-950/70 via-slate-900/90 to-sky-900/40 border border-sky-400/40 shadow-[0_0_40px_rgba(56,189,248,0.15)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sky-300 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5">
              <Archive className="w-4 h-4" />
              GUIDE PRATICHE & RISPARMIO
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Riparazioni, Fai-da-Te e Consigli Utili</h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Consigli pratici su come riparare oggetti invece di buttarli, risparmiare risorse e condividere le tue abilità con la comunità locale.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            id="open-add-guide-modal-btn"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-sky-500/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Aggiungi una Guida</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="mt-6 pt-5 border-t border-sky-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca guida: riparare biciclette, conservare cibi, orto, risparmio energetico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Search Mode Selector */}
          <div className="flex items-center gap-2">
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-sky-400 shrink-0"
              title="Modalità di ricerca"
            >
              <option value="hybrid">🔀 Ibrida (Exact + Semantica)</option>
              <option value="exact">🎯 Solo Testo Esatto</option>
              <option value="semantic">🧠 Solo Semantica (Sinonimi)</option>
            </select>

            <div
              ref={catBarRef}
              onMouseEnter={() => setIsCatHovered(true)}
              onMouseLeave={() => setIsCatHovered(false)}
              onTouchStart={() => setIsCatHovered(true)}
              onTouchEnd={() => setTimeout(() => setIsCatHovered(false), 2000)}
              className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x"
            >
              {["ALL", "Autonomia & Alimentazione", "Riparazione & Meccanica", "Salute & Sicurezza"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm whitespace-nowrap transition-all font-semibold cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-sky-400 text-slate-950 font-extrabold shadow-md border-sky-300"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {cat === "ALL" ? "Tutte le Guide" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Guides List */}
      <div className="space-y-4">
        {filteredGuides.length === 0 && searchQuery.trim() ? (
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-amber-500/30 text-center">
            <Brain className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nessun risultato per "{searchQuery}"</h3>
            <p className="text-slate-400 mb-4">Prova la ricerca semantica per trovare guide con termini correlati (es. "bici" trova anche "bicicletta", "mtb", "gravel").</p>
            <button
              onClick={() => setSearchMode("semantic")}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300"
            >
              Attiva Ricerca Semantica
            </button>
          </div>
        ) : (
          <>
            {filteredGuides.map((guide) => {
              const isExpanded = expandedGuideId === guide.id;
              return (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  isExpanded={isExpanded}
                  onToggleExpand={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                />
              );
            })}
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Aggiungi Conoscenza in Salvavatutto</h3>
                  <p className="text-xs text-slate-400">Preserva un sapere pratico utile a tutta la comunità</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuide} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Titolo della Guida</label>
                <input
                  type="text"
                  required
                  placeholder="Es: Come riparare una gomma forata..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="Autonomia & Alimentazione">Autonomia & Alimentazione</option>
                    <option value="Riparazione & Meccanica">Riparazione & Meccanica</option>
                    <option value="Salute & Sicurezza">Salute & Sicurezza</option>
                    <option value="Costruzioni & Bricolage">Costruzioni & Bricolage</option>
                    <option value="Energia & Sostenibilità">Energia & Sostenibilità</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Autore</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sommario</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Breve spiegazione del problema e soluzione..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Passaggi Operativi (uno per riga)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="1. Prima fase...\n2. Seconda fase..."
                  value={newStepsText}
                  onChange={(e) => setNewStepsText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tag (separati da virgola)</label>
                <input
                  type="text"
                  placeholder="Autonomia, Riparazioni, Tutorial"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  id="confirm-add-guide-btn"
                  className="px-6 py-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg"
                >
                  Salva in Salvavatutto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};