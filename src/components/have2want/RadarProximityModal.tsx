import React, { useState, useEffect, useRef } from 'react';
import { X, Radio, MapPin, UserCheck, RefreshCw, Settings, Layers, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RadarProximityModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
}

interface RadarMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: 'user' | 'business' | 'event' | 'emergency';
  distanceKm: number;
  lastSeen: number;
}

export const RadarProximityModal: React.FC<RadarProximityModalProps> = ({
  isOpen = true,
  onClose = () => {},
  centerLat = 44.3845,
  centerLng = 7.5427,
  radiusKm = 35,
}) => {
  if (!isOpen) return null;

  const [markers, setMarkers] = useState<RadarMarker[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showUsers, setShowUsers] = useState(true);
  const [showBusinesses, setShowBusinesses] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const scanIntervalRef = useRef<number | null>(null);

  // Simula scansione radar (in produzione: geolocalizzazione reale + WebSocket/P2P)
  const performScan = () => {
    setIsScanning(true);
    toast.info('📡 RADAR-SCAN: Scansione prossimità 35 km avviata...');

    // Genera marker simulati intorno al centro
    const newMarkers: RadarMarker[] = [];
    const types: RadarMarker['type'][] = ['user', 'business', 'event', 'emergency'];
    const labels = [
      'Marco R.', 'Laura B.', 'Officina Pi', 'Caffè Km0', 'Evento Community',
      'Punto Incontro', 'Andrea M.', 'Bottega Bio', 'Carpool Attivo', 'Soccorso Stradale'
    ];

    for (let i = 0; i < 8 + Math.floor(Math.random() * 6); i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusKm;
      const latOffset = (distance / 111) * Math.cos(angle);
      const lngOffset = (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
      const type = types[Math.floor(Math.random() * types.length)];

      newMarkers.push({
        id: `radar_${Date.now()}_${i}`,
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
        label: labels[Math.floor(Math.random() * labels.length)],
        type,
        distanceKm: Math.round(distance * 10) / 10,
        lastSeen: Date.now() - Math.random() * 300000,
      });
    }

    setMarkers(newMarkers);
    setIsScanning(false);
    toast.success(`📡 RADAR-SCAN: ${newMarkers.length} marker rilevati entro ${radiusKm} km`);
  };

  // Auto-scan all'apertura
  useEffect(() => {
    performScan();
    scanIntervalRef.current = window.setInterval(performScan, 60000); // Ogni 60s
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (m.type === 'user' && !showUsers) return false;
    if (m.type === 'business' && !showBusinesses) return false;
    if (m.type === 'event' && !showEvents) return false;
    if (m.type === 'emergency' && !showEmergencies) return false;
    return true;
  });

  const typeConfig: Record<RadarMarker['type'], { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    user: { icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30' },
    business: { icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-400/30' },
    event: { icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-400/30' },
    emergency: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15 border-red-400/30' },
  };

  const typeLabels: Record<RadarMarker['type'], string> = {
    user: 'Utenti Pi',
    business: 'Attività',
    event: 'Eventi',
    emergency: 'Emergenze',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-orange-900/40 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-amber-300 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>RADAR PROSSIMITÀ</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                  RADAR-SCAN · {radiusKm} km
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Marker territoriali locali, geolocalizzazione P2P, prossimità reale</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={performScan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scansione...' : 'Scansiona'}</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtri Layer */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-black/30 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider mr-2">Layer:</span>
          {(
            [
              { key: 'user', label: '👤 Utenti', active: showUsers, toggle: setShowUsers },
              { key: 'business', label: '🏪 Attività', active: showBusinesses, toggle: setShowBusinesses },
              { key: 'event', label: '🎯 Eventi', active: showEvents, toggle: setShowEvents },
              { key: 'emergency', label: '🆘 Emergenze', active: showEmergencies, toggle: setShowEmergencies },
            ] as const
          ).map(({ key, label, active, toggle }) => (
            <button
              key={key}
              onClick={() => toggle(!active)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                active
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[10px] text-zinc-400">
            {filteredMarkers.length} marker visibili · Centro: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
          </span>
        </div>

        {/* Lista Marker */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMarkers.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Radio className="w-16 h-16 mx-auto mb-4 text-amber-500/30" />
              <p className="text-sm">Nessun marker rilevato</p>
              <p className="text-xs mt-2">Avvia una scansione o allarga il raggio</p>
            </div>
          ) : (
            filteredMarkers.map((marker) => {
              const config = typeConfig[marker.type];
              const Icon = config.icon;
              const timeAgo = Math.round((Date.now() - marker.lastSeen) / 60000);
              return (
                <div
                  key={marker.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/30 transition-colors flex items-center gap-3 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white truncate">{marker.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${config.bg} ${config.color} border`}>
                        {typeLabels[marker.type]}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[9px] font-mono border border-zinc-700">
                        {marker.distanceKm} km
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Lat: {marker.lat.toFixed(5)}, Lng: {marker.lng.toFixed(5)} · Aggiornato {timeAgo} min fa
                    </p>
                  </div>
                  <button className="p-2 rounded-xl bg-zinc-800 hover:bg-amber-950/40 text-zinc-400 hover:text-amber-300 border border-zinc-700 shrink-0 transition-colors" title="Centra su questo marker">
                    <Target className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Info servizi gratuiti */}
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[10px] text-zinc-400">
          <strong className="text-zinc-300">RADAR-SCAN — </strong>
          Scansione prossimità 35 km simulata (client-side).
          In produzione: geolocalizzazione browser + BroadcastChannel/WebRTC data channel per sync P2P.
          Servizi gratuiti: STUN Google + TURN OpenRelay (metered.ca) per connettività.
        </div>
      </div>
    </div>
  );
};

export default RadarProximityModal;