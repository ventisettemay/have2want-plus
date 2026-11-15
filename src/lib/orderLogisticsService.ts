// Servizio Logistica, Tracciamento e Ritiro QR Code Have2Want
// Permette la gestione sicura del passaggio di mano, ritiro km 0 con QR code e tracciamento spedizioni

import { Order } from '../types';

const STORAGE_ORDERS_KEY = 'h2w_orders_logistics';

// Genera un codice di tracciamento univoco
export function generateTrackingNumber(countryCode: string = 'IT'): string {
  const prefix = `H2W-${countryCode.toUpperCase()}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestampPart = Date.now().toString().slice(-4);
  return `${prefix}-${randomPart}${timestampPart}`;
}

// Genera payload QR per il ritiro diretto
export function generatePickupQrPayload(orderId: string, buyerUsername: string, itemTitle: string): string {
  return JSON.stringify({
    app: 'Have2Want',
    type: 'KM0_PICKUP_VERIFICATION',
    orderId,
    buyer: buyerUsername,
    item: itemTitle,
    timestamp: Date.now(),
    securityHash: Math.random().toString(36).substring(2, 10),
  });
}

// Recupera tutti gli ordini salvati
export function getSavedOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Errore lettura ordini:', e);
    return [];
  }
}

// Salva o aggiorna un ordine
export function saveOrder(order: Order): Order {
  const orders = getSavedOrders();
  const existingIndex = orders.findIndex((o) => o.id === order.id);

  const updatedOrder = {
    ...order,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    orders[existingIndex] = updatedOrder;
  } else {
    orders.unshift(updatedOrder);
  }

  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  return updatedOrder;
}

// Crea un nuovo ordine
export function createNewOrder(params: {
  buyerUsername: string;
  sellerUsername: string;
  itemTitle: string;
  itemPricePi: number;
  shippingFeePi: number;
  extraServiceFeePi?: number;
  isKmZeroPickup: boolean;
  shippingAddress?: string;
  handshakeTxId?: string;
}): Order {
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const extra = params.extraServiceFeePi || 0;
  const total = Number((params.itemPricePi + params.shippingFeePi + extra).toFixed(4));

  const tracking = params.isKmZeroPickup ? undefined : generateTrackingNumber('IT');
  const qrCode = params.isKmZeroPickup
    ? generatePickupQrPayload(orderId, params.buyerUsername, params.itemTitle)
    : undefined;

  const newOrder: Order = {
    id: orderId,
    buyerUsername: params.buyerUsername,
    sellerUsername: params.sellerUsername,
    itemTitle: params.itemTitle,
    itemPricePi: params.itemPricePi,
    shippingFeePi: params.shippingFeePi,
    extraServiceFeePi: extra,
    totalPi: total,
    isKmZeroPickup: params.isKmZeroPickup,
    shippingAddress: params.shippingAddress,
    trackingNumber: tracking,
    status: 'pagato_in_preparazione',
    qrPickupCode: qrCode,
    qrPickupValidated: false,
    handshakeTxId: params.handshakeTxId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveOrder(newOrder);
}

// Valida il ritiro tramite QR code
export function validateQrPickup(orderId: string): boolean {
  const orders = getSavedOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return false;

  order.status = 'completato_ritirato';
  order.qrPickupValidated = true;
  order.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  return true;
}

// Aggiorna lo stato di spedizione
export function updateOrderStatus(orderId: string, newStatus: Order['status']): boolean {
  const orders = getSavedOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return false;

  order.status = newStatus;
  order.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  return true;
}
