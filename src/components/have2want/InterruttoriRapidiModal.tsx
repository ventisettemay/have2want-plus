import React from 'react';
import {
  SlidersHorizontal,
  Globe,
  Eye,
  Lock,
  RefreshCw,
  Camera,
  Mic,
  Car,
  Store,
  Handshake,
  ShieldCheck,
  Scale,
  BookOpen,
  X,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';

export interface InterruttoriRapidiModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Stati degli interruttori
  isClassicMode: boolean;
  onToggleClassicMode: () => void;
  isDiscreetMode: boolean;
  onToggleDiscreetMode: () => void;
  isAutoTutorActive?: boolean;
  onToggleAutoTutor?: () => void;
  // Trigger delle altre funzioni
  onOpenCreateModal: () => void;
  onOpenVoiceChat: () => void;
  onOpenCarpool: () => void;
  onOpenShops: () => void;
  onOpenTutor: () => void;
  onOpenLegalShield: () => void;
  onOpenSafePoints: () => void;
  onResetWorld: () => void;
}

export default function InterruttoriRapidiModal({
  isOpen,
  onClose,
  isClassicMode,
  onToggleClassicMode,
  isDiscreetMode,
  onToggleDiscreetMode,
  isAutoTutorActive = true,
  onToggleAutoTutor,
  onOpenCreateModal,
  onOpenVoiceChat,
  onOpenCarpool,
  onOpenShops,
  onOpenTutor,
  onOpenLegalShield,
  onOpenSafePoints,
  onResetWorld,
}: InterruttoriRapidiModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="modal-interruttori-rapidi"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Pannello Interruttori & Funzioni
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Tutto a Portata di Mano
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Attiva, disattiva e apri ogni modulo nel suo posto corretto
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Griglia Interruttori */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* SEZIONE 1: INTERRUTTORI A SWITCH (ON / OFF) */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
              Interruttori di Visualizzazione & Privacy
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Interruttore 1: Vista 3D vs Classica */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visuale 3D / Classica</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {isClassicMode ? 'Modalità Classica 2D' : 'Globo 3D Immersivo'}
                  </p>
                </div>
                <button
                  id="switch-classic-mode"
                  onClick={onToggleClassicMode}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isClassicMode ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                  title="Cambia visuale tra 3D e Classica"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                      isClassicMode ? 'translate-x-6 bg-black' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Interruttore 2: Modalità Discreta Privacy */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Privacy Discreta</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {isDiscreetMode ? 'Attiva: Centroide (~2.5km)' : 'Disattiva: Vista standard'}
                  </p>
                </div>
                <button
                  id="switch-discreet-mode"
                  onClick={onToggleDiscreetMode}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isDiscreetMode ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                  title="Attiva/disattiva mascheramento della posizione"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                      isDiscreetMode ? 'translate-x-6 bg-black' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Interruttore 3: Tutor Intelligente Non Invasivo */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 sm:col-span-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span className="text-emerald-400 text-sm">💡</span>
                    <span>Aiuto Automatico Non Invasivo</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {isAutoTutorActive
                      ? 'Attivo: suggerisce azioni utili e discrete nel momento in cui ti trovi all\'interno'
                      : 'Disattivato: visuale completamente libera da suggerimenti'}
                  </p>
                </div>
                <button
                  id="switch-auto-tutor"
                  onClick={onToggleAutoTutor}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isAutoTutorActive ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                  title="Attiva/disattiva aiuto automatico nel contesto"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                      isAutoTutorActive ? 'translate-x-6 bg-black' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SEZIONE 2: PULSANTI FUNZIONE DEDICATI */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
              Accesso Diretto a Tutti i Moduli
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Tutor Ufficiale */}
              <button
                id="panel-btn-tutor"
                onClick={() => {
                  onClose();
                  onOpenTutor();
                }}
                className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">Tutor Passo-Passo</span>
                    <span className="text-[10px] text-zinc-400">Guida all'uso di ogni funzione</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">Apri →</span>
              </button>

              {/* Pubblica con Fotocamera */}
              <button
                id="panel-btn-create"
                onClick={() => {
                  onClose();
                  onOpenCreateModal();
                }}
                className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Pubblica con Foto</span>
                    <span className="text-[10px] text-zinc-400">Fotocamera & dettatura vocale</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-400">Crea →</span>
              </button>

              {/* Note Vocali */}
              <button
                id="panel-btn-voice"
                onClick={() => {
                  onClose();
                  onOpenVoiceChat();
                }}
                className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Note Vocali Privata</span>
                    <span className="text-[10px] text-zinc-400">Registra e invia messaggi audio</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-400">Parla →</span>
              </button>

              {/* Itinerari & Carpool */}
              <button
                id="panel-btn-carpool"
                onClick={() => {
                  onClose();
                  onOpenCarpool();
                }}
                className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Itinerari & Carpool</span>
                    <span className="text-[10px] text-zinc-400">Viaggi condivisi e tappe</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-400">Viaggia →</span>
              </button>

              {/* Hotel, B&B & Negozi Pi */}
              <button
                id="panel-btn-shops"
                onClick={() => {
                  onClose();
                  onOpenShops();
                }}
                className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Hotel, B&B & Negozi</span>
                    <span className="text-[10px] text-zinc-400">Vetrina 3D Gold (5.00 π)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-400">Vetrina →</span>
              </button>

              {/* Punti Sicuri Incontro */}
              <button
                id="panel-btn-meeting"
                onClick={() => {
                  onClose();
                  onOpenSafePoints();
                }}
                className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-3 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Punti Certificati</span>
                    <span className="text-[10px] text-zinc-400">Luoghi pubblici per lo scambio</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-400">Punti →</span>
              </button>

              {/* Scudo Legale & Manleva */}
              <button
                id="panel-btn-legal"
                onClick={() => {
                  onClose();
                  onOpenLegalShield();
                }}
                className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between gap-3 transition-colors cursor-pointer text-left sm:col-span-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Scudo Legale & Esonero Responsabilità P2P</span>
                    <span className="text-[10px] text-zinc-400">
                      Patto etico tra privati, tutela privacy e zero banche fiat
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-400">Consulta →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-mono">
            HAVE2WANT PLUS • 100% P2P & Non-Custodial
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
