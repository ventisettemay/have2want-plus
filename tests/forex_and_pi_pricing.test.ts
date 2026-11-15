import { describe, it, expect, beforeEach } from 'vitest';
import { getCachedForexRates, convertCurrency } from '../src/lib/forexService';
import {
  getCachedPiMarketData,
  calculateRealPiEquivalent,
  PI_COMMUNITY_BASELINE_EUR,
  PI_COMMUNITY_BASELINE_USD,
} from '../src/lib/piRealPriceService';
import {
  getDefaultTerritoryCoordinates,
  setDefaultTerritoryCoordinates,
  calculateMunicipalityCentroid,
  applyGeoPrivacy,
} from '../src/lib/geoPrivacy';

describe('Forex Central Bank Exchange & Pi Multi-Tier Pricing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('dovrebbe caricare correttamente i tassi di cambio della Banca Centrale Europea (Forex)', () => {
    const data = getCachedForexRates();
    expect(data).toBeDefined();
    expect(data.base).toBe('EUR');
    expect(data.rates.USD).toBeGreaterThan(1.0);
    expect(data.rates.GBP).toBeLessThan(1.0);
    expect(data.rates.JPY).toBeGreaterThan(100);
  });

  it('dovrebbe convertire correttamente valute internazionali tra venditore e acquirente', () => {
    // 100 EUR in USD
    const res = convertCurrency(100, 'EUR', 'USD');
    expect(res.convertedAmount).toBeGreaterThan(100);
    expect(res.rateUsed).toBeGreaterThan(1.0);
    expect(res.source).toBeDefined();

    // 150 USD in EUR
    const resBack = convertCurrency(150, 'USD', 'EUR');
    expect(resBack.convertedAmount).toBeLessThan(150);
  });

  it('dovrebbe gestire la valutazione reale Pi Network basata su CoinMarketCap e CoinGecko', () => {
    const market = getCachedPiMarketData();
    expect(market.marketPrice.priceUsd).toBeCloseTo(0.0751, 3);
    expect(market.marketPrice.priceEur).toBeCloseTo(0.0674, 3);
    expect(market.externalMarketIOU.pair).toContain('PI / USDT');

    // Calcolo equivalente a tasso reale CoinMarketCap (10 EUR a ~0.0674 EUR/Pi = ~148 Pi)
    const cmcEq = calculateRealPiEquivalent(10, 'EUR');
    expect(cmcEq.piAmount).toBeGreaterThan(140);
    expect(cmcEq.piAmount).toBeLessThan(155);
    expect(cmcEq.modeLabel).toContain('CoinMarketCap');
  });

  it('dovrebbe risolvere le coordinate territoriali dinamiche senza vincoli forzati su una singola città', () => {
    const defaultCoords = getDefaultTerritoryCoordinates();
    expect(defaultCoords.lat).toBeDefined();
    expect(defaultCoords.lng).toBeDefined();

    // Impostazione di un territorio internazionale (es. Parigi)
    setDefaultTerritoryCoordinates(48.8566, 2.3522, 'Parigi (Francia)');
    const updated = getDefaultTerritoryCoordinates();
    expect(updated.lat).toBe(48.8566);
    expect(updated.lng).toBe(2.3522);

    // Calcolo centroide per città internazionale
    const centroid = calculateMunicipalityCentroid('Paris');
    expect(centroid.lat).toBeCloseTo(48.8566, 1);
    expect(centroid.lng).toBeCloseTo(2.3522, 1);
    expect(centroid.radiusKm).toBeGreaterThan(0);
  });

  it('dovrebbe applicare correttamente la modalità discreta con tutela della privacy geografica', () => {
    const listing = {
      id: 'item-international-1',
      title: 'Chitarra Acustica',
      city: 'Madrid',
      exact_lat: 40.4168,
      exact_lng: -3.7038,
      privacy_mode_active: true,
    };

    const displayCoords = applyGeoPrivacy(listing, true);
    expect(displayCoords.isMasked).toBe(true);
    expect(displayCoords.mode).toBe('DISCRETA');
    expect(displayCoords.radiusKm).toBeGreaterThan(0);
  });
});
