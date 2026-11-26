// Persistenza entità pubblicitarie su file JSON locale (fallback quando Firestore non è configurato).
// Stesso pattern di testnetFlatDb e idempotencyStore. Nessuna nuova dipendenza.

import fs from 'fs';
import path from 'path';
import type {
  AdCampaign,
  AdCampaignStatus,
  AdCreative,
  AdCreativeType,
  AdImpression,
  AdImpressionStatus,
  AdPricingSnapshot,
  AdReward,
  AdLedgerEntry,
  AdLedgerAccount,
  DailyUserCaps,
  RateLimitEntry,
  IdempotencyRecord,
  AdTargeting,
} from './adTypes';

const STORE_PATH = path.resolve(process.cwd(), '.runtime-ads.json');

interface AdsStore {
  campaigns: Record<string, AdCampaign>;
  creatives: Record<string, AdCreative>;
  impressions: Record<string, AdImpression>;
  rewards: Record<string, AdReward>;
  ledger: Record<string, AdLedgerEntry>;
  dailyCaps: Record<string, DailyUserCaps>;
  rateLimits: Record<string, RateLimitEntry>;
  idempotency: Record<string, IdempotencyRecord>;
}

const EMPTY_STORE: AdsStore = {
  campaigns: {},
  creatives: {},
  impressions: {},
  rewards: {},
  ledger: {},
  dailyCaps: {},
  rateLimits: {},
  idempotency: {},
};

let _cache: AdsStore | null = null;
let _dirty = false;

function loadStore(): AdsStore {
  if (_cache) return _cache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<AdsStore>;
      _cache = { ...EMPTY_STORE, ...parsed };
      for (const key of Object.keys(EMPTY_STORE) as (keyof AdsStore)[]) {
        if (!_cache[key]) _cache[key] = (EMPTY_STORE as any)[key];
      }
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
  const buf = new Uint8Array(4);
  try {
    require('crypto').getRandomValues(buf);
  } catch {
    // fallback
  }
  const hex = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${hex}`;
}

function nowMs(): number {
  return Date.now();
}

// ========== Campagne ==========

export function getCampaign(id: string): AdCampaign | null {
  return loadStore().campaigns[id] ?? null;
}

export function listCampaigns(): AdCampaign[] {
  return Object.values(loadStore().campaigns);
}

export function listCampaignsByAdvertiser(advertiserId: string): AdCampaign[] {
  return Object.values(loadStore().campaigns).filter((c) => c.advertiserId === advertiserId);
}

export function findCampaignByIdempotencyKey(idempotencyKey: string): AdCampaign | null {
  return (
    Object.values(loadStore().campaigns).find((c) => c.idempotencyKey === idempotencyKey) ?? null
  );
}

export function saveCampaign(campaign: AdCampaign): void {
  const store = loadStore();
  store.campaigns[campaign.id] = campaign;
  markDirty();
  saveStore();
}

export function createCampaign(input: {
  advertiserId: string;
  advertiserUsername?: string;
  title: string;
  description?: string;
  budgetTotal: number;
  costPerImpression: number;
  rewardPercentToUser: number;
  targeting: AdTargeting;
  pricing?: AdPricingSnapshot;
  idempotencyKey?: string;
}): AdCampaign {
  const idempotencyKey = input.idempotencyKey || genId();
  const existing = findCampaignByIdempotencyKey(idempotencyKey);
  if (existing) return existing;

  const now = nowMs();
  const campaign: AdCampaign = {
    id: genId(),
    advertiserId: input.advertiserId,
    advertiserUsername: input.advertiserUsername,
    title: input.title,
    description: input.description,
    budgetTotal: input.budgetTotal,
    budgetRemaining: input.budgetTotal,
    costPerImpression: input.costPerImpression,
    rewardPercentToUser: input.rewardPercentToUser,
    startDate: now,
    endDate: now + 7 * 24 * 60 * 60 * 1000,
    status: 'draft',
    targeting: input.targeting,
    pricing: input.pricing,
    creativeIds: [],
    stats: { impressions: 0, certifiedImpressions: 0, spend: 0, rewards: 0 },
    createdAt: now,
    updatedAt: now,
    idempotencyKey,
  };
  saveCampaign(campaign);
  return campaign;
}

export function toggleCampaign(id: string, status: AdCampaignStatus): AdCampaign | null {
  const store = loadStore();
  const c = store.campaigns[id];
  if (!c) return null;
  c.status = status;
  c.updatedAt = nowMs();
  markDirty();
  saveStore();
  return c;
}

export function updateCampaignStats(
  campaignId: string,
  { impressions, certified, spend, rewards }: { impressions: number; certified: number; spend: number; rewards: number }
): void {
  const store = loadStore();
  const c = store.campaigns[campaignId];
  if (!c) return;
  c.stats.impressions += impressions;
  c.stats.certifiedImpressions += certified;
  c.stats.spend += spend;
  c.stats.rewards += rewards;
  c.updatedAt = Date.now();
  markDirty();
  saveStore();
}

// ========== Creatività ==========

export function getCreative(id: string): AdCreative | null {
  return loadStore().creatives[id] ?? null;
}

export function listCreativesByCampaign(campaignId: string): AdCreative[] {
  return Object.values(loadStore().creatives).filter((cr) => cr.campaignId === campaignId);
}

export function getApprovedCreative(campaignId: string): AdCreative | null {
  const creatives = listCreativesByCampaign(campaignId);
  return (
    creatives.find((c) => c.status === 'approved') ||
    creatives.find((c) => c.status === 'pending') ||
    null
  );
}

export function saveCreative(creative: AdCreative): void {
  const store = loadStore();
  store.creatives[creative.id] = creative;
  markDirty();
  saveStore();
}

export function addCreative(input: {
  campaignId: string;
  type: AdCreativeType;
  title?: string;
  cta?: string;
  logoUrl?: string;
  fileUrl?: string;
  fileKey?: string;
  width?: number;
  height?: number;
  format?: string;
  durationSeconds?: number;
}): AdCreative {
  const now = nowMs();
  const creative: AdCreative = {
    id: genId(),
    campaignId: input.campaignId,
    type: input.type,
    title: input.title,
    cta: input.cta,
    logoUrl: input.logoUrl,
    fileUrl: input.fileUrl,
    fileKey: input.fileKey,
    width: input.width,
    height: input.height,
    format: input.format,
    durationSeconds: input.durationSeconds,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  saveCreative(creative);
  return creative;
}

export function reviewCreative(
  creativeId: string,
  action: 'approve' | 'reject',
  reason?: string
): AdCreative | null {
  const store = loadStore();
  const cr = store.creatives[creativeId];
  if (!cr) return null;
  cr.status = action === 'approve' ? 'approved' : 'rejected';
  cr.rejectionReason = reason;
  cr.updatedAt = nowMs();
  markDirty();
  saveStore();
  return cr;
}

export function approveCreative(creativeId: string): AdCreative | null {
  return reviewCreative(creativeId, 'approve');
}

// ========== Impressioni ==========

export function getImpression(id: string): AdImpression | null {
  return loadStore().impressions[id] ?? null;
}

export function findImpressionByIdempotencyKey(idempotencyKey: string): AdImpression | null {
  return (
    Object.values(loadStore().impressions).find(
      (imp) => imp.idempotencyKey === idempotencyKey
    ) ?? null
  );
}

export function saveImpression(impression: AdImpression): void {
  const store = loadStore();
  store.impressions[impression.id] = impression;
  markDirty();
  saveStore();
}

// ========== Reward ==========

export function getReward(id: string): AdReward | null {
  return loadStore().rewards[id] ?? null;
}

export function findRewardByIdempotencyKey(idempotencyKey: string): AdReward | null {
  return (
    Object.values(loadStore().rewards).find((r) => r.idempotencyKey === idempotencyKey) ?? null
  );
}

export function saveReward(reward: AdReward): void {
  const store = loadStore();
  store.rewards[reward.id] = reward;
  markDirty();
  saveStore();
}

// ========== Ledger ==========

export function getLedgerEntry(id: string): AdLedgerEntry | null {
  return loadStore().ledger[id] ?? null;
}

export function findLedgerByIdempotencyKey(idempotencyKey: string): AdLedgerEntry | null {
  return (
    Object.values(loadStore().ledger).find((e) => e.idempotencyKey === idempotencyKey) ?? null
  );
}

export function saveLedgerEntry(entry: AdLedgerEntry): void {
  const store = loadStore();
  store.ledger[entry.id] = entry;
  markDirty();
  saveStore();
}

// ========== Daily Caps ==========

export function getDailyCap(userId: string, date: string): DailyUserCaps | null {
  return loadStore().dailyCaps[`${userId}:${date}`] ?? null;
}

export function saveDailyCap(cap: DailyUserCaps): void {
  const store = loadStore();
  store.dailyCaps[`${cap.userId}:${cap.date}`] = cap;
  markDirty();
  saveStore();
}

// ========== Rate Limiting ==========

export function getRateLimitEntry(identifier: string): RateLimitEntry | null {
  return loadStore().rateLimits[identifier] ?? null;
}

export function saveRateLimitEntry(entry: RateLimitEntry): void {
  const store = loadStore();
  store.rateLimits[entry.identifier] = entry;
  markDirty();
  saveStore();
}

export function incrementRateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = nowMs();
  const entry = getRateLimitEntry(identifier);
  const windowStart = entry ? entry.windowStart : now;

  let count = 0;
  if (entry && now - windowStart < windowMs) {
    count = entry.count;
  } else {
    // nuova finestra
    const newEntry: RateLimitEntry = { identifier, count: 0, windowStart: now };
    saveRateLimitEntry(newEntry);
    count = 0;
  }

  count++;
  const remaining = Math.max(0, maxRequests - count);
  const allowed = count <= maxRequests;
  const resetAt = windowStart + windowMs;

  // aggiorna entry
  const existing = getRateLimitEntry(identifier);
  if (existing) {
    existing.count = count;
    existing.windowStart = windowStart;
    saveRateLimitEntry(existing);
  }

  return { allowed, remaining, resetAt };
}

// ========== Idempotency ==========

export function getIdempotencyRecord(key: string, scope: string): IdempotencyRecord | null {
  return loadStore().idempotency[`${scope}:${key}`] ?? null;
}

export function saveIdempotencyRecord(record: IdempotencyRecord): void {
  const store = loadStore();
  store.idempotency[`${record.scope}:${record.key}`] = record;
  markDirty();
  saveStore();
}

/** Resetta lo store per i test. */
export function resetAdsStoreForTests(): void {
  _cache = null;
  _dirty = false;
  try {
    fs.unlinkSync(STORE_PATH);
  } catch {
    // ignorato
  }
}
