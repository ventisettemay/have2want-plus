// Tipi per il sistema pubblicitario HAVE2WANT PLUS — Punti 4–8 implementati.
// Stack: Express + Firestore + idempotencyStore + walletSync (nessuna nuova dipendenza).
// Collegamenti: countryAdvertisingPricing.ts (prezzi), merchantPinClassifier.ts (categoria pin),
// communityRewardsService.ts (punti comunitari frontend), firestoreWalletSync.ts (saldo server).

export type AdCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type AdCreativeType = 'banner' | 'video';
export type AdCreativeStatus = 'pending' | 'approved' | 'rejected';
export type AdImpressionStatus = 'pending' | 'certified' | 'rejected' | 'duplicate' | 'rate_limited';
export type AdLedgerType = 'debit' | 'credit';
export type AdLedgerAccount =
  | 'campaign_budget'
  | 'user_promo_points'
  | 'user_monetary_balance'
  | 'user_pi_balance'
  | 'platform_commission'
  | 'refund';
export type AdRewardType = 'promo_points' | 'monetary' | 'pi';

export interface AdTargeting {
  countryCode?: string;
  city?: string;
  category?: string[];
  minPioneerScore?: number;
  maxFrequencyPerUserPerDay?: number;
  merchantPinCategory?: 'DOUBLE_RING' | 'PI_ACCEPTED' | 'AD_ONLY';
}

export interface AdPricingSnapshot {
  countryCode: string;
  listPricePi: number;
  currentPricePi: number;
  coefficient: number;
  trafficTierLabel: string;
  durationDays: number;
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  advertiserUsername?: string;
  title: string;
  description?: string;
  budgetTotal: number;
  budgetRemaining: number;
  costPerImpression: number;
  rewardPercentToUser: number;
  dailyBudget?: number;
  maxImpressionsPerUserPerDay?: number;
  minVisibilityDurationMs?: number;
  startDate: number;
  endDate: number;
  status: AdCampaignStatus;
  targeting: AdTargeting;
  pricing?: AdPricingSnapshot;
  creativeIds: string[];
  stats: {
    impressions: number;
    certifiedImpressions: number;
    spend: number;
    rewards: number;
  };
  createdAt: number;
  updatedAt: number;
  idempotencyKey?: string;
}

export interface AdCreativeInput {
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
}

export interface AdCreative {
  id: string;
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
  status: AdCreativeStatus;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AdSessionToken {
  token: string;
  nonce: string;
  userId: string;
  campaignId: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

export interface AdImpression {
  id: string;
  campaignId: string;
  creativeId: string;
  userId: string;
  sessionToken: string;
  nonce: string;
  idempotencyKey: string;
  status: AdImpressionStatus;
  amount: number;
  rewardPoints: number;
  promoPoints: number;
  monetaryValue: number;
  viewedAt: number;
  certifiedAt?: number;
  ipHash?: string;
  userAgentHash?: string;
  visibilityDurationMs?: number;
  duplicateOf?: string;
  anomalyFlags: string[];
  rateLimited: boolean;
}

export interface AdReward {
  id: string;
  userId: string;
  campaignId: string;
  impressionId: string;
  points: number;
  type: AdRewardType;
  txId?: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: number;
  idempotencyKey: string;
}

export interface AdLedgerEntry {
  id: string;
  type: AdLedgerType;
  account: AdLedgerAccount;
  amount: number;
  referenceId: string;
  description: string;
  timestamp: number;
  idempotencyKey: string;
  balanceAfter?: number;
}

export interface DailyUserCaps {
  userId: string;
  date: string;
  impressionsCount: number;
  pointsEarned: number;
  maxImpressions: number;
  maxPoints: number;
}

export interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: number;
}

export interface CreateCampaignInput {
  advertiserId: string;
  advertiserUsername?: string;
  title: string;
  description?: string;
  budgetTotal: number;
  costPerImpression: number;
  rewardPercentToUser: number;
  startDate: number;
  endDate: number;
  targeting?: AdTargeting;
  dailyBudget?: number;
  maxImpressionsPerUserPerDay?: number;
  minVisibilityDurationMs?: number;
  idempotencyKey?: string;
  countryCode?: string;
}

export interface CertifyImpressionInput {
  campaignId: string;
  creativeId: string;
  userId: string;
  sessionToken: string;
  nonce: string;
  idempotencyKey: string;
  visibilityDurationMs?: number;
  ipHash?: string;
  userAgentHash?: string;
}

export interface AdFeedItem {
  campaign: AdCampaign;
  creative: AdCreative;
  sessionToken: AdSessionToken;
  impressionToken: string;
}

export interface PresignResponse {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  expiresAt: number;
}

export interface ReconciliationReport {
  campaignId: string;
  ledgerSpend: number;
  campaignSpend: number;
  discrepancy: number;
  balanced: boolean;
  entries: AdLedgerEntry[];
}
