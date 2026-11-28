import React, { useState, useEffect } from 'react';
import {
  User,
  Wallet,
  Coins,
  MapPin,
  ShieldCheck,
  X,
  ArrowDownToLine,
  PlayCircle,
  CheckCircle2,
  Zap,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import {
  getPioneerRewardsState,
  subscribeRewardsState,
  pointsToPi,
  REWARDS_CONFIG,
  PioneerRewardsState,
} from '@/lib/communityRewardsService';
import AdRewardHub from './AdRewardHub';
import PioneerRewardsHubModal from './PioneerRewardsHubModal';

export interface ProfileWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCity: string;
  onSaveCity: (city: string) => void;
  onOpenPiVerification: () => void;
  onOpenZoneListings?: () => void;
}

export default function ProfileWalletModal({
  isOpen,
  onClose,
  savedCity,
  onSaveCity,
  onOpenPiVerification,
  onOpenZoneListings,
}: ProfileWalletModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILO' | 'WALLET' | 'PI_ADS'>('PROFILO');
  const [cityInput, setCityInput] = useState(savedCity || '');
  const [rewardsState, setRewardsState] = useState<PioneerRewardsState>(() => getPioneerRewardsState());
  const [showFullRewardsHub, setShowFullRewardsHub] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCityInput(savedCity || user?.city || '');
    setRewardsState(getPioneerRewardsState());
    const unsub = subscribeRewardsState((next) => setRewardsState(next));
    return () => unsub();
  }, [isOpen, savedCity, user?.city]);

  if (!isOpen) return null;

  const currentPiBalance = pointsToPi(rewardsState.pointsBalance);
  const displayName = user?.name || 'Utente Have2Want';
  const displayHandle = user?.username || '@utente_locale';
  const isVerifiedPioneer = Boolean(user?.verified_pioneer);

  const handleSaveCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cityInput.trim();
    onSaveCity(cleaned);
    toast.success(
      cleaned
        ? `📍 Zona salvata nel profilo: ${cleaned}`
        : '📍 Zona del profilo rimossa'
    );
  };

  return (
    <>
      <div
        id="modal-profile-wallet"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-2xl max-h-[92vh] bg-zinc-950 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Profilo Utente &amp; Wallet Interno
                  </h2>
                  {isVerifiedPioneer && (
                    <span className="text-[10px] font-bold text-[#00ff66] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Pioneer Verificato
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {displayName} · {displayHandle} · Saldo: {currentPiBalance} π ({rewardsState.pointsBalance} pts)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Chiudi Profilo e Wallet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-2.5 border-b border-zinc-900 bg-black flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('PROFILO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border transition-colors ${
                activeTab === 'PROFILO'
                  ? 'bg-purple-500/20 text-purple-200 border-purple-400'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profilo &amp; Tua Zona</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WALLET')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border transition-colors ${
                activeTab === 'WALLET'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Wallet Pi &amp; Prelievi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PI_ADS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border transition-colors ${
                activeTab === 'PI_ADS'
                  ? 'bg-emerald-500/20 text-[#00ff66] border-[#00ff66]'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Guadagna con Pi Ads SDK</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === 'PROFILO' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-zinc-400">Identità Account &amp; Rete Pi</div>
                    <div className="text-base font-black text-white">{displayName}</div>
                    <div className="text-xs text-purple-300 font-mono">{displayHandle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPiVerification();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-amber-400/60 text-amber-300 text-xs font-black flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isVerifiedPioneer ? 'Verifica & Stato Pi SDK' : 'Accedi / Verifica con Pi Network'}</span>
                  </button>
                </div>

                <form
                  onSubmit={handleSaveCitySubmit}
                  className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-black text-[#00ff66]">
                    <MapPin className="w-4 h-4" />
                    <span>La tua Zona / Città (funziona anche senza GPS attivo)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Salva qui la tua città per vedere subito gli annunci della tua zona anche senza attivare il GPS del dispositivo.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Es. Milano, Roma, Napoli, Madrid..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs cursor-pointer shrink-0"
                    >
                      Salva Zona
                    </button>
                  </div>
                  {savedCity && onOpenZoneListings && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenZoneListings();
                      }}
                      className="w-full py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/50 text-sky-300 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Apri Annunci nella tua zona ({savedCity})</span>
                    </button>
                  )}
                </form>

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
              </div>
            )}

            {activeTab === 'WALLET' && (
              <div className="space-y-4">
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
                    onClick={() => setShowFullRewardsHub(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Preleva π / Gestisci Wallet</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs text-zinc-300">
                  <div className="font-black text-white">Wallet Esterno collegato</div>
                  <div className="font-mono text-amber-200 break-all">
                    {rewardsState.pioneerWalletAddress || 'Nessun indirizzo Pi Wallet salvato — impostalo nella finestra Prelievo.'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PI_ADS' && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 text-center">
                  Questa è l&apos;area ufficiale <strong>Pi Network Ads SDK</strong> per accumulare punti sul tuo Wallet (separata dalle pubblicità commerciali delle attività H2W).
                </p>
                <AdRewardHub />
              </div>
            )}
          </div>
        </div>

        <PioneerRewardsHubModal
          isOpen={showFullRewardsHub}
          onClose={() => setShowFullRewardsHub(false)}
        />
      </div>
    </>
  );
}
