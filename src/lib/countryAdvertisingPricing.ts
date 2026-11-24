/**
 * Country Advertising Pricing Engine – HAVE2WANT PLUS
 *
 * Sistema tariffario configurabile basato sui costi di mercato per paese/fascia,
 * suddiviso per tipologia di inserzione e durata (Giornaliero, Settimanale, Mensile),
 * con coefficiente di lancio Pionieri modificabile (default 0.20 = 20% del listino pieno).
 * Pagamenti supportati esclusivamente in criptovalute e crediti interni:
 *   - Pi Network (PI_SDK / PI_AD_NETWORK)
 *   - USDT Polygon (non-custodial)
 *   - USDT TRC20 (non-custodial)
 *   - Crediti Prepagati HAVE2WANT (PREPAID_CREDITS)
 * Zero pagamenti fiat / PayPal / carte tradizionali.
 */

export type AdPlacementType = 'EXTERNAL_GLOBE_PIN' | 'INTERNAL_LISTING_AD' | 'CREATOR_PROMO';
export type AdDurationTier = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type CryptoPaymentMethod =
  | 'PI_SDK'
  | 'PI_AD_NETWORK'
  | 'USDT_POLYGON'
  | 'USDT_TRC20'
  | 'PREPAID_CREDITS';

export interface AdTypeCatalogMeta {
  type: AdPlacementType;
  label: string;
  shortLabel: string;
  description: string;
  marketMultiplier: number; // Relativo allo spillo geografico 3D (1.0x)
}

export const AD_PLACEMENT_CATALOG: Record<AdPlacementType, AdTypeCatalogMeta> = {
  EXTERNAL_GLOBE_PIN: {
    type: 'EXTERNAL_GLOBE_PIN',
    label: 'Spilla Pubblicitaria Globo 3D & Mappa Urbana',
    shortLabel: 'Spilla Mappa 3D',
    description: 'Pin animato su Globo 3D e Mappa Urbana con scheda vetrina, volantino e navigazione OSRM.',
    marketMultiplier: 1.0,
  },
  INTERNAL_LISTING_AD: {
    type: 'INTERNAL_LISTING_AD',
    label: 'Inserzione Evidenziata Vetrina & Ricerca',
    shortLabel: 'Vetrina Interna',
    description: 'Posizionamento prioritario nei risultati Marketplace, Km 0 e rotazione territoriale.',
    marketMultiplier: 0.65,
  },
  CREATOR_PROMO: {
    type: 'CREATOR_PROMO',
    label: 'Promozione Creator & Defiance Pulse',
    shortLabel: 'Creator Pulse',
    description: 'Spinta audio/video e vetrina creator nelle 4 sezioni di Defiance Pulse.',
    marketMultiplier: 0.85,
  },
};

export const CRYPTO_PAYMENT_METHODS_META: Record<
  CryptoPaymentMethod,
  {
    id: CryptoPaymentMethod;
    label: string;
    networkBadge: string;
    isCryptoOnly: true;
    description: string;
  }
> = {
  PI_SDK: {
    id: 'PI_SDK',
    label: 'Pi Coin (Pi Wallet SDK)',
    networkBadge: 'Pi Mainnet / Testnet',
    isCryptoOnly: true,
    description: 'Pagamento diretto non-custodial tramite Pi Browser / Pi SDK.',
  },
  PI_AD_NETWORK: {
    id: 'PI_AD_NETWORK',
    label: 'Pi Ad Network / Credito Pubblicitario',
    networkBadge: 'Pi Ads Reward',
    isCryptoOnly: true,
    description: 'Compensazione tramite impressioni e crediti ecosistemici Pi Ad Network.',
  },
  USDT_POLYGON: {
    id: 'USDT_POLYGON',
    label: 'USDT (Polygon PoS)',
    networkBadge: 'Polygon ERC-20',
    isCryptoOnly: true,
    description: 'Trasferimento P2P non-custodial su rete Polygon a basse commissioni.',
  },
  USDT_TRC20: {
    id: 'USDT_TRC20',
    label: 'USDT (TRON TRC20)',
    networkBadge: 'TRON TRC20',
    isCryptoOnly: true,
    description: 'Regolamento non-custodial USDT su rete TRON con hash verificabile.',
  },
  PREPAID_CREDITS: {
    id: 'PREPAID_CREDITS',
    label: 'Crediti Prepagati HAVE2WANT',
    networkBadge: 'Saldo Pioniere',
    isCryptoOnly: true,
    description: 'Utilizzo diretto del credito accumulato o pre-caricato sulla piattaforma.',
  },
};

export const DEFAULT_LAUNCH_COEFFICIENT = 0.2;
const STORAGE_LAUNCH_COEFF_KEY = 'h2w_ad_launch_coefficient_v1';

export function getConfiguredLaunchCoefficient(): number {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_LAUNCH_COEFFICIENT;
    const raw = localStorage.getItem(STORAGE_LAUNCH_COEFF_KEY);
    if (!raw) return DEFAULT_LAUNCH_COEFFICIENT;
    const num = Number(raw);
    if (Number.isFinite(num) && num >= 0.05 && num <= 1.5) {
      return Math.round(num * 100) / 100;
    }
    return DEFAULT_LAUNCH_COEFFICIENT;
  } catch {
    return DEFAULT_LAUNCH_COEFFICIENT;
  }
}

export function setConfiguredLaunchCoefficient(coeff: number): number {
  const clamped = Math.max(0.05, Math.min(1.5, Math.round((Number(coeff) || DEFAULT_LAUNCH_COEFFICIENT) * 100) / 100));
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_LAUNCH_COEFF_KEY, String(clamped));
    }
  } catch {
    // ignore storage errors
  }
  return clamped;
}

export interface CountryPricingTier {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  externalWeeklyCost: number;
  h2wBaseValueLocal: number;
  fullListPricePi: number;
  marketWeeklyUsd: number;
}

export const COUNTRY_PRICING_CATALOG: Record<string, CountryPricingTier> = {
  IT: {
    countryCode: 'IT',
    countryName: 'Italia',
    currencyCode: 'EUR',
    currencySymbol: '€',
    externalWeeklyCost: 20,
    h2wBaseValueLocal: 10,
    fullListPricePi: 100,
    marketWeeklyUsd: 21.5,
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currencyCode: 'USD',
    currencySymbol: '$',
    externalWeeklyCost: 20,
    h2wBaseValueLocal: 10,
    fullListPricePi: 100,
    marketWeeklyUsd: 20,
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currencyCode: 'GBP',
    currencySymbol: '£',
    externalWeeklyCost: 16,
    h2wBaseValueLocal: 8,
    fullListPricePi: 105,
    marketWeeklyUsd: 21,
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    currencyCode: 'EUR',
    currencySymbol: '€',
    externalWeeklyCost: 20,
    h2wBaseValueLocal: 10,
    fullListPricePi: 100,
    marketWeeklyUsd: 21.5,
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Deutschland',
    currencyCode: 'EUR',
    currencySymbol: '€',
    externalWeeklyCost: 22,
    h2wBaseValueLocal: 11,
    fullListPricePi: 110,
    marketWeeklyUsd: 23.5,
  },
  ES: {
    countryCode: 'ES',
    countryName: 'España',
    currencyCode: 'EUR',
    currencySymbol: '€',
    externalWeeklyCost: 18,
    h2wBaseValueLocal: 9,
    fullListPricePi: 95,
    marketWeeklyUsd: 19.5,
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    externalWeeklyCost: 3000,
    h2wBaseValueLocal: 1500,
    fullListPricePi: 105,
    marketWeeklyUsd: 21,
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    currencyCode: 'INR',
    currencySymbol: '₹',
    externalWeeklyCost: 800,
    h2wBaseValueLocal: 400,
    fullListPricePi: 50,
    marketWeeklyUsd: 10,
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brasil',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    externalWeeklyCost: 60,
    h2wBaseValueLocal: 30,
    fullListPricePi: 60,
    marketWeeklyUsd: 12,
  },
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    currencyCode: 'CNY',
    currencySymbol: '¥',
    externalWeeklyCost: 140,
    h2wBaseValueLocal: 70,
    fullListPricePi: 100,
    marketWeeklyUsd: 20,
  },
  GLOBAL: {
    countryCode: 'GLOBAL',
    countryName: 'Internazionale',
    currencyCode: 'USD',
    currencySymbol: '$',
    externalWeeklyCost: 20,
    h2wBaseValueLocal: 10,
    fullListPricePi: 100,
    marketWeeklyUsd: 20,
  },
};

export interface WeeklyPricingResult {
  countryCode: string;
  countryName: string;
  currencySymbol: string;
  durationDays: number;
  durationLabel: string;
  durationTier: AdDurationTier;
  adType: AdPlacementType;
  adTypeLabel: string;
  listPricePi: number;
  currentPricePi: number;
  currentPriceUsdt: number;
  listPriceUsdt: number;
  appliedCoefficient: number;
  weeklyViews: number;
  trafficTierLabel: string;
  supportedPaymentMethods: CryptoPaymentMethod[];
  isTestnet: boolean;
}

const DURATION_META: Record<AdDurationTier, { days: number; label: string; factor: number }> = {
  DAILY: { days: 1, label: 'Giornaliera (24 ore)', factor: 0.2 },
  WEEKLY: { days: 7, label: 'Settimanale (7 giorni)', factor: 1.0 },
  MONTHLY: { days: 30, label: 'Mensile (30 giorni)', factor: 3.6 },
};

/**
 * Calcola il listino completo per Paese, Tipo di Inserzione, Durata e Coefficiente Lancio Pioniere.
 */
export function getCountryAdPricingByType(
  countryCodeInput: string = 'GLOBAL',
  adType: AdPlacementType = 'EXTERNAL_GLOBE_PIN',
  durationTier: AdDurationTier = 'WEEKLY',
  customCoefficient?: number,
  simulatedViews?: number
): WeeklyPricingResult {
  const code = (countryCodeInput || 'GLOBAL').toUpperCase();
  const tier = COUNTRY_PRICING_CATALOG[code] || COUNTRY_PRICING_CATALOG.GLOBAL;
  const adMeta = AD_PLACEMENT_CATALOG[adType] || AD_PLACEMENT_CATALOG.EXTERNAL_GLOBE_PIN;
  const durMeta = DURATION_META[durationTier] || DURATION_META.WEEKLY;

  const views = typeof simulatedViews === 'number' ? simulatedViews : 450;
  const defaultLaunchCoeff = getConfiguredLaunchCoefficient();

  let coefficient = defaultLaunchCoeff;
  let trafficTierLabel = `Coefficiente Lancio Pioniere (${Math.round(defaultLaunchCoeff * 100)}%)`;

  if (typeof customCoefficient === 'number' && Number.isFinite(customCoefficient)) {
    coefficient = Math.max(0.05, Math.min(1.5, customCoefficient));
    trafficTierLabel = `Coefficiente personalizzato (${Math.round(coefficient * 100)}%)`;
  } else if (views >= 50000) {
    coefficient = 1.0;
    trafficTierLabel = 'Alta affluenza';
  } else if (views >= 10000) {
    coefficient = 0.8;
    trafficTierLabel = 'Traffico consolidato';
  } else if (views >= 1000) {
    coefficient = 0.5;
    trafficTierLabel = 'Traffico in crescita';
  }

  const listPricePi = Math.max(
    1,
    Math.round(tier.fullListPricePi * adMeta.marketMultiplier * durMeta.factor)
  );
  const currentPricePi = Math.max(
    1,
    Math.round(listPricePi * coefficient * 10) / 10
  );

  const listPriceUsdt = Math.max(
    0.5,
    Math.round(tier.marketWeeklyUsd * 0.5 * adMeta.marketMultiplier * durMeta.factor * 100) / 100
  );
  const currentPriceUsdt = Math.max(
    0.2,
    Math.round(listPriceUsdt * coefficient * 100) / 100
  );

  return {
    countryCode: tier.countryCode,
    countryName: tier.countryName,
    currencySymbol: tier.currencySymbol,
    durationDays: durMeta.days,
    durationLabel: durMeta.label,
    durationTier,
    adType,
    adTypeLabel: adMeta.label,
    listPricePi,
    currentPricePi,
    currentPriceUsdt,
    listPriceUsdt,
    appliedCoefficient: coefficient,
    weeklyViews: views,
    trafficTierLabel,
    supportedPaymentMethods: [
      'PI_SDK',
      'PI_AD_NETWORK',
      'USDT_POLYGON',
      'USDT_TRC20',
      'PREPAID_CREDITS',
    ],
    isTestnet: true,
  };
}

/**
 * Funzione retrocompatibile per il prezzo settimanale base (Spilla Mappa 3D, 7 giorni).
 */
export function getWeeklyAdvertisingPrice(
  countryCodeInput: string = 'GLOBAL',
  simulatedViews?: number
): WeeklyPricingResult {
  return getCountryAdPricingByType(
    countryCodeInput,
    'EXTERNAL_GLOBE_PIN',
    'WEEKLY',
    undefined,
    simulatedViews
  );
}
