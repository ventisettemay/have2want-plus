// Persistenza entità pubblicitarie su file JSON locale (fallback quando Firestore non è configurato).
// Segue lo stesso pattern di local-file persistence usato da idempotencyStore e testnetFlatDb.
// Non aggiunge dipendenze: usa solo fs e path del Node standard.

import fs from 'fs';
import path from 'path';
import type {
  AdCampaign,
  AdCreative,
  AdImpression,
  AdReward,
  AdLedgerEntry,
} from './adTypes';

const STORE_PATH = path.resolve(process.cwd(), '.runtime-ads.json');

interface AdsStore {
  campaigns: Record<string, AdCampaign>;
  creatives: Record<string, AdCreative>;
  impressions: Record<string, AdImpression>;
  rewards: Record<string, AdReward>;
  ledger: Record<string, AdLedgerEntry>;
}

const EMPTY_STORE: AdsStore = {
  campaigns: {},
  creatives: {},
  impressions: {},
  rewards: {},
  ledger: {},
};

let _cache: AdsStore | null = null;
let _dirty = false;

function loadStore(): AdsStore {
  if (_cache) return _cache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as AdsStore;
      _cache = {
        campaigns: parsed.campaigns ?? {},
        creatives: parsed.creatives ?? {},
        impressions: parsed.impressions ?? {},
        rewards: parsed.rewards ?? {},
        ledger: parsed.ledger ?? {},
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
    // scrittura fallita: il cache resta in memoria, il prossimo salvataggio riproverà
  }
}

function markDirty(): void {
  _dirty = true;
}

// --- Campagne ---

export function getCampaign(id: string): AdCampaign | null {
  return loadStore().campaigns[id] ?? null;
}

export function listCampaigns(): AdCampaign[] {
  return Object.values(loadStore().campaigns);
}

export function listActiveCampaigns(now: number = Date.now()): AdCampaign[] {
  return Object.values(loadStore().campaigns).filter(
    (c) => c.status === 'active' && c.startDate <= now && c.endDate >= now && c.budgetRemaining > 0
  );
}

export function saveCampaign(campaign: AdCampaign): void {
  const store = loadStore();
  store.campaigns[campaign.id] = campaign;
  markDirty();
  saveStore();
}

export function updateCampaignBudget(campaignId: string, newRemaining: number): void {
  const store = loadStore();
  const c = store.campaigns[campaignId];
  if (!c) return;
  c.budgetRemaining = newRemaining;
  c.updatedAt = Date.now();
  if (c.budgetRemaining <= 0) c.status = 'completed';
  markDirty();
  saveStore();
}

// --- Creatività ---

export function getCreative(id: string): AdCreative | null {
  return loadStore().creatives[id] ?? null;
}

export function listCreativesByCampaign(campaignId: string): AdCreative[] {
  return Object.values(loadStore().creatives).filter((cr) => cr.campaignId === campaignId);
}

export function saveCreative(creative: AdCreative): void {
  const store = loadStore();
  store.creatives[creative.id] = creative;
  markDirty();
  saveStore();
}

// --- Impressioni ---

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

export function listImpressionsByCampaign(campaignId: string): AdImpression[] {
  return Object.values(loadStore().impressions).filter(
    (imp) => imp.campaignId === campaignId
  );
}

// --- Reward ---

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

// --- Ledger ---

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

export function flushStore(): void {
  saveStore();
  _cache = null;
  _dirty = false;
}
