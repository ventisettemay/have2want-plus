import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Leaf,
  Store,
  Wrench,
  MessageSquare,
  GraduationCap,
  BookOpen,
  TreeDeciduous,
  Stethoscope,
  Apple,
  Hammer,
  Bike,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  HelpCircle,
  Coins,
  Send,
  HeartHandshake,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import {
  CityBuildingId,
  Citizen,
  HaveWantListing,
  CommerceShop,
  SalvavatuttoGuide,
  MemoryArticle,
  PioneerUser
} from "../types";

interface MicroWorldModalProps {
  buildingId: CityBuildingId;
  citizens: Citizen[];
  listings: HaveWantListing[];
  shops: CommerceShop[];
  guides: SalvavatuttoGuide[];
  memories: MemoryArticle[];
  currentUser: PioneerUser;
  onClose: () => void;
  onSelectCitizen: (citizen: Citizen) => void;
  onSelectListing: (listing: HaveWantListing) => void;
  onProposeTrade: (listing: HaveWantListing) => void;
}

export const MicroWorldModal: React.FC<MicroWorldModalProps> = ({
  buildingId,
  citizens,
  listings,
  shops,
  guides,
  memories,
  currentUser,
  onClose,
  onSelectCitizen,
  onSelectListing,
  onProposeTrade,
}) => {
  const [selectedSubElement, setSelectedSubElement] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const giuseppe = citizens.find((c) => c.id === "cit-1") || citizens[0];
  const antonio = citizens.find((c) => c.id === "cit-2") || citizens[1];
  const elena = citizens.find((c) => c.id === "cit-3") || citizens[2];
  const luca = citizens.find((c) => c.id === "cit-4") || citizens[3];
  const clara = citizens.find((c) => c.id === "cit-5") || citizens[4];

  const applesListing = listings.find((l) => l.id === "listing-2") || listings[0];
  const shearsListing = listings.find((l) => l.id === "listing-5") || listings[0];
  const tomatoesListing = listings.find((l) => l.id === "listing-4") || listings[0];
  const bikeListing = listings.find((l) => l.id === "listing-1") || listings[0];
  const drillListing = listings.find((l) => l.id === "listing-3") || listings[0];
  const smartphoneListing = listings.find((l) => l.id === "listing-6") || listings[0];

  const triggerFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl bg-[#030712] border-2 border-emerald-500/60 rounded-[32px] sm:rounded-[36px] shadow-[0_0_100px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
              {buildingId === "giardino" && <Leaf className="w-5 h-5" />}
              {buildingId === "officina" && <Wrench className="w-5 h-5" />}
              {buildingId === "commercio" && <Store className="w-5 h-5" />}
              {buildingId === "piazza" && <MessageSquare className="w-5 h-5" />}
              {buildingId === "scuola" && <GraduationCap className="w-5 h-5" />}
              {buildingId === "memoria" && <BookOpen className="w-5 h-5" />}
              {buildingId === "albero" && <TreeDeciduous className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-emerald-400 font-mono tracking-widest">
                  Ambiente Esplorabile • Fase 1
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                  Tocca gli elementi reali
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {buildingId === "giardino" && "Il Giardino & Orto Civico"}
                {buildingId === "officina" && "L'Officina dei Mestieri & Cicli"}
                {buildingId === "commercio" && "La Bottega & Bazar Locale"}
                {buildingId === "piazza" && "La Piazza Comunale del Dialogo"}
                {buildingId === "scuola" && "La Scuola Aperta dei Saperi"}
                {buildingId === "memoria" && "La Casa della Memoria & Tradizioni"}
                {buildingId === "albero" && "L'Albero Millenario della Vita"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert if triggered */}
        {feedbackMsg && (
          <div className="bg-emerald-500 text-slate-950 px-6 py-2 text-xs font-black flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body / Visual Micro-World Scene */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* ========================================================================= */}
          {/* A. GIARDINO & ORTO CIVICO MICRO-WORLD VIEW                                */}
          {/* ========================================================================= */}
          {buildingId === "giardino" && (
            <div className="space-y-6">
              
              {/* Visual Illustrated Garden Stage */}
              <div className="relative w-full min-h-[360px] rounded-3xl bg-gradient-to-b from-emerald-950/70 via-teal-950/40 to-slate-950 border-2 border-emerald-500/50 p-6 overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Element 1: L'Albero di Mele Biologiche */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => onSelectListing(applesListing)}
                    className="p-4 rounded-2xl bg-slate-950/90 border-2 border-emerald-400 shadow-lg cursor-pointer group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
                        <Apple className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-black">
                        DONO ATTIVO
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                        Albero da Frutto & Mele Bio
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Varietà antica non trattata. Cassa da 5 kg pronta per il ritiro.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold">Dono Libero</span>
                      <span className="text-slate-400 group-hover:text-white flex items-center gap-1 font-bold">
                        Ritira Dono <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>

                  {/* Element 2: Le Cesoie Felco sulla Staccionata (Baratto Diretto) */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => onSelectListing(shearsListing)}
                    className="p-4 rounded-2xl bg-slate-950/90 border-2 border-amber-400 shadow-lg cursor-pointer group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black">
                        <Hammer className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                        BARATTO DIRETTO
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        Cesoie Felco sulla Staccionata
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        In acciaio forgiato per potatura. Scambio con 2 vasi in terracotta o 2.5 Pi.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-mono font-bold">⇄ 2 Vasi Terracotta</span>
                      <span className="text-slate-400 group-hover:text-white flex items-center gap-1 font-bold">
                        Proponi <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>

                  {/* Element 3: I Filari di Pomodori Cuore di Bue (Scambio Concreto) */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => onSelectListing(tomatoesListing)}
                    className="p-4 rounded-2xl bg-slate-950/90 border-2 border-rose-400 shadow-lg cursor-pointer group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-black">
                        <Leaf className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-rose-400 text-slate-950 font-black">
                        SCAMBIO QUANTITATIVO
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-rose-300 transition-colors">
                        Pomodori Cuore di Bue
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        1 kg pomodori freschi di giornata ⇄ 2 kg pasta di grano antico.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-rose-300 font-mono font-bold">1 kg ⇄ 2 kg Pasta</span>
                      <span className="text-slate-400 group-hover:text-white flex items-center gap-1 font-bold">
                        Accetta Scambio <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>

                </div>

                {/* Persona Reale Presente: Giuseppe Verdi */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-950/95 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div
                    onClick={() => onSelectCitizen(giuseppe)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={giuseppe.avatar}
                        alt={giuseppe.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white group-hover:text-emerald-300">
                          {giuseppe.name}
                        </h4>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          🟢 Presente nell'Orto
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {giuseppe.currentActivity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerFeedback(`Richiesta di consulto botanico inviata a ${giuseppe.name}!`)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-transform hover:scale-105 cursor-pointer"
                    >
                      Chiedi Consiglio Fitosanitario
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* B. OFFICINA DEI MESTIERI MICRO-WORLD VIEW                                 */}
          {/* ========================================================================= */}
          {buildingId === "officina" && (
            <div className="space-y-6">
              <div className="relative w-full min-h-[360px] rounded-3xl bg-gradient-to-b from-amber-950/70 via-slate-950 to-slate-950 border-2 border-amber-400/50 p-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Trapano a Percussione sul Banco Lavoro */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => onSelectListing(drillListing)}
                    className="p-5 rounded-2xl bg-slate-950 border-2 border-amber-400/80 cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-400 text-slate-950 font-black">
                        PRESTITO SOLIDALE
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white">
                      Trapano a Percussione Bosch sul Banco
                    </h4>
                    <p className="text-xs text-slate-300">
                      Disponibile per prestito nel weekend. Patto di restituzione pulito + 1 caffè in piazza.
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-amber-300 font-bold">
                      <span>1.0 Pi o Patto Diretto</span>
                      <span className="flex items-center gap-1">Prenota <ArrowRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </motion.div>

                  {/* Bicicletta Rigenerata sul Cavalletto */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => onSelectListing(bikeListing)}
                    className="p-5 rounded-2xl bg-slate-950 border-2 border-sky-400/80 cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-sky-400 text-slate-950 flex items-center justify-center font-black">
                        <Bike className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-black">
                        RIGENERATA
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white">
                      Bicicletta Vintage sul Cavalletto
                    </h4>
                    <p className="text-xs text-slate-300">
                      Completamente revisionata da Luca. Freni, copertoni e catena nuovi.
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-sky-300 font-bold">
                      <span>12.5 Pi / €65 / Permuta</span>
                      <span className="flex items-center gap-1">Acquista / Baratta <ArrowRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </motion.div>

                </div>

                {/* Persone Presenti nell'Officina: Mastro Antonio & Luca */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => onSelectCitizen(antonio)}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400 transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img src={antonio.avatar} alt={antonio.name} className="w-10 h-10 rounded-full object-cover border border-amber-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">{antonio.name}</h4>
                      <span className="text-[10px] text-amber-300">{antonio.role}</span>
                    </div>
                  </div>

                  <div
                    onClick={() => onSelectCitizen(luca)}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-400 transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img src={luca.avatar} alt={luca.name} className="w-10 h-10 rounded-full object-cover border border-sky-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">{luca.name}</h4>
                      <span className="text-[10px] text-sky-300">{luca.role}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* C. BOTTEGA & BAZAR LOCALE MICRO-WORLD VIEW                                */}
          {/* ========================================================================= */}
          {buildingId === "commercio" && (
            <div className="space-y-6">
              <div className="relative w-full min-h-[360px] rounded-3xl bg-gradient-to-b from-purple-950/70 via-slate-950 to-slate-950 border-2 border-purple-400/50 p-6 overflow-hidden space-y-6">
                
                {/* Header Notice on Direct Commerce */}
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-purple-400" />
                    <span><strong>Commercio Locale Reale:</strong> Prodotti Nuovi, Usato Revisionato e Collezionismo. Trattativa diretta con il commerciante.</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    Bazar & Botteghe
                  </span>
                </div>

                {/* 3 Categories Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* 1. NUOVO CON GARANZIA */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onSelectListing(smartphoneListing)}
                    className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/60 cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-black">
                        PRODOTTO NUOVO
                      </span>
                      <span className="text-[10px] text-emerald-300 font-mono">Garanzia 24M</span>
                    </div>
                    <h4 className="text-sm font-black text-white">
                      Smartphone 128GB Sigillato
                    </h4>
                    <p className="text-xs text-slate-300">
                      Disponibile all'acquisto diretto dal negozio in Euro (€499), in Pi Network (85 Pi) o permuta con attrezzatura d'officina.
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-bold">
                      <span>€499 / 85 Pi / Baratto</span>
                      <span className="flex items-center gap-1">Dettagli <ArrowRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </motion.div>

                  {/* 2. USATO REVISIONATO */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onSelectListing(drillListing)}
                    className="p-4 rounded-2xl bg-slate-950 border-2 border-sky-500/60 cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-sky-400 text-slate-950 font-black">
                        USATO SELEZIONATO
                      </span>
                      <span className="text-[10px] text-sky-300 font-mono">Testato 100%</span>
                    </div>
                    <h4 className="text-sm font-black text-white">
                      Trapano a Percussione Bosch 750W
                    </h4>
                    <p className="text-xs text-slate-300">
                      Usato in ottime condizioni con mandrino autoserrante. Disponibile in prestito con patto di cura o acquisto a 4.5 Pi.
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-sky-400 font-bold">
                      <span>Prestito / 4.5 Pi</span>
                      <span className="flex items-center gap-1">Dettagli <ArrowRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </motion.div>

                  {/* 3. COLLEZIONISMO & VINTAGE */}
                  <div className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                        COLLEZIONISMO & VINTAGE
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono">Pezzo Raro</span>
                    </div>
                    <h4 className="text-sm font-black text-white">
                      Macchina da Scrivere Lettera 22
                    </h4>
                    <p className="text-xs text-slate-300">
                      Icona del design industriale perfettamente funzionante con nastro bicolore originale. Scambio o permuta d'autore.
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-amber-300 font-bold">
                      <span>Valore indicativo: 120 € • Baratto o accordo in Pi</span>
                      <span className="text-slate-400">Bazar Storico</span>
                    </div>
                  </div>

                </div>

                {/* Botteghe e Commercianti Reali Registrati */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Botteghe e Attività Reali del Territorio
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {shops.map((shop) => (
                      <div
                        key={shop.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-400/50 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white text-xs">{shop.name}</h5>
                          {shop.isLocalSponsor && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              Sponsor
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{shop.description}</p>
                        <div className="text-[10px] text-slate-300 font-mono">📍 {shop.realAddress || shop.city}</div>
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                          {shop.acceptsEuro && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300">€ Euro</span>}
                          {shop.acceptsPi && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-300">Pi (P2P)</span>}
                          {shop.acceptsBarter && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-sky-300">Baratto</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* D. PIAZZA COMUNALE MICRO-WORLD VIEW                                       */}
          {/* ========================================================================= */}
          {buildingId === "piazza" && (
            <div className="space-y-6">
              <div className="relative w-full min-h-[360px] rounded-3xl bg-gradient-to-b from-amber-950/70 via-slate-950 to-slate-950 border-2 border-amber-400/50 p-6 overflow-hidden space-y-5">
                
                {/* La Fontana Centrale & Chat Parlata */}
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-400/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-400 font-mono">
                      Fumetti di Conversazione dal Vivo
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold">🟢 5 Cittadini in Ascolto</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                      <img src={clara.avatar} alt={clara.name} className="w-7 h-7 rounded-full object-cover border border-emerald-400" />
                      <div>
                        <span className="font-bold text-emerald-300 block">{clara.name} ({clara.role}):</span>
                        <p className="italic mt-0.5">"{clara.recentQuote}"</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                      <img src={giuseppe.avatar} alt={giuseppe.name} className="w-7 h-7 rounded-full object-cover border border-emerald-400" />
                      <div>
                        <span className="font-bold text-emerald-300 block">{giuseppe.name} ({giuseppe.role}):</span>
                        <p className="italic mt-0.5">"Le cassette di mele sono all'ingresso dell'orto per chiunque ne abbia bisogno."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Studio della Dott.ssa Clara */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">Presidio Medico & Erboristico</h4>
                      <p className="text-xs text-slate-300">Dott.ssa Clara Marconi • Prevenzione e primo soccorso</p>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerFeedback("Consulenza medica richiesta alla Dott.ssa Clara!")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    Chiedi Consulto
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* E. CASA DELLA MEMORIA MICRO-WORLD VIEW                                    */}
          {/* ========================================================================= */}
          {buildingId === "memoria" && (
            <div className="space-y-6">
              <div className="relative w-full min-h-[360px] rounded-3xl bg-gradient-to-b from-rose-950/70 via-slate-950 to-slate-950 border-2 border-rose-400/50 p-6 overflow-hidden space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-rose-500/40 space-y-2.5 hover:border-rose-400 transition-colors"
                    >
                      <span className="text-[9px] font-black uppercase text-rose-300 font-mono">
                        {mem.period}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        {mem.title}
                      </h4>
                      <p className="text-xs text-slate-300 line-clamp-3">
                        {mem.content}
                      </p>
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-rose-300 font-bold">
                        Di {mem.author}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* F. SCUOLA & ALBERO VIEWS (Fallback)                                       */}
          {/* ========================================================================= */}
          {(buildingId === "scuola" || buildingId === "albero") && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <h3 className="text-base font-black text-white">
                {buildingId === "scuola" ? "La Scuola Aperta dei Saperi" : "L'Albero Millenario della Vita"}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {buildingId === "scuola"
                  ? "Corsi di lingua viva, mentoring su Pi Network SDK e botteghe didattiche per tramandare l'artigianato."
                  : "Le radici affondano nella fiducia della comunità; ogni ramo rappresenta una categoria e ogni foglia un'opportunità di scambio reale."}
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Stai esplorando: <b>{buildingId.toUpperCase()}</b></span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Torna alla Vista Panoramica del Paese
          </button>
        </div>

      </motion.div>
    </div>
  );
};
