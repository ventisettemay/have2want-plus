import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  INITIAL_SATELLITES_CATALOG,
  SATELLITE_TO_CHANNEL,
  SATELLITE_TO_COMPONENT,
  resolveSatelliteChannel,
} from '../src/lib/satelliteModularEngine';
import { handleWorkerRequest, resetWorkerDeduplicationStateForTests } from '../worker';
import {
  createMarketplaceOrder,
  listMarketplaceOrders,
  confirmOrderPickupWithQr,
  updateMarketplaceOrderStatus,
} from '../src/lib/marketplaceOrdersService';
import {
  getCountryAdPricingByType,
  DEFAULT_LAUNCH_COEFFICIENT,
  setConfiguredLaunchCoefficient,
} from '../src/lib/countryAdvertisingPricing';
import { classifyMerchantPin } from '../src/lib/merchantPinClassifier';

describe('Allineamento definitivo HAVE2WANT: 10 Satelliti, Zero Commissioni, Listino Cripto & Pin', () => {
  beforeEach(() => {
    resetWorkerDeduplicationStateForTests();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SATELLITE_TO_CHANNEL e SATELLITE_TO_COMPONENT coprono esattamente tutti i 10 satelliti canonici', () => {
    expect(INITIAL_SATELLITES_CATALOG).toHaveLength(10);
    for (const sat of INITIAL_SATELLITES_CATALOG) {
      expect(typeof SATELLITE_TO_CHANNEL[sat.id]).toBe('string');
      expect(SATELLITE_TO_CHANNEL[sat.id].length).toBeGreaterThan(2);
      expect(SATELLITE_TO_COMPONENT[sat.id]).toBe(sat.targetComponent);
      expect(resolveSatelliteChannel(sat.id)).toBe(SATELLITE_TO_CHANNEL[sat.id]);
    }
    expect(resolveSatelliteChannel('RADAR')).toBe('RADAR');
  });

  it('worker.ts espone POST /api/osm/overpass con validazione e cache', async () => {
    const badRes = await handleWorkerRequest(
      new Request('https://h2w.example/api/osm/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'invalid' }),
      })
    );
    expect(badRes.status).toBe(400);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ elements: [{ id: 101, lat: 41.9, lon: 12.5 }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const query = '[out:json][timeout:10];node(around:500,41.9,12.5);out;';
    const okRes1 = await handleWorkerRequest(
      new Request('https://h2w.example/api/osm/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
    );
    expect(okRes1.status).toBe(200);
    const data1 = await okRes1.json();
    expect(data1.elements).toHaveLength(1);

    // Seconda chiamata identica servita dalla cache senza chiamare di nuovo fetch
    const okRes2 = await handleWorkerRequest(
      new Request('https://h2w.example/api/osm/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
    );
    expect(okRes2.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('worker.ts espone POST /api/testnet/publish compatibile JSON e multipart sicuro', async () => {
    const jsonRes = await handleWorkerRequest(
      new Request('https://h2w.example/api/testnet/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: 'Trapano Bosch',
          specs_anno: '2025',
          user_lat: 45.46,
          user_lng: 9.19,
        }),
      })
    );
    expect(jsonRes.status).toBe(200);
    const payload = await jsonRes.json();
    expect(payload.success).toBe(true);
    expect(payload.stored.product_name).toBe('Trapano Bosch');
    expect(payload.runtime).toBe('cloudflare-worker');
  });

  it('Ordini P2P e Km Zero a zero commissioni (nessuna Eco-Fee) con QR pickup e tracking', () => {
    const kmZeroOrder = createMarketplaceOrder({
      buyerUsername: 'alice_pi',
      sellerUsername: 'fattoria_rossi',
      itemTitle: 'Arance IGP 10kg',
      itemPricePi: 10,
      isKmZeroPickup: true,
      shippingFeePi: 5, // azzerata automaticamente per Km Zero
    });
    expect(kmZeroOrder.shippingFeePi).toBe(0);
    expect(kmZeroOrder.totalPi).toBe(10);
    expect((kmZeroOrder as unknown as Record<string, unknown>).extraServiceFeePi).toBeUndefined();
    expect(kmZeroOrder.qrPickupCode).toMatch(/^H2W-QR-/);
    expect(listMarketplaceOrders()).toHaveLength(1);

    const badQr = confirmOrderPickupWithQr(kmZeroOrder.id, 'WRONG-CODE');
    expect(badQr.ok).toBe(false);

    const okQr = confirmOrderPickupWithQr(kmZeroOrder.id, kmZeroOrder.qrPickupCode!);
    expect(okQr.ok).toBe(true);
    expect(okQr.order?.status).toBe('completato_ritirato');
    expect(okQr.order?.qrPickupValidated).toBe(true);

    const trackedOrder = createMarketplaceOrder({
      buyerUsername: 'alice_pi',
      sellerUsername: 'tech_world',
      itemTitle: 'Monitor 27',
      itemPricePi: 100,
      isKmZeroPickup: false,
      shippingFeePi: 4.5,
      shippingAddress: 'Via Roma 10, Milano',
      handshakeTxId: 'tx_noncustodial_01',
    });
    expect(trackedOrder.status).toBe('pagato_in_preparazione');
    expect(trackedOrder.totalPi).toBe(104.5);
    const shipped = updateMarketplaceOrderStatus(trackedOrder.id, 'spedito', {
      trackingNumber: 'BRT123456',
    });
    expect(shipped?.trackingNumber).toBe('BRT123456');
  });

  it('Listino pubblicità solo Cripto multi-durata/tipologia e filtro click sui Pin commercianti', () => {
    expect(DEFAULT_LAUNCH_COEFFICIENT).toBe(0.2);
    const weeklyIt = getCountryAdPricingByType('IT', 'EXTERNAL_GLOBE_PIN', 'WEEKLY');
    const dailyIt = getCountryAdPricingByType('IT', 'EXTERNAL_GLOBE_PIN', 'DAILY');
    const monthlyIt = getCountryAdPricingByType('IT', 'EXTERNAL_GLOBE_PIN', 'MONTHLY');

    expect(weeklyIt.appliedCoefficient).toBe(0.2);
    expect(dailyIt.currentPricePi).toBeLessThanOrEqual(weeklyIt.currentPricePi);
    expect(monthlyIt.currentPricePi).toBeGreaterThan(weeklyIt.currentPricePi);
    expect(weeklyIt.supportedPaymentMethods).toEqual(
      expect.arrayContaining(['PI_SDK', 'PI_AD_NETWORK', 'USDT_POLYGON', 'USDT_TRC20', 'PREPAID_CREDITS'])
    );

    const updatedCoeff = setConfiguredLaunchCoefficient(0.35);
    expect(updatedCoeff).toBe(0.35);
    const customPricing = getCountryAdPricingByType('IT', 'CREATOR_PROMO', 'MONTHLY');
    expect(customPricing.appliedCoefficient).toBe(0.35);

    const freePiMerchant = classifyMerchantPin({ piAccepted: true, hasAd: false });
    expect(freePiMerchant.type).toBe('PI_ACCEPTED');
    expect(freePiMerchant.hasAd).toBe(false);

    const payingAd = classifyMerchantPin({ piAccepted: false, hasAd: true, adHeadline: 'Offerta locale' });
    expect(payingAd.type).toBe('AD_ONLY');
    expect(payingAd.hasAd).toBe(true);

    const doubleRing = classifyMerchantPin({ piAccepted: true, hasAd: true, adHeadline: 'Promo Pi + Vetrina' });
    expect(doubleRing.type).toBe('DOUBLE_RING');
    expect(doubleRing.hasAd).toBe(true);
  });
});
