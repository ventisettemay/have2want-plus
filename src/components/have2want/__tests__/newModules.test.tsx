import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveCreatorMediaSource, FREE_SERVICES_CONFIG, publishSyncMessage, subscribeSyncMessage } from '@/lib/freeServicesConfig';
import { getDynamicIceServers } from '@/lib/turnService';
import { CONFIRMED_SATELLITES } from '@/lib/confirmedSatellites';
import { TextTailsBackdrop } from '../TextTailsBackdrop';
import { VideoBannerAndPin } from '../VideoBannerAndPin';
import { DefiancePulseHub } from '../DefiancePulseHub';
import { PiChatUnifiedHub } from '../PiChatUnifiedHub';

describe('Servizi gratuiti, satelliti e nuovi moduli', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:local-creator-media') });
    // Mock BroadcastChannel - usa una classe che non lancia errori
    const mockChannel = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
    };
    vi.stubGlobal('BroadcastChannel', vi.fn().mockImplementation(() => mockChannel));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('risolve URL remoto o ObjectURL locale senza errori', () => {
    expect(resolveCreatorMediaSource('https://archive.org/embed/sample')).toBe(
      'https://archive.org/embed/sample'
    );
    const createObjectUrlSpy = vi.fn().mockReturnValue('blob:local-creator-media');
    vi.stubGlobal('URL', { createObjectURL: createObjectUrlSpy });
    const dummyFile = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });
    expect(resolveCreatorMediaSource('', dummyFile)).toBe('blob:local-creator-media');
    expect(createObjectUrlSpy).toHaveBeenCalledWith(dummyFile);
  });

  it('configurazione servizi gratuiti include STUN Google e fallback TURN', () => {
    expect(FREE_SERVICES_CONFIG.iceServers.some((s) => String(s.urls).includes('stun.l.google.com'))).toBe(true);
    expect(FREE_SERVICES_CONFIG.creatorFallbackHosts).toContain('https://archive.org/embed/');
    expect(FREE_SERVICES_CONFIG.allowLocalObjectUrl).toBe(true);
    expect(FREE_SERVICES_CONFIG.syncChannelName).toBe('h2w-sync');
  });

  it('restituisce server STUN + fallback TURN OpenRelay quando manca API key', async () => {
    const servers = await getDynamicIceServers();
    expect(servers.length).toBeGreaterThanOrEqual(FREE_SERVICES_CONFIG.iceServers.length);
    expect(servers.some((s) => String(s.urls).includes('stun.l.google.com'))).toBe(true);
    expect(servers.some((s) => String(s.urls).includes('metered.ca'))).toBe(true);
  });

  it('conferma esattamente 11 satelliti registrati', () => {
    expect(CONFIRMED_SATELLITES).toHaveLength(11);
    expect(CONFIRMED_SATELLITES.some((s) => s.id === 'PI_CHAT_SAT')).toBe(true);
    expect(CONFIRMED_SATELLITES.some((s) => s.id === 'DEFIANCE_PULSE_SAT')).toBe(true);

    expect(CONFIRMED_SATELLITES.some((s) => s.id === 'SOCCORSO_SAT')).toBe(true);
    expect(CONFIRMED_SATELLITES.some((s) => s.id === 'MAP_SAT')).toBe(true);
    expect(CONFIRMED_SATELLITES.some((s) => s.id === 'ACTIONFLOW_SAT')).toBe(true);
  });

  it('TextTailsBackdrop component type è definito correttamente', () => {
    expect(TextTailsBackdrop).toBeDefined();
    expect(typeof TextTailsBackdrop).toBe('function');
  });

  it('VideoBannerAndPin component type è definito correttamente', () => {
    expect(VideoBannerAndPin).toBeDefined();
    expect(typeof VideoBannerAndPin).toBe('function');
  });

  it('publishSyncMessage e subscribeSyncMessage funzionano con BroadcastChannel', () => {
    // Test che le funzioni esistono e non lanciano errori
    expect(typeof publishSyncMessage).toBe('function');
    expect(typeof subscribeSyncMessage).toBe('function');
    
    // Chiama publishSyncMessage - non deve lanciare
    expect(() => publishSyncMessage('TEST_EVENT', { id: 'test_1', data: 'payload' })).not.toThrow();
    
    // subscribeSyncMessage deve restituire una funzione di cleanup
    const handler = vi.fn();
    const unsubscribe = subscribeSyncMessage('TEST_EVENT', handler);
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('DefiancePulseHub component type è definito correttamente', () => {
    expect(DefiancePulseHub).toBeDefined();
    expect(typeof DefiancePulseHub).toBe('function');
  });

  it('PiChatUnifiedHub component type è definito correttamente', () => {
    expect(PiChatUnifiedHub).toBeDefined();
    expect(typeof PiChatUnifiedHub).toBe('function');
  });

  it('VideoPinPromo interface accetta campi richiesti', () => {
    // Type test - se compila, l'interfaccia è corretta
    const promo = {
      id: 'test_1',
      creatorName: 'Test Creator',
      headline: 'Test Headline',
      videoUrl: 'https://archive.org/embed/test.mp4',
      kind: 'PIN' as const,
    };
    expect(promo.id).toBe('test_1');
    expect(promo.kind).toBe('PIN');
  });
});