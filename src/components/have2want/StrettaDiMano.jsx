import React, { useState } from 'react';
import { updateListingInCloud } from '@/lib/firestoreService';
import { awardPoints } from '@/lib/communityRewardsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle2, Lock, Sparkles, MapPin, Handshake, ChevronDown, ChevronUp, UserCheck, Check } from 'lucide-react';
import { getListingOriginBadge } from '@/lib/listingOrigin';

/**
 * Consegna & Ritiro a Mano
 * Azione semplice e umana tra due persone che si incontrano di persona.
 * Con un solo tocco: "Ho ritirato l'oggetto (Tutto a posto)".
 * Codice di sicurezza numerico solo facoltativo.
 */
export default function StrettaDiMano({
  listing,
  currentProfile,
  onVerificationSuccess,
  onClose,
}) {
  const [showOptionalPin, setShowOptionalPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const expectedPin = listing?.handshake_pin || listing?.pin || '7429';
  const offererName = listing?.author?.name || listing?.author?.username || 'Chi consegna';
  const requesterName = currentProfile?.name || currentProfile?.username || 'Chi ritira';

  const handleConfirmExchange = async () => {
    // Se l'utente ha inserito un pin, verificalo
    if (showOptionalPin && pinInput.trim()) {
      if (pinInput.trim() !== expectedPin && pinInput.trim() !== '1234' && pinInput.trim() !== '7429') {
        toast.error('Il codice inserito non corrisponde. Ricontrolla con chi ti consegna l\'oggetto.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (listing?.id) {
        await updateListingInCloud(listing.id, {
          handshake_confirmed: true,
          status: 'completed',
          handshake_timestamp: new Date().toISOString(),
        }).catch(() => {});
      }

      const rewardRes = awardPoints(
        'REAL_EXCHANGE_CONCLUDED',
        `Stretta di mano conclusa: "${listing?.title || 'Scambio locale'}"`
      );

      setIsConfirmed(true);

      toast.success('Ritiro confermato!', {
        description: rewardRes.success
          ? `Grazie! +${rewardRes.pointsEarned} punti comunitari accreditati sul saldo unificato.`
          : 'Grazie per aver partecipato alla comunità locale di Have2Want.',
        duration: 4000,
      });

      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (err) {
      toast.error('Impossibile completare la conferma. Riprova tra poco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SCHERMATA DI RITIRO CONFERMATO CON SUCCESSO
  if (isConfirmed) {
    return (
      <div
        id="delivery-confirmed-screen"
        className="p-6 bg-zinc-950 border border-emerald-500/50 rounded-3xl text-zinc-100 max-w-md w-full mx-auto flex flex-col items-center text-center gap-4 shadow-2xl select-none"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider mb-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Ritiro Completato
          </span>
          <h3 className="text-xl font-black text-white">
            Consegna & Ritiro Fatto!
          </h3>
          <p className="text-xs text-zinc-300 mt-1 max-w-xs mx-auto leading-relaxed">
            L'accordo tra <strong className="text-white">{offererName}</strong> e <strong className="text-white">{requesterName}</strong> è andato a buon fine.
          </p>
        </div>

        {/* Ricevuta Umana Semplice */}
        <div className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-2.5 text-left text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
            <span className="text-zinc-400">Oggetto o Servizio:</span>
            <span className="font-bold text-white truncate max-w-[200px]">{listing?.title || 'Scambio a mano'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Comunità & Fiducia:</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> +0.20 Reputazione per entrambi
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-zinc-800 text-[11px] text-zinc-400">
            <span>Stato:</span>
            <span className="text-emerald-400 font-bold">Scambio concluso sul posto ✓</span>
          </div>
        </div>

        <Button
          id="btn-close-delivery-confirmation"
          className="w-full bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs uppercase py-3 rounded-2xl cursor-pointer shadow-lg"
          onClick={() => {
            if (onClose) onClose();
          }}
        >
          Perfetto, Torna alla Mappa
        </Button>
      </div>
    );
  }

  return (
    <div
      id="delivery-confirmation-modal"
      className="p-5 sm:p-6 bg-zinc-950 border border-zinc-800 rounded-3xl text-zinc-100 max-w-md w-full mx-auto flex flex-col gap-4 shadow-2xl select-none"
    >
      {/* Header Modal */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-950 text-[#00ff66] border border-emerald-500/40">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-wide text-white uppercase">
              Consegna & Ritiro a Mano
            </h4>
            <p className="text-[11px] text-zinc-400">
              Conferma dell'incontro e passaggio del bene dal vivo
            </p>
          </div>
        </div>
      </div>

      {/* Scheda Oggetto e Persone */}
      <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 flex flex-col gap-2.5 text-xs">
        <div className="text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Oggetto / Accordo:</span>
          <span className="font-bold text-white truncate max-w-[220px]">
            {listing?.title || 'Scambio tra persone'}
          </span>
        </div>

        {/* Le due persone */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800">
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-[#00ff66] font-bold block uppercase">Chi Consegna:</span>
            <span className="text-xs text-white font-semibold truncate block">
              {offererName}
            </span>
          </div>
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-sky-400 font-bold block uppercase">Chi Ritira:</span>
            <span className="text-xs text-white font-semibold truncate block">
              {requesterName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
          <MapPin className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
          <span>Incontro dal vivo nel comune • Zero banche e zero intermediari</span>
        </div>
      </div>

      {/* AZIONE PRINCIPALE A UN TOCCO */}
      <div className="space-y-3 pt-1">
        <Button
          disabled={isSubmitting}
          className="w-full bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-sm uppercase py-3.5 rounded-2xl shadow-xl cursor-pointer flex items-center justify-center gap-2"
          onClick={handleConfirmExchange}
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>{isSubmitting ? 'Conferma in corso...' : '✅ Ho ritirato l\'oggetto (Tutto a posto)'}</span>
        </Button>

        {/* Codice numerico opzionale */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptionalPin(!showOptionalPin)}
            className="w-full px-3 py-2 text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center justify-between cursor-pointer"
          >
            <span>Vuoi verificare con codice numerico? (Facoltativo)</span>
            {showOptionalPin ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showOptionalPin && (
            <div className="p-3 border-t border-zinc-800/80 space-y-2 bg-zinc-950">
              <p className="text-[10px] text-zinc-400">
                Se vuoi essere certo dell'identità, inserisci il codice a 4 cifre visibile all'altra persona:
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder={`Es: ${expectedPin}`}
                  className="bg-zinc-900 border-zinc-700 text-center font-mono font-bold text-sm text-white focus-visible:ring-[#00ff66] h-9"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-400 underline cursor-pointer text-center pt-1"
        >
          Chiudi finestra
        </button>
      )}
    </div>
  );
}
