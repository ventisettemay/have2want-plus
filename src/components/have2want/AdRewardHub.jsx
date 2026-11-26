import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  getPioneerRewardsState,
  subscribeRewardsState,
  awardPoints,
  setAdStreamEnabledPreference,
  pointsToPi,
} from '@/lib/communityRewardsService';
import { checkIsPiBrowser } from '@/lib/piSdkService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Zap, Video, Info, AlertCircle } from 'lucide-react';

export default function AdRewardHub() {
  const { user } = useAuth();
  const [rewardsState, setRewardsState] = useState(() => getPioneerRewardsState());
  const [isWatching, setIsWatching] = useState(false);

  const hasPiAdsSdk =
    typeof window !== 'undefined' &&
    checkIsPiBrowser() &&
    Boolean(window.Pi?.Ads?.showAd);

  useEffect(() => {
    setRewardsState(getPioneerRewardsState());
    const unsubscribe = subscribeRewardsState((next) => {
      setRewardsState(next);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const handleEarnListingCredit = async () => {
    if (!hasPiAdsSdk) {
      toast.error('Pi Ads Rewarded disponibile solo dentro Pi Browser ufficiale', {
        description: 'Nessun accredito simulato consentito fuori da Pi Network SDK.',
      });
      return;
    }

    setIsWatching(true);
    toast.info('Caricamento annuncio ufficiale Pi Network Ads...');

    try {
      const piAds = window.Pi.Ads;
      if (typeof piAds.isAdReady === 'function' && typeof piAds.requestAd === 'function') {
        const readyRes = await piAds.isAdReady('rewarded');
        if (!readyRes?.ready) {
          await piAds.requestAd('rewarded');
        }
      }

      const showRes = await piAds.showAd('rewarded');
      if (showRes?.result === 'AD_REWARDED') {
        const res = awardPoints(
          'QUICK_SPONSOR_AD',
          'Visione inserzione certificata Pi Ads Rewarded'
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
      } else {
        toast.info('Inserzione non completata: nessun punto accreditato.');
      }
    } catch (err) {
      console.error('Errore Pi Ads Rewarded:', err);
      toast.error('Pi Ads non disponibile o interrotto durante la visione.');
    } finally {
      setIsWatching(false);
    }
  };

  const currentPoints = rewardsState?.pointsBalance ?? 0;
  const currentPi = pointsToPi(currentPoints);
  const adStreamEnabled = rewardsState?.adStreamEnabled ?? true;

  return (
    <div className="flex flex-col gap-4 p-5 bg-[#0f172a] text-slate-100 rounded-2xl border border-slate-700/80 shadow-2xl w-full max-w-md mx-auto">
      {/* Intestazione compatta senza doppia cornice */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm uppercase tracking-wider">
            <Zap className="w-4 h-4 fill-emerald-400" />
            <span>HUB PUBBLICITÀ &amp; PUNTI</span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Saldo comunitario convertibile in Pi
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-400">{currentPoints}</span>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Punti ({currentPi} π)
          </p>
        </div>
      </div>

      {/* Info rapida a riga singola */}
      <div className="flex items-center gap-2.5 text-xs text-emerald-200 bg-emerald-950/30 rounded-xl px-3 py-2.5">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Annuncio: 2 pts (4 pts vocale) · <strong>1000 pts = 1.0 π</strong>
        </span>
      </div>

      {!hasPiAdsSdk && (
        <div className="bg-amber-950/35 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Pi Ads Reale attivo solo dentro <strong>Pi Browser</strong>.
          </span>
        </div>
      )}

      {/* Azione di guadagno punti */}
      <Button
        disabled={isWatching || !hasPiAdsSdk}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 font-black text-xs uppercase py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
        onClick={handleEarnListingCredit}
      >
        {isWatching ? (
          <span className="animate-pulse">Verifica Pi Ads in corso...</span>
        ) : (
          <>
            <Video className="w-4 h-4" />
            <span>
              {hasPiAdsSdk
                ? 'Guarda Video Pi Ads (+4 Punti Comunitari)'
                : 'Pi Ads disponibile solo in Pi Browser'}
            </span>
          </>
        )}
      </Button>

      {/* Preferenza flusso promozionale */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <div>
          <span className="text-xs font-semibold text-slate-200 block">
            Preferenza Sponsor Rapidi
          </span>
          <span className="text-[11px] text-slate-400 block">
            Mostra inserzioni promozionali Pi Ads
          </span>
        </div>
        <Switch
          checked={adStreamEnabled}
          onCheckedChange={(val) => {
            setAdStreamEnabledPreference(Boolean(val));
            toast.info(
              val
                ? 'Preferenza annunci promozionali attivata'
                : 'Preferenza annunci promozionali messa in pausa'
            );
          }}
        />
      </div>
    </div>
  );
}
