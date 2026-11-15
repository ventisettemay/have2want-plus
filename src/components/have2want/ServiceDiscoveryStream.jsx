import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Calendar, Store, Car, Mic, Handshake, Building2, CloudSun, BookOpen } from 'lucide-react';

export default function ServiceDiscoveryStream({
  onOpenCreateListing,
  onOpenCarpool,
  onOpenPiHub,
  onOpenCraftMemory,
  onOpenVoiceChat,
  onSwitchToUrban3D,
  onOpenGuides,
  onFilterByCategory,
  onOpenWeatherNotice,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSlidingOut, setIsSlidingOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const services = [
    {
      id: 'app_explainer',
      tag: "COS'È?",
      title: 'SCAMBIA CIÒ CHE HAI CON CIÒ CHE VUOI (P2P & PI)',
      action: () => {
        if (onOpenGuides) onOpenGuides();
      }
    },
    {
      id: 'want_search',
      tag: 'WANT',
      title: 'QUELLO CHE NON TROVI',
      action: () => {
        if (onOpenCreateListing) onOpenCreateListing('CERCO');
      }
    },
    {
      id: 'work_have',
      tag: 'HAVE',
      title: 'BACHECA LAVORO & OPPORTUNITÀ',
      action: () => {
        if (onFilterByCategory) onFilterByCategory('LAVORO');
        else if (onOpenCreateListing) onOpenCreateListing('VENDO');
      }
    },
    {
      id: 'events',
      tag: 'TERRITORIO',
      title: 'EVENTI, SAGRE & FIERE LOCALI',
      action: () => {
        if (onFilterByCategory) onFilterByCategory('EVENTI');
      }
    },
    {
      id: 'craft_pi',
      tag: 'COMMERCIO',
      title: 'BOTTEGHE ARTIGIANE & RETE PI',
      action: () => {
        if (onOpenPiHub) onOpenPiHub();
      }
    },
    {
      id: 'carpool',
      tag: 'VIAGGI',
      title: 'TRASFERTE & CARPOOLING CONDIVISO',
      action: () => {
        if (onOpenCarpool) onOpenCarpool();
      }
    },
    {
      id: 'voice_chat',
      tag: 'VOCE',
      title: 'CHAT DIRETTA & NOTE VOCALI',
      action: () => {
        if (onOpenVoiceChat) onOpenVoiceChat();
      }
    },
    {
      id: 'handshake',
      tag: 'FIDUCIA',
      title: 'STRETTA DI MANO DIGITALE',
      action: () => {
        if (onOpenGuides) onOpenGuides();
      }
    },
    {
      id: 'urban3d',
      tag: 'STRADA',
      title: 'URBANO 3D & CAMMINA NELLA VIA',
      action: () => {
        if (onSwitchToUrban3D) onSwitchToUrban3D();
      }
    },
    {
      id: 'weather',
      tag: 'METEO',
      title: 'METEO LIVE & RADAR SATELLITARE',
      action: () => {
        if (onOpenWeatherNotice) onOpenWeatherNotice();
      }
    },
    {
      id: 'craft_memory',
      tag: 'MEMORIA',
      title: 'MEMORIA STORICA & SAPER FARE',
      action: () => {
        if (onOpenCraftMemory) onOpenCraftMemory();
      }
    }
  ];

  // Scorrimento meccanico: scivola a sinistra per uscire, cambia, e rientra
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setIsSlidingOut(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % services.length);
        setIsSlidingOut(false);
      }, 450);
    }, 5500); // 5.5 secondi per dare tutto il tempo di leggere con calma

    return () => clearInterval(timer);
  }, [isHovered, services.length]);

  const current = services[currentIndex];

  return (
    <div
      className="absolute top-3 sm:top-5 left-0 z-20 pointer-events-auto select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* BADGE AD ALTO CONTRASTO E ALTA LEGGIBILITÀ */}
      <div
        className={`flex items-center transition-transform duration-500 ease-out transform ${
          isSlidingOut ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div
          onClick={() => {
            if (current.action) current.action();
          }}
          className="flex items-center gap-2.5 sm:gap-3 pl-3.5 sm:pl-4 pr-4 sm:pr-5 py-2 sm:py-2.5 bg-black/95 backdrop-blur-md rounded-r-2xl cursor-pointer hover:bg-zinc-950 active:scale-[0.98] transition-all group border-y-2 border-r-2 border-[#00ff66] shadow-[0_4px_24px_rgba(0,255,102,0.28)]"
          title={`${current.title} — Tocca per aprire`}
        >
          {/* Indicatore visivo luminoso */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ff66] shadow-[0_0_10px_#00ff66] animate-pulse shrink-0" />

          {/* Categoria: Verde neon brillante con bordo */}
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#00ff66]/15 text-[#00ff66] font-mono border border-[#00ff66]/50 shrink-0">
            {current.tag}
          </span>

          {/* Scritta servizio: Grande, bianco nitido ad altissimo contrasto */}
          <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wide text-white group-hover:text-[#00ff66] transition-colors whitespace-nowrap drop-shadow-sm">
            {current.title}
          </span>

          <span className="text-[#00ff66] text-xs sm:text-sm font-bold opacity-80 group-hover:translate-x-0.5 transition-transform">
            ➔
          </span>
        </div>
      </div>
    </div>
  );
}
