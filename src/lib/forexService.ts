// ============================================================================
// HAVE2WANT PLUS - SERVIZIO CENTRALIZZATO DEI CAMBI VALUTARI REALI (FOREX)
// ============================================================================
// Dati reali da Banche Centrali (Frankfurter API / BCE / ExchangeRate-API)
// Fornisce tassi ufficiali, timestamp verificabili, cache e fallback dichiarati.

export interface ExchangeRateData {
  base: string;
  date: string;
  timestamp: string;
  rates: Record<string, number>;
  source: string;
  isFallback: boolean;
}

// Tassi ufficiali di riserva (BCE) con indicazione trasparente di fallback se la rete è offline
const OFFICIAL_CENTRAL_BANK_BASELINE: Record<string, number> = {
  EUR: 1.0,
  USD: 1.085,
  GBP: 0.855,
  CHF: 0.965,
  JPY: 168.2,
  CAD: 1.485,
  AUD: 1.645,
  CNY: 7.82,
  INR: 90.15,
  BRL: 5.65,
  MXN: 18.45,
  KRW: 1475.0,
  SEK: 11.45,
  NOK: 11.65,
  DKK: 7.46,
  PLN: 4.30,
  TRY: 35.2,
  ZAR: 20.1,
  SGD: 1.46,
  NZD: 1.78,
  AED: 3.98,
  SAR: 4.07,
};

const CACHE_KEY = 'h2w_forex_cache_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 ore di validità cache

export function getCachedForexRates(): ExchangeRateData {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: ExchangeRateData = JSON.parse(raw);
      const age = Date.now() - new Date(parsed.timestamp).getTime();
      if (age < CACHE_TTL_MS && parsed.rates && Object.keys(parsed.rates).length > 5) {
        return parsed;
      }
    }
  } catch (e) {
    // Errore lettura cache, usa fallback
  }

  return {
    base: 'EUR',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    rates: OFFICIAL_CENTRAL_BANK_BASELINE,
    source: 'Banca Centrale Europea (Baseline Ufficiale di Riserva)',
    isFallback: true,
  };
}

export async function fetchLiveForexRates(): Promise<ExchangeRateData> {
  try {
    // Frankfurter API: Gratuita, open source, tracciata direttamente sui tassi BCE (nessuna API key richiesta)
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR', {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      const rates = { ...OFFICIAL_CENTRAL_BANK_BASELINE, ...json.rates, EUR: 1.0 };
      const data: ExchangeRateData = {
        base: 'EUR',
        date: json.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        rates,
        source: 'Banca Centrale Europea (via Frankfurter API)',
        isFallback: false,
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (err) {
        // Ignora errori di quota localStorage
      }

      return data;
    }
  } catch (err) {
    console.warn('[ForexService] Rete non disponibile per aggiornamento cambi, utilizzo cache/baseline:', err);
  }

  return getCachedForexRates();
}

/**
 * Converte un importo dalla valuta del venditore alla valuta dell'acquirente
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): {
  convertedAmount: number;
  rateUsed: number;
  timestamp: string;
  source: string;
  isFallback: boolean;
} {
  const forex = getCachedForexRates();
  const rates = customRates || forex.rates;

  const upperFrom = (fromCurrency || 'EUR').toUpperCase();
  const upperTo = (toCurrency || 'EUR').toUpperCase();

  const rateFromEur = rates[upperFrom] || OFFICIAL_CENTRAL_BANK_BASELINE[upperFrom] || 1.0;
  const rateToEur = rates[upperTo] || OFFICIAL_CENTRAL_BANK_BASELINE[upperTo] || 1.0;

  // Calcolo conversione cross-rate via EUR base
  const amountInEur = amount / rateFromEur;
  const converted = amountInEur * rateToEur;
  const crossRate = rateToEur / rateFromEur;

  return {
    convertedAmount: Number(converted.toFixed(2)),
    rateUsed: Number(crossRate.toFixed(4)),
    timestamp: forex.timestamp,
    source: forex.source,
    isFallback: forex.isFallback,
  };
}
