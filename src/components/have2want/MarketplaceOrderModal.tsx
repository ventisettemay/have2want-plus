import React, { useState } from 'react';
import { X, ShoppingBag, Gift, User, MessageSquare, Coins, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { executePiSdkPayment } from '@/lib/piSdkService';
import {
  createMarketplaceOrder,
  confirmMarketplaceOrderPayment,
  failMarketplaceOrderPayment,
  MarketplaceOrder,
} from '@/lib/marketplaceOrdersService';

export type MarketplaceOrderTarget = MarketplaceOrderListing & {
  currentUsername?: string;
  itemTitle?: string;
  itemPricePi?: number;
  defaultKmZeroPickup?: boolean;
  defaultShippingFeePi?: number;
  locationLabel?: string;
};

export interface MarketplaceOrderListing {
  id?: string;
  title?: string;
  price?: number;
  piPrice?: number;
  sellerName?: string;
  sellerUsername?: string;
}

interface MarketplaceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: MarketplaceOrderListing | null;
  targetItem?: MarketplaceOrderTarget;
  currentUsername?: string;
  currentUser?: { name?: string; username?: string } | null;
  initialMode?: 'self' | 'gift';
  onOrderPlaced?: (order: MarketplaceOrder) => void;
  onOpenOrders?: () => void;
}

export default function MarketplaceOrderModal({
  isOpen,
  onClose,
  listing,
  targetItem,
  currentUsername,
  currentUser,
  initialMode = 'self',
  onOrderPlaced,
  onOpenOrders,
}: MarketplaceOrderModalProps) {
  const [mode, setMode] = useState<'self' | 'gift'>(initialMode);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !listing) return null;

  const pricePi = typeof listing.piPrice === 'number' && listing.piPrice > 0
    ? listing.piPrice
    : (typeof listing.price === 'number' && listing.price > 0 ? listing.price : 0);

  const buyerUsername = currentUser?.username || 'pioneer_me';

  const resetAndClose = () => {
    setMode('self');
    setRecipientUsername('');
    setGiftMessage('');
    setError(null);
    setIsPaying(false);
    onClose();
  };

  const handlePay = async () => {
    setError(null);

    if (!pricePi || pricePi <= 0) {
      setError('Questo annuncio non ha un prezzo in Pi valido per l\'acquisto interno.');
      return;
    }

    if (mode === 'gift') {
      const cleanRecipient = recipientUsername.trim().replace(/^@/, '');
      if (!cleanRecipient) {
        setError('Inserisci lo username del Pioneer destinatario del regalo.');
        return;
      }
      if (cleanRecipient === buyerUsername.replace(/^@/, '')) {
        setError('Il destinatario del regalo deve essere un altro Pioneer.');
        return;
      }
    }

    setIsPaying(true);

    try {
      const order = createMarketplaceOrder({
        listingId: listing.id,
        listingTitle: listing.title,
        sellerName: listing.sellerName || 'Pioniere',
        sellerUsername: listing.sellerUsername || '',
        pricePi,
        buyerUsername,
        recipientUsername: mode === 'gift' ? recipientUsername.trim().replace(/^@/, '') : undefined,
        giftMessage: mode === 'gift' ? giftMessage.trim() || undefined : undefined,
      });

      const payment = await executePiSdkPayment({
        amount: pricePi,
        memo: mode === 'gift'
          ? `Regalo HAVE2WANT: ${listing.title} per @${recipientUsername.trim().replace(/^@/, '')}`
          : `Acquisto HAVE2WANT: ${listing.title}`,
        metadata: {
          orderId: order.id,
          listingId: listing.id,
          type: mode === 'gift' ? 'gift' : 'purchase',
          recipientUsername: mode === 'gift' ? recipientUsername.trim().replace(/^@/, '') : null,
        },
      });

      if (payment.success && payment.txId) {
        const confirmed = confirmMarketplaceOrderPayment(order.id, payment.txId);
        toast.success(
          mode === 'gift'
            ? `🎁 Regalo confermato per @${recipientUsername.trim().replace(/^@/, '')}`
            : '✅ Ordine confermato',
          { description: `Pagamento Pi registrato: ${payment.txId.slice(0, 18)}...` }
        );
        if (confirmed && onOrderPlaced) onOrderPlaced(confirmed);
        resetAndClose();
      } else {
        const message = payment.error || 'Pagamento Pi non completato.';
        failMarketplaceOrderPayment(order.id, message);
        setError(`${message} L'ordine resta in attesa e può essere completato dall'Hub Ordini.`);
        toast.error('Pagamento non completato', { description: message });
      }
    } catch (err: any) {
      setError(err?.message || 'Errore durante la creazione dell\'ordine.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/15 via-zinc-900 to-black border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Acquisto Marketplace Interno</h2>
              <p className="text-[11px] text-zinc-400">Ordine P2P in Pi Network · HAVE2WANT</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Prodotto</span>
            <h3 className="text-sm font-black text-white mt-1">{listing.title}</h3>
            <p className="text-[11px] text-zinc-400 mt-1">
              Venditore: {listing.sellerName || 'Pioniere'} {listing.sellerUsername ? `(@${listing.sellerUsername})` : ''}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-lg font-black text-emerald-300">{pricePi} π</span>
              <span className="text-[10px] text-zinc-500">Prezzo diretto dell'annuncio</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setMode('self'); setError(null); }}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'self'
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <User className="w-4 h-4" />
              Per me
            </button>
            <button
              type="button"
              onClick={() => { setMode('gift'); setError(null); }}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'gift'
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Gift className="w-4 h-4" />
              Regalo
            </button>
          </div>

          {mode === 'gift' && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Destinatario Pioneer</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    placeholder="@username_destinatario"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Messaggio regalo (opzionale)</label>
                <div className="relative mt-1">
                  <MessageSquare className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Un pensiero per te..."
                    rows={2}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-200">{error}</p>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-2">
            <Coins className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400">
              Il pagamento avviene esclusivamente tramite Pi SDK nel Pi Browser. Senza una conferma del server l'ordine resta in attesa e non viene segnato come pagato.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 bg-black border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              resetAndClose();
              if (onOpenOrders) onOpenOrders();
            }}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700 cursor-pointer"
          >
            Vai agli Ordini
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={isPaying}
            className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isPaying ? 'Connessione Pi...' : `Paga ${pricePi} π`}
          </button>
        </div>
      </div>
    </div>
  );
}