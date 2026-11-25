// Persistenza entità pubblicitarie su file JSON locale (fallback quando Firestore non è configurato).
// Stesso pattern di idempotencyStore e testnetFlatDb. Nessuna nuova dipendenza.

import fs from 'fs';
import path from 'path';
import type {
  AdCampaign,
  AdCampaignStatus,
  AdCreative,
  AdImpression,
  AdReward,
  AdLedgerEntry,
  AdLedgerAccount,
  DailyUserCaps,
  RateLimitEntry,
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
}

const EMPTY_STORE: AdsStore = {
  campaigns: {},
  creatives: {},
  impressions: {},
  rewards: {},
  ledger: {},
  dailyCaps: {},
  rateLimits: {},
};

let _cache: AdsStore | null = null;
let _dirty = false;

function loadStore(): AdsStore {
  if (_cache) return _cache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<AdsStore>;
      _cache = {
        campaigns: parsed.campaigns ?? {},
        creatives: parsed.creatives ?? {},
        impressions: parsed.impressions ?? {},
        rewards: parsed.rewards ?? {},
        ledger: parsed.ledger ?? {},
        dailyCaps: parsed.dailyCaps ?? {},
        rateLimits: parsed.rateLimits ?? {},
      };
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

// ========== Campagne ==========

export function getCampaign(id: string): AdCampaign | null {
  return loadStore().campaigns[id] ?? null;
}

export function listAllCampaigns(): AdCampaign[] {
  return Object.values(loadStore().campaigns);
}

export function listActiveCampaigns(now: number = Date.now()): AdCampaign[] {
  return Object.values(loadStore().campaigns).filter(
    (c) =>
      c.status === 'active' &&
      c.startDate <= now &&
      c.endDate >= now &&
      c.budgetRemaining > 0
  );
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

export function updateCampaignStatus(
  campaignId: string,
  status: AdCampaignStatus
): AdCampaign | null {
  const store = loadStore();
  const c = store.campaigns[campaignId];
  if (!c) return null;
  c.status = status;
  c.updatedAt = Date.now();
  markDirty();
  saveStore();
  return c;
}

export function updateCampaignBudget(
  campaignId: string,
  newRemaining: number
): void {
  const store = loadStore();
  const c = store.campaigns[campaignId];
  if (!c) return;
  c.budgetRemaining = newRemaining;
  c.updatedAt = Date.now();
  if (c.budgetRemaining <= 0) c.status = 'completed';
  markDirty();
  saveStore();
}

export function incrementCampaignStats(
  campaignId: string,
  { impressions = 0, certified = 0, spend = 0, rewards = 0 }: {
    impressions?: number;
    certified?: number;
    spend?: number;
    rewards?: number;
  }
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

export function approveCreative(creativeId: string): AdCreative | null {
  const store = loadStore();
  const cr = store.creatives[creativeId];
  if (!cr) return null;
  cr.status = 'approved';
  cr.updatedAt = Date.now();
  markDirty();
  saveStore();
  return cr;
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

export function findImpressionByNonce(nonce: string): AdImpression | null {
  return (
    Object.values(loadStore().impressions).find((imp) => imp.nonce === nonce) ?? null
  );
}

export function findImpressionBySessionToken(sessionToken: string): AdImpression | null {
  return (
    Object.values(loadStore().impressions).find(
      (imp) => imp.sessionToken === sessionToken
    ) ?? null
  );
}

export function saveImpression(impression: AdImpression): void {
  const store = loadStore();
  store.impressions[impression.id] = impression;
  markDirty();
  saveStore();
}

export function listImpressionsByCampaign(campaignId: string): AdImpression[] {
  return Object.values(loadStore().impressions).filter(
    (imp) => imp.campaignId === campaignId
  );
}

export function listImpressionsByUser(userId: string): AdImpression[] {
  return Object.values(loadStore().impressions).filter((imp) => imp.userId === userId);
}

export function listImpressionsByUserToday(
  userId: string,
  date: string
): AdImpression[] {
  const start = new Date(date).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return Object.values(loadStore().impressions).filter(
    (imp) =>
      imp.userId === userId &&
      imp.viewedAt >= start &&
      imp.viewedAt < end &&
      imp.status === 'certified'
  );
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

export function listRewardsByUser(userId: string): AdReward[] {
  return Object.values(loadStore().rewards).filter((r) => r.userId === userId);
}

export function listRewardsByCampaign(campaignId: string): AdReward[] {
  return Object.values(loadStore().rewards).filter((r) => r.campaignId === campaignId);
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

export function listLedgerByReference(referenceId: string): AdLedgerEntry[] {
  return Object.values(loadStore().ledger).filter((e) => e.referenceId === referenceId);
}

export function listLedgerByAccount(account: AdLedgerAccount): AdLedgerEntry[] {
  return Object.values(loadStore().ledger).filter((e) => e.account === account);
}

export function listLedgerByUser(userId: string): AdLedgerEntry[] {
  return Object.values(loadStore().ledger).filter(
    (e) => e.referenceId === userId
  );
}

export function sumLedgerByAccount(account: AdLedgerAccount): number {
  return Object.values(loadStore().ledger)
    .filter((e) => e.account === account)
    .reduce((acc, e) => acc + e.amount, 0);
}

// ========== Daily User Caps ==========

export function getDailyCaps(userId: string, date: string): DailyUserCaps | null {
  const key = `${userId}:${date}`;
  return loadStore().dailyCaps[key] ?? null;
}

export function saveDailyCaps(caps: DailyUserCaps): void {
  const store = loadStore();
  const key = `${caps.userId}:${caps.date}`;
  store.dailyCaps[key] = caps;
  markDirty();
  saveStore();
}

export function incrementDailyCaps(
  userId: string,
  date: string,
  { impressions = 0, points = 0 }: { impressions?: number; points?: number }
): DailyUserCaps {
  const key = `${userId}:${date}`;
  const store = loadStore();
  let caps = store.dailyCaps[key];
  if (!caps) {
    caps = {
      userId,
      date,
      impressionsCount: 0,
      pointsEarned: 0,
      maxImpressions: 10,
      maxPoints: 500,
    };
  }
  caps.impressionsCount += impressions;
  caps.pointsEarned += points;
  store.dailyCaps[key] = caps;
  markDirty();
  saveStore();
  return caps;
}

export function setDailyCapsLimits(
  userId: string,
  date: string,
  { maxImpressions, maxPoints }: { maxImpressions?: number; maxPoints?: number }
): DailyUserCaps {
  const key = `${userId}:${date}`;
  const store = loadStore();
  let caps = store.dailyCaps[key];
  if (!caps) {
    caps = {
      userId,
      date,
      impressionsCount: 0,
      pointsEarned: 0,
      maxImpressions: maxImpressions ?? 10,
      maxPoints: maxPoints ?? 500,
    };
  } else {
    if (maxImpressions !== undefined) caps.maxImpressions = maxImpressions;
    if (maxPoints !== undefined) caps.maxPoints = maxPoints;
  }
  store.dailyCaps[key] = caps;
  markDirty();
  saveStore();
  return caps;
}

// ========== Rate Limiting ==========

export function getRateLimit(key: string): RateLimitEntry | null {
  return loadStore().rateLimits[key] ?? null;
}

export function saveRateLimit(entry: RateLimitEntry): void {
  const store = loadStore();
  store.rateLimits[entry.key] = entry;
  markDirty();
  saveStore();
}

export function incrementRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const store = loadStore();
  const now = Date.now();
  let entry = store.rateLimits[key];
  if (!entry || now >= entry.windowStart + windowMs) {
    entry = { key, count: 1, windowStart: now };
  } else {
    entry.count += 1;
  }
  store.rateLimits[key] = entry;
  markDirty();
  saveStore();
  const resetAt = entry.windowStart + windowMs;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed: entry.count <= maxRequests, remaining, resetAt };
}

// ========== Utilità ==========

export function flushStore(): void {
  saveStore();
  _cache = null;
  _dirty = false;
}

/**
 * Resetta completamente lo store per i test (cache in-memory e file).
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
