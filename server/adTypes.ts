// Tipi per il sistema pubblicitario HAVE2WANT PLUS.
// Adattato allo stack esistente: Express + Firestore + idempotencyStore + walletSync.
// Nessuna dipendenza esterna aggiuntiva.

export type AdCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type AdCreativeType = 'banner' | 'video';
export type AdCreativeStatus = 'pending' | 'approved' | 'rejected';
export type AdImpressionStatus = 'pending' | 'certified' | 'rejected' | 'duplicate';
export type AdLedgerType = 'debit' | 'credit';
export type AdLedgerAccount = 'campaign_budget' | 'user_reward' | 'platform_commission' | 'refund';

export interface AdTargeting {
  countryCode?: string;
  city?: string;
  category?: string[];
  minPioneerScore?: number;
  maxFrequencyPerUserPerDay?: number;
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  advertiserUsername?: string;
  title: string;
  description?: string;
  budgetTotal: number;           // in punti comunitari o Pi (decimale)
  budgetRemaining: number;
  costPerImpression: number;     // costo per singola impressione certificata
  rewardPercentToUser: number;   // % del costo che va all'utente (0-100)
  startDate: number;             // epoch ms
  endDate: number;               // epoch ms
  status: AdCampaignStatus;
  targeting: AdTargeting;
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

export interface AdCreative {
  id: string;
  campaignId: string;
  type: AdCreativeType;
  title?: string;
  cta?: string;
  logoUrl?: string;
  fileUrl?: string;              // URL del file (upload locale / testnet)
  fileKey?: string;              // chiave storage (locale)
  width?: number;
  height?: number;
  format?: string;               // png/jpeg/webp/mp4
  durationSeconds?: number;      // per video
  status: AdCreativeStatus;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AdImpression {
  id: string;
  campaignId: string;
  creativeId: string;
  userId: string;
  sessionToken: string;          // token di sessione firmato server-side
  idempotencyKey: string;        // chiave unica per evitare doppi conteggi
  status: AdImpressionStatus;
  amount: number;                // costo addebitato alla campagna
  rewardPoints: number;          // punti accreditati all'utente
  viewedAt: number;              // epoch ms
  certifiedAt?: number;
  ipHash?: string;
  userAgentHash?: string;
  visibilityDurationMs?: number; // durata visibilità pagina
  duplicateOf?: string;          // id dell'impressione originale se duplicata
}

export interface AdReward {
  id: string;
  userId: string;
  campaignId: string;
  impressionId: string;
  points: number;
  txId?: string;                 // riferimento transazione wallet (Firestore)
  status: 'pending' | 'completed' | 'rejected';
  createdAt: number;
  idempotencyKey: string;
}

export interface AdLedgerEntry {
  id: string;
  type: AdLedgerType;
  account: AdLedgerAccount;
  amount: number;
  referenceId: string;           // campaignId / userId / impressionId
  description: string;
  timestamp: number;
  idempotencyKey: string;
  balanceAfter?: number;
}

// Input per creazione campagna
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
  idempotencyKey?: string;
}

// Input per certificazione impressione
export interface CertifyImpressionInput {
  campaignId: string;
  creativeId: string;
  userId: string;
  sessionToken: string;
  idempotencyKey: string;
  visibilityDurationMs?: number;
  ipHash?: string;
  userAgentHash?: string;
}

// Risposta feed pubblicitario
export interface AdFeedItem {
  campaign: AdCampaign;
  creative: AdCreative;
  impressionToken: string;       // token da passare a /impressions/certify
}

// Risposta presign upload
export interface PresignResponse {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  expiresAt: number;
}
