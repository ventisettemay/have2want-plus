import { describe, it, expect, vi } from 'vitest';
import {
  REWARDS_CONFIG,
  getPioneerRewardsState,
  savePioneerRewardsState,
} from '../src/lib/communityRewardsService';

describe('Ricompense Comunitarie Pi & Logica Geospaziale Annunci', () => {
  // Calcolo Geospaziale di Prossimità (Formula di Haversine)
  function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371.0; // Raggio terrestre in km
    const toRad = (deg: number) => (deg * Math.PI) / 180.0;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 10) / 10;
  }

  it('Dovrebbe rispettare i vincoli economici per la conversione in Pi Network', () => {
    // 1000 Punti = 1.0 π
    expect(REWARDS_CONFIG.POINTS_PER_PI).toBe(1000);

    // Minimo prelievo: 0.50 π (500 Punti)
    expect(REWARDS_CONFIG.MIN_WITHDRAWAL_PI).toBe(0.5);
    expect(REWARDS_CONFIG.MIN_WITHDRAWAL_POINTS).toBe(500);

    // Blockchain fee detratta
    expect(REWARDS_CONFIG.BLOCKCHAIN_TRANSACTION_FEE_PI).toBe(0.01);
  });

  it('Dovrebbe inizializzare e persistere lo stato del portafoglio punti del Pioneer', () => {
    const state = getPioneerRewardsState();
    expect(state).toBeDefined();
    expect(state.pointsBalance).toBeGreaterThanOrEqual(100);

    state.pointsBalance += 50;
    savePioneerRewardsState(state);

    const reloaded = getPioneerRewardsState();
    expect(reloaded.pointsBalance).toBe(state.pointsBalance);
  });

  it('Dovrebbe calcolare con accuratezza le distanze geospaziali chilometriche (Haversine)', () => {
    // Roma (41.9028° N, 12.4964° E) e Milano (45.4642° N, 9.1900° E) ~ 475-485 km
    const distRomaMilano = calculateHaversineDistance(41.9028, 12.4964, 45.4642, 9.19);
    expect(distRomaMilano).toBeGreaterThan(470);
    expect(distRomaMilano).toBeLessThan(490);

    // Stesso punto: distanza 0 km
    const distZero = calculateHaversineDistance(41.9028, 12.4964, 41.9028, 12.4964);
    expect(distZero).toBe(0);
  });

  it('Dovrebbe convertire correttamente Punti in Pi e viceversa', async () => {
    const { pointsToPi, piToPoints } = await import('../src/lib/communityRewardsService');
    expect(pointsToPi(1000)).toBe(1.0);
    expect(pointsToPi(500)).toBe(0.5);
    expect(piToPoints(1.0)).toBe(1000);
    expect(piToPoints(0.5)).toBe(500);
  });

  it('Dovrebbe assegnare punti per azioni comunitarie (awardPoints)', async () => {
    const { awardPoints, getPioneerRewardsState } = await import('../src/lib/communityRewardsService');
    const before = getPioneerRewardsState().pointsBalance;
    const res = awardPoints('REAL_LISTING_VERIFIED');

    expect(res.success).toBe(true);
    expect(res.pointsEarned).toBe(120);
    expect(res.newBalance).toBe(before + 120);
  });

  it('Dovrebbe calcolare la ripartizione del prelievo rispettando soglie e commissioni', async () => {
    const { calculateWithdrawalBreakdown } = await import('../src/lib/communityRewardsService');
    
    // Prelievo valido (1.0 π)
    const validBreakdown = calculateWithdrawalBreakdown(1.0);
    expect(validBreakdown.isValidAmount).toBe(true);
    expect(validBreakdown.feePi).toBe(0.01);
    expect(validBreakdown.netReceivedPi).toBe(0.99);
    expect(validBreakdown.requiredPoints).toBe(1000);

    // Prelievo non valido sotto soglia (0.2 π)
    const invalidBreakdown = calculateWithdrawalBreakdown(0.2);
    expect(invalidBreakdown.isValidAmount).toBe(false);
    expect(invalidBreakdown.netReceivedPi).toBe(0);
  });

  it('Dovrebbe gestire la procedura di prelievo Pi (executePiWithdrawal) con validazione completa', async () => {
    const { executePiWithdrawal, awardPoints } = await import('../src/lib/communityRewardsService');
    
    // Aggiunge abbastanza punti per superare la soglia di 0.50 π (500 punti)
    awardPoints('REAL_EXCHANGE_CONCLUDED');
    awardPoints('REAL_EXCHANGE_CONCLUDED');

    // 1. Errore importo sotto soglia minima
    const failMin = await executePiWithdrawal(0.2, 'pi_wallet_address_xyz');
    expect(failMin.success).toBe(false);
    expect(failMin.error).toContain('soglia minima');

    // 2. Errore wallet mancante
    const failWallet = await executePiWithdrawal(0.5, '');
    expect(failWallet.success).toBe(false);
    expect(failWallet.error).toContain('indirizzo Pi Wallet');

    // 3. Prelievo valido: il server conferma l'operazione
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        txHash: 'pi_live_tx_confirmed_123',
        netPiSent: 0.49,
        feeDeducted: 0.01,
        mode: 'live_pi_api',
      }),
    }));
    const success = await executePiWithdrawal(0.5, 'pi_wallet_address_valid_123', '@Pioneer_Tester');
    expect(success.success).toBe(true);
    expect(success.netPiSent).toBe(0.49); // 0.5 - 0.01 fee
    expect(success.txHash).toMatch(/^pi_live_tx_/);
    vi.unstubAllGlobals();

    // 4. Errore punti insufficienti dopo aver svuotato il saldo
    const failPoints = await executePiWithdrawal(50.0, 'pi_wallet_address_valid_123');
    expect(failPoints.success).toBe(false);
    expect(failPoints.error).toContain('Punti insufficienti');
  });

  it('Non deve dichiarare un prelievo riuscito senza conferma del server Pi', async () => {
    const { executePiWithdrawal, awardPoints, getPioneerRewardsState } = await import('../src/lib/communityRewardsService');
    awardPoints('REAL_EXCHANGE_CONCLUDED');
    const before = getPioneerRewardsState().pointsBalance;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'PI_API_KEY non configurata' }),
    }));

    const result = await executePiWithdrawal(0.5, 'pi_wallet_address_valid_123', '@Pioneer_Tester');
    vi.unstubAllGlobals();

    expect(result.success).toBe(false);
    expect(result.txHash).toBeUndefined();
    expect(getPioneerRewardsState().pointsBalance).toBe(before);
  });

  it('Dovrebbe scalare 2 o 4 punti con spendPoints e bloccare se saldo insufficiente', async () => {
    const { spendPoints, getPioneerRewardsState, savePioneerRewardsState } = await import('../src/lib/communityRewardsService');

    const st = getPioneerRewardsState();
    st.pointsBalance = 6;
    savePioneerRewardsState(st);

    const spendSimple = spendPoints(2, 'Pubblicazione annuncio semplice');
    expect(spendSimple.success).toBe(true);
    expect(spendSimple.pointsSpent).toBe(2);
    expect(spendSimple.newBalance).toBe(4);

    const spendVoice = spendPoints(4, 'Pubblicazione annuncio con voce AI');
    expect(spendVoice.success).toBe(true);
    expect(spendVoice.pointsSpent).toBe(4);
    expect(spendVoice.newBalance).toBe(0);

    const failInsufficient = spendPoints(2, 'Pubblicazione senza punti');
    expect(failInsufficient.success).toBe(false);
    expect(failInsufficient.pointsSpent).toBe(0);
    expect(failInsufficient.newBalance).toBe(0);
  });
});
