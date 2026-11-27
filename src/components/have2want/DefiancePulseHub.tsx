import React, { useState } from 'react';
import { X, Music, Video, Megaphone, Sparkles, MapPin, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { resolveCreatorMediaSource, FREE_SERVICES_CONFIG } from '@/lib/freeServicesConfig';

export type CreatorFormat = 'MUSIC' | 'VIDEO' | 'PROMO';

export interface CreatorPromoItem {
  id: string;
  creatorName: string;
  format: CreatorFormat;
  title: string;
  mediaUrl: string;
  placement: 'BANNER' | 'PIN_VIDEO' | 'CREATOR_SPACE';
  pinCoords?: { lat: number; lng: number };
  createdAt: number;
  isAiGenerated?: boolean; // true = contenuto dimostrativo generato via AI (didattico), false = upload manuale creator
}

interface DefiancePulseHubProps {
  isOpen?: boolean;
  onClose?: () => void;
  onPublishPromo?: (item: CreatorPromoItem) => void;
  currentUser?: { id: string; name?: string } | null;
}

const FORMAT_ICONS: Record<CreatorFormat, React.ComponentType<{ className?: string }>> = {
  MUSIC: Music,
  VIDEO: Video,
  PROMO: Megaphone,
};

const FORMAT_LABELS: Record<CreatorFormat, string> = {
  MUSIC: 'Musica',
  VIDEO: 'Video',
  PROMO: 'Autopubblicità / Promo',
};

const PLACEMENT_LABELS: Record<CreatorPromoItem['placement'], string> = {
  PIN_VIDEO: 'PIN che apre il video pubblicitario',
  BANNER: 'Banner promozionale interno',
  CREATOR_SPACE: 'Spazio creator nella pagina',
};

// Contenuti didattici dimostrativi generati via AI (Punto 5 — Defiance Pulse AI Creator)
// NON sono campagne pubblicitarie commerciali (quelle appartengono a CREATOR ADS).
// Sono contenuti educativi/didattici iniziali per avviare la piattaforma senza commercianti reali.
const AI_DEMO_CONTENT: CreatorPromoItem[] = [
  {
    id: 'ai-demo-mestieri-001',
    creatorName: 'AI Studio — Have2Want',
    format: 'VIDEO',
    title: 'Mestieri antichi: fabbro e arte del ferro',
    mediaUrl: 'https://archive.org/details/ai-demo-mestieri-fabbro',
    placement: 'CREATOR_SPACE',
    createdAt: Date.now() - 86400000 * 3,
    isAiGenerated: true,
  },
  {
    id: 'ai-demo-riparazioni-002',
    creatorName: 'AI Studio — Have2Want',
    format: 'VIDEO',
    title: 'Riparazioni domestiche: rubinetto che perde',
    mediaUrl: 'https://archive.org/details/ai-demo-riparazioni-rubinetto',
    placement: 'PIN_VIDEO',
    pinCoords: { lat: 44.3845, lng: 7.5427 },
    createdAt: Date.now() - 86400000 * 2,
    isAiGenerated: true,
  },
  {
    id: 'ai-demo-auto-003',
    creatorName: 'AI Studio — Have2Want',
    format: 'VIDEO',
    title: 'Automobili: cambio olio e filtro motore',
    mediaUrl: 'https://archive.org/details/ai-demo-auto-cambio-olio',
    placement: 'CREATOR_SPACE',
    createdAt: Date.now() - 86400000,
    isAiGenerated: true,
  },
  {
    id: 'ai-demo-cucina-004',
    creatorName: 'AI Studio — Have2Want',
    format: 'VIDEO',
    title: 'Cucina: pasta fatta in casa, ricetta tradizionale',
    mediaUrl: 'https://archive.org/details/ai-demo-cucina-pasta',
    placement: 'PIN_VIDEO',
    pinCoords: { lat: 45.4642, lng: 9.1900 },
    createdAt: Date.now() - 43200000,
    isAiGenerated: true,
  },
  {
    id: 'ai-demo-giardinaggio-005',
    creatorName: 'AI Studio — Have2Want',
    format: 'VIDEO',
    title: 'Giardinaggio: orto in vaso su balcone',
    mediaUrl: 'https://archive.org/details/ai-demo-giardinaggio-balcone',
    placement: 'CREATOR_SPACE',
    createdAt: Date.now() - 21600000,
    isAiGenerated: true,
  },
  {
    id: 'ai-demo-cultura-006',
    creatorName: 'AI Studio — Have2Want',
    format: 'MUSIC',
    title: 'Cultura: musica popolare tradizionale regionale',
    mediaUrl: 'https://archive.org/details/ai-demo-cultura-musica-popolare',
    placement: 'CREATOR_SPACE',
    createdAt: Date.now() - 10800000,
    isAiGenerated: true,
  },
];

export const DefiancePulseHub: React.FC<DefiancePulseHubProps> = ({
  isOpen = true,
  onClose = () => {},
  onPublishPromo,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [creatorName, setCreatorName] = useState(currentUser?.name || '');
  const [format, setFormat] = useState<CreatorFormat>('MUSIC');
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [placement, setPlacement] = useState<CreatorPromoItem['placement']>('PIN_VIDEO');
  const [lat, setLat] = useState('44.3845');
  const [lng, setLng] = useState('7.5427');
  const [items, setItems] = useState<CreatorPromoItem[]>(() => [...AI_DEMO_CONTENT]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedUrl = resolveCreatorMediaSource(mediaUrl, localFile);
    if (!creatorName.trim() || !title.trim() || !resolvedUrl) {
      toast.error('Compila nome creator, titolo e fornisci un media (URL o file locale)');
      return;
    }

    setIsSubmitting(true);
    try {
      const newItem: CreatorPromoItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        creatorName: creatorName.trim(),
        format,
        title: title.trim(),
        mediaUrl: resolvedUrl,
        placement,
        pinCoords:
          placement === 'PIN_VIDEO'
            ? { lat: Number(lat) || 0, lng: Number(lng) || 0 }
            : undefined,
        createdAt: Date.now(),
      };

      setItems((prev) => [newItem, ...prev]);
      onPublishPromo?.(newItem);
      toast.success('Autopromozione pubblicata!', {
        description: `${FORMAT_LABELS[format]} "${title}" → ${PLACEMENT_LABELS[placement]}`,
      });

      setTitle('');
      setMediaUrl('');
      setLocalFile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info('Autopromozione rimossa');
  };

  const FormatIcon = FORMAT_ICONS[format];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-purple-900/40 border-b border-violet-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-400/50 flex items-center justify-center text-violet-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>DEFIANCE PULSE — CREATOR HUB</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/40">
                  MUSIC • VIDEO • PROMO
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Spazio creator & autopubblicità interna — Musica, Video, Promo — Zero costi, client-side
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer shrink-0"
            title="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Creazione */}
        <form onSubmit={handleCreate} className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-950/50">
          <div className="space-y-1.5">
            <label className="font-bold text-white uppercase tracking-wider text-[11px]">Nome Creator / Artista</label>
            <input
              type="text"
              placeholder={currentUser?.name ? `Es. ${currentUser.name}` : 'Es. Marco Rossi'}
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Formato</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as CreatorFormat)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white cursor-pointer focus:outline-none focus:border-violet-500"
              >
                <option value="MUSIC">🎵 Musica</option>
                <option value="VIDEO">🎬 Video</option>
                <option value="PROMO">📢 Autopubblicità / Promo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Posizionamento</label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as CreatorPromoItem['placement'])}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white cursor-pointer focus:outline-none focus:border-violet-500"
              >
                <option value="PIN_VIDEO">📍 PIN Video (apre player al click)</option>
                <option value="BANNER">🎬 Banner interno</option>
                <option value="CREATOR_SPACE">👤 Spazio creator pagina</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Titolo</label>
              <input
                type="text"
                placeholder="Titolo brano, video o promo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <FormatIcon className="w-4 h-4 text-violet-400" />
              Media (URL o File Locale)
            </label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="URL video/audio (YouTube, Vimeo, Internet Archive, link diretto...) — Opzionale se carichi file"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <div className="flex items-center gap-2">
                <label className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-medium cursor-pointer flex items-center gap-2 hover:border-violet-500 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Carica File Locale (Audio/Video)</span>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => setLocalFile(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
                {localFile && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {localFile.name} ({(localFile.size / 1024 / 1024).toFixed(2)} MB) — Anteprima locale via ObjectURL
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">
                File locale → {FREE_SERVICES_CONFIG.allowLocalObjectUrl ? 'ObjectURL locale (zero costi, sessione corrente)' : 'Disabilitato'}.
                URL remoto → usato direttamente. Appoggio gratuito: {FREE_SERVICES_CONFIG.creatorFallbackHosts.join(', ')}.
              </p>
            </div>
          </div>

          {placement === 'PIN_VIDEO' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="space-y-1.5">
                <label className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Latitudine PIN
                </label>
                <input
                  type="text"
                  placeholder="Es. 44.3845"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Longitudine PIN
                </label>
                <input
                  type="text"
                  placeholder="Es. 7.5427"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs font-bold cursor-pointer transition-colors border border-zinc-800"
            >
              Chiudi
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white text-xs font-black flex items-center gap-2 cursor-pointer active:scale-95 transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Pubblicazione...' : 'Pubblica Autopromozione'}</span>
            </button>
          </div>
        </form>

        {/* Contenuti didattici dimostrativi generati via AI — separati dalle autopromozioni commerciali */}
        {AI_DEMO_CONTENT.length > 0 && (
          <div className="p-4 border-t border-violet-500/30 bg-violet-900/10 max-h-64 overflow-y-auto">
            <h3 className="text-xs font-black text-violet-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Contenuti Didattici AI (Dimostrativi)
            </h3>
            <div className="space-y-2">
              {AI_DEMO_CONTENT.map((item) => {
                const ItemFormatIcon = FORMAT_ICONS[item.format];
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-violet-900/30 border border-violet-500/20 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
                        <ItemFormatIcon className="w-4 h-4 text-violet-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white truncate">{item.title}</span>
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[9px] font-bold border border-violet-500/40 shrink-0">
                            {FORMAT_LABELS[item.format]}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40 shrink-0">
                            AI GENERATO
                          </span>
                        </div>
                        <p className="text-[10px] text-violet-200 truncate">
                          {item.creatorName} · {item.pinCoords ? `PIN: ${item.pinCoords.lat.toFixed(4)}, ${item.pinCoords.lng.toFixed(4)}` : 'Nessun PIN'}
                        </p>
                        <p className="text-[9px] text-zinc-500 truncate">
                          Contenuto educativo dimostrativo — non è una campagna pubblicitaria commerciale
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-zinc-500 mt-2">
              Strumenti AI gratuiti da valutare per generazione video, musica e contenuti multimediali:
              tier gratuito con limiti di qualità e diritti di utilizzo commerciale da verificare.
            </p>
          </div>
        )}

        {/* Lista autopromozioni create in questa sessione (upload manuale creator, NON AI generato) */}
        {items.length > AI_DEMO_CONTENT.length && (
          <div className="p-4 border-t border-zinc-800 bg-black/30 max-h-64 overflow-y-auto">
            <h3 className="text-xs font-black text-violet-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Autopromozioni Creator (Upload Manuale)
            </h3>
            <div className="space-y-2">
              {items.filter((item) => !item.isAiGenerated).map((item) => {
                const ItemFormatIcon = FORMAT_ICONS[item.format];
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center shrink-0">
                        <ItemFormatIcon className="w-4 h-4 text-violet-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white truncate">{item.title}</span>
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[9px] font-bold border border-violet-500/40 shrink-0">
                            {FORMAT_LABELS[item.format]}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40 shrink-0">
                            {PLACEMENT_LABELS[item.placement]}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {item.creatorName} · {item.pinCoords ? `PIN: ${item.pinCoords.lat.toFixed(4)}, ${item.pinCoords.lng.toFixed(4)}` : 'Nessun PIN'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-700 cursor-pointer shrink-0 transition-colors"
                      title="Rimuovi autopromozione"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info servizi gratuiti */}
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[10px] text-zinc-400">
          <strong className="text-zinc-300">Servizi di appoggio gratuiti:</strong>{' '}
          STUN Google (stun.l.google.com:19302) + TURN OpenRelay (metered.ca) per WebRTC.
          File locali via ObjectURL (zero banda). Host creator fallback: Internet Archive (archive.org).
          Nessun server/costo — tutto client-side.
        </div>
      </div>
    </div>
  );
};

export default DefiancePulseHub;