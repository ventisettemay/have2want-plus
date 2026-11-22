import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  Landmark,
  Train,
  BookOpen,
  RefreshCw,
  Loader2,
  MapPin
} from "lucide-react";
import { CertifiedMeetingPoint } from "../types";
import { INITIAL_CERTIFIED_MEETING_POINTS } from "../data";
import { findCountryByNameOrCode, isValidCoord } from "../lib/worldAtlas";

interface CertifiedMeetingPointsModalProps {
  city: string;
  country?: string;
  lat?: number;
  lng?: number;
  onSelectMeetingPoint: (point: CertifiedMeetingPoint) => void;
  onClose: () => void;
}

const meetingPointCache = new Map<string, CertifiedMeetingPoint[]>();

function mapOverpassElementToPoint(
  el: any,
  fallbackCity: string,
  fallbackCountry: string
): CertifiedMeetingPoint | null {
  const tags = el?.tags || {};
  const elLat = typeof el.lat === "number" ? el.lat : el.center?.lat;
  const elLng = typeof el.lon === "number" ? el.lon : el.center?.lon;
  if (!isValidCoord(elLat, elLng)) return null;

  const amenity = tags.amenity || "";
  const railway = tags.railway || "";
  const nameRaw = tags.name || tags["name:it"] || tags["name:en"];

  let type: CertifiedMeetingPoint["type"] = "piazza_comunale";
  let defaultLabel = "Presidio Civico Pubblico";
  let recommendedHours = tags.opening_hours || "08:30 - 19:30";
  let securityFeatures = ["Luogo pubblico OpenStreetMap", "Area accessibile e visibile"];

  if (amenity === "police") {
    type = "stazione_polizia_carabinieri";
    defaultLabel = "Presidio Forze dell'Ordine";
    recommendedHours = tags.opening_hours || "00:00 - 24:00";
    securityFeatures = ["Presidio di sicurezza pubblico", "Videosorveglianza istituzionale"];
  } else if (railway === "station") {
    type = "stazione_ferroviaria_bus";
    defaultLabel = "Stazione Ferroviaria";
    recommendedHours = "06:30 - 22:00";
    securityFeatures = ["Alta affluenza pedonale", "Area pubblica illuminata"];
  } else if (amenity === "library") {
    type = "biblioteca_civica";
    defaultLabel = "Biblioteca Civica";
    recommendedHours = tags.opening_hours || "09:00 - 18:30";
    securityFeatures = ["Ambiente pubblico custodito", "Ideale per libri e strumenti"];
  } else if (amenity === "post_office") {
    type = "piazza_comunale";
    defaultLabel = "Ufficio Postale";
    recommendedHours = tags.opening_hours || "08:20 - 19:05";
    securityFeatures = ["Sportello pubblico presidiato", "Alta visibilità diurna"];
  } else if (amenity === "townhall") {
    type = "piazza_comunale";
    defaultLabel = "Municipio / Palazzo Comunale";
    recommendedHours = tags.opening_hours || "08:30 - 18:00";
    securityFeatures = ["Sede istituzionale comunale", "Presidio pubblico centrale"];
  }

  const cityName = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || fallbackCity || "Territorio Locale";
  const streetParts = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const address = streetParts
    ? `${streetParts}, ${cityName}`
    : `${cityName} (${elLat.toFixed(4)}, ${elLng.toFixed(4)})`;

  return {
    id: `osm-${el.type || "node"}-${el.id}`,
    name: nameRaw ? String(nameRaw) : `${defaultLabel} (${cityName})`,
    type,
    country: tags["addr:country"] || fallbackCountry || "Territorio Locale",
    region: tags["addr:state"] || tags["addr:province"] || "OSM Verificato",
    province: tags["addr:province"] || "OSM",
    city: cityName,
    address,
    lat: elLat,
    lng: elLng,
    securityFeatures,
    recommendedHours,
    description: `Nodo civico reale estratto da OpenStreetMap Overpass (${defaultLabel}). Punto pubblico consigliato per consegna a mano con PIN protetto.`,
  };
}

export const CertifiedMeetingPointsModal: React.FC<CertifiedMeetingPointsModalProps> = ({
  city,
  country,
  lat,
  lng,
  onSelectMeetingPoint,
  onClose,
}) => {
  const normalizedCity = (city || "").trim();
  const [points, setPoints] = useState<CertifiedMeetingPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState<string>("Ricerca presidi reali...");

  const loadRealMeetingPoints = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setFetchError(null);

    const curatedMatches = normalizedCity
      ? INITIAL_CERTIFIED_MEETING_POINTS.filter((p) =>
          p.city.toLowerCase().includes(normalizedCity.toLowerCase())
        )
      : [];

    const cacheKey = `${normalizedCity.toLowerCase()}|${isValidCoord(lat, lng) ? `${lat!.toFixed(2)},${lng!.toFixed(2)}` : "none"}`;
    if (!forceRefresh && meetingPointCache.has(cacheKey)) {
      const cached = meetingPointCache.get(cacheKey)!;
      setPoints(cached);
      setSelectedPointId(cached[0]?.id || "");
      setSourceNote("OpenStreetMap Overpass + Nodi Curati (cache locale)");
      setIsLoading(false);
      return;
    }

    let searchLat = isValidCoord(lat, lng) ? lat : undefined;
    let searchLng = isValidCoord(lat, lng) ? lng : undefined;
    let resolvedCountry = (country || "").trim();

    const atlasMatch =
      findCountryByNameOrCode(normalizedCity) ||
      findCountryByNameOrCode(country || "");
    if (!resolvedCountry && atlasMatch?.name) {
      resolvedCountry = atlasMatch.name;
    }

    try {
      // Se non ci sono coordinate esplicite ma c'è un nome città, geocodifica reale via Nominatim
      if (!isValidCoord(searchLat, searchLng) && normalizedCity && normalizedCity.toLowerCase() !== "territorio") {
        const nomQuery = resolvedCountry ? `${normalizedCity}, ${resolvedCountry}` : normalizedCity;
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(nomQuery)}`,
          { headers: { Accept: "application/json" } }
        );
        if (nomRes.ok) {
          const nomJson = await nomRes.json();
          if (Array.isArray(nomJson) && nomJson[0]) {
            const pLat = parseFloat(nomJson[0].lat);
            const pLng = parseFloat(nomJson[0].lon);
            if (isValidCoord(pLat, pLng)) {
              searchLat = pLat;
              searchLng = pLng;
            }
          }
        }
      }

      if (!isValidCoord(searchLat, searchLng)) {
        if (curatedMatches.length > 0) {
          setPoints(curatedMatches);
          setSelectedPointId(curatedMatches[0].id);
          setSourceNote("Elenco presidi verificati di piattaforma");
        } else {
          setPoints([]);
          setSelectedPointId("");
          setSourceNote("Coordinate non disponibili");
          setFetchError("Inserisci una città valida o attiva il GPS per interrogare i presidi pubblici reali su OpenStreetMap.");
        }
        setIsLoading(false);
        return;
      }

      const overpassQuery = `[out:json][timeout:12];(node["amenity"~"^(townhall|police|library|post_office)$"](around:5000,${searchLat},${searchLng});way["amenity"~"^(townhall|police|library|post_office)$"](around:5000,${searchLat},${searchLng});node["railway"="station"](around:5000,${searchLat},${searchLng}););out center 18;`;
      let overJson: any = null;
      let lastOverpassError = "Overpass non raggiungibile";

      try {
        const proxyCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        const proxyTimer = proxyCtrl ? setTimeout(() => proxyCtrl.abort(), 11000) : null;
        const proxyRes = await fetch("/api/osm/overpass", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: overpassQuery }),
          ...(proxyCtrl ? { signal: proxyCtrl.signal } : {}),
        });
        if (proxyTimer) clearTimeout(proxyTimer);
        if (proxyRes.ok) {
          overJson = await proxyRes.json();
        }
      } catch {
        // Fallback ai mirror pubblici sotto
      }

      if (!overJson) {
        const overpassMirrors = [
          "https://overpass.openstreetmap.fr/api/interpreter",
          "https://overpass-api.de/api/interpreter",
          "https://overpass.private.coffee/api/interpreter",
        ];
        for (const mirror of overpassMirrors) {
          const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
          const timer = controller ? setTimeout(() => controller.abort(), 9000) : null;
          try {
            const overRes = await fetch(mirror, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Accept: "application/json",
              },
              body: `data=${encodeURIComponent(overpassQuery)}`,
              ...(controller ? { signal: controller.signal } : {}),
            });
            if (timer) clearTimeout(timer);
            if (!overRes.ok) {
              lastOverpassError = `Overpass HTTP ${overRes.status}`;
              continue;
            }
            overJson = await overRes.json();
            break;
          } catch (err: any) {
            if (timer) clearTimeout(timer);
            lastOverpassError = err?.name === "AbortError" ? "Timeout Overpass" : (err?.message || lastOverpassError);
          }
        }
      }

      if (!overJson) {
        throw new Error(lastOverpassError);
      }
      const osmPoints = (Array.isArray(overJson?.elements) ? overJson.elements : [])
        .map((el: any) => mapOverpassElementToPoint(el, normalizedCity || "Area Selezionata", resolvedCountry))
        .filter(Boolean) as CertifiedMeetingPoint[];

      // Deduplica per nome normalizzato e fondi eventuali nodi curati della città
      const seenNames = new Set<string>();
      const merged: CertifiedMeetingPoint[] = [];
      for (const p of [...curatedMatches, ...osmPoints]) {
        const key = p.name.trim().toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          merged.push(p);
        }
        if (merged.length >= 12) break;
      }

      meetingPointCache.set(cacheKey, merged);
      setPoints(merged);
      setSelectedPointId(merged[0]?.id || "");
      setSourceNote(
        osmPoints.length > 0
          ? `OpenStreetMap Overpass (${osmPoints.length} presidi reali trovati)`
          : curatedMatches.length > 0
          ? "Nodi civici verificati di piattaforma"
          : "Nessun presidio restituito nel raggio di 5 km"
      );
      if (merged.length === 0) {
        setFetchError(`Nessun municipio, stazione, biblioteca o presidio pubblico trovato su OpenStreetMap nel raggio di 5 km da "${normalizedCity || "questo punto"}".`);
      }
    } catch (err: any) {
      if (curatedMatches.length > 0) {
        setPoints(curatedMatches);
        setSelectedPointId(curatedMatches[0].id);
        setSourceNote("Nodi curati locali (Overpass temporaneamente non raggiungibile)");
      } else {
        setPoints([]);
        setSelectedPointId("");
        setSourceNote("Servizio OpenStreetMap non raggiungibile");
        setFetchError("Impossibile contattare OpenStreetMap Overpass in questo momento. Riprova tra qualche istante.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [normalizedCity, country, lat, lng]);

  useEffect(() => {
    loadRealMeetingPoints(false);
  }, [loadRealMeetingPoints]);

  const activePoint = points.find((p) => p.id === selectedPointId) || points[0];

  const getPointIcon = (type: string) => {
    switch (type) {
      case "biblioteca_civica":
        return <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />;
      case "stazione_polizia_carabinieri":
      case "stazione_ferroviaria_bus":
        return <Train className="w-4 h-4 text-sky-400 shrink-0" />;
      default:
        return <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Punti di Incontro Certificati</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Dati Reali OSM
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Presidi pubblici reali per lo scambio fisico sicuro e Stretta di Mano Digitale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200 leading-relaxed">
              I punti elencati provengono esclusivamente da dati cartografici reali (<b>OpenStreetMap Overpass</b>: municipi, stazioni, forze dell'ordine, biblioteche, uffici postali) e dai nodi verificati della piattaforma.
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zona: <strong className="text-white">{city || "Area GPS"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {points.length} Presidi Reali
                </span>
                <button
                  type="button"
                  onClick={() => loadRealMeetingPoints(true)}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="Ricarica presidi da OpenStreetMap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Fonte: <span className="text-slate-200">{sourceNote}</span>
            </div>

            {isLoading ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">
                  Interrogazione OpenStreetMap Overpass per presidi pubblici reali vicino a {city || "te"}...
                </p>
              </div>
            ) : fetchError && points.length === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col items-center text-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400" />
                <p className="text-xs text-amber-200 leading-relaxed max-w-md">{fetchError}</p>
                <button
                  type="button"
                  onClick={() => loadRealMeetingPoints(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Riprova Ricerca Reale</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {points.map((point) => {
                  const isSelected = point.id === selectedPointId;
                  return (
                    <div
                      key={point.id}
                      onClick={() => setSelectedPointId(point.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getPointIcon(point.type)}
                            <h4 className="text-sm font-bold text-white">{point.name}</h4>
                          </div>
                          <p className="text-xs text-slate-400 font-mono pl-6">{point.address}</p>
                          <p className="text-xs text-slate-300 pl-6 pt-1 leading-relaxed">
                            {point.description}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center">
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-slate-700"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pl-6 flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Orari consigliati: {point.recommendedHours}</span>
                        </span>
                        {point.securityFeatures.map((sec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-medium"
                          >
                            ✓ {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Annulla
          </button>

          <button
            disabled={!activePoint || isLoading}
            onClick={() => {
              if (activePoint) {
                onSelectMeetingPoint(activePoint);
                onClose();
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-400/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Fissa Punto d'Incontro Protetto</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
