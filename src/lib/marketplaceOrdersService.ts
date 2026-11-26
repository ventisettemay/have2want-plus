// ============================================================================
// HAVE2WANT - ORDINI MARKETPLACE INTERNO
// ============================================================================
// Persistenza locale degli ordini P2P interni. Nessuna simulazione di pagamento:
// un ordine resta "pending_payment" finché il server Pi non conferma la transazione.

export type MarketplaceOrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'pagato_in_preparazione' | 'spedito' | 'completato_ritirato';

export interface MarketplaceOrderInput {
  listingId?: string;
  listingTitle: string;
  itemTitle?: string; // alias compatibilità test pre-esistenti
  sellerName: string;
  sellerUsername: string;
  pricePi: number;
  itemPricePi?: number; // alias compatibilità test pre-esistenti
  buyerUsername: string;
  recipientUsername?: string;
  giftMessage?: string;
  isKmZeroPickup?: boolean;
  shippingFeePi?: number;
  shippingAddress?: string;
  handshakeTxId?: string;
}

export interface MarketplaceOrder extends MarketplaceOrderInput {
  id: string;
  status: MarketplaceOrderStatus;
  createdAt: string;
  updatedAt: string;
  txId?: string;
  paymentError?: string;
  shippingFeePi?: number;
  totalPi?: number;
  qrPickupCode?: string;
  qrPickupValidated?: boolean;
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
  const listingTitle = (input.listingTitle || input.itemTitle || '').trim();
  if (!listingTitle) {
    throw new Error('Annuncio non valido.');
  }
  const pricePi = Number.isFinite(input.pricePi ?? input.itemPricePi ?? 0)
    ? (input.pricePi ?? input.itemPricePi ?? 0)
    : 0;
  if (!pricePi || pricePi <= 0) {
    throw new Error('Prezzo in Pi non valido per questo annuncio.');
  }
  if (!input.buyerUsername) {
    throw new Error('Utente acquirente mancante.');
  }
  if (input.recipientUsername && input.recipientUsername === input.buyerUsername) {
    throw new Error('Il destinatario del regalo deve essere un altro Pioneer.');
  }

  // Km Zero: azzera le spese di spedizione per ritiro diretto
  const isKmZero = Boolean(input.isKmZeroPickup);
  const shippingFeePi = isKmZero ? 0 : (Number.isFinite(input.shippingFeePi) ? input.shippingFeePi : 0);
  const totalPi = pricePi + shippingFeePi;

  const now = new Date().toISOString();
  const qrPickupCode = `H2W-QR-${Date.now().toString(16).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const order: MarketplaceOrder = {
    ...input,
    listingId: input.listingId || `h2w_list_${Date.now()}`,
    listingTitle,
    sellerName: input.sellerName || 'Pioniere',
    sellerUsername: input.sellerUsername || '',
    pricePi,
    buyerUsername: input.buyerUsername,
    id: `h2w_ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: isKmZero || input.handshakeTxId ? 'pagato_in_preparazione' : 'pending_payment',
    createdAt: now,
    updatedAt: now,
    shippingFeePi,
    totalPi,
    qrPickupCode,
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

export function listMarketplaceOrders(buyerUsername?: string): MarketplaceOrder[] {
  return getMarketplaceOrders(buyerUsername);
}

export function confirmOrderPickupWithQr(orderId: string, qrCode: string): { ok: boolean; order?: MarketplaceOrder | null } {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return { ok: false };
  const stored = orders[index];
  if (!stored.qrPickupCode || stored.qrPickupCode !== qrCode) {
    return { ok: false };
  }
  const updated: MarketplaceOrder = {
    ...stored,
    status: 'completato_ritirato',
    qrPickupValidated: true,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  writeOrders(orders);
  return { ok: true, order: updated };
}

export function updateMarketplaceOrderStatus(orderId: string, status: MarketplaceOrderStatus, extra?: Record<string, unknown>): MarketplaceOrder | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;
  const updated: MarketplaceOrder = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
    ...(extra ? (extra as Partial<MarketplaceOrder>) : {}),
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
