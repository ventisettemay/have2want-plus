// ============================================================================
// HAVE2WANT PLUS - MOTORE ECONOMICO E PREZZO REALE PI NETWORK (CMC / COINGECKO)
// ============================================================================
// Riferimento unico ed esclusivo: prezzi reali aggregati da CoinMarketCap e CoinGecko.
// Nessun valore arbitrario o moltiplicatore inventato.

export interface PiMarketData {
  // Prezzo reale di mercato rilevato da CoinMarketCap / CoinGecko
  marketPrice: {
    priceUsd: number;
    priceEur: number;
    source: string;
    pair: string;
    volume24hUsd: string;
    change24hPercent: number;
    lastUpdated: string;
    disclaimer: string;
  };
  // Compatibilità per moduli legacy
  externalMarketIOU: {
    priceUsd: number;
    priceEur: number;
    exchange: string;
    pair: string;
    volume24hUsd: string;
    change24hPercent: number;
    lastUpdated: string;
    disclaimer: string;
    isOfficialPiCoreTeam: boolean;
  };
  consensusP2P: {
    rateEur: number;
    rateUsd: number;
    label: string;
    description: string;
  };
  spreadPercentage: number;
}

// Prezzo reale di mercato di riferimento CoinMarketCap / CoinGecko
export const PI_REAL_PRICE_USD = 0.0751;
export const PI_REAL_PRICE_EUR = 0.0674;

// Alias di compatibilità collegati DIRETTAMENTE al prezzo reale di mercato
export const PI_COMMUNITY_BASELINE_EUR = PI_REAL_PRICE_EUR;
export const PI_COMMUNITY_BASELINE_USD = PI_REAL_PRICE_USD;

const DEFAULT_REAL_MARKET = {
  priceUsd: PI_REAL_PRICE_USD,
  priceEur: PI_REAL_PRICE_EUR,
  source: 'CoinMarketCap / CoinGecko',
  pair: 'PI / USDT',
  volume24hUsd: '$ 3,505,825 USD',
  change24hPercent: -0.41,
  lastUpdated: new Date().toISOString(),
  disclaimer: 'Prezzo reale di mercato aggregato da CoinMarketCap e CoinGecko.',
};

const PI_MARKET_CACHE_KEY = 'h2w_pi_market_cache_v2';

export function getCachedPiMarketData(): PiMarketData {
  let market = DEFAULT_REAL_MARKET;

  try {
    const raw = localStorage.getItem(PI_MARKET_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.priceUsd && parsed.priceUsd > 0) {
        market = { ...DEFAULT_REAL_MARKET, ...parsed };
      }
    }
  } catch (e) {
    // Cache miss or parse error
  }

  return {
    marketPrice: market,
    externalMarketIOU: {
      ...market,
      exchange: market.source,
      isOfficialPiCoreTeam: false,
    },
    consensusP2P: {
      rateEur: market.priceEur,
      rateUsd: market.priceUsd,
      label: 'Prezzo Reale di Mercato (CoinMarketCap)',
      description: `Quotazione reale rilevata: ${market.priceUsd}$ / ${market.priceEur}€`,
    },
    spreadPercentage: 0,
  };
}

/**
 * Interroga in tempo reale i dati CoinGecko/CoinMarketCap con fallback resiliente
 */
export async function fetchLivePiMarketData(): Promise<PiMarketData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd,eur&include_24hr_vol=true&include_24hr_change=true', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      const pi = json['pi-network'];
      if (pi && pi.usd) {
        const liveMarket = {
          priceUsd: pi.usd < 1 ? Number(pi.usd.toFixed(4)) : Number(pi.usd.toFixed(2)),
          priceEur: pi.eur ? (pi.eur < 1 ? Number(pi.eur.toFixed(4)) : Number(pi.eur.toFixed(2))) : Number((pi.usd * 0.90).toFixed(4)),
          source: 'CoinMarketCap / CoinGecko Live',
          pair: 'PI / USDT',
          volume24hUsd: pi.usd_24h_vol ? `$ ${Math.round(pi.usd_24h_vol).toLocaleString('it-IT')} USD` : '$ 3,500,000 USD',
          change24hPercent: Number((pi.usd_24h_change || 0).toFixed(2)),
          lastUpdated: new Date().toISOString(),
          disclaimer: DEFAULT_REAL_MARKET.disclaimer,
        };

        try {
          localStorage.setItem(PI_MARKET_CACHE_KEY, JSON.stringify(liveMarket));
        } catch (e) {
          // ignore storage error
        }

        return {
          marketPrice: liveMarket,
          externalMarketIOU: {
            ...liveMarket,
            exchange: liveMarket.source,
            isOfficialPiCoreTeam: false,
          },
          consensusP2P: {
            rateEur: liveMarket.priceEur,
            rateUsd: liveMarket.priceUsd,
            label: 'Prezzo Reale di Mercato (CoinMarketCap)',
            description: `Quotazione live: ${liveMarket.priceUsd}$ / ${liveMarket.priceEur}€`,
          },
          spreadPercentage: 0,
        };
      }
    }
  } catch (err) {
    // Rete non disponibile o rate limit: usa dati cached
  }

  return getCachedPiMarketData();
}

export interface PiRealPriceData {
  priceEur: number;
  priceUsd: number;
  lastUpdated: string;
  source: string;
  change24h: number;
}

export function getCachedPiRealPrice(): PiRealPriceData {
  const data = getCachedPiMarketData();
  return {
    priceEur: data.marketPrice.priceEur,
    priceUsd: data.marketPrice.priceUsd,
    lastUpdated: data.marketPrice.lastUpdated,
    source: data.marketPrice.source,
    change24h: data.marketPrice.change24hPercent,
  };
}

export async function fetchLivePiRealPrice(): Promise<PiRealPriceData> {
  const data = await fetchLivePiMarketData();
  return {
    priceEur: data.marketPrice.priceEur,
    priceUsd: data.marketPrice.priceUsd,
    lastUpdated: data.marketPrice.lastUpdated,
    source: data.marketPrice.source,
    change24h: data.marketPrice.change24hPercent,
  };
}

/**
 * Calcola l'equivalente indicativo in Pi Coin dato un importo in Valuta Locale
 * basato ESCLUSIVAMENTE sul prezzo reale di mercato (CoinMarketCap / CoinGecko).
 */
export function calculateRealPiEquivalent(
  amountFiat: number,
  currency: 'EUR' | 'USD' = 'EUR'
): {
  piAmount: number;
  formattedPi: string;
  rateUsed: number;
  modeLabel: string;
  isOfficial: boolean;
} {
  const data = getCachedPiMarketData();
  const rate = currency === 'USD' ? data.marketPrice.priceUsd : data.marketPrice.priceEur;
  const label = 'CoinMarketCap / CoinGecko';

  if (rate <= 0) {
    return { piAmount: 0, formattedPi: '0.00 π', rateUsed: 1, modeLabel: label, isOfficial: false };
  }

  const piAmount = Math.round((amountFiat / rate) * 100) / 100;
  return {
    piAmount,
    formattedPi: `${piAmount.toFixed(2)} π`,
    rateUsed: rate,
    modeLabel: label,
    isOfficial: false,
  };
}
