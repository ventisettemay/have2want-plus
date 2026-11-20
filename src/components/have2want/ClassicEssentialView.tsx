import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  Phone,
  Car,
  BookOpen,
  Eye,
  CheckCircle2,
  Lock,
  ArrowRight,
  Handshake,
  ShieldCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { SAMPLE_GLOBAL_CARPOOLS } from '@/data/carpoolTrips';
import { PRACTICAL_MEMORY_GUIDES } from '@/data/craftMemoryGuides';
import { toast } from 'sonner';
import { getListingOriginBadge } from '@/lib/listingOrigin';

interface ClassicEssentialViewProps {
  listings: any[];
  currentUser: any;
  onSelectListing: (listing: any) => void;
  onTriggerHandshake: (listing: any) => void;
  onBackTo3D: () => void;
  onOpenEmergency: () => void;
  onOpenCarpool: () => void;
  onOpenMemory: () => void;
  onOpenLegalShield?: () => void;
}

export function ClassicEssentialView({
  listings,
  currentUser,
  onSelectListing,
  onTriggerHandshake,
  onBackTo3D,
  onOpenEmergency,
  onOpenCarpool,
  onOpenMemory,
  onOpenLegalShield,
}: ClassicEssentialViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'TUTTO' | 'ESTERNI' | 'VENDO' | 'SCAMBIO' | 'CERCO' | 'LIBRI'>('TUTTO');

  // Filtra annunci
  const filteredListings = listings.filter((item) => {
    const originInfo = getListingOriginBadge(item);
    const text = `${item.title || ''} ${item.description || ''} ${item.city || ''} ${originInfo.label} ${originInfo.sourceName || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === 'ESTERNI') return originInfo.isExternal;
    if (activeCategory === 'VENDO') return item.action_type === 'vendo' || item.intent === 'VENDO';
    if (activeCategory === 'SCAMBIO') return item.action_type === 'baratto_scambio' || item.action_type === 'baratto';
    if (activeCategory === 'CERCO') return item.action_type === 'acquisto_cerco' || item.intent === 'CERCO';
    if (activeCategory === 'LIBRI') {
      return item.category === 'libri_scuola_cultura' || text.includes('libr');
    }
    return true;
  });

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 pt-28 sm:pt-32 pb-24 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* HEADER MODALITÀ CLASSICA: ALTA LEGGIBILITÀ E ACCESSIBILITÀ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                👓 VISTA CLASSICA
              </span>
              <span className="text-sm font-bold text-slate-400">
                Alta Leggibilità • Navigazione Semplificata
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
              Annunci & Servizi Territoriali
            </h1>
            <p className="text-base text-slate-300 mt-1">
              Visualizzazione piatta 2D con caratteri grandi, contrasto elevato e accessibilità diretta ai servizi.
            </p>
          </div>

          <button
            onClick={onBackTo3D}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <span>🌐 Torna alla Vista 3D</span>
          </button>
        </div>

        {/* ACCESSI RAPIDI DI PRIMA NECESSITÀ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Emergenze */}
          <button
            onClick={onOpenEmergency}
            className="p-4 rounded-2xl bg-red-950/70 hover:bg-red-900/80 border-2 border-red-500/50 text-left flex items-center gap-3.5 cursor-pointer transition-all active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center text-2xl font-black shrink-0">
              🚨
            </div>
            <div>
              <h3 className="text-base font-black text-red-200">112 / Emergenze</h3>
              <p className="text-xs text-red-300/90 font-medium">Chiamata diretta carabinieri, polizia, 118</p>
            </div>
          </button>

          {/* Trasferte Carpool */}
          <button
            onClick={onOpenCarpool}
            className="p-4 rounded-2xl bg-teal-950/70 hover:bg-teal-900/80 border-2 border-teal-500/50 text-left flex items-center gap-3.5 cursor-pointer transition-all active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center text-2xl font-black shrink-0">
              🚗
            </div>
            <div>
              <h3 className="text-base font-black text-teal-200">Trasferte Condivise</h3>
              <p className="text-xs text-teal-300/90 font-medium">Viaggi gratuiti o rimborso spese tra privati</p>
            </div>
          </button>

          {/* Memoria Storica */}
          <button
            onClick={onOpenMemory}
            className="p-4 rounded-2xl bg-amber-950/70 hover:bg-amber-900/80 border-2 border-amber-500/50 text-left flex items-center gap-3.5 cursor-pointer transition-all active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-2xl font-black shrink-0">
              📖
            </div>
            <div>
              <h3 className="text-base font-black text-amber-200">Memoria & Mestieri</h3>
              <p className="text-xs text-amber-300/90 font-medium">Saper fare pratico, detti e manutenzioni</p>
            </div>
          </button>

          {/* Guida, Regole & Leggi Mondiali */}
          {onOpenLegalShield && (
            <button
              onClick={onOpenLegalShield}
              className="p-4 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 border-2 border-emerald-500/50 text-left flex items-center gap-3.5 cursor-pointer transition-all active:scale-98"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center text-2xl font-black shrink-0">
                📜
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-200">Guida, Pi & Leggi</h3>
                <p className="text-xs text-emerald-300/90 font-medium">No Fiat, privacy ~2.5km e norme per nazione</p>
              </div>
            </button>
          )}
        </div>

        {/* BARRA DI RICERCA E FILTRI GRANDI */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca annunci, oggetti o città..."
              className="w-full pl-13 pr-4 py-3.5 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white placeholder-slate-400 text-base font-semibold focus:outline-none focus:border-amber-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕ Cancella
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('TUTTO')}
              className={`px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-wider cursor-pointer border-2 transition-all shrink-0 ${
                activeCategory === 'TUTTO'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              Tutti gli annunci
            </button>

            <button
              onClick={() => setActiveCategory('ESTERNI')}
              className={`px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-wider cursor-pointer border-2 transition-all shrink-0 flex items-center gap-1.5 ${
                activeCategory === 'ESTERNI'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:border-amber-400'
              }`}
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Esterni</span>
            </button>

            {(['VENDO', 'SCAMBIO', 'CERCO', 'LIBRI'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-3 rounded-2xl font-black text-sm uppercase tracking-wider cursor-pointer border-2 transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LISTATO ANNUNCI IN FORMATO ACCESSIBILE */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm font-bold text-slate-400">
            <span>Annunci trovati: {filteredListings.length}</span>
            <span>Ordine: Più recenti</span>
          </div>

          {filteredListings.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 text-center flex flex-col items-center gap-2">
              <span className="text-4xl">🔍</span>
              <h3 className="text-lg font-bold text-white">Nessun annuncio trovato</h3>
              <p className="text-sm text-slate-400">Prova a modificare i filtri o la ricerca.</p>
            </div>
          ) : (
            filteredListings.map((listing) => {
              const originBadge = getListingOriginBadge(listing);
              return (
              <div
                key={listing.id}
                className={`p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 ${
                  originBadge.isExternal
                    ? 'border-amber-500/50 hover:border-amber-400'
                    : 'border-slate-800 hover:border-slate-600'
                } transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        listing.action_type === 'vendo'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : listing.action_type === 'baratto_scambio' || listing.action_type === 'baratto'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}
                    >
                      {listing.action_type || listing.intent || 'ANNUNCIO'}
                    </span>

                    {/* Badge Provenienza: Esterno o Illustrativo */}
                    {originBadge.isExternal ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-black uppercase bg-amber-950/80 text-amber-300 border border-amber-500/60 flex items-center gap-1 shadow-sm"
                        title={originBadge.tooltip}
                      >
                        <ExternalLink className="w-3 h-3 text-amber-400" />
                        <span>{originBadge.sublabel}</span>
                      </span>
                    ) : originBadge.isDemo ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-sky-950/70 text-sky-300 border border-sky-600/40 flex items-center gap-1"
                        title={originBadge.tooltip}
                      >
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        <span>{originBadge.label}</span>
                      </span>
                    ) : null}

                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{listing.city || listing.locationArea || 'Territorio Locale'}</span>
                    </span>

                    {listing.privacy_mode_active && (
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>Posizione Discreta</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white">
                    {listing.title}
                  </h3>

                  <p className="text-sm text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {listing.description || listing.have_description}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400 flex-wrap">
                    <span>Pubblicato da: {listing.author?.name || listing.author_name || '@pioniere'}</span>
                    {listing.piPrice || listing.price_pi ? (
                      <span className="text-amber-300 font-extrabold flex items-center gap-1">
                        <span>π</span>
                        <span>{listing.piPrice || listing.price_pi} Pi</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {listing.externalUrl && (
                    <a
                      href={listing.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-2xl bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-500/40 font-black text-sm flex items-center gap-1.5 transition-all shadow-md"
                      title="Apri su portale esterno"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-400" />
                      <span>Portale</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (onTriggerHandshake) onTriggerHandshake(listing);
                    }}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                  >
                    <Handshake className="w-4 h-4 stroke-[2.5]" />
                    <span>Stretta di Mano</span>
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
}
