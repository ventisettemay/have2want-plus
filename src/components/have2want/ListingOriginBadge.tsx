import React from 'react';
import { ExternalLink, FlaskConical, ShieldCheck } from 'lucide-react';
import { getListingOriginBadge, ExternalBadgeInfo } from '@/lib/listingOrigin';

interface ListingOriginBadgeProps {
  listing: any;
  preferredLang?: string;
  size?: 'xs' | 'sm' | 'md';
  compact?: boolean;
  showDirect?: boolean;
  className?: string;
}

/**
 * Componente unificato per l'etichettatura obbligatoria di TUTTI gli annunci:
 * - Se di prova/illustrativo: "Di prova" / "Annuncio di prova"
 * - Se esterno: "Esterno" / "Esterno: [Nome Portale]"
 * - Se P2P reale: "Diretto P2P" (opzionale o attivo su richiesta)
 */
export function ListingOriginBadge({
  listing,
  preferredLang,
  size = 'xs',
  compact = false,
  showDirect = false,
  className = '',
}: ListingOriginBadgeProps) {
  if (!listing) return null;

  const info: ExternalBadgeInfo = getListingOriginBadge(listing, preferredLang);

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-0.8 gap-1.5',
    md: 'text-xs sm:text-sm px-3 py-1 gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  // 1. Annuncio Esterno (es. Subito.it, eBay, Wallapop, ecc.)
  if (info.isExternal) {
    const displayText = compact ? info.label : info.sublabel || info.label;
    return (
      <span
        className={`inline-flex items-center rounded-full font-black uppercase tracking-wider bg-amber-950/85 text-amber-300 border border-amber-500/60 shadow-sm shrink-0 select-none ${sizeClasses} ${className}`}
        title={info.tooltip}
      >
        <ExternalLink className={`${iconSizes} text-amber-400 shrink-0`} />
        <span className="truncate max-w-[160px]">{displayText}</span>
      </span>
    );
  }

  // 2. Annuncio di Prova / Illustrativo dimostrativo
  if (info.isDemo) {
    const displayText = compact ? info.label : (info.sublabel || info.label);
    return (
      <span
        className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider bg-sky-950/85 text-sky-300 border border-sky-500/50 shadow-sm shrink-0 select-none ${sizeClasses} ${className}`}
        title={info.tooltip}
      >
        <FlaskConical className={`${iconSizes} text-sky-400 shrink-0`} />
        <span className="truncate max-w-[160px]">{displayText}</span>
      </span>
    );
  }

  // 3. Annuncio Diretto P2P della comunità (mostrato se richiesto)
  if (showDirect) {
    return (
      <span
        className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm shrink-0 select-none ${sizeClasses} ${className}`}
        title={info.tooltip}
      >
        <ShieldCheck className={`${iconSizes} text-emerald-400 shrink-0`} />
        <span className="truncate max-w-[160px]">{info.label}</span>
      </span>
    );
  }

  return null;
}
