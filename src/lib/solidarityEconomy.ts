// ============================================================================
// HAVE2WANT PLUS - SOLIDARITY ECONOMY MODULE
// Eco-fee, Pro-Tools, Badge di qualità, Donazioni "Pasto Sospeso"
// ============================================================================

/**
 * ECO-FEE: Commissione ecologica su annunci VENDO.
 * Percentuale del prezzo in Pi destinata a progetti di sostenibilità territoriale.
 */
export const ECO_FEE_PERCENT = 0.02; // 2% del prezzo in Pi (aliquota base)
export const ECO_FEE_CAP_PI = 50; // Cap massimo eco-fee in Pi

export interface EcoFeeCalculation {
  itemPricePi: number;
  ecoFeePi: number;
  netToSellerPi: number;
  percentage: number;
}

export function calculateEcoFee(itemPricePi: number): EcoFeeCalculation {
  // Aliquote degressive: più alto il prezzo, più bassa la percentuale eco-fee
  let percentage: number;
  if (itemPricePi <= 10) {
    percentage = 0.02; // 2% fino a 10 π
  } else if (itemPricePi <= 100) {
    percentage = 0.015; // 1.5% da 10 a 100 π
  } else {
    percentage = 0.01; // 1% oltre 100 π
  }

  let ecoFeePi = Number((itemPricePi * percentage).toFixed(4));
  // Applica cap massimo
  if (ecoFeePi > ECO_FEE_CAP_PI) {
    ecoFeePi = Number(ECO_FEE_CAP_PI.toFixed(4));
  }

  const netToSellerPi = Number((itemPricePi - ecoFeePi).toFixed(4));
  return {
    itemPricePi,
    ecoFeePi,
    netToSellerPi,
    percentage,
  };
}

/**
 * BADGE DI QUALITÀ: Sistema di badge per annunci ed esercenti.
 * Basato su reputazione, verifiche, transazioni completate.
 */
export type BadgeType =
  | "PIONEER_VERIFIED"
  | "TRUSTED_SELLER"
  | "KILO_ZERO_PRODUCER"
  | "SOLIDARITY_CHAMPION"
  | "ECO_FRIENDLY"
  | "FAST_RESPONDER"
  | "SUSPENDED_MEAL_DONOR";

export interface BadgeDefinition {
  type: BadgeType;
  label: string;
  description: string;
  color: string;
  icon: string;
  criteria: string;
}

export const BADGE_REGISTRY: Record<BadgeType, BadgeDefinition> = {
  PIONEER_VERIFIED: {
    type: "PIONEER_VERIFIED",
    label: "Pioneer Verificato",
    description: "Account verificato tramite Pi Network SDK",
    color: "#8b5cf6",
    icon: "🪙",
    criteria: "Autenticazione Pi Network completata con successo",
  },
  TRUSTED_SELLER: {
    type: "TRUSTED_SELLER",
    label: "Venditore Affidabile",
    description: "Reputazione >= 4.5 stelle e >= 10 transazioni completate",
    color: "#10b981",
    icon: "⭐",
    criteria: "Reputazione media >= 4.5/5 e almeno 10 scambi completati",
  },
  KILO_ZERO_PRODUCER: {
    type: "KILO_ZERO_PRODUCER",
    label: "Produttore Km 0",
    description: "Produttore agricolo locale con filiera corta certificata",
    color: "#22c55e",
    icon: "🌾",
    criteria: "Categoria alimentari_km0 con coordinate verificate",
  },
  SOLIDARITY_CHAMPION: {
    type: "SOLIDARITY_CHAMPION",
    label: "Campione di Solidarietà",
    description: "Utente con donazioni Pasto Sospeso attive",
    color: "#ef4444",
    icon: "🤝",
    criteria: "Almeno 1 donazione Pasto Sospeso nel mese corrente",
  },
  ECO_FRIENDLY: {
    type: "ECO_FRIENDLY",
    label: "Eco-Friendly",
    description: "Annunci con prodotti ricondizionati o a km 0",
    color: "#059669",
    icon: "♻️",
    criteria: "Prodotti in condizione 'usato_ottimo' o categoria KM0",
  },
  FAST_RESPONDER: {
    type: "FAST_RESPONDER",
    label: "Risposta Rapida",
    description: "Risponde alle richieste di scambio entro 24 ore",
    color: "#f59e0b",
    icon: "⚡",
    criteria: "Tempo medio di risposta < 24h sugli ultimi 10 scambi",
  },
  SUSPENDED_MEAL_DONOR: {
    type: "SUSPENDED_MEAL_DONOR",
    label: "Donatore Pasto Sospeso",
    description: "Ha donato almeno un pasto sospeso alla comunità",
    color: "#dc2626",
    icon: "🍲",
    criteria: "Almeno 1 donazione Pasto Sospeso registrata",
  },
};

export function getBadge(type: BadgeType): BadgeDefinition {
  return BADGE_REGISTRY[type];
}

/**
 * PASTO SOSPESO: Sistema di donazione solidale.
 * Gli utenti possono donare Pi Coin per pasti sospesi destinati a chi ne ha bisogno.
 */
export interface SuspendedMealDonation {
  id: string;
  donorUsername: string;
  amountPi: number;
  mealsProvided: number; // 1 pasto = 1.0 pi
  status: "pending" | "distributed" | "expired";
  createdAt: string;
  distributedAt?: string;
  beneficiaryArea?: string;
}

export interface SuspendedMealState {
  totalDonationsPi: number;
  totalMealsProvided: number;
  pendingMeals: number;
  distributedMeals: number;
  donations: SuspendedMealDonation[];
}

const STORAGE_KEY = "have2want_suspended_meals_v1";

export function getSuspendedMealState(): SuspendedMealState {
  if (typeof localStorage === "undefined") {
    return {
      totalDonationsPi: 0,
      totalMealsProvided: 0,
      pendingMeals: 0,
      distributedMeals: 0,
      donations: [],
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initSuspendedMealState();
    }
    return JSON.parse(raw);
  } catch {
    return initSuspendedMealState();
  }
}

function initSuspendedMealState(): SuspendedMealState {
  return {
    totalDonationsPi: 0,
    totalMealsProvided: 0,
    pendingMeals: 0,
    distributedMeals: 0,
    donations: [],
  };
}

export function saveSuspendedMealState(state: SuspendedMealState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function donateSuspendedMeal(
  donorUsername: string,
  amountPi: number
): SuspendedMealState {
  const state = getSuspendedMealState();
  const mealsProvided = Math.floor(amountPi); // 1 pi = 1 pasto
  const donation: SuspendedMealDonation = {
    id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    donorUsername,
    amountPi: Number(amountPi.toFixed(4)),
    mealsProvided,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  state.donations.unshift(donation);
  state.totalDonationsPi = Number((state.totalDonationsPi + amountPi).toFixed(4));
  state.totalMealsProvided += mealsProvided;
  state.pendingMeals += mealsProvided;

  saveSuspendedMealState(state);
  return state;
}

export function distributeSuspendedMeal(
  donationId: string,
  beneficiaryArea: string
): SuspendedMealState {
  const state = getSuspendedMealState();
  const donation = state.donations.find((d) => d.id === donationId);
  if (donation && donation.status === "pending") {
    donation.status = "distributed";
    donation.distributedAt = new Date().toISOString();
    donation.beneficiaryArea = beneficiaryArea;
    state.pendingMeals -= donation.mealsProvided;
    state.distributedMeals += donation.mealsProvided;
    saveSuspendedMealState(state);
  }
  return state;
}