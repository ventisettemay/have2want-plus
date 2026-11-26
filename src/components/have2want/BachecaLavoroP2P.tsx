import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useH2W } from '../../lib/h2wContext';

interface BachecaLavoroP2PProps {
  currentUser?: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function BachecaLavoroP2P({
  currentUser,
  isOpen = true,
  onClose,
}: BachecaLavoroP2PProps) {
  const { deductMerchantSubscription } = useH2W();
  const [acceptsPi, setAcceptsPi] = useState(false);
  const [shareLocation, setShareLocation] = useState(() => localStorage.getItem('h2w_share_location') === 'true');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newAnnuncio, setNewAnnuncio] = useState({ titolo: '', azienda: '', descrizione: '', tipo: 'LAVORO_DIRETTO', location: '', compenso: '' });
  const [annunci, setAnnunci] = useState([
    { id: 1, titolo: "Raccolta e Manodopera Stagionale", azienda: "Azienda Agricola Diretta", descrizione: "Supporto raccolta. Possibile scambio manodopera con ceste di prodotti artigianali.", tipo: "SCAMBIO_MERCE_LAVORO", location: "Lentini", compenso: "Baratto Merce", merchantId: "m_job1" }
  ]);

  useEffect(() => {
    localStorage.setItem('h2w_share_location', String(shareLocation));
  }, [shareLocation]);

  if (!isOpen) return null;

  const handlePayAndPublish = (e: React.FormEvent) => {
    e.preventDefault();
    const success = deductMerchantSubscription(acceptsPi ? "DAILY_SCONTO" : "DAILY");
    if (!success) {
      toast.error("Saldo Pi insufficiente sul tuo conto.");
      return;
    }
    setAnnunci([{ ...newAnnuncio, id: Date.now(), merchantId: currentUser?.id || "m_job" }, ...annunci]);
    setShowUploadForm(false);
    setNewAnnuncio({ titolo: '', azienda: '', descrizione: '', tipo: 'LAVORO_DIRETTO', location: '', compenso: '' });
    toast.success("Abbonamento saldato e Locandina Lavoro pubblicata con successo!");
  };

  const content = (
    <div className="w-full max-w-5xl mx-auto bg-slate-900 text-white p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700 pb-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-amber-500">💼 BACHECA LAVORO P2P (NO AGENZIE)</h1>
          <p className="text-slate-400 text-xs">Annunci diretti aziende/privati, Scambio Merce per Lavoro. Intermediari interinali VIETATI.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold cursor-pointer">
            📡 Georadar:
            <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:bg-emerald-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <button
            type="button"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors"
          >
            ➕ GENERA ANNUNCIO
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              title="Chiudi Bacheca Lavoro P2P"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showUploadForm && (
        <form onSubmit={handlePayAndPublish} className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 mb-6 max-w-xl mx-auto space-y-4">
          <h3 className="text-sm font-black text-amber-400 uppercase">Crea Locandina Offerta Lavoro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Titolo Annuncio"
              required
              value={newAnnuncio.titolo}
              onChange={e => setNewAnnuncio({...newAnnuncio, titolo: e.target.value})}
              className="p-2.5 rounded-xl text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              placeholder="Nome Azienda/Privato"
              required
              value={newAnnuncio.azienda}
              onChange={e => setNewAnnuncio({...newAnnuncio, azienda: e.target.value})}
              className="p-2.5 rounded-xl text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              placeholder="Località Sede Lavoro"
              required
              value={newAnnuncio.location}
              onChange={e => setNewAnnuncio({...newAnnuncio, location: e.target.value})}
              className="p-2.5 rounded-xl text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              placeholder="Compenso o Tipo Merce Baratto"
              required
              value={newAnnuncio.compenso}
              onChange={e => setNewAnnuncio({...newAnnuncio, compenso: e.target.value})}
              className="p-2.5 rounded-xl text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <select
              value={newAnnuncio.tipo}
              onChange={e => setNewAnnuncio({...newAnnuncio, tipo: e.target.value})}
              className="p-2.5 rounded-xl text-sm sm:col-span-2 bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="LAVORO_DIRETTO">👷 Impiego Aziendale Diretto</option>
              <option value="SCAMBIO_MERCE_LAVORO">🔄 Scambio Merce per Lavoro (Baratto)</option>
            </select>
          </div>
          <textarea
            placeholder="Descrizione mansione, ore richieste o merci offerte in cambio..."
            value={newAnnuncio.descrizione}
            onChange={e => setNewAnnuncio({...newAnnuncio, descrizione: e.target.value})}
            className="p-2.5 rounded-xl text-sm w-full h-20 bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
          />
          <label className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-700 cursor-pointer">
            <span className="text-xs font-bold text-slate-300">🤝 Accetti Pi Coin? (Sconto 50% Tariffa)</span>
            <input type="checkbox" checked={acceptsPi} onChange={(e) => setAcceptsPi(e.target.checked)} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
          </label>
          <div className="flex justify-end gap-2 text-xs font-bold">
            <button type="button" onClick={() => setShowUploadForm(false)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl cursor-pointer">Annulla</button>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl uppercase cursor-pointer">Salda ed Inserisci (20π/10π)</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {annunci.map(a => (
          <div key={a.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className={`text-[10px] font-black px-2 py-1 rounded shrink-0 ${a.tipo === 'SCAMBIO_MERCE_LAVORO' ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                {a.tipo}
              </span>
              <div>
                <h4 className="font-black text-slate-100">{a.titolo}</h4>
                <p className="text-xs text-slate-400">🏢 {a.azienda} • 📍 {a.location} • 💱 {a.compenso}</p>
                {a.descrizione && <p className="text-xs text-slate-300 mt-1">{a.descrizione}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4 self-end md:self-center">
              <button
                type="button"
                onClick={async () => {
                  const { processChatInteractionBilling } = await import('../../lib/geoPrivacy');
                  const res = await processChatInteractionBilling(`job_${a.id}`);
                  if (!res.success) {
                    toast.error(res.reason || "Saldo punti insufficiente per Quota X (0.25 π = 250 punti)");
                    return;
                  }
                  toast.success(`🤝 Candidatura registrata: Quota X 0.25 π (250 punti) applicata. Punti rimasti: ${res.pointsRemaining}`);
                }}
                className="bg-indigo-500 text-white font-black text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-indigo-600 transition-colors"
              >
                Candidati (0.25π)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-3 sm:p-6 animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return <div className="min-h-screen bg-slate-900 text-white p-4">{content}</div>;
}
