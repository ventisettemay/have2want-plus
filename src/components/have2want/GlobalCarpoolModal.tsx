import React, { useState } from 'react';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  ArrowRight,
  Plus,
  Shield,
  Coins,
  X,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { CarpoolTrip, SAMPLE_GLOBAL_CARPOOLS } from '@/data/carpoolTrips';
import { toast } from 'sonner';

interface GlobalCarpoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactDriver?: (trip: CarpoolTrip) => void;
  onPublishTripToListing?: (trip: CarpoolTrip) => void;
}

export default function GlobalCarpoolModal({
  isOpen,
  onClose,
  onContactDriver,
  onPublishTripToListing
}: GlobalCarpoolModalProps) {
  const [trips, setTrips] = useState<CarpoolTrip[]>(SAMPLE_GLOBAL_CARPOOLS);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form stato per pubblicazione viaggio tra utenti
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handlePublishTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      toast.error('Inserisci almeno la città di partenza e di destinazione!');
      return;
    }

    const intermediateArray = stops
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newTrip: CarpoolTrip = {
      id: `trip-${Date.now()}`,
      driverName: 'Tu (Pioneer)',
      driverRating: 5.0,
      originCity: origin.trim(),
      destinationCity: destination.trim(),
      intermediateStops: intermediateArray,
      departureDate: date || 'Prossimamente',
      departureTime: time || '10:00',
      availableSeats: Number(seats) || 2,
      vehicleModel: 'Auto Personale',
      notes: notes.trim() || 'Viaggio condiviso tra privati in libertà.',
      contactType: 'chat_diretta',
      suggestedPiContribution: 'Accordo libero tra utenti'
    };

    setTrips([newTrip, ...trips]);
    if (onPublishTripToListing) {
      onPublishTripToListing(newTrip);
    }
    setShowCreateForm(false);
    setOrigin('');
    setDestination('');
    setStops('');
    setNotes('');
    toast.success('Trasferta pubblicata! Gli utenti potranno contattarti in chat.');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Trasferte & Carpooling Globale
              </h2>
              <p className="text-xs text-slate-400">
                Condivisione passaggi tra privati • Zero commissioni o tariffe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {trips.length} trasferte attive nel mondo
          </span>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-teal-400 transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreateForm ? 'Chiudi Modulo' : 'Offri un Passaggio'}</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* 💡 AIUTO AUTOMATICO NON INVASIVO */}
          <div className="px-3.5 py-2 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center gap-2 text-xs text-teal-200">
            <span className="text-base shrink-0">💡</span>
            <span className="text-[11px] leading-tight text-teal-300">
              <strong className="text-white font-semibold">Viaggi & Trasferte:</strong> Trova chi fa la tua stessa tratta o condividi i posti liberi della tua auto. Rimborso spese diretto in Pi Coin o baratto, senza intermediari né commissioni bancarie.
            </span>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handlePublishTrip}
              className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/40 space-y-3 animate-fade-in text-xs"
            >
              <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                <Car className="w-4 h-4" /> Pubblica la tua Trasferta
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Città di Partenza</label>
                  <input
                    type="text"
                    required
                    placeholder="Es: Milano, Parigi, Madrid..."
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Città di Destinazione</label>
                  <input
                    type="text"
                    required
                    placeholder="Es: Roma, Lione, Valencia..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Fermate Intermedie (separate da virgola)
                </label>
                <input
                  type="text"
                  placeholder="Es: Bologna, Firenze, Arezzo"
                  value={stops}
                  onChange={(e) => setStops(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Data</label>
                  <input
                    type="text"
                    placeholder="Es: Domani, 15 Ottobre"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Orario</label>
                  <input
                    type="text"
                    placeholder="Es: 08:30"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Posti Disponibili</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Note Viaggio & Bagagli</label>
                <textarea
                  rows={2}
                  placeholder="Es: Bagagliaio capiente, non fumatori, sosta caffè a metà strada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors shadow"
                >
                  Pubblica Trasferta
                </button>
              </div>
            </form>
          )}

          {/* Elenco viaggi disponibili */}
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3 group"
              >
                {/* Tratta principale */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="text-teal-400">{trip.originCity}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <span className="text-emerald-400">{trip.destinationCity}</span>
                    </div>

                    {trip.intermediateStops && trip.intermediateStops.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                        <span className="text-slate-500">Tappe lungo la rotta:</span>
                        {trip.intermediateStops.map((stop, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]"
                          >
                            {stop}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                      <Users className="w-3.5 h-3.5" />
                      {trip.availableSeats} posti
                    </span>
                  </div>
                </div>

                {/* Dettagli data / orario / autista */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" /> {trip.departureDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> {trip.departureTime}
                    </span>
                    <span>• {trip.driverName} ({trip.driverRating} ★)</span>
                  </div>

                  <button
                    onClick={() => {
                      if (onContactDriver) onContactDriver(trip);
                      toast.success(`Avvio chat con ${trip.driverName} per la tratta ${trip.originCity} - ${trip.destinationCity}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                    <span>Contatta in Chat</span>
                  </button>
                </div>

                {trip.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2 rounded-xl">
                    "{trip.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note Etica */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-teal-400" /> Trasferte libere tra membri della community • Nessuna tariffa imposta o trattenuta dall'app
          </p>
        </div>
      </div>
    </div>
  );
}
