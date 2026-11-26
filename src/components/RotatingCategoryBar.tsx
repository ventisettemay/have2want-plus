import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, Check } from 'lucide-react';
import { REAL_CATEGORIES_MATRIX, CATEGORY_FALLBACK_IMAGE } from '../categories';

export interface RotatingBarItem {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  realImage: string;
  badge?: string;
  badgeColor?: string;
  count?: number;
  type: 'category' | 'channel' | 'all';
}

interface RotatingCategoryBarProps {
  activeKey: string;
  onSelect: (item: RotatingBarItem) => void;
  listingsCounts?: Record<string, number>;
  onOpenWeather?: () => void;
  onOpenCraftKnowledge?: () => void;
  className?: string;
}

export const ROTATING_BAR_ITEMS: RotatingBarItem[] = [
  {
    id: 'attrezzi_lavoro',
    key: 'attrezzi_lavoro',
    title: 'Attrezzi da Lavoro & Ferramenta',
    subtitle: 'Elettroutensili, officina, banchi lavoro e cantieri (NO arredo)',
    realImage: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600&auto=format&fit=crop&q=80',
    badge: 'TIPOLOGIA SEPARATA',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    type: 'category',
  },
  {
    id: 'alimentari_km0',
    key: 'alimentari_km0',
    title: 'Km 0, Botteghe & Produttori Locali',
    subtitle: 'Ortofrutta fresca, olio, vino, formaggi e filiera corta',
    realImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80',
    badge: 'FILIERA CORTA',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    type: 'category',
  },
  {
    id: 'arredamento_casa',
    key: 'arredamento_casa',
    title: 'Arredo, Mobili & Design Casa',
    subtitle: 'Tavoli massello, madie restaurate, sedie e complementi',
    realImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    badge: 'SOLO ARREDO',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    type: 'category',
  },
  {
    id: 'veicoli_ricambi',
    key: 'auto_moto_veicoli',
    title: 'Veicoli, Ricambi & Meccanica',
    subtitle: 'Pneumatici, freni, batterie, cargo bike e trasferte carpool',
    realImage: CATEGORY_FALLBACK_IMAGE,
    badge: 'MECCANICA REALE',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    type: 'category',
  },
  {
    id: 'elettronica_informatica',
    key: 'elettronica_informatica',
    title: 'Elettronica & Informatica',
    subtitle: 'Laptop ricondizionati, monitor, smartphone e componenti',
    realImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    badge: 'HARDWARE TECH',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    type: 'category',
  },
  {
    id: 'abbigliamento_accessori',
    key: 'abbigliamento_accessori',
    title: 'Abbigliamento, Calzature & DPI',
    subtitle: 'Scarpe antinfortunistiche, tute da lavoro e giacconi',
    realImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    badge: 'DPI & TESSILI',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    type: 'category',
  },
  {
    id: 'libri_scuola_cultura',
    key: 'libri_scuola_cultura',
    title: 'Libri, Testi Scolastici & Saggistica',
    subtitle: 'Scambio testi scolastici usati per studenti, manuali e saggi',
    realImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    badge: 'STUDENTI & SCUOLA',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    type: 'category',
  },
  {
    id: 'servizi_lavoro_buoni',
    key: 'servizi_lavoro_buoni',
    title: 'Bacheca Lavoro P2P & Mestieri',
    subtitle: 'Manodopera qualificata, riparazioni, lezioni e buone pratiche',
    realImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    badge: 'LAVORO DIRETTO',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    type: 'category',
  },
  {
    id: 'meteo_live',
    key: 'METEO_LIVE',
    title: 'Meteo Live & Radar Territorio',
    subtitle: 'Radar pioggia in tempo reale, nubi dinamiche e stazioni locali',
    realImage: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=600&auto=format&fit=crop&q=80',
    badge: 'METEO LIVE',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    type: 'channel',
  },
  {
    id: 'conoscenze_mestieri',
    key: 'CONOSCENZE_MESTIERI',
    title: 'Conoscenze & Mestieri',
    subtitle: 'Archivio Salvavatutto, saperi artigiani e guide pratiche di riparazione',
    realImage: CATEGORY_FALLBACK_IMAGE,
    badge: 'MEMORIA & GUIDE',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    type: 'channel',
  },
];

export const RotatingCategoryBar: React.FC<RotatingCategoryBarProps> = ({
  activeKey,
  onSelect,
  listingsCounts = {},
  onOpenWeather,
  onOpenCraftKnowledge,
  className = '',
}) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalItems = ROTATING_BAR_ITEMS.length;

  // Sync index when activeKey changes externally
  useEffect(() => {
    const idx = ROTATING_BAR_ITEMS.findIndex((item) => item.key === activeKey);
    if (idx !== -1) {
      setRotationIndex(idx);
    }
  }, [activeKey]);

  // Rotazione continua dolce quando attiva
  useEffect(() => {
    if (!isAutoRotating || isHovered) return;

    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % totalItems);
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoRotating, isHovered, totalItems]);

  const handleNext = () => {
    setRotationIndex((prev) => (prev + 1) % totalItems);
  };

  const handlePrev = () => {
    setRotationIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  // Dragging / Touch rotation
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchStartX.current = clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartX.current === null) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = touchStartX.current - clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className={`relative w-full bg-zinc-950/90 border-y border-zinc-900 py-2.5 px-2 select-none backdrop-blur-md z-20 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* TITOLO BARRA ROTANTE & CONTROLLI ROTAZIONE */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[#00ff66]">
            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              BARRA <span className="text-[#00ff66]">ROTANTE</span>
            </span>
          </div>

          {/* Frecce Rotazione Sinistra / Destra */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer transition-colors active:scale-95"
              title="Ruota bar verso sinistra"
              aria-label="Ruota sinistra"
            >
              <ChevronLeft className="w-4 h-4 text-[#00ff66]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer transition-colors active:scale-95"
              title="Ruota bar verso destra"
              aria-label="Ruota destra"
            >
              <ChevronRight className="w-4 h-4 text-[#00ff66]" />
            </button>

            {/* Toggle Auto-Rotazione */}
            <button
              type="button"
              onClick={() => setIsAutoRotating((prev) => !prev)}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border ${
                isAutoRotating
                  ? 'bg-emerald-950/80 text-[#00ff66] border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title={isAutoRotating ? 'Metti in pausa rotazione automatica' : 'Attiva rotazione automatica'}
            >
              {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[10px] font-mono">
                {isAutoRotating ? 'AUTO ON' : 'AUTO OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* CILINDRO / NASTRO ROTANTE INTERATTIVO CON FOTO REALI */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          className="relative flex-1 overflow-hidden min-w-0 py-0.5 cursor-grab active:cursor-grabbing"
        >
          {/* VISTA A NASTRO SCORREVOLE CENTRATA CON ANGOLAZIONE PROSPETTICA */}
          <div
            className="flex items-center gap-2 sm:gap-3 transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(50% - ${rotationIndex * 260 + 130}px))`,
            }}
          >
            {ROTATING_BAR_ITEMS.map((item, index) => {
              const isActive = item.key === activeKey;
              const isCentered = index === rotationIndex;
              const count = listingsCounts[item.key] || 0;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setRotationIndex(index);
                    if (item.id === 'meteo_live' && onOpenWeather) {
                      onOpenWeather();
                    } else if (item.key === 'CONOSCENZE_MESTIERI' && onOpenCraftKnowledge) {
                      onOpenCraftKnowledge();
                    } else {
                      onSelect(item);
                    }
                  }}
                  className={`relative shrink-0 w-[240px] sm:w-[260px] h-[72px] rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer group shadow-lg ${
                    isActive || isCentered
                      ? 'border-[#00ff66] scale-105 shadow-[0_0_20px_rgba(0,255,102,0.35)] ring-2 ring-[#00ff66]/30 z-10'
                      : 'border-zinc-800 hover:border-zinc-600 opacity-75 hover:opacity-100 scale-95'
                  }`}
                >
                  {/* FOTOGRAFIA REALE COME SFONDO VERO (NO DISEGNINI O ICONCINE) */}
                  <img
                    src={item.realImage}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-75 contrast-110"
                    loading="lazy"
                  />
                  {/* GRADIENTE SCURO AD ALTO CONTRASTO PER LEGGIBILITÀ DEL TESTO */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

                  {/* CONTENUTO DELLA SCHEDA */}
                  <div className="relative z-10 w-full h-full p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                          item.badgeColor || 'bg-zinc-900/80 text-[#00ff66] border-[#00ff66]/40'
                        }`}
                      >
                        {item.badge || 'PAGINA'}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] font-mono font-black text-[#00ff66] bg-black/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                          {count} annunci
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-[#00ff66] transition-colors truncate drop-shadow-md">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-zinc-300 truncate drop-shadow-sm font-medium">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* INDICATORE ATTIVO IN CORSO */}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* INDICATORE DI POSIZIONE ROTAZIONE */}
        <div className="hidden lg:flex items-center gap-1 shrink-0 px-2">
          {ROTATING_BAR_ITEMS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setRotationIndex(idx);
                const item = ROTATING_BAR_ITEMS[idx];
                if (item.id === 'meteo_live' && onOpenWeather) onOpenWeather();
                else if (item.key === 'CONOSCENZE_MESTIERI' && onOpenCraftKnowledge) onOpenCraftKnowledge();
                else onSelect(item);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === rotationIndex ? 'w-6 bg-[#00ff66]' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
              }`}
              title={`Vai a ${ROTATING_BAR_ITEMS[idx].title}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
