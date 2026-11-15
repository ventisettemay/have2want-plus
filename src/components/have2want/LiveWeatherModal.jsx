import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  X,
  Wind,
  Droplets,
  CloudRain,
  Eye,
  Clock,
  Sparkles,
  Thermometer,
  Compass,
  Check,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Gauge,
  Radio,
  Calendar,
  Layers,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { getLocalTimeString } from '@/lib/worldAtlas';
import { getRealtimeWeather, getRainViewerRadarData } from '@/lib/weatherService';

export default function LiveWeatherModal({
  isOpen,
  onClose,
  weather: initialWeather,
  place,
  country,
  weatherEffectsEnabled = true,
  onToggleWeatherEffects
}) {
  const [weather, setWeather] = useState(initialWeather || null);
  const [isLoading, setIsLoading] = useState(!initialWeather);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('CURRENT'); // 'CURRENT' | '14DAYS' | 'RADAR'
  const [radarData, setRadarData] = useState(null);
  const [isRadarLoading, setIsRadarLoading] = useState(false);

  // Determina la località target (da place o da country o default Italia/Roma)
  const targetPlace = place || (country ? {
    name: country.capital || country.name,
    countryName: country.name,
    lat: country.lat,
    lng: country.lng,
    timezone: country.timezone || 'Europe/Rome'
  } : {
    name: 'Roma',
    countryName: 'Italia',
    lat: 41.8902,
    lng: 12.4922,
    timezone: 'Europe/Rome'
  });

  const loadLiveWeather = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const lat = targetPlace.lat ?? 41.8902;
      const lng = targetPlace.lng ?? 12.4922;
      const liveData = await getRealtimeWeather(lat, lng);
      if (liveData) {
        setWeather(liveData);
      } else {
        setLoadError('Dati meteo al momento non disponibili dalla stazione di rilevamento.');
      }
    } catch (err) {
      console.error('Errore caricamento meteo:', err);
      setLoadError('Impossibile stabilire la connessione con la telemetria meteo.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRadar = async () => {
    setIsRadarLoading(true);
    try {
      const data = await getRainViewerRadarData();
      setRadarData(data);
    } catch (e) {
      console.warn('Errore radar:', e);
    } finally {
      setIsRadarLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialWeather) {
        setWeather(initialWeather);
        setIsLoading(false);
      } else {
        loadLiveWeather();
      }
      loadRadar();
    }
  }, [isOpen, initialWeather, targetPlace.lat, targetPlace.lng]);

  if (!isOpen) return null;

  const cond = weather?.condition || {
    label: 'In Rilevamento',
    icon: '🌦️',
    description: 'Sincronizzazione parametri meteorologici...',
  };

  const localTime = getLocalTimeString(targetPlace?.timezone || 'Europe/Rome');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header Modale Meteo */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-2xl shadow-inner shadow-sky-500/20">
              {cond.icon || '🌦️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-sky-400">TELEMETRIA METEOROLOGICA MONDIALE</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-[#00ff66] border border-emerald-500/30">REALE</span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>{targetPlace?.name}</span>
                <span className="text-xs font-normal text-zinc-400">({targetPlace?.countryName})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLiveWeather}
              disabled={isLoading}
              title="Aggiorna dati meteo"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selettore: Tempo Attuale / Previsioni 14 Giorni / Radar Doppler */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('CURRENT')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'CURRENT' ? 'bg-sky-500 text-black font-black shadow-lg shadow-sky-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Condizioni & 24h</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('14DAYS')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === '14DAYS' ? 'bg-sky-500 text-black font-black shadow-lg shadow-sky-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Previsioni 14 Giorni</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RADAR')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'RADAR' ? 'bg-[#00ff66] text-black font-black shadow-lg shadow-[#00ff66]/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radar Precipitazioni</span>
          </button>
        </div>

        {/* Contenuto Principale */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-xs text-zinc-300 font-mono">Connessione ai modelli ECMWF & NOAA per {targetPlace?.name}...</p>
          </div>
        ) : loadError ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-center flex flex-col gap-2">
            <p className="text-xs">{loadError}</p>
            <button
              onClick={loadLiveWeather}
              className="self-center px-3 py-1 rounded bg-red-900 hover:bg-red-800 text-xs font-bold text-white cursor-pointer"
            >
              Riprova connessione
            </button>
          </div>
        ) : weather ? (
          <>
            {activeTab === 'CURRENT' && (
              <div className="flex flex-col gap-3">
                {/* Blocco Principale: Temperatura, Condizione Ufficiale WMO e Ora Locale */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between shadow-inner">
                  <div>
                    <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                      <span>{weather.temperature}</span>
                      <span className="text-xl font-bold text-sky-400">°C</span>
                    </div>
                    <div className="text-sm font-bold text-zinc-200 mt-1 flex items-center gap-2">
                      <span>{cond.label}</span>
                      <span className="text-xs text-zinc-400 font-normal">• Percepita: {weather.apparentTemperature}°C</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{cond.description}</p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-950 border border-zinc-800 text-sky-300">
                      {weather.isDay ? '☀️ Luce Diurna' : '🌙 Notte'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[#00ff66] font-mono font-bold">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Ora Locale: {localTime}</span>
                    </div>
                  </div>
                </div>

                {/* Griglia Metriche Tecniche: Vento, Direzione, Umidità, Pressione, Nubi, Pioggia */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 uppercase">
                      <Wind className="w-3.5 h-3.5 text-sky-400" />
                      <span>Vento & Direzione</span>
                    </div>
                    <div className="text-sm font-black text-white">
                      {weather.windSpeed} <span className="text-xs font-normal text-zinc-400">km/h</span>
                    </div>
                    <div className="text-[10px] text-sky-300 font-mono truncate">{weather.windDirection}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 uppercase">
                      <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Umidità Relativa</span>
                    </div>
                    <div className="text-sm font-black text-white">
                      {weather.humidity} <span className="text-xs font-normal text-zinc-400">%</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">Pressione: {weather.pressure} hPa</div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 uppercase">
                      <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copertura Nubi & Pioggia</span>
                    </div>
                    <div className="text-sm font-black text-white">
                      {weather.cloudCover} <span className="text-xs font-normal text-zinc-400">% nubi</span>
                    </div>
                    <div className="text-[10px] text-indigo-300 font-mono">Precipitazioni: {weather.precipitation} mm</div>
                  </div>
                </div>

                {/* Previsioni Orarie Prossime 24 Ore */}
                {weather.hourlyForecast && weather.hourlyForecast.length > 0 && (
                  <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3.5 flex flex-col gap-2">
                    <div className="text-[11px] font-black text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Scansione Oraria (Prossime 24 Ore)</span>
                      <span className="text-[10px] text-zinc-400 font-mono">Modello ECMWF</span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
                      {weather.hourlyForecast.map((h, i) => (
                        <div key={i} className="min-w-[62px] p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center gap-1 shrink-0">
                          <span className="text-[10px] text-zinc-400 font-mono">{h.time}</span>
                          <span className="text-base">{h.condition?.icon || '☀️'}</span>
                          <span className="text-xs font-black text-white">{h.temp}°</span>
                          <span className="text-[9px] text-sky-400 font-bold">{h.prob}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === '14DAYS' && (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-black text-zinc-300 uppercase tracking-wider flex items-center justify-between pb-1">
                  <span>Previsioni a 14 Giorni (Modello Ufficiale ECMWF)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Alta Risoluzione</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {weather.dailyForecast?.map((d, i) => (
                    <div key={i} className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{d.condition?.icon || '🌤️'}</span>
                        <div>
                          <div className="font-bold text-white capitalize">{d.dayName}</div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">{d.condition?.label}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-white flex items-center gap-1.5">
                          <span className="text-sky-300">{d.maxTemp}°</span>
                          <span className="text-zinc-500">/</span>
                          <span className="text-zinc-400 font-normal">{d.minTemp}°</span>
                        </div>
                        <div className="text-[10px] text-indigo-400 font-bold">Pioggia: {d.precipProb}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'RADAR' && (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#00ff66]" />
                    <div>
                      <div className="text-xs font-black text-white">Radar Precipitazioni Doppler Terrestre</div>
                      <div className="text-[10px] text-zinc-400">Rete internazionale RainViewer • Scansioni radar ogni 10 minuti</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40">
                    LIVE DOPPLER
                  </span>
                </div>

                {/* Mappa / Riquadro Radar */}
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-zinc-800 bg-slate-950 flex items-center justify-center">
                  <iframe
                    src={`https://www.rainviewer.com/map.html?loc=${targetPlace.lat},${targetPlace.lng},8&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&c=1&o=83&lm=1&layer=radar&sm=1&sn=1`}
                    title="RainViewer Doppler Live Radar"
                    className="w-full h-full border-none"
                    loading="lazy"
                  />
                </div>

                <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>Visualizzazione radar Doppler delle celle temporalesche e pioggia</span>
                  <span className="font-mono text-zinc-500">Fonte: RainViewer Doppler Network</span>
                </div>
              </div>
            )}

            {/* Trasparenza Fonti Dati */}
            <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fonte Dati: {weather.dataSource}</span>
              </div>
              <span>Rilevamento: {new Date(weather.lastUpdated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Controllo Strato Atmosferico Dinamico 3D */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00ff66]" />
                <div>
                  <div className="font-bold text-white">Simulazione Atmosferica Dinamica sul Globo 3D</div>
                  <div className="text-[10px] text-zinc-400">
                    Nubi troposferiche e precipitazioni proporzionate alle coordinate geografiche
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleWeatherEffects && onToggleWeatherEffects(!weatherEffectsEnabled)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-700 text-xs font-bold cursor-pointer transition-colors"
              >
                {weatherEffectsEnabled ? (
                  <>
                    <span className="text-[#00ff66] font-black">Attive</span>
                    <ToggleRight className="w-5 h-5 text-[#00ff66]" />
                  </>
                ) : (
                  <>
                    <span className="text-zinc-400">Disattivate</span>
                    <ToggleLeft className="w-5 h-5 text-zinc-500" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : null}

        {/* Footer con Azione */}
        <div className="flex items-center justify-end pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider cursor-pointer transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Chiudi Telemetria Meteo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
