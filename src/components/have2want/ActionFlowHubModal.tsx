import React from 'react';
import { X, Zap, Target, Award, Rocket, ExternalLink } from 'lucide-react';

interface ActionFlowHubModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ActionFlowHubModal: React.FC<ActionFlowHubModalProps> = ({
  isOpen = true,
  onClose = () => {},
}) => {
  if (!isOpen) return null;

  const missions = [
    { id: 'mission_1', title: 'Esplora il Territorio', desc: 'Visita 3 luoghi diversi sulla mappa 3D', reward: '50 Punti', icon: Target },
    { id: 'mission_2', title: 'Attiva un Satellite', desc: 'Accendi METEO_SAT o KM0_SAT dal menu flotta', reward: '30 Punti', icon: Zap },
    { id: 'mission_3', title: 'Crea una Vetrina', desc: 'Pubblica una vetrina sponsorizzata (BUSINESS_ADS_SAT)', reward: '100 Punti', icon: Award },
    { id: 'mission_4', title: 'Invita un Amico', desc: 'Condividi il link di invito Pi Network', reward: '200 Punti', icon: Rocket },
  ];

  const externalApps = [
    { name: 'Pi Browser', desc: 'App ufficiale Pi Network', url: 'https://minepi.com' },
    { name: 'Pi Wallet', desc: 'Portafoglio Pi ufficiale', url: 'https://wallet.pinetwork.com' },
    { name: 'Pi SDK Docs', desc: 'Documentazione sviluppatori', url: 'https://developers.minepi.com' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-purple-900/40 border-b border-violet-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-400/50 flex items-center justify-center text-violet-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>ACTIONFLOW HUB</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/40">
                  ACTIONFLOW-CORE
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Centro missioni, attività AI, ricompense — Portal ecosistema esterno</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenuto */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sezione Missioni */}
          <section>
            <h3 className="text-sm font-black text-violet-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Missioni Giornaliere
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {missions.map((mission) => {
                const Icon = mission.icon;
                return (
                  <div key={mission.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-violet-500/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-violet-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate">{mission.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1">{mission.desc}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                          Ricompensa: {mission.reward}
                        </span>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-bold border border-violet-500/40 transition-colors">
                      Avvia Missione
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sezione App Esterne */}
          <section>
            <h3 className="text-sm font-black text-sky-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Portal App Esterne Ecosistema
            </h3>
            <div className="space-y-2">
              {externalApps.map((app) => (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-sky-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-sky-300" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{app.name}</p>
                      <p className="text-xs text-zinc-400">{app.desc}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-sky-400 shrink-0" />
                </a>
              ))}
            </div>
          </section>

          {/* Info */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-xs text-violet-200">
            <strong className="text-violet-300">ACTIONFLOW HUB — </strong>
            Completamento missioni → Punti Pioneer unificati (convertibili in π).
            Integrazione con Pi SDK per ricompense verificate. Portal per app esterne dell'ecosistema HAVE2WANT.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionFlowHubModal;