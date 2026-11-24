// SERVIZIO ORDINI MARKETPLACE NON-CUSTODIAL – HAVE2WANT PLUS
// Modello prezzi 100% trasparente a zero commissioni percentuali:
// totale = prezzo articolo + spedizione (0 π se ritiro diretto Km 0), zero Eco-Fee.
// Persistenza locale + sincronizzazione cloud su Firestore.

import { Order } from '@/types';
import {
  saveMarketplaceOrderToCloud,
  updateMarketplaceOrderInCloud,
} from './firestoreService';

const STORAGE_ORDERS_KEY = 'h2w_marketplace_orders_v1';
const STORAGE_ORDER_WALLET_KEY = 'h2w_marketplace_noncustodial_wallet_v1';

export interface CreateMarketplaceOrderInput {
  buyerUsername: string;
  sellerUsername: string;
  itemTitle: string;
  itemPricePi: number;
  isKmZeroPickup: boolean;
  shippingFeePi?: number;
  shippingAddress?: string;
  handshakeTxId?: string;
}

export function listMarketplaceOrders(): Order[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrdersList(orders: Order[]) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders.slice(0, 120)));
  } catch {
    // ignore storage errors
  }
}

export function generateKmZeroPickupQrCode(orderId: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `H2W-QR-${orderId.slice(-5).toUpperCase()}-${randomSuffix}`;
}

export function createMarketplaceOrder(input: CreateMarketplaceOrderInput): Order {
  const itemPricePi = Math.max(0, Math.round((Number(input.itemPricePi) || 0) * 100) / 100);
  const shippingFeePi = input.isKmZeroPickup
    ? 0
    : Math.max(0, Math.round((Number(input.shippingFeePi) || 0) * 100) / 100);
  const totalPi = Math.round((itemPricePi + shippingFeePi) * 100) / 100;

  const now = new Date().toISOString();
  const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const qrPickupCode = input.isKmZeroPickup ? generateKmZeroPickupQrCode(id) : undefined;
  const hasTx = Boolean(input.handshakeTxId && input.handshakeTxId.trim().length > 0);

  const order: Order = {
    id,
    buyerUsername: input.buyerUsername,
    sellerUsername: input.sellerUsername,
    itemTitle: input.itemTitle,
    itemPricePi,
    shippingFeePi,
    totalPi,
    isKmZeroPickup: input.isKmZeroPickup,
    shippingAddress: input.shippingAddress?.trim() || (input.isKmZeroPickup ? 'Ritiro Diretto Km 0' : ''),
    status: hasTx ? 'pagato_in_preparazione' : 'in_attesa_pagamento',
    qrPickupCode,
    qrPickupValidated: false,
    handshakeTxId: input.handshakeTxId?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const existing = listMarketplaceOrders();
  saveOrdersList([order, ...existing]);
  void saveMarketplaceOrderToCloud(order).catch(() => {});
  return order;
}

export function updateMarketplaceOrderStatus(
  orderId: string,
  status: Order['status'],
  extra?: Partial<Pick<Order, 'trackingNumber' | 'qrPickupValidated' | 'handshakeTxId'>>
): Order | null {
  const orders = listMarketplaceOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updated: Order = {
    ...orders[idx],
    ...extra,
    status,
    updatedAt: now,
  };
  orders[idx] = updated;
  saveOrdersList(orders);
  void updateMarketplaceOrderInCloud(orderId, {
    ...extra,
    status,
    updatedAt: now,
  }).catch(() => {});
  return updated;
}

export function confirmOrderPickupWithQr(
  orderId: string,
  enteredCode: string
): { ok: boolean; order?: Order; error?: string } {
  const orders = listMarketplaceOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return { ok: false, error: 'Ordine non trovato' };

  const target = orders[idx];
  const expected = String(target.qrPickupCode || '').trim().toUpperCase();
  const received = String(enteredCode || '').trim().toUpperCase();

  if (!expected || expected !== received) {
    return { ok: false, error: 'Codice QR non valido o non corrispondente' };
  }

  const now = new Date().toISOString();
  const updated: Order = {
    ...target,
    qrPickupValidated: true,
    status: 'completato_ritirato',
    updatedAt: now,
  };
  orders[idx] = updated;
  saveOrdersList(orders);
  void updateMarketplaceOrderInCloud(orderId, {
    qrPickupValidated: true,
    status: 'completato_ritirato',
    updatedAt: now,
  }).catch(() => {});
  return { ok: true, order: updated };
}

export function getNonCustodialOrderWalletSummary(): { payoutWalletAddress: string } {
  try {
    if (typeof localStorage === 'undefined') return { payoutWalletAddress: '' };
    return { payoutWalletAddress: localStorage.getItem(STORAGE_ORDER_WALLET_KEY) || '' };
  } catch {
    return { payoutWalletAddress: '' };
  }
}

export function saveNonCustodialOrderWallet(address: string): { payoutWalletAddress: string } {
  const clean = String(address || '').trim();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_ORDER_WALLET_KEY, clean);
    }
  } catch {
    // ignore storage errors
  }
  return { payoutWalletAddress: clean };
}
