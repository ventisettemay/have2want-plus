// Modello e logica per ordini creativi (Punto 9).
// Flusso: richiesta produzione banner/video → upload bozze/file → revisione → approvazione → cambio stato.
// Persistenza su file JSON locale (stesso pattern di adStore/idempotencyStore). Nessuna nuova dipendenza.

import fs from 'fs';
import path from 'path';
import type {
  AdCreative,
  AdCreativeStatus,
} from './adTypes';
import { getCreative, approveCreative } from './adStore';
import { validateFileUpload } from './adSecurity';

const STORE_PATH = path.resolve(process.cwd(), '.runtime-ads-orders.json');

export type CreativeOrderStatus =
  | 'requested'
  | 'in_production'
  | 'draft_submitted'
  | 'revision_requested'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type CreativeOrderType = 'banner' | 'video';

export type CreativeOrderPriority = 'low' | 'normal' | 'high';

export interface CreativeOrderFile {
  id: string;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: number;
  uploadedBy: string;
  isDraft: boolean;
}

export interface CreativeOrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'advertiser' | 'creator' | 'platform';
  content: string;
  fileId?: string;
  createdAt: number;
}

export interface CreativeOrder {
  id: string;
  advertiserId: string;
  advertiserUsername?: string;
  creatorId?: string;
  creatorUsername?: string;
  type: CreativeOrderType;
  title: string;
  description?: string;
  status: CreativeOrderStatus;
  priority: CreativeOrderPriority;
  budgetPi?: number;               // budget concordato per la produzione (in Pi)
  deadline?: number;               // epoch ms
  targetingCountryCode?: string;
  creativeId?: string;             // collegamento alla creatività pubblicitaria (se approvata)
  files: CreativeOrderFile[];
  messages: CreativeOrderMessage[];
  revisionNotes?: string;
  approvedAt?: number;
  rejectedReason?: string;
  createdAt: number;
  updatedAt: number;
  idempotencyKey?: string;
}

export interface CreateCreativeOrderInput {
  advertiserId: string;
  advertiserUsername?: string;
  creatorId?: string;
  creatorUsername?: string;
  type: CreativeOrderType;
  title: string;
  description?: string;
  priority?: CreativeOrderPriority;
  budgetPi?: number;
  deadline?: number;
  targetingCountryCode?: string;
  idempotencyKey?: string;
}

export interface SubmitDraftInput {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  message?: string;
}

export interface ReviewOrderInput {
  orderId: string;
  action: 'approve' | 'request_revision' | 'reject';
  notes?: string;
  reviewerId: string;
  reviewerRole: 'advertiser' | 'creator' | 'platform';
}

export interface ChangeOrderStatusInput {
  orderId: string;
  status: CreativeOrderStatus;
  changedBy: string;
  reason?: string;
}

interface OrdersStore {
  orders: Record<string, CreativeOrder>;
}

const EMPTY_STORE: OrdersStore = { orders: {} };

let _cache: OrdersStore | null = null;
let _dirty = false;

function loadStore(): OrdersStore {
  if (_cache) return _cache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<OrdersStore>;
      _cache = { orders: parsed.orders ?? {} };
    } else {
      _cache = { ...EMPTY_STORE };
    }
  } catch {
    _cache = { ...EMPTY_STORE };
  }
  return _cache;
}

function saveStore(): void {
  if (!_cache || !_dirty) return;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(_cache, null, 2), 'utf8');
    _dirty = false;
  } catch {
    // scrittura fallita: il cache resta in memoria
  }
}

function markDirty(): void {
  _dirty = true;
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowMs(): number {
  return Date.now();
}

// ========== Ordini creativi ==========

export function getOrder(id: string): CreativeOrder | null {
  return loadStore().orders[id] ?? null;
}

export function listAllOrders(): CreativeOrder[] {
  return Object.values(loadStore().orders);
}

export function listOrdersByAdvertiser(advertiserId: string): CreativeOrder[] {
  return Object.values(loadStore().orders).filter((o) => o.advertiserId === advertiserId);
}

export function listOrdersByCreator(creatorId: string): CreativeOrder[] {
  return Object.values(loadStore().orders).filter((o) => o.creatorId === creatorId);
}

export function findOrderByIdempotencyKey(idempotencyKey: string): CreativeOrder | null {
  return (
    Object.values(loadStore().orders).find((o) => o.idempotencyKey === idempotencyKey) ?? null
  );
}

export function saveOrder(order: CreativeOrder): void {
  const store = loadStore();
  store.orders[order.id] = order;
  markDirty();
  saveStore();
}

export function createOrder(input: CreateCreativeOrderInput): CreativeOrder {
  const idempotencyKey = input.idempotencyKey || genId();

  const existing = findOrderByIdempotencyKey(idempotencyKey);
  if (existing) {
    return existing;
  }

  const order: CreativeOrder = {
    id: genId(),
    advertiserId: input.advertiserId,
    advertiserUsername: input.advertiserUsername,
    creatorId: input.creatorId,
    creatorUsername: input.creatorUsername,
    type: input.type,
    title: input.title,
    description: input.description,
    status: 'requested',
    priority: input.priority ?? 'normal',
    budgetPi: input.budgetPi,
    deadline: input.deadline,
    targetingCountryCode: input.targetingCountryCode,
    files: [],
    messages: [],
    createdAt: nowMs(),
    updatedAt: nowMs(),
    idempotencyKey,
  };

  saveOrder(order);
  return order;
}

export function updateOrderStatus(
  orderId: string,
  status: CreativeOrderStatus,
  changedBy: string,
  reason?: string
): CreativeOrder | null {
  const store = loadStore();
  const order = store.orders[orderId];
  if (!order) return null;

  order.status = status;
  order.updatedAt = nowMs();
  if (reason) {
    addOrderMessage(orderId, changedBy, 'platform', `Stato cambiato: ${status}. ${reason || ''}`);
  }
  if (status === 'approved') order.approvedAt = nowMs();
  if (status === 'rejected') order.rejectedReason = reason;

  markDirty();
  saveStore();
  return order;
}

export function assignCreator(
  orderId: string,
  creatorId: string,
  creatorUsername?: string
): CreativeOrder | null {
  const store = loadStore();
  const order = store.orders[orderId];
  if (!order) return null;
  order.creatorId = creatorId;
  order.creatorUsername = creatorUsername;
  order.status = 'in_production';
  order.updatedAt = nowMs();
  markDirty();
  saveStore();
  return order;
}

export function submitDraft(
  orderId: string,
  input: SubmitDraftInput
): { order: CreativeOrder | null; file: CreativeOrderFile | null; error?: string } {
  const store = loadStore();
  const order = store.orders[orderId];
  if (!order) {
    return { order: null, file: null, error: 'Ordine non trovato' };
  }

  // Validazione file (estensione, MIME, dimensione) a livello di store
  const fileValidation = validateFileUpload({
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });
  if (!fileValidation.valid) {
    return { order: null, file: null, error: fileValidation.error };
  }

  const file: CreativeOrderFile = {
    id: genId(),
    fileKey: input.fileKey,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    uploadedAt: nowMs(),
    uploadedBy: input.uploadedBy,
    isDraft: true,
  };

  order.files.push(file);
  order.status = 'draft_submitted';
  order.updatedAt = nowMs();

  if (input.message) {
    addOrderMessage(orderId, input.uploadedBy, 'advertiser', input.message, file.id);
  }

  markDirty();
  saveStore();
  return { order, file };
}

export function addOrderMessage(
  orderId: string,
  senderId: string,
  senderRole: 'advertiser' | 'creator' | 'platform',
  content: string,
  fileId?: string
): CreativeOrderMessage | null {
  const store = loadStore();
  const order = store.orders[orderId];
  if (!order) return null;

  const message: CreativeOrderMessage = {
    id: genId(),
    orderId,
    senderId,
    senderRole,
    content,
    fileId,
    createdAt: nowMs(),
  };

  order.messages.push(message);
  order.updatedAt = nowMs();
  markDirty();
  saveStore();
  return message;
}

export function listOrderMessages(orderId: string): CreativeOrderMessage[] {
  const order = getOrder(orderId);
  if (!order) return [];
  return [...order.messages].sort((a, b) => a.createdAt - b.createdAt);
}

export function reviewOrder(
  orderId: string,
  input: ReviewOrderInput
): { order: CreativeOrder | null; error?: string } {
  const store = loadStore();
  const order = store.orders[orderId];
  if (!order) {
    return { order: null, error: 'Ordine non trovato' };
  }

  if (input.action === 'approve') {
    order.status = 'approved';
    order.approvedAt = nowMs();
    order.rejectedReason = undefined;
  } else if (input.action === 'request_revision') {
    order.status = 'revision_requested';
    order.revisionNotes = input.notes;
  } else if (input.action === 'reject') {
    order.status = 'rejected';
    order.rejectedReason = input.notes;
  }

  order.updatedAt = nowMs();

  addOrderMessage(
    orderId,
    input.reviewerId,
    input.reviewerRole,
    `Revisione: ${input.action}. ${input.notes || ''}`
  );

  markDirty();
  saveStore();
  return { order };
}

export function deleteOrder(id: string): boolean {
  const store = loadStore();
  if (!store.orders[id]) return false;
  delete store.orders[id];
  markDirty();
  saveStore();
  return true;
}

export function flushStore(): void {
  saveStore();
  _cache = null;
  _dirty = false;
}

/**
 * Resetta completamente lo store per i test.
 */
export function resetForTests(): void {
  _cache = null;
  _dirty = false;
  try {
    require('fs').unlinkSync(STORE_PATH);
  } catch {
    // file potrebbe non esistere
  }
}

/**
 * Collega un ordine creativo approvato a una creatività pubblicitaria esistente.
 * Richiede che la creatività sia già approvata.
 */
export function linkOrderToCreative(
  orderId: string,
  creativeId: string
): { order: CreativeOrder | null; creative: AdCreative | null; error?: string } {
  const order = getOrder(orderId);
  if (!order) {
    return { order: null, creative: null, error: 'Ordine non trovato' };
  }

  // la creatività deve essere già approvata
  const creative = getCreative(creativeId);
  if (!creative) {
    return { order, creative: null, error: 'Creatività non trovata' };
  }
  if (creative.status !== 'approved') {
    return { order, creative, error: 'La creatività non è ancora approvata' };
  }

  order.creativeId = creativeId;
  order.status = 'completed';
  order.updatedAt = nowMs();
  saveOrder(order);

  return { order, creative };
}
