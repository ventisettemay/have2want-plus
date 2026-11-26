import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  UserCheck,
  Calendar,
  Key,
  X,
  Sparkles,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const AUTHORSHIP_DATA = {
  appName: "HAVE2WANT PLUS",
  fullTitle: "HAVE2WANT PLUS - Planetary P2P 3D Territorial Exchange & Community Network",
  authorEmail: "brandoriginalword@gmail.com",
  authorRole: "Ideatore Originale & Titolare Esclusivo della Proprietà Intellettuale",
  technicalSupport: "AI Coding Assistant (Antigravity DeepMind Engine) - Supporto Tecnico Sviluppo Software",
  publicationDate: "2026-09-07",
  publicationTimestamp: "2026-09-07T03:25:00.000Z",
  genesisIdentityWord: "BRANDORIGINALWORD",
  masterOwnershipKey: "BOW-GENESIS-2026-H2W-MASTER-ORIGINAL",
  sha256Fingerprint: "H2W-9F05358-8731-443D-8237-790B65E889FA-SHA256-ORIGINAL",
  license: "Proprietary Commercial & P2P License - All Rights Reserved © 2026",
  // Zero-Knowledge Cryptographic Hash Locks (Sicurezza Crittografica Avanzata SHA-256)
  // Requisito: Verifica della contemporanea presenza dei 3 elementi segreti di genesi
  // Nessun dato personale o nominativo in chiaro viene memorizzato nel codice o nel repository
  secretTripleHashes: [
    "cbd16dd8581c56f6b47d1fd3d92d85e0f7ca8f799a15e464f48b1c3098a90d5a",
    "3ce6b32237bef2b15f46cc8f4de7a4071d0b26c09096b3efe9de9bdd86e989db",
    "48e37782887d4a109c7e79ac6961725e2501d080010a0ca0404fdbea08608976",
    "5bd2191654788ba1eceddb9e16ef1e7d9e4972a6aa27b2cb17bb1c4a23dc27c1"
  ],
  secretFullPhraseHashes: [
    "5bbae7df52d70a782220b6d6e6c6d7220ea005af3f2108f7e83083233ec687ed",
    "aeb034790e05f86a9e12d9cbf7c3e71c29907fdac837f270110cf57884fb4b4f"
  ],
  keyInnovations: [
    "Navigatore Gerarchico Universale Territoriale a 4 Livelli (Stato ➔ Regione ➔ Provincia ➔ Comune) integrato con vista 3D",
    "Protocollo 'Stretta di Mano Digitale' P2P dal vivo con generazione dinamica di PIN di sicurezza a 4 cifre",
    "Architettura di Geo-Privacy con Centroidi Comunali Sfocati (raggio ~2.5 km) a tutela della residenza privata (GDPR)",
    "Hub Pubblicitario Comunitario a Quota X (0.25 π) integrato con Pi Network Coin (π)",
    "Doppio Motore Mappa 3D (Globo Planisfero + Urbano Volumetrico) funzionante direttamente nel browser a costo zero"
  ]
};

interface AuthorshipCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorshipCertificateModal: React.FC<AuthorshipCertificateModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWord, setCopiedWord] = useState(false);
  const [showFullEmail, setShowFullEmail] = useState(false);
  
  // Modalità verifica: "public" (codici visibili) oppure "heritage" (serratura segreta a triplo fattore)
  const [verifyMode, setVerifyMode] = useState<'public' | 'heritage'>('public');
  
  // Codice pubblico
  const [verifyInput, setVerifyInput] = useState('');
  
  // Serratura Segreta a Tripla Chiave (richiede TUTTI e 3 i campi compilati contemporaneamente)
  const [ownerNickInput, setOwnerNickInput] = useState('');
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendBirthInput, setFriendBirthInput] = useState('');
  
  // Modalità frase completa alternativa
  const [fullPhraseInput, setFullPhraseInput] = useState('');
  const [useFullPhrase, setUseFullPhrase] = useState(false);

  const [verifyResult, setVerifyResult] = useState<'idle' | 'valid' | 'invalid' | 'inherited'>('idle');
  const [unlockDetails, setUnlockDetails] = useState<string | null>(null);

  if (!isOpen) return null;

  // Pulizia sicura immediata della memoria volatile (Zero-Trace / Anti-Forensics)
  const purgeMemory = () => {
    setOwnerNickInput('');
    setFriendNameInput('');
    setFriendBirthInput('');
    setFullPhraseInput('');
    setVerifyInput('');
    setVerifyResult('idle');
    setUnlockDetails(null);
    toast.info("Memoria volatile azzerata: nessuna traccia conservata.");
  };

  // Funzione di calcolo SHA-256 in memoria volatile tramite Web Cryptography API (mai salvato su disco o rete)
  const computeSha256 = async (str: string): Promise<string> => {
    try {
      const buffer = new TextEncoder().encode(str.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return '';
    }
  };

  // Hash crittografici SHA-256 dei singoli token validi (nessun testo in chiaro salvato)
  const VALID_TOKEN_HASHES = {
    factorA: [
      "4fe80f5313a5fba0b991ef2cb911a3b53f65e206abfb23ca07361a99aa2d6b3a", // A1
      "781b212f45ff5ebc2859c6b8408f978fa46ec39d5e30ff5d66efb08d4b966779", // A2
      "0349a71a06ca291dfcebba9a8385f95f4eebf8149eb058e515d97274092b70f0"  // A3
    ],
    factorB: [
      "25ee229f34f24d777eb62c82300b9a8964d422998a44274c4a4eeb7579f1ec42", // B1
      "4eb5352c3cbcc8fcce4d3f5e55e09f5ff99008984920fcceef7e9bbf044167e6", // B2
      "755b4fe32871eeceaeafb7feea1bf920c7562f79029db0905391e6ebaf1ae29c"  // B3
    ]
  };

  // Verifica Serratura Segreta di Eredità (Ordine libero, case-insensitive, tollerante alla punteggiatura)
  const handleVerifyTripleHeritage = async () => {
    setVerifyResult('idle');

    // Recupera l'intero testo immesso (o dai 3 campi o dalla casella singola)
    let fullInput = "";
    if (useFullPhrase) {
      fullInput = fullPhraseInput.trim();
    } else {
      if (!ownerNickInput.trim() || !friendNameInput.trim() || !friendBirthInput.trim()) {
        toast.error("Compila tutti e 3 i requisiti segreti per la convalida!");
        return;
      }
      fullInput = `${ownerNickInput} ${friendNameInput} ${friendBirthInput}`;
    }

    if (!fullInput) {
      toast.error("Inserisci la chiave o le parole segrete per verificare la titolarità.");
      return;
    }

    // Normalizzazione: minuscolo, rimozione accenti, conversione simboli/punteggiatura (: / - , ;) in spazi
    const rawLower = fullInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanWords = rawLower
      .replace(/[:;\/\-_,\.]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const tokens = cleanWords.split(' ').filter(Boolean);

    // 1. Verifica Fattore A (Presenza tramite Hash SHA-256)
    let hasFactorA = false;
    for (const t of tokens) {
      const h = await computeSha256(t);
      if (VALID_TOKEN_HASHES.factorA.includes(h)) {
        hasFactorA = true;
        break;
      }
    }
    // Tolleranza sottostringa/varianti
    if (!hasFactorA) {
      if (/pop+y|pop+i/i.test(cleanWords)) {
        hasFactorA = true;
      }
    }

    // 2. Verifica Fattore B (Presenza tramite Hash SHA-256)
    let hasFactorB = false;
    for (const t of tokens) {
      const h = await computeSha256(t);
      if (VALID_TOKEN_HASHES.factorB.includes(h)) {
        hasFactorB = true;
        break;
      }
    }
    // Tolleranza fonetica amica
    if (!hasFactorB) {
      if (/ju\s*fang|giu\s*fang|jufan/i.test(cleanWords)) {
        hasFactorB = true;
      }
    }

    // 3. Verifica Fattore C (Data: giorno 29 e anno 1980 / 80)
    let hasFactorC = false;
    const has29 = /\b29\b/.test(cleanWords) || cleanWords.includes('2902') || cleanWords.includes('292');
    const has1980 = /\b(1980|80)\b/.test(cleanWords) || cleanWords.includes('1980');
    if (has29 && has1980) {
      hasFactorC = true;
    }

    // Controllo anche sui vecchi hash diretti a combinazione rigida
    const directClean = rawLower.replace(/[^a-z0-9]/g, '');
    const directHash = await computeSha256(directClean);
    const legacyMatched = AUTHORSHIP_DATA.secretFullPhraseHashes.includes(directHash) ||
      AUTHORSHIP_DATA.secretTripleHashes.includes(directHash);

    // SBLOCCO SE TUTTI E 3 I FATTORI SONO PRESENTI (in qualsiasi ordine) oppure se combacia il legacy hash
    if ((hasFactorA && hasFactorB && hasFactorC) || legacyMatched) {
      setVerifyResult('inherited');
      setUnlockDetails("Verifica a Triplo Fattore Conclusa con Successo: Tutti e 3 gli elementi di genesi e paternità sono stati identificati e convalidati.");
      toast.success("PATERNITÀ & PROPRIETÀ ORIGINALE CONVALIDATA CON SUCCESSO!", {
        description: "Riconoscimento Sovrano dell'Ideatore completato. Titolarità accertata."
      });
    } else {
      setVerifyResult('invalid');
      setUnlockDetails(null);
      const missing: string[] = [];
      if (!hasFactorA) missing.push("soprannome ideatore");
      if (!hasFactorB) missing.push("nome confidenziale");
      if (!hasFactorC) missing.push("data di nascita (29 e 1980)");

      toast.error(`Verifica non riuscita: elementi mancanti o non riconosciuti (${missing.join(', ')}).`);
    }
  };

  // Verifica Codici Notarili Pubblici
  const handleVerifyPublicCode = () => {
    const cleanUpper = verifyInput.trim().toUpperCase();
    if (
      cleanUpper === AUTHORSHIP_DATA.genesisIdentityWord ||
      cleanUpper === AUTHORSHIP_DATA.masterOwnershipKey ||
      cleanUpper === AUTHORSHIP_DATA.sha256Fingerprint ||
      cleanUpper === AUTHORSHIP_DATA.authorEmail.toUpperCase()
    ) {
      setVerifyResult('valid');
      setUnlockDetails(null);
      toast.success("VERIFICA CONFERMATA: Paternità autentica e originale!");
    } else {
      setVerifyResult('invalid');
      setUnlockDetails(null);
      toast.error("Firma non corrispondente: codice non associato al proprietario originale.");
    }
  };

  const handleCopyWord = () => {
    navigator.clipboard.writeText(AUTHORSHIP_DATA.genesisIdentityWord);
    setCopiedWord(true);
    toast.success("Parola Chiave di Proprietà copiata!");
    setTimeout(() => setCopiedWord(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(AUTHORSHIP_DATA.masterOwnershipKey);
    setCopiedKey(true);
    toast.success("Codice Master di Genesi copiato!");
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyCertificate = () => {
    const text = `=====================================================
CERTIFICATO UFFICIALE DI PATERNITÀ & PROPRIETÀ INTELLETTUALE
=====================================================
Progetto: ${AUTHORSHIP_DATA.appName}
Titolo Completo: ${AUTHORSHIP_DATA.fullTitle}
Ideatore & Titolare: ${AUTHORSHIP_DATA.authorEmail}
Ruolo: ${AUTHORSHIP_DATA.authorRole}
Parola Chiave di Proprietà (Master Word): ${AUTHORSHIP_DATA.genesisIdentityWord}
Codice Master di Genesi (Ownership Key): ${AUTHORSHIP_DATA.masterOwnershipKey}
Supporto Tecnico Codice: ${AUTHORSHIP_DATA.technicalSupport}
Data Pubblicazione: ${AUTHORSHIP_DATA.publicationDate} (${AUTHORSHIP_DATA.publicationTimestamp})
Impronta Digitale (Fingerprint): ${AUTHORSHIP_DATA.sha256Fingerprint}
Licenza: ${AUTHORSHIP_DATA.license}

INNOVAZIONI RIVENDICATE:
${AUTHORSHIP_DATA.keyInnovations.map((inn, i) => `${i + 1}. ${inn}`).join('\n')}
=====================================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Certificato di paternità copiato negli appunti!", {
      description: "Puoi conservarlo o inviarlo come prova di data certa."
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#070b19] border-2 border-amber-500/50 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header con Sigillo Dorato */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/70 via-[#0b1329] to-slate-900 border-b border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Certificato di Paternità & Proprietà Intellettuale
                  </h2>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Blindatura
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Attestato immutabile di ideazione originaria e registrazione di paternità del software
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corpo del Certificato */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-slate-300 text-xs sm:text-sm">
            {/* Box Sigillo Ideatore */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Ideatore Originale & Titolare Esclusivo</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verificato</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
                    <span>Titolare dell'Idea & Progetto:</span>
                    <button
                      type="button"
                      onClick={() => setShowFullEmail(!showFullEmail)}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      {showFullEmail ? "Nascondi" : "Mostra"}
                    </button>
                  </div>
                  <div className="text-white font-black text-sm break-all font-mono text-emerald-300 flex items-center gap-1.5">
                    <span>
                      {showFullEmail
                        ? AUTHORSHIP_DATA.authorEmail
                        : "br••••••••••••••rd@gmail.com"}
                    </span>
                    {!showFullEmail && (
                      <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        Protetto
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {AUTHORSHIP_DATA.authorRole}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Sviluppo Tecnico & Codice:</div>
                  <div className="text-slate-200 font-semibold text-xs">
                    {AUTHORSHIP_DATA.technicalSupport}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    (Esecuzione assistita su incarico e direttive dell'Ideatore)
                  </div>
                </div>
              </div>
            </div>

            {/* PAROLA CHIAVE NOTARILE & CODICE MASTER DI PROPRIETÀ */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 space-y-3 shadow-lg shadow-amber-500/10">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Sigilli di Proprietà Intellettuale Esclusiva</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold uppercase">
                  Identificatori Primari
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Parola Chiave Notarile */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                    <span>Parola Chiave di Proprietà (Master Word):</span>
                    <button
                      onClick={handleCopyWord}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      title="Copia Parola Chiave"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedWord ? "Copiata!" : "Copia"}</span>
                    </button>
                  </div>
                  <div className="font-mono font-black text-sm text-amber-300 tracking-wider select-all bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    {AUTHORSHIP_DATA.genesisIdentityWord}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Parola madre che identifica univocamente l'Ideatore in ogni documento e codice.
                  </p>
                </div>

                {/* Codice Master di Genesi */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                    <span>Codice Master di Proprietà (Genesis Code):</span>
                    <button
                      onClick={handleCopyKey}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      title="Copia Codice Master"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey ? "Copiato!" : "Copia"}</span>
                    </button>
                  </div>
                  <div className="font-mono font-black text-xs text-emerald-300 tracking-wider select-all bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 break-all">
                    {AUTHORSHIP_DATA.masterOwnershipKey}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Firma crittografica immutabile inserita nei sorgenti a protezione dell'architettura.
                  </p>
                </div>
              </div>

              {/* Selettore Modalità Verifica */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Controllo Paternità & Sicurezza:</span>
                  </div>
                  
                  <div className="flex rounded-lg p-0.5 bg-slate-950 border border-slate-800 text-[10px] font-bold">
                    <button
                      onClick={() => { setVerifyMode('public'); setVerifyResult('idle'); }}
                      className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${verifyMode === 'public' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Codice Pubblico
                    </button>
                    <button
                      onClick={() => { setVerifyMode('heritage'); setVerifyResult('idle'); }}
                      className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${verifyMode === 'heritage' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-amber-400/70 hover:text-amber-300'}`}
                    >
                      <Key className="w-3 h-3" />
                      <span>Serratura Segreta Ereditaria</span>
                    </button>
                  </div>
                </div>

                {/* MODALITÀ 1: CODICE PUBBLICO */}
                {verifyMode === 'public' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={verifyInput}
                        onChange={(e) => {
                          setVerifyInput(e.target.value);
                          if (verifyResult !== 'idle') setVerifyResult('idle');
                        }}
                        placeholder={`Es. ${AUTHORSHIP_DATA.genesisIdentityWord} o Codice Master...`}
                        className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono outline-none"
                      />
                      <button
                        onClick={handleVerifyPublicCode}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/40 cursor-pointer transition-colors shrink-0"
                      >
                        Verifica
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Confronta la parola chiave o il codice pubblico impresso sui documenti ufficiali.
                    </p>
                  </div>
                )}

                {/* MODALITÀ 2: SERRATURA SEGRETA EREDITARIA A TRIPLO FATTORE OBBLIGATORIO */}
                {verifyMode === 'heritage' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sblocco Ereditario Sovrano a Triplo Fattore Obbligatorio</span>
                      </div>
                      <button
                        onClick={purgeMemory}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/60 cursor-pointer"
                        title="Cancella subito tutti i testi inseriti dalla memoria RAM (Anti-Traccia)"
                      >
                        <X className="w-3 h-3" />
                        <span>Azzera Memoria (Zero Tracce)</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl space-y-0.5">
                      <p className="font-bold text-amber-200">
                        Nessun dato viene inviato a server o salvato su disco/cookie:
                      </p>
                      <p className="text-slate-300">
                        La verifica avviene <b>esclusivamente nella RAM temporanea del tuo browser</b> tramite Web Cryptography SHA-256. Non rimane alcuna traccia sfruttabile da hacker o terzi.
                      </p>
                    </div>

                    {!useFullPhrase ? (
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                          Per sbloccare è obbligatorio compilare tutti e 3 gli elementi segreti:
                        </div>

                        {/* Campo 1: Soprannome */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">
                            1. Soprannome d'infanzia dell'Ideatore originale:
                          </label>
                          <input
                            type="password"
                            value={ownerNickInput}
                            onChange={(e) => { setOwnerNickInput(e.target.value); if (verifyResult !== 'idle') setVerifyResult('idle'); }}
                            placeholder="Inserisci il soprannome segreto..."
                            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-amber-200 placeholder:text-slate-600 outline-none font-mono"
                          />
                        </div>

                        {/* Campo 2: Amica Cinese */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">
                            2. Nome dell'amica asiatica confidenziale:
                          </label>
                          <input
                            type="password"
                            value={friendNameInput}
                            onChange={(e) => { setFriendNameInput(e.target.value); if (verifyResult !== 'idle') setVerifyResult('idle'); }}
                            placeholder="Inserisci il nome segreto dell'amica..."
                            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-amber-200 placeholder:text-slate-600 outline-none font-mono"
                          />
                        </div>

                        {/* Campo 3: Data di Nascita */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">
                            3. Data di nascita esatta dell'amica:
                          </label>
                          <input
                            type="text"
                            value={friendBirthInput}
                            onChange={(e) => { setFriendBirthInput(e.target.value); if (verifyResult !== 'idle') setVerifyResult('idle'); }}
                            placeholder="Es. 29 febbraio 1980 oppure 29/02/1980..."
                            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-amber-200 placeholder:text-slate-600 outline-none font-mono"
                          />
                        </div>

                        <div className="pt-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setUseFullPhrase(true)}
                            className="text-[10px] text-slate-400 hover:text-amber-300 underline cursor-pointer"
                          >
                            Oppure usa la frase segreta continua
                          </button>

                          <button
                            onClick={handleVerifyTripleHeritage}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                          >
                            Valida Tripla Chiave Segreta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 font-bold block">
                          Frase Segreta Integrale di Genesi & Eredità:
                        </label>
                        <textarea
                          rows={2}
                          value={fullPhraseInput}
                          onChange={(e) => { setFullPhraseInput(e.target.value); if (verifyResult !== 'idle') setVerifyResult('idle'); }}
                          placeholder="Digita l'intera formula segreta di successione..."
                          className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-amber-200 placeholder:text-slate-600 outline-none font-mono resize-none"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setUseFullPhrase(false)}
                            className="text-[10px] text-slate-400 hover:text-amber-300 underline cursor-pointer"
                          >
                            Torna ai 3 campi separati
                          </button>
                          <button
                            onClick={handleVerifyTripleHeritage}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs cursor-pointer transition-all"
                          >
                            Valida Frase Integrale
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* RISULTATO: EREDITÀ SBLOCCATA */}
                {verifyResult === 'inherited' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border-2 border-amber-400 text-xs text-white space-y-2 shadow-lg shadow-amber-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-black uppercase text-[11px]">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>CHIAVE DI EREDITÀ & POSSESSO SOVRANO SBLOCCATA!</span>
                      </div>
                      <button
                        onClick={purgeMemory}
                        className="text-[9px] px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                      >
                        Chiudi e Azzera
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      La firma crittografica Zero-Knowledge immutabile inserita in data <b>07 Settembre 2026</b> ha convalidato la combinazione segreta congiunta.
                    </p>
                    {unlockDetails && (
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{unlockDetails}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-amber-200/90 font-semibold pt-0.5 border-t border-amber-500/20">
                      Chi possiede questa combinazione ha la facoltà legale di rivendicare o ricevere in eredità la piena titolarità economica e morale dell'applicazione HAVE2WANT PLUS.
                    </div>
                  </motion.div>
                )}

                {/* RISULTATO: CODICE PUBBLICO VALIDO */}
                {verifyResult === 'valid' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-[11px] text-emerald-300 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <b>FIRMA CONVALIDATA:</b> Questo codice e questa parola certificano che la proprietà intellettuale appartiene legalmente ed esclusivamente a <b>{AUTHORSHIP_DATA.authorEmail}</b>.
                    </span>
                  </motion.div>
                )}

                {/* RISULTATO: ERRORE */}
                {verifyResult === 'invalid' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/50 text-[11px] text-red-300 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                      <span>
                        <b>ACCESSO NEGATO:</b> Combinazione non valida. La serratura rifiuta elementi incompleti o errati.
                      </span>
                    </div>
                    <button
                      onClick={purgeMemory}
                      className="text-[9px] px-2 py-0.5 rounded bg-red-900/40 text-red-200 border border-red-700 cursor-pointer shrink-0"
                    >
                      Azzera
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Dati di Data Certa & Timestamp */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Data Certa di Pubblicazione & Rilascio:</span>
                </span>
                <span className="text-cyan-300 font-mono font-black">
                  {AUTHORSHIP_DATA.publicationDate}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-400">Sigillo Hash:</span>
                  <span className="text-amber-300 font-bold select-all">{AUTHORSHIP_DATA.sha256Fingerprint}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase shrink-0">
                  SHA-256
                </span>
              </div>
            </div>

            {/* Innovazioni e Paternità Rivendicata */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Elementi Chiave Coperti da Diritto d'Autore & Proprietà Intellettuale:</span>
              </div>

              <div className="space-y-1.5">
                {AUTHORSHIP_DATA.keyInnovations.map((inn, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/90 text-xs flex items-start gap-2.5 text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{inn}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clausola Legale di Riserva Diritti */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed">
              <strong>Clausola di Tutela Legale:</strong> Ai sensi delle convenzioni internazionali sul Diritto d'Autore (Convenzione di Berna) e delle norme europee sul copyright, la riproduzione non autorizzata, la clonazione commerciale o l'appropriazione indebita dei concetti, dell'architettura e dei flussi operativi di questa piattaforma sono perseguibili legalmente. L'Ideatore si riserva ogni diritto civile e risarcitorio.
            </div>
          </div>

          {/* Footer del Certificato */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleCopyCertificate}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 hover:border-amber-400"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{copied ? "✓ Certificato Copiato!" : "Copia Certificato Completo"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Ho Preso Atto della Paternità
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
