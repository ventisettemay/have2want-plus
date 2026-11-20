import React, { useState } from 'react';
import { Coins, Volume2, Globe, Clock, ArrowRightLeft, Check, Sparkles, X } from 'lucide-react';
import { formatLocalPrice, getLocalTimeString } from '@/lib/worldAtlas';
import { getCachedPiRealPrice, PI_REAL_PRICE_EUR } from '@/lib/piRealPriceService';
import { toast } from 'sonner';

export default function LocalCurrencyModal({ place, onClose, onLanguageChange, onCurrencyChange }) {
  const [piInput, setPiInput] = useState('1');
  const [localInput, setLocalInput] = useState('');
  const [activeDirection, setActiveDirection] = useState('pi_to_local'); // 'pi_to_local' | 'local_to_pi'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!place) return null;

  const { language, currency, timezone, countryName, name: placeName, flag } = place;
  const piBaseEur = getCachedPiRealPrice()?.priceEur || PI_REAL_PRICE_EUR;
  const rate = currency?.rateToEur ? Number((currency.rateToEur * piBaseEur).toFixed(4)) : (currency?.piRate || piBaseEur);
  const localTime = getLocalTimeString(timezone || 'UTC');

  // Gestione conversione reattiva
  const calculatedLocal = (Number(piInput) || 0) * rate;
  const calculatedPi = (Number(localInput) || 0) / (rate || 1);

  // Pronuncia vocale nella lingua nativa del luogo con Web Speech API
  const handlePlayVoice = () => {
    if (!('speechSynthesis' in window)) {
      toast.info(`Saluto del luogo: "${language?.greeting || 'Benvenuto!'}"`);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(language?.greeting || `Benvenuto a ${placeName}`);
      utterance.lang = language?.code || 'it-IT';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      toast.success(`🗣️ Pronuncia in lingua locale (${language?.name}): "${language?.greeting}"`);
    } catch (err) {
      setIsPlayingAudio(false);
      toast.info(`Saluto: ${language?.greeting}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/98 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden flex flex-col gap-5">
        {/* Glow di sfondo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Modale */}
        <div className="flex items-start justify-between relative z-10 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
              {flag || '🌍'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{placeName}</h3>
                <span className="text-xs text-slate-400 font-medium">({countryName})</span>
              </div>
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span>{currency?.symbol}</span>
                <span>Valuta Ufficiale & Lingua del Luogo</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. SEZIONE LINGUA DEL LUOGO */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/70 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-slate-200">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Lingua Ufficiale del Luogo</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {language?.code || 'IT'}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-700/50">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{language?.name}</span>
                {language?.nativeName && (
                  <span className="text-xs text-slate-400 font-normal">({language.nativeName})</span>
                )}
              </div>
              <div className="text-xs text-emerald-300 italic mt-0.5">
                "{language?.greeting || 'Benvenuto!'}"
              </div>
            </div>

            <button
              onClick={handlePlayVoice}
              disabled={isPlayingAudio}
              className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Ascolta il saluto nella pronuncia nativa"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
              <span>{isPlayingAudio ? 'Riproduco...' : 'Ascolta'}</span>
            </button>
          </div>
        </div>

        {/* 2. SEZIONE VALUTA DEL LUOGO & CONVERTITORE */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/70 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-slate-200">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Valuta del Luogo: {currency?.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-600/40">
              <span>1 π ≈ {currency?.symbol} {rate.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Calcolatore Conversione Pi Coin ↔ Valuta Locale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Box Pi Coin */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Quantità Pi Coin (π)</span>
                <span className="text-emerald-400 font-bold">Network</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-amber-400">π</span>
                <input
                  type="number"
                  step="any"
                  value={piInput}
                  onChange={(e) => {
                    setPiInput(e.target.value);
                    setActiveDirection('pi_to_local');
                  }}
                  className="w-full bg-transparent text-white font-black text-base outline-none"
                  placeholder="1.0"
                />
              </div>
            </div>

            {/* Box Valuta Locale */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-inner flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>Valuta Locale ({currency?.code})</span>
                <span>{currency?.symbol}</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-emerald-400">{currency?.symbol}</span>
                <span className="text-base font-black text-white truncate">
                  {calculatedLocal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Riepilogo conversione */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Stima ufficiale nel territorio:</span>
            <span className="font-bold text-white">
              {piInput || '1'} π = {currency?.symbol} {calculatedLocal.toFixed(2)} {currency?.code}
            </span>
          </div>
        </div>

        {/* 3. FUSO ORARIO & ORA LOCALE */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fuso Orario: <strong className="text-slate-200">{timezone || 'Locale'}</strong></span>
          </div>
          <div className="font-mono font-black text-emerald-400 text-xs">
            🕒 {localTime}
          </div>
        </div>

        {/* Footer Con Azione Conferma */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              toast.success(`Configurazione territorio ${placeName} attiva con ${currency?.code} e lingua ${language?.name}!`);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Conferma e Applica al Territorio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
