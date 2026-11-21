import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useH2W } from '@/lib/h2wContext';

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
            </select>
          </div>
          <button type="submit" className="bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-xs uppercase">PAGA E PUBBLICA</button>
        </form>
      )}

      <div className="space-y-3">
        {locandine.map((loc) => (
          <div key={loc.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="font-bold text-white">{loc.titolo}</h3>
            <p className="text-slate-400 text-sm">{loc.agenzia} • {loc.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
