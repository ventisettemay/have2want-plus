import React from 'react';

export interface TextTailsBackdropProps {
  showLogo?: boolean;
  label?: string;
  className?: string;
}

const TAIL_TEXTS = [
  { id: 'tail-1', text: 'HAVE2WANT PLUS · ECONOMIA CIRCOLARE · PI NETWORK', color: '#1e3a8a', delay: '0s', top: '8%' },
  { id: 'tail-2', text: 'COSA HAI · COSA CERCHI · SCAMBI DIRETTI P2P', color: '#d4af37', delay: '0.8s', top: '23%' },
  { id: 'tail-3', text: 'TERRITORIO KM ZERO · BOTTEGHE LOCALI · ZERO BANCHE', color: '#1e3a8a', delay: '1.6s', top: '38%' },
  { id: 'tail-4', text: 'DEFIANCE PULSE · CREATOR · MUSICA · VIDEO', color: '#d4af37', delay: '2.4s', top: '54%' },
  { id: 'tail-5', text: 'GEOPRIVACY ATTIVA · PUNTI CERTIFICATI · STRETTA DI MANO', color: '#1e3a8a', delay: '3.2s', top: '70%' },
  { id: 'tail-6', text: 'FLOTTA SATELLITARE · METEO REALE · SOCCORSO MONDIALE', color: '#d4af37', delay: '4s', top: '84%' },
];

export default function TextTailsBackdrop({
  showLogo = false,
  label = 'HAVE2WANT PLUS',
  className = '',
}: TextTailsBackdropProps) {
  const hasPositionClass = /\b(absolute|fixed|sticky|relative)\b/.test(className);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden select-none w-full h-full ${hasPositionClass ? '' : 'relative'} ${className}`}
    >
      <div className="relative w-full h-full flex flex-col justify-evenly">
        {TAIL_TEXTS.map((tail) => (
          <div
            key={tail.id}
            data-tail-id={tail.id}
            className="h2w-tail-ribbon whitespace-nowrap font-black tracking-widest text-xs sm:text-sm uppercase opacity-45"
            style={{
              color: tail.color,
              animationDelay: tail.delay,
            }}
          >
            {tail.text}
          </div>
        ))}
      </div>

      {showLogo && (
        <div className="relative z-10 flex items-center justify-center py-3">
          <div className="px-4 py-1.5 rounded-xl bg-zinc-950/90 border border-[#d4af37]/60 text-sm font-black tracking-wider text-white">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
