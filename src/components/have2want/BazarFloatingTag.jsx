import React from 'react';
import { Button } from '@/components/ui/button';
import { getDisplayCoordinates } from '@/lib/geoPrivacy';
import { ListingOriginBadge } from '@/components/have2want/ListingOriginBadge';
import { toast } from 'sonner';

export default function BazarFloatingTag({ listing, onClose, onStartChat }) {
  if (!listing) return null;

  const getActionSymbol = (type) => {
    switch(type) {
      case 'vendo': return 'π';
      case 'baratto_scambio': return '🔄';
      case 'acquisto_cerco': return '🔍';
      case 'scambio_crypto_p2p': return 'π/🔥';
      default: return '🔄';
    }
  };

  const { isMasked } = getDisplayCoordinates(listing);

  const handleStartChat = () => {
    toast.success(`Chat Discreta avviata con ${listing.author?.name || listing.owner_name || '@pioniere'}`);
    if (onStartChat) {
      onStartChat(listing);
    }
    onClose();
  };

  return (
    <div className="absolute z-50 p-4 w-80 rounded-2xl bg-[#1e293b]/95 text-slate-100 backdrop-blur-md shadow-2xl border border-slate-600/70 flex flex-col gap-3 transform -translate-x-1/2 -translate-y-full mt-[-12px]">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-black text-emerald-400">{getActionSymbol(listing.action_type || listing.intent?.toLowerCase())}</span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] tracking-widest text-slate-400 uppercase font-bold">{(listing.action_type || listing.intent || '').replace('_', ' ')}</span>
              <ListingOriginBadge listing={listing} size="xs" compact={true} />
            </div>
            <span className="text-xs font-bold max-w-[180px] truncate text-slate-100">{listing.title}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer">✕</button>
      </div>
      <div className="bg-[#29364c] p-2 rounded-xl border border-slate-600/60 text-center">
        <span className="text-[9px] text-slate-400 uppercase block font-bold">Dichiarazione Diretta</span>
        <span className="text-xs text-amber-300 font-black tracking-wider">
          {listing.have_description || listing.title || "N/A"} → {listing.want_description || (listing.piPrice ? `${listing.piPrice} π` : "Scambio Paritario")}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-[11px] text-slate-300 bg-[#29364c]/80 p-2.5 rounded-xl border border-slate-600/60">
        <div className="flex justify-between">
          <span>📍 Territorio:</span>
          <span className="text-slate-100 font-semibold">{isMasked ? `${listing.city || listing.locationArea || 'Territorio'} (Centroide)` : (listing.city || listing.locationArea || 'Territorio')}</span>
        </div>
        <div className="flex justify-between">
          <span>⭐ Reputazione:</span>
          <span className="text-amber-400 font-bold">⭐⭐⭐⭐⭐</span>
        </div>
        {listing.meeting_point_verified && (
          <div className="mt-1 text-[10px] text-emerald-400 font-bold">✓ Luogo Pubblico Certificato</div>
        )}
      </div>
      <Button 
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase py-2 rounded-lg border border-emerald-500/40 cursor-pointer transition-all shadow-sm"
        onClick={handleStartChat}
      >
        💬 Avvia Chat Discreta (Quota X: 0.15)
      </Button>
    </div>
  );
}
