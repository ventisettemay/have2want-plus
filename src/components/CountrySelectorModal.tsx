import React, { useState, useMemo } from 'react';
import { Search, X, Globe, Check, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRIES, CountryData } from '../data/countries';

interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: CountryData | null;
  onSelectCountry: (country: CountryData | null) => void;
  listingsCountsByCountry?: Record<string, number>;
}

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCountry,
  onSelectCountry,
  listingsCountsByCountry = {}
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContinent, setActiveContinent] = useState<string>('ALL');

  const CONTINENTS = [
    { id: 'ALL', label: 'Tutti i Continenti' },
    { id: 'Europa', label: 'Europa' },
    { id: 'Nord America', label: 'Nord America' },
    { id: 'Sud America', label: 'Sud America' },
    { id: 'Asia', label: 'Asia' },
    { id: 'Africa', label: 'Africa' },
    { id: 'Oceania', label: 'Oceania' },
  ];

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter((country) => {
      if (activeContinent !== 'ALL' && country.continent !== activeContinent) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = country.name.toLowerCase().includes(q);
        const matchesCapital = country.capital.toLowerCase().includes(q);
        const matchesLang = country.lang.toLowerCase().includes(q);
        const matchesId = country.id.toLowerCase() === q;
        if (!matchesName && !matchesCapital && !matchesLang && !matchesId) return false;
      }
      return true;
    });
  }, [searchQuery, activeContinent]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[85vh] bg-[#0e0e11] rounded-2xl flex flex-col text-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-900 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#00ff66]" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Seleziona Nazione o Territorio
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Esplora il globo 3D e gli annunci locali del paese che preferisci
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Continent Filters */}
          <div className="p-4 border-b border-zinc-900 space-y-3 shrink-0 bg-black/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Cerca per nazione, capitale o lingua (es. Spagna, Parigi, USA...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900/90 text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#00ff66] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Continent Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {CONTINENTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveContinent(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    activeContinent === c.id
                      ? 'bg-[#00ff66] text-black font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Paesi */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none">
            {/* Opzione Globale: Tutto il Mondo */}
            <button
              onClick={() => {
                onSelectCountry(null);
                onClose();
              }}
              className={`w-full p-3.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                selectedCountry === null
                  ? 'bg-zinc-900 border-l-4 border-[#00ff66]'
                  : 'bg-black/60 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span>Tutto il Mondo (Globale)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Vista Planetaria
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Nessun filtro geografico • Visualizza l'intero pianeta
                  </p>
                </div>
              </div>
              {selectedCountry === null && (
                <div className="w-6 h-6 rounded-full bg-[#00ff66] text-black flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Opzione Continente Intero (es. Tutta l'Africa, Tutta l'Europa) */}
            {activeContinent !== 'ALL' && (
              <button
                onClick={() => {
                  const continentConfigs: Record<string, CountryData> = {
                    'Africa': {
                      id: 'africa',
                      name: 'Africa',
                      flag: '🌍',
                      currency: 'Valute Locali (Pi Network)',
                      lang: 'Lingue Africane (Swahili, Arabo, Inglese, Francese)',
                      lat: 2.0,
                      lng: 21.0,
                      capital: 'Continente Africano',
                      continent: 'Africa',
                    },
                    'Europa': {
                      id: 'europa',
                      name: 'Europa',
                      flag: '🇪🇺',
                      currency: 'EUR (€)',
                      lang: 'Lingue Europee',
                      lat: 50.0,
                      lng: 10.0,
                      capital: 'Bruxelles',
                      continent: 'Europa',
                    },
                    'Asia': {
                      id: 'asia',
                      name: 'Asia',
                      flag: '🌏',
                      currency: 'Valute Asiatiche (Pi Network)',
                      lang: 'Lingue Asiatiche',
                      lat: 34.0,
                      lng: 100.0,
                      capital: 'Continente Asiatico',
                      continent: 'Asia',
                    },
                    'Nord America': {
                      id: 'nord-america',
                      name: 'Nord America',
                      flag: '🌎',
                      currency: 'USD / CAD',
                      lang: 'Inglese / Francese / Spagnolo',
                      lat: 40.0,
                      lng: -100.0,
                      capital: 'Continente Nordamericano',
                      continent: 'Nord America',
                    },
                    'Sud America': {
                      id: 'sud-america',
                      name: 'Sud America',
                      flag: '🌎',
                      currency: 'Valute Sudamericane',
                      lang: 'Spagnolo / Portoghese',
                      lat: -15.0,
                      lng: -60.0,
                      capital: 'Continente Sudamericano',
                      continent: 'Sud America',
                    },
                    'Oceania': {
                      id: 'oceania',
                      name: 'Oceania',
                      flag: '🌏',
                      currency: 'AUD / NZD',
                      lang: 'Inglese',
                      lat: -25.0,
                      lng: 135.0,
                      capital: 'Oceania',
                      continent: 'Oceania',
                    },
                  };

                  const config = continentConfigs[activeContinent] || {
                    id: activeContinent.toLowerCase().replace(/\s+/g, '-'),
                    name: activeContinent,
                    flag: '🌍',
                    currency: 'Valute Locali',
                    lang: 'Lingue Locali',
                    lat: 0,
                    lng: 0,
                    capital: activeContinent,
                    continent: activeContinent as any,
                  };

                  onSelectCountry(config);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer border ${
                  selectedCountry?.id === activeContinent.toLowerCase().replace(/\s+/g, '-')
                    ? 'bg-emerald-950/80 border-[#00ff66]'
                    : 'bg-zinc-900/90 hover:bg-zinc-850 border-emerald-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {activeContinent === 'Africa' ? '🌍' : activeContinent === 'Europa' ? '🇪🇺' : activeContinent.includes('America') ? '🌎' : '🌏'}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                      <span>Tutta l'{activeContinent} (Continente)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-[#00ff66]">
                        Filtro Macro Continente
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Visualizza tutti gli annunci e i pionieri dell'{activeContinent}
                    </p>
                  </div>
                </div>
                {selectedCountry?.id === activeContinent.toLowerCase().replace(/\s+/g, '-') && (
                  <div className="w-6 h-6 rounded-full bg-[#00ff66] text-black flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            )}

            {/* Separatore */}
            <div className="py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                Nazioni Disponibili ({filteredCountries.length})
              </span>
            </div>

            {/* Griglia Paesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredCountries.map((country) => {
                const isSelected = selectedCountry?.id === country.id;
                const count = listingsCountsByCountry[country.id.toLowerCase()] || 0;

                return (
                  <button
                    key={country.id}
                    onClick={() => {
                      onSelectCountry(country);
                      onClose();
                    }}
                    className={`p-3 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-zinc-900 border-l-4 border-[#00ff66]'
                        : 'bg-black/60 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                        {country.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1.5">
                          <span className={isSelected ? 'text-[#00ff66]' : ''}>{country.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">
                            ({country.id})
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate flex items-center gap-2">
                          <span>{country.capital}</span>
                          <span>•</span>
                          <span className="text-zinc-400">{country.continent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {count > 0 && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black text-[#00ff66]">
                          {count} annunci
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#00ff66] text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredCountries.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <Globe className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs sm:text-sm font-bold text-white">Nessuna nazione trovata</p>
                <p className="text-xs text-zinc-400">Verifica i termini di ricerca o seleziona un altro continente.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-zinc-900 bg-black/60 flex items-center justify-between text-xs text-zinc-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Rotazione 3D e zoom istantaneo sulla nazione scelta</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold cursor-pointer transition-colors"
            >
              Chiudi
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
