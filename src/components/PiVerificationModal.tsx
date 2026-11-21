import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Copy,
  Coins,
  UserCheck,
  X,
  Server,
  Database,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { checkIsPiBrowser, initPiSdk, authenticateWithPiPortal } from '@/lib/piSdkService';
import { useAuth } from '@/lib/AuthContext';

interface PiVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PiVerificationModal: React.FC<PiVerificationModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [authUser, setAuthUser] = useState<{ uid: string; username: string; isSimulated?: boolean } | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const APP_URL =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://ais-pre-77usxts3xh2oetsnkh426l-523337524085.europe-west3.run.app';
  const VALIDATION_KEY = '41d098c27068bf811f67caeefe5dc094a6304c413d84b17e9e0c5ae364e3af4ac4086bc073ce287d5bdc3f21cdf45a09ea1f1a842d5a6ccd784777aae7a286b7';

  useEffect(() => {
    if (isOpen) {
      const inPi = checkIsPiBrowser();
      setIsPiBrowser(inPi);
      const ready = initPiSdk();
      setSdkReady(ready);

      const savedUser = localStorage.getItem('have2want_pioneer_user');
      if (savedUser) {
        setAuthUser({ uid: 'stored_local', username: savedUser });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copiato negli appunti!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunPiAuth = async () => {
    setIsAuthenticating(true);
    try {
      const res = await authenticateWithPiPortal();
      if (res.success && res.user) {
        setAuthUser({ ...res.user, isSimulated: Boolean(res.isSimulated) });
        login({
          id: res.user.uid,
          uid: res.firebaseUid || res.user.uid,
          name: res.user.username,
          username: res.user.username,
          accessToken: res.accessToken,
          verified_pioneer: !res.isSimulated,
        });
        toast.success(
          res.isSimulated
            ? `Sessione Web Preview avviata: ${res.user.username}`
            : `Autenticazione Pi SDK verificata: ${res.user.username}`
        );
      } else {
        toast.error(res.error || 'Autenticazione fallita');
      }
    } catch (e: any) {
      toast.error('Errore durante la chiamata a Pi SDK: ' + (e?.message || 'sconosciuto'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Intestazione */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-lg">
              π
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Stato Verifica & Connessione Pi Network
              </h2>
              <p className="text-xs text-zinc-400">
                Pannello diagnostico in tempo reale per Pi Browser e Portale Sviluppatori
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto scorrevole */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* 1. Stato Rilevamento Browser */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isPiBrowser
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
          }`}>
            <div className="flex items-center gap-3">
              <Smartphone className={`w-6 h-6 ${isPiBrowser ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <span className="font-black block text-sm">
                  {isPiBrowser ? '✅ Aperto all\'interno di Pi Browser' : '🌐 Aperto da Browser Web Standard'}
                </span>
                <span className="text-xs text-zinc-400">
                  {isPiBrowser
                    ? 'Pi SDK nativo rilevato (window.Pi attivo)'
                    : 'Per testare i pagamenti nativi, apri l\'URL direttamente dentro l\'app Pi Browser sul tuo telefono'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${
              isPiBrowser
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {isPiBrowser ? 'Pi Browser' : 'Web Preview'}
            </span>
          </div>

          {/* 2. Verifica Componenti Server & Database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Chiave di Validazione */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Chiave di Validazione Dominio</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Attiva su <code className="text-emerald-300">/validation-key.txt</code> con intestazioni CORS complete (200 OK).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                  128 caratteri esatti
                </span>
                <button
                  onClick={() => handleCopy(VALIDATION_KEY, 'Chiave di validazione')}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 underline cursor-pointer ml-auto"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'Chiave di validazione' ? 'Copiata!' : 'Copia'}
                </button>
              </div>
            </div>

            {/* Database Cloud Firestore */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Database Cloud Firestore</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Database permanente collegato in tempo reale (ID dedicato).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                  Sincronizzazione Attiva
                </span>
              </div>
            </div>
          </div>

          {/* 3. Parametri per Pi Developer Portal (develop.pi) */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-amber-400" />
                Dati Configurazione Portale Pi (develop.pi)
              </span>
              <span className="text-[11px] text-zinc-400">Verifica che corrispondano:</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px]">App URL Principale:</span>
                  <code className="text-white font-mono text-[11px] select-all break-all">{APP_URL}</code>
                </div>
                <button
                  onClick={() => handleCopy(APP_URL, 'App URL')}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 ml-2"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'App URL' ? 'Copiato' : 'Copia'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Privacy Policy URL:</span>
                  <code className="text-white font-mono text-[11px] select-all break-all">{APP_URL}/privacy</code>
                </div>
                <button
                  onClick={() => handleCopy(`${APP_URL}/privacy`, 'Privacy URL')}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 ml-2"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'Privacy URL' ? 'Copiato' : 'Copia'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Terms of Service URL:</span>
                  <code className="text-white font-mono text-[11px] select-all break-all">{APP_URL}/terms</code>
                </div>
                <button
                  onClick={() => handleCopy(`${APP_URL}/terms`, 'Terms URL')}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 ml-2"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'Terms URL' ? 'Copiato' : 'Copia'}
                </button>
              </div>
            </div>
          </div>

          {/* 4. Test Autenticazione Pioneer Live */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-black text-amber-300 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Test Autenticazione Account Pi Pioneer
                </span>
                <p className="text-[11px] text-zinc-300">
                  Verifica l'accesso diretto dell'utente tramite Pi SDK senza password.
                </p>
              </div>
              {authUser && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
                  {authUser.username}
                </span>
              )}
            </div>

            <button
              onClick={handleRunPiAuth}
              disabled={isAuthenticating}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifica credenziali Pi in corso...</span>
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5" />
                  <span>{authUser ? 'Rieffettua Login Pi SDK' : 'Testa Login Pioneer con Pi SDK'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400">
            {isPiBrowser && sdkReady
              ? 'Sessione nativa Pi Browser attiva con validation-key e Firebase pronti.'
              : 'Web Preview attiva: apri in Pi Browser per transazioni e firma reale su Pi Network.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
