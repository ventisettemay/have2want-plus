import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  MapPin,
  ShieldCheck,
  Coins,
  HeartHandshake,
  Sparkles,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  Hammer,
  Store,
  Home,
  Car,
  Laptop,
  Shirt,
  GraduationCap
} from 'lucide-react';
import { HaveWantListing, PioneerUser } from '../types';
import { REAL_CATEGORIES_MATRIX, getCategoryDefinition } from '../categories';
import { RotatingCategoryBar, ROTATING_BAR_ITEMS, RotatingBarItem } from './RotatingCategoryBar';

interface DedicatedCategoryPageProps {
  categoryKey: string;
  listings: HaveWantListing[];
  currentUser: PioneerUser;
  onBack: () => void;
  onSelectCategory: (key: string) => void;
  onTriggerHandshake: (listing: HaveWantListing) => void;
  onOpenCreateListing: (preselectedCategory?: string) => void;
  onOpenWeather?: () => void;
  onOpenCraftKnowledge?: () => void;
}

export const DedicatedCategoryPage: React.FC<DedicatedCategoryPageProps> = ({
  categoryKey,
  listings,
  currentUser,
  onBack,
  onSelectCategory,
  onTriggerHandshake,
  onOpenCreateListing,
  onOpenWeather,
  onOpenCraftKnowledge,
}) => {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [selectedIntent, setSelectedIntent] = useState<'ALL' | 'VENDO' | 'BARATTO_SCAMBIO' | 'ACQUISTO_CERCO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Trova la definizione della categoria attiva
  const categoryDef = useMemo(() => {
    return getCategoryDefinition(categoryKey) || REAL_CATEGORIES_MATRIX[0];
  }, [categoryKey]);

  // Conteggio annunci per ogni categoria (per la barra rotante)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach((item: any) => {
      const k = item.category || item.category_key;
      if (k) counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [listings]);

  // Filtro annunci specifici della sola categoria aperta (SEPARAZIONE RIGIDA DELLE PAGINE)
  const categoryListings = useMemo(() => {
    return listings.filter((item: any) => {
      const itemCat = item.category || item.category_key;
      // Corrispondenza rigida di categoria
      if (categoryKey === 'attrezzi_lavoro') {
        const isTool = itemCat === 'attrezzi_lavoro' ||
          (itemCat === 'casa_fai_da_te' && (item.subcategory === 'attrezzi_lavoro_utensili' || /trapan|attrezz|chiav|smerigliat|officin|saldat/i.test(item.title || '')));
        if (!isTool) return false;
      } else if (categoryKey === 'arredamento_casa') {
        const isFurniture = itemCat === 'arredamento_casa' ||
          (itemCat === 'casa_fai_da_te' && item.subcategory === 'arredamento_mobili' && !/trapan|attrezz|chiav|smerigliat/i.test(item.title || ''));
        if (!isFurniture) return false;
      } else if (categoryKey === 'alimentari_km0') {
        const isFood = itemCat === 'alimentari_km0' || /pomodor|olio|frutta|ortaggi|formagg|farina|km0/i.test(item.title || '');
        if (!isFood) return false;
      } else {
        if (itemCat !== categoryKey) return false;
      }

      // Filtro per sottocategoria
      if (selectedSubcategory !== 'ALL') {
        if (item.subcategory !== selectedSubcategory) return false;
      }

      // Filtro per intento (Vendo, Baratto, Cerco)
      if (selectedIntent !== 'ALL') {
        const itemIntent = item.intent || (item.action_type === 'vendo' ? 'VENDO' : item.action_type === 'cerco' ? 'ACQUISTO_CERCO' : 'BARATTO_SCAMBIO');
        if (itemIntent !== selectedIntent) return false;
      }

      // Filtro per ricerca testuale
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${item.title || ''} ${item.description || ''} ${item.city || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [listings, categoryKey, selectedSubcategory, selectedIntent, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#00ff66] selection:text-black">
      {/* 1. BARRA SUPERIORE DI NAVIGAZIONE CON RITORNO */}
      <header className="sticky top-0 z-40 bg-black/95 border-b border-zinc-900 px-4 sm:px-6 py-2.5 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#00ff66] hover:text-white border border-zinc-800 text-xs font-black flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Torna alla Mappa 3D o alla vista generale"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Torna al Globo 3D</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
            <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
              {categoryDef.label}
            </span>
          </div>
        </div>

        {/* Pulsante Pubblica diretto in questa pagina */}
        <button
          type="button"
          onClick={() => onOpenCreateListing(categoryKey)}
          className="px-3.5 py-1.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Pubblica in questa Categoria</span>
        </button>
      </header>

      {/* 2. LA BARRA ROTANTE SUBITO ACCESSIBILE PER CAMBIARE PAGINA ALL'ISTANTE */}
      <RotatingCategoryBar
        activeKey={categoryKey}
        onSelect={(item) => {
          if (item.type === 'category') {
            onSelectCategory(item.key);
            setSelectedSubcategory('ALL');
            setSelectedIntent('ALL');
            setSearchQuery('');
          } else if (item.key === 'CONOSCENZE_MESTIERI' && onOpenCraftKnowledge) {
            onOpenCraftKnowledge();
          }
        }}
        listingsCounts={categoryCounts}
        onOpenWeather={onOpenWeather}
        onOpenCraftKnowledge={onOpenCraftKnowledge}
      />

      {/* 3. HERO BANNER SPECIFICO CON FOTOGRAFIA REALE (MAI DISEGNINI O ICONCINE) */}
      <div className="relative w-full h-48 sm:h-64 overflow-hidden border-b border-zinc-900 shrink-0">
        <img
          src={categoryDef.bannerImage || categoryDef.realImage}
          alt={categoryDef.label}
          className="w-full h-full object-cover object-center brightness-75 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-end pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#00ff66] text-black shadow-md font-mono">
              PAGINA DEDICATA & SEPARATA
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-black/80 text-zinc-300 border border-zinc-700">
              {categoryListings.length} {categoryListings.length === 1 ? 'annuncio attivo' : 'annunci attivi'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {categoryDef.label}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mt-1 leading-relaxed drop-shadow-sm font-medium">
            {categoryDef.description}
          </p>
        </div>
      </div>

      {/* 4. BARRA FILTRI DEDICATA & RICERCA CIRCOSCRITTA ALLA TIPOLOGIA */}
      <div className="bg-zinc-950 border-b border-zinc-900 px-4 sm:px-8 py-3 sticky top-[49px] z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Ricerca interna alla pagina */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#00ff66] absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cerca in ${categoryDef.label}...`}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white placeholder-zinc-400 text-xs sm:text-sm border border-zinc-800 focus:border-[#00ff66] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro per Tipologia di Transazione: Vendo, Scambio, Cerco */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Filtro:
            </span>
            <button
              type="button"
              onClick={() => setSelectedIntent('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedIntent === 'ALL'
                  ? 'bg-white text-black font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => setSelectedIntent('VENDO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedIntent === 'VENDO'
                  ? 'bg-[#00ff66] text-black font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <Coins className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Vendo</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIntent('BARATTO_SCAMBIO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedIntent === 'BARATTO_SCAMBIO'
                  ? 'bg-amber-400 text-black font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/20'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Scambio Diretto</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIntent('ACQUISTO_CERCO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedIntent === 'ACQUISTO_CERCO'
                  ? 'bg-blue-400 text-black font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-blue-300 border border-blue-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cerco</span>
            </button>
          </div>
        </div>

        {/* SOTTOCATEGORIE A PILLOLE DELLA SOLA CATEGORIA CORRENTE */}
        {categoryDef.subcategories && categoryDef.subcategories.length > 0 && (
          <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-zinc-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
              Dipartimenti:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSubcategory('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                selectedSubcategory === 'ALL'
                  ? 'bg-[#00ff66] text-black font-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              Tutti
            </button>
            {categoryDef.subcategories.map((sub) => (
              <button
                key={sub.key}
                type="button"
                onClick={() => setSelectedSubcategory(sub.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedSubcategory === sub.key
                    ? 'bg-[#00ff66] text-black font-black'
                    : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800'
                }`}
                title={sub.description}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. ELENCO DEGLI ANNUNCI DELLA PAGINA DEDICATA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {categoryListings.length === 0 ? (
          <div className="w-full py-16 px-4 rounded-3xl bg-zinc-950 border-2 border-dashed border-zinc-800 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-[#00ff66] flex items-center justify-center mx-auto text-2xl font-black">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                Nessun annuncio trovato con questi filtri
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Questa è la pagina dedicata a <strong>{categoryDef.label}</strong>.
                Sii il primo pioniere a pubblicare o proporre uno scambio diretto in questa sezione!
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenCreateListing(categoryKey)}
              className="px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs inline-flex items-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Pubblica il primo annuncio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryListings.map((item: any) => {
              const isVendo = item.intent === 'VENDO' || item.action_type === 'vendo';
              const isScambio = item.intent === 'BARATTO_SCAMBIO' || item.action_type === 'baratto_scambio' || item.action_type === 'baratto';
              const isCerco = item.intent === 'ACQUISTO_CERCO' || item.intent === 'CERCO' || item.action_type === 'acquisto_cerco';

              // Foto reale per l'annuncio
              const cardImage =
                item.image ||
                item.imageUrl ||
                (categoryDef.subcategories?.find((s) => s.key === item.subcategory)?.realImage) ||
                categoryDef.realImage;

              const isInternal = item.originType === 'REAL_P2P' || (!item.isExternal && item.originType !== 'EXTERNAL');

              return (
                <div
                  key={item.id}
                  onClick={() => onTriggerHandshake(item)}
                  className={`rounded-3xl bg-zinc-950 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer ${
                    isInternal
                      ? "border-2 border-[#00ff66] shadow-[0_0_18px_rgba(0,255,102,0.35)] ring-1 ring-[#00ff66]/30 hover:shadow-[0_0_26px_rgba(0,255,102,0.6)]"
                      : "border border-zinc-800 hover:border-zinc-600 shadow-md"
                  }`}
                >
                  {/* FOTOGRAFIA REALE INTESTAZIONE CARD */}
                  <div className="relative h-56 w-full overflow-hidden bg-zinc-900 shrink-0">
                    <img
                      src={cardImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/50" />

                    {/* BADGE AZIONE INTENTO & LED INTERNO */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1.5">
                        {isVendo && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#00ff66] text-black shadow-md flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            <span>VENDO</span>
                          </span>
                        )}
                        {isScambio && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-400 text-black shadow-md flex items-center gap-1">
                            <HeartHandshake className="w-3 h-3" />
                            <span>SCAMBIO</span>
                          </span>
                        )}
                        {isCerco && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-400 text-black shadow-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>CERCO</span>
                          </span>
                        )}
                      </div>

                      {isInternal && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/85 text-[#00ff66] border border-[#00ff66]/60 shadow-[0_0_8px_rgba(0,255,102,0.3)] flex items-center gap-1 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
                          H2W Diretto
                        </span>
                      )}
                    </div>

                    {/* PREZZO PI O CONDIZIONI DI SCAMBIO */}
                    <div className="absolute bottom-3 right-3">
                      {item.piPrice !== undefined && item.piPrice > 0 ? (
                        <span className="px-3 py-1 rounded-xl bg-black/90 border border-emerald-500/50 text-[#00ff66] font-mono font-black text-sm shadow-md">
                          {item.piPrice} π
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-black/90 border border-amber-500/50 text-amber-300 font-mono font-black text-xs shadow-md">
                          Baratto Libero
                        </span>
                      )}
                    </div>

                    {/* LOCALITÀ TERRITORIALE */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-bold text-zinc-300 bg-black/80 px-2 py-0.5 rounded-lg border border-zinc-800">
                      <MapPin className="w-3 h-3 text-[#00ff66]" />
                      <span className="truncate max-w-[150px]">{item.city || item.locationArea || 'Territorio'}</span>
                    </div>
                  </div>

                  {/* CORPO INFORMATIVO SENZA MURI DI TESTO */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <h3 className="text-base font-black text-white group-hover:text-[#00ff66] transition-colors line-clamp-1 leading-snug">
                      {item.title}
                    </h3>

                    {/* AUTORE & AZIONE STRETTA DI MANO */}
                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.author?.avatar && (
                          <img
                            src={item.author.avatar}
                            alt={item.author.name}
                            className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                          />
                        )}
                        <div className="min-w-0 leading-tight">
                          <span className="text-xs font-bold text-zinc-200 block truncate">
                            {item.author?.name || 'Pioniere'}
                          </span>
                          <span className="text-[10px] text-[#00ff66] font-mono">
                            ★ {item.author?.reputation?.toFixed(1) || '5.0'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerHandshake(item);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm shrink-0"
                        title="Inizia accordo per consegna a mano o spedizione"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Consegna a mano</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
