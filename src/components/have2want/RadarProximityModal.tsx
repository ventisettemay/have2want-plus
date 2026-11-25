import React, { useMemo, useState } from 'react';
import { Radar, X, MapPin, Navigation, Handshake } from 'lucide-react';
import { haversineDistanceKm } from '@/lib/geoPrivacy';
import { isValidCoord } from '@/lib/worldAtlas';

export interface RadarProximityModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings?: any[];
  businesses?: any[];
  centerLat?: number;
  centerLng?: number;
  territoryLabel?: string;
  onSelectListing?: (item: any) => void;
  onFlyToCoords?: (lat: number, lng: number, label: string) => void;
}

const RADIUS_OPTIONS = [5, 25, 80, 250];

export default function RadarProximityModal({
  isOpen,
  onClose,
  listings = [],
  businesses = [],
  centerLat = 41.9028,
  centerLng = 12.4964,
  territoryLabel = 'Zona Attuale',
  onSelectListing,
  onFlyToCoords,
}: RadarProximityModalProps) {
  const [radiusKm, setRadiusKm] = useState<number>(80);

  const nearbyResults = useMemo(() => {
    const items: Array<{
      id: string;
      kind: 'ANNUNCIO' | 'ATTIVITA';
      title: string;
      city: string;
      distanceKm: number;
      lat: number;
      lng: number;
      raw: any;
    }> = [];

    const hasCenter = isValidCoord(centerLat, centerLng);

    listings.forEach((l) => {
      if (isValidCoord(l?.lat, l?.lng)) {
        const dist = hasCenter ? haversineDistanceKm(centerLat, centerLng, l.lat, l.lng) : 0;
        if (dist <= radiusKm) {
          items.push({
            id: `l-${l.id}`,
            kind: 'ANNUNCIO',
            title: l.title || 'Annuncio Locale',
            city: l.city || l.locationArea || territoryLabel,
            distanceKm: dist,
            lat: l.lat,
            lng: l.lng,
            raw: l,
          });
        }
      }
    });

    businesses.forEach((b) => {
      if (isValidCoord(b?.lat, b?.lng)) {
        const dist = hasCenter ? haversineDistanceKm(centerLat, centerLng, b.lat, b.lng) : 0;
        if (dist <= radiusKm) {
          items.push({
            id: `b-${b.id}`,
            kind: 'ATTIVITA',
            title: b.name || 'Attività Commerciale',
            city: b.city || b.region || territoryLabel,
            distanceKm: dist,
            lat: b.lat,
            lng: b.lng,
            raw: b,
          });
        }
      }
    });

    return items.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 24);
  }, [listings, businesses, centerLat, centerLng, radiusKm, territoryLabel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-sky-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Radar Prossimità · {territoryLabel}
              </h2>
              <p className="text-xs text-zinc-400">
                Scansione locale gratuita entro {radiusKm} km ({nearbyResults.length} elementi trovati)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer flex items-center justify-center"
            aria-label="Chiudi radar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-zinc-900 flex flex-wrap items-center gap-2 bg-black">
          {RADIUS_OPTIONS.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setRadiusKm(km)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                radiusKm === km
                  ? 'bg-sky-400 text-black'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Entro {km} km
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {nearbyResults.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 text-sm">
              Nessun annuncio o negozio nel raggio di {radiusKm} km. Prova ad aumentare la distanza.
            </div>
          ) : (
            nearbyResults.map((item) => (
              <div
                key={item.id}
                className="w-full p-3.5 rounded-2xl bg-zinc-900/75 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs text-sky-300 font-bold tabular-nums">
                    {item.kind === 'ATTIVITA' ? 'Attività locale' : 'Annuncio P2P'} · {item.distanceKm.toFixed(1)} km · {item.city}
                  </div>
                  <div className="text-sm font-black text-white break-words">{item.title}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onFlyToCoords && (
                    <button
                      type="button"
                      onClick={() => {
                        onFlyToCoords(item.lat, item.lng, item.title);
                        onClose();
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-400" />
                      <span>Vedi su Mappa</span>
                    </button>
                  )}
                  {onSelectListing && item.kind === 'ANNUNCIO' && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectListing(item.raw);
                        onClose();
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <Handshake className="w-3.5 h-3.5" />
                      <span>Apri Accordo</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
