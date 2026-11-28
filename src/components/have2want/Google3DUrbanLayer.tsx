import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Building2, CheckCircle2 } from 'lucide-react';

interface Google3DUrbanLayerProps {
  lat: number;
  lng: number;
  pitch?: number;
  bearing?: number;
  cityName?: string;
  onFallbackToOpenData?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-map-3d': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        center?: string;
        range?: string | number;
        tilt?: string | number;
        heading?: string | number;
        mode?: string;
      };
    }
  }
}

export function getConfiguredGoogleMapsKey(): string {
  try {
    const raw = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!trimmed || trimmed === 'MY_GOOGLE_MAPS_API_KEY' || trimmed === 'PLACEHOLDER') return '';
    return trimmed;
  } catch {
    return '';
  }
}

let maps3dPromise: Promise<boolean> | null = null;

function ensureGoogleMaps3dLoaded(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  if ((window as any).customElements?.get?.('gmp-map-3d')) {
    return Promise.resolve(true);
  }
  if (maps3dPromise) return maps3dPromise;

  maps3dPromise = new Promise((resolve) => {
    const existing = document.getElementById('h2w-google-maps-3d-sdk');
    if (existing) {
      resolve(Boolean((window as any).customElements?.get?.('gmp-map-3d')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'h2w-google-maps-3d-sdk';
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=alpha&libraries=maps3d`;
    script.onload = () => {
      resolve(Boolean((window as any).customElements?.get?.('gmp-map-3d')));
    };
    script.onerror = () => {
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return maps3dPromise;
}

export default function Google3DUrbanLayer({
  lat,
  lng,
  pitch = 60,
  bearing = 15,
  cityName = 'Città',
  onFallbackToOpenData,
}: Google3DUrbanLayerProps) {
  const apiKey = getConfiguredGoogleMapsKey();
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const mapElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    let alive = true;
    ensureGoogleMaps3dLoaded(apiKey).then((ok) => {
      if (!alive) return;
      if (ok) {
        setSdkReady(true);
        setSdkError(false);
      } else {
        setSdkError(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-md w-full bg-zinc-950 border border-amber-500/40 rounded-3xl p-5 text-white shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Photorealistic 3D Tiles — Chiave Google Maps non configurata</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            La modalità opzionale Google Photorealistic 3D Tiles richiede{' '}
            <code className="text-sky-300">VITE_GOOGLE_MAPS_API_KEY</code> con progetto GCP abilitato. Nessuna
            chiamata a pagamento è attiva al momento.
          </p>
          {onFallbackToOpenData && (
            <button
              type="button"
              onClick={onFallbackToOpenData}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs cursor-pointer"
            >
              Usa Modalità 3D Architettonica Open-Data (Gratuita)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-md w-full bg-zinc-950 border border-red-500/40 rounded-3xl p-5 text-white shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-red-300 font-black text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Google Photorealistic 3D Tiles non caricabile</span>
          </div>
          <p className="text-xs text-zinc-300">
            Verifica la quota o i referrer consentiti della tua API Key Google Maps Platform.
          </p>
          {onFallbackToOpenData && (
            <button
              type="button"
              onClick={onFallbackToOpenData}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs cursor-pointer"
            >
              Torna alla Modalità Open-Data 3D
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/85 text-xs text-sky-300 font-bold">
        Caricamento Google Photorealistic 3D Tiles per {cityName}...
      </div>
    );
  }

  const clampedTilt = Math.max(0, Math.min(80, Math.round(pitch)));
  const normalizedHeading = ((Math.round(bearing) % 360) + 360) % 360;

  return (
    <div className="absolute inset-0 z-10 w-full h-full bg-black">
      {React.createElement('gmp-map-3d', {
        ref: mapElRef,
        center: `${lat},${lng},45`,
        range: '650',
        tilt: String(clampedTilt),
        heading: String(normalizedHeading),
        mode: 'HYBRID',
        style: { width: '100%', height: '100%', display: 'block' },
      })}
      <div className="absolute top-28 left-3 z-20 pointer-events-none px-2.5 py-1 rounded-xl bg-black/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5 shadow-lg">
        <Building2 className="w-3.5 h-3.5" />
        <span>Google Photorealistic 3D Tiles</span>
        <CheckCircle2 className="w-3 h-3 text-[#00ff66]" />
      </div>
    </div>
  );
}
