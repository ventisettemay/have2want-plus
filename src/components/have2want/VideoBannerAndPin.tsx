import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Volume2, VolumeX, Expand, ChevronDown, ChevronUp } from 'lucide-react';
import { publishSyncMessage, subscribeSyncMessage } from '@/lib/freeServicesConfig';

export interface VideoPinPromo {
  id: string;
  creatorName: string;
  headline: string;
  videoUrl: string;
  locationLabel?: string;
  format?: 'MUSIC' | 'VIDEO' | 'PROMO';
  thumbnailUrl?: string;
}

export interface VideoBannerAndPinProps {
  promo: VideoPinPromo;
  mode?: 'BANNER' | 'PIN';
  onClose?: () => void;
  autoPlay?: boolean;
}

export const VideoBannerAndPin: React.FC<VideoBannerAndPinProps> = ({
  promo,
  mode = 'PIN',
  onClose,
  autoPlay = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync apertura video tra schede via BroadcastChannel
  useEffect(() => {
    const unsubscribe = subscribeSyncMessage<{ id: string; kind: 'PIN' | 'BANNER' }>(
      'VIDEO_AD_TRIGGERED',
      (msg) => {
        if (msg.payload.id === promo.id && !isOpen) {
          setIsOpen(true);
        }
      }
    );
    return unsubscribe;
  }, [promo.id, isOpen]);

  useEffect(() => {
    if (isOpen && autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play bloccato dal browser, utente deve cliccare play
      });
    }
  }, [isOpen, autoPlay]);

  useEffect(() => {
    if (isFullscreen && containerRef.current) {
      const el = containerRef.current;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(console.warn);
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn);
    }
  }, [isFullscreen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.warn);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      onClose?.();
    }
    if (e.key === ' ' && isOpen) {
      e.preventDefault();
      togglePlay();
    }
    if (e.key === 'm' && isOpen) {
      toggleMute();
    }
    if (e.key === 'f' && isOpen) {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown as EventListener);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown as EventListener);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    publishSyncMessage('VIDEO_AD_TRIGGERED', { id: promo.id, kind: mode });
  };

  if (!isOpen && mode === 'PIN') {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="group relative p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 hover:border-amber-400 hover:from-amber-500/30 transition-all cursor-pointer flex items-center justify-center"
        aria-label={`Apri video: ${promo.headline}`}
        title={`${promo.headline} — ${promo.creatorName}`}
      >
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/50 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Play className="w-5 h-5 text-amber-300 ml-1" />
          {promo.thumbnailUrl && (
            <img
              src={promo.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full rounded-xl object-cover opacity-30"
            />
          )}
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 rounded-full border-2 border-black flex items-center justify-center">
          <span className="text-[8px] font-black text-white">▶</span>
        </div>
      </button>
    );
  }

  if (!isOpen && mode === 'BANNER') {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="group relative w-full min-h-[120px] sm:min-h-[160px] rounded-2xl bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-purple-900/40 border border-violet-500/40 overflow-hidden cursor-pointer transition-all hover:border-violet-400 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]"
        aria-label={`Apri banner video: ${promo.headline}`}
      >
        {promo.thumbnailUrl && (
          <img
            src={promo.thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
          />
        )}
        <div className="relative z-10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-black/50 border border-violet-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Play className="w-6 h-6 text-violet-300 ml-1" />
            </div>
            <div>
              <p className="text-sm font-black text-white truncate max-w-[200px]">{promo.headline}</p>
              <p className="text-xs text-violet-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span>{promo.creatorName}</span>
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/40">
            Tocca per guardare
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200 ${isFullscreen ? 'fixed inset-0' : ''}`}
      role="dialog"
      aria-label={promo.headline}
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-violet-500/30 rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-violet-950/50 ${isFullscreen ? 'max-w-none max-h-none rounded-none' : ''}`}
      >
        {/* Video Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={promo.videoUrl}
            controls={!isFullscreen}
            autoPlay={autoPlay}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
            onClick={togglePlay}
            className="w-full h-full object-contain"
            style={{ cursor: 'pointer' }}
          />
          {!promo.videoUrl && (
            <div className="text-center text-zinc-400 p-8">
              <p className="text-lg">Nessun video disponibile</p>
              <p className="text-xs mt-2">URL media non valido o mancante</p>
            </div>
          )}

          {/* Overlay controlli custom in fullscreen */}
          {isFullscreen && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label={isPlaying ? 'Pausa' : 'Play'}>
                  {isPlaying ? <span className="w-6 h-6 flex items-center justify-center"><span className="w-1 h-6 bg-white rounded mr-1" /><span className="w-1 h-6 bg-white rounded" /></span> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <button onClick={toggleMute} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label={isMuted ? 'Riattiva audio' : 'Muta'}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsFullscreen(false)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label="Esci fullscreen">
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button onClick={() => { setIsOpen(false); onClose?.(); }} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors" aria-label="Chiudi">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-violet-300 ml-1" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">{promo.headline}</p>
              <p className="text-xs text-violet-300 flex items-center gap-1">
                <span>{promo.creatorName}</span>
                {promo.locationLabel && <span>· {promo.locationLabel}</span>}
                {promo.format && <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[9px] font-bold">{promo.format}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isFullscreen && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="Schermo intero"
              >
                <Expand className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => { setIsOpen(false); onClose?.(); }}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
              title="Chiudi video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoBannerAndPin;