import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Truck,
  MapPin,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  PackageCheck,
  Wallet,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Order } from '@/types';
import {
  createMarketplaceOrder,
  listMarketplaceOrders,
  updateMarketplaceOrderStatus,
  confirmOrderPickupWithQr,
  getNonCustodialOrderWalletSummary,
  saveNonCustodialOrderWallet,
} from '@/lib/marketplaceOrdersService';
import { checkIsPiBrowser, executePiSdkPayment } from '@/lib/piSdkService';

export interface MarketplaceOrderTarget {
  itemTitle: string;
  sellerUsername: string;
  itemPricePi: number;
  defaultKmZeroPickup?: boolean;
  defaultShippingFeePi?: number;
  locationLabel?: string;
}

interface MarketplaceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem?: MarketplaceOrderTarget | null;
  currentUsername?: string;
}

const STATUS_LABELS: Record<Order['status'], { label: string; badgeClass: string }> = {
  in_attesa_pagamento: {
    label: 'In attesa pagamento non-custodial',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  pagato_in_preparazione: {
    label: 'Pagato · In preparazione',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  spedito: {
    label: 'Spedito con tracking',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  in_consegna: {
    label: 'In consegna',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  completato_ritirato: {
    label: 'Completato / Ritirato',
    badgeClass: 'bg-emerald-500/20 text-[#00ff66] border-emerald-500/40',
  },
  contestato: {
    label: 'Contestato',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

export default function MarketplaceOrderModal({
  isOpen,
  onClose,
  targetItem,
  currentUsername = 'pioneer_me',
}: MarketplaceOrderModalProps) {
  const [activeTab, setActiveTab] = useState<'NUOVO' | 'STORICO'>(targetItem ? 'NUOVO' : 'STORICO');
  const [orders, setOrders] = useState<Order[]>(() => listMarketplaceOrders());
  const [isKmZeroPickup, setIsKmZeroPickup] = useState<boolean>(
    Boolean(targetItem?.defaultKmZeroPickup)
  );
  const [shippingFeePi, setShippingFeePi] = useState<number>(
    targetItem?.defaultKmZeroPickup ? 0 : targetItem?.defaultShippingFeePi ?? 2.5
  );
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [externalWalletAddress, setExternalWalletAddress] = useState<string>(
    () => getNonCustodialOrderWalletSummary().payoutWalletAddress
  );
  const [manualTxId, setManualTxId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [qrInputs, setQrInputs] = useState<Record<string, string>>({});
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setOrders(listMarketplaceOrders());
    setActiveTab(targetItem ? 'NUOVO' : 'STORICO');
    if (targetItem) {
      const kmZero = Boolean(targetItem.defaultKmZeroPickup);
      setIsKmZeroPickup(kmZero);
      setShippingFeePi(kmZero ? 0 : targetItem.defaultShippingFeePi ?? 2.5);
    }
    setExternalWalletAddress(getNonCustodialOrderWalletSummary().payoutWalletAddress);
  }, [isOpen, targetItem]);

  const itemPricePi = Math.max(0, Number(targetItem?.itemPricePi || 0));
  const effectiveShippingPi = isKmZeroPickup ? 0 : Math.max(0, Number(shippingFeePi || 0));
  const totalPi = useMemo(
    () => Math.round((itemPricePi + effectiveShippingPi) * 100) / 100,
    [itemPricePi, effectiveShippingPi]
  );

  if (!isOpen) return null;

  const refreshOrders = () => {
    setOrders(listMarketplaceOrders());
  };

  const handleSaveExternalWallet = () => {
    const saved = saveNonCustodialOrderWallet(externalWalletAddress);
    setExternalWalletAddress(saved.payoutWalletAddress);
    toast.success('Wallet esterno non-custodial salvato per ricezione/riferimento ordini.');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem) return;
    if (!isKmZeroPickup && !shippingAddress.trim()) {
      toast.error('Inserisci l’indirizzo di consegna oppure seleziona il ritiro a Km 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedTxId = manualTxId.trim();

      if (!resolvedTxId && checkIsPiBrowser() && totalPi > 0) {
        const payRes = await executePiSdkPayment({
          amount: totalPi,
          memo: `HAVE2WANT Ordine: ${targetItem.itemTitle.slice(0, 40)}`,
          metadata: {
            seller: targetItem.sellerUsername,
            itemTitle: targetItem.itemTitle,
            isKmZeroPickup,
          },
          requireLivePiBrowser: true,
        });
        if (payRes.success && payRes.txId) {
          resolvedTxId = payRes.txId;
        }
      }

      const created = createMarketplaceOrder({
        buyerUsername: currentUsername,
        sellerUsername: targetItem.sellerUsername,
        itemTitle: targetItem.itemTitle,
        itemPricePi,
        isKmZeroPickup,
        shippingFeePi: effectiveShippingPi,
        shippingAddress: isKmZeroPickup ? targetItem.locationLabel || 'Ritiro in sede Km 0' : shippingAddress,
        handshakeTxId: resolvedTxId || undefined,
      });

      refreshOrders();
      setManualTxId('');
      setActiveTab('STORICO');
      toast.success(
        created.isKmZeroPickup
          ? `Ordine Km 0 registrato (${created.qrPickupCode})`
          : 'Ordine tracciato registrato con modello prezzi separato!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[#00ff66] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Ordini, Ritiro QR &amp; Spedizioni (Non-Custodial)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Prezzo bene + spedizione a zero commissioni • Wallet esterno non-custodial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3 pb-2 border-b border-zinc-900 bg-zinc-950 shrink-0">
          {targetItem && (
            <button
              type="button"
              onClick={() => setActiveTab('NUOVO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                activeTab === 'NUOVO'
                  ? 'bg-[#00ff66] text-black'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white'
              }`}
            >
              Nuovo Ordine
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('STORICO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
              activeTab === 'STORICO'
                ? 'bg-[#00ff66] text-black'
                : 'bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            Ordini Salvati ({orders.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'NUOVO' && targetItem && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#00ff66]">
                      Articolo selezionato
                    </span>
                    <h4 className="text-sm font-black text-white">{targetItem.itemTitle}</h4>
                    <p className="text-[11px] text-zinc-400">
                      Venditore: {targetItem.sellerUsername}
                      {targetItem.locationLabel ? ` • ${targetItem.locationLabel}` : ''}
                    </p>
                  </div>
                  <span className="text-base font-black text-amber-300 shrink-0">
                    {itemPricePi.toFixed(2)} π
                  </span>
                </div>
              </div>

              {/* Modalità ritiro vs spedizione */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsKmZeroPickup(true);
                    setShippingFeePi(0);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isKmZeroPickup
                      ? 'bg-emerald-950/50 border-[#00ff66] text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-black">
                    <MapPin className="w-4 h-4 text-[#00ff66]" />
                    <span>Ritiro sul posto Km 0</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    0 π spedizione + codice QR ritiro verificabile
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsKmZeroPickup(false);
                    if (shippingFeePi <= 0) setShippingFeePi(2.5);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    !isKmZeroPickup
                      ? 'bg-sky-950/50 border-sky-400 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span>Spedizione Tracciata</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Indirizzo consegna + codice tracking corriere
                  </p>
                </button>
              </div>

              {!isKmZeroPickup && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300">
                      Indirizzo / Punto di consegna
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Via, Civico, Città, CAP"
                      className="w-full p-2.5 rounded-xl bg-black border border-zinc-800 text-xs text-white focus:border-[#00ff66] focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-300">Spedizione (π)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={shippingFeePi}
                      onChange={(e) => setShippingFeePi(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl bg-black border border-zinc-800 text-xs text-white focus:border-[#00ff66] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Wallet esterno non-custodial + TxId facoltativo */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet Esterno Non-Custodial (Pi / USDT / P2P)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={externalWalletAddress}
                    onChange={(e) => setExternalWalletAddress(e.target.value)}
                    placeholder="Indirizzo pubblico wallet esterno non-custodial"
                    className="flex-1 p-2 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-white focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveExternalWallet}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-amber-300 cursor-pointer shrink-0"
                  >
                    Salva Wallet
                  </button>
                </div>
                <input
                  type="text"
                  value={manualTxId}
                  onChange={(e) => setManualTxId(e.target.value)}
                  placeholder="TX Hash / Ricevuta Pi Wallet (opzionale fuori da Pi Browser)"
                  className="w-full p-2 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-white focus:border-[#00ff66] focus:outline-none"
                />
              </div>

              {/* Riepilogo prezzi diretto zero-commissioni */}
              <div className="p-4 rounded-2xl bg-black border border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Prezzo articolo</span>
                  <span className="font-mono">{itemPricePi.toFixed(2)} π</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Spedizione ({isKmZeroPickup ? 'Ritiro Km 0' : 'Corriere'})</span>
                  <span className="font-mono">{effectiveShippingPi.toFixed(2)} π</span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>Commissione piattaforma</span>
                  <span className="font-mono">0.00 π (Zero commissioni)</span>
                </div>
                <div className="border-t border-zinc-800 pt-2 mt-1 flex justify-between text-sm font-black text-white">
                  <span>Totale Ordine</span>
                  <span className="text-[#00ff66] font-mono">{totalPi.toFixed(2)} π</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] disabled:opacity-50 text-black font-black text-xs uppercase tracking-wide cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Registrazione ordine in corso...'
                    : `Conferma Ordine (${totalPi.toFixed(2)} π)`}
                </span>
              </button>
            </form>
          )}

          {activeTab === 'STORICO' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                  <Clock className="w-8 h-8 text-zinc-500 mx-auto" />
                  <p className="text-xs font-bold text-zinc-300">Nessun ordine registrato finora.</p>
                  <p className="text-[11px] text-zinc-500">
                    Puoi creare un ordine direttamente da Vetrina Km Zero o Marketplace Globale.
                  </p>
                </div>
              ) : (
                orders.map((ord) => {
                  const statusMeta = STATUS_LABELS[ord.status] || STATUS_LABELS.in_attesa_pagamento;
                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-white text-sm">{ord.itemTitle}</h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {ord.buyerUsername} → {ord.sellerUsername} •{' '}
                            {ord.isKmZeroPickup ? 'Ritiro Km 0' : 'Spedizione'}
                            {ord.shippingAddress ? ` (${ord.shippingAddress})` : ''}
                          </p>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <span className="text-sm font-black text-[#00ff66]">
                            {ord.totalPi.toFixed(2)} π
                          </span>
                          <span className="block text-[10px] text-zinc-400">
                            {ord.isKmZeroPickup ? 'Ritiro Km 0' : `Sped. ${ord.shippingFeePi.toFixed(2)} π`}
                          </span>
                        </div>
                      </div>

                      {ord.qrPickupCode && (
                        <div className="p-2.5 rounded-xl bg-black/70 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[11px]">
                            <QrCode className="w-4 h-4 text-[#00ff66] shrink-0" />
                            <span>
                              Codice QR: <code className="text-[#00ff66] font-bold">{ord.qrPickupCode}</code>
                            </span>
                          </div>
                          {ord.qrPickupValidated ? (
                            <span className="text-[11px] font-bold text-[#00ff66] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ritiro validato
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={qrInputs[ord.id] || ''}
                                onChange={(e) =>
                                  setQrInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                                }
                                placeholder="Inserisci QR ritiro"
                                className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-white w-36"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const res = confirmOrderPickupWithQr(
                                    ord.id,
                                    qrInputs[ord.id] || ord.qrPickupCode || ''
                                  );
                                  if (res.ok) {
                                    toast.success('Ritiro Km 0 confermato!');
                                    refreshOrders();
                                  } else {
                                    toast.error(res.error || 'Codice QR non valido');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#00ff66] text-black font-black text-[10px] cursor-pointer"
                              >
                                Valida Ritiro
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {!ord.isKmZeroPickup && ord.status !== 'completato_ritirato' && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={trackingInputs[ord.id] ?? ord.trackingNumber ?? ''}
                            onChange={(e) =>
                              setTrackingInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                            }
                            placeholder="Codice tracking corriere..."
                            className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg bg-black border border-zinc-800 text-[11px] font-mono text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateMarketplaceOrderStatus(ord.id, 'spedito', {
                                trackingNumber: trackingInputs[ord.id] || ord.trackingNumber || 'TRK-H2W',
                              });
                              toast.success('Stato ordine aggiornato a Spedito');
                              refreshOrders();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Segna Spedito
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateMarketplaceOrderStatus(ord.id, 'completato_ritirato', {
                                qrPickupValidated: true,
                              });
                              toast.success('Consegna confermata!');
                              refreshOrders();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Conferma Consegna
                          </button>
                        </div>
                      )}

                      {ord.handshakeTxId && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                          <AlertCircle className="w-3 h-3 text-emerald-400" />
                          <span>TX Non-Custodial: {ord.handshakeTxId}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
