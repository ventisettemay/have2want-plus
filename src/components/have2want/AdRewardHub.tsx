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
import { Zap, Video, Info, Shield, AlertCircle, X } from 'lucide-react';

// NOTE: Pi Ads SDK non è ufficialmente documentato nella Pi Network SDK pubblica.
// L'integrazione Pi Ads è DISABILITATA fino a conferma ufficiale da Pi Network.
// Non vengono create integrazioni ipotetiche, simulazioni o accrediti alternativi.

export default function AdRewardHub() {
  const { user } = useAuth();
  const [rewardsState, setRewardsState] = useState(() => getPioneerRewardsState());
  const [isWatching, setIsWatching] = useState(false);
  const [adStreamEnabled, setAdStreamEnabled] = useState(() => rewardsState?.adStreamEnabled ?? true);

  useEffect(() => {
    setRewardsState(getPioneerRewardsState());
    const unsubscribe = subscribeRewardsState((next) => {
      setRewardsState(next);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const handleEarnListingCredit = async () => {
    // Pi Ads DISABILITATI: SDK non ufficialmente documentato
    // Nessun video rewarded, interstitial o accredito simulato
    toast.info('Pi Ads non disponibili: SDK non ufficialmente documentato da Pi Network.', {
      description: 'I crediti per annunci verranno abilitati quando Pi Network pubblicherà la documentazione ufficiale Pi Ads SDK.',
      duration: 5000,
    });
  };

  const currentPoints = rewardsState?.pointsBalance ?? 0;
  const currentPi = pointsToPi(currentPoints);

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
          <span className="text-2xl font-black text-emerald-400">{rewardsState?.pointsBalance ?? 0}</span>
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

      {/* Avviso Pi Ads disabilitati */}
      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 leading-relaxed">
          <b>Pi Ads SDK disabilitato</b>: Il Pi Network Ads SDK non è ufficialmente documentato nella SDK pubblica Pi Network. L'integrazione rewarded video/interstitial è disabilitata per evitare integrazioni ipotetiche. Nessun accredito alternativo simulato.
        </div>
      </div>

      {/* Azione di guadagno punti (disabilitata) */}
      <div className="space-y-2">
        <button
          disabled
          className="w-full bg-slate-800 text-slate-500 text-xs uppercase py-3.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Video className="w-4 h-4" />
          <span>Pi Ads Disabilitati — SDK Non Ufficiale</span>
        </button>
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
            setAdStreamEnabled(val);
            setAdStreamEnabledPreference(Boolean(val));
            toast.info(
              val
                ? 'Ricarica passiva attivata sul tuo profilo'
                : 'Ricarica passiva messa in pausa'
            );
          }}
        />
      </div>

      {/* Avviso: ricarica passiva non funzionante senza Pi Ads */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2 text-[10px] text-slate-400">
        <X className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>
          Ricarica passiva richiede Pi Ads SDK ufficiale. Attualmente non disponibile.
        </span>
      </div>
    </div>
  );
}