import React, { useState } from "react";
import {
  Coins,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  Send
} from "lucide-react";
import { HaveWantListing } from "../types";
import { ListingOriginBadge } from "@/components/have2want/ListingOriginBadge";
import { toast } from "sonner";
import { executePiSdkPayment } from "@/lib/piSdkService";

interface PiPaymentModalProps {
  listing: HaveWantListing;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (txId: string) => void;
}

export const PiPaymentModal: React.FC<PiPaymentModalProps> = ({
  listing,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<"checkout" | "connecting_wallet" | "confirm_in_wallet" | "confirmed">("checkout");
  const [txId, setTxId] = useState<string>("");

  if (!isOpen) return null;

  const price = listing.piPrice && listing.piPrice > 0 ? listing.piPrice : 1;

  const handleLaunchPiWallet = async () => {
    setStep("connecting_wallet");

    // Se siamo dentro il Pi Browser nativo con window.Pi.createPayment attivo
    if (typeof window !== "undefined" && window.Pi && typeof window.Pi.createPayment === "function") {
      try {
        const result = await executePiSdkPayment({
          amount: price,
          memo: `HAVE2WANT #${listing.id}: ${listing.title.slice(0, 25)}`,
          metadata: { listingId: listing.id, author: listing.author?.username }
        });
        if (result.success && result.txId) {
          setTxId(result.txId);
          setStep("confirmed");
          if (onPaymentSuccess) {
            onPaymentSuccess(result.txId);
          }
        } else {
          toast.error(result.error || "Pagamento Pi annullato dall'utente.");
          setStep("checkout");
        }
      } catch (err: any) {
        toast.error("Errore durante l'apertura del Pi Wallet.");
        setStep("checkout");
      }
    } else {
      // Ambiente web preview: mostra il passaggio di conferma
      setTimeout(() => {
        setStep("confirm_in_wallet");
      }, 1000);
    }
  };

  const handleConfirmPaymentOnExternalWallet = async () => {
    const result = await executePiSdkPayment({
      amount: price,
      memo: `HAVE2WANT #${listing.id}: ${listing.title.slice(0, 25)}`,
      metadata: { listingId: listing.id, author: listing.author?.username }
    });
    if (result.success && result.txId) {
      setTxId(result.txId);
      setStep("confirmed");
      if (onPaymentSuccess) {
        onPaymentSuccess(result.txId);
      }
    } else {
      toast.error(result.error || "Errore durante il pagamento Pi.");
      setStep("checkout");
    }
  };

  const handleResetAndClose = () => {
    setStep("checkout");
    setTxId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white">Acquisto In-App</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Esterno Non-Custodial
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autorizzazione diretta sul tuo Pi Wallet</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* STEP 1: SUMMARY IN-APP */}
          {step === "checkout" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <span>Riepilogo Scambio</span>
                  <ListingOriginBadge listing={listing} size="xs" />
                </div>
                <div className="text-sm font-extrabold text-white line-clamp-1">{listing.title}</div>
                
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Destinatario / Autore:</span>
                  <span className="text-slate-200 font-mono font-bold">{listing.author.name} ({listing.author.username})</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Importo da confermare:</span>
                  <span className="text-lg font-black text-amber-300 font-mono">{price} π</span>
                </div>
              </div>

              {/* Non-custodial guarantee note */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Zero intermediari:</strong> Cliccando procedi, l'app chiama il Pi SDK ufficiale. Firmerai e confermerai la transazione direttamente dal tuo <strong>Pi Wallet esterno</strong>.
                </p>
              </div>

              <button
                onClick={handleLaunchPiWallet}
                id="btn-launch-pi-wallet-checkout"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Smartphone className="w-4 h-4" />
                <span>Collega al Pi Wallet & Procedi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: CONNECTING TO PI BROWSER */}
          {step === "connecting_wallet" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 animate-pulse">
                <Smartphone className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Apertura Pi Wallet Esterno...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Comunicazione sicura con il Pi Browser / SDK ufficiale per generare il mandato di pagamento.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: EXTERNAL WALLET CONFIRMATION SIMULATOR */}
          {step === "confirm_in_wallet" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.2)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Pi Wallet Ufficiale
                  </span>
                  <span className="font-mono text-slate-400">Passphrase Protetta</span>
                </div>

                <div className="text-center py-2">
                  <div className="text-xs text-slate-400">Autorizzi il trasferimento di</div>
                  <div className="text-3xl font-black text-amber-300 font-mono tracking-tight my-1">{price} π</div>
                  <div className="text-xs text-slate-300 font-mono">A favore di: {listing.author.username}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 text-center">
                  Causale: <span className="text-slate-200">HAVE2WANT #{listing.id} - {listing.title}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setStep("checkout")}
                  className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmPaymentOnExternalWallet}
                  id="btn-confirm-pi-payment-external"
                  className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Conferma nel Wallet</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT CONFIRMED */}
          {step === "confirmed" && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div>
                <h4 className="text-lg font-black text-white">Pagamento Confermato!</h4>
                <p className="text-xs text-emerald-300 font-semibold mt-1">
                  Transazione registrata con successo su Pi Blockchain.
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
                  TX: <span className="text-amber-400">{txId}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-xs text-slate-300 text-left space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  Scambio & Contatto Sbloccato:
                </div>
                <p className="text-slate-400">
                  Puoi ora accordarti in privato con <strong>{listing.author.name}</strong> tramite la bacheca territoriale per il ritiro o l'erogazione del servizio.
                </p>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
              >
                Chiudi e Torna all'App
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
