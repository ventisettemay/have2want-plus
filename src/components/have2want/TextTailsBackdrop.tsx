import React from 'react';

export interface TextTailsBackdropProps {
  appName?: string;
  tagline?: string;
  externalAppLabel?: string;
  logoUrl?: string;
  showFrontLogo?: boolean;
  blurPx?: number;
  opacity?: number;
}

export const TextTailsBackdrop: React.FC<TextTailsBackdropProps> = ({
  appName = 'HAVE 2 WANT+ · ACTIONFLOW Hub',
  tagline = 'SIMPLY DISCREET PLUS · WHAT YOU HAVE — WHAT YOU WANT',
  externalAppLabel = 'App Esterna Collegata',
  logoUrl,
  showFrontLogo = true,
  blurPx = 2.5,
  opacity = 0.18,
}) => {
  const tailTexts = [
    { label: appName, tone: 'blue' as const, scaleX: 1.18, delay: '0s', duration: '7.2s' },
    { label: tagline, tone: 'gold' as const, scaleX: 1.24, delay: '-1.6s', duration: '8.4s' },
    { label: externalAppLabel, tone: 'blue' as const, scaleX: 1.15, delay: '-3.1s', duration: '6.9s' },
    { label: appName, tone: 'gold' as const, scaleX: 1.22, delay: '-4.4s', duration: '7.8s' },
    { label: tagline, tone: 'blue' as const, scaleX: 1.2, delay: '-2.3s', duration: '8.6s' },
    { label: externalAppLabel, tone: 'gold' as const, scaleX: 1.16, delay: '-5.2s', duration: '7.4s' },
  ];

  return (
    <>
      {showFrontLogo && logoUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-4 left-4 z-10 select-none"
        >
          <img
            src={logoUrl}
            alt={appName}
            className="h-12 w-12 rounded-full object-cover shadow-md"
          />
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
        style={{
          opacity,
          filter: `blur(${blurPx}px)`,
        }}
      >
        <style>{`
          @keyframes h2wTextTailWave {
            0%, 100% {
              transform: translate3d(0px, 0px, 0px) scaleX(var(--tail-scale, 1.18)) skewX(-12deg) rotate(-1.5deg);
            }
            25% {
              transform: translate3d(10px, -9px, 0px) scaleX(calc(var(--tail-scale, 1.18) + 0.06)) skewX(-6deg) rotate(1.5deg);
            }
            50% {
              transform: translate3d(4px, 8px, 0px) scaleX(var(--tail-scale, 1.18)) skewX(-16deg) rotate(-1deg);
            }
            75% {
              transform: translate3d(-8px, -5px, 0px) scaleX(calc(var(--tail-scale, 1.18) - 0.04)) skewX(-8deg) rotate(2deg);
            }
          }

          .h2w-text-tail {
            display: inline-block;
            transform-origin: left center;
            animation: h2wTextTailWave var(--tail-dur, 7.5s) ease-in-out infinite;
            animation-delay: var(--tail-delay, 0s);
            will-change: transform;
            -webkit-mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.12) 100%);
            mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.12) 100%);
          }

          .h2w-tail-blue {
            color: #1e3a8a;
          }

          .h2w-tail-gold {
            color: #d4af37;
          }
        `}</style>

        <div className="flex h-full flex-col justify-around px-8 py-8">
          {tailTexts.map((item, index) => (
            <div
              key={index}
              style={{ marginLeft: `${(index % 3) * 7}%` }}
            >
              <span
                className={`h2w-text-tail ${
                  item.tone === 'blue' ? 'h2w-tail-blue' : 'h2w-tail-gold'
                } text-lg font-extrabold tracking-widest uppercase whitespace-nowrap`}
                style={
                  {
                    '--tail-scale': item.scaleX,
                    '--tail-delay': item.delay,
                    '--tail-dur': item.duration,
                  } as React.CSSProperties
                }
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};