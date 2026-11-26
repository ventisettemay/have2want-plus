import type { D1Database, D1Statement, CampaignRow, ImpressionRow, ProviderRow, ActionUnlockTokenRow } from './types';

/* ------------------------------------------------------------------ */
/* Helper D1                                                          */
/* ------------------------------------------------------------------ */

export function prepare(db: D1Database, sql: string): D1Statement {
  return db.prepare(sql);
}

export async function run(db: D1Database, sql: string, ...values: unknown[]): Promise<D1Result> {
  return db.prepare(sql).bind(...values).run();
}

export async function first<T = unknown>(
  db: D1Database,
  sql: string,
  ...values: unknown[]
): Promise<T | null> {
  return db.prepare(sql).bind(...values).first({ column: 'json' }) as Promise<T | null>;
}

export async function all<T = unknown>(
  db: D1Database,
  sql: string,
  ...values: unknown[]
): Promise<T[]> {
  const res = await db.prepare(sql).bind(...values).all();
  return (res.results ?? []) as T[];
}

interface D1Result {
  success: boolean;
  meta?: { changes: number; last_row_id: number };
  results?: unknown[];
}

/* ------------------------------------------------------------------ */
/* Campagne                                                           */
/* ------------------------------------------------------------------ */

export async function getCampaign(db: D1Database, id: string): Promise<CampaignRow | null> {
  return first<CampaignRow>(db, 'SELECT * FROM campaigns WHERE id = ?', id);
}

export async function createCampaign(db: D1Database, c: CampaignRow): Promise<void> {
  await run(
    db,
    `INSERT INTO campaigns (id, advertiser_id, advertiser_username, title, description,
      budget_total, budget_remaining, cost_per_impression, reward_percent_to_user,
      status, targeting, pricing, creative_ids, stats, created_at, updated_at, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    c.id,
    c.advertiser_id,
    c.advertiser_username ?? null,
    c.title,
    c.description ?? null,
    c.budget_total,
    c.budget_remaining,
    c.cost_per_impression,
    c.reward_percent_to_user,
    c.status,
    c.targeting ?? null,
    c.pricing ?? null,
    c.creative_ids ?? '[]',
    c.stats ?? '{}',
    c.created_at,
    c.updated_at,
    c.idempotency_key ?? null
  );
}

export async function updateCampaignStatus(
  db: D1Database,
  id: string,
  status: string
): Promise<void> {
  await run(db, "UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?", status, Date.now(), id);
}

export async function incrementCampaignStats(
  db: D1Database,
  campaignId: string,
  { impressions = 0, certified = 0, spend = 0, rewards = 0 }: { impressions?: number; certified?: number; spend?: number; rewards?: number }
): Promise<void> {
  await run(
    db,
    `UPDATE campaigns SET
       budget_remaining = MAX(0, budget_remaining - ?),
       stats = json_set(
         COALESCE(stats, '{}'),
         '$.impressions', COALESCE(json_extract(stats, '$.impressions'), 0) + ?,
         '$.certified_impressions', COALESCE(json_extract(stats, '$.certified_impressions'), 0) + ?,
         '$.spend', COALESCE(json_extract(stats, '$.spend'), 0) + ?,
         '$.rewards', COALESCE(json_extract(stats, '$.rewards'), 0) + ?
       ),
       updated_at = ?
     WHERE id = ?`,
    spend,
    impressions,
    certified,
    spend,
    rewards,
    Date.now(),
    campaignId
  );
}

export async function listActiveCampaigns(
  db: D1Database,
  { countryCode, category, limit = 20 }: { countryCode?: string; category?: string; limit?: number }
): Promise<CampaignRow[]> {
  let sql = 'SELECT * FROM campaigns WHERE status = ? AND budget_remaining > 0';
  const values: unknown[] = ['active'];
  if (countryCode) {
    sql += " AND (json_extract(targeting, '$.countryCode') IS NULL OR json_extract(targeting, '$.countryCode') = ?)";
    values.push(countryCode);
  }
  if (category) {
    sql += " AND (json_extract(targeting, '$.category') LIKE ?)";
    values.push(`%${category}%`);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  values.push(limit);
  return all<CampaignRow>(db, sql, ...values);
}

/* ------------------------------------------------------------------ */
/* Impressioni                                                        */
/* ------------------------------------------------------------------ */

export async function getImpressionByIdempotency(db: D1Database, idempotencyKey: string): Promise<ImpressionRow | null> {
  return first<ImpressionRow>(db, 'SELECT * FROM impressions WHERE idempotency_key = ?', idempotencyKey);
}

export async function createImpression(db: D1Database, imp: ImpressionRow): Promise<void> {
  await run(
    db,
    `INSERT INTO impressions (id, campaign_id, creative_id, user_id, session_token, nonce,
      idempotency_key, status, amount, reward_points, promo_points, monetary_value,
      viewed_at, certified_at, ip_hash, user_agent_hash, visibility_duration_ms,
      duplicate_of, anomaly_flags, rate_limited)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    imp.id,
    imp.campaign_id,
    imp.creative_id,
    imp.user_id,
    imp.session_token,
    imp.nonce,
    imp.idempotency_key,
    imp.status,
    imp.amount,
    imp.reward_points,
    imp.promo_points,
    imp.monetary_value,
    imp.viewed_at,
    imp.certified_at ?? null,
    imp.ip_hash ?? null,
    imp.user_agent_hash ?? null,
    imp.visibility_duration_ms ?? null,
    imp.duplicate_of ?? null,
    imp.anomaly_flags ?? '[]',
    imp.rate_limited
  );
}

/* ------------------------------------------------------------------ */
/* Provider registry                                                  */
/* ------------------------------------------------------------------ */

export async function getProviders(db: D1Database): Promise<ProviderRow[]> {
  return all<ProviderRow>(db, 'SELECT * FROM provider_registry ORDER BY priority ASC');
}

export async function getProvider(db: D1Database, name: string): Promise<ProviderRow | null> {
  return first<ProviderRow>(db, 'SELECT * FROM provider_registry WHERE name = ?', name);
}

export async function incrementProviderUsage(
  db: D1Database,
  name: string,
  amount: number
): Promise<void> {
  await run(
    db,
    `UPDATE provider_registry SET used_today = used_today + ? WHERE name = ?`,
    amount,
    name
  );
}

export async function resetProviderQuotas(db: D1Database, now: number): Promise<void> {
  await run(db, `UPDATE provider_registry SET used_today = 0, reset_at = ?`, now);
}

/* ------------------------------------------------------------------ */
/* Abbonamenti                                                        */
/* ------------------------------------------------------------------ */

export async function getSubscriptionByAdvertiser(
  db: D1Database,
  advertiserId: string
): Promise<{ level: string; end_date: number; status: string } | null> {
  return first<{ level: string; end_date: number; status: string }>(
    db,
    "SELECT level, end_date, status FROM subscriptions WHERE advertiser_id = ? AND status = 'active' AND end_date > ? ORDER BY end_date DESC LIMIT 1",
    advertiserId,
    Date.now()
  );
}

export async function createSubscription(db: D1Database, sub: {
  id: string;
  advertiser_id: string;
  level: string;
  price_pi: number;
  start_date: number;
  end_date: number;
}): Promise<void> {
  await run(
    db,
    `INSERT INTO subscriptions (id, advertiser_id, level, price_pi, start_date, end_date, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    sub.id,
    sub.advertiser_id,
    sub.level,
    sub.price_pi,
    sub.start_date,
    sub.end_date,
    Date.now()
  );
}

/* ------------------------------------------------------------------ */
/* Ordini creativi                                                    */
/* ------------------------------------------------------------------ */

export async function getOrder(db: D1Database, id: string): Promise<any | null> {
  return first(db, 'SELECT * FROM creative_orders WHERE id = ?', id);
}

export async function createOrder(db: D1Database, order: any): Promise<void> {
  await run(
    db,
    `INSERT INTO creative_orders (id, advertiser_id, advertiser_username, creator_id, creator_username,
      type, title, description, status, priority, budget_pi, deadline, targeting_country_code,
      creative_id, files, messages, revision_notes, approved_at, rejected_reason,
      created_at, updated_at, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    order.id,
    order.advertiser_id,
    order.advertiser_username ?? null,
    order.creator_id ?? null,
    order.creator_username ?? null,
    order.type,
    order.title,
    order.description ?? null,
    order.status,
    order.priority ?? 'normal',
    order.budget_pi ?? null,
    order.deadline ?? null,
    order.targeting_country_code ?? null,
    order.creative_id ?? null,
    order.files ?? '[]',
    order.messages ?? '[]',
    order.revision_notes ?? null,
    order.approved_at ?? null,
    order.rejected_reason ?? null,
    order.created_at,
    order.updated_at,
    order.idempotency_key ?? null
  );
}

export async function updateOrderStatus(db: D1Database, id: string, status: string, reason?: string): Promise<void> {
  await run(
    db,
    'UPDATE creative_orders SET status = ?, rejected_reason = ?, updated_at = ? WHERE id = ?',
    status,
    reason ?? null,
    Date.now(),
    id
  );
}

export async function addOrderMessage(db: D1Database, msg: any): Promise<void> {
  await run(
    db,
    `INSERT INTO order_messages (id, order_id, sender_id, sender_role, content, file_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    msg.id,
    msg.order_id,
    msg.sender_id,
    msg.sender_role,
    msg.content,
    msg.fileId ?? null,
    msg.createdAt
  );
}

/* ------------------------------------------------------------------ */
/* Token azione monouso (Watch-to-Unlock)                             */
/* ------------------------------------------------------------------ */

export async function getActionUnlockToken(db: D1Database, token: string): Promise<ActionUnlockTokenRow | null> {
  return first<ActionUnlockTokenRow>(db, 'SELECT * FROM action_unlock_tokens WHERE token = ?', token);
}

export async function createActionUnlockToken(db: D1Database, t: ActionUnlockTokenRow): Promise<void> {
  await run(
    db,
    `INSERT INTO action_unlock_tokens (id, token, user_id, action_type, campaign_id, impression_id,
      expires_at, used, used_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`,
    t.id,
    t.token,
    t.user_id,
    t.action_type,
    t.campaign_id,
    t.impression_id,
    t.expires_at,
    t.created_at
  );
}

export async function markActionUnlockTokenUsed(db: D1Database, token: string): Promise<void> {
  await run(
    db,
    `UPDATE action_unlock_tokens SET used = 1, used_at = ? WHERE token = ?`,
    Date.now(),
    token
  );
}
