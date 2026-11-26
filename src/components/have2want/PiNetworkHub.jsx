import React, { useState } from 'react';
import { Sparkles, Globe, ShieldCheck, Zap, Megaphone, Mic, Store, ExternalLink, X, Copy, Check, Coins, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PiNetworkHub({
  isOpen = false,
  onClose = () => {},
  onOpenAdModal = () => {},
  onOpenRewardsHub = () => {},
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const currentAppUrl = window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedUrl(true);
    toast.success('📋 URL copiato negli appunti!', {
      description: 'Incollalo nel campo "App Hosting URL / External Pi" su Pi App Studio',
    });
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con Grafica Pi Network */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500/20 via-purple-950/40 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/30">
              π
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Pi App Studio & Integrazione External Pi</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                  2.0 SDK Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Piattaforma 3D WebGL, Google 3D Mappe, Inserzionisti e Note Vocali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo informativo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200 text-xs leading-relaxed">
          {/* Box 1: Come configurare su Pi App Studio */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-amber-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                URL Esterno per Pi App Studio (External Pi)
              </span>
              <button
                onClick={handleCopyUrl}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copiato!' : 'Copia URL'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 font-mono text-[11px] text-amber-200 break-all select-all border border-slate-800">
              {currentAppUrl}
            </div>
            <p className="text-slate-400">
              Inserendo questo URL in Pi App Studio come <strong>External Hosting App</strong>, l'app funzionerà nativamente sia nel <strong>Pi Browser</strong> per tutti i Pioneer, sia su qualsiasi browser moderno con accelerazione hardware 3D!
            </p>
          </div>

          {/* BOX PUNTI COMUNITARI & PRELIEVO PI NETWORK */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-white text-sm">Punti Comunitari & Prelievo Pi su Wallet</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Soglia: 0.50 π
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Nessun wallet interno. Converti i punti accumulati con annunci reali ed interazioni sponsor e preleva direttamente sul tuo Pi Wallet esterno (Fee rete: -0.01 π).
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenRewardsHub();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Gestisci Punti & Preleva π</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Pilastri di risposta alla domanda dell'utente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pilastro 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <h4 className="font-black text-slate-100 text-xs">Mappe & Grafica Reale Città</h4>
              <p className="text-[11px] text-slate-400">
                La mappa vettoriale HD con palazzi 3D estrusi, toponimi e rilievo DEM è renderizzata via WebGL. Non richiede plugin esterni ed è pienamente compatibile con Pi Browser!
              </p>
            </div>

            {/* Pilastro 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <h4 className="font-black text-slate-100 text-xs">Negozi & Aziende in Risalto</h4>
              <p className="text-[11px] text-slate-400">
                Marker dorati esclusivi 3D per le attività sponsorizzate con vetrina, sconti Pi, orari di apertura e reindirizzamento sul posto.
              </p>
            </div>

            {/* Pilastro 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Mic className="w-4 h-4" />
              </div>
              <h4 className="font-black text-slate-100 text-xs">Chat & Note Vocali</h4>
              <p className="text-[11px] text-slate-400">
                Predisposizione chat vocale istantanea tra acquirente e negoziante/inserzionista per contrattare, chiedere informazioni o concordare lo scambio.
              </p>
            </div>
          </div>

          {/* Sezione Pubblicizza Attività */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-black text-white text-sm flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-emerald-400" />
                Vuoi mettere in risalto il tuo negozio o la tua azienda sulla mappa 3D?
              </h3>
              <p className="text-slate-400 text-xs">
                Crea una scheda inserzionista dorata, attiva i pagamenti in Pi e ricevi clienti geolocalizzati.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAdModal();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              <span>Pubblicizza la tua attività</span>
            </button>
          </div>
        </div>

        {/* STORICO ORDINI & TRANSAZIONI PI */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 border border-zinc-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <h3 className="font-black text-white text-sm">Storico Ordini & Transazioni Pi</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold">
              Tutte le transazioni
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-700">
                  <th className="text-left pb-2 font-semibold">Data</th>
                  <th className="text-left pb-2 font-semibold">Tipo</th>
                  <th className="text-left pb-2 font-semibold">Importo</th>
                  <th className="text-left pb-2 font-semibold">Stato</th>
                  <th className="text-left pb-2 font-semibold">Controparte</th>
                </tr>
              </thead>
              <tbody className="text-zinc-200 divide-y divide-zinc-800/50">
                <tr className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2 font-mono text-zinc-400">Oggi 14:32</td>
                  <td className="py-2 text-emerald-400 font-bold">Acquisto Annuncio</td>
                  <td className="py-2 text-white">-0.15 π</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px]">Completato</span>
                  </td>
                  <td className="py-2 text-zinc-300">Bottega Artigiana</td>
                </tr>
                <tr className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2 font-mono text-zinc-400">Ieri 09:15</td>
                  <td className="py-2 text-amber-400 font-bold">Vendita Prodotto</td>
                  <td className="py-2 text-white">+12.50 π</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px]">Completato</span>
                  </td>
                  <td className="py-2 text-zinc-300">Cliente P2P</td>
                </tr>
                <tr className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2 font-mono text-zinc-400">2 giorni fa</td>
                  <td className="py-2 text-rose-400 font-bold">Rifornimento Wallet</td>
                  <td className="py-2 text-white">+50.00 π</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px]">Completato</span>
                  </td>
                  <td className="py-2 text-zinc-300">Pi Network Mainnet</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">
            Tutte le transazioni sono registrate sulledger Pi Network. Nessuna commissione interna applicata.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Pi SDK v2.0 • Sandbox & Mainnet Ready • WebGL 3D
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
