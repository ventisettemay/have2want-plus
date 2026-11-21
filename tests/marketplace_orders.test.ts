import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMarketplaceOrder,
  confirmMarketplaceOrderPayment,
  failMarketplaceOrderPayment,
  cancelMarketplaceOrder,
  getMarketplaceOrders,
  getMarketplaceOrdersForUser,
  getMarketplaceOrder,
} from '../src/lib/marketplaceOrdersService';

describe('Marketplace interno HAVE2WANT - Ordini e Regali', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const baseInput = {
    listingId: 'listing_100',
    listingTitle: 'Bicletta da città',
    sellerName: 'Mario',
    sellerUsername: 'mario_p',
    pricePi: 12.5,
    buyerUsername: 'pioneer_test',
  };

  it('Crea un ordine in attesa di pagamento senza simulare il pagamento', () => {
    const order = createMarketplaceOrder(baseInput);

    expect(order.id).toMatch(/^h2w_ord_/);
    expect(order.status).toBe('pending_payment');
    expect(order.pricePi).toBe(12.5);
    expect(order.txId).toBeUndefined();

    const stored = getMarketplaceOrder(order.id);
    expect(stored?.status).toBe('pending_payment');
  });

  it('Conferma il pagamento solo dopo la tx del server Pi', () => {
    const order = createMarketplaceOrder(baseInput);
    const updated = confirmMarketplaceOrderPayment(order.id, 'pi_tx_real_123');

    expect(updated?.status).toBe('paid');
    expect(updated?.txId).toBe('pi_tx_real_123');
    expect(getMarketplaceOrder(order.id)?.status).toBe('paid');
  });

  it('Non segna pagato un ordine quando il pagamento non è confermato', () => {
    const order = createMarketplaceOrder(baseInput);
    const failed = failMarketplaceOrderPayment(order.id, 'Pi Browser non disponibile');

    expect(failed?.status).toBe('pending_payment');
    expect(failed?.paymentError).toContain('Pi Browser');
    expect(getMarketplaceOrder(order.id)?.txId).toBeUndefined();
  });

  it('Annulla solo gli ordini ancora in attesa', () => {
    const order = createMarketplaceOrder(baseInput);
    const cancelled = cancelMarketplaceOrder(order.id);
    expect(cancelled?.status).toBe('cancelled');

    const paid = createMarketplaceOrder({ ...baseInput, listingId: 'listing_200', pricePi: 5 });
    confirmMarketplaceOrderPayment(paid.id, 'pi_tx_paid');
    const cancelPaid = cancelMarketplaceOrder(paid.id);
    expect(cancelPaid?.status).toBe('paid');
  });

  it('Include ordini come acquirente e come venditore', () => {
    createMarketplaceOrder(baseInput);
    createMarketplaceOrder({
      ...baseInput,
      listingId: 'listing_300',
      sellerUsername: 'pioneer_test',
      buyerUsername: 'altro_pioniere',
    });

    const buyerOrders = getMarketplaceOrders('pioneer_test');
    expect(buyerOrders).toHaveLength(1);

    const userOrders = getMarketplaceOrdersForUser('pioneer_test');
    expect(userOrders).toHaveLength(2);
  });

  it('Registra un regalo con destinatario e messaggio', () => {
    const order = createMarketplaceOrder({
      ...baseInput,
      recipientUsername: 'destinatario_p',
      giftMessage: 'Buon compleanno!',
    });

    expect(order.recipientUsername).toBe('destinatario_p');
    expect(order.giftMessage).toBe('Buon compleanno!');
    expect(order.status).toBe('pending_payment');
  });

  it('Rifiuta prezzi non validi e regali verso se stessi', () => {
    expect(() => createMarketplaceOrder({ ...baseInput, pricePi: 0 })).toThrow(/Prezzo/);
    expect(() => createMarketplaceOrder({ ...baseInput, pricePi: -3 })).toThrow(/Prezzo/);
    expect(() =>
      createMarketplaceOrder({ ...baseInput, recipientUsername: 'pioneer_test' })
    ).toThrow(/altro Pioneer/);
  });
});