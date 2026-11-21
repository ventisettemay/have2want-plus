import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Package, 
  Truck, 
  Handshake, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Coins, 
  Share2, 
  Calendar, 
  Tag, 
  UserCheck, 
  AlertCircle,
  Gift,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { getCachedPiRealPrice } from '@/lib/piRealPriceService';

export interface ListingDetailItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  currency?: string;
  images?: string[];
  imageUrl?: string;
  photos?: string[];
  city?: string;
  region?: string;
  state?: string;
  country?: string;
  createdAt?: string | number;
  authorName?: string;
  authorUsername?: string;
  authorRating?: number;
  originType?: 'REAL_P2P' | 'EXTERNAL' | 'SAMPLE';
  condition?: string;
  wantsInExchange?: string;
  acceptsPi?: boolean;
  piPrice?: number;
  deliveryOption?: 'HANDSHAKE_ONLY' | 'SHIPPING_AVAILABLE' | 'BOTH';
}

interface ListingDetailModalProps {
  isOpen: boolean;
  listing: ListingDetailItem | null;
  onClose: () => void;
  onProposeBarter: (listing: ListingDetailItem) => void;
  onContactSeller: (listing: ListingDetailItem) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  isOpen,
  listing,
  onClose,
  onProposeBarter,
  onContactSeller,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !listing) return null;

  // Immagini disponibili
  const allImages: string[] = [];
  if (listing.imageUrl) allImages.push(listing.imageUrl);
  if (listing.images && Array.isArray(listing.images)) {
    listing.images.forEach((img) => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }
  if (listing.photos && Array.isArray(listing.photos)) {
    listing.photos.forEach((img) => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }
  if (allImages.length === 0) {
    allImages.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80');
  }

  const activeImage = allImages[selectedImageIndex] || allImages[0];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Link annuncio copiato negli appunti!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isReal = listing.originType === 'REAL_P2P';
  const isSample = listing.originType === 'SAMPLE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#0e0e11] border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="px-5 py-3.5 bg-black/60 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Dettaglio Offerta</span>
            {isReal && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Reale P2P Verificato
              </span>
            )}
            {isSample && (
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                Annuncio Dimostrativo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Condividi annuncio"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenuto a Scorrimento */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Gallery Immagini */}
          <div className="space-y-3">
            <div className="relative w-full h-64 sm:h-80 rounded-2xl bg-black overflow-hidden border border-zinc-900 flex items-center justify-center">
              <img
                src={activeImage}
                alt={listing.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-zinc-800 text-white font-mono text-xs font-bold">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            </div>

            {/* Miniature Gallery se più di 1 foto */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      selectedImageIndex === idx 
                        ? 'border-[#00ff66] scale-105 shadow-md shadow-[#00ff66]/20' 
                        : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Titolo e Prezzo / Valore in Pi */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-800/80 pb-5">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Tag className="w-3.5 h-3.5 text-[#00ff66]" />
                <span className="uppercase font-bold tracking-wider">{listing.category || 'Generale'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  {listing.city || 'Territorio Locale'} {listing.region ? `(${listing.region})` : ''}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {listing.title}
              </h1>
            </div>

            {/* Blocco Prezzo / Pi Network */}
            <div className="px-4 py-2.5 rounded-2xl bg-black border border-zinc-800 flex items-center gap-3 shrink-0 self-start">
              {listing.price !== undefined && listing.price > 0 ? (
                <div className="text-right">
                  <span className="block text-[10px] text-zinc-400 uppercase font-mono">Valore Stimato</span>
                  <span className="text-lg font-black text-white font-mono">
                    {listing.price} {listing.currency || '€'}
                  </span>
                </div>
              ) : null}

              <div className="text-right border-l border-zinc-800 pl-3">
                <span className="block text-[10px] text-amber-400 uppercase font-mono flex items-center gap-1 justify-end">
                  <Coins className="w-3 h-3 text-amber-400" />
                  Pi Network
                </span>
                <span className="text-lg font-black text-amber-300 font-mono block">
                  {listing.piPrice ? `${listing.piPrice} π` : 'Accetta Pi'}
                </span>
                {listing.piPrice ? (() => {
                  const piRate = getCachedPiRealPrice();
                  return (
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      ≈ {(listing.price !== undefined && listing.price > 0 ? listing.price : (listing.piPrice * piRate.priceEur)).toFixed(2)} € (Mercato CMC ~{piRate.priceUsd.toFixed(3)}$)
                    </span>
                  );
                })() : null}
              </div>
            </div>
          </div>

          {/* Descrizione Integrale del Prodotto */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Descrizione del Prodotto</h3>
            <div className="p-4 rounded-2xl bg-black/60 border border-zinc-900 text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
              {listing.description || 'Nessuna descrizione specificata dal venditore.'}
            </div>
          </div>

          {/* Cosa Cerca in Cambio (WHAT YOU WANT) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Handshake className="w-4 h-4 text-amber-400" />
              <span>Cosa Vuole in Cambio (Baratto & Accordo)</span>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
              {listing.wantsInExchange || 'Accetta proposte di baratto alla pari, beni di valore equivalente o transazione diretta in Pi.'}
            </p>
          </div>

          {/* Specifiche Tecniche & Condizioni */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black border border-zinc-900 flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Condizione del Bene</span>
              <span className="font-bold text-white">
                {listing.condition || 'Usato in ottime condizioni'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-black border border-zinc-900 flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Data di Pubblicazione</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" />
                Recente
              </span>
            </div>
          </div>

          {/* Opzioni di Consegna & Ritiro (Territoriale vs Spedizione) */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#00ff66]" />
              <span>Modalità di Ritiro & Consegna</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opzione 1: Ritiro a mano */}
              <div className="p-3 rounded-xl bg-black border border-zinc-800/80 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Handshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Ritiro a Mano Territoriale</h4>
                  <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                    Scambio gratuito sul posto con consegna a mano e verifica di persona.
                  </p>
                </div>
              </div>

              {/* Opzione 2: Spedizione concordata tra le parti */}
              <div className="p-3 rounded-xl bg-black border border-zinc-800/80 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Spedizione Tracciata P2P</h4>
                  <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                    Consegna concordata tramite corriere (Poste/InPost) con codice di tracking in chat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scheda Autore / Pioniere */}
          <div className="p-3.5 rounded-xl bg-black border border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold flex items-center justify-center text-sm">
                {(listing.authorName || 'P')[0]?.toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  {listing.authorName || 'Pioniere della Community'}
                  <UserCheck className="w-3.5 h-3.5 text-[#00ff66]" />
                </span>
                <span className="text-[11px] text-zinc-400">
                  {listing.authorUsername ? `@${listing.authorUsername}` : 'Membro Certificato Pi Network'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-amber-300 text-xs font-bold font-mono">
              ★ 5.0
            </div>
          </div>
        </div>

        {/* Footer con Azioni Rapide */}
        <div className="p-4 bg-black border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Torna al Feed
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onContactSeller(listing);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Contatta Venditore</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onProposeBarter(listing);
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-md shadow-[#00ff66]/20"
            >
              <Handshake className="w-4 h-4" />
              <span>Proponi Baratto P2P</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ListingDetailModal;
