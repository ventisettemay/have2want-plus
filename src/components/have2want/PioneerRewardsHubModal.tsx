import React, { useState, useEffect } from 'react';
import {
  Coins,
  ShieldCheck,
  ArrowDownToLine,
  PlayCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Sparkles,
  X,
  Lock,
  Flame,
  Wallet,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPioneerRewardsState,
  calculateWithdrawalBreakdown,
  executePiWithdrawal,
  awardPoints,
  pointsToPi,
  REWARDS_CONFIG,
  PioneerRewardsState
} from '@/lib/communityRewardsService';

interface PioneerRewardsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateListing?: () => void;
}

export const PioneerRewardsHubModal: React.FC<PioneerRewardsHubModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateListing
}) => {
  const [rewardsState, setRewardsState] = useState<PioneerRewardsState>(getPioneerRewardsState);
  const [withdrawAmountPi, setWithdrawAmountPi] = useState<number>(0.50);
  const [targetWalletAddress, setTargetWalletAddress] = useState<string>('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState<'convert' | 'earn' | 'history'>('convert');

  useEffect(() => {
    if (isOpen) {
      setRewardsState(getPioneerRewardsState());
      if (!targetWalletAddress && rewardsState.pioneerWalletAddress) {
        setTargetWalletAddress(rewardsState.pioneerWalletAddress);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPiValue = pointsToPi(rewardsState.pointsBalance);
  const progressToMinWithdrawal = Math.min(
    100,
    Math.round((rewardsState.pointsBalance / REWARDS_CONFIG.MIN_WITHDRAWAL_POINTS) * 100)
  );

  const breakdown = calculateWithdrawalBreakdown(withdrawAmountPi);
  const canWithdraw =
    rewardsState.pointsBalance >= breakdown.requiredPoints &&
    breakdown.isValidAmount &&
    targetWalletAddress.trim().length >= 4;

  // Gestione visione sponsor rapido (Pi Ads / Video Sponsor)
  const handleWatchQuickAd = () => {
    setIsWatchingAd(true);
    setAdCountdown(4);

    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWatchingAd(false);
          const result = awardPoints('QUICK_SPONSOR_AD');
          if (result.success) {
            setRewardsState(getPioneerRewardsState());
            toast.success('🎉 Sponsor completato!', {
              description: `Hai guadagnato +${result.pointsEarned} Punti Comunitari (~${pointsToPi(result.pointsEarned)} π).`,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Esecuzione del prelievo con detrazione fee 0.01 Pi
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw) return;

    setIsProcessingWithdrawal(true);
    try {
      const res = await executePiWithdrawal(
        withdrawAmountPi,
        targetWalletAddress,
        rewardsState.pioneerUsername
      );

      if (res.success) {
        setRewardsState(getPioneerRewardsState());
        toast.success('🚀 Prelievo inviato con successo su Pi Network!', {
          description: `Accreditati ${res.netPiSent} π sul tuo wallet (Costo transazione blockchain: -${res.feeDeducted} π). TX: ${res.txHash?.substring(0, 14)}...`,
        });
        setActiveTab('history');
      } else {
        toast.error('Errore durante il prelievo', {
          description: res.error || 'Verifica il saldo o i parametri inseriti.',
        });
      }
    } catch (err: any) {
      toast.error('Errore imprevisto', { description: err.message });
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* HEADER DEDICATO PI NETWORK */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg shadow-amber-500/30">
              π
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Hub Punti Comunitari & Prelievo Pi</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Non-Custodial
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Trasforma il tuo valore reale comunitario in Pi sul tuo wallet esterno
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CARD PRINCIPALE: SALDO PUNTI & PROGRESSIONE VERSO SOGLIA MINIMA 0.50 π */}
        <div className="p-5 bg-zinc-900/60 border-b border-zinc-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Saldo Punti Comunitari Accumulati
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-white font-mono">{rewardsState.pointsBalance}</span>
                <span className="text-sm font-bold text-zinc-400">Punti</span>
                <span className="text-xs text-zinc-500 font-mono">≈</span>
                <span className="text-lg font-black text-amber-300 font-mono">{currentPiValue.toFixed(4)} π</span>
              </div>
            </div>

            {/* Pillola Stato Soglia */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-right">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Soglia Minima Prelievo</div>
              <div className="text-sm font-black text-amber-400 font-mono">
                {REWARDS_CONFIG.MIN_WITHDRAWAL_PI} π ({REWARDS_CONFIG.MIN_WITHDRAWAL_POINTS} Punti)
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Fee rete blockchain: -{REWARDS_CONFIG.BLOCKCHAIN_TRANSACTION_FEE_PI} π
              </div>
            </div>
          </div>

          {/* Barra di avanzamento verso 0.50 Pi */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-zinc-400">Progresso verso il prelievo minimo (0.50 π)</span>
              <span className={progressToMinWithdrawal >= 100 ? 'text-emerald-400 font-mono' : 'text-amber-300 font-mono'}>
                {progressToMinWithdrawal >= 100 ? '✅ SOGLIA RAGGIUNTA!' : `${progressToMinWithdrawal}%`}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  progressToMinWithdrawal >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${progressToMinWithdrawal}%` }}
              />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-5 gap-2 text-xs font-bold pt-2">
          <button
            onClick={() => setActiveTab('convert')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'convert'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Preleva su Pi Wallet</span>
          </button>
          <button
            onClick={() => setActiveTab('earn')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'earn'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Guadagna Punti</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Registro ({rewardsState.history.length})</span>
          </button>
        </div>

        {/* CONTENUTO TAB */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed">
          
          {/* TAB 1: CONVERTI E PRELEVA SU PI WALLET */}
          {activeTab === 'convert' && (
            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              
              {/* Garanzia Etica Non-Custodial */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-zinc-300 text-xs">
                  <div className="font-black text-amber-300">Nessun Wallet Interno Custodial</div>
                  <p>
                    I Pi non rimangono sull'applicazione. Al momento del prelievo, l'app invia i Pi direttamente sul tuo <strong>Pi Wallet esterno ufficiale</strong>. Il costo di transazione della rete Pi (<strong>0.01 π</strong>) viene detratto in modo trasparente dal totale.
                  </p>
                </div>
              </div>

              {/* Input Importo Prelievo */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between font-bold">
                  <label className="text-zinc-300">Importo da Prelevare (in π)</label>
                  <span className="text-amber-400 font-mono">Minimo: {REWARDS_CONFIG.MIN_WITHDRAWAL_PI} π</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min={REWARDS_CONFIG.MIN_WITHDRAWAL_PI}
                    value={withdrawAmountPi}
                    onChange={(e) => setWithdrawAmountPi(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmountPi(Number(currentPiValue.toFixed(2)))}
                    className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold shrink-0 cursor-pointer"
                  >
                    Tutto ({currentPiValue.toFixed(2)} π)
                  </button>
                </div>

                {/* Breakdown Matematico Trasparente */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Importo Lordo richiesto:</span>
                    <span className="text-white font-bold">{breakdown.requestedPi.toFixed(4)} π</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Costo transazione rete Pi (Gas fee):</span>
                    <span className="text-rose-400 font-bold">-{breakdown.feePi.toFixed(2)} π</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Punti Comunitari da convertire:</span>
                    <span className="text-amber-300 font-bold">{breakdown.requiredPoints} Punti</span>
                  </div>
                  <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-sm">
                    <span className="text-emerald-400 font-black">Netto accreditato sul tuo Wallet:</span>
                    <span className="text-emerald-300 font-black text-base">
                      {breakdown.netReceivedPi.toFixed(4)} π
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Destinazione Pi Wallet / Username Pioneer */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <label className="text-zinc-300 font-bold flex items-center justify-between">
                  <span>Il tuo Username Pi Network o Indirizzo Wallet</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Testnet / Sandbox</span>
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="es. @tuo_username_pioneer oppure GD..."
                    value={targetWalletAddress}
                    onChange={(e) => setTargetWalletAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  L'accredito verrà inviato direttamente dal sistema di ricompense HAVE2WANT su questo indirizzo.
                </p>
              </div>

              {/* Pulsante di Invio Prelievo */}
              <button
                type="submit"
                disabled={!canWithdraw || isProcessingWithdrawal}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  canWithdraw && !isProcessingWithdrawal
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isProcessingWithdrawal ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Elaborazione transazione blockchain Pi in corso...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>
                      {rewardsState.pointsBalance < breakdown.requiredPoints
                        ? `Punti insufficienti (Mancano ${breakdown.requiredPoints - rewardsState.pointsBalance} punti)`
                        : `Conferma Prelievo Netto (${breakdown.netReceivedPi.toFixed(2)} π)`}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: GUADAGNA PUNTI (ANNUNCI REALI CON VALORE MAGGIORATO & SPONSOR ISTANTANEI) */}
          {activeTab === 'earn' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                <h3 className="font-black text-white text-xs mb-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#00ff66]" />
                  <span>Modello Economico Bilanciato ed Etico</span>
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Per garantire la sostenibilità dei Pi distribuiti, gli <strong>annunci reali sul territorio</strong> ricevono il punteggio più alto, mentre le micro-azioni assegnano frazioni calibrate.
                </p>
              </div>

              {/* Box 1: Annunci Reali (Alto Valore) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-xs">Pubblica Annuncio Reale P2P</h4>
                      <p className="text-[10px] text-emerald-300 font-bold">Premio massimo sul valore effettivo</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs">
                    +120 Punti (~0.12 π)
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Inserisci un bene o servizio autentico con foto, descrizione accurata e geolocalizzazione sul territorio.
                </p>
                {onOpenCreateListing && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateListing();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Crea Annuncio Reale Adesso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Box 2: Sponsor Istantaneo / Pi Ads Video (Valore Calibrato) */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <PlayCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-xs">Sponsor Istantaneo Partner (Pi Ads)</h4>
                      <p className="text-[10px] text-zinc-400">Micro-ricompensa sostenibile</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-amber-300 font-mono font-bold text-xs">
                    +{REWARDS_CONFIG.EARN_RATES.QUICK_SPONSOR_AD} Punti (~0.004 π)
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Guarda un annuncio sponsorizzato rapido di pochi secondi per sostenere l'ecosistema e alimentare il tuo saldo punti.
                </p>

                {isWatchingAd ? (
                  <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/50 text-center space-y-2">
                    <div className="text-xs text-amber-300 font-bold animate-pulse">
                      📺 Visualizzazione Sponsor in corso...
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{adCountdown}s</div>
                    <p className="text-[10px] text-zinc-500">I punti verranno accreditati automaticamente</p>
                  </div>
                ) : (
                  <button
                    onClick={handleWatchQuickAd}
                    className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Guarda Sponsor Rapido (+{REWARDS_CONFIG.EARN_RATES.QUICK_SPONSOR_AD} Punti)</span>
                  </button>
                )}
              </div>

              {/* Box 3: Scambio Reale Concluso (Premio Record) */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-white text-xs">Stretta di Mano Digitale & Scambio Concluso</h4>
                  <p className="text-[10px] text-zinc-400">Conferma l'incontro e la chiusura positiva dello scambio</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-mono font-black text-xs shrink-0">
                  +250 Punti (~0.25 π)
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTRO STORICO TRANSAZIONI */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {rewardsState.history.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">Nessuna transazione registrata finora.</div>
              ) : (
                rewardsState.history.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className={tx.pointsDelta > 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                          {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} Punti
                        </span>
                        <span className="text-zinc-400 font-normal">({tx.description})</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(tx.timestamp).toLocaleString()} {tx.txHash && `• Hash: ${tx.txHash.substring(0, 16)}...`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        tx.type === 'WITHDRAW_PI' ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {tx.type === 'WITHDRAW_PI' ? 'PRELIEVO PI' : 'ACCREDITO'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Pi Network Sandbox / Testnet Connesso</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold cursor-pointer transition-colors"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
