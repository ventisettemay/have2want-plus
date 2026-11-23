// ============================================================================
// HAVE2WANT - ORDINI MARKETPLACE INTERNO
// ============================================================================
// Persistenza locale degli ordini P2P interni. Nessuna simulazione di pagamento:
// un ordine resta "pending_payment" finché il server Pi non conferma la transazione.

import { calculateEcoFee } from './solidarityEconomy';

export type MarketplaceOrderStatus = 'pending_payment' | 'paid' | 'cancelled';

export interface MarketplaceOrderInput {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  sellerUsername: string;
  pricePi: number;
  buyerUsername: string;
  recipientUsername?: string;
  giftMessage?: string;
  ecoFeePi?: number;
  netToSellerPi?: number;
  qrPickupCode?: string;
}

export interface MarketplaceOrder extends MarketplaceOrderInput {
  id: string;
  status: MarketplaceOrderStatus;
  createdAt: string;
  updatedAt: string;
  txId?: string;
  paymentError?: string;
  qrPickupValidated?: boolean;
  pickupConfirmedAt?: string;
  pickupConfirmedBy?: string;
}

const STORAGE_KEY = 'h2w_marketplace_orders_v1';

function readOrders(): MarketplaceOrder[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[MarketplaceOrders] Impossibile leggere gli ordini:', err);
    return [];
  }
}

function writeOrders(orders: MarketplaceOrder[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('[MarketplaceOrders] Impossibile salvare gli ordini:', err);
  }
}

export function getMarketplaceOrders(buyerUsername?: string): MarketplaceOrder[] {
  const orders = readOrders();
  if (!buyerUsername) return orders;
  return orders.filter((order) => order.buyerUsername === buyerUsername);
}

export function getMarketplaceOrdersForUser(username: string): MarketplaceOrder[] {
  if (!username) return readOrders();
  return readOrders().filter(
    (order) => order.buyerUsername === username || order.sellerUsername === username
  );
}

export function getMarketplaceOrder(orderId: string): MarketplaceOrder | null {
  return readOrders().find((order) => order.id === orderId) || null;
}

export function createMarketplaceOrder(input: MarketplaceOrderInput): MarketplaceOrder {
  if (!input.listingId || !input.listingTitle.trim()) {
    throw new Error('Annuncio non valido.');
  }
  if (!Number.isFinite(input.pricePi) || input.pricePi <= 0) {
    throw new Error('Prezzo in Pi non valido per questo annuncio.');
  }
  if (!input.buyerUsername) {
    throw new Error('Utente acquirente mancante.');
  }
  if (input.recipientUsername && input.recipientUsername === input.buyerUsername) {
    throw new Error('Il destinatario del regalo deve essere un altro Pioneer.');
  }

  const now = new Date().toISOString();

  // Calcolo eco-fee sull'ordine (commissione ecologica su annunci VENDO in Pi)
  const ecoFeeCalc = calculateEcoFee(input.pricePi);

  const order: MarketplaceOrder = {
    ...input,
    listingTitle: input.listingTitle.trim(),
    sellerName: input.sellerName || 'Pioniere',
    sellerUsername: input.sellerUsername || '',
    id: `h2w_ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending_payment',
    ecoFeePi: ecoFeeCalc.ecoFeePi,
    netToSellerPi: ecoFeeCalc.netToSellerPi,
    createdAt: now,
    updatedAt: now,
  };

  writeOrders([order, ...readOrders()]);
  return order;
}

export function confirmMarketplaceOrderPayment(orderId: string, txId: string): MarketplaceOrder | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;

  const updated: MarketplaceOrder = {
    ...orders[index],
    status: 'paid',
    txId,
    paymentError: undefined,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  writeOrders(orders);
  return updated;
}

export function failMarketplaceOrderPayment(orderId: string, error: string): MarketplaceOrder | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;

  const updated: MarketplaceOrder = {
    ...orders[index],
    status: 'pending_payment',
    paymentError: error,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  writeOrders(orders);
  return updated;
}

export function cancelMarketplaceOrder(orderId: string): MarketplaceOrder | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;
  if (orders[index].status !== 'pending_payment') return orders[index];

  const updated: MarketplaceOrder = {
    ...orders[index],
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  writeOrders(orders);
  return updated;
}

export function confirmOrderPickupWithQr(orderId: string, qrCode: string): MarketplaceOrder | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;

  const order = orders[index];
  if (order.status !== 'paid') return null;
  if (!qrCode || qrCode.trim().length < 4) return null;

  const updated: MarketplaceOrder = {
    ...order,
    qrPickupCode: qrCode.trim(),
    qrPickupValidated: true,
    pickupConfirmedAt: new Date().toISOString(),
    pickupConfirmedBy: order.buyerUsername,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  writeOrders(orders);
  return updated;
}

export function updateMarketplaceOrderStatus(orderId: string, status: MarketplaceOrderStatus): MarketplaceOrder | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;

  const updated: MarketplaceOrder = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  writeOrders(orders);
  return updated;
}