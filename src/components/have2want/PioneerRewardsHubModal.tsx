import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Coins,
  ShieldCheck,
  X,
  Zap,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import {
  getPioneerRewardsState,
  pointsToPi,
  REWARDS_CONFIG,
  PioneerRewardsState,
} from '@/lib/communityRewardsService';

export interface PioneerRewardsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PioneerRewardsHubModal({
  isOpen,
  onClose,
}: PioneerRewardsHubModalProps) {
  const { user } = useAuth();
  const [rewardsState, setRewardsState] = useState<PioneerRewardsState>(() =>
    getPioneerRewardsState()
  );

  const currentPiBalance = pointsToPi(rewardsState.pointsBalance);
  const displayName = user?.name || 'Utente Have2Want';
  const displayHandle = user?.username || '@utente_locale';
  const isVerifiedPioneer = Boolean(user?.verified_pioneer);

  if (!isOpen) return null;

  return (
    <div
      id="modal-pioneer-rewards-hub"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md max-h-[90vh] bg-zinc-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white">
                Wallet Pi &amp; Prelievi
              </h2>
              {isVerifiedPioneer && (
                <span className="text-[10px] font-bold text-[#00ff66] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Pioneer Verificato
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Chiudi Wallet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Saldo Wallet Pi Interno</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {currentPiBalance} π{' '}
                <span className="text-xs text-zinc-400 font-normal">
                  ({rewardsState.pointsBalance} pts)
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Prelievo non-custodial su Pi Wallet (minimo {REWARDS_CONFIG.MIN_WITHDRAWAL_PI} π) e regolamento USDT Polygon/TRC20 per gli acquisti.
              </div>
            </div>

            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Preleva π</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs text-zinc-300">
            <div className="font-black text-white">Wallet Esterno collegato</div>
            <div className="font-mono text-amber-200 break-all">
              {rewardsState.pioneerWalletAddress || 'Nessun indirizzo Pi Wallet salvato — impostalo nella finestra Prelievo.'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-bold">Saldo Wallet Interno</div>
              <div className="text-xl font-black font-mono text-amber-300 mt-0.5">
                {currentPiBalance} π
              </div>
              <div className="text-[11px] text-zinc-500">{rewardsState.pointsBalance} punti comunitari</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 font-bold">Affidabilità Scambi</div>
              <div className="text-xl font-black font-mono text-[#00ff66] mt-0.5 flex items-center gap-1.5">
                <Award className="w-5 h-5" />
                <span>{(user?.trust_rating ?? 4.9).toFixed(1)}</span>
              </div>
              <div className="text-[11px] text-zinc-500">Soglia prelievo: {REWARDS_CONFIG.MIN_WITHDRAWAL_PI} π</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs font-black text-zinc-400 mb-2">Informazioni Account</div>
            <div className="text-xs text-zinc-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Nome</span>
                <span className="text-white">{displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Handle</span>
                <span className="font-mono text-purple-300">{displayHandle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Stato Pi Network</span>
                <span className={isVerifiedPioneer ? 'text-[#00ff66] font-black' : 'text-zinc-500'}>
                  {isVerifiedPioneer ? 'Verificato' : 'Da verificare'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
