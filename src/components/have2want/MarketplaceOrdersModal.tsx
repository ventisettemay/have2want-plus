import React, { useEffect, useState } from 'react';
import { X, Package, Gift, Clock, CheckCircle2, XCircle, RefreshCw, User, Coins, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { executePiSdkPayment } from '@/lib/piSdkService';
import {
  getMarketplaceOrdersForUser,
  cancelMarketplaceOrder,
  confirmMarketplaceOrderPayment,
  failMarketplaceOrderPayment,
  MarketplaceOrder,
} from '@/lib/marketplaceOrdersService';

interface MarketplaceOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name?: string; username?: string } | null;
}

const STATUS_META: Record<MarketplaceOrder['status'], { label: string; className: string; icon: React.ReactNode }> = {
  pending_payment: {
    label: 'In attesa di pagamento',
    className: 'bg-amber-950/50 text-amber-300 border-amber-500/40',
    icon: <Clock className="w-3 h-3" />,
  },
  paid: {
    label: 'Pagato',
    className: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: {
    label: 'Annullato',
    className: 'bg-zinc-900 text-zinc-400 border-zinc-700',
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function MarketplaceOrdersModal({ isOpen, onClose, currentUser }: MarketplaceOrdersModalProps) {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const loadOrders = () => {
    setOrders(getMarketplaceOrdersForUser(currentUser?.username || 'pioneer_me'));
  };

  useEffect(() => {
    if (isOpen) loadOrders();
  }, [isOpen, currentUser?.username]);

  if (!isOpen) return null;

  const handleCancel = (orderId: string) => {
    const updated = cancelMarketplaceOrder(orderId);
    if (updated) {
      toast.info('Ordine annullato', { description: updated.listingTitle });
      loadOrders();
    }
  };

  const handleRetryPayment = async (order: MarketplaceOrder) => {
    setPayingOrderId(order.id);
    try {
      const payment = await executePiSdkPayment({
        amount: order.pricePi,
        memo: `Ordine HAVE2WANT: ${order.listingTitle}`,
        metadata: { orderId: order.id, listingId: order.listingId, retry: true },
      });

      if (payment.success && payment.txId) {
        confirmMarketplaceOrderPayment(order.id, payment.txId);
        toast.success('Pagamento confermato', { description: order.listingTitle });
      } else {
        failMarketplaceOrderPayment(order.id, payment.error || 'Pagamento non completato.');
        toast.error('Pagamento non completato', {
          description: payment.error || 'L\'ordine resta in attesa.',
        });
      }
      loadOrders();
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        <div className="px-5 py-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-black border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">I Miei Ordini</h2>
              <p className="text-[11px] text-zinc-400">Marketplace interno HAVE2WANT · Pi Network</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOrders}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
              aria-label="Aggiorna ordini"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {orders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-black text-white">Nessun ordine presente</h3>
              <p className="text-[11px] text-zinc-400">
                Gli acquisti e i regali effettuati nel marketplace interno compariranno qui.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const meta = STATUS_META[order.status];
              const isGift = Boolean(order.recipientUsername);
              return (
                <div key={order.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isGift ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                        {isGift ? <Gift className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white truncate">{order.listingTitle}</h3>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {order.sellerName} {order.sellerUsername ? `· @${order.sellerUsername}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black flex items-center gap-1 shrink-0 ${meta.className}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <strong className="text-white">{order.pricePi} π</strong>
                    </span>
                    {order.sellerUsername === currentUser?.username && order.buyerUsername !== currentUser?.username ? (
                      <span className="flex items-center gap-1 text-emerald-300">
                        <ShoppingBag className="w-3 h-3" />
                        Vendi a @{order.buyerUsername}
                      </span>
                    ) : isGift ? (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Gift className="w-3 h-3" />
                        Regalo a @{order.recipientUsername}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Per {order.buyerUsername}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-zinc-500">
                      {new Date(order.createdAt).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {order.giftMessage && (
                    <p className="p-2 rounded-xl bg-black border border-zinc-800 text-[11px] text-zinc-300 italic">
                      “{order.giftMessage}”
                    </p>
                  )}

                  {order.txId && (
                    <p className="text-[10px] font-mono text-emerald-400 truncate">
                      tx: {order.txId}
                    </p>
                  )}

                  {order.paymentError && order.status === 'pending_payment' && (
                    <p className="text-[10px] text-amber-300">
                      Pagamento non confermato: {order.paymentError}
                    </p>
                  )}

                  {order.status === 'pending_payment' && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRetryPayment(order)}
                        disabled={payingOrderId === order.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-500/40 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        {payingOrderId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                        {payingOrderId === order.id ? 'Pagamento...' : 'Riprova Pagamento'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(order.id)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold border border-zinc-700 cursor-pointer"
                      >
                        Annulla ordine
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}