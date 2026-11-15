import { describe, it, expect } from 'vitest';
import {
  getPioneerRewardsState,
  savePioneerRewardsState,
  addMerchantPiCredit,
  spendMerchantPiBalance,
  adjustCommunityPoints,
} from '../src/lib/communityRewardsService';
import { processChatInteractionBilling } from '../src/lib/geoPrivacy';
import { resolvePiSandboxMode, initPiSdk } from '../src/lib/piSdkService';
import {
  latLngToMercatorTileFrac,
  equirectangularYToMercatorY,
  composeRainViewerGlobeCanvas,
} from '../src/lib/rainViewerGlobeLayer';
import { classifyMerchantPin } from '../src/lib/merchantPinClassifier';

describe('Sistema Unificato Saldi, Sandbox Pi, Radar RainViewer & Pin Esercenti', () => {
  it('Sincronizza in modo sincrono addebiti esercente (fix deductMerchantSubscription) e punti comunitari', async () => {
    const state = getPioneerRewardsState();
    state.pointsBalance = 300;
    state.merchantPiBalance = 0;
    savePioneerRewardsState(state);

    // Ricarica saldo esercente
    const updatedMerchant = addMerchantPiCredit(50);
    expect(updatedMerchant).toBe(50);

    // Addebito valido sincrono
    const ok = spendMerchantPiBalance(20, 'Test Abbonamento Giornaliero');
    expect(ok.success).toBe(true);
    expect(ok.newMerchantBalance).toBe(30);

    // Addebito eccessivo respinto in modo sincrono
    const fail = spendMerchantPiBalance(100, 'Test Abbonamento Mensile');
    expect(fail.success).toBe(false);
    expect(fail.newMerchantBalance).toBe(30);

    // Billing chat unificato (150 punti = 0.15 π)
    const chatRes = await processChatInteractionBilling('user_pioneer_001');
    expect(chatRes.success).toBe(true);
    expect(chatRes.pointsRemaining).toBe(150);

    // Ripristina punti tramite adjustCommunityPoints
    const adj = adjustCommunityPoints(50, 'Bonus test');
    expect(adj.success).toBe(true);
    expect(adj.newBalance).toBe(200);
  });

  it('Rimuove il blocco sandbox: true fisso e risolve sandbox dinamicamente', () => {
    // Di default senza flag espliciti deve essere false (Mainnet-ready)
    expect(resolvePiSandboxMode()).toBe(false);
    expect(resolvePiSandboxMode(true)).toBe(true);
    expect(resolvePiSandboxMode(false)).toBe(false);

    const capturedInitOpts: Array<{ version: string; sandbox?: boolean }> = [];
    (window as any).Pi = {
      init: (opts: { version: string; sandbox?: boolean }) => {
        capturedInitOpts.push(opts);
      },
    };
    const defaultInit = initPiSdk();
    expect(defaultInit).toBe(true);
    expect(capturedInitOpts[0]?.sandbox).toBe(false);

    const explicitSandboxInit = initPiSdk(true);
    expect(explicitSandboxInit).toBe(true);
    expect(capturedInitOpts[1]?.sandbox).toBe(true);
    delete (window as any).Pi;
  });

  it('Proietta correttamente coordinate lat/lng su griglia Web Mercator per RainViewer', async () => {
    // Equatore & Meridiano di Greenwich -> al centro della griglia zoom 2 (4x4 -> x=2, y=2)
    const center = latLngToMercatorTileFrac(0, 0, 2);
    expect(center.x).toBeCloseTo(2, 4);
    expect(center.y).toBeCloseTo(2, 4);

    // Equirettangolare metà altezza corrisponde a lat 0 -> mercY = 2
    const midY = equirectangularYToMercatorY(256, 512, 2);
    expect(midY).toBeCloseTo(2, 4);

    const fakeCanvas = document.createElement('canvas');
    fakeCanvas.width = 1024;
    fakeCanvas.height = 512;
    const composed = await composeRainViewerGlobeCanvas(fakeCanvas, {
      host: 'https://tilecache.rainviewer.com',
      pastFrames: [],
      nowcastFrames: [],
      satelliteFrames: [],
      source: 'RainViewer Test',
    });
    expect(composed.source).toBe('RainViewer Test');
    expect(composed.tilesLoaded).toBe(0);
  });

  it('Distingue nettamente i 3 stati Pin: PI_ACCEPTED, AD_ONLY, DOUBLE_RING', () => {
    const piOnly = classifyMerchantPin({ piAccepted: true, hasAd: false, promo: '' });
    expect(piOnly.type).toBe('PI_ACCEPTED');
    expect(piOnly.primaryColor).toBe('#8b5cf6');

    const adOnly = classifyMerchantPin({ piAccepted: false, hasAd: true, promo: 'Volantino offerta' });
    expect(adOnly.type).toBe('AD_ONLY');
    expect(adOnly.primaryColor).toBe('#ffd700');

    const doubleRing = classifyMerchantPin({ piAccepted: true, hasAd: true, promo: 'Sconto Pi' });
    expect(doubleRing.type).toBe('DOUBLE_RING');
    expect(doubleRing.outerRingColor).toBe('#ffd700');
    expect(doubleRing.innerRingColor).toBe('#8b5cf6');
  });
});
