// Tipi locali per i binding Cloudflare (evita dipendenza da @cloudflare/workers-types)

export interface D1Database {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<D1Result[]>;
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(opts?: { column?: string }): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<D1Result>;
}

export interface D1Result {
  success: boolean;
  meta?: { changes: number; last_row_id: number };
  results?: unknown[];
}

export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: R2PutValue, opts?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(opts?: R2ListOptions): Promise<R2List>;
}

export interface R2Object {
  key: string;
  size: number;
  httpMetadata?: { contentType?: string };
  writeHttpMetadata: (opts: { contentType?: string }) => void;
  body: any;
}

export type R2PutValue = string | ArrayBuffer | ReadableStream | Blob;

export interface R2PutOptions {
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}

export interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface R2List {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface AI {
  run(model: string, input: unknown, opts?: { headers?: Record<string, string> }): Promise<unknown>;
}

export interface CloudflareEnv {
  DB: D1Database;
  ADS_R2: R2Bucket;
  ADS_KV: KVNamespace;
  AI: AI;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface WebhookPayload {
  [key: string]: unknown;
}

export interface CampaignRow {
  id: string;
  advertiser_id: string;
  advertiser_username?: string;
  title: string;
  description?: string;
  budget_total: number;
  budget_remaining: number;
  cost_per_impression: number;
  reward_percent_to_user: number;
  status: string;
  targeting?: string;
  pricing?: string;
  creative_ids?: string;
  stats?: string;
  created_at: number;
  updated_at: number;
  idempotency_key?: string;
}

export interface ImpressionRow {
  id: string;
  campaign_id: string;
  creative_id: string;
  user_id: string;
  session_token: string;
  nonce: string;
  idempotency_key: string;
  status: string;
  amount: number;
  reward_points: number;
  promo_points: number;
  monetary_value: number;
  viewed_at: number;
  certified_at?: number;
  ip_hash?: string;
  user_agent_hash?: string;
  visibility_duration_ms?: number;
  duplicate_of?: string;
  anomaly_flags?: string;
  rate_limited: number;
}

export interface ProviderRow {
  name: string;
  category: string;
  priority: number;
  available: number;
  daily_quota: number;
  used_today: number;
  reset_at: number;
  last_check?: number;
  ok: number;
  error?: string;
}

export interface ActionUnlockTokenRow {
  id: string;
  token: string;
  user_id: string;
  action_type: string;
  campaign_id: string;
  impression_id: string;
  expires_at: number;
  used: number;
  used_at?: number;
  created_at: number;
}
