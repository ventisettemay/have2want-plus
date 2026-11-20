import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Stethoscope,
  Lock,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  Award,
  Coins,
  Tv,
  Mic,
  Building2,
  Handshake,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Smartphone,
  Check,
  X
} from "lucide-react";
import { LegalShieldAgreement } from "../types";
import { AuthorshipCertificateModal, AUTHORSHIP_DATA } from "./AuthorshipCertificateModal";
import {
  INTERNATIONAL_COMPLIANCE_COUNTRIES,
  CountryComplianceLaw,
  getCountryCompliance
} from "../data/internationalCompliance";
import {
  authenticateWithPiPortal,
  executePiSdkPayment,
  checkIsPiBrowser
} from "../lib/piSdkService";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";

interface LegalWelcomeShieldProps {
  onAcceptTerms: (agreement?: LegalShieldAgreement) => void;
  onClose?: () => void;
}

type ShieldTab = "intro" | "no_fiat" | "ads_credits" | "p2p_voice" | "commercial_pi" | "pi_sdk" | "legal_compliance";

export const LegalWelcomeShield: React.FC<LegalWelcomeShieldProps> = ({
  onAcceptTerms,
  onClose,
}) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<ShieldTab>("intro");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("IT");
  const [showCertificate, setShowCertificate] = useState(false);

  // Le 5 Spunte di Responsabilità e Conformità
  const [checkDeveloperDisclaimer, setCheckDeveloperDisclaimer] = useState(false);
  const [checkNoFiat, setCheckNoFiat] = useState(false);
  const [checkPrivacy, setCheckPrivacy] = useState(false);
  const [checkAdCommercial, setCheckAdCommercial] = useState(false);
  const [checkP2PHealth, setCheckP2PHealth] = useState(false);

  // Stato autenticazione e test Pi SDK
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [piAuthUser, setPiAuthUser] = useState<{ uid: string; username: string } | null>(null);
  const [piAuthLoading, setPiAuthLoading] = useState(false);
  const [piPaymentTesting, setPiPaymentTesting] = useState(false);
  const [lastPaymentTx, setLastPaymentTx] = useState<string | null>(null);

  // Trova la normativa del paese selezionato
  const currentCountry = getCountryCompliance(selectedCountryCode);

  useEffect(() => {
    setIsPiBrowser(checkIsPiBrowser());
    const storedPioneer = localStorage.getItem('have2want_pioneer_user');
    if (storedPioneer) {
      setPiAuthUser({ uid: 'pioneer_saved', username: storedPioneer });
    }
  }, []);

  const canProceed =
    checkDeveloperDisclaimer &&
    checkNoFiat &&
    checkPrivacy &&
    checkAdCommercial &&
    checkP2PHealth;

  const handleConfirm = () => {
    if (!canProceed) {
      toast.error("È necessario accettare tutte e 5 le clausole legali per accedere alla piattaforma.");
      setActiveTab("legal_compliance");
      return;
    }
    try {
      localStorage.setItem("have2want_legal_accepted", "true");
      localStorage.setItem("have2want_legal_timestamp", new Date().toISOString());
      localStorage.setItem("have2want_legal_country", selectedCountryCode);
    } catch (e) {
      // safe fallback
    }
    const agreement: LegalShieldAgreement = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      version: "4.0.0-LEGAL-GLOBAL-PI-COMPLIANCE",
      p2pDisclaimerAccepted: true,
      specialistHealthShieldAccepted: true,
      privacyFuzzyGeocodingAccepted: true,
      countryCode: selectedCountryCode,
      noFiatAccepted: true,
      developerExonerationAccepted: true,
      adRewardCommercialAccepted: true,
    };
    toast.success("Termini accettati con successo. Benvenuto su HAVE2WANT PLUS!");
    onAcceptTerms(agreement);
  };

  const handleAcceptAll = () => {
    setCheckDeveloperDisclaimer(true);
    setCheckNoFiat(true);
    setCheckPrivacy(true);
    setCheckAdCommercial(true);
    setCheckP2PHealth(true);
    toast.success("Tutte le clausole di conformità sono state selezionate.");
  };

  const handleQuickAcceptAndEnter = () => {
    setCheckDeveloperDisclaimer(true);
    setCheckNoFiat(true);
    setCheckPrivacy(true);
    setCheckAdCommercial(true);
    setCheckP2PHealth(true);
    try {
      localStorage.setItem("have2want_legal_accepted", "true");
      localStorage.setItem("have2want_legal_timestamp", new Date().toISOString());
      localStorage.setItem("have2want_legal_country", selectedCountryCode);
    } catch (e) {}
    const agreement: LegalShieldAgreement = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      version: "4.0.0-LEGAL-GLOBAL-PI-COMPLIANCE",
      p2pDisclaimerAccepted: true,
      specialistHealthShieldAccepted: true,
      privacyFuzzyGeocodingAccepted: true,
      countryCode: selectedCountryCode,
      noFiatAccepted: true,
      developerExonerationAccepted: true,
      adRewardCommercialAccepted: true,
    };
    toast.success("Termini accettati con successo. Benvenuto su HAVE2WANT PLUS!");
    onAcceptTerms(agreement);
  };

  // Test autenticazione Pi Portal
  const handleTestPiAuth = async () => {
    setPiAuthLoading(true);
    const res = await authenticateWithPiPortal();
    setPiAuthLoading(false);
    if (res.success && res.user) {
      setPiAuthUser(res.user);
      login({
        id: res.user.uid,
        uid: res.firebaseUid || res.user.uid,
        name: res.user.username,
        username: res.user.username,
        accessToken: res.accessToken,
        verified_pioneer: !res.isSimulated,
      });
      toast.success(`Autenticato con Pi Portal: ${res.user.username}`);
    } else {
      toast.error(res.error || "Impossibile autenticarsi con Pi Portal.");
    }
  };

  // Test pagamento Pi SDK
  const handleTestPiPayment = async () => {
    setPiPaymentTesting(true);
    const res = await executePiSdkPayment({
      amount: 0.1,
      memo: "Test Funzione Pagamento Pi SDK - HAVE2WANT",
      metadata: { type: "test_verification" },
    });
    setPiPaymentTesting(false);
    if (res.success && res.txId) {
      setLastPaymentTx(res.txId);
      toast.success(`Pagamento Pi SDK confermato! Hash: ${res.txId}`);
    } else {
      toast.error(res.error || "Errore durante il test di pagamento Pi.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-5xl bg-[#060a17] border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_90px_rgba(16,185,129,0.3)] overflow-hidden my-auto flex flex-col max-h-[95vh]"
        >
          {/* Top Bar: Intestazione Istituzionale & Paternità */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0a122c] to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-emerald-500/30 border border-emerald-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-lg">
                <Scale className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                    HAVE2WANT PLUS — Guida Introduttiva, Privacy & Normative Globali
                  </h1>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Obbligatorio
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  WHAT YOU HAVE → WHAT YOU WANT • Mappa 3D, Zero Banche Fiat, Pi Network, Privacy & Esonero Responsabilità
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCertificate(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Visualizza certificato di ideazione esclusiva e data certa"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Paternità & Data Certa</span>
              </button>
              <button
                onClick={handleQuickAcceptAndEnter}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Accetta rapidamente ed entra subito nella piattaforma"
              >
                <span>⚡ Entra Subito</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    handleConfirm();
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={onClose ? "Chiudi guida" : "Conferma spunte per chiudere"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigazione a Schede Tematiche */}
          <div className="flex items-center gap-1 px-4 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("intro")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                activeTab === "intro"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>1. Cosa Fa l'App</span>
            </button>

            <button
              onClick={() => setActiveTab("no_fiat")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                activeTab === "no_fiat"
                  ? "bg-amber-400 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-900/80 text-amber-300 hover:text-amber-200 border border-amber-500/30"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>2. No Fiat • Solo Pi & Baratto</span>
            </button>

            <button
              onClick={() => setActiveTab("ads_credits")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                activeTab === "ads_credits"
                  ? "bg-cyan-400 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-900/80 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>3. Pubblicità & Crediti</span>
            </button>

            <button
              onClick={() => setActiveTab("p2p_voice")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                activeTab === "p2p_voice"
                  ? "bg-teal-400 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-900/80 text-teal-300 hover:text-teal-200 border border-teal-500/30"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>4. Note Vocali & Stretta di Mano</span>
            </button>

            <button
              onClick={() => setActiveTab("commercial_pi")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                activeTab === "commercial_pi"
                  ? "bg-purple-400 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-900/80 text-purple-300 hover:text-purple-200 border border-purple-500/30"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>5. Negozi & Palazzi 3D</span>
            </button>

            <button
              onClick={() => setActiveTab("pi_sdk")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                activeTab === "pi_sdk"
                  ? "bg-yellow-400 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-900/80 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>6. Pi SDK & Portale</span>
            </button>

            <button
              onClick={() => setActiveTab("legal_compliance")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border-2 ${
                activeTab === "legal_compliance"
                  ? "bg-emerald-400 text-slate-950 border-emerald-300 shadow-md font-extrabold"
                  : canProceed
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-950/40 text-rose-300 border-rose-500/40 animate-pulse"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>7. Leggi Mondiali & Spunte {canProceed ? "✓" : "(5 da spuntare)"}</span>
            </button>
          </div>

          {/* Area Contenuto Dinamico */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4">
            
            {/* TAB 1: COSA FA L'APP E COME FUNZIONANO LE COSE ALL'INTERNO */}
            {activeTab === "intro" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>HAVE2WANT PLUS — Il Motore del Valore Circolare Umano</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-normal">
                    <strong>HAVE2WANT PLUS</strong> è la piattaforma territoriale che trasforma il principio <em>"What You Have → What You Want"</em> (Cosa possiedi → Cosa cerchi) in una mappa tridimensionale viva. È uno spazio dove persone, artigiani e piccole attività si incontrano senza intermediari bancari.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      🏢
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Mappa 3D WebGL Reale</h4>
                    <p className="text-[11px] text-slate-400">
                      Visualizza la tua città con edifici tridimensionali, toponomastica ufficiale, visuale satellitare e notturna, senza richiedere plugin esterni.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                      📍
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Centroidi & Geo-Privacy</h4>
                    <p className="text-[11px] text-slate-400">
                      Nessun indirizzo privato viene mai memorizzato né mostrato. Gli annunci sono georeferenziati con sfocatura automatica di ~2.5 km sul centroide comunale.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      🤝
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Tutte le Categorie Solidali</h4>
                    <p className="text-[11px] text-slate-400">
                      Oggetti usati, baratto etico, libri e cultura, passaggi/carpool condivisi, e supporto solidale tra vicini di casa e comunità nel mondo.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0b1329] border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>L'applicazione supporta anche una <strong>Vista Classica ad Alto Contrasto</strong> ottimizzata per accessibilità e ipovedenti.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("no_fiat")}
                    className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Continua: No Fiat</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ZERO VALUTA FIAT • SOLO PI NETWORK & BARATTO ETICO */}
            {activeTab === "no_fiat" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-950/20 border-2 border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl border border-amber-500/40">
                      π
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-amber-300">
                        Zero Valuta Fiat • Nessun Conto Bancario • Solo Pi Network & Baratto
                      </h3>
                      <p className="text-xs text-slate-300">
                        Esclusione assoluta di Euro, Dollari, carte di credito, bonifici bancari o circuiti fiduciari tradizionali.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>100% Non-Custodial</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        HAVE2WANT <strong>non è una banca e non trattiene fondi né criptovalute</strong>. Non ha un wallet interno con custodia. Tutte le transazioni in Pi Coin (π) avvengono direttamente dal tuo Pi Wallet personale sul Pi Browser.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Divieto di Intermediazione Fiat</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Non sono accettati pagamenti in contanti bancari, PayPal o POS. Gli accordi avvengono solo tramite <strong>baratto materiale (merce per merce)</strong> o pagamento crittografico volontario in Pi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sei un Pioneer di Pi Network? L'app è 100% pronta per Pi App Studio ed External Pi Hosting.</span>
                  <button
                    onClick={() => setActiveTab("ads_credits")}
                    className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Come Guardare la Pubblicità</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: COME GUARDARE LA PUBBLICITÀ & GUADAGNARE CREDITI */}
            {activeTab === "ads_credits" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold border border-cyan-500/40">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-cyan-300">
                        Ad-Reward Hub: Guarda la Pubblicità e Guadagna Crediti per le Tue Inserzioni
                      </h3>
                      <p className="text-xs text-slate-300">
                        Un'economia circolare sostenibile dove non spendi un singolo centesimo fiat per pubblicare.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300 pt-1">
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0 text-xs">1</div>
                      <div>
                        <strong className="text-white">Visione Volontaria degli Spot:</strong> Nel menu laterale trovi il pulsante <strong>"Ad-Reward Hub"</strong>. Puoi avviare un video pubblicitario o consultare le inserzioni solidali in qualsiasi momento.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0 text-xs">2</div>
                      <div>
                        <strong className="text-white">Accumulo Punti & Abbuoni Inserzione:</strong> Completando la visione dello spot (senza interruzioni fraudolente) ricevi immediatamente crediti gratuiti per pubblicare nuovi annunci, rinnovare le inserzioni in scadenza o metterle in risalto.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0 text-xs">3</div>
                      <div>
                        <strong className="text-white">Sostenibilità Etica dei Server:</strong> I proventi pubblicitari coprono i costi di infrastruttura cloud e rendering 3D, garantendo un servizio gratuito a vita per tutta la comunità mondiale.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Non vuoi guardare pubblicità? Puoi utilizzare i tuoi Pi Coin per saldare le opzioni avanzate.</span>
                  <button
                    onClick={() => setActiveTab("p2p_voice")}
                    className="px-3 py-1 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Come Interagire & Note Vocali</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: COME INTERAGIRE: NOTE VOCALI P2P & STRETTA DI MANO */}
            {activeTab === "p2p_voice" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-500/40">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-teal-300">
                        Come Interagire: Note Vocali Private e Stretta di Mano con PIN
                      </h3>
                      <p className="text-xs text-slate-300">
                        Comunica a voce senza rivelare il tuo numero privato; sigilla l'accordo con il protocollo a doppio PIN.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <Mic className="w-4 h-4 text-teal-400" />
                        <span>Note Vocali P2P Crittografate</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        In ogni annuncio puoi cliccare su <em>"Nota Vocale"</em>. Tieni premuto il microfono per spiegare cosa offri o cosa cerchi. Il file audio è trasmesso direttamente e non hai bisogno di fornire WhatsApp, Telegram o cellulare personale a sconosciuti.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <Handshake className="w-4 h-4 text-amber-400" />
                        <span>Protocollo "Stretta di Mano"</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Quando vi incontrate di persona per concludere lo scambio, attivate la <em>"Stretta di Mano"</em>: un PIN di sicurezza a 4 cifre viene digitato da entrambe le parti per registrare l'onorabilità dello scambio e aggiornare il Trust Score comunitario.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Massima tutela contro stalking, molestie e spam telefonico.</span>
                  <button
                    onClick={() => setActiveTab("commercial_pi")}
                    className="px-3 py-1 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Negozi & Palazzi 3D</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: EVIDENZE COMMERCIALI & PALAZZI 3D IN PI COIN */}
            {activeTab === "commercial_pi" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/40">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-purple-300">
                        Come le Imprese Pagano la Visibilità: Palazzi 3D Illuminati in Pi Coin
                      </h3>
                      <p className="text-xs text-slate-300">
                        Le attività commerciali del territorio illuminano la propria sede sulla mappa 3D pagando direttamente via Pi SDK.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Tariffario Trasparente in Pi (Zero Euro):</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                        <li><strong>6 π</strong>: Palazzo illuminato in 3D con bagliore dorato per <strong>7 giorni</strong>.</li>
                        <li><strong>10 π</strong>: Palazzo illuminato con banner in rilievo per <strong>14 giorni</strong>.</li>
                        <li><strong>18 π</strong>: Palazzo illuminato con priorità territoriale assoluta per <strong>30 giorni</strong>.</li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-purple-400" />
                        <span>Scudo Anti-Truffa & Ban a 99 Anni:</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Le attività commerciali che tentano di esigere contanti fiat, non rispettano gli accordi stabiliti o ingannano i Pioneer vengono <strong>espulse per 99 anni nel futuro</strong> con revoca immediata del risalto 3D e congelamento del Trust Score.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Il pagamento viene processato con window.Pi.createPayment.</span>
                  <button
                    onClick={() => setActiveTab("pi_sdk")}
                    className="px-3 py-1 rounded-xl bg-purple-400 hover:bg-purple-300 text-slate-950 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Verifica Integrazione Pi SDK</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: AUTENTICAZIONE PORTALE PI & FUNZIONI DI PAGAMENTO PI SDK */}
            {activeTab === "pi_sdk" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-yellow-950/20 border border-yellow-500/40 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-300 flex items-center justify-center font-black text-xl border border-yellow-500/40">
                        π
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-yellow-300">
                          Integrazione Attiva con Pi App Studio & Pi SDK 2.0
                        </h3>
                        <p className="text-xs text-slate-300">
                          Autenticazione nativa Pioneer e pagamenti diretti integrati nell'architettura.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                        isPiBrowser
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}>
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>{isPiBrowser ? "Pi Browser Rilevato" : "Web Preview (Simulatore Attivo)"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Interattive di Test Autenticazione e Pagamento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">1. Autenticazione Pioneer</span>
                        {piAuthUser && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            {piAuthUser.username}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Invoca <code>window.Pi.authenticate(['username', 'payments'])</code> per identificare l'utente Pioneer in modo sicuro senza password.
                      </p>
                      <button
                        onClick={handleTestPiAuth}
                        disabled={piAuthLoading}
                        className="w-full py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{piAuthLoading ? "Verifica in corso..." : "Esegui Autenticazione Pi"}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">2. Pagamento Pi SDK</span>
                        {lastPaymentTx && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {lastPaymentTx}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Invoca <code>window.Pi.createPayment</code> con callback server approval e completion senza toccare la chiave privata dell'utente.
                      </p>
                      <button
                        onClick={handleTestPiPayment}
                        disabled={piPaymentTesting}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{piPaymentTesting ? "Elaborazione transazione..." : "Testa Pagamento Pi (0.10 π)"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Ora consulta e spunta le 5 clausole normative obbligatorie per accedere all'app.</span>
                  <button
                    onClick={() => setActiveTab("legal_compliance")}
                    className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Vai alle Leggi & Spunte</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 7: SCUDO LEGALE, LEGGI NAZIONALI & SPUNTE OBBLIGATORIE */}
            {activeTab === "legal_compliance" && (
              <div className="space-y-4">
                {/* Selettore Nazione per Quadro Giuridico Nazionale e Internazionale */}
                <div className="p-4 rounded-2xl bg-[#090f24] border border-emerald-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Seleziona la tua Nazione / Giurisdizione:
                        </span>
                        <h4 className="text-sm font-black text-white">
                          Quadro Legale Nazionale e Trattati Internazionali Applicabili
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 focus:border-emerald-400 focus:outline-none cursor-pointer"
                      >
                        {INTERNATIONAL_COMPLIANCE_COUNTRIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.flag} {c.name} ({c.langName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scheda Leggi Specifiche della Nazione Selezionata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px] text-slate-300">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-emerald-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Legge Privacy & Trattamento Dati:</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{currentCountry.privacyLaw}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-amber-400 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Esonero Responsabilità Intermediario & Hosting:</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{currentCountry.intermediaryLiabilityLaw}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-cyan-400 font-bold flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        <span>Divieto Fiat & Regolamentazione Baratto/Pi:</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{currentCountry.commercialCurrencyLaw}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-purple-400 font-bold flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>Paternità & Diritto d'Autore Internazionale:</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{currentCountry.copyrightLaw}</p>
                    </div>
                  </div>
                </div>

                {/* LE 5 SPUNTE OBBLIGATORIE INTERATTIVE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      Le 5 Spunte Obbligatorie per l'Accesso:
                    </span>
                    <button
                      onClick={handleAcceptAll}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      ✓ Seleziona tutte le 5 clausole
                    </button>
                  </div>

                  {/* SPUNTA 1: ESONERO TOTALE IDEATORE E SVILUPPATORE */}
                  <div
                    onClick={() => setCheckDeveloperDisclaimer(!checkDeveloperDisclaimer)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      checkDeveloperDisclaimer
                        ? "bg-emerald-950/30 border-emerald-500/80 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checkDeveloperDisclaimer}
                        onChange={(e) => setCheckDeveloperDisclaimer(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white text-xs sm:text-sm">
                            1. Esonero Totale di Responsabilità per l'Ideatore ({AUTHORSHIP_DATA.authorEmail}), il Creatore e gli Sviluppatori
                          </h5>
                          <span className="text-[9px] font-mono uppercase text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded font-bold">
                            Tutela Totale
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          {currentCountry.specificDisclaimers.developerExoneration} 
                          L'ideatore e il team forniscono unicamente il software tecnologico a titolo libero e divulgativo; non sono fiduciari, garanti né custodi di beni e accordi.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SPUNTA 2: ESCLUSIONE TOTALE VALUTA FIAT & ESCLUSIVITÀ PI / BARATTO */}
                  <div
                    onClick={() => setCheckNoFiat(!checkNoFiat)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      checkNoFiat
                        ? "bg-emerald-950/30 border-emerald-500/80 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checkNoFiat}
                        onChange={(e) => setCheckNoFiat(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white text-xs sm:text-sm">
                            2. Divieto di Valuta Fiat & Transazioni 100% Non-Custodial (Solo Pi Network o Baratto Diretto)
                          </h5>
                          <span className="text-[9px] font-mono uppercase text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded font-bold">
                            Zero Banche
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          {currentCountry.specificDisclaimers.noFiatRule} 
                          Dichiaro di non esigere né trasferire Euro, Dollari o bonifici fiat sul circuito, riconoscendo che non esiste custodia fiduciaria di denaro.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SPUNTA 3: PRIVACY TERRITORIALE, CENTROIDI COMUNALI E GDPR */}
                  <div
                    onClick={() => setCheckPrivacy(!checkPrivacy)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      checkPrivacy
                        ? "bg-emerald-950/30 border-emerald-500/80 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checkPrivacy}
                        onChange={(e) => setCheckPrivacy(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white text-xs sm:text-sm">
                            3. Privacy Territoriale, Riservatezza & Centroidi Sfocati (~2.5 km)
                          </h5>
                          <span className="text-[9px] font-mono uppercase text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded font-bold">
                            GDPR & Anonimato
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          {currentCountry.specificDisclaimers.geoPrivacyRule} 
                          Mi impegno a non pubblicare numeri civici o indirizzi di abitazioni private. Accetto il posizionamento sfocato delle coordinate per la sicurezza mia e degli altri.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SPUNTA 4: REGOLAMENTO PUBBLICITÀ AD-REWARD & EVIDENZE COMMERCIALI */}
                  <div
                    onClick={() => setCheckAdCommercial(!checkAdCommercial)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      checkAdCommercial
                        ? "bg-emerald-950/30 border-emerald-500/80 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checkAdCommercial}
                        onChange={(e) => setCheckAdCommercial(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white text-xs sm:text-sm">
                            4. Regolamento Ad-Reward Hub per Crediti & Pagamento Evidenze Commerciali in Pi
                          </h5>
                          <span className="text-[9px] font-mono uppercase text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded font-bold">
                            Ad & Business
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          {currentCountry.specificDisclaimers.adRewardCommercialRule} 
                          Riconosco che la visione di spot pubblicitari è uno strumento comunitario per guadagnare crediti senza costi fiat, e che le evidenze commerciali sono regolate in Pi SDK.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SPUNTA 5: STRETTA DI MANO P2P & SUPPORTO SOLIDALE NON MEDICO */}
                  <div
                    onClick={() => setCheckP2PHealth(!checkP2PHealth)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      checkP2PHealth
                        ? "bg-emerald-950/30 border-emerald-500/80 shadow-md"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checkP2PHealth}
                        onChange={(e) => setCheckP2PHealth(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-950 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-white text-xs sm:text-sm">
                            5. Stretta di Mano P2P, Verifica dei Beni & Esonero Medico/Clinico
                          </h5>
                          <span className="text-[9px] font-mono uppercase text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded font-bold">
                            P2P & Salute
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          {currentCountry.specificDisclaimers.p2pHandshakeRule} 
                          Verificherò personalmente lo stato materiale di ogni bene; accetto che consigli o pareri solidali scambiati tra vicini non hanno valore di perizia legale o atto medico sanitario.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Barra di Conferma Finale */}
          <div className="p-4 sm:p-5 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-400">Stato Spunte:</span>
              <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs flex items-center gap-1.5 ${
                canProceed
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}>
                {canProceed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                <span>
                  {canProceed
                    ? "5/5 Clausole Accettate"
                    : `${[checkDeveloperDisclaimer, checkNoFiat, checkPrivacy, checkAdCommercial, checkP2PHealth].filter(Boolean).length}/5 Clausole`}
                </span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {!canProceed && (
                <button
                  type="button"
                  onClick={handleQuickAcceptAndEnter}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer active:scale-95 border border-amber-300"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>⚡ Accetta Tutte le Clausole ed Entra Subito</span>
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={!canProceed}
                className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                  canProceed
                    ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Accetta Termini ed Entra in HAVE2WANT PLUS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AuthorshipCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
      />
    </>
  );
};
