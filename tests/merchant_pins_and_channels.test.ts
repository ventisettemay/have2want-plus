import { describe, it, expect } from 'vitest';
import { classifyMerchantPin } from '../src/lib/merchantPinClassifier';
import { ACTIVE_CHAT_USERS } from '../src/data/chatUsers';
import { SPONSORED_BUSINESSES } from '../src/data/regions';

describe('HAVE2WANT PLUS - Merchant PIN Classification (3-Tier Grammar)', () => {
  it('correctly classifies a business with BOTH Pi and Ads as DOUBLE_RING', () => {
    const doubleRingBiz = {
      id: 'test-double-1',
      name: 'Boutique Oro & Pi',
      lat: 41.9,
      lng: 12.5,
      category: 'Oreficeria',
      promo: 'Accetta 100% Pi Coin',
      piAccepted: true,
      hasAd: true,
      isAd: true,
      adHeadline: 'Sconto 20% con Pi Coin',
    };

    const classification = classifyMerchantPin(doubleRingBiz);
    expect(classification.type).toBe('DOUBLE_RING');
    expect(classification.hasPi).toBe(true);
    expect(classification.hasAd).toBe(true);
    expect(classification.outerRingColor).toBe('#ffd700');
    expect(classification.innerRingColor).toBe('#8b5cf6');
    expect(classification.centerIcon).toBe('👑');
    expect(classification.badgeText).toContain('DOPPIO ANELLO');
  });

  it('correctly classifies a business with Pi ONLY as PI_ACCEPTED (Viola e oro lampeggiante)', () => {
    const piOnlyBiz = {
      id: 'test-pi-1',
      name: 'Farmacia Sanitaria',
      lat: 44.49,
      lng: 11.34,
      category: 'Sanità',
      promo: 'Presidi medici e sconti Pi',
      piAccepted: true,
      hasAd: false,
      isAd: false,
    };

    const classification = classifyMerchantPin(piOnlyBiz);
    expect(classification.type).toBe('PI_ACCEPTED');
    expect(classification.hasPi).toBe(true);
    expect(classification.hasAd).toBe(false);
    expect(classification.outerRingColor).toBe('#8b5cf6');
    expect(classification.innerRingColor).toBe('#ffd700');
    expect(classification.centerIcon).toBe('🪙');
    expect(classification.badgeText).toContain('ACCETTA PI');
  });

  it('correctly classifies a business with Ad ONLY as AD_ONLY (Oro puro)', () => {
    const adOnlyBiz = {
      id: 'test-ad-1',
      name: 'Grand Hotel Belle Arti',
      lat: 45.43,
      lng: 12.33,
      category: 'Ospitalità',
      promo: 'Soggiorni di lusso nel centro storico',
      piAccepted: false,
      hasAd: true,
      isAd: true,
      adHeadline: 'Suite vista laguna con colazione gourmet inclusa',
    };

    const classification = classifyMerchantPin(adOnlyBiz);
    expect(classification.type).toBe('AD_ONLY');
    expect(classification.hasPi).toBe(false);
    expect(classification.hasAd).toBe(true);
    expect(classification.outerRingColor).toBe('#ffd700');
    expect(classification.innerRingColor).toBe('#d97706');
    expect(classification.centerIcon).toBe('📢');
    expect(classification.badgeText).toContain('PUBBLICIZZATO');
  });

  it('all pre-seeded SPONSORED_BUSINESSES are validly classified', () => {
    expect(SPONSORED_BUSINESSES.length).toBeGreaterThanOrEqual(7);
    const types = new Set(SPONSORED_BUSINESSES.map(b => classifyMerchantPin(b).type));
    expect(types.has('DOUBLE_RING')).toBe(true);
    expect(types.has('PI_ACCEPTED')).toBe(true);
    expect(types.has('AD_ONLY')).toBe(true);
  });
});

describe('HAVE2WANT PLUS - Chat Pioneer Fleet & Privacy Centroids', () => {
  it('contains active users with both male (👨) and female (👩) genders', () => {
    expect(ACTIVE_CHAT_USERS.length).toBeGreaterThan(0);
    const men = ACTIVE_CHAT_USERS.filter(u => u.gender === 'man');
    const women = ACTIVE_CHAT_USERS.filter(u => u.gender === 'woman');

    expect(men.length).toBeGreaterThan(0);
    expect(women.length).toBeGreaterThan(0);

    for (const u of ACTIVE_CHAT_USERS) {
      expect(u.name).toBeTruthy();
      expect(typeof u.lat).toBe('number');
      expect(typeof u.lng).toBe('number');
      expect(u.lat).toBeGreaterThan(35);
      expect(u.lat).toBeLessThan(60);
      expect(u.privacyRadiusKm).toBeGreaterThanOrEqual(2.0);
    }
  });
});
