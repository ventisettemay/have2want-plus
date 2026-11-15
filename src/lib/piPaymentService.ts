// Servizio per la gestione trasparente dei Pagamenti Pi Network
// Modello Fiscale Separato:
// 1. Prezzo pattuito per il bene/prodotto (nessuna commissione sul bene da parte della piattaforma)
// 2. Spese di spedizione separate (gratis oltre 150 Pi o ritiro km 0, standard 8 Pi)
// 3. Servizi opzionali software di piattaforma (Chat stretta di mano 0.25 Pi, video ispezione, abbonamenti commercianti)

import { initPiSdk } from './piSdkService';
import { Order } from '../types';

export interface PaymentItemRequest {
  orderId?: string;
  itemTitle: string;
  itemPricePi: number;
  shippingFeePi: number;
  extraServiceFeePi?: number;
  recipientUsername: string;
  memo?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  txid?: string;
  paymentId?: string;
  amountPaidPi: number;
  breakdown: {
    itemPricePi: number;
    shippingFeePi: number;
    extraServiceFeePi: number;
  };
  isSimulated: boolean;
  timestamp: string;
  error?: string;
}

// Calcola spedizione trasparente secondo le regole H2W
export function calculateH2WShipping(pricePi: number, isKmZeroPickup: boolean = false): number {
  if (isKmZeroPickup) return 0;
  if (pricePi >= 150) return 0; // Spedizione gratuita oltre 150 Pi
  return 8; // Spedizione fissa corriere espresso
}

// Crea ed esegue il pagamento Pi
export async function executePiPayment(request: PaymentItemRequest): Promise<PaymentResult> {
  const extraFee = request.extraServiceFeePi || 0;
  const totalPi = Number((request.itemPricePi + request.shippingFeePi + extraFee).toFixed(4));
  const memoText = request.memo || `Acquisto: ${request.itemTitle} (Merce: ${request.itemPricePi}π + Sped: ${request.shippingFeePi}π + Servizi: ${extraFee}π)`;

  try {
    initPiSdk(true);

    if (typeof window !== 'undefined' && window.Pi && typeof window.Pi.createPayment === 'function') {
      return new Promise<PaymentResult>((resolve) => {
        window.Pi!.createPayment(
          {
            amount: totalPi,
            memo: memoText,
            metadata: {
              type: 'H2W_MARKETPLACE_ORDER',
              orderId: request.orderId || `ORD-${Date.now()}`,
              recipient: request.recipientUsername,
              itemPrice: request.itemPricePi,
              shippingFee: request.shippingFeePi,
              serviceFee: extraFee,
              ...request.metadata,
            },
          },
          {
            onReadyForServerApproval: (paymentId: string) => {
              console.log('Pagamento pronto per approvazione:', paymentId);
            },
            onReadyForServerCompletion: (paymentId: string, txid: string) => {
              console.log('Pagamento completato su blockchain Pi:', txid);
              resolve({
                success: true,
                txid,
                paymentId,
                amountPaidPi: totalPi,
                breakdown: {
                  itemPricePi: request.itemPricePi,
                  shippingFeePi: request.shippingFeePi,
                  extraServiceFeePi: extraFee,
                },
                isSimulated: false,
                timestamp: new Date().toISOString(),
              });
            },
            onCancel: (paymentId: string) => {
              resolve({
                success: false,
                paymentId,
                amountPaidPi: 0,
                breakdown: {
                  itemPricePi: 0,
                  shippingFeePi: 0,
                  extraServiceFeePi: 0,
                },
                isSimulated: false,
                timestamp: new Date().toISOString(),
                error: 'Pagamento annullato dal Pioneer',
              });
            },
            onError: (error: Error) => {
              resolve({
                success: false,
                amountPaidPi: 0,
                breakdown: {
                  itemPricePi: 0,
                  shippingFeePi: 0,
                  extraServiceFeePi: 0,
                },
                isSimulated: false,
                timestamp: new Date().toISOString(),
                error: error.message || 'Errore durante la transazione Pi',
              });
            },
          }
        );
      });
    }

    // Modalità fallback / Sandbox web preview
    const simulatedTxId = `pi_tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const simulatedPaymentId = `pay_${Date.now()}`;

    // Registra nel log locale delle transazioni
    const history = JSON.parse(localStorage.getItem('h2w_pi_payment_history') || '[]');
    history.unshift({
      txid: simulatedTxId,
      paymentId: simulatedPaymentId,
      amountPaidPi: totalPi,
      recipient: request.recipientUsername,
      memo: memoText,
      itemPricePi: request.itemPricePi,
      shippingFeePi: request.shippingFeePi,
      extraServiceFeePi: extraFee,
      isSimulated: true,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('h2w_pi_payment_history', JSON.stringify(history.slice(0, 50)));

    return {
      success: true,
      txid: simulatedTxId,
      paymentId: simulatedPaymentId,
      amountPaidPi: totalPi,
      breakdown: {
        itemPricePi: request.itemPricePi,
        shippingFeePi: request.shippingFeePi,
        extraServiceFeePi: extraFee,
      },
      isSimulated: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      amountPaidPi: 0,
      breakdown: {
        itemPricePi: 0,
        shippingFeePi: 0,
        extraServiceFeePi: 0,
      },
      isSimulated: true,
      timestamp: new Date().toISOString(),
      error: err?.message || 'Errore imprevisto nel pagamento Pi',
    };
  }
}
