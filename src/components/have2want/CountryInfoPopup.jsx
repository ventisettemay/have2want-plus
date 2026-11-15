import React, { useState, useEffect } from 'react';
import {
  X,
  Languages,
  Coins,
  Compass,
  ArrowRight,
  Handshake,
  ShieldCheck,
  MapPin,
  Building2,
  Layers,
  Search,
  Check,
  ChevronRight,
  Sparkles,
  Globe2,
} from 'lucide-react';
import { applyGeoPrivacy } from '@/lib/geoPrivacy';
import { getHierarchyForCountry, GLOBAL_HIERARCHY } from '@/lib/territoryHierarchy';
import { searchAnyWorldPlace, WORLD_COUNTRIES } from '@/lib/worldAtlas';

export default function CountryInfoPopup({
  country,
  onClose,
  onExplore,
  listings = [],
  onContactListing,
  isDiscreetMode = false,
}) {
  if (!country) return null;

  // 1. Dati gerarchici universali per lo Stato corrente
  const [activeCountryCode, setActiveCountryCode] = useState(country.id || country.code || 'IT');
  const currentHierarchy = getHierarchyForCountry(country.name || country.id || activeCountryCode);

  const availableRegions = currentHierarchy?.regions || [];
  const [selectedRegionName, setSelectedRegionName] = useState(availableRegions[0]?.name || '');

  const activeRegion = availableRegions.find((r) => r.name === selectedRegionName) || availableRegions[0];
  const availableProvinces = activeRegion?.provinces || [];

  const [selectedProvinceName, setSelectedProvinceName] = useState(availableProvinces[0]?.name || '');
  const activeProvince = availableProvinces.find((p) => p.name === selectedProvinceName) || availableProvinces[0];

  const availableComuni = activeProvince?.comuni || [];
  const [selectedComuneName, setSelectedComuneName] = useState(availableComuni[0]?.name || '');
  const activeComune = availableComuni.find((c) => c.name === selectedComuneName) || availableComuni[0];

  // Ricerca libera per qualsiasi comune/frazione nel mondo
  const [comuneSearch, setComuneSearch] = useState('');
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  // Aggiorna la selezione quando cambia la regione
  const handleSelectRegion = (regName) => {
    setSelectedRegionName(regName);
    const reg = availableRegions.find((r) => r.name === regName);
    const firstProv = reg?.provinces?.[0];
    setSelectedProvinceName(firstProv?.name || '');
    setSelectedComuneName(firstProv?.comuni?.[0]?.name || '');
  };

  // Aggiorna la selezione quando cambia la provincia
  const handleSelectProvince = (provName) => {
    setSelectedProvinceName(provName);
    const prov = availableProvinces.find((p) => p.name === provName);
    setSelectedComuneName(prov?.comuni?.[0]?.name || '');
  };

  // Debounced search per qualsiasi comune
  useEffect(() => {
    if (!comuneSearch || comuneSearch.trim().length < 2) {
      setLiveSearchResults([]);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    const timeout = setTimeout(async () => {
      try {
        const queryWithCountry = `${comuneSearch}, ${country.name || ''}`;
        const res = await searchAnyWorldPlace(queryWithCountry);
        setLiveSearchResults(res || []);
      } catch (e) {
        setLiveSearchResults([]);
      } finally {
        setIsSearchingLive(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [comuneSearch, country.name]);

  // Coordinate effettive del comune/livello attualmente scelto
  const effectiveTarget = activeComune || activeProvince || activeRegion || country;
  const targetLat = effectiveTarget.lat || country.lat;
  const targetLng = effectiveTarget.lng || country.lng;
  const targetPlaceName = activeComune?.name || activeProvince?.name || activeRegion?.name || country.name;

  // Filtra annunci per territorio
  const countryListings = listings.filter((l) => {
    const lCountry = (l.country || l.country_code || '').toLowerCase();
    const lCity = (l.city || l.locationArea || '').toLowerCase();
    const cId = (country.id || '').toLowerCase();
    const cName = (country.name || '').toLowerCase();
    const targetName = targetPlaceName.toLowerCase();
    return (
      lCountry === cId ||
      lCountry.includes(cName) ||
      lCity.includes(cName) ||
      lCity.includes(targetName)
    );
  });

  const displayListing = countryListings[0] || {
    id: `territory-${country.id || 'loc'}-listing`,
    title: `Presidio Territoriale & Rete Pi (${targetPlaceName})`,
    intent: 'BARATTO_SCAMBIO',
    action_type: 'baratto_scambio',
    have_description: `Offerta e disponibilità locale (${targetPlaceName}, ${country.name})`,
    want_description: `Scambio solidale paritario o beni con Pi Coin`,
    city: targetPlaceName,
    country: country.name,
    piPrice: 0,
    author: {
      name: `Pioniere (${targetPlaceName})`,
      username: `@pioniere_${(country.id || 'geo').toLowerCase()}`,
      reputation: 4.98,
      trust_rating: 4.98,
    },
    privacy_mode_active: isDiscreetMode,
    is_discrete_mode: isDiscreetMode,
    lat: targetLat,
    lng: targetLng,
    handshake_pin: '7429',
  };

  const privacyInfo = applyGeoPrivacy(displayListing, isDiscreetMode);

  const handleEnterUrban = () => {
    if (onExplore) {
      onExplore({
        lat: targetLat,
        lng: targetLng,
        name: targetPlaceName,
        country: country.name,
        countryCode: country.id || country.code,
        stateOrRegion: activeRegion?.name || '',
        province: activeProvince?.name || '',
        comune: activeComune?.name || '',
        flag: country.flag || '📍',
        lang: country.lang,
        currency: country.currency,
      });
    }
  };

  return (
    <div
      id="country-info-popup"
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[96vw] max-w-xl p-0.5 rounded-2xl bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-cyan-500/50 shadow-2xl shadow-black/80 animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto select-none"
    >
      <div className="bg-[#070b19]/95 backdrop-blur-2xl p-4 sm:p-5 rounded-[14px] text-slate-100 border border-slate-700/60 flex flex-col gap-3 max-h-[82vh] overflow-y-auto scrollbar-thin">
        {/* Top Header: Flag, Name and Close button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow-md leading-none">
              {country.flag || '🌍'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  {country.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {country.id?.toUpperCase() || country.code || 'GLOBO'}
                </span>
                <span className="text-[10px] text-cyan-300 font-mono">
                  {country.continent || 'Tutti gli Stati'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>
                  Lat {targetLat.toFixed(2)}° • Lng {targetLng.toFixed(2)}°
                </span>
                {country.capital && <span>• Cap. {country.capital}</span>}
              </p>
            </div>
          </div>

          <button
            id="btn-close-country-popup"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            title="Chiudi pannello territorio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BREADCRUMB GERARCHICO DINAMICO: Mondo > Stato > Regione > Provincia > Comune */}
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-[11px] font-bold text-slate-300 overflow-x-auto scrollbar-none whitespace-nowrap">
          <span className="text-slate-400 flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mondo</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="text-white flex items-center gap-1">
            <span>{country.flag}</span>
            <span>{country.name}</span>
          </span>
          {activeRegion && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="text-emerald-300 flex items-center gap-1">
                <span>🗺️</span>
                <span>{activeRegion.name}</span>
              </span>
            </>
          )}
          {activeProvince && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="text-teal-300 flex items-center gap-1">
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

        {/* SELETTORE GERARCHICO MULTI-LIVELLO A 3 SCALINI */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#0b1329] to-[#0d1b38] border border-cyan-500/30 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-cyan-300 tracking-wider">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Gerarchia Territoriale ({country.name})</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {availableRegions.length} Regioni / Stati federati
            </span>
          </div>

          {/* Livello 1: SELEZIONE REGIONE */}
          {availableRegions.length > 0 && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                <span>1. Regione / Stato Federale:</span>
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {availableRegions.map((reg) => {
                  const isSelected = reg.name === selectedRegionName;
                  return (
                    <button
                      key={reg.name}
                      onClick={() => handleSelectRegion(reg.name)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{reg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Livello 2: SELEZIONE PROVINCIA / DISTRETTO */}
          {availableProvinces.length > 0 && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                <span>2. Provincia / Distretto ({activeRegion?.name}):</span>
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {availableProvinces.map((prov) => {
                  const isSelected = prov.name === selectedProvinceName;
                  return (
                    <button
                      key={prov.name}
                      onClick={() => handleSelectProvince(prov.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-teal-400 text-slate-950 font-black shadow-md shadow-teal-500/30'
                          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      <span>📍</span>
                      <span>{prov.name}</span>
                      {prov.code && <span className="text-[10px] opacity-75">({prov.code})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Livello 3: SELEZIONE COMUNE / CITTÀ */}
          {availableComuni.length > 0 && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                <span>3. Comune / Città ({activeProvince?.name}):</span>
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {availableComuni.map((comune) => {
                  const isSelected = comune.name === selectedComuneName;
                  return (
                    <button
                      key={comune.name}
                      onClick={() => setSelectedComuneName(comune.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      <span>🏙️</span>
                      <span>{comune.name}</span>
                      {comune.isCapital && <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 font-bold">Capoluogo</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ricerca istantanea per qualsiasi comune / frazione non in lista */}
          <div className="pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={comuneSearch}
                onChange={(e) => setComuneSearch(e.target.value)}
                placeholder={`Cerca qualsiasi altro comune in ${country.name}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            {/* Risultati live se presenti */}
            {liveSearchResults.length > 0 && (
              <div className="mt-1.5 max-h-32 overflow-y-auto rounded-lg bg-slate-900 border border-cyan-500/40 divide-y divide-slate-800 text-xs">
                {liveSearchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onExplore) {
                        onExplore({
                          lat: item.lat,
                          lng: item.lng,
                          name: item.name,
                          country: country.name,
                          countryCode: country.id || country.code,
                          stateOrRegion: item.stateOrRegion || '',
                          province: '',
                          comune: item.name,
                          flag: country.flag || '📍',
                          lang: country.lang,
                          currency: country.currency,
                        });
                      }
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-cyan-950/40 text-slate-200 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🏙️</span>
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.stateOrRegion}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold">Entra 3D →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PULSANTE PRIMARIO: "ENTRA NEL COMUNE (VISTA 3D)" */}
        <button
          id="btn-explore-country-3d"
          onClick={handleEnterUrban}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-500/25 active:scale-98 transition-all"
        >
          <span>🏙️ Entra nel Comune: {targetPlaceName} (3D)</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Info Cards: Lingua Ufficiale e Valuta del Territorio */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-sky-400">
              <Languages className="w-3 h-3 text-sky-400" />
              <span>Lingua Ufficiale</span>
            </div>
            <div className="text-xs font-black text-slate-100 truncate">
              {country.lang || 'Italiano'}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>Valuta Territorio</span>
            </div>
            <div className="text-xs font-black text-amber-300 truncate">
              {country.currency || 'EUR (€)'}
            </div>
          </div>
        </div>

        {/* LOGICA STRETTA DI MANO - SCHEDA ANNUNCIO TERRITORIALE NEL COMUNE SELEZIONATO */}
        <div className="p-3 rounded-xl bg-[#0b1329]/90 border border-emerald-500/30 flex flex-col gap-1.5 shadow-inner">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                Annuncio Comunitario a {targetPlaceName}
              </span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/80 text-amber-300 font-bold border border-slate-700">
              {displayListing.intent || 'BARATTO'}
            </span>
          </div>

          <div className="text-xs font-bold text-white leading-snug">
            {displayListing.title}
          </div>

          {/* Indicatore Privacy Geografica */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">
              {targetPlaceName} ({country.name}) • Coordinate: {targetLat.toFixed(2)}°, {targetLng.toFixed(2)}°
            </span>
          </div>

          {/* PULSANTE CONTATTA STRETTA DI MANO */}
          <button
            id="btn-country-contact-handshake"
            onClick={() => {
              if (onContactListing) {
                onContactListing(displayListing);
              }
            }}
            className="w-full mt-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-98 transition-all border border-emerald-300/40"
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Contatta per Consegna a Mano</span>
          </button>
        </div>
      </div>
    </div>
  );
}

