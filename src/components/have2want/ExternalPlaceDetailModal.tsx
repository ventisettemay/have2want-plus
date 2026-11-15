import React, { useState } from 'react';
import {
  ExternalLink,
  Navigation,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  Disc3,
  PartyPopper,
  PackageCheck,
  Stethoscope,
  X,
  Share2,
  ShieldCheck
} from 'lucide-react';
import { ExternalPlaceService } from '@/lib/externalGatewayServices';

interface ExternalPlaceDetailModalProps {
  place: ExternalPlaceService | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateInApp?: (place: ExternalPlaceService) => void;
}

export default function ExternalPlaceDetailModal({
  place,
  isOpen,
  onClose,
  onNavigateInApp,
}: ExternalPlaceDetailModalProps) {
  if (!isOpen || !place) return null;

  const getCategoryIcon = () => {
    switch (place.category) {
      case 'supermarket_flyer':
        return <ShoppingBag className="w-5 h-5 text-amber-400" />;
      case 'nightlife':
        return <Disc3 className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />;
      case 'event_fair':
        return <PartyPopper className="w-5 h-5 text-pink-400" />;
      case 'locker':
        return <PackageCheck className="w-5 h-5 text-emerald-400" />;
      case 'pro_ethical':
        return <Stethoscope className="w-5 h-5 text-sky-400" />;
      default:
        return <MapPin className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getCategoryBadgeClass = () => {
    switch (place.category) {
      case 'supermarket_flyer':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'nightlife':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'event_fair':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
      case 'locker':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'pro_ethical':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-md">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadgeClass()}`}>
                  {place.categoryLabel}
                </span>
                {place.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {place.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                {place.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-300 text-xs leading-relaxed">
          {/* Posizione & Orari */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{place.address}</span>
            </div>
            {place.hours && (
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{place.hours}</span>
              </div>
            )}
          </div>

          {/* Descrizione */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Informazioni sul Luogo
            </h4>
            <p className="text-slate-300 leading-normal">
              {place.description}
            </p>
          </div>

          {/* Promozione o Speciale */}
          {place.promoOrSpecial && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-0.5">
                  Evidenza Speciale
                </strong>
                <span>{place.promoOrSpecial}</span>
              </div>
            </div>
          )}

          {/* AZIONI PRINCIPALI: NAVIGAZIONE INTERNA IN-APP + GATEWAY UFFICIALE */}
          <div className="pt-2 space-y-2.5">
            {/* 1. Navigatore Interno 3D OSRM (Funziona direttamente nell'App senza uscire) */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateInApp) {
                  onNavigateInApp(place);
                }
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00ff66] hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
              title="Calcola percorso stradale OSRM direttamente nell'app 3D"
            >
              <Navigation className="w-4 h-4 fill-current" />
              <span>🧭 Calcola Percorso & Naviga nell'App (OSRM 3D)</span>
            </button>

            {/* 2. Navigatore Esterno Alternativo Smartphone (Opzionale per supporto auto) */}
            {place.navigationUrl && (
              <a
                href={place.navigationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-zinc-750 transition-colors cursor-pointer"
                title="Apri indicazioni stradali sul navigatore del dispositivo"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Apri Navigatore Smartphone Esterno (Google Maps / Apple Maps)</span>
              </a>
            )}

            {/* 3. Collegamento Diretto Ufficiale (Volantino, Sito Ufficiale, Locker Info) */}
            {place.externalLink && (
              <a
                href={place.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <span>{place.externalLinkText}</span>
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              </a>
            )}
          </div>
        </div>

        {/* Note architettura etica */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Collegamento diretto alla fonte ufficiale esterna • Zero archiviazione locale
          </p>
        </div>
      </div>
    </div>
  );
}
