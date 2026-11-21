import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchNearbyWebcams,
  getCachedWebcams,
  setCachedWebcams,
} from '../src/components/have2want/LiveWebcamModal';

describe('LiveWebcamModal — Catalogo Webcam Pubbliche', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('Restituisce array vuoto se la cache è assente', () => {
    const cached = getCachedWebcams();
    expect(cached).toEqual([]);
  });

  it('Salva e recupera webcam dalla cache locale', () => {
    const demo = [
      { id: 'wc_test', name: 'Test Cam', lat: 41.9, lng: 12.5, country: 'IT', countryCode: 'IT', imageUrl: 'https://example.com/img.jpg', type: 'traffic' as const, isLive: true },
    ];
    setCachedWebcams(demo);
    const cached = getCachedWebcams();
    expect(cached).toHaveLength(1);
    expect(cached[0].id).toBe('wc_test');
  });

  it('fetchNearbyWebcams filtra per raggio e restituisce solo webcam vicine', async () => {
    const near = await fetchNearbyWebcams(41.9, 12.5, 10); // Roma centro, raggio 10km
    expect(Array.isArray(near)).toBe(true);
    near.forEach((w) => {
      const dLat = (w.lat - 41.9) * 111;
      const dLng = (w.lng - 12.5) * 111 * Math.cos(41.9 * (Math.PI / 180));
      const dist = Math.hypot(dLat, dLng);
      expect(dist).toBeLessThanOrEqual(10 + 1); // margine per arrotondamento
    });
  });

  it('Ogni webcam ha campi obbligatori e tipo valido', async () => {
    const cams = await fetchNearbyWebcams(45.46, 9.19, 50); // Milano
    cams.forEach((w) => {
      expect(w.id).toBeDefined();
      expect(w.name).toBeDefined();
      expect(typeof w.lat).toBe('number');
      expect(typeof w.lng).toBe('number');
      expect(['traffic', 'tourist', 'commercial', 'weather', 'public']).toContain(w.type);
      expect(typeof w.isLive).toBe('boolean');
      expect(w.source).toBeDefined();
    });
  });
});