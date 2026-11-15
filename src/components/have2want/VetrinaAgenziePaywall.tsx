import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useH2W } from '../../lib/h2wContext';

export default function VetrinaAgenziePaywall({ currentUser }) {
  const { deductMerchantSubscription } = useH2W();
  const [acceptsPi, setAcceptsPi] = useState(false);
  const [shareLocation, setShareLocation] = useState(() => localStorage.getItem('h2w_share_location') === 'true');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newLocandina, setNewLocandina] = useState({ titolo: '', agenzia: '', descrizione: '', location: '', tariffaPeriodo: 'DAILY' });
  const [locandine, setLocandine] = useState([]);

  const handlePayAndPublish = (e) => {
    e.preventDefault();
    const success = deductMerchantSubscription(acceptsPi ? `${newLocandina.tariffaPeriodo}_SCONTO` : newLocandina.tariffaPeriodo);
    if (!success) {
      toast.error("Saldo insufficiente sul tuo conto Pi per l'abbonamento.");
      return;
    }
    setLocandine([{ ...newLocandina, id: Date.now() }, ...locandine]);
    setShowUploadForm(false);
    toast.success("Abbonamento commerciale Agenzia saldato con successo!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-rose-500">🏢 AREA COMMERCIALIZZAZIONE AGENZIE INTERINALI</h1>
          <p className="text-slate-400 text-xs">Pagina a pagamento separata. Stesse identiche tariffe e condizioni dei commercianti.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold cursor-pointer">
            📡 Georadar Sede:
            <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:bg-emerald-500 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <button onClick={() => setShowUploadForm(!showUploadForm)} className="bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase">🏢 CREA LOCANDINA AGENZIA</button>
        </div>
      </div>

      {showUploadForm && (
        <form onSubmit={handlePayAndPublish} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-6 max-w-xl mx-auto space-y-4">
          <h3 className="text-sm font-black text-rose-400 uppercase">Generatore Locandine Sponsorizzate Agenzia</h3>
          <div className="grid grid-cols-2 gap-3 text-slate-900">
            <input type="text" placeholder="Titolo Annuncio Lavoro" required value={newLocandina.titolo} onChange={e => setNewLocandina({...newLocandina, titolo: e.target.value})} className="p-2 rounded-xl text-sm" />
            <input type="text" placeholder="Nome Agenzia Interinale" required value={newLocandina.agenzia} onChange={e => setNewLocandina({...newLocandina, agenzia: e.target.value})} className="p-2 rounded-xl text-sm" />
            <input type="text" placeholder="Ufficio / Città di selezione" required value={newLocandina.location} onChange={e => setNewLocandina({...newLocandina, location: e.target.value})} className="p-2 rounded-xl text-sm" />
            <select value={newLocandina.tariffaPeriodo} onChange={e => setNewLocandina({...newLocandina, tariffaPeriodo: e.target.value})} className="p-2 rounded-xl text-sm">
              <option value="DAILY">Abbonamento Giornaliero (20π o 10π)</option>
              <option value="WEEKLY">Abbonamento Settimanale (120π o 60π)</option>
              <option value="MONTHLY">Abbonamento Mensile (475π o 237.5π)</option>
            </select>
          </div>
          <label className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl cursor-pointer">
            <span className="text-xs font-bold text-slate-300">🤝 Accetti Pi Coin? (Sconto 50% su tutte le tariffe)</span>
            <input type="checkbox" checked={acceptsPi} onChange={(e) => setAcceptsPi(e.target.checked)} className="bg-emerald-500" />
          </label>
          <div className="flex justify-end gap-2 text-xs font-bold">
            <button type="button" onClick={() => setShowUploadForm(false)} className="bg-slate-700 px-4 py-2 rounded-xl">Annulla</button>
            <button type="submit" className="bg-rose-500 text-white px-4 py-2 rounded-xl uppercase">Salda ed Inserisci</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {locandine.map((l, idx) => (
          <div key={idx} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-950 rounded-lg flex items-center justify-center font-bold text-rose-400">🏢</div>
              <div>
                <h4 className="font-black text-slate-100">{l.titolo}</h4>
                <p className="text-xs text-slate-400">🏢 Agenzia: {l.agenzia} • 📍 Sede: {l.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => toast.info("💬 Contatto protetto avviato con l'agenzia (0.25 π)")} className="bg-slate-700 hover:bg-slate-600 text-xs font-black px-3 py-2 rounded-lg cursor-pointer transition-colors">💬 Chat Interinale (0.25π)</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
