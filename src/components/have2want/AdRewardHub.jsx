import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  getPioneerRewardsState,
  subscribeRewardsState,
  awardPoints,
  setAdStreamEnabledPreference,
  pointsToPi,
} from '@/lib/communityRewardsService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Zap, Video, Info } from 'lucide-react';

export default function AdRewardHub() {
  const { user } = useAuth();
  const [rewardsState, setRewardsState] = useState(() => getPioneerRewardsState());
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    setRewardsState(getPioneerRewardsState());
    const unsubscribe = subscribeRewardsState((next) => {
      setRewardsState(next);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const handleEarnListingCredit = async () => {
    setIsWatching(true);
    toast.info('Caricamento inserzione promozionale in corso...');

    setTimeout(() => {
      try {
        const res = awardPoints(
          'QUICK_SPONSOR_AD',
          'Visione video sponsor nell’Hub Pubblicità & Inserzioni'
        );
        if (res.success) {
          toast.success(
            `+${res.pointsEarned} Punti Comunitari aggiunti al tuo saldo unificato!`,
            {
              description: `Saldo attuale: ${res.newBalance} punti (${pointsToPi(res.newBalance)} π)`,
            }
          );
        } else {
          toast.error('Impossibile accreditare i punti in questo momento.');
        }
      } catch {
        toast.error("Errore nell'accredito del credito inserzione");
      } finally {
        setIsWatching(false);
      }
    }, 900);
  };

  const currentPoints = rewardsState?.pointsBalance ?? 0;
  const currentPi = pointsToPi(currentPoints);
  const adStreamEnabled = rewardsState?.adStreamEnabled ?? true;

  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6 bg-[#0f172a] text-slate-100 rounded-2xl border border-slate-700/80 shadow-2xl w-full max-w-md mx-auto">
      {/* Intestazione */}
      <div className="flex justify-between items-center bg-[#1e293b] p-4 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm uppercase tracking-wider">
            <Zap className="w-4 h-4 fill-emerald-400" />
            <span>HUB PUBBLICITÀ & INSERZIONI</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Punti unificati salvati sul tuo account Pioneer
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-400">{currentPoints}</span>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
            Punti ({currentPi} π)
          </p>
        </div>
      </div>

      {/* Spiegazione trasparente */}
      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-200">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-300">Inserzioni gratuite con i punti</p>
          <p className="text-[11px] text-emerald-200/80 leading-relaxed">
            Ogni pubblicazione semplice costa 2 punti (4 punti con dettatura AI). I tuoi punti sono sincronizzati in tempo reale su Firestore e convertibili in Pi Network (1000 punti = 1.0 π).
          </p>
        </div>
      </div>

      {/* Azione di guadagno punti */}
      <div className="space-y-2">
        <Button
          disabled={isWatching}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
          onClick={handleEarnListingCredit}
        >
          {isWatching ? (
            <span className="animate-pulse">Accredito Punti in corso...</span>
          ) : (
            <>
              <Video className="w-4 h-4" />
              <span>Guarda Video Sponsor (+4 Punti Comunitari)</span>
            </>
          )}
        </Button>
      </div>

      {/* Ricarica passiva crediti durante la navigazione */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-200 block">
            Ricarica Passiva Inserzioni
          </span>
          <span className="text-[10px] text-slate-400 block">
            Abilita sponsor rapidi mentre esplori la mappa
          </span>
        </div>
        <Switch
          checked={adStreamEnabled}
          onCheckedChange={(val) => {
            setAdStreamEnabledPreference(Boolean(val));
            toast.info(
              val
                ? 'Ricarica passiva attivata sul tuo profilo'
                : 'Ricarica passiva messa in pausa'
            );
          }}
        />
      </div>
    </div>
  );
}
