import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Video, ExternalLink } from 'lucide-react';
import {
  publishSyncMessage,
  subscribeSyncMessages,
  resolveCreatorMediaSource,
} from '@/lib/freeServicesConfig';

export interface VideoBannerAndPinProps {
  mode?: 'PIN' | 'BANNER';
  adId?: string;
  title: string;
  subtitle?: string;
  videoUrl?: string;
  posterUrl?: string;
  badgeText?: string;
  onActivate?: () => void;
}

export default function VideoBannerAndPin({
  mode = 'BANNER',
  adId = 'h2w_video_ad',
  title,
  subtitle,
  videoUrl,
  posterUrl,
  badgeText = 'Spot Video',
  onActivate,
}: VideoBannerAndPinProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastTriggeredAt, setLastTriggeredAt] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const resolvedMedia = resolveCreatorMediaSource(videoUrl);

  useEffect(() => {
    const unsub = subscribeSyncMessages<{ adId?: string; title?: string; timestamp?: number }>((msg) => {
      if (msg.type === 'VIDEO_AD_TRIGGERED' && msg.payload?.adId === adId) {
        setLastTriggeredAt(msg.timestamp);
      }
    });
    return () => unsub();
  }, [adId]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (vid) {
      if (vid.paused) {
        vid.play().catch(() => {});
        setIsPlaying(true);
      } else {
        vid.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }

    publishSyncMessage('VIDEO_AD_TRIGGERED', {
      adId,
      title,
      mode,
    });
    if (onActivate) onActivate();
  }, [adId, mode, onActivate, title]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!isExpanded && el && typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().catch(() => {});
    } else if (isExpanded && typeof document !== 'undefined' && document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().catch(() => {});
    }
    setIsExpanded((prev) => !prev);
  }, [isExpanded]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key.toLowerCase();
    if (e.code === 'Space' || key === ' ') {
      e.preventDefault();
      togglePlay();
    } else if (key === 'm') {
      e.preventDefault();
      toggleMute();
    } else if (key === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'Escape' && isExpanded) {
      e.preventDefault();
      setIsExpanded(false);
    }
  };

  if (mode === 'PIN') {
    return (
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={togglePlay}
        role="button"
        aria-label={`Apri spillo video: ${title}`}
        className="w-full p-3 rounded-2xl bg-zinc-900 border border-amber-400/50 hover:border-amber-300 text-white flex items-center justify-between gap-3 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300">
            <Video className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-amber-300">{badgeText} · Spillo Video</div>
            <div className="text-sm font-black text-white break-words">{title}</div>
            {subtitle && <div className="text-xs text-zinc-400">{subtitle}</div>}
          </div>
        </div>
        <span className="px-3 py-2 rounded-xl bg-amber-400 text-black text-xs font-black shrink-0 flex items-center gap-1">
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pausa' : 'Guarda'}</span>
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Banner video: ${title}`}
      className={`w-full rounded-2xl overflow-hidden border border-amber-400/45 bg-zinc-950 text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        isExpanded ? 'fixed inset-4 z-50 flex flex-col' : ''
      }`}
    >
      <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden">
        {resolvedMedia && resolvedMedia.isEmbed ? (
          <iframe
            src={resolvedMedia.url}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
          />
        ) : resolvedMedia && (resolvedMedia.kind === 'direct_video' || resolvedMedia.kind === 'object_url') ? (
          <video
            ref={videoRef}
            src={resolvedMedia.url}
            poster={posterUrl}
            muted={isMuted}
            playsInline
            loop
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-amber-950/30 to-black flex flex-col items-center justify-center p-4 text-center gap-2">
            <Video className="w-8 h-8 text-amber-400" />
            <div className="text-sm font-black text-white">{title}</div>
            {subtitle && <div className="text-xs text-zinc-400">{subtitle}</div>}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-amber-300">
              {badgeText} {lastTriggeredAt ? '· Sincronizzato' : ''}
            </div>
            <div className="text-xs sm:text-sm font-black text-white break-words">{title}</div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={togglePlay}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black flex items-center gap-1 cursor-pointer"
              aria-label={isPlaying ? 'Metti in pausa' : 'Riproduci'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pausa' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="min-h-[36px] min-w-[36px] p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700 cursor-pointer flex items-center justify-center"
              aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-h-[36px] min-w-[36px] p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700 cursor-pointer flex items-center justify-center"
              aria-label={isExpanded ? 'Riduci schermo' : 'Schermo intero'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {resolvedMedia && resolvedMedia.kind === 'external_url' && (
              <a
                href={resolvedMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] min-w-[36px] p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 border border-zinc-700 flex items-center justify-center"
                aria-label="Apri video esterno"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
