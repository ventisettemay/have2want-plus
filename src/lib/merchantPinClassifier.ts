// SISTEMA PIN COMMERCIANTI & PUBBLICITÀ – HAVE2WANT PLUS
// Standard visivo e operativo ufficiale:
// 1. VIOLA E ORO LAMPEGGIANTE: Attività che accettano e utilizzano Pi (senza campagna pubblicitaria attiva)
// 2. ORO PURO: Attività che pubblicizzano il proprio esercizio (volantino/vetrina senza pagamenti Pi)
// 3. DOPPIO ANELLO: Attività che utilizzano Pi E pubblicizzano il proprio esercizio

export type MerchantPinCategory = 'DOUBLE_RING' | 'PI_ACCEPTED' | 'AD_ONLY';

export interface MerchantPinVisual {
  type: MerchantPinCategory;
  label: string;
  badgeLabel: string;
  badgeText: string;
  badgeClass: string;
  badgeBg: string;
  icon: string;
  centerIcon: string;
  primaryColor: string; // hex
  secondaryColor: string; // hex
  outerRingColor: string;
  innerRingColor: string;
  threeColorHex: number;
  threeRingHex: number;
  description: string;
  hasPi: boolean;
  hasAd: boolean;
}

export function classifyMerchantPin(biz: {
  piAccepted?: boolean;
  hasAd?: boolean;
  isAd?: boolean;
  promo?: string;
  adHeadline?: string;
  flyerUrl?: string;
}): MerchantPinVisual {
  const hasPi = Boolean(biz.piAccepted);
  const hasAd = Boolean(
    biz.hasAd ||
    biz.isAd ||
    biz.flyerUrl ||
    (biz.adHeadline && biz.adHeadline.length > 3) ||
    (biz.promo && /sconto|volantin|promo|offerta|omaggio|speciale/i.test(biz.promo))
  );

  if (hasPi && hasAd) {
    return {
      type: 'DOUBLE_RING',
      label: 'Doppio Anello (Pi + Pubblicità)',
      badgeLabel: 'DOPPIO ANELLO: ACCETTA PI + PUBBLICITÀ',
      badgeText: 'DOPPIO ANELLO: ACCETTA PI + PUBBLICITÀ',
      badgeClass: 'bg-gradient-to-r from-amber-500/25 via-purple-500/25 to-amber-500/25 text-amber-300 border border-amber-400 shadow-amber-500/20',
      badgeBg: '#ffd700',
      icon: '👑',
      centerIcon: '👑',
      primaryColor: '#ffd700', // Oro 24k
      secondaryColor: '#8b5cf6', // Viola Pi Network
      outerRingColor: '#ffd700',
      innerRingColor: '#8b5cf6',
      threeColorHex: 0xffd700,
      threeRingHex: 0x8b5cf6,
      description: 'Esercizio convenzionato con la rete Pi Network con volantino e campagna promozionale attiva.',
      hasPi: true,
      hasAd: true,
    };
  }

  if (hasPi) {
    return {
      type: 'PI_ACCEPTED',
      label: 'Viola e Oro Lampeggiante (Accetta Pi)',
      badgeLabel: 'PI NETWORK MERCHANT (ACCETTA PI)',
      badgeText: 'PI NETWORK MERCHANT (ACCETTA PI)',
      badgeClass: 'bg-purple-900/40 text-purple-300 border border-purple-500/50 shadow-purple-500/20 animate-pulse',
      badgeBg: '#8b5cf6',
      icon: '🪙',
      centerIcon: '🪙',
      primaryColor: '#8b5cf6', // Viola Pi
      secondaryColor: '#f59e0b', // Oro ambrato
      outerRingColor: '#8b5cf6',
      innerRingColor: '#ffd700',
      threeColorHex: 0x8b5cf6,
      threeRingHex: 0xf59e0b,
      description: 'Esercizio commerciale convenzionato: accetta pagamenti e transazioni in Pi Coin (π).',
      hasPi: true,
      hasAd: false,
    };
  }

  return {
    type: 'AD_ONLY',
    label: 'Oro Puro (Esercizio Pubblicizzato)',
    badgeLabel: 'ESERCIZIO PUBBLICIZZATO (VOLANTINO)',
    badgeText: 'ESERCIZIO PUBBLICIZZATO (VOLANTINO)',
    badgeClass: 'bg-amber-950/40 text-amber-300 border border-amber-500/50 shadow-amber-500/20',
    badgeBg: '#f59e0b',
    icon: '📢',
    centerIcon: '📢',
    primaryColor: '#ffd700', // Oro Puro
    secondaryColor: '#d97706',
    outerRingColor: '#ffd700',
    innerRingColor: '#d97706',
    threeColorHex: 0xffd700,
    threeRingHex: 0xffd700,
    description: 'Esercizio commerciale con volantino pubblicitario e offerta commerciale in vetrina.',
    hasPi: false,
    hasAd: true,
  };
}
