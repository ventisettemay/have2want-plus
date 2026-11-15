/**
 * Country Advertising Pricing Engine for HAVE2WANT
 * 
 * Formula:
 * 1. Benchmark esterno locale settimanale (Subito/Google/Craigslist etc.)
 * 2. Dimezzamento al 50% per il valore di base HAVE2WANT
 * 3. Conversione in Pi al tasso di mercato (CMC ~0.095 USD/Pi) -> Prezzo di Listino Pieno
 * 4. Durata rigorosamente Settimanale Fissa (7 giorni)
 * 5. Calcolo del prezzo reale attuale in base alle visualizzazioni registrate nello Stato:
 *    - < 1.000 viste: 20% del listino (es. 20 Pi)
 *    - 1.000 - 10.000 viste: 50% del listino (es. 50 Pi)
 *    - 10.000 - 50.000 viste: 80% del listino (es. 80 Pi)
 *    - > 50.000 viste: 100% del listino (es. 100 Pi)
 * 
 * NOTA FONDAMENTALE: Nessun uso di parole promozionali ("sconto", "promo", "offerta").
 * Visualizzazione grafica: Prezzo di listino sbarrato e Prezzo reale attuale.
 */

export interface CountryPricingTier {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  externalWeeklyCost: number; // Costo medio settimanale sui portali esterni in valuta locale
  h2wBaseValueLocal: number; // Costo esterno * 0.50
  fullListPricePi: number; // Prezzo pieno ufficiale di listino in Pi (7 giorni)
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
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currencyCode: 'USD',
    currencySymbol: '$',
    externalWeeklyCost: 20,
    h2wBaseValueLocal: 10,
    fullListPricePi: 100,
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currencyCode: 'GBP',
    currencySymbol: '£',
    externalWeeklyCost: 16,
    h2wBaseValueLocal: 8,
    fullListPricePi: 105,
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    currencyCode: 'EUR',
    currencySymbol: '€',
    externalWeeklyCost: 20,
    h2wBaseValueLocal: 10,
    fullListPricePi: 100,
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Deutschland',
    currencyCode: 'EUR',
    currencySymbol: '€',
    externalWeeklyCost: 22,
    h2wBaseValueLocal: 11,
    fullListPricePi: 110,
  },
  ES: {
    countryCode: 'ES',
    countryName: 'España',
    currencyCode: 'EUR',
    currencySymbol: '€',
    externalWeeklyCost: 18,
    h2wBaseValueLocal: 9,
    fullListPricePi: 95,
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    externalWeeklyCost: 3000,
    h2wBaseValueLocal: 1500,
    fullListPricePi: 105,
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    currencyCode: 'INR',
    currencySymbol: '₹',
    externalWeeklyCost: 800,
    h2wBaseValueLocal: 400,
    fullListPricePi: 50,
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brasil',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    externalWeeklyCost: 60,
    h2wBaseValueLocal: 30,
    fullListPricePi: 60,
  },
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    currencyCode: 'CNY',
    currencySymbol: '¥',
    externalWeeklyCost: 140,
    h2wBaseValueLocal: 70,
    fullListPricePi: 100,
  },
  GLOBAL: {
    countryCode: 'GLOBAL',
    countryName: 'Internazionale',
    currencyCode: 'USD',
    currencySymbol: '$',
    externalWeeklyCost: 20,
    h2wBaseValueLocal: 10,
    fullListPricePi: 100,
  },
};

export interface WeeklyPricingResult {
  countryCode: string;
  countryName: string;
  currencySymbol: string;
  durationDays: 7;
  durationLabel: string;
  listPricePi: number; // Prezzo sbarrato
  currentPricePi: number; // Prezzo reale effettivo
  weeklyViews: number;
  trafficTierLabel: string;
  isTestnet: boolean;
}

/**
 * Calcola il prezzo settimanale (7 giorni) in base allo Stato e alle visualizzazioni registrate.
 */
export function getWeeklyAdvertisingPrice(
  countryCodeInput: string = 'IT',
  simulatedViews?: number
): WeeklyPricingResult {
  const code = (countryCodeInput || 'IT').toUpperCase();
  const tier = COUNTRY_PRICING_CATALOG[code] || COUNTRY_PRICING_CATALOG.GLOBAL;

  // Stima o rilevazione delle visualizzazioni settimanali dello Stato (default: traffico di lancio < 1000)
  const views = typeof simulatedViews === 'number' 
    ? simulatedViews 
    : 450; // Valore di lancio iniziale

  let coefficient = 0.20;
  let trafficTierLabel = 'Fase iniziale';

  if (views >= 50000) {
    coefficient = 1.00;
    trafficTierLabel = 'Alta affluenza';
  } else if (views >= 10000) {
    coefficient = 0.80;
    trafficTierLabel = 'Traffico consolidato';
  } else if (views >= 1000) {
    coefficient = 0.50;
    trafficTierLabel = 'Traffico in crescita';
  } else {
    coefficient = 0.20;
    trafficTierLabel = 'Traffico iniziale';
  }

  const currentPricePi = Math.round(tier.fullListPricePi * coefficient);

  return {
    countryCode: tier.countryCode,
    countryName: tier.countryName,
    currencySymbol: tier.currencySymbol,
    durationDays: 7,
    durationLabel: 'Settimanale (7 giorni)',
    listPricePi: tier.fullListPricePi,
    currentPricePi,
    weeklyViews: views,
    trafficTierLabel,
    isTestnet: true,
  };
}
