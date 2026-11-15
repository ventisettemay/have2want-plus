import React, { useMemo, useState } from 'react';
import {
  Store,
  X,
  MapPin,
  Clock,
  Phone,
  Globe,
  Mic,
  Sparkles,
  Megaphone,
  Coins,
  Navigation,
  ChevronLeft,
  Plus,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { classifyMerchantPin, MerchantPinCategory } from '@/lib/merchantPinClassifier';
import { executePiSdkPayment } from '@/lib/piSdkService';

export interface MerchantBusinessItem {
  id: string;
  name: string;
  category?: string;
  categoryLabel?: string;
  badge?: string;
  city?: string;
  region?: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  description?: string;
  promo?: string;
  adHeadline?: string;
  piAccepted?: boolean;
  fiatAccepted?: boolean;
  hasAd?: boolean;
  isAd?: boolean;
  flyerUrl?: string;
  phone?: string;
  website?: string;
  hours?: string;
  voiceIntro?: string;
}

interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: MerchantBusinessItem[];
  selectedBusiness: MerchantBusinessItem | null;
  onSelectBusiness: (biz: MerchantBusinessItem | null) => void;
  onOpenVoiceChat?: (biz: MerchantBusinessItem) => void;
  onFlyToBusiness?: (biz: MerchantBusinessItem) => void;
  onOpenPromoteModal?: () => void;
}

type CategoryFilter = 'ALL' | MerchantPinCategory;

export default function MerchantDetailModal({
  isOpen,
  onClose,
  businesses = [],
  selectedBusiness,
  onSelectBusiness,
  onOpenVoiceChat,
  onFlyToBusiness,
  onOpenPromoteModal,
}: MerchantDetailModalProps) {
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('ALL');
  const [piAmount, setPiAmount] = useState<string>('0.5');
  const [isPayingPi, setIsPayingPi] = useState(false);

  const enrichedBusinesses = useMemo(
    () =>
      businesses.map((biz) => ({
        biz,
        visual: classifyMerchantPin(biz),
      })),
    [businesses]
  );

  const filteredList = useMemo(() => {
    if (filterCategory === 'ALL') return enrichedBusinesses;
    return enrichedBusinesses.filter((entry) => entry.visual.type === filterCategory);
  }, [enrichedBusinesses, filterCategory]);

  const counts = useMemo(() => {
    const c = { ALL: enrichedBusinesses.length, PI_ACCEPTED: 0, AD_ONLY: 0, DOUBLE_RING: 0 };
    enrichedBusinesses.forEach((entry) => {
      c[entry.visual.type]++;
    });
    return c;
  }, [enrichedBusinesses]);

  if (!isOpen) return null;

  const handlePayWithPi = async (biz: MerchantBusinessItem) => {
    const parsedAmount = Number(piAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Inserisci un importo in Pi valido.');
      return;
    }

    setIsPayingPi(true);
    try {
      const payment = await executePiSdkPayment({
        amount: parsedAmount,
        memo: `Pagamento Pi presso ${biz.name} (${biz.city || 'Territorio'})`,
        metadata: { merchantId: biz.id, merchantName: biz.name },
      });

      if (payment.success) {
        toast.success(`Pagamento di ${parsedAmount} π completato!`, {
          description: `Ricevuta: ${payment.txId || 'Pi Network Verificato'}`,
        });
      } else {
        toast.error(payment.error || 'Pagamento Pi annullato o non disponibile.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Errore durante il pagamento Pi Network.');
    } finally {
      setIsPayingPi(false);
    }
  };

  // VISTA 1: DETTAGLIO SINGOLO COMMERCIANTE
  if (selectedBusiness) {
    const visual = classifyMerchantPin(selectedBusiness);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
          {/* Header colorato per distinzione chiara Pi vs Pubblicità */}
          <div
            className="px-6 py-4 border-b border-zinc-800 flex items-start justify-between gap-3"
            style={{
              background:
                visual.type === 'DOUBLE_RING'
                  ? 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(139,92,246,0.22), rgba(9,9,11,0.95))'
                  : visual.type === 'PI_ACCEPTED'
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.28), rgba(245,158,11,0.15), rgba(9,9,11,0.95))'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.12), rgba(9,9,11,0.95))',
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border-2 shadow-lg"
                style={{
                  borderColor: visual.outerRingColor,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                }}
              >
                {visual.icon}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${visual.badgeClass}`}>
                    {visual.badgeLabel}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white truncate">{selectedBusiness.name}</h2>
                <p className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <span>{selectedBusiness.categoryLabel || selectedBusiness.category || 'Attività Locale'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                    <Star className="w-3 h-3 fill-amber-300" />
                    {(selectedBusiness.rating ?? 4.9).toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer shrink-0"
              title="Chiudi scheda"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenuto dettagliato */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <p className="text-zinc-200 leading-relaxed text-sm">
              {selectedBusiness.description || visual.description}
            </p>

            {/* Vetrina / Volantino se presente */}
            {(selectedBusiness.adHeadline || selectedBusiness.promo) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-black uppercase tracking-wider text-[11px]">
                  <Megaphone className="w-4 h-4" />
                  <span>Volantino & Promo Attiva</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {selectedBusiness.adHeadline || selectedBusiness.promo}
                </p>
              </div>
            )}

            {/* Box Pagamento diretto in Pi se il commerciante accetta Pi */}
            {visual.hasPi ? (
              <div className="p-4 rounded-2xl bg-purple-950/35 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-purple-300" />
                    <span className="font-black text-purple-200 uppercase tracking-wider text-[11px]">
                      Accetta Pagamenti Pi Network (π)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px] border border-amber-400/30">
                    Viola / Oro
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    value={piAmount}
                    onChange={(e) => setPiAmount(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl bg-black border border-purple-500/40 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    aria-label="Importo in Pi"
                  />
                  <button
                    onClick={() => handlePayWithPi(selectedBusiness)}
                    disabled={isPayingPi}
                    className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isPayingPi ? 'Connessione Pi Wallet...' : `Paga ${piAmount} π in Negozio`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                <span className="text-amber-200 font-semibold">
                  Vetrina commerciale solo pubblicitaria (pagamento tradizionale in sede).
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40 shrink-0">
                  Oro Puro
                </span>
              </div>
            )}

            {/* Metadati logistici */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#00ff66] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Territorio</span>
                  <span className="text-zinc-100 font-semibold truncate block">
                    {selectedBusiness.city || 'Locale'}
                    {selectedBusiness.region ? ` (${selectedBusiness.region})` : ''}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Orari</span>
                  <span className="text-zinc-100 font-semibold truncate block">
                    {selectedBusiness.hours || 'Lun-Sab: 09:00 - 19:30'}
                  </span>
                </div>
              </div>
              {selectedBusiness.phone && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Contatto</span>
                    <span className="text-zinc-100 font-mono font-semibold truncate block">
                      {selectedBusiness.phone}
                    </span>
                  </div>
                </div>
              )}
              {selectedBusiness.website && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Sito Web</span>
                    <span className="text-zinc-100 font-semibold truncate block">
                      {selectedBusiness.website}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer azioni */}
          <div className="px-6 py-4 bg-black border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => onSelectBusiness(null)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tutti i Commercianti</span>
            </button>

            <div className="flex items-center gap-2">
              {onFlyToBusiness && (
                <button
                  onClick={() => {
                    onFlyToBusiness(selectedBusiness);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#00ff66] border border-[#00ff66]/40 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Vai in Urbano 3D</span>
                </button>
              )}
              {onOpenVoiceChat && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVoiceChat(selectedBusiness);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Chat Vocale</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: ELENCO SATELLITE BUSINESS_ADS_SAT (3 TIER DISTINTI)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header Canale Commercianti & Convenzioni */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/15 via-purple-900/20 to-black border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Vetrina Commercianti & Convenzioni Pi</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                  INTELSAT-40E
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Pin distinti: 🪙 Viola/Oro (Accetta Pi) • 📢 Oro Puro (Pubblicità) • 👑 Doppio Anello (Pi + Promo)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPromoteModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPromoteModal();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Promuovi Attività</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtri Categoria Pin */}
        <div className="px-6 py-3 border-b border-zinc-900 flex flex-wrap items-center gap-2 bg-black/50">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
              filterCategory === 'ALL'
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            Tutti ({counts.ALL})
          </button>
          <button
            onClick={() => setFilterCategory('DOUBLE_RING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors flex items-center gap-1.5 ${
              filterCategory === 'DOUBLE_RING'
                ? 'bg-gradient-to-r from-amber-400 to-purple-500 text-black border-amber-300 font-black'
                : 'bg-zinc-900 text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
            }`}
          >
            <span>👑</span>
            <span>Doppio Anello Pi+Promo ({counts.DOUBLE_RING})</span>
          </button>
          <button
            onClick={() => setFilterCategory('PI_ACCEPTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors flex items-center gap-1.5 ${
              filterCategory === 'PI_ACCEPTED'
                ? 'bg-purple-500 text-white border-purple-300 font-black'
                : 'bg-zinc-900 text-purple-300 border-purple-500/40 hover:bg-purple-950/40'
            }`}
          >
            <span>🪙</span>
            <span>Accetta Pi ({counts.PI_ACCEPTED})</span>
          </button>
          <button
            onClick={() => setFilterCategory('AD_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors flex items-center gap-1.5 ${
              filterCategory === 'AD_ONLY'
                ? 'bg-amber-400 text-black border-amber-300 font-black'
                : 'bg-zinc-900 text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
            }`}
          >
            <span>📢</span>
            <span>Solo Pubblicità ({counts.AD_ONLY})</span>
          </button>
        </div>

        {/* Griglia Esercizi Commerciali */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map(({ biz, visual }) => (
            <div
              key={biz.id}
              onClick={() => onSelectBusiness(biz)}
              className="p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-900 border transition-all cursor-pointer flex flex-col justify-between gap-3 group"
              style={{
                borderColor:
                  visual.type === 'PI_ACCEPTED'
                    ? 'rgba(139,92,246,0.55)'
                    : 'rgba(255,215,0,0.45)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{visual.icon}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white truncate group-hover:text-[#00ff66] transition-colors">
                        {biz.name}
                      </h3>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {biz.city} {biz.region ? `• ${biz.region}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${visual.badgeClass}`}>
                  {visual.badgeLabel}
                </span>

                <p className="text-xs text-zinc-300 line-clamp-2">
                  {biz.adHeadline || biz.promo || biz.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[11px]">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {visual.hasPi ? 'Accetta π' : 'Vetrina Oro'}
                </span>
                <span className="text-[#00ff66] font-black group-hover:underline">
                  Apri Scheda →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
