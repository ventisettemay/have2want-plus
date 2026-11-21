// Servizio di integrazione e ponte per Pi Network SDK 2.0 (Autenticazione e Pagamenti)
// Compatibile con Pi Browser nativo (window.Pi), endpoint backend Express (/api/pi/*) e preview web

declare global {
  interface Window {
    Pi?: {
      init: (options: { version: string; sandbox?: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (payment: any) => void
      ) => Promise<{
        accessToken: string;
        user: {
          uid: string;
          username: string;
        };
      }>;
      createPayment: (
        paymentData: {
          amount: number;
          memo: string;
          metadata?: Record<string, any>;
        },
        callbacks?: {
          onReadyForServerApproval?: (paymentId: string) => void;
          onReadyForServerCompletion?: (paymentId: string, txid: string) => void;
          onCancel?: (paymentId: string) => void;
          onError?: (error: Error, payment?: any) => void;
        }
      ) => Promise<any>;
    };
  }
}

export interface PiAuthState {
  isAuthenticated: boolean;
  isPiBrowser: boolean;
  username: string | null;
  uid: string | null;
  accessToken: string | null;
  error: string | null;
  loading: boolean;
}

// Configurazione Ufficiale Pi App Wallet
export const PI_APP_WALLET_ADDRESS = 'GC4QNJHVWYXOJ5ZO3SDCCAITO7IE6VM22CKPPGQJL737AOWUTVLJQE7X';
export const PI_SANDBOX_APP_URL = 'https://sandbox.minepi.com/app/have2want-plus-zc2j';

/**
 * Risolve dinamicamente la modalità sandbox senza blocco fisso a true:
 * - true se esplicitamente richiesto o se VITE_PI_SANDBOX="true" / ?sandbox=true / host sandbox.minepi.com
 * - false di default (Mainnet-ready in produzione)
 */
export function resolvePiSandboxMode(explicitSandbox?: boolean): boolean {
  if (typeof explicitSandbox === 'boolean') return explicitSandbox;

  try {
    const envVal = (import.meta as any)?.env?.VITE_PI_SANDBOX;
    if (envVal === 'true') return true;
    if (envVal === 'false') return false;
  } catch {
    // ignore outside Vite
  }

  if (typeof window !== 'undefined' && window.location) {
    const href = window.location.href || '';
    const host = window.location.hostname || '';
    if (host.includes('sandbox.minepi.com') || href.includes('sandbox=true')) {
      return true;
    }
  }

  return false;
}

// Inizializza Pi SDK in modo sicuro rispettando l'ambiente reale configurato
export function initPiSdk(sandbox: boolean = resolvePiSandboxMode()) {
  if (typeof window !== 'undefined' && window.Pi) {
    try {
      window.Pi.init({ version: '2.0', sandbox });
      return true;
    } catch (err) {
      console.warn('Pi.init info:', err);
      return false;
    }
  }
  return false;
}

// Verifica se stiamo girando all'interno del Pi Browser
export function checkIsPiBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isPiUa = /PiBrowser|PiNetwork/i.test(ua);
  return Boolean(window.Pi || isPiUa);
}

// Esegue l'autenticazione tramite Portale Pi
export async function authenticateWithPiPortal(sandboxOverride?: boolean): Promise<{
  success: boolean;
  user?: { uid: string; username: string };
  isSimulated?: boolean;
  sandbox?: boolean;
  error?: string;
}> {
  const isSandbox = resolvePiSandboxMode(sandboxOverride);
  try {
    initPiSdk(isSandbox);

    if (typeof window !== 'undefined' && window.Pi && typeof window.Pi.authenticate === 'function') {
      const authResult = await window.Pi.authenticate(
        ['username', 'payments'],
        (incompletePayment) => {
          console.log('Pagamento incompleto da completare:', incompletePayment);
          if (incompletePayment?.identifier && typeof fetch === 'function') {
            fetch('/api/pi/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId: incompletePayment.identifier }),
            }).catch(() => {});
          }
        }
      );

      return {
        success: true,
        user: authResult.user,
        isSimulated: false,
        sandbox: isSandbox,
      };
    } else {
      const storedPioneer = localStorage.getItem('have2want_pioneer_user');
      const pioneerUsername = storedPioneer || `@pioneer_${Math.floor(1000 + Math.random() * 9000)}`;
      if (!storedPioneer) {
        localStorage.setItem('have2want_pioneer_user', pioneerUsername);
      }

      return {
        success: true,
        user: {
          uid: 'pi_uid_' + Math.random().toString(36).substring(2, 10),
          username: pioneerUsername,
        },
        isSimulated: true,
        sandbox: isSandbox,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore durante la connessione al Portale Pi',
    };
  }
}

async function notifyServerApproval(paymentId: string): Promise<boolean> {
  if (typeof fetch !== 'function') return false;
  try {
    const response = await fetch('/api/pi/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    });
    return Boolean(response.ok);
  } catch {
    return false;
  }
}

async function notifyServerCompletion(paymentId: string, txid: string): Promise<boolean> {
  if (typeof fetch !== 'function') return false;
  try {
    const response = await fetch('/api/pi/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, txid }),
    });
    return Boolean(response.ok);
  } catch {
    return false;
  }
}

// Esegue un pagamento tramite funzione Pi SDK con approvazione/completamento su backend Express
export async function executePiSdkPayment(options: {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  sandbox?: boolean;
}): Promise<{
  success: boolean;
  txId?: string;
  isSimulated?: boolean;
  sandbox?: boolean;
  error?: string;
}> {
  const isSandbox = resolvePiSandboxMode(options.sandbox);
  try {
    initPiSdk(isSandbox);

    if (typeof window !== 'undefined' && window.Pi && typeof window.Pi.createPayment === 'function') {
      return new Promise((resolve) => {
        window.Pi!.createPayment(
          {
            amount: options.amount,
            memo: options.memo,
            metadata: options.metadata || {},
          },
          {
            onReadyForServerApproval: (paymentId: string) => {
              console.log('Pi Payment Pronto per Approvazione:', paymentId);
              void notifyServerApproval(paymentId);
            },
            onReadyForServerCompletion: (paymentId: string, txid: string) => {
              void notifyServerCompletion(paymentId, txid).then((confirmed) => {
                if (confirmed) {
                  resolve({
                    success: true,
                    txId: txid,
                    isSimulated: false,
                    sandbox: isSandbox,
                  });
                } else {
                  resolve({
                    success: false,
                    error: 'Il server non ha confermato il completamento del pagamento.',
                    sandbox: isSandbox,
                  });
                }
              });
            },
            onCancel: () => {
              resolve({
                success: false,
                error: "Pagamento Pi annullato dall'utente.",
              });
            },
            onError: (error: Error) => {
              resolve({
                success: false,
                error: error.message || 'Errore durante la transazione Pi SDK',
              });
            },
          }
        );
      });
    } else {
      // Senza Pi Browser non è possibile eseguire un pagamento reale: nessun fallback simulato
      return {
        success: false,
        isSimulated: false,
        sandbox: isSandbox,
        error: 'Pi Browser non disponibile: il pagamento reale non può essere completato.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Impossibile completare il pagamento Pi SDK',
    };
  }
}
