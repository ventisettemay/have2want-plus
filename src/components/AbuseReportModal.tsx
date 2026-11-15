import React, { useState } from "react";
import { motion } from "motion/react";
import {
  AlertOctagon,
  ShieldAlert,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  Ban,
  UserX,
  Sparkles,
  Info
} from "lucide-react";
import { AbuseReportPayload, AbuseReportReason, ReportTargetType } from "../types";

interface AbuseReportModalProps {
  targetId: string;
  targetUsername: string;
  targetTitle?: string;
  targetType: ReportTargetType;
  reporterUsername: string;
  onReportSubmitted: (payload: AbuseReportPayload) => void;
  onClose: () => void;
}

const REPORT_REASONS: Array<{ value: AbuseReportReason; label: string; desc: string }> = [
  {
    value: "richiesta_valuta_fiat_euro",
    label: "Richiesta Valuta Fiat / Denaro Tradizionale (Euro)",
    desc: "L'utente tenta di eludere il baratto o la valuta comunitaria Pi Network richiedendo contanti o bonifici esterni.",
  },
  {
    value: "categoria_illegale_proibita",
    label: "Merci Vietate o Categorie Illegali",
    desc: "Inserzione di armi, sostanze vietate, medicinali con obbligo di ricetta, materiale offensivo o non consentito.",
  },
  {
    value: "molestie_comportamento_inappropriato",
    label: "Molestie Verbali, Minacce o Tentativi di Truffa",
    desc: "Comportamento intimidatorio, linguaggio non consono, spam ripetuto o tentativi di estorsione dati.",
  },
  {
    value: "merce_contraffatta_non_conforme",
    label: "Merce Contraffatta o Difetti Gravi Occultati",
    desc: "Oggetto non autentico, violazione del diritto d'autore o condizioni reali totalmente difformi dall'annuncio.",
  },
  {
    value: "abuso_consulenza_specialistica",
    label: "Abuso Professionale / Violazione Limiti Solidali",
    desc: "Falsa attestazione di titoli o prescrizione abusiva di cure mediche non consentite nello spazio solidale.",
  },
];

export const AbuseReportModal: React.FC<AbuseReportModalProps> = ({
  targetId,
  targetUsername,
  targetTitle,
  targetType,
  reporterUsername,
  onReportSubmitted,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState<AbuseReportReason>("richiesta_valuta_fiat_euro");
  const [details, setDetails] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    const matched = REPORT_REASONS.find((r) => r.value === selectedReason);

    const payload: AbuseReportPayload = {
      id: `rep-${Date.now()}`,
      reporterUsername,
      targetUsername,
      targetType,
      targetId,
      targetTitle,
      reason: selectedReason,
      reasonLabel: matched?.label || selectedReason,
      details: details.trim(),
      timestamp: new Date().toISOString(),
      status: "inviata",
    };

    setIsSubmitted(true);
    setTimeout(() => {
      onReportSubmitted(payload);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-950 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-rose-950/40 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Segnalazione Abuso & Moderazione P2P</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  Sicurezza 3D
                </span>
              </h3>
              <p className="text-xs text-rose-200/70">
                Tutela della comunità ed esecuzione protocolli di ban automatico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">Segnalazione Ricevuta</h4>
              <p className="text-xs text-emerald-200 leading-relaxed max-w-sm mx-auto">
                Il payload di moderazione è stato registrato nel backend. Se il profilo accumula segnalazioni o se il rating scende sotto 3.8 stelle, i marker 3D verranno revocati all'istante.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target info card */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] font-mono uppercase block">Soggetto Segnalato:</span>
                  <span className="font-bold text-white text-sm">{targetUsername}</span>
                  {targetTitle && <span className="text-slate-400 block truncate max-w-xs">{targetTitle}</span>}
                </div>
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  ID: {targetId.slice(0, 10)}
                </span>
              </div>

              {/* Reasons list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Motivo Principale della Violazione:
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason.value;
                    return (
                      <div
                        key={reason.value}
                        onClick={() => setSelectedReason(reason.value)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-950/30 border-rose-500 text-white shadow-md shadow-rose-950/40"
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="report-reason"
                            checked={isSelected}
                            onChange={() => setSelectedReason(reason.value)}
                            className="text-rose-500 focus:ring-rose-400 bg-slate-950"
                          />
                          <span className="text-xs font-bold">{reason.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-5 mt-1 leading-snug">
                          {reason.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details text area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Dettagli / Prove del Comportamento:
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Descrivi brevemente l'accaduto (es. richiesta esplicita di 50€ via bonifico in chat privata)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              {/* Auto Ban Policy Notice */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
                <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <b>Clausola di Rimozione Marker:</b> In presenza di recidiva o rating &lt; 3.8/5.0 stelle, l'account viene bloccato e tutti i relativi PIN vengono cancellati dalla mappa 3D.
                </span>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  disabled={!details.trim()}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                    details.trim()
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invia Segnalazione di Moderazione</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
