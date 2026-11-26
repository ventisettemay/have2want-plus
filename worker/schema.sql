-- Schema D1 per Blocco 2 (Cloudflare Worker + D1 + R2 + AI)
-- Eseguire con: wrangler d1 execute have2want-ad --file=worker/schema.sql

-- Campagne pubblicitarie (attivate via webhook CAMPAIGN_PAID da Blocco 1)
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  advertiser_id TEXT NOT NULL,
  advertiser_username TEXT,
  title TEXT NOT NULL,
  description TEXT,
  budget_total REAL NOT NULL,
  budget_remaining REAL NOT NULL,
  cost_per_impression REAL NOT NULL DEFAULT 1,
  reward_percent_to_user REAL NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'draft',
  targeting TEXT, -- JSON: { countryCode?, city?, category[], minPioneerScore?, maxFrequencyPerUserPerDay?, merchantPinCategory? }
  pricing TEXT, -- JSON: { countryCode, listPricePi, currentPricePi, coefficient, trafficTierLabel, durationDays }
  creative_ids TEXT DEFAULT '[]', -- JSON array di creative id
  stats TEXT DEFAULT '{}', -- JSON: { impressions, certified_impressions, spend, rewards }
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  idempotency_key TEXT UNIQUE
);

-- Creatività pubblicitarie (banner / video)
CREATE TABLE IF NOT EXISTS creatives (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banner','video')),
  title TEXT,
  cta TEXT,
  logo_url TEXT,
  file_url TEXT,
  file_key TEXT,
  width INTEGER,
  height INTEGER,
  format TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Impressioni pubblicitarie certificate (anti-frode, idempotente)
CREATE TABLE IF NOT EXISTS impressions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  creative_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_token TEXT NOT NULL,
  nonce TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  amount REAL NOT NULL,
  reward_points INTEGER NOT NULL,
  promo_points INTEGER NOT NULL,
  monetary_value REAL NOT NULL,
  viewed_at INTEGER NOT NULL,
  certified_at INTEGER,
  ip_hash TEXT,
  user_agent_hash TEXT,
  visibility_duration_ms INTEGER,
  duplicate_of TEXT,
  anomaly_flags TEXT DEFAULT '[]',
  rate_limited INTEGER DEFAULT 0,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (creative_id) REFERENCES creatives(id)
);

-- Registry provider AI con contatori quota giornaliera e soglia 70%
CREATE TABLE IF NOT EXISTS provider_registry (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- 'image' | 'vision' | 'moderation'
  priority INTEGER NOT NULL,
  available INTEGER NOT NULL DEFAULT 1,
  daily_quota REAL NOT NULL,
  used_today REAL NOT NULL DEFAULT 0,
  reset_at INTEGER NOT NULL,
  last_check INTEGER,
  ok INTEGER DEFAULT 1,
  error TEXT
);

-- Abbonamenti vetrina esercente (3 livelli: base 0, vetrina 250/mese, inserzionista 50-300-1000 Pi)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  advertiser_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('base','vetrina','inserzionista')),
  price_pi REAL NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);

-- Ordini creativi (blocco creativo: banner/video, bozze, revisione, link)
CREATE TABLE IF NOT EXISTS creative_orders (
  id TEXT PRIMARY KEY,
  advertiser_id TEXT NOT NULL,
  advertiser_username TEXT,
  creator_id TEXT,
  creator_username TEXT,
  type TEXT NOT NULL CHECK (type IN ('banner','video')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  priority TEXT NOT NULL DEFAULT 'normal',
  budget_pi REAL,
  deadline INTEGER,
  targeting_country_code TEXT,
  creative_id TEXT,
  files TEXT DEFAULT '[]', -- JSON array
  messages TEXT DEFAULT '[]', -- JSON array
  revision_notes TEXT,
  approved_at INTEGER,
  rejected_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  idempotency_key TEXT UNIQUE
);

-- Messaggi ordini creativi (chat inserzionista/creatore)
CREATE TABLE IF NOT EXISTS order_messages (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('advertiser','creator','platform')),
  content TEXT NOT NULL,
  file_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES creative_orders(id)
);

-- Token azione monouso (Watch-to-Unlock): rilasciato dopo visione pubblicitaria certificata.
-- Valido per una specifica action_type, scadenza breve, consumo singolo.
CREATE TABLE IF NOT EXISTS action_unlock_tokens (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  impression_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  used_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (impression_id) REFERENCES impressions(id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_impressions_user ON impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_impressions_campaign ON impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_impressions_idempotency ON impressions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creatives_status ON creatives(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_advertiser ON subscriptions(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_orders_advertiser ON creative_orders(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator ON creative_orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_messages_order ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_action_tokens_token ON action_unlock_tokens(token);
CREATE INDEX IF NOT EXISTS idx_action_tokens_user ON action_unlock_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_action_tokens_used ON action_unlock_tokens(used);
