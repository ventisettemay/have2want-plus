import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Camera,
  Mic,
  Car,
  Handshake,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  BookOpen,
  HelpCircle,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Lock,
  Layers,
  Coins,
  GraduationCap
} from 'lucide-react';

export interface AppTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionTrigger?: (action: string) => void;
}

const TUTOR_STEPS = [
  {
    id: 'intro',
    stepNumber: 1,
    title: 'Benvenuto in HAVE2WANT PLUS',
    subtitle: 'La Rivoluzione P2P: What You Have → What You Want',
    icon: Sparkles,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'HAVE2WANT PLUS è la piattaforma etica per scambiare beni, competenze, passaggi e servizi direttamente tra persone. Qui non ci sono intermediari bancari né commissioni trattenute: puoi usare il baratto puro o Pi Coin (π) da wallet a wallet.',
    tips: [
      'Nessun intermediario finanziario: gli accordi sono diretti e confidenziali.',
      'Ogni inserzione esprime chiaramente COSA HAI e COSA CERCHI.',
      'Puoi usare l\'app sia in modalità 3D sul Globo sia in modalità Classica ad alta leggibilità.'
    ],
    actionLabel: 'Inizia il Tour',
    actionCode: 'explore'
  },
  {
    id: 'perche_plus',
    stepNumber: 2,
    title: 'Perché PLUS? Molto più di una bacheca',
    subtitle: 'I 5 Pilastri Fondamentali della Nostra Piattaforma',
    icon: Sparkles,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'HAVE2WANT PLUS non è un elenco freddo di annunci, ma una comunità viva per la cooperazione locale e la sovranità economica reale.',
    tips: [
      '1. Territorio 3D: Dal Globo astronomico alle botteghe del tuo comune.',
      '2. Reciprocità Umana: Non solo compravendita, ma baratto, carpooling e tempo condiviso.',
      '3. Zero Banche & Pi Network: Scambi P2P a costo zero valorizzati con Pi Coin (π).',
      '4. Guide Pratiche & Fai-da-Te: Consigli per riparare, riusare e non sprecare.',
      '5. Geoprivacy & Stretta di Mano: Casa protetta (raggio ~2.5km) e incontro sicuro con PIN.'
    ],
    actionLabel: 'Scopri il Globo 3D',
    actionCode: 'explore'
  },
  {
    id: 'globo',
    stepNumber: 3,
    title: 'Il Globo 3D & Inclinazione Terrestre',
    subtitle: 'Esplora il Mondo con Asse Astronomico a 23.44°',
    icon: Globe,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'Il Globo 3D simula fedelmente la Terra con l\'inclinazione astronomica reale (23.44°) e una rotazione naturale automatica. Puoi esplorare tutte le nazioni cliccando sulle bandiere o muovendo la sfera con il dito/mouse.',
    tips: [
      'Tocca e ruota con il dito o mouse: la rotazione si ferma per farti esplorare e riprende da sola dopo pochi secondi.',
      'Clicca su "SCEGLI PAESE" o sulle bandiere per volare subito su una nazione con fuso orario e meteo locale.',
      'Usa il pulsante Urbano 3D per scendere a livello stradale ed esplorare le attività locali.'
    ],
    actionLabel: 'Guarda il Globo',
    actionCode: 'reset_world'
  },
  {
    id: 'annunci_camera',
    stepNumber: 4,
    title: 'Pubblicare Annunci con Foto e Fotocamera',
    subtitle: 'Scatto Istantaneo da Smartphone e Dettatura a Voce',
    icon: Camera,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'Pubblicare un annuncio richiede meno di 30 secondi. Puoi scattare subito una foto dal vivo con la fotocamera del tuo telefono oppure caricare un\'immagine dalla galleria o tramite drag-and-drop.',
    tips: [
      'Usa l\'icona Microfono per dettare a voce titolo e descrizione senza digitare da tastiera.',
      'Scegli l\'intento: Vendo, Cerco, Baratto/Scambio o Servizio.',
      'La tua posizione è sempre protetta con centroide fuzzy: nessuno vedrà mai il tuo indirizzo privato.'
    ],
    actionLabel: 'Apri Modulo Annuncio',
    actionCode: 'open_create'
  },
  {
    id: 'note_vocali',
    stepNumber: 5,
    title: 'Note Vocali & Chat Privata',
    subtitle: 'Accordi a Voce Rapidi e Senza Scambiare Numeri',
    icon: Mic,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'Per una trattativa veloce tra acquirente e venditore (o viaggiatore e albergatore), l\'app dispone di note vocali integrate. Puoi registrare e inviare messaggi audio direttamente nella chat.',
    tips: [
      'Clicca su "Note Vocali" nella barra superiore per ascoltare o inviare audio.',
      'Ottimo per chi viaggia o è alla guida: basta tenere premuto e parlare.',
      'Non serve scambiarsi il numero di cellulare personale: tutto resta discreto all\'interno dell\'app.'
    ],
    actionLabel: 'Apri Note Vocali',
    actionCode: 'open_voice'
  },
  {
    id: 'itinerari_carpool',
    stepNumber: 6,
    title: 'Itinerari, Viaggi & Carpooling',
    subtitle: 'Condividi Tratte, Tappe Intermedie e Spese in Pi',
    icon: Car,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'Hai un viaggio in programma tra città o aeroporti? Oppure cerchi un passaggio? Il modulo Itinerari permette di pubblicare il percorso con tappe intermedie, orario di partenza e posti auto liberi.',
    tips: [
      'Nessuna percentuale trattenuta da agenzie terze.',
      'I compagni di viaggio concordano liberamente un rimborso spese etico in Pi Coin (π) o baratto.',
      'I passeggeri possono contattare l\'autista via chat privata o nota vocale per definire il punto di ritrovo.'
    ],
    actionLabel: 'Vedi Bacheca Itinerari',
    actionCode: 'open_carpool'
  },
  {
    id: 'stretta_mano',
    stepNumber: 7,
    title: 'Stretta di Mano & Punti Certificati',
    subtitle: 'Concludi l\'Accordo in Totale Sicurezza',
    icon: Handshake,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'Quando trovi l\'oggetto o il servizio che ti interessa, premi "Stretta di Mano". Si aprirà una schermata trasparente per siglare l\'intesa reciproca e concordare lo scambio.',
    tips: [
      'Consulta i "Punti Sicuri": luoghi pubblici certificati (piazze, stazioni, municipi) dove incontrarsi senza rischi.',
      'Firma la Stretta di Mano Digitale per confermare l\'onorabilità e il rispetto dell\'accordo.',
      'Puoi assegnare un punteggio e recensire l\'esperienza per rafforzare la fiducia nella comunità.'
    ],
    actionLabel: 'Vedi Punti Sicuri',
    actionCode: 'open_meeting'
  },
  {
    id: 'privacy_legale',
    stepNumber: 8,
    title: 'Privacy, Scudo Legale & Zero Banche',
    subtitle: 'Protezione Giuridica e Libertà Finanziaria P2P',
    icon: ShieldCheck,
    badgeColor: 'bg-zinc-950 text-[#00ff66] border-zinc-800',
    description:
      'HAVE2WANT PLUS protegge gli utenti con uno Scudo Legale e una manleva di non-responsabilità per le transazioni tra privati. La piattaforma non raccoglie dati bancari ed è 100% Non-Custodial.',
    tips: [
      'Usa l\'interruttore "Modalità Discreta" per mascherare la tua posizione su un raggio di 2.5 km.',
      'I tuoi Pi rimangono nel tuo wallet ufficiale esterno o Pi Browser: l\'app non tocca mai le tue chiavi.',
      'In caso di utenti scorretti o spam, il tasto Segnala Abusi applica la moderazione immediata.'
    ],
    actionLabel: 'Leggi Scudo Legale',
    actionCode: 'open_shield'
  }
];

export default function AppTutorModal({ isOpen, onClose, onActionTrigger }: AppTutorModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TUTOR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTOR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, TUTOR_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleAction = () => {
    if (onActionTrigger && currentStep.actionCode) {
      onActionTrigger(currentStep.actionCode);
    }
  };

  return (
    <div
      id="modal-app-tutor"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white"
    >
      <div className="relative w-full max-w-2xl bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Tutor */}
        <div className="px-5 py-3.5 border-b border-zinc-900 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#00ff66]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Tutor Ufficiale HAVE2WANT
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#00ff66] text-black">
                  Guida Passo-Passo
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Impara in pochi passi come usare tutte le funzioni dell'app
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Chiudi Guida"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra di Avanzamento e Step Tabs */}
        <div className="px-5 py-2.5 bg-black border-b border-zinc-900 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            {TUTOR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                  idx === currentStepIndex
                    ? 'bg-[#00ff66] text-black border-[#00ff66]'
                    : idx < currentStepIndex
                    ? 'bg-zinc-950 text-[#00ff66] border-zinc-800 hover:bg-zinc-900'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-white'
                }`}
                title={step.title}
              >
                <span>{step.stepNumber}</span>
                <span className="hidden sm:inline text-[10px]">
                  {step.id === 'intro'
                    ? 'Intro'
                    : step.id === 'globo'
                    ? 'Globo 3D'
                    : step.id === 'annunci_camera'
                    ? 'Annunci & Foto'
                    : step.id === 'note_vocali'
                    ? 'Note Vocali'
                    : step.id === 'itinerari_carpool'
                    ? 'Itinerari'
                    : step.id === 'stretta_mano'
                    ? 'Stretta di Mano'
                    : 'Privacy'}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[11px] text-zinc-400 font-mono shrink-0 pl-2">
            Passo <strong className="text-white">{currentStepIndex + 1}</strong> di {TUTOR_STEPS.length}
          </span>
        </div>

        {/* Contenuto Principale dello Step */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-black">
          {/* Titolo e Icona */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${currentStep.badgeColor}`}
            >
              <StepIcon className="w-6 h-6 text-[#00ff66]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-black tracking-wider text-[#00ff66]">
                CAPITOLO {currentStep.stepNumber} • {currentStep.id.toUpperCase()}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {currentStep.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          {/* Descrizione Principale */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-200 leading-relaxed">
            {currentStep.description}
          </div>

          {/* CARD VISIVE SPECIALI PER LO STEP 1 (COS'È L'APP IN 3 PASSI CHIARISSIMI) */}
          {currentStep.id === 'intro' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
              <div className="p-3 rounded-2xl bg-black border-2 border-emerald-500/40 text-left space-y-1 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#00ff66]">
                  <span className="text-base">🟢</span>
                  <span>1. COSA HO (HAVE)</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Metti sulla mappa ciò che non usi più: oggetti, attrezzi, libri, competenze o un passaggio in macchina.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black border-2 border-sky-500/40 text-left space-y-1 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-black text-sky-400">
                  <span className="text-base">🔵</span>
                  <span>2. COSA CERCO (WANT)</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Cerca cosa ti serve vicino a te: trova vicini e botteghe pronti a barattare o collaborare.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black border-2 border-amber-500/40 text-left space-y-1 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                  <span className="text-base">🤝</span>
                  <span>3. STRETTA DI MANO</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Vi incontrate dal vivo, confermate con il PIN sicuro e scambiate a zero spese o con Pi Coin (π).
                </p>
              </div>
            </div>
          )}

          {/* CARD VISIVE SPECIALI PER LO STEP 2 (PERCHÉ PLUS? I 5 PILASTRI IN 30 SECONDI) */}
          {currentStep.id === 'perche_plus' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
              <div className="p-2.5 rounded-xl bg-black border border-emerald-500/50 flex items-start gap-2">
                <span className="text-xl shrink-0">🌍</span>
                <div>
                  <h5 className="text-xs font-black text-[#00ff66]">1. TERRITORIO 3D VIVO</h5>
                  <p className="text-[11px] text-zinc-300">Non un elenco statico: la tua città, il tuo territorio, meteo e botteghe reali in 3D.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black border border-sky-500/50 flex items-start gap-2">
                <span className="text-xl shrink-0">🔄</span>
                <div>
                  <h5 className="text-xs font-black text-sky-400">2. RECIPROCITÀ UMANA</h5>
                  <p className="text-[11px] text-zinc-300">Non solo vendita: baratto, attrezzi, libri, passaggi auto e tempo condiviso.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black border border-amber-500/50 flex items-start gap-2">
                <span className="text-xl shrink-0">🪙</span>
                <div>
                  <h5 className="text-xs font-black text-amber-400">3. ZERO BANCHE & PI NETWORK</h5>
                  <p className="text-[11px] text-zinc-300">Nessuna commissione: wallet-to-wallet con Pi Coin (π) o accordo diretto.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black border border-teal-500/50 flex items-start gap-2">
                <span className="text-xl shrink-0">🌱</span>
                <div>
                  <h5 className="text-xs font-black text-teal-400">4. GUIDE UTILI & FAI-DA-TE</h5>
                  <p className="text-[11px] text-zinc-300">Impara a riparare oggetti invece di buttarli: consigli pratici e fai-da-te della comunità.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black border border-rose-500/50 flex items-start gap-2 sm:col-span-2">
                <span className="text-xl shrink-0">🛡️</span>
                <div>
                  <h5 className="text-xs font-black text-rose-400">5. GEOPRIVACY & STRETTA DI MANO SICURA</h5>
                  <p className="text-[11px] text-zinc-300">Zero indirizzi privati online (~2.5km sfocato). Incontro in luoghi pubblici con PIN a 4 cifre.</p>
                </div>
              </div>
            </div>
          )}

          {/* Consigli e Punti Chiave */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66]" />
              Cose fondamentali da sapere:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {currentStep.tips.map((tip, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300"
                >
                  <span className="w-5 h-5 rounded-md bg-black text-[#00ff66] font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-zinc-800">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Azione Diretta (Opzionale) per provare subito la funzione */}
          {currentStep.actionLabel && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">Vuoi provarlo adesso?</span>
                <span className="text-[11px] text-zinc-400">
                  Puoi aprire direttamente questa funzione per vederla in azione.
                </span>
              </div>
              <button
                onClick={handleAction}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#00ff66] hover:bg-[#00e65c] text-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{currentStep.actionLabel}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer con Navigazione Avanti / Indietro */}
        <div className="px-5 py-3 border-t border-zinc-900 bg-black flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isFirst
                ? 'opacity-30 cursor-not-allowed text-zinc-600 bg-zinc-950 border border-zinc-900'
                : 'text-zinc-200 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Indietro</span>
          </button>

          {/* Ripeti dall'inizio */}
          <button
            onClick={() => setCurrentStepIndex(0)}
            className="text-[11px] text-zinc-400 hover:text-white hidden sm:flex items-center gap-1 cursor-pointer"
            title="Torna al primo passo"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ricomincia</span>
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#00ff66] hover:bg-[#00e65c] text-black flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
          >
            <span>{isLast ? 'Ho Capito, Inizia!' : 'Avanti'}</span>
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
