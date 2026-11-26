import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  GOOGLE_PUBLIC_STUN_SERVERS,
  OPENRELAY_PUBLIC_FALLBACK_SERVERS,
  resolveCreatorMediaSource,
  publishSyncMessage,
  subscribeSyncMessages,
} from '@/lib/freeServicesConfig';
import {
  getStaticFreeIceServers,
  getDynamicIceServers,
  clearTurnCache,
} from '@/lib/turnService';
import {
  CONFIRMED_SATELLITES,
  CONFIRMED_SATELLITE_TO_COMPONENT,
  getConfirmedSatelliteById,
} from '@/lib/confirmedSatellites';
import { resolveSatelliteChannel } from '@/lib/satelliteModularEngine';
import TextTailsBackdrop from '@/components/have2want/TextTailsBackdrop';
import VideoBannerAndPin from '@/components/have2want/VideoBannerAndPin';
import RadarProximityModal from '@/components/have2want/RadarProximityModal';
import PiChatUnifiedHub from '@/components/have2want/PiChatUnifiedHub';
import DefiancePulseHub from '@/components/have2want/DefiancePulseHub';
import ActionFlowHubModal from '@/components/have2want/ActionFlowHubModal';
import MerchantDetailModal from '@/components/have2want/MerchantDetailModal';
import { SalvavatuttoArchive } from '@/components/SalvavatuttoArchive';

describe('Zero-Cost Client Services & 11 Confirmed Satellites Suite', () => {
  beforeEach(() => {
    clearTurnCache();
    vi.restoreAllMocks();
  });

  it('configura correttamente STUN pubblici Google, media creator e BroadcastChannel', () => {
    expect(GOOGLE_PUBLIC_STUN_SERVERS.length).toBeGreaterThanOrEqual(2);
    expect(GOOGLE_PUBLIC_STUN_SERVERS[0].urls).toBe('stun:stun.l.google.com:19302');
    expect(OPENRELAY_PUBLIC_FALLBACK_SERVERS.length).toBeGreaterThanOrEqual(2);

    const archiveResolved = resolveCreatorMediaSource('https://archive.org/details/sample_clip');
    expect(archiveResolved).not.toBeNull();
    expect(archiveResolved?.kind).toBe('archive_embed');
    expect(archiveResolved?.url).toBe('https://archive.org/embed/sample_clip');

    const mp4Resolved = resolveCreatorMediaSource('https://example.org/demo/spot.mp4');
    expect(mp4Resolved?.kind).toBe('direct_video');
    expect(mp4Resolved?.isEmbed).toBe(false);

    expect(resolveCreatorMediaSource('javascript:alert(1)')).toBeNull();

    const fakeFile = new File(['hello'], 'clip.mp4', { type: 'video/mp4' });
    const createObjSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:https://have2want.local/mock-clip');
    const revokeObjSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const fileResolved = resolveCreatorMediaSource(fakeFile);
    expect(createObjSpy).toHaveBeenCalledWith(fakeFile);
    expect(fileResolved?.kind).toBe('object_url');
    expect(fileResolved?.url).toBe('blob:https://have2want.local/mock-clip');
    fileResolved?.revoke?.();
    expect(revokeObjSpy).toHaveBeenCalledWith('blob:https://have2want.local/mock-clip');

    const msg = publishSyncMessage('VIDEO_AD_TRIGGERED', { adId: 'ad_test_1' });
    expect(msg.type).toBe('VIDEO_AD_TRIGGERED');
    expect(msg.payload).toEqual({ adId: 'ad_test_1' });

    const unsub = subscribeSyncMessages(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('turnService fornisce ICE servers statici e fallback dinamico in assenza di rete', async () => {
    const staticIce = getStaticFreeIceServers();
    expect(staticIce.some((s) => s.urls === 'stun:stun.l.google.com:19302')).toBe(true);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    const dynamicFallback = await getDynamicIceServers(200);
    expect(dynamicFallback.length).toBeGreaterThanOrEqual(GOOGLE_PUBLIC_STUN_SERVERS.length);
    expect(dynamicFallback.some((s) => String(s.urls).includes('stun.l.google.com'))).toBe(true);
  });

  it('mappa tutti gli 11 satelliti confermati e instrada SOCCORSO_SAT e RADAR_SAT', () => {
    expect(CONFIRMED_SATELLITES).toHaveLength(11);

    const expectedIds = [
      'SOCCORSO_SAT',
      'MAP_SAT',
      'ACTIONFLOW_SAT',
      'DEFIANCE_PULSE_SAT',
      'RADAR_SAT',
      'METEO_SAT',
      'KM0_SAT',
      'PI_CHAT_SAT',
      'GLOBAL_MARKET_SAT',
      'EXTERNAL_MARKET_SAT',
      'BUSINESS_ADS_SAT',
    ] as const;

    for (const id of expectedIds) {
      expect(CONFIRMED_SATELLITE_TO_COMPONENT[id]).toBeTruthy();
      expect(getConfirmedSatelliteById(id)?.id).toBe(id);
    }

    expect(CONFIRMED_SATELLITE_TO_COMPONENT.PI_CHAT_SAT).toBe('PiChatUnifiedHub');
    expect(CONFIRMED_SATELLITE_TO_COMPONENT.RADAR_SAT).toBe('RadarProximityModal');
    expect(CONFIRMED_SATELLITE_TO_COMPONENT.SOCCORSO_SAT).toBe('WorldEmergencyModal');

    expect(resolveSatelliteChannel('SOCCORSO_SAT')).toBe('EMERGENCY');
    expect(resolveSatelliteChannel('RADAR_SAT')).toBe('RADAR');
    expect(resolveSatelliteChannel('RADAR')).toBe('RADAR');
  });

  it('renderizza correttamente TextTailsBackdrop con 6 code ondulate blu e oro', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextTailsBackdrop, { showLogo: true, label: 'HAVE2WANT PLUS' })
    );
    expect(html).toContain('#1e3a8a');
    expect(html).toContain('#d4af37');
    expect(html).toContain('HAVE2WANT PLUS');
    expect(html).toContain('tail-1');
    expect(html).toContain('tail-6');
  });

  it('renderizza VideoBannerAndPin in modalità PIN e BANNER', () => {
    const pinHtml = renderToStaticMarkup(
      React.createElement(VideoBannerAndPin, {
        mode: 'PIN',
        adId: 'pin_1',
        title: 'Bottega Artigiana Roma',
        subtitle: 'Spot 15s',
      })
    );
    expect(pinHtml).toContain('Bottega Artigiana Roma');
    expect(pinHtml).toContain('Spillo Video');

    const bannerHtml = renderToStaticMarkup(
      React.createElement(VideoBannerAndPin, {
        mode: 'BANNER',
        adId: 'banner_1',
        title: 'Promo Olio Km 0',
        videoUrl: 'https://example.org/promo.mp4',
      })
    );
    expect(bannerHtml).toContain('Promo Olio Km 0');
    expect(bannerHtml).toContain('<video');
    expect(bannerHtml).toContain('https://example.org/promo.mp4');
  });

  it('renderizza RadarProximityModal ordinando i risultati entro il raggio Haversine', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarProximityModal, {
        isOpen: true,
        onClose: () => {},
        centerLat: 41.9028,
        centerLng: 12.4964,
        territoryLabel: 'Roma Centro',
        listings: [
          { id: 'l1', title: 'Bici da Corsa', city: 'Roma', lat: 41.905, lng: 12.498 },
          { id: 'l2', title: 'Trattore Lontano', city: 'Milano', lat: 45.4642, lng: 9.19 },
        ],
        businesses: [
          { id: 'b1', name: 'Forno Piazza Navona', city: 'Roma', lat: 41.8992, lng: 12.4731 },
        ],
      })
    );
    expect(html).toContain('Radar Prossimità');
    expect(html).toContain('Bici da Corsa');
    expect(html).toContain('Forno Piazza Navona');
    expect(html).not.toContain('Trattore Lontano');
  });

  it('renderizza PiChatUnifiedHub, DefiancePulseHub, ActionFlowHubModal, MerchantDetailModal e SalvavatuttoArchive', () => {
    const chatHubHtml = renderToStaticMarkup(
      React.createElement(PiChatUnifiedHub, {
        isOpen: true,
        onClose: () => {},
        initialTab: 'CHAT',
        recipientName: 'Laboratorio Ceramiche',
      })
    );
    expect(chatHubHtml).toContain('Chat &amp; Vocali');
    expect(chatHubHtml).toContain('Videochiamata');
    expect(chatHubHtml).toContain('Laboratorio Ceramiche');

    const pulseHtml = renderToStaticMarkup(
      React.createElement(DefiancePulseHub, {
        isOpen: true,
        onClose: () => {},
        currentCountryCode: 'IT',
      })
    );
    expect(pulseHtml).toContain('Creator Studio');
    expect(pulseHtml).toContain('DEFIANCE PULSE HUB');

    const actionFlowHtml = renderToStaticMarkup(
      React.createElement(ActionFlowHubModal, {
        isOpen: true,
        onClose: () => {},
      })
    );
    expect(actionFlowHtml).toContain('ACTIONFLOW HUB');

    const merchantHtml = renderToStaticMarkup(
      React.createElement(MerchantDetailModal, {
        isOpen: true,
        onClose: () => {},
        businesses: [
          {
            id: 'biz_video_1',
            name: 'Panificio Antico',
            city: 'Bologna',
            lat: 44.4949,
            lng: 11.3426,
            piAccepted: true,
            hasAd: true,
            videoAdUrl: 'https://example.org/forno.mp4',
          },
        ],
        selectedBusiness: {
          id: 'biz_video_1',
          name: 'Panificio Antico',
          city: 'Bologna',
          lat: 44.4949,
          lng: 11.3426,
          piAccepted: true,
          hasAd: true,
          videoAdUrl: 'https://example.org/forno.mp4',
        },
        onSelectBusiness: () => {},
      })
    );
    expect(merchantHtml).toContain('Panificio Antico');
    expect(merchantHtml).toContain('https://example.org/forno.mp4');

    const archiveHtml = renderToStaticMarkup(
      React.createElement(SalvavatuttoArchive, {
        guides: [],
        onAddGuide: () => {},
        onRedirectToDefiancePulse: () => {},
      })
    );
    expect(archiveHtml).toContain('DEFIANCE PULSE');
  });
});
