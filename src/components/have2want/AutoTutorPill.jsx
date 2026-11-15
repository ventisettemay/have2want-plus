import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  X,
  SlidersHorizontal,
  GraduationCap,
  Sparkles,
  MessageCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export default function AutoTutorPill({
  currentView = 'GLOBO',
  isClassicMode = false,
  isDiscreetMode = true,
  activeFilter = null,
  selectedCountry = null,
  hasActiveModal = false,
  onOpenInterruttori,
  onOpenTutor,
  isEnabled: externalIsEnabled,
  onToggleEnabled: externalToggleEnabled,
}) {
  const [internalEnabled, setInternalEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('h2w_auto_tutor_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const isEnabled = externalIsEnabled !== undefined ? externalIsEnabled : internalEnabled;

  // Mostra all'inizio il benvenuto amichevole: "Ciao! Se hai bisogno di orientarti sono qui"
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTip, setCurrentTip] = useState(null);
  const [isDismissedTemporarily, setIsDismissedTemporarily] = useState(false);

  const toggleEnabled = () => {
    if (externalToggleEnabled) {
      externalToggleEnabled();
    } else {
      const next = !internalEnabled;
      setInternalEnabled(next);
      try {
        localStorage.setItem('h2w_auto_tutor_enabled', JSON.stringify(next));
      } catch {}
    }
  };

  // Suggerimento iniziale amichevole
  useEffect(() => {
    if (!hasShownWelcome) {
      setCurrentTip({
        tag: 'TUTOR DI BENVENUTO',
        icon: '👋',
        title: 'Se hai bisogno di aiuto, sono qui!',
        text: 'Esplora il Globo 3D, cerca o pubblica beni e servizi. Tocca la guida passo-passo per iniziare con facilità.',
        isWelcome: true
      });
      const timer = setTimeout(() => {
        setHasShownWelcome(true);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [hasShownWelcome]);

  // Calcola il suggerimento automatico contestuale in base alle azioni dell'utente
  useEffect(() => {
    if (!hasShownWelcome) return;

    setIsDismissedTemporarily(false);

    if (isClassicMode) {
      setCurrentTip({
        tag: 'MODALITÀ CLASSICA',
        icon: '👓',
        title: 'Vista ad Alta Leggibilità',
        text: 'Visualizza annunci e offerte con caratteri grandi e contrasto elevato. Premi 🌐 3D per tornare al Globo.',
      });
      return;
    }

    if (activeFilter === 'TRASFERTE') {
      setCurrentTip({
        tag: 'TRASFERTE & CARPOOL',
        icon: '🚗',
        title: 'Passaggi tra Privati',
        text: 'Trova o offri posti auto liberi per tratte e trasferte. Rimborso spese diretto in Pi Coin o baratto.',
      });
      return;
    }

    if (activeFilter === 'CERCO') {
      setCurrentTip({
        tag: 'BACHECA CERCO',
        icon: '🔵',
        title: 'Desideri & Necessità',
        text: 'Stai vedendo chi cerca oggetti o aiuti. Se possiedi ciò che chiedono, proponi una Stretta di Mano.',
      });
      return;
    }

    if (activeFilter === 'LIBRI') {
      setCurrentTip({
        tag: 'SCAMBIO LIBRI',
        icon: '📚',
        title: 'Cultura & Testi Scolastici',
        text: 'Donazione e scambio di libri tra famiglie e studenti senza intermediari.',
      });
      return;
    }

    if (selectedCountry) {
      setCurrentTip({
        tag: selectedCountry.name.toUpperCase(),
        icon: selectedCountry.flag || '🌍',
        title: `Territorio: ${selectedCountry.name}`,
        text: 'Filtra per cosa cerchi (Vendo, Scambio, Cerco, Servizi) o tocca 🏙️ Urbano 3D per scendere in città.',
      });
      return;
    }

    if (currentView === 'URBANO_3D') {
      setCurrentTip({
        tag: 'VISTA URBANA 3D',
        icon: '🏙️',
        title: 'Esplorazione Cittadina',
        text: 'Tocca i palazzi e le insegne per scoprire bazar locali e negozi convenzionati con Pi Network.',
      });
      return;
    }

    // Default Home: Globo 3D
    setCurrentTip({
      tag: 'GLOBO TERRESTRE 3D',
      icon: '🌐',
      title: 'Esplorazione Libera',
      text: 'Trascina per ruotare la Terra sull\'asse astronomico reale (23.44°). Tocca un paese per vedere le offerte locali.',
    });
  }, [hasShownWelcome, currentView, isClassicMode, activeFilter, selectedCountry]);

  // Se l'utente ha disattivato il tutor dalle impostazioni
  if (!isEnabled) {
    return (
      <div className="fixed bottom-14 left-3 z-30 pointer-events-auto">
        <button
          onClick={toggleEnabled}
          className="px-2.5 py-1.5 rounded-xl bg-black hover:bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-[#00ff66] text-[11px] font-bold flex items-center gap-1.5 shadow-xl transition-all"
          title="Riattiva i suggerimenti del Tutor"
        >
          <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Tutor: Disattivato (Clicca per attivare)</span>
        </button>
      </div>
    );
  }

  if (hasActiveModal || isDismissedTemporarily || !currentTip) {
    return null;
  }

  // Versione minimizzata (icona non invasiva ma sempre presente ed evidente)
  if (isMinimized) {
    return (
      <div className="fixed bottom-14 left-3 z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-2.5 py-1.5 rounded-xl bg-black hover:bg-zinc-950 border border-zinc-800 text-white shadow-2xl flex items-center gap-2 cursor-pointer transition-transform active:scale-95 group"
          title={`Tutor: ${currentTip.title} (Clicca per espandere)`}
        >
          <div className="w-5 h-5 rounded-lg bg-zinc-900 border border-zinc-800 text-[#00ff66] flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-zinc-200 group-hover:text-[#00ff66]">Tutor attivo</span>
        </button>
      </div>
    );
  }

  // Versione estesa amichevole con messaggio e link alla guida completa
  return (
    <div className="fixed bottom-14 left-3 sm:left-4 z-30 pointer-events-auto max-w-[calc(100vw-24px)] sm:max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 shadow-2xl flex items-start gap-2.5 text-white">
        <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-950 text-[#00ff66] shrink-0 border border-zinc-900 flex items-center justify-center">
          <span className="text-base leading-none">{currentTip.icon}</span>
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 leading-none mb-1">
            <span className="text-[10px] uppercase tracking-wider font-black text-[#00ff66]">
              {currentTip.tag}
            </span>
            <span className="text-[10px] text-zinc-500">•</span>
            <span className="text-[11px] font-bold text-white truncate">
              {currentTip.title}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-300 font-normal mb-1.5">
            {currentTip.text}
          </p>

          {/* Azione rapida per aprire la guida completa del Tutor */}
          {onOpenTutor && (
            <button
              onClick={onOpenTutor}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00ff66] hover:text-white transition-colors cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Apri Guida Passo-Passo</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Azioni del Tutor: Riduci o Chiudi temporaneamente */}
        <div className="flex items-center gap-1 shrink-0 -mr-1">
          {onOpenInterruttori && (
            <button
              onClick={onOpenInterruttori}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Apri pannello interruttori funzioni"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 hover:text-[#00ff66]" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Riduci a pillola minimale"
          >
            <span className="text-xs font-bold leading-none px-0.5">─</span>
          </button>

          <button
            onClick={() => setIsDismissedTemporarily(true)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Nascondi per ora"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
