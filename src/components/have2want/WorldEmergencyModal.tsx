import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  HeartPulse,
  Flame,
  UserCheck,
  ExternalLink,
  X,
  ChevronRight,
  Globe2,
  Lock
} from 'lucide-react';
import {
  WORLD_EMERGENCY_SERVICES,
  CountryEmergencyNumbers,
  getEmergencyServicesForCountry
} from '@/lib/externalGatewayServices';

interface WorldEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCountryCode?: string;
}

export default function WorldEmergencyModal({
  isOpen,
  onClose,
  defaultCountryCode = 'GLOBAL'
}: WorldEmergencyModalProps) {
  const resolveCode = (raw?: string) => {
    const upper = String(raw || '').trim().toUpperCase();
    return WORLD_EMERGENCY_SERVICES[upper] ? upper : 'DEFAULT';
  };

  const [selectedCountryCode, setSelectedCountryCode] = useState(() => resolveCode(defaultCountryCode));

  useEffect(() => {
    if (isOpen) {
      setSelectedCountryCode(resolveCode(defaultCountryCode));
    }
  }, [isOpen, defaultCountryCode]);

  if (!isOpen) return null;

  const activeServices: CountryEmergencyNumbers =
    selectedCountryCode === 'DEFAULT'
      ? WORLD_EMERGENCY_SERVICES.DEFAULT
      : getEmergencyServicesForCountry(selectedCountryCode);

  const emergencyEntries = Object.entries(WORLD_EMERGENCY_SERVICES);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con selettore nazione */}
        <div className="p-5 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Numeri Utili & Emergenze
              </h2>
              <p className="text-xs text-slate-400">
                Chiamata diretta nativa • Nessun dato salvato
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selettore Nazione (36+ Paesi + Standard Internazionale 112) */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap font-medium">
            <Globe2 className="w-3.5 h-3.5 text-sky-400" /> Nazione:
          </span>
          <select
            value={selectedCountryCode}
            onChange={(e) => setSelectedCountryCode(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-red-400 cursor-pointer"
          >
            {emergencyEntries.map(([key, item]) => (
              <option key={key} value={key}>
                {item.flag} {item.countryName} ({item.universalEmergency})
              </option>
            ))}
          </select>
        </div>

        {/* Elenco Numeri a Chiamata Diretta tel: */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Numero Unico Europeo / 911 */}
          <a
            href={`tel:${activeServices.universalEmergency}`}
            className="group block p-4 rounded-2xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/40 transition-all hover:border-red-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black text-lg">
                  {activeServices.universalEmergency}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                    Emergenza Generale Unica
                  </h4>
                  <p className="text-xs text-slate-400">
                    Polizia, Ambulanza, Vigili del Fuoco ({activeServices.countryName})
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-red-500 text-slate-950 text-xs font-bold flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5" /> Chiama
              </div>
            </div>
          </a>

          {/* Emergenza Sanitaria */}
          <a
            href={`tel:${activeServices.medicalEmergency}`}
            className="group block p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Soccorso Sanitario / Ambulanza ({activeServices.medicalEmergency})
                  </h4>
                  <p className="text-[11px] text-slate-400">Pronto intervento medico 24/7</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>

          {/* Forze dell'Ordine / Polizia */}
          <a
            href={`tel:${activeServices.police}`}
            className="group block p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Polizia / Carabinieri ({activeServices.police})
                  </h4>
                  <p className="text-[11px] text-slate-400">Sicurezza pubblica e ordine</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>

          {/* Vigili del Fuoco */}
          <a
            href={`tel:${activeServices.firefighters}`}
            className="group block p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Vigili del Fuoco ({activeServices.firefighters})
                  </h4>
                  <p className="text-[11px] text-slate-400">Soccorso tecnico urgente, incendi e allagamenti</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>

          {/* Linea Antiviolenza e Aiuto */}
          <a
            href={`tel:${activeServices.crisisOrWomenHelpline}`}
            className="group block p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-200">
                    Centro Antiviolenza & Ascolto ({activeServices.crisisOrWomenHelpline})
                  </h4>
                  <p className="text-[11px] text-purple-300/70">Numero gratuito, anonimo e protetto</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>

          {/* Collegamento esterno UFFICIALE Protezione Civile / Portale Emergenze */}
          <div className="pt-2">
            <a
              href={activeServices.officialEmergencyPortal}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <span>Portale Istituzionale di Emergenza Ufficiale</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            </a>
          </div>
        </div>

        {/* Footer Privacy */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" /> Chiamata telefonica diretta nativa gestita dalla tua SIM. Nessun dato registrato.
          </p>
        </div>
      </div>
    </div>
  );
}
