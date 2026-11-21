import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Truck, Footprints, Car, Maximize2, Minimize2, Compass, CloudSun, Wind, Droplets, Thermometer, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getRealtimeWeather } from '@/lib/weatherService';
import { calculateRealRoute } from '@/lib/routingService';

interface WeatherAlongRoutePoint {
  lat: number;
  lng: number;
  distanceFromStartKm: number;
  weather: Awaited<ReturnType<typeof getRealtimeWeather>> | null;
}

interface MeteoNavigazioneModalProps {
  isOpen: boolean;
  onClose: () => void;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  profile?: 'driving' | 'walking' | 'cycling';
  startName?: string;
  endName?: string;
}

export default function MeteoNavigazioneModal({
  isOpen,
  onClose,
  startLat,
  startLng,
  endLat,
  endLng,
  profile = 'driving',
  startName = 'Partenza',
  endName = 'Destinazione',
}: MeteoNavigazioneModalProps) {
  const [route, setRoute] = useState<any>(null);
  const [weatherPoints, setWeatherPoints] = useState<WeatherAlongRoutePoint[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<WeatherAlongRoutePoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRouteAndWeather();
    }
  }, [isOpen, startLat, startLng, endLat, endLng, profile]);

  const loadRouteAndWeather = async () => {
    setLoadingRoute(true);
    setError(null);
    try {
      const routeData = await calculateRealRoute(startLat, startLng, endLat, endLng, profile);
      if (!routeData) throw new Error('Impossibile calcolare il percorso');
      setRoute(routeData);
      await loadWeatherAlongRoute(routeData);
    } catch (err: any) {
      setError(err?.message || 'Errore durante il calcolo del percorso e meteo');
    } finally {
      setLoadingRoute(false);
    }
  };

  const loadWeatherAlongRoute = async (routeData: any) => {
    setLoadingWeather(true);
    const steps = routeData.steps || [];
    const totalDistance = routeData.totalDistanceKm || 0;

    // Campiona punti lungo il percorso (ogni ~10km o a ogni step)
    const samplePoints: { lat: number; lng: number; distanceFromStartKm: number }[] = [];
    let accumulatedKm = 0;

    if (steps.length > 0) {
      for (const step of steps) {
        const stepKm = (step.distance || 0) / 1000;
        if (samplePoints.length === 0 || accumulatedKm - samplePoints[samplePoints.length - 1].distanceFromStartKm >= 8) {
          samplePoints.push({
            lat: step.location?.[1] || startLat,
            lng: step.location?.[0] || startLng,
            distanceFromStartKm: accumulatedKm,
          });
        }
        accumulatedKm += stepKm;
      }
    }

    // Aggiungi destinazione
    samplePoints.push({ lat: endLat, lng: endLng, distanceFromStartKm: totalDistance });

    const weatherResults = await Promise.all(
      samplePoints.map(async (p) => {
        const w = await getRealtimeWeather(p.lat, p.lng);
        return { ...p, weather: w };
      })
    );

    setWeatherPoints(weatherResults);
    setLoadingWeather(false);
  };

  if (!isOpen) return null;

  const PROFILE_LABELS = {
    driving: 'Auto (50 km/h)',
    walking: 'A Piedi (5 km/h)',
    cycling: 'Bici (15 km/h)',
  };

  const PROFILE_ICONS = {
    driving: <Car className="w-4 h-4" />,
    walking: <Footprints className="w-4 h-4" />,
    cycling: <Compass className="w-4 h-4" />,
  };

  const getConditionEmoji = (code?: number) => {
    if (!code) return '🌤️';
    if (code === 0) return '☀️';
    if ([1, 2, 3].includes(code)) return '🌤️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 56, 57].includes(code)) return '🌧️';
    if ([61, 63, 65, 66, 67].includes(code)) return '🌧️';
    if ([71, 73, 75, 77].includes(code)) return '🌨️';
    if ([80, 81, 82].includes(code)) return '🌦️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌤️';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-sky-500/15 via-zinc-900 to-black border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">METEO LUNGO IL PERCORSO</h2>
              <p className="text-[11px] text-zinc-400">
                {startName} → {endName} · {route ? `${route.totalDistanceKm.toFixed(1)} km · ${Math.round(route.totalDurationMinutes)} min` : 'Calcolo...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={profile}
              onChange={(e) => {
                const newProfile = e.target.value as 'driving' | 'walking' | 'cycling';
                loadRouteAndWeather();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold cursor-pointer"
            >
              <option value="driving">🚗 Auto</option>
              <option value="walking">🚶 A Piedi</option>
              <option value="cycling">🚴 Bici</option>
            </select>
            <button
              type="button"
              onClick={() => { loadRouteAndWeather(); }}
              disabled={loadingRoute || loadingWeather}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer disabled:opacity-50"
              aria-label="Aggiorna percorso e meteo"
            >
              <RefreshCw className={`w-4 h-4 ${(loadingRoute || loadingWeather) ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Riepilogo percorso */}
        {route && (
          <div className="px-4 py-3 border-b border-zinc-800 bg-black/50 shrink-0">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <Navigation className="w-3 h-3" />
                {route.totalDistanceKm.toFixed(1)} km
              </span>
              <span className="flex items-center gap-1 text-sky-300 font-bold">
                <Clock className="w-3 h-3" />
                {Math.round(route.totalDurationMinutes)} min
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                {PROFILE_ICONS[profile]}
                {PROFILE_LABELS[profile]}
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                {weatherPoints.filter((p) => p.weather).length}/{weatherPoints.length} punti meteo
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-950/30 border-b border-red-500/40 text-red-200 text-[11px] shrink-0">
            {error}
          </div>
        )}

        {/* Lista punti meteo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingRoute ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
            </div>
          ) : weatherPoints.length === 0 ? (
            <div className="text-center py-12">
              <CloudSun className="w-12 h-12 text-zinc-500 mx-auto" />
              <p className="text-zinc-400 mt-2">Nessun dato meteo disponibile per questo percorso.</p>
            </div>
          ) : (
            weatherPoints.map((point, idx) => {
              const w = point.weather;
              const isSelected = selectedPoint?.lat === point.lat && selectedPoint?.lng === point.lng;
              return (
                <button
                  key={`${point.lat}-${point.lng}`}
                  onClick={() => setSelectedPoint(isSelected ? null : point)}
                  className={`w-full p-3 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/40'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-300 font-bold text-sm">
                        {idx === 0 ? '🏁' : idx === weatherPoints.length - 1 ? '🏁' : (idx + 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white truncate">
                            {idx === 0 ? startName : idx === weatherPoints.length - 1 ? endName : `Punto ${idx}`}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {point.distanceFromStartKm.toFixed(1)} km
                          </span>
                          {w && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                              {w.temperature}°C
                            </span>
                          )}
                        </div>
                        {w && (
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {w.condition?.label || 'Meteo disponibile'} · Vento {w.windSpeed} km/h {w.windDirection} · Umidità {w.humidity}%
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {w && (
                        <span className="text-2xl">{getConditionEmoji(w.weatherCode)}</span>
                      )}
                    </div>
                  </div>

                  {isSelected && w && (
                    <div className="mt-3 p-3 rounded-xl bg-black border border-zinc-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Thermometer className="w-4 h-4 text-amber-400" />
                          <span>Temp: <strong className="text-white">{w.temperature}°C</strong> (percepita {w.apparentTemperature}°C)</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Droplets className="w-4 h-4 text-sky-400" />
                          <span>Umidità: <strong className="text-white">{w.humidity}%</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Wind className="w-4 h-4 text-emerald-400" />
                          <span>Vento: <strong className="text-white">{w.windSpeed} km/h {w.windDirection}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                          <span>Pressione: <strong className="text-white">{w.pressure} hPa</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300 col-span-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          <span>Coordinate: <strong className="text-white font-mono">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Fonte: {w.dataSource || 'Open-Meteo'}</span>
                        <span>Rilevato: {w.lastUpdated ? new Date(w.lastUpdated).toLocaleString('it-IT') : 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-black border-t border-zinc-800 shrink-0">
          <p className="text-[10px] text-zinc-500 text-center">
            Dati meteo Open-Meteo (ECMWF/NOAA) · Percorso OSRM Reale · Non sostituisce bollettini ufficiali per sicurezza stradale
          </p>
        </div>
      </div>
    </div>
  );
}