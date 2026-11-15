import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useH2W } from '../../lib/h2wContext';

export default function BachecaLavoroP2P({ currentUser }) {
  const { deductMerchantSubscription } = useH2W();
  const [acceptsPi, setAcceptsPi] = useState(false);
  const [shareLocation, setShareLocation] = useState(() => localStorage.getItem('h2w_share_location') === 'true');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newAnnuncio, setNewAnnuncio] = useState({ titolo: '', azienda: '', descrizione: '', tipo: 'LAVORO_DIRETTO', location: '', compenso: '' });
  const [annunci, setAnnunci] = useState([
    { id: 1, titolo: "Raccolta e Manodopera Stagionale", azienda: "Azienda Agricola Diretta", descrizione: "Supporto raccolta. Possibile scambio manodopera con ceste di prodotti artigianali.", tipo: "SCAMBIO_MERCE_LAVORO", location: "Lentini", compenso: "Baratto Merce", merchantId: "m_job1" }
  ]);

  const handlePayAndPublish = (e) => {
    e.preventDefault();
    const success = deductMerchantSubscription(acceptsPi ? "DAILY_SCONTO" : "DAILY");
    if (!success) {
      toast.error("Saldo Pi insufficiente sul tuo conto.");
      return;
    }
    setAnnunci([{ ...newAnnuncio, id: Date.now(), merchantId: currentUser?.id || "m_job" }, ...annunci]);
    setShowUploadForm(false);
    toast.success("Abbonamento saldato e Locandina Lavoro pubblicata con successo!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-amber-500">💼 BACHECA LAVORO P2P (NO AGENZIE)</h1>
          <p className="text-slate-400 text-xs">Annunci diretti aziende/privati, Scambio Merce per Lavoro. Intermediari interinali VIETATI.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold cursor-pointer">
            📡 Georadar:
            <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:bg-emerald-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <button onClick={() => setShowUploadForm(!showUploadForm)} className="bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase">➕ GENERA ANNUNCIO</button>
        </div>
      </div>

      {showUploadForm && (
        <form onSubmit={handlePayAndPublish} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-6 max-w-xl mx-auto space-y-4">
          <h3 className="text-sm font-black text-amber-400 uppercase">Crea Locandina Offerta Lavoro</h3>
          <div className="grid grid-cols-2 gap-3 text-slate-900">
            <input type="text" placeholder="Titolo Annuncio" required value={newAnnuncio.titolo} onChange={e => setNewAnnuncio({...newAnnuncio, titolo: e.target.value})} className="p-2 rounded-xl text-sm" />
            <input type="text" placeholder="Nome Azienda/Privato" required value={newAnnuncio.azienda} onChange={e => setNewAnnuncio({...newAnnuncio, azienda: e.target.value})} className="p-2 rounded-xl text-sm" />
            <input type="text" placeholder="Località Sede Lavoro" required value={newAnnuncio.location} onChange={e => setNewAnnuncio({...newAnnuncio, location: e.target.value})} className="p-2 rounded-xl text-sm" />
            <input type="text" placeholder="Compenso o Tipo Merce Baratto" required value={newAnnuncio.compenso} onChange={e => setNewAnnuncio({...newAnnuncio, compenso: e.target.value})} className="p-2 rounded-xl text-sm" />
            <select value={newAnnuncio.tipo} onChange={e => setNewAnnuncio({...newAnnuncio, tipo: e.target.value})} className="p-2 rounded-xl text-sm col-span-2">
              <option value="LAVORO_DIRETTO">👷 Impiego Aziendale Diretto</option>
              <option value="SCAMBIO_MERCE_LAVORO">🔄 Scambio Merce per Lavoro (Baratto)</option>
            </select>
          </div>
          <textarea placeholder="Descrizione mansione, ore richieste o merci offerte in cambio..." value={newAnnuncio.descrizione} onChange={e => setNewAnnuncio({...newAnnuncio, descrizione: e.target.value})} className="p-2 rounded-xl text-sm w-full h-16" />
          <label className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl cursor-pointer">
            <span className="text-xs font-bold text-slate-300">🤝 Accetti Pi Coin? (Sconto 50% Tariffa)</span>
            <input type="checkbox" checked={acceptsPi} onChange={(e) => setAcceptsPi(e.target.checked)} className="bg-emerald-500" />
          </label>
          <div className="flex justify-end gap-2 text-xs font-bold">
            <button type="button" onClick={() => setShowUploadForm(false)} className="bg-slate-700 px-4 py-2 rounded-xl">Annulla</button>
            <button type="submit" className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl uppercase">Salda ed Inserisci (20π/10π)</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {annunci.map(a => (
          <div key={a.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black px-2 py-1 rounded ${a.tipo === 'SCAMBIO_MERCE_LAVORO' ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                {a.tipo}
              </span>
              <div>
                <h4 className="font-black text-slate-100">{a.titolo}</h4>
                <p className="text-xs text-slate-400">🏢 {a.azienda} • 📍 {a.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => toast.info("🤝 Candidatura inviata: contatto protetto avviato (0.25 π)")} className="bg-indigo-500 text-white font-black text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-indigo-600 transition-colors">Candidati (0.25π)</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
