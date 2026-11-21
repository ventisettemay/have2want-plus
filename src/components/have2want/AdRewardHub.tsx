import React, { useState, useEffect, useRef } from 'react';
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
import { Zap, Video, Info, Shield, AlertCircle } from 'lucide-react';

interface PiAdsInterface {
  showRewardedVideo: (options: {
    onReward: () => void;
    onError: (error: Error) => void;
    onClose: () => void;
  }) => Promise<void>;
  showInterstitial: (options: {
    onClose: () => void;
    onError: (error: Error) => void;
  }) => Promise<void>;
  isRewardedVideoAvailable: () => Promise<boolean>;
  isInterstitialAvailable: () => Promise<boolean>;
}

interface PiNetworkSDK {
  init: (options: { version: string; sandbox?: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound?: (payment: any) => void
  ) => Promise<{
    accessToken: string;
    user: { uid: string; username: string };
  }>;
  createPayment: (paymentData: any, callbacks?: any) => Promise<any>;
  Ads?: PiAdsInterface;
}

declare global {
  interface Window {
    Pi?: PiNetworkSDK;
  }
}

const win = typeof window !== 'undefined' ? window : ({} as Window & { Pi?: PiNetworkSDK });

export default function AdRewardHub() {
  const { user } = useAuth();
  const [rewardsState, setRewardsState] = useState(() => getPioneerRewardsState());
  const [isWatching, setIsWatching] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [adAvailable, setAdAvailable] = useState<{ rewarded: boolean; interstitial: boolean }>({ rewarded: false, interstitial: false });
  const adCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRewardsState(getPioneerRewardsState());
    const unsubscribe = subscribeRewardsState((next) => {
      setRewardsState(next);
    });
    return () => unsubscribe();
  }, [user?.id]);

  // Verifica disponibilità Pi Ads nativi (solo dentro Pi Browser)
  const checkPiAdsAvailability = async () => {
    if (typeof window !== 'undefined' && win.Pi?.Ads) {
      try {
        const [rewardedAvail, interstitialAvail] = await Promise.all([
          win.Pi.Ads.isRewardedVideoAvailable(),
          win.Pi.Ads.isInterstitialAvailable(),
        ]);
        setAdAvailable({ rewarded: rewardedAvail, interstitial: interstitialAvail });
      } catch (err) {
        console.warn('[Pi Ads] Errore verifica disponibilità:', err);
      }
    }
  };

  useEffect(() => {
    checkPiAdsAvailability();
    // Controllo periodico ogni 30 secondi
    adCheckIntervalRef.current = window.setInterval(checkPiAdsAvailability, 30000);
    return () => {
      if (adCheckIntervalRef.current) clearInterval(adCheckIntervalRef.current);
    };
  }, []);

  const handleEarnListingCredit = async () => {
    // Priorità 1: Pi Ads nativi (rewarded video) se disponibili in Pi Browser
    if (typeof window !== 'undefined' && win.Pi?.Ads?.showRewardedVideo && adAvailable.rewarded) {
      setIsWatching(true);
      setIsLoadingAd(true);
      toast.info('Caricamento video rewarded Pi Network...');

      try {
        await win.Pi.Ads.showRewardedVideo({
          onReward: () => {
            // Ricompensa confermata da Pi Network
            const res = awardPoints(
              'QUICK_SPONSOR_AD',
              'Visione video rewarded Pi Ads (ufficiale)'
            );
            if (res.success) {
              toast.success(
                `+${res.pointsEarned} Punti Comunitari (Pi Ads ufficiale)!`,
                {
                  description: `Saldo attuale: ${res.newBalance} punti (${pointsToPi(res.newBalance)} π)`,
                }
              );
            } else {
              toast.error('Impossibile accreditare i punti.');
            }
          },
          onError: (error: Error) => {
            console.warn('[Pi Ads] Errore rewarded video:', error);
            toast.error('Video non disponibile o annullato. Riprova tra poco.');
          },
          onClose: () => {
            setIsWatching(false);
            setIsLoadingAd(false);
            // Verifica nuovamente disponibilità
            setTimeout(checkPiAdsAvailability, 5000);
          },
        });
      } catch (err) {
        console.error('[Pi Ads] Errore showRewardedVideo:', err);
        toast.error('Errore apertura Pi Ads. Fallback a modalità locale.');
        setIsWatching(false);
        setIsLoadingAd(false);
        // Fallback al metodo locale
        handleLocalAdWatch();
      }
      return;
    }

    // Priorità 2: Fallback locale (modalità web preview / senza Pi Ads disponibili)
    handleLocalAdWatch();
  };

  const handleLocalAdWatch = async () => {
    setIsWatching(true);
    toast.info('Caricamento inserzione promozionale locale...');

    // Simula durata visualizzazione video (min 15-30s per policy)
    await new Promise((r) => setTimeout(r, 2500));

    try {
      const res = awardPoints(
        'QUICK_SPONSOR_AD',
        'Visione video sponsor locale (Hub Pubblicità & Inserzioni)'
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
  };

  const handleShowInterstitial = async () => {
    if (typeof window !== 'undefined' && win.Pi?.Ads?.showInterstitial && adAvailable.interstitial) {
      try {
        await win.Pi.Ads.showInterstitial({
          onClose: () => {
            // Interstitial chiuso
          },
          onError: (error: Error) => {
            console.warn('[Pi Ads] Errore interstitial:', error);
          },
        });
      } catch (err) {
        console.error('[Pi Ads] Errore showInterstitial:', err);
      }
    }
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
          disabled={isWatching || isLoadingAd}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
          onClick={handleEarnListingCredit}
        >
          {isWatching ? (
            <span className="animate-pulse">Accredito Punti in corso...</span>
          ) : isLoadingAd ? (
            <>
              <span className="animate-spin">⟳</span>
              <span>Caricamento Pi Ads...</span>
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              <span>Guarda Video Rewarded (+4 Punti)</span>
              {adAvailable.rewarded && <Shield className="w-3.5 h-3.5 text-emerald-300" title="Pi Ads Ufficiale Disponibile" />}
            </>
          )}
        </Button>

        {/* Interstitial opzionale per navigazione */}
        {(adAvailable.interstitial || typeof window !== 'undefined') && (
          <Button
            variant="outline"
            className="w-full text-xs font-bold py-2 rounded-xl border-slate-700 hover:border-emerald-500"
            onClick={handleShowInterstitial}
            disabled={isWatching}
          >
            <span>Mostra Interstitial Pi Ads (Test)</span>
            {adAvailable.interstitial && <Shield className="w-3.5 h-3.5 text-emerald-300" />}
          </Button>
        )}

        {/* Status indicatori */}
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            {adAvailable.rewarded ? (
              <span className="text-emerald-400">✓ Pi Rewarded Video: Disponibile</span>
            ) : (
              <span className="text-amber-400">⟳ Pi Rewarded Video: Verifica...</span>
            )}
          </span>
          <span className="flex items-center gap-1">
            {adAvailable.interstitial ? (
              <span className="text-emerald-400">✓ Pi Interstitial: Disponibile</span>
            ) : (
              <span className="text-amber-400">⟳ Pi Interstitial: Verifica...</span>
            )}
          </span>
        </div>
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