import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Building2,
  Car,
  BookOpen,
  Wrench,
  ArrowRight,
  Handshake,
  MessageCircle,
  Plus,
  Compass,
  Sparkles,
  MapPin,
  CheckCircle2,
  Filter,
  ExternalLink,
  Globe2,
  Radar,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { getListingOriginBadge } from '@/lib/listingOrigin';
import { getCountryRadar } from '@/lib/countryPortalsRadar';
import { getMarketplaces } from '@/lib/externalMarketplaces';

export default function CountryTerritorySheet({
  country,
  listings = [],
  onClose,
  onSelectListing,
  onTriggerHandshake,
  onEnterUrban3D,
  onAddListing,
}) {
  // Categoria / Esigenza che l'utente decide di cercare
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRadarModal, setShowRadarModal] = useState(false);

  if (!country) return null;

  const countryRadar = useMemo(() => {
    return getCountryRadar(country.id || country.code);
  }, [country]);

  // 1. Tutti gli annunci appartenenti a questo territorio
  const countryListings = useMemo(() => {
    const cId = (country.id || '').toLowerCase();
    const cName = (country.name || '').toLowerCase();

    return listings.filter((item) => {
      const cityText = `${item.city || ''} ${item.locationArea || ''} ${item.author?.city || ''} ${(item.tags || []).join(' ')}`.toLowerCase();

      if (cId === 'it' || cName === 'italia') {
        return (
          cityText.includes('asti') || cityText.includes('torino') || cityText.includes('milano') ||
          cityText.includes('roma') || cityText.includes('bologna') || cityText.includes('firenze') ||
          cityText.includes('napoli') || cityText.includes('palermo') || cityText.includes('bari') ||
          cityText.includes('venezia') || cityText.includes('biella') || cityText.includes('matera') ||
          cityText.includes('italia') || cityText.includes('italy')
        );
      }
      if (cId === 'fr' || cName === 'francia') {
        return cityText.includes('parigi') || cityText.includes('paris') || cityText.includes('lione') || cityText.includes('lyon') || cityText.includes('francia');
      }
      if (cId === 'es' || cName === 'spagna') {
        return cityText.includes('madrid') || cityText.includes('barcellona') || cityText.includes('barcelona') || cityText.includes('spagna');
      }
      if (cId === 'de' || cName === 'germania') {
        return cityText.includes('berlino') || cityText.includes('berlin') || cityText.includes('monaco') || cityText.includes('germania');
      }
      if (cId === 'uk' || cId === 'gb' || cName === 'regno unito') {
        return cityText.includes('londra') || cityText.includes('london') || cityText.includes('regno unito');
      }
      if (cId === 'us' || cName === 'stati uniti' || cName === 'usa') {
        return cityText.includes('new york') || cityText.includes('san francisco') || cityText.includes('usa') || cityText.includes('stati uniti');
      }
      if (cId === 'jp' || cName === 'giappone') {
        return cityText.includes('tokyo') || cityText.includes('kyoto') || cityText.includes('giappone');
      }
      if (cId === 'ma' || cName === 'marocco') {
        return cityText.includes('marrakech') || cityText.includes('casablanca') || cityText.includes('rabat') || cityText.includes('marocco');
      }

      return cityText.includes(cName) || cityText.includes(cId);
    });
  }, [country, listings]);

  // Conteggi categorie
  const counts = useMemo(() => {
    let vendo = 0;
    let scambio = 0;
    let cerco = 0;
    let trasferte = 0;
    let servizi = 0;
    let libri = 0;
    let esterni = 0;

    countryListings.forEach((item) => {
      const originInfo = getListingOriginBadge(item, country.lang || country.language?.name || 'it');
      if (originInfo.isExternal) esterni++;

      const isCarpool = item.subcategory === 'trasferte_passaggi_carpool' || 
        (item.tags && item.tags.some(t => /trasfert|carpool|passagg/i.test(t))) ||
        /trasfert|carpool|passagg/i.test(item.title || '');
      const isSell = (item.intent === 'VENDO' || item.action_type === 'vendo') && !isCarpool;
      const isCerco = (item.intent === 'ACQUISTO_CERCO' || item.intent === 'CERCO' || item.action_type === 'acquisto_cerco') && !isCarpool;
      const isSwap = (item.intent === 'BARATTO_SCAMBIO' || item.action_type === 'baratto' || item.action_type === 'baratto_scambio') && !isCarpool;
      const isBook = item.category === 'libri_scuola_cultura' && !isCarpool;
      const isService = (item.intent === 'OFFRO_SERVIZIO' || item.category === 'servizi_lavoro_buoni' || item.category === 'rete_specialisti_supporto') && !isCarpool;

      if (isCarpool) trasferte++;
      else if (isSell) vendo++;
      else if (isSwap) scambio++;
      else if (isCerco) cerco++;
      else if (isBook) libri++;
      else if (isService) servizi++;
      else vendo++;
    });

    return {
      all: countryListings.length,
      vendo,
      scambio,
      cerco,
      trasferte,
      servizi,
      libri,
      esterni
    };
  }, [countryListings, country]);

  // 2. Filtro applicato in base a COSA L'UTENTE HA DECISO DI CERCARE
  const displayedListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return countryListings.filter((item) => {
      const originInfo = getListingOriginBadge(item, country.lang || country.language?.name || 'it');
      const isCarpool = item.subcategory === 'trasferte_passaggi_carpool' || 
        (item.tags && item.tags.some(t => /trasfert|carpool|passagg/i.test(t))) ||
        /trasfert|carpool|passagg/i.test(item.title || '');
      const isSell = (item.intent === 'VENDO' || item.action_type === 'vendo') && !isCarpool;
      const isCerco = (item.intent === 'ACQUISTO_CERCO' || item.intent === 'CERCO' || item.action_type === 'acquisto_cerco') && !isCarpool;
      const isSwap = (item.intent === 'BARATTO_SCAMBIO' || item.action_type === 'baratto' || item.action_type === 'baratto_scambio') && !isCarpool;
      const isBook = item.category === 'libri_scuola_cultura' && !isCarpool;
      const isService = (item.intent === 'OFFRO_SERVIZIO' || item.category === 'servizi_lavoro_buoni' || item.category === 'rete_specialisti_supporto') && !isCarpool;

      // Filtro per categoria decisa dall'utente
      if (selectedCategory === 'ESTERNI' && !originInfo.isExternal) return false;
      if (selectedCategory === 'VENDO' && !isSell) return false;
      if (selectedCategory === 'SCAMBIO' && !isSwap) return false;
      if (selectedCategory === 'CERCO' && !isCerco) return false;
      if (selectedCategory === 'TRASFERTE' && !isCarpool) return false;
      if (selectedCategory === 'SERVIZI' && !isService) return false;
      if (selectedCategory === 'LIBRI' && !isBook) return false;

      // Filtro testuale se inserito
      if (q) {
        const fullText = `${item.title || ''} ${item.description || ''} ${item.city || ''} ${item.locationArea || ''} ${(item.tags || []).join(' ')} ${originInfo.label} ${originInfo.sourceName || ''}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }

      return true;
    });
  }, [countryListings, selectedCategory, searchQuery, country]);

  return (
    <div
      id="country-territory-sheet"
      className="absolute inset-x-0 bottom-12 z-40 max-h-[75vh] sm:max-h-[68vh] bg-black border-t border-zinc-900 text-white rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto transition-all animate-in slide-in-from-bottom-8 duration-300"
    >
      {/* Indicatore minimo di trascinamento */}
      <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mt-2.5 mb-1" />

      {/* HEADER DEL PAESE: Bandiera, Nome, Info e chiusura */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
            {country.flag || '🌍'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                {country.name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#00ff66] text-black">
                {counts.all} {counts.all === 1 ? 'Annuncio' : 'Annunci'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5 flex-wrap">
              {country.capital && <span>Capitale: <strong className="text-zinc-200">{country.capital}</strong></span>}
              {country.currency && <span>• Valuta: <strong className="text-zinc-200">{country.currency}</strong></span>}
              {country.lang && <span>• Lingua: <strong className="text-zinc-200">{country.lang}</strong></span>}
            </p>
          </div>
        </div>

        {/* Azioni rapide di testata */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {countryRadar && (
            <button
              onClick={() => setShowRadarModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all"
              title={`Dove cercano e scambiano di solito in ${country.name}?`}
            >
              <Radar className="w-3.5 h-3.5 text-amber-400" />
              <span>Radar Web ({countryRadar.popularSearchEngines[0].split(' ')[0]})</span>
            </button>
          )}

          {onEnterUrban3D && (
            <button
              onClick={() => onEnterUrban3D(country)}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[#00ff66] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title={`Esplora ${country.capital || country.name} in 3D`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Vista 3D Urbana</span>
            </button>
          )}

          {onAddListing && (
            <button
              onClick={() => onAddListing(country)}
              className="px-3 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black flex items-center gap-1 cursor-pointer transition-colors active:scale-95 shadow-sm"
              title={`Pubblica un nuovo annuncio in ${country.name}`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Pubblica qui</span>
            </button>
          )}

          <button
            id="btn-close-country-sheet"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
            title="Chiudi scheda territorio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SELETTORE ESIGENZE DELL'UTENTE: "Cosa decidi di cercare in questo territorio?" */}
      <div className="px-4 sm:px-6 pt-2.5 pb-2 bg-black border-b border-zinc-900 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-white font-bold">
            <Filter className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Cosa decidi di cercare in {country.name}?</span>
          </div>

          {/* Campo di ricerca locale */}
          <div className="relative flex items-center min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cerca città o oggetto in ${country.name}...`}
              className="w-full pl-8 pr-7 py-1 rounded-lg text-xs bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tasti di selezione delle esigenze */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border ${
              selectedCategory === 'ALL'
                ? 'bg-[#00ff66] text-black border-[#00ff66]'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
            }`}
          >
            Tutti ({counts.all})
          </button>

          {/* Filtro Annunci Esterni sincronizzati con portali */}
          <button
            onClick={() => setSelectedCategory('ESTERNI')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              selectedCategory === 'ESTERNI'
                ? 'bg-amber-400 text-black border-amber-400 font-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-950 text-amber-300 hover:text-amber-200 border-amber-500/30'
            }`}
          >
            <ExternalLink className="w-3 h-3 text-amber-400" />
            <span>Esterni ({counts.esterni})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('VENDO')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              selectedCategory === 'VENDO'
                ? 'bg-[#00ff66] text-black border-[#00ff66]'
                : 'bg-zinc-950 text-white hover:text-[#00ff66] border-zinc-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            <span>Vendo ({counts.vendo})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('SCAMBIO')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              selectedCategory === 'SCAMBIO'
                ? 'bg-[#00ff66] text-black border-[#00ff66]'
                : 'bg-zinc-950 text-white hover:text-[#00ff66] border-zinc-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            <span>Scambio ({counts.scambio})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('CERCO')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              selectedCategory === 'CERCO'
                ? 'bg-[#00ff66] text-black border-[#00ff66]'
                : 'bg-zinc-950 text-white hover:text-[#00ff66] border-zinc-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            <span>Cerco ({counts.cerco})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('TRASFERTE')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              selectedCategory === 'TRASFERTE'
                ? 'bg-[#00ff66] text-black border-[#00ff66]'
                : 'bg-zinc-950 text-white hover:text-[#00ff66] border-zinc-800'
            }`}
          >
            <Car className="w-3 h-3 text-[#00ff66]" />
            <span>Trasferte ({counts.trasferte})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('SERVIZI')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              selectedCategory === 'SERVIZI'
                ? 'bg-[#00ff66] text-black border-[#00ff66]'
                : 'bg-zinc-950 text-white hover:text-[#00ff66] border-zinc-800'
            }`}
          >
            <Wrench className="w-3 h-3 text-[#00ff66]" />
            <span>Servizi ({counts.servizi})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('LIBRI')}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border flex items-center gap-1.5 ${
              selectedCategory === 'LIBRI'
                ? 'bg-[#00ff66] text-black border-[#00ff66]'
                : 'bg-zinc-950 text-white hover:text-[#00ff66] border-zinc-800'
            }`}
          >
            <BookOpen className="w-3 h-3 text-[#00ff66]" />
            <span>Libri ({counts.libri})</span>
          </button>
        </div>
      </div>

      {/* LISTA RISULTATI ESCLUSIVAMENTE PER CIO CHE L'UTENTE HA DECISO DI VEDERE */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {displayedListings.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl text-zinc-400">
              {selectedCategory === 'TRASFERTE' ? '🚗' : selectedCategory === 'LIBRI' ? '📚' : selectedCategory === 'SERVIZI' ? '🛠️' : '🔍'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Nessun annuncio privato per questa selezione in {country.name}
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                Visualizza le offerte in tempo reale dai marketplace leader collegati a questo paese:
              </p>
            </div>

            {/* Marketplace collegati in questo paese */}
            <div className="w-full max-w-md mx-auto space-y-2 mt-2">
              <div className="text-[10px] uppercase font-black tracking-wider text-zinc-400 text-left px-1">
                🌐 Marketplace Ufficiali Collegati in {country.name}:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {getMarketplaces(country.id || country.code).map((mp) => {
                  const targetUrl = mp.url.replace('{query}', encodeURIComponent(searchQuery.trim() || 'offerte'));
                  return (
                    <a
                      key={mp.id}
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-[#00ff66] transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mp.flag || country.flag}</span>
                        <div>
                          <div className="text-xs font-black text-white group-hover:text-[#00ff66] transition-colors">{mp.name}</div>
                          <div className="text-[10px] text-zinc-400">{searchQuery ? `Cerca "${searchQuery}"` : 'Vedi offerte live'}</div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00ff66] transition-colors shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>

            {onAddListing && (
              <button
                onClick={() => onAddListing(country)}
                className="mt-3 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-[#00ff66] border border-zinc-800 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pubblica il primo annuncio Have2Want in {country.name}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedListings.map((item) => {
              const isCarpool = item.subcategory === 'trasferte_passaggi_carpool';
              const isSell = item.action_type === 'vendo' || item.intent === 'VENDO';
              const isCerco = item.action_type === 'acquisto_cerco' || item.intent === 'CERCO';
              const isSwap = item.action_type === 'baratto_scambio' || item.intent === 'BARATTO_SCAMBIO';
              const isBook = item.category === 'libri_scuola_cultura';
              const isService = item.category === 'servizi_lavoro_buoni' || item.category === 'rete_specialisti_supporto';
              const originBadge = getListingOriginBadge(item, country.lang || country.language?.name || 'it');

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectListing && onSelectListing(item)}
                  className={`p-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border ${
                    originBadge.isExternal
                      ? 'border-zinc-800 hover:border-zinc-600'
                      : originBadge.isReal || !originBadge.isExternal
                        ? 'border-2 border-[#00ff66] shadow-[0_0_14px_rgba(0,255,102,0.35)] ring-1 ring-[#00ff66]/30'
                        : 'border-zinc-800 hover:border-[#00ff66]'
                  } transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-sm group`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {item.imageUrl ? (
                        <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-zinc-800">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <span className="text-xl mt-0.5">
                          {isCarpool ? '🚗' : isBook ? '📚' : isService ? '🛠️' : '📦'}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black text-[#00ff66] border border-zinc-800">
                            {isCarpool ? 'Trasferta' : isSell ? 'Vendo' : isSwap ? 'Scambio' : isCerco ? 'Cerco' : isBook ? 'Libro' : 'Servizio'}
                          </span>

                          {/* Badge LED INTERNO H2W vs ESTERNO con portale */}
                          {!originBadge.isExternal ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/80 text-[#00ff66] border border-[#00ff66]/60 shadow-[0_0_8px_rgba(0,255,102,0.3)] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
                              H2W Diretto
                            </span>
                          ) : (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm"
                              title={originBadge.tooltip}
                            >
                              <ExternalLink className="w-2.5 h-2.5 text-amber-400" />
                              <span>{originBadge.sublabel}</span>
                            </span>
                          )}

                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            <span>{item.city || item.locationArea || country.name}</span>
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-white mt-1 group-hover:text-[#00ff66] transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {item.piPrice ? (
                      <span className="px-2 py-0.5 rounded-lg bg-black text-[#00ff66] font-black text-xs border border-zinc-800 shrink-0">
                        {item.piPrice} π
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-[#00ff66] font-semibold text-[10px]">
                      <Sparkles className="w-3 h-3 text-[#00ff66]" />
                      Tocca per scheda e specifiche
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="Apri annuncio originale su portale esterno"
                        >
                          <ExternalLink className="w-3 h-3 text-amber-400" />
                          <span>Portale</span>
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTriggerHandshake) {
                            onTriggerHandshake(item);
                          } else {
                            toast.success(`Accordo di consegna a mano per ${item.title}`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-black hover:bg-zinc-900 text-[#00ff66] border border-zinc-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Accordo di scambio e consegna a mano di persona"
                      >
                        <Handshake className="w-3.5 h-3.5 text-[#00ff66]" />
                        <span>Consegna a mano</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* MODALE RADAR ABITUDINI WEB GLOBALI DEL PAESE */}
      {showRadarModal && countryRadar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 text-white space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header Modale */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl">
                  {countryRadar.flag}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Radar Web & Piattaforme: {countryRadar.countryName}</span>
                    <span className="text-xs text-zinc-400 font-normal">({countryRadar.nativeName})</span>
                  </h3>
                  <p className="text-xs text-amber-300 font-medium">
                    Dove vanno gli utenti sul web a cercare e scambiare cose in questo paese
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRadarModal(false)}
                className="p-1 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Motori di ricerca dominanti */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>Motori di Ricerca Principali</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {countryRadar.popularSearchEngines.map((engine, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-bold"
                  >
                    🔍 {engine}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Piattaforme e portali usati per scambi/usato */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5 text-amber-400" />
                <span>Portali e App Usate Popolarmente dagli Utenti</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {countryRadar.mainExchangePortals.map((portal, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-white">{portal.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase font-mono">
                        {portal.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Abitudini culturali di scambio */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Abitudine Culturale di Scambio</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {countryRadar.culturalTradingHabit}
              </p>
            </div>

            {/* 4. Modalità di pagamento/scambio tipiche & Keyword dominante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <div className="text-zinc-400 text-[10px] uppercase font-bold">Metodi di accordo preferiti</div>
                <div className="text-zinc-200 font-bold mt-0.5">
                  {countryRadar.preferredPaymentMethods.join(' • ')}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <div className="text-zinc-400 text-[10px] uppercase font-bold">Cosa digitano su Google/Web</div>
                <div className="text-[#00ff66] font-mono font-bold mt-0.5">
                  "{countryRadar.dominantSearchKeyword}"
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRadarModal(false)}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Chiudi Radar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
