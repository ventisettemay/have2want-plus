import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Music,
  Video,
  Megaphone,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Plus,
  CheckCircle2,
  Layers,
  Upload,
  MapPin,
  Tv,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCountryAdPricingByType,
  getConfiguredLaunchCoefficient,
  setConfiguredLaunchCoefficient,
  AdDurationTier,
} from '@/lib/countryAdvertisingPricing';
import {
  resolveCreatorMediaSource,
  publishSyncMessage,
} from '@/lib/freeServicesConfig';
import VideoBannerAndPin from './VideoBannerAndPin';
import TextTailsBackdrop from './TextTailsBackdrop';

export type CreatorPlacementTarget = 'PIN' | 'BANNER' | 'CREATOR_SPACE';

interface DefiancePulseHubProps {
  isOpen: boolean;
  onClose: () => void;
  currentCountryCode?: string;
  onOpenBusinessSponsor?: () => void;
  onPublishCreatorPromo?: (promo: {
    id: string;
    title: string;
    mediaUrl: string;
    placement: CreatorPlacementTarget;
  }) => void;
}

type PulseSection = 'CREATOR' | 'MUSICA' | 'VIDEO' | 'PROMOZIONE';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  baseFreq: number;
  chordFreqs: number[];
  durationSec: number;
  isPromoSlot?: boolean;
  audioUrl?: string;
}

interface VideoReelItem {
  id: string;
  title: string;
  creator: string;
  category: string;
  accentHex: string;
  durationSec: number;
  description: string;
  videoUrl?: string;
  placement?: CreatorPlacementTarget;
}

const INITIAL_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'trk_1',
    title: 'Orbital Meridian 432',
    artist: 'Studio Pulse Collective',
    genre: 'Ambient Synth',
    baseFreq: 216,
    chordFreqs: [216, 270, 324],
    durationSec: 185,
  },
  {
    id: 'trk_2',
    title: 'Pioneer Horizon',
    artist: 'Territorio Wave',
    genre: 'Electronic Chill',
    baseFreq: 261.63,
    chordFreqs: [261.63, 329.63, 392.0],
    durationSec: 210,
    isPromoSlot: true,
  },
  {
    id: 'trk_3',
    title: 'Solstice Drift',
    artist: 'Atelier Sonoro',
    genre: 'Lo-Fi Beats',
    baseFreq: 196.0,
    chordFreqs: [196.0, 246.94, 293.66],
    durationSec: 164,
  },
];

const INITIAL_VIDEO_REELS: VideoReelItem[] = [
  {
    id: 'vid_1',
    title: 'Artigiani del Legno & Rigenerazione',
    creator: '@bottega_storica',
    category: 'Creator Territoriale',
    accentHex: '#00ff66',
    durationSec: 45,
    description: 'Mini-documentario sul restauro e lo scambio locale a filiera zero.',
    placement: 'CREATOR_SPACE',
  },
  {
    id: 'vid_2',
    title: 'Sessione Live Synth & Percussioni',
    creator: '@defiance_sound',
    category: 'Musica & Showcase',
    accentHex: '#f43f5e',
    durationSec: 60,
    description: 'Rotazione promozionale interna per artisti indipendenti.',
    placement: 'BANNER',
  },
  {
    id: 'vid_3',
    title: 'Tour Urbano 3D & Vetrine Locali',
    creator: '@urban_pulse',
    category: 'Promozione Attività',
    accentHex: '#38bdf8',
    durationSec: 38,
    description: 'Presentazione interattiva di botteghe e mercati rionali.',
    placement: 'PIN',
  },
];

export default function DefiancePulseHub({
  isOpen,
  onClose,
  currentCountryCode = 'IT',
  onOpenBusinessSponsor,
  onPublishCreatorPromo,
}: DefiancePulseHubProps) {
  const [section, setSection] = useState<PulseSection>('CREATOR');

  // 1. CREATOR STATE (Self-promotion file upload + remote URL + placement PIN / BANNER / CREATOR_SPACE)
  const [creatorPosts, setCreatorPosts] = useState<
    Array<{
      id: string;
      author: string;
      title: string;
      tag: string;
      likes: number;
      mediaUrl?: string;
      placement?: CreatorPlacementTarget;
    }>
  >([
    {
      id: 'cp_1',
      author: '@atelier_nord',
      title: 'Guida fotografica al baratto di attrezzatura',
      tag: 'Creator Locale',
      likes: 24,
      placement: 'CREATOR_SPACE',
    },
    {
      id: 'cp_2',
      author: '@suono_libero',
      title: 'Anteprima EP digitale con distribuzione diretta Pi',
      tag: 'Musica Indipendente',
      likes: 18,
      placement: 'BANNER',
    },
  ]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostTag, setNewPostTag] = useState('Creator Locale');
  const [remoteMediaUrl, setRemoteMediaUrl] = useState('');
  const [localMediaFile, setLocalMediaFile] = useState<File | null>(null);
  const [placementTarget, setPlacementTarget] = useState<CreatorPlacementTarget>('CREATOR_SPACE');
  const createdObjectUrlsRef = useRef<string[]>([]);

  // 2. MUSICA STATE (Web Audio API real synth playback)
  const [tracks, setTracks] = useState<MusicTrack[]>(INITIAL_MUSIC_TRACKS);
  const [activeTrackIdx, setActiveTrackIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgressSec, setAudioProgressSec] = useState(0);
  const [volume, setVolume] = useState(0.35);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackArtist, setNewTrackArtist] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);

  // 3. VIDEO STATE (Interactive Canvas reel renderer + real VideoBannerAndPin for uploaded/remote videos)
  const [videoReels, setVideoReels] = useState<VideoReelItem[]>(INITIAL_VIDEO_REELS);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 4. PROMOZIONE STATE
  const [promoDuration, setPromoDuration] = useState<AdDurationTier>('WEEKLY');
  const [launchCoeff, setLaunchCoeff] = useState<number>(() => getConfiguredLaunchCoefficient());

  const stopAudioEngine = () => {
    oscNodesRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore already stopped
      }
    });
    oscNodesRef.current = [];
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    gainNodeRef.current = null;
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopAudioEngine();
      setIsPlayingVideo(false);
    }
    return () => {
      stopAudioEngine();
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore revoke failures
        }
      });
      createdObjectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume * 0.12;
    }
  }, [volume]);

  useEffect(() => {
    if (!isPlayingAudio) return;
    const timer = setInterval(() => {
      setAudioProgressSec((prev) => {
        const limit = tracks[activeTrackIdx]?.durationSec || 180;
        if (prev + 1 >= limit) return 0;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayingAudio, activeTrackIdx, tracks]);

  // Procedural animated showcase reel canvas
  useEffect(() => {
    if (!isOpen || section !== 'VIDEO') return;
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let phase = 0;
    const activeReel = videoReels[activeVideoIdx] || videoReels[0];

    const drawFrame = () => {
      if (isPlayingVideo) phase += 0.035;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#06080f';
      ctx.fillRect(0, 0, w, h);

      // Dynamic spectrum waves
      for (let i = 0; i < 16; i++) {
        const yBase = h * 0.35 + i * 10;
        ctx.beginPath();
        ctx.strokeStyle = activeReel.accentHex;
        ctx.globalAlpha = 0.18 + (i % 3) * 0.1;
        ctx.lineWidth = 2;
        for (let x = 0; x <= w; x += 14) {
          const amp = isPlayingVideo ? 18 : 6;
          const y = yBase + Math.sin(x * 0.018 + phase + i * 0.4) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(16, h - 72, w - 32, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(activeReel.title, 28, h - 46);
      ctx.fillStyle = activeReel.accentHex;
      ctx.font = '12px monospace';
      ctx.fillText(
        `${activeReel.creator} • ${isPlayingVideo ? 'IN RIPRODUZIONE' : 'PAUSA'}`,
        28,
        h - 26
      );

      rafId = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, section, isPlayingVideo, activeVideoIdx, videoReels]);

  if (!isOpen) return null;

  const currentTrack = tracks[activeTrackIdx] || tracks[0];
  const currentVideo = videoReels[activeVideoIdx] || videoReels[0];

  const startTrackPlayback = (track: MusicTrack) => {
    stopAudioEngine();
    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      toast.error('Web Audio API non supportata su questo browser');
      return;
    }
    try {
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.value = volume * 0.12;
      masterGain.connect(ctx.destination);

      const createdOscs: OscillatorNode[] = [];
      track.chordFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(masterGain);
        osc.start();
        createdOscs.push(osc);
      });

      audioCtxRef.current = ctx;
      gainNodeRef.current = masterGain;
      oscNodesRef.current = createdOscs;
      setAudioProgressSec(0);
      setIsPlayingAudio(true);
    } catch {
      toast.error('Impossibile avviare la riproduzione audio');
    }
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopAudioEngine();
    } else {
      startTrackPlayback(currentTrack);
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (activeTrackIdx + 1) % tracks.length;
    setActiveTrackIdx(nextIdx);
    if (isPlayingAudio) {
      startTrackPlayback(tracks[nextIdx]);
    } else {
      setAudioProgressSec(0);
    }
  };

  const handlePublishCreatorPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    const resolved = resolveCreatorMediaSource(localMediaFile || remoteMediaUrl);
    const mediaUrl = resolved?.url || '';
    if (resolved?.kind === 'object_url' && mediaUrl) {
      createdObjectUrlsRef.current.push(mediaUrl);
    }

    const postId = `cp_${Date.now()}`;
    setCreatorPosts((prev) => [
      {
        id: postId,
        author: '@pioneer_creator',
        title: newPostTitle.trim(),
        tag: newPostTag,
        likes: 1,
        mediaUrl: mediaUrl || undefined,
        placement: placementTarget,
      },
      ...prev,
    ]);

    if (mediaUrl) {
      const reelId = `vid_${Date.now()}`;
      setVideoReels((prev) => [
        {
          id: reelId,
          title: newPostTitle.trim(),
          creator: '@pioneer_creator',
          category: newPostTag,
          accentHex: '#f43f5e',
          durationSec: 60,
          description: `Destinazione: ${placementTarget}`,
          videoUrl: mediaUrl,
          placement: placementTarget,
        },
        ...prev,
      ]);
      setActiveVideoIdx(0);
    }

    publishSyncMessage('CREATOR_PROMO_PUBLISHED', {
      id: postId,
      title: newPostTitle.trim(),
      mediaUrl,
      placement: placementTarget,
    });

    if (onPublishCreatorPromo) {
      onPublishCreatorPromo({
        id: postId,
        title: newPostTitle.trim(),
        mediaUrl,
        placement: placementTarget,
      });
    }

    setNewPostTitle('');
    setRemoteMediaUrl('');
    setLocalMediaFile(null);
    toast.success(`Contenuto Creator pubblicato in: ${placementTarget}`);
  };

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;
    const added: MusicTrack = {
      id: `trk_${Date.now()}`,
      title: newTrackTitle.trim(),
      artist: newTrackArtist.trim() || 'Artista Indipendente',
      genre: 'Rotazione Pulse',
      baseFreq: 246.94,
      chordFreqs: [246.94, 311.13, 369.99],
      durationSec: 180,
      isPromoSlot: true,
    };
    setTracks((prev) => [added, ...prev]);
    setActiveTrackIdx(0);
    setNewTrackTitle('');
    setNewTrackArtist('');
    toast.success(`Brano "${added.title}" inserito nella rotazione musica`);
  };

  const promoPricing = getCountryAdPricingByType(
    currentCountryCode || 'IT',
    'CREATOR_PROMO',
    promoDuration,
    launchCoeff
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-zinc-950 border border-rose-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        <TextTailsBackdrop showLogo={false} className="absolute inset-0 opacity-20" />
        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-zinc-800 bg-zinc-900/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                DEFIANCE PULSE HUB • MEDIA & CREATOR NETWORK
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Studio Creator, Musica, Video & Rotazione Promo
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopAudioEngine();
              setIsPlayingVideo(false);
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Section Tabs: CREATOR | MUSICA | VIDEO | PROMOZIONE */}
        <div className="px-5 pt-3 pb-2 border-b border-zinc-900 bg-zinc-950 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'CREATOR' as const, label: 'Creator Studio', icon: Sparkles },
            { id: 'MUSICA' as const, label: 'Musica', icon: Music },
            { id: 'VIDEO' as const, label: 'Video', icon: Video },
            { id: 'PROMOZIONE' as const, label: 'Promozione', icon: Megaphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                  active
                    ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {section === 'CREATOR' && (
            <div className="space-y-4">
              <form
                onSubmit={handlePublishCreatorPost}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3"
              >
                <div className="text-xs font-black text-rose-300 uppercase">
                  Auto-Promozione Creator (File Locale o URL · PIN / Banner / Spazio Creator)
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Titolo opera, video, audio o promo..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-rose-400 focus:outline-none"
                    required
                  />
                  <select
                    value={newPostTag}
                    onChange={(e) => setNewPostTag(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white"
                  >
                    <option value="Creator Locale">Creator Locale</option>
                    <option value="Musica Indipendente">Musica Indipendente</option>
                    <option value="Video & Documentari">Video & Documentari</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-zinc-300 cursor-pointer hover:border-rose-400">
                    <Upload className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="break-words">
                      {localMediaFile ? localMediaFile.name : 'Carica file locale (Video / Audio)'}
                    </span>
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      onChange={(e) => setLocalMediaFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={remoteMediaUrl}
                    onChange={(e) => setRemoteMediaUrl(e.target.value)}
                    placeholder="Oppure URL remoto (es. https://archive.org/embed/...)"
                    className="px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-zinc-400 mr-1">Posizionamento:</span>
                    {(
                      [
                        { id: 'CREATOR_SPACE' as const, label: 'Spazio Creator', icon: Sparkles },
                        { id: 'PIN' as const, label: 'Pin Mappa', icon: MapPin },
                        { id: 'BANNER' as const, label: 'Banner Spot', icon: Tv },
                      ] as const
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const selected = placementTarget === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPlacementTarget(opt.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                            selected
                              ? 'bg-rose-500 text-white border-rose-400'
                              : 'bg-black text-zinc-300 border-zinc-700 hover:bg-zinc-900'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pubblica Promo</span>
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creatorPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="font-bold text-rose-300">
                        {post.tag} · {post.placement || 'CREATOR_SPACE'}
                      </span>
                      <span className="font-mono">{post.author}</span>
                    </div>
                    <h4 className="text-sm font-black text-white break-words">{post.title}</h4>
                    {post.mediaUrl && (
                      <VideoBannerAndPin
                        mode={post.placement === 'PIN' ? 'PIN' : 'BANNER'}
                        adId={post.id}
                        title={post.title}
                        videoUrl={post.mediaUrl}
                        badgeText={post.tag}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setCreatorPosts((prev) =>
                          prev.map((p) => (p.id === post.id ? { ...p, likes: p.likes + 1 } : p))
                        )
                      }
                      className="text-xs font-bold text-rose-300 hover:text-rose-200 cursor-pointer"
                    >
                      ♥ {post.likes} apprezzamenti
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'MUSICA' && (
            <div className="space-y-4">
              {/* Interactive Player */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-rose-950/30 border border-rose-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-rose-400">
                      Lettore Audio Web Audio API • {currentTrack.genre}
                    </div>
                    <h3 className="text-base font-black text-white">{currentTrack.title}</h3>
                    <p className="text-xs text-zinc-400">{currentTrack.artist}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlayingAudio ? 'Pausa' : 'Ascolta'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTrack}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 cursor-pointer"
                      title="Brano successivo"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span>
                    {Math.floor(audioProgressSec / 60)}:{(audioProgressSec % 60).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{
                        width: `${Math.min(100, (audioProgressSec / Math.max(1, currentTrack.durationSec)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-rose-300" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-16 accent-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Add track to rotation */}
              <form
                onSubmit={handleAddTrack}
                className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  placeholder="Titolo nuovo brano..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white"
                  required
                />
                <input
                  type="text"
                  value={newTrackArtist}
                  onChange={(e) => setNewTrackArtist(e.target.value)}
                  placeholder="Artista / Etichetta"
                  className="sm:w-44 px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#00ff66] text-black text-xs font-black cursor-pointer"
                >
                  + Inserisci in Rotazione
                </button>
              </form>

              {/* Queue */}
              <div className="space-y-2">
                {tracks.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTrackIdx(idx);
                      startTrackPlayback(t);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                      idx === activeTrackIdx
                        ? 'bg-rose-950/40 border-rose-400/60'
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>{t.title}</span>
                        {t.isPromoSlot && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            SPOT ROTAZIONE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {t.artist} • {t.genre}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-rose-300">
                      {idx === activeTrackIdx && isPlayingAudio ? '▶ Attivo' : 'Riproduci'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === 'VIDEO' && (
            <div className="space-y-4">
              {currentVideo.videoUrl ? (
                <VideoBannerAndPin
                  mode={currentVideo.placement === 'PIN' ? 'PIN' : 'BANNER'}
                  adId={currentVideo.id}
                  title={currentVideo.title}
                  subtitle={`${currentVideo.creator} · ${currentVideo.description}`}
                  videoUrl={currentVideo.videoUrl}
                  badgeText={currentVideo.category}
                />
              ) : (
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black">
                  <canvas
                    ref={videoCanvasRef}
                    width={680}
                    height={240}
                    className="w-full h-52 object-cover block"
                  />
                  <div className="p-3.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-white">{currentVideo.title}</div>
                      <div className="text-[11px] text-zinc-400">{currentVideo.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlayingVideo((prev) => !prev)}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {isPlayingVideo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlayingVideo ? 'Pausa' : 'Avvia Video'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {videoReels.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setActiveVideoIdx(idx);
                      setIsPlayingVideo(true);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      idx === activeVideoIdx
                        ? 'bg-rose-950/40 border-rose-400/60'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold" style={{ color: v.accentHex }}>
                      {v.category}
                    </div>
                    <div className="text-xs font-black text-white mt-0.5 break-words">{v.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">{v.creator} · {v.durationSec}s</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === 'PROMOZIONE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/75 border border-amber-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      TARIFFAZIONE PROMO CREATOR & ROTAZIONE INTERNA
                    </div>
                    <h3 className="text-sm font-black text-white">
                      {promoPricing.countryName} ({promoPricing.countryCode}) • {promoPricing.trafficTierLabel}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setPromoDuration(tier)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer border ${
                          promoDuration === tier
                            ? 'bg-amber-400 text-black border-amber-300'
                            : 'bg-black text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {tier === 'DAILY' ? 'Giorno' : tier === 'WEEKLY' ? 'Settimana' : 'Mese'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Launch coefficient slider synced with countryAdvertisingPricing */}
                <div className="p-3 rounded-xl bg-black/70 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-bold">
                      Coefficiente Lancio Pioneer modificabile (default 0.20)
                    </span>
                    <span className="font-mono font-black text-[#00ff66]">{launchCoeff.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={launchCoeff}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLaunchCoeff(val);
                      setConfiguredLaunchCoefficient(val);
                    }}
                    className="w-full accent-[#00ff66]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-black border border-zinc-800">
                    <div className="text-[10px] text-zinc-400 uppercase">Quota Netta in Pi</div>
                    <div className="text-xl font-black font-mono text-[#00ff66]">
                      {promoPricing.currentPricePi} π
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Base: {promoPricing.listPricePi} π
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-black border border-zinc-800">
                    <div className="text-[10px] text-zinc-400 uppercase">Equivalente Crypto USDT</div>
                    <div className="text-xl font-black font-mono text-amber-300">
                      {promoPricing.currentPriceUsdt} USDT
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Solo Crypto & Crediti (Zero Fiat)
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pagabile via Pi SDK, Pi Ad Network, USDT Polygon/TRC20 o Crediti</span>
                  </div>
                  {onOpenBusinessSponsor && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBusinessSponsor();
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Attiva Spazio Pubblicitario Crypto</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
