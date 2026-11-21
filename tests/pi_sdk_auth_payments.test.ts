import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initPiSdk,
  checkIsPiBrowser,
  authenticateWithPiPortal,
  executePiSdkPayment,
} from '../src/lib/piSdkService';

describe('Pi Network SDK 2.0 - Autenticazione Pioneer & Pagamenti Blockchain', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).Pi;
  });

  it('Dovrebbe riconoscere se l\'app gira all\'interno di Pi Browser', () => {
    // Caso 1: Browser generico
    expect(checkIsPiBrowser()).toBe(false);

    // Caso 2: Finestra con oggetto window.Pi presente
    (window as any).Pi = { init: vi.fn() };
    expect(checkIsPiBrowser()).toBe(true);
  });

  it('Dovrebbe inizializzare Pi SDK con versione 2.0 e sandbox', () => {
    const mockInit = vi.fn();
    (window as any).Pi = { init: mockInit };

    const res = initPiSdk(true);
    expect(res).toBe(true);
    expect(mockInit).toHaveBeenCalledWith({ version: '2.0', sandbox: true });
  });

  it('Dovrebbe eseguire l\'autenticazione ufficiale tramite Pi SDK in ambiente nativo', async () => {
    const mockAuthenticate = vi.fn().mockResolvedValue({
      accessToken: 'pi_access_token_123',
      user: {
        uid: 'pi_pioneer_uid_456',
        username: 'Pioneer_Marco',
      },
    });

    (window as any).Pi = {
      init: vi.fn(),
      authenticate: mockAuthenticate,
    };

    const result = await authenticateWithPiPortal();
    expect(result.success).toBe(true);
    expect(result.isSimulated).toBe(false);
    expect(result.user?.username).toBe('Pioneer_Marco');
    expect(result.user?.uid).toBe('pi_pioneer_uid_456');
    expect(mockAuthenticate).toHaveBeenCalled();
  });

  it('Dovrebbe fornire fallback sicuro di anteprima quando non è presente window.Pi', async () => {
    const result = await authenticateWithPiPortal();
    expect(result.success).toBe(true);
    expect(result.isSimulated).toBe(true);
    expect(result.user?.username).toMatch(/^@pioneer_/);
    expect(result.user?.uid).toMatch(/^pi_uid_/);
  });

  it('Dovrebbe gestire correttamente i pagamenti tramite Pi.createPayment', async () => {
    const mockCreatePayment = vi.fn().mockImplementation((paymentData, callbacks) => {
      expect(paymentData.amount).toBe(3.14);
      expect(paymentData.memo).toBe('Acquisto annuncio Have2Want');
      // Simula callback di completamento con txid blockchain
      callbacks.onReadyForServerCompletion('pay_id_789', 'txid_blockchain_abc');
    });

    (window as any).Pi = {
      init: vi.fn(),
      createPayment: mockCreatePayment,
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const paymentResult = await executePiSdkPayment({
      amount: 3.14,
      memo: 'Acquisto annuncio Have2Want',
      metadata: { listingId: 'item_101' },
    });

    expect(paymentResult.success).toBe(true);
    expect(paymentResult.txId).toBe('txid_blockchain_abc');
    expect(paymentResult.isSimulated).toBe(false);
    vi.unstubAllGlobals();
  });

  it('Dovrebbe gestire l\'annullamento del pagamento Pi da parte dell\'utente', async () => {
    const mockCreatePayment = vi.fn().mockImplementation((_, callbacks) => {
      callbacks.onCancel('pay_id_canceled');
    });

    (window as any).Pi = {
      init: vi.fn(),
      createPayment: mockCreatePayment,
    };

    const paymentResult = await executePiSdkPayment({
      amount: 1.0,
      memo: 'Test Annullamento',
    });

    expect(paymentResult.success).toBe(false);
    expect(paymentResult.error).toContain('annullato');
  });

  it('Dovrebbe gestire errori imprevisti della transazione Pi SDK', async () => {
    const mockCreatePayment = vi.fn().mockImplementation((_, callbacks) => {
      callbacks.onError(new Error('Fondi non sufficienti nel Pi Wallet'));
    });

    (window as any).Pi = {
      init: vi.fn(),
      createPayment: mockCreatePayment,
    };

    const paymentResult = await executePiSdkPayment({
      amount: 100.0,
      memo: 'Test Errore',
    });

    expect(paymentResult.success).toBe(false);
    expect(paymentResult.error).toContain('Fondi non sufficienti');
  });

  it('Dovrebbe rifiutare il pagamento quando window.Pi non è presente (nessuna simulazione)', async () => {
    delete (window as any).Pi;

    const result = await executePiSdkPayment({
      amount: 5.0,
      memo: 'Simulated Payment Test',
    });

    expect(result.success).toBe(false);
    expect(result.isSimulated).toBe(false);
    expect(result.error).toContain('Pi Browser');
  });

  it('Dovrebbe invocare onReadyForServerApproval durante il flusso di pagamento Pi', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const mockCreatePayment = vi.fn().mockImplementation((paymentData, callbacks) => {
      callbacks.onReadyForServerApproval('pay_approval_456');
      callbacks.onReadyForServerCompletion('pay_approval_456', 'tx_completed_999');
    });

    (window as any).Pi = {
      init: vi.fn(),
      createPayment: mockCreatePayment,
    };

    const res = await executePiSdkPayment({
      amount: 2.5,
      memo: 'Test Server Approval',
    });

    expect(res.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Pi Payment Pronto per Approvazione:', 'pay_approval_456');
    vi.unstubAllGlobals();
    consoleSpy.mockRestore();
  });

  it('Dovrebbe gestire errori di inizializzazione Pi SDK in modo controllato', () => {
    (window as any).Pi = {
      init: () => {
        throw new Error('Init error');
      },
    };
    const res = initPiSdk(true);
    expect(res).toBe(false);
  });

  it('Dovrebbe gestire il callback di pagamento incompleto e fallimento di autenticazione', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (window as any).Pi = {
      init: vi.fn(),
      authenticate: vi.fn().mockImplementation((scopes, onIncomplete) => {
        if (onIncomplete) onIncomplete({ identifier: 'incomplete_123' });
        return Promise.reject(new Error('Auth rejected'));
      }),
    };

    const res = await authenticateWithPiPortal();
    expect(res.success).toBe(false);
    expect(res.error).toContain('Auth rejected');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
