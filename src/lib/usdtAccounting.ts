// ============================================================================
// HAVE2WANT PLUS - USDT ACCOUNTING FOR EXTERNAL MARKETPLACE
// Tracciamento commissioni USDT su acquisti esterni (eBay, AliExpress, ecc.)
// ============================================================================

export type CommissionStatus = "pending" | "confirmed" | "paid" | "cancelled";

export interface ExternalCommission {
  id: string;
  productId: string;
  productTitle: string;
  partnerName: string; // es. "eBay", "AliExpress"
  partnerTrackingId: string;
  commissionRate: number; // percentuale (es. 0.03 = 3%)
  saleAmountUsd: number;
  commissionAmountUsd: number;
  commissionAmountPi: number; // convertito al prezzo Pi reale
  status: CommissionStatus;
  buyerUsername?: string;
  createdAt: string;
  confirmedAt?: string;
  paidAt?: string;
  payoutWalletAddress?: string;
  transactionHash?: string;
}

export interface UsdtAccountingState {
  totalSalesUsd: number;
  totalCommissionUsd: number;
  totalCommissionPi: number;
  pendingCommissionUsd: number;
  confirmedCommissionUsd: number;
  paidCommissionUsd: number;
  commissions: ExternalCommission[];
  payoutWalletAddress: string;
}

const STORAGE_KEY = "have2want_usdt_accounting_v1";

// Tasso di conversione Pi -> USD (usato per convertire commissioni in Pi)
// In produzione: usare piRealPriceService per il prezzo reale di mercato
export const PI_TO_USD_RATE = 0.0751; // 1 pi ≈ $0.0751 (placeholder, aggiornato da piRealPriceService)

export function getUsdtAccountingState(): UsdtAccountingState {
  if (typeof localStorage === "undefined") {
    return initUsdtAccountingState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initUsdtAccountingState();
    }
    return JSON.parse(raw);
  } catch {
    return initUsdtAccountingState();
  }
}

function initUsdtAccountingState(): UsdtAccountingState {
  return {
    totalSalesUsd: 0,
    totalCommissionUsd: 0,
    totalCommissionPi: 0,
    pendingCommissionUsd: 0,
    confirmedCommissionUsd: 0,
    paidCommissionUsd: 0,
    commissions: [],
    payoutWalletAddress: "",
  };
}

export function saveUsdtAccountingState(state: UsdtAccountingState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function registerExternalCommission(
  productId: string,
  productTitle: string,
  partnerName: string,
  partnerTrackingId: string,
  commissionRate: number,
  saleAmountUsd: number,
  buyerUsername?: string
): ExternalCommission {
  const state = getUsdtAccountingState();
  const commissionAmountUsd = Number((saleAmountUsd * commissionRate).toFixed(4));
  const commissionAmountPi = Number((commissionAmountUsd / PI_TO_USD_RATE).toFixed(4));

  const commission: ExternalCommission = {
    id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    productId,
    productTitle,
    partnerName,
    partnerTrackingId,
    commissionRate,
    saleAmountUsd,
    commissionAmountUsd,
    commissionAmountPi,
    status: "pending",
    buyerUsername,
    createdAt: new Date().toISOString(),
  };

  state.commissions.unshift(commission);
  state.totalSalesUsd = Number((state.totalSalesUsd + saleAmountUsd).toFixed(2));
  state.totalCommissionUsd = Number((state.totalCommissionUsd + commissionAmountUsd).toFixed(4));
  state.totalCommissionPi = Number((state.totalCommissionPi + commissionAmountPi).toFixed(4));
  state.pendingCommissionUsd = Number((state.pendingCommissionUsd + commissionAmountUsd).toFixed(4));

  saveUsdtAccountingState(state);
  return commission;
}

export function confirmCommission(commissionId: string): ExternalCommission | null {
  const state = getUsdtAccountingState();
  const commission = state.commissions.find((c) => c.id === commissionId);
  if (!commission || commission.status !== "pending") return null;

  commission.status = "confirmed";
  commission.confirmedAt = new Date().toISOString();
  state.pendingCommissionUsd = Number((state.pendingCommissionUsd - commission.commissionAmountUsd).toFixed(4));
  state.confirmedCommissionUsd = Number((state.confirmedCommissionUsd + commission.commissionAmountUsd).toFixed(4));

  saveUsdtAccountingState(state);
  return commission;
}

export function payCommission(
  commissionId: string,
  payoutWalletAddress: string,
  transactionHash: string
): ExternalCommission | null {
  const state = getUsdtAccountingState();
  const commission = state.commissions.find((c) => c.id === commissionId);
  if (!commission || commission.status !== "confirmed") return null;

  commission.status = "paid";
  commission.paidAt = new Date().toISOString();
  commission.payoutWalletAddress = payoutWalletAddress;
  commission.transactionHash = transactionHash;
  state.paidCommissionUsd = Number((state.paidCommissionUsd + commission.commissionAmountUsd).toFixed(4));
  state.payoutWalletAddress = payoutWalletAddress;

  saveUsdtAccountingState(state);
  return commission;
}

export function setPayoutWallet(address: string): UsdtAccountingState {
  const state = getUsdtAccountingState();
  state.payoutWalletAddress = address;
  saveUsdtAccountingState(state);
  return state;
}

/**
 * Converte una commissione USDT in Pi usando il prezzo reale di mercato.
 * Se disponibile, usa piRealPriceService; altrimenti usa il tasso fisso.
 */
export async function convertCommissionToPi(
  commissionAmountUsd: number
): Promise<number> {
  try {
    const { getCachedPiRealPrice } = await import("./piRealPriceService");
    const price = getCachedPiRealPrice();
    if (price.priceUsd > 0) {
      return Number((commissionAmountUsd / price.priceUsd).toFixed(4));
    }
  } catch {
    // fallback al tasso fisso
  }
  return Number((commissionAmountUsd / PI_TO_USD_RATE).toFixed(4));
}