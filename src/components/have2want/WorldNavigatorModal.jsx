import React, { useState, useEffect, useTransition } from 'react';
import {
  Search,
  Globe,
  MapPin,
  X,
  Compass,
  ArrowRight,
  Sparkles,
  Building,
  Flag,
  Languages,
  Coins,
  Loader2,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  WORLD_COUNTRIES,
  searchAnyWorldPlace
} from '@/lib/worldAtlas';
import {
  GLOBAL_HIERARCHY,
  getHierarchyForCountry
} from '@/lib/territoryHierarchy';
import { toast } from 'sonner';

export default function WorldNavigatorModal({
  isOpen,
  onClose,
  onSelectLocation,
  currentCountry = 'Italia',
  currentCity = 'Roma'
}) {
  const [activeTab, setActiveTab] = useState('TERRITORI'); // 'TERRITORI' | 'BACHECA_MONDIALE' | 'SEARCH' | 'MONDO' | 'METROPOLI'
  const [selectedContinent, setSelectedContinent] = useState('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Stato Gerarchico Multi-Livello (Stato -> Regione -> Provincia -> Comune)
  const [selectedHierarchyCountryCode, setSelectedHierarchyCountryCode] = useState('IT');
  const activeHierarchy = getHierarchyForCountry(selectedHierarchyCountryCode) || GLOBAL_HIERARCHY[0];
  
  const availableRegions = activeHierarchy?.regions || [];
  const [selectedHierarchyRegionName, setSelectedHierarchyRegionName] = useState(availableRegions[0]?.name || '');
  const activeRegion = availableRegions.find((r) => r.name === selectedHierarchyRegionName) || availableRegions[0];

  const availableProvinces = activeRegion?.provinces || [];
  const [selectedHierarchyProvinceName, setSelectedHierarchyProvinceName] = useState(availableProvinces[0]?.name || '');
  const activeProvince = availableProvinces.find((p) => p.name === selectedHierarchyProvinceName) || availableProvinces[0];

  const availableComuni = activeProvince?.comuni || [];
  const [selectedHierarchyComuneName, setSelectedHierarchyComuneName] = useState(availableComuni[0]?.name || '');
  const activeComune = availableComuni.find((c) => c.name === selectedHierarchyComuneName) || availableComuni[0];

  const handleSelectHierarchyCountry = (code) => {
    setSelectedHierarchyCountryCode(code);
    const hier = getHierarchyForCountry(code);
    const firstReg = hier?.regions?.[0];
    const firstProv = firstReg?.provinces?.[0];
    const firstCom = firstProv?.comuni?.[0];
    setSelectedHierarchyRegionName(firstReg?.name || '');
    setSelectedHierarchyProvinceName(firstProv?.name || '');
    setSelectedHierarchyComuneName(firstCom?.name || '');
  };

  const handleSelectHierarchyRegion = (regName) => {
    setSelectedHierarchyRegionName(regName);
    const reg = availableRegions.find((r) => r.name === regName);
    const firstProv = reg?.provinces?.[0];
    const firstCom = firstProv?.comuni?.[0];
    setSelectedHierarchyProvinceName(firstProv?.name || '');
    setSelectedHierarchyComuneName(firstCom?.name || '');
  };

  const handleSelectHierarchyProvince = (provName) => {
    setSelectedHierarchyProvinceName(provName);
    const prov = availableProvinces.find((p) => p.name === provName);
    const firstCom = prov?.comuni?.[0];
    setSelectedHierarchyComuneName(firstCom?.name || '');
  };

  // Debounced search per qualsiasi luogo nel mondo (città, paese, comune, stato, regione)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const places = await searchAnyWorldPlace(searchQuery);
        startTransition(() => {
          setSearchResults(places);
          setIsSearching(false);
        });
      } catch (e) {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Tutte le regioni italiane con capoluoghi dal database Italia
  const italiaCountry = WORLD_COUNTRIES.find((c) => c.code === 'IT');
  const regioniItalia = italiaCountry?.regions || [];

  // Filtro stati per continente
  const filteredCountries = WORLD_COUNTRIES.filter((c) => {
    if (selectedContinent === 'Tutti') return true;
    return c.continent === selectedContinent;
  });

  // Metropoli globali veloci
  const metropoli = [
    { name: 'Roma', country: 'Italia', flag: '🇮🇹', lat: 41.8902, lng: 12.4922, desc: 'Colosseo e Centro Storico', lang: 'Italiano', curr: 'EUR (€)' },
    { name: 'Milano', country: 'Italia', flag: '🇮🇹', lat: 45.4642, lng: 9.1900, desc: 'Duomo, Navigli e CityLife', lang: 'Italiano', curr: 'EUR (€)' },
    { name: 'Napoli', country: 'Italia', flag: '🇮🇹', lat: 40.8384, lng: 14.2529, desc: 'Spaccanapoli e Golfo', lang: 'Italiano', curr: 'EUR (€)' },
    { name: 'Torino', country: 'Italia', flag: '🇮🇹', lat: 45.0703, lng: 7.6869, desc: 'Mole Antonelliana e Po', lang: 'Italiano', curr: 'EUR (€)' },
    { name: 'Parigi', country: 'Francia', flag: '🇫🇷', lat: 48.8566, lng: 2.3522, desc: 'Tour Eiffel e Senna', lang: 'Français', curr: 'EUR (€)' },
    { name: 'New York', country: 'Stati Uniti', flag: '🇺🇸', lat: 40.7128, lng: -74.0060, desc: 'Manhattan e Broadway', lang: 'English', curr: 'USD ($)' },
    { name: 'Tokyo', country: 'Giappone', flag: '🇯🇵', lat: 35.6762, lng: 139.6503, desc: 'Shibuya e Shinjuku', lang: '日本語', curr: 'JPY (¥)' },
    { name: 'Londra', country: 'Regno Unito', flag: '🇬🇧', lat: 51.5074, lng: -0.1278, desc: 'Big Ben e Westminster', lang: 'English', curr: 'GBP (£)' },
    { name: 'Barcellona', country: 'Spagna', flag: '🇪🇸', lat: 41.3851, lng: 2.1734, desc: 'Sagrada Família', lang: 'Español', curr: 'EUR (€)' },
    { name: 'Berlino', country: 'Germania', flag: '🇩🇪', lat: 52.5200, lng: 13.4050, desc: 'Porta di Brandeburgo', lang: 'Deutsch', curr: 'EUR (€)' },
    { name: 'Dubai', country: 'Emirati Arabi', flag: '🇦🇪', lat: 25.2048, lng: 55.2708, desc: 'Burj Khalifa e Downtown', lang: 'العربية', curr: 'AED (د.إ)' },
    { name: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093, desc: 'Opera House e Harbour', lang: 'English', curr: 'AUD (A$)' },
  ];

  const handleSelectPlace = (place) => {
    onSelectLocation({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      displayName: place.displayName || place.name,
      countryName: place.countryName || place.country || 'Mondo',
      countryCode: place.countryCode || 'IT',
      stateOrRegion: place.stateOrRegion || '',
      flag: place.flag || '📍',
      language: place.language,
      currency: place.currency,
      timezone: place.timezone,
      greeting: place.greeting || place.language?.greeting,
    });
    onClose();
    toast.success(`🚀 Volo 3D su ${place.name} (${place.countryName || place.country || ''})!`, {
      description: `Lingua: ${place.language?.name || 'Locale'} • Valuta: ${place.currency?.code || 'EUR'} (${place.currency?.symbol || '€'})`,
    });
  };

  const handleSelectCountry = (country) => {
    onSelectLocation({
      lat: country.lat,
      lng: country.lng,
      name: country.capital,
      displayName: `${country.flag} ${country.name} (${country.capital})`,
      countryName: country.name,
      countryCode: country.code,
      stateOrRegion: country.capital,
      flag: country.flag,
      language: country.language,
      currency: country.currency,
      timezone: country.timezone,
      greeting: country.language.greeting,
    });
    onClose();
    toast.success(`🚀 Volo 3D su ${country.name} (Capitale: ${country.capital})!`, {
      description: `Lingua: ${country.language.name} • Valuta: ${country.currency.code} (${country.currency.symbol})`,
    });
  };

  const handleSelectRegione = (regione) => {
    onSelectLocation({
      lat: regione.lat,
      lng: regione.lng,
      name: regione.capital,
      displayName: `🇮🇹 ${regione.name} (Capoluogo: ${regione.capital})`,
      countryName: 'Italia',
      countryCode: 'IT',
      stateOrRegion: regione.name,
      flag: '🇮🇹',
      language: italiaCountry.language,
      currency: italiaCountry.currency,
      timezone: italiaCountry.timezone,
      greeting: `Benvenuto in ${regione.name}!`,
    });
    onClose();
    toast.success(`🚀 Volo 3D su ${regione.name} (Capoluogo: ${regione.capital})!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#0f172a]/98 border border-slate-700/90 shadow-2xl text-slate-100 flex flex-col overflow-hidden">
        {/* Glow accattivante */}
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. HEADER MODALE */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-800 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Atlante & Bacheca Mondiale 3D</span>
                <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-600/40">
                  Bacheca Globale
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bacheca annunci globale, stati, suddivisioni regionali e città con lingua e valuta nativa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. BARRA DI RICERCA UNIVERSALE (CERCA QUALSIASI POSTO NEL MONDO) */}
        <div className="px-5 pt-4 pb-2 relative z-10">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-emerald-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'SEARCH') setActiveTab('SEARCH');
              }}
              placeholder="Cerca QUALSIASI stato, regione, bacheca, città o comune del mondo..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900/95 border border-slate-700 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-emerald-400 absolute right-4 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center absolute right-3.5 cursor-pointer text-xs"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {/* 3. TABS NAVIGAZIONE (BACHECA MONDIALE IN PRIMO PIANO) */}
        <div className="px-5 pt-2 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('TERRITORI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeTab === 'TERRITORI'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 border-emerald-400 shadow-md font-black'
                : 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🏛️ Territori (Stato ➔ Regione ➔ Provincia ➔ Comune)</span>
          </button>

          <button
            onClick={() => setActiveTab('BACHECA_MONDIALE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
              activeTab === 'BACHECA_MONDIALE'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 border-emerald-400 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
            }`}
          >
            <span>🌍 Bacheca Globale</span>
          </button>

          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'SEARCH'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ricerca ({searchResults.length > 0 ? searchResults.length : 'Globale'})</span>
          </button>

          <button
            onClick={() => setActiveTab('MONDO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'MONDO'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🌐 Tutti gli Stati ({WORLD_COUNTRIES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('METROPOLI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'METROPOLI'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>✈️ Metropoli Globali</span>
          </button>
        </div>

        {/* 4. AREA CONTENUTI SCORREVOLE */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB SPECIALE: BACHECA MONDIALE GLOBALE */}
          {activeTab === 'BACHECA_MONDIALE' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 space-y-4 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🌍</span>
                    <div>
                      <h3 className="text-base font-black text-white">Bacheca Mondiale Have2Want</h3>
                      <p className="text-xs text-slate-300">
                        Visualizza contemporaneamente tutti gli annunci, bisogni e offerte di tutto il pianeta.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    Senza Limiti
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-sky-300 mb-1">🗣️ Traduzione AI Vocale & Testo</div>
                    <p className="text-[11px] text-slate-400">Ogni annuncio e chat è accessibile in ogni lingua con traduzione simultanea integrata.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-emerald-300 mb-1">🪙 Valute Locali & Pi Network</div>
                    <p className="text-[11px] text-slate-400">Visualizzazione prezzi in EUR, USD, GBP, JPY e pagamenti globali istantanei in Pi Network (π).</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-amber-300 mb-1">🤝 Baratto & Scambio Globale</div>
                    <p className="text-[11px] text-slate-400">What You Have ➡️ What You Want su scala globale, continentale, nazionale o regionale.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSelectPlace({
                      lat: 25.0,
                      lng: 15.0,
                      name: 'Bacheca Mondiale',
                      displayName: '🌍 Bacheca Mondiale (Globale)',
                      countryName: 'Tutto il Mondo',
                      countryCode: 'WORLD',
                      flag: '🌍',
                      isWorldBoard: true,
                      language: { name: 'Multilingua (AI)', code: 'multi', greeting: 'Benvenuto nella Bacheca Mondiale!' },
                      currency: { name: 'Pi Network & Valute Globali', code: 'π / Global', symbol: 'π' },
                      timezone: 'UTC (Fuso Orario Globale)',
                    });
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Globe className="w-4 h-4 stroke-[2.5]" />
                  <span>Apri la Bacheca Mondiale Completa (Tutti gli Annunci del Pianeta)</span>
                </button>
              </div>

              {/* Macro-Bacheche Continentali Veloci */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Macro-Bacheche per Continente:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { name: 'Bacheca Europa', flag: '🇪🇺', desc: 'Italia, Francia, Germania, Spagna e 30+ paesi', lat: 48.5, lng: 10.0, lang: 'Europeo (Multilingua)', curr: 'EUR (€)' },
                    { name: 'Bacheca Americhe', flag: '🌎', desc: 'USA, Canada, America Latina', lat: 37.0, lng: -95.0, lang: 'English / Español', curr: 'USD ($)' },
                    { name: 'Bacheca Asia & Pacifico', flag: '🌏', desc: 'Giappone, Corea, Singapore, Australia', lat: 34.0, lng: 110.0, lang: 'Multilingua Asia', curr: 'JPY / AUD / π' },
                    { name: 'Bacheca Africa & Medio Oriente', flag: '🌍', desc: 'Emirati, Marocco, Egitto, Sudafrica', lat: 10.0, lng: 25.0, lang: 'العربية / English', curr: 'AED / π' },
                  ].map((macro) => (
                    <div
                      key={macro.name}
                      onClick={() => {
                        handleSelectPlace({
                          lat: macro.lat,
                          lng: macro.lng,
                          name: macro.name,
                          displayName: `${macro.flag} ${macro.name}`,
                          countryName: macro.name,
                          countryCode: 'CONTINENT',
                          flag: macro.flag,
                          language: { name: macro.lang, code: 'auto' },
                          currency: { code: macro.curr, symbol: macro.curr },
                        });
                      }}
                      className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{macro.flag}</span>
                        <div>
                          <h5 className="text-xs font-black text-white group-hover:text-emerald-300">{macro.name}</h5>
                          <p className="text-[11px] text-slate-400">{macro.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* TAB 1: RISULTATI DI RICERCA */}
          {activeTab === 'SEARCH' && (
            <div className="space-y-3">
              {searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nessun luogo trovato per "{searchQuery}". Prova con un'altra città, stato o comune.
                </div>
              )}

              {searchQuery.trim().length < 2 && (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Compass className="w-8 h-8 text-emerald-400/60 animate-pulse" />
                  <p className="font-bold text-slate-300 text-sm">Digita qualsiasi nome di località</p>
                  <p className="max-w-md text-[11px] text-slate-400">
                    Copertura al 100% dell'intero pianeta: Stati sovrani, province, dipartimenti, metropoli, cittadine montane, borghi e isole.
                  </p>
                </div>
              )}

              {searchResults.map((place) => (
                <div
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/95 border border-slate-700/70 hover:border-emerald-500/60 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 group-hover:scale-110 transition-transform">
                      {place.flag || '📍'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                          {place.name}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {place.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
                        {place.displayName}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <Languages className="w-3 h-3" /> {place.language?.name || 'Locale'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Coins className="w-3 h-3" /> {place.currency?.code} ({place.currency?.symbol})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1 shrink-0">
                    <span>Vola 3D</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 1: GERARCHIA TERRITORIALE UNIVERSALE (STATO -> REGIONE -> PROVINCIA -> COMUNE) */}
          {activeTab === 'TERRITORI' && (
            <div className="space-y-4">
              {/* Box Intestazione */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Navigatore Gerarchico Universale</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Scegli uno Stato, seleziona la Regione, la Provincia e visualizza tutti i Comuni in 3D
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  4 Livelli
                </span>
              </div>

              {/* BREADCRUMB GERARCHICO VISIVO */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-300 overflow-x-auto scrollbar-none whitespace-nowrap">
                <span className="text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mondo</span>
                </span>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="text-emerald-300 flex items-center gap-1 font-black">
                  <span>{activeHierarchy?.flag}</span>
                  <span>{activeHierarchy?.name}</span>
                </span>
                {activeRegion && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="text-teal-300 flex items-center gap-1">
                      <span>🗺️</span>
                      <span>{activeRegion.name}</span>
                    </span>
                  </>
                )}
                {activeProvince && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="text-sky-300 flex items-center gap-1">
                      <span>📍</span>
                      <span>{activeProvince.name}</span>
                    </span>
                  </>
                )}
                {activeComune && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="text-amber-300 flex items-center gap-1 font-black">
                      <span>🏙️</span>
                      <span>{activeComune.name}</span>
                    </span>
                  </>
                )}
              </div>

              {/* LIVELLO 1: SELETTORE STATO (TUTTI GLI STATI) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <span>1. Seleziona Stato / Nazione:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {GLOBAL_HIERARCHY.length} Stati con gerarchia completa
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {GLOBAL_HIERARCHY.map((c) => {
                    const isSelected = c.code === selectedHierarchyCountryCode;
                    return (
                      <button
                        key={c.code}
                        onClick={() => handleSelectHierarchyCountry(c.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/70'
                        }`}
                      >
                        <span className="text-base leading-none">{c.flag}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVELLO 2: SELETTORE REGIONE */}
              {availableRegions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span>2. Regione / Stato Federale ({activeHierarchy?.name}):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {availableRegions.length} Regioni
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {availableRegions.map((reg) => {
                      const isSelected = reg.name === selectedHierarchyRegionName;
                      return (
                        <button
                          key={reg.name}
                          onClick={() => handleSelectHierarchyRegion(reg.name)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                            isSelected
                              ? 'bg-teal-400 text-slate-950 border-teal-300 font-black shadow-md shadow-teal-500/20'
                              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/60'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{reg.name}</span>
                          <span className="text-[10px] opacity-75">({reg.capital})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LIVELLO 3: SELETTORE PROVINCIA / DISTRETTO */}
              {availableProvinces.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span>3. Provincia / Distretto ({activeRegion?.name}):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {availableProvinces.length} Province
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {availableProvinces.map((prov) => {
                      const isSelected = prov.name === selectedHierarchyProvinceName;
                      return (
                        <button
                          key={prov.name}
                          onClick={() => handleSelectHierarchyProvince(prov.name)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                            isSelected
                              ? 'bg-sky-400 text-slate-950 border-sky-300 font-black shadow-md shadow-sky-500/20'
                              : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/60'
                          }`}
                        >
                          <span>📍</span>
                          <span>{prov.name}</span>
                          {prov.code && <span className="text-[10px] opacity-75 font-mono">({prov.code})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LIVELLO 4: GRIGLIA COMUNI DISPONIBILI NELLA PROVINCIA */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <span>4. Comuni e Città in {activeProvince?.name || activeRegion?.name}:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Clicca su un comune per volare in 3D
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {availableComuni.map((comune) => {
                    const isSelected = comune.name === selectedHierarchyComuneName;
                    return (
                      <div
                        key={comune.name}
                        onClick={() => {
                          setSelectedHierarchyComuneName(comune.name);
                          handleSelectPlace({
                            lat: comune.lat,
                            lng: comune.lng,
                            name: comune.name,
                            displayName: `${activeHierarchy.flag} ${comune.name} (${activeProvince?.name || activeRegion?.name}, ${activeHierarchy.name})`,
                            countryName: activeHierarchy.name,
                            countryCode: activeHierarchy.code,
                            stateOrRegion: activeRegion?.name || '',
                            flag: activeHierarchy.flag,
                            language: { name: activeHierarchy.lang, greeting: `Benvenuto a ${comune.name}!` },
                            currency: activeHierarchy.currency,
                          });
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400 text-white shadow-md'
                            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/70 hover:border-emerald-500/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏙️</span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{comune.name}</span>
                              {comune.isCapital && (
                                <span className="text-[9px] px-1 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                                  Capoluogo
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Lat {comune.lat.toFixed(2)}° • Lng {comune.lng.toFixed(2)}°
                            </div>
                          </div>
                        </div>

                        <button className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0">
                          <span>3D</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PULSANTE RAPIDO: ENTRA NEL COMUNE SELEZIONATO */}
              {activeComune && (
                <button
                  onClick={() => {
                    handleSelectPlace({
                      lat: activeComune.lat,
                      lng: activeComune.lng,
                      name: activeComune.name,
                      displayName: `${activeHierarchy.flag} ${activeComune.name} (${activeProvince?.name || activeRegion?.name}, ${activeHierarchy.name})`,
                      countryName: activeHierarchy.name,
                      countryCode: activeHierarchy.code,
                      stateOrRegion: activeRegion?.name || '',
                      flag: activeHierarchy.flag,
                      language: { name: activeHierarchy.lang, greeting: `Benvenuto a ${activeComune.name}!` },
                      currency: activeHierarchy.currency,
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/25 active:scale-98 transition-all"
                >
                  <span>🏙️ Vola nel Comune di {activeComune.name} ({activeProvince?.name}) in 3D</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          )}

          {/* TAB 3: TUTTI GLI STATI DEL MONDO */}
          {activeTab === 'MONDO' && (
            <div className="space-y-3">
              {/* Filtro Continenti */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['Tutti', 'Europa', 'Americhe', 'Asia', 'Africa', 'Oceania'].map((cont) => (
                  <button
                    key={cont}
                    onClick={() => setSelectedContinent(cont)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedContinent === cont
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cont}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCountries.map((c) => (
                  <div
                    key={c.code}
                    onClick={() => handleSelectCountry(c)}
                    className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-white group-hover:text-emerald-300">
                            {c.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-normal">({c.capital})</span>
                          {c.regions && c.regions.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 border border-slate-700/50 text-emerald-400/80 font-mono">
                              {c.regions.length} reg.
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-sky-300">{c.language.name}</span>
                          <span>•</span>
                          <span className="text-amber-300">{c.currency.code} ({c.currency.symbol})</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-xl bg-slate-800/80 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: METROPOLI GLOBALI */}
          {activeTab === 'METROPOLI' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {metropoli.map((metro) => (
                <div
                  key={metro.name}
                  onClick={() =>
                    handleSelectPlace({
                      name: metro.name,
                      lat: metro.lat,
                      lng: metro.lng,
                      countryName: metro.country,
                      flag: metro.flag,
                      displayName: `${metro.flag} ${metro.name} (${metro.country})`,
                      language: { name: metro.lang, code: 'und', greeting: `Benvenuto a ${metro.name}!` },
                      currency: { code: metro.curr.split(' ')[0], symbol: metro.curr.split('(')[1]?.replace(')', '') || '€', piRate: 0.0674 },
                    })
                  }
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{metro.flag}</span>
                    <div>
                      <h4 className="text-xs font-black text-white group-hover:text-emerald-300">
                        {metro.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{metro.desc}</p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-sky-300">{metro.lang}</span>
                        <span>•</span>
                        <span className="text-amber-300">{metro.curr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-xl bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
