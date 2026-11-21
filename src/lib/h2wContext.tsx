import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  getPioneerRewardsState,
  subscribeRewardsState,
  adjustCommunityPoints,
  addMerchantPiCredit,
  spendMerchantPiBalance,
} from "./communityRewardsService";

export interface H2WContextValue {
  h2wPoints: number;
  h2wDaily: number;
  h2wWeekly: number;
  h2wMonthly: number;
  dailyUsed: number;
  weeklyUsed: number;
  monthlyUsed: number;
  merchantPiBalance: number;
  addPoints: (points: number) => void;
  incrementDaily: (points: number) => void;
  incrementWeekly: (points: number) => void;
  incrementMonthly: (points: number) => void;
  canPublish: (isExerciser: boolean, variant?: "VOICE_AI" | "PHOTO_TEXT") => boolean;
  resetDaily: () => void;
  resetWeekly: () => void;
  resetMonthly: () => void;
  getRemainingDaily: (isExerciser: boolean) => number;
  getRemainingWeekly: (isExerciser: boolean) => number;
  getRemainingMonthly: (isExerciser: boolean) => number;
  deductMerchantSubscription: (period: "DAILY" | "WEEKLY" | "MONTHLY" | "DAILY_SCONTO" | "WEEKLY_SCONTO" | "MONTHLY_SCONTO") => boolean;
  addMerchantPiBalance: (amount: number) => void;
  spendMerchantPi: (amountPi: number, description?: string) => boolean;
}

const H2WContext = createContext<H2WContextValue | null>(null);

interface H2WProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEYS = {
  DAILY: "h2w_daily",
  WEEKLY: "h2w_weekly",
  MONTHLY: "h2w_monthly",
  DAILY_RESET: "h2w_daily_reset_ts",
  WEEKLY_RESET: "h2w_weekly_reset_ts",
  MONTHLY_RESET: "h2w_monthly_reset_ts",
} as const;

export const H2W_COST = {
  CHAT: 1,
  TESTO_FOTO: 2,
  FOTO_VOCE: 4,
  ESERCENTE: 6,
};

export const H2W_LIMITS = {
  DAILY: 80,
  WEEKLY: 480,
  MONTHLY: 1900,
};

export const MERCHANT_SUBSCRIPTION_PI = {
  DAILY: 20,
  WEEKLY: 120,
  MONTHLY: 475,
  DAILY_SCONTO: 10,
  WEEKLY_SCONTO: 60,
  MONTHLY_SCONTO: 237.5,
} as const;

export const TEST_MODE = true;
export const AD_REWARD_POINTS = 1;
export const AD_REWARD_PI = 0.25;

function isNewDay(lastResetTs: number): boolean {
  const now = new Date();
  const lastReset = new Date(lastResetTs);
  return (
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getDate() !== lastReset.getDate()
  );
}

function isNewWeek(lastResetTs: number): boolean {
  const now = new Date();
  const lastReset = new Date(lastResetTs);

  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const thisMonday = getMonday(new Date(now));
  const lastMonday = getMonday(new Date(lastReset));

  return thisMonday.getTime() > lastMonday.getTime();
}

function isNewMonth(lastResetTs: number): boolean {
  const now = new Date();
  const lastReset = new Date(lastResetTs);
  return (
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth()
  );
}

function getNowTs(): number {
  return Date.now();
}

export function H2WProvider({ children }: H2WProviderProps) {
  // Unificato sulla singola fonte di verità communityRewardsService
  const [h2wPoints, setH2wPoints] = useState<number>(() => getPioneerRewardsState().pointsBalance);
  const [merchantPiBalance, setMerchantPiBalance] = useState<number>(() => getPioneerRewardsState().merchantPiBalance);
  const merchantBalanceRef = useRef<number>(merchantPiBalance);
  merchantBalanceRef.current = merchantPiBalance;

  const [h2wDaily, setH2wDaily] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.DAILY);
      const resetTs = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_RESET) || "0", 10);
      if (stored && resetTs && !isNewDay(resetTs)) {
        return parseInt(stored, 10);
      }
      if (resetTs && isNewDay(resetTs)) {
        localStorage.setItem(STORAGE_KEYS.DAILY, "0");
        localStorage.setItem(STORAGE_KEYS.DAILY_RESET, getNowTs().toString());
      }
      return 0;
    }
    return 0;
  });

  const [h2wWeekly, setH2wWeekly] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.WEEKLY);
      const resetTs = parseInt(localStorage.getItem(STORAGE_KEYS.WEEKLY_RESET) || "0", 10);
      if (stored && resetTs && !isNewWeek(resetTs)) {
        return parseInt(stored, 10);
      }
      if (resetTs && isNewWeek(resetTs)) {
        localStorage.setItem(STORAGE_KEYS.WEEKLY, "0");
        localStorage.setItem(STORAGE_KEYS.WEEKLY_RESET, getNowTs().toString());
      }
      return 0;
    }
    return 0;
  });

  const [h2wMonthly, setH2wMonthly] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.MONTHLY);
      const resetTs = parseInt(localStorage.getItem(STORAGE_KEYS.MONTHLY_RESET) || "0", 10);
      if (stored && resetTs && !isNewMonth(resetTs)) {
        return parseInt(stored, 10);
      }
      if (resetTs && isNewMonth(resetTs)) {
        localStorage.setItem(STORAGE_KEYS.MONTHLY, "0");
        localStorage.setItem(STORAGE_KEYS.MONTHLY_RESET, getNowTs().toString());
      }
      return 0;
    }
    return 0;
  });

  // Sottoscrizione reattiva alla fonte unica di verità (localStorage + Firestore)
  useEffect(() => {
    const syncNow = () => {
      const state = getPioneerRewardsState();
      setH2wPoints(state.pointsBalance);
      merchantBalanceRef.current = state.merchantPiBalance;
      setMerchantPiBalance(state.merchantPiBalance);
    };
    syncNow();
    return subscribeRewardsState((state) => {
      setH2wPoints(state.pointsBalance);
      merchantBalanceRef.current = state.merchantPiBalance;
      setMerchantPiBalance(state.merchantPiBalance);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY, h2wDaily.toString());
    localStorage.setItem(STORAGE_KEYS.DAILY_RESET, getNowTs().toString());
  }, [h2wDaily]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY, h2wWeekly.toString());
    localStorage.setItem(STORAGE_KEYS.WEEKLY_RESET, getNowTs().toString());
  }, [h2wWeekly]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MONTHLY, h2wMonthly.toString());
    localStorage.setItem(STORAGE_KEYS.MONTHLY_RESET, getNowTs().toString());
  }, [h2wMonthly]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = getNowTs();

      const dailyResetTs = parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_RESET) || "0", 10);
      if (dailyResetTs && isNewDay(dailyResetTs)) {
        setH2wDaily(0);
        localStorage.setItem(STORAGE_KEYS.DAILY, "0");
        localStorage.setItem(STORAGE_KEYS.DAILY_RESET, now.toString());
      }

      const weeklyResetTs = parseInt(localStorage.getItem(STORAGE_KEYS.WEEKLY_RESET) || "0", 10);
      if (weeklyResetTs && isNewWeek(weeklyResetTs)) {
        setH2wWeekly(0);
        localStorage.setItem(STORAGE_KEYS.WEEKLY, "0");
        localStorage.setItem(STORAGE_KEYS.WEEKLY_RESET, now.toString());
      }

      const monthlyResetTs = parseInt(localStorage.getItem(STORAGE_KEYS.MONTHLY_RESET) || "0", 10);
      if (monthlyResetTs && isNewMonth(monthlyResetTs)) {
        setH2wMonthly(0);
        localStorage.setItem(STORAGE_KEYS.MONTHLY, "0");
        localStorage.setItem(STORAGE_KEYS.MONTHLY_RESET, now.toString());
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const addPoints = useCallback((points: number) => {
    const res = adjustCommunityPoints(points, points >= 0 ? "Accredito punti H2W" : "Utilizzo punti H2W");
    setH2wPoints(res.newBalance);
  }, []);

  const incrementDaily = useCallback((points: number) => {
    setH2wDaily((prev) => Math.min(prev + points, H2W_LIMITS.DAILY));
  }, []);

  const incrementWeekly = useCallback((points: number) => {
    setH2wWeekly((prev) => Math.min(prev + points, H2W_LIMITS.WEEKLY));
  }, []);

  const incrementMonthly = useCallback((points: number) => {
    setH2wMonthly((prev) => Math.min(prev + points, H2W_LIMITS.MONTHLY));
  }, []);

  const canPublish = useCallback(
    (isExerciser: boolean, variant: "VOICE_AI" | "PHOTO_TEXT" = "VOICE_AI"): boolean => {
      if (!isExerciser) return true;
      const cost = variant === "VOICE_AI" ? H2W_COST.FOTO_VOCE : H2W_COST.TESTO_FOTO;
      const dailyRemaining = H2W_LIMITS.DAILY - h2wDaily;
      const weeklyRemaining = H2W_LIMITS.WEEKLY - h2wWeekly;
      const monthlyRemaining = H2W_LIMITS.MONTHLY - h2wMonthly;
      return dailyRemaining >= cost && weeklyRemaining >= cost && monthlyRemaining >= cost;
    },
    [h2wDaily, h2wWeekly, h2wMonthly]
  );

  const resetDaily = useCallback(() => {
    setH2wDaily(0);
    localStorage.setItem(STORAGE_KEYS.DAILY, "0");
    localStorage.setItem(STORAGE_KEYS.DAILY_RESET, getNowTs().toString());
  }, []);

  const resetWeekly = useCallback(() => {
    setH2wWeekly(0);
    localStorage.setItem(STORAGE_KEYS.WEEKLY, "0");
    localStorage.setItem(STORAGE_KEYS.WEEKLY_RESET, getNowTs().toString());
  }, []);

  const resetMonthly = useCallback(() => {
    setH2wMonthly(0);
    localStorage.setItem(STORAGE_KEYS.MONTHLY, "0");
    localStorage.setItem(STORAGE_KEYS.MONTHLY_RESET, getNowTs().toString());
  }, []);

  // Aggiunge Pi al saldo commerciante in modo sincrono e persistente
  const addMerchantPiBalance = useCallback((amount: number) => {
    const updated = addMerchantPiCredit(amount);
    merchantBalanceRef.current = updated;
    setMerchantPiBalance(updated);
  }, []);

  // Spesa generica dal saldo esercente (vetrine pubblicitarie, quota X, servizi)
  const spendMerchantPi = useCallback((amountPi: number, description = 'Spesa vetrina esercente') => {
    const result = spendMerchantPiBalance(amountPi, description);
    if (!result.success) return false;
    merchantBalanceRef.current = result.newMerchantBalance;
    setMerchantPiBalance(result.newMerchantBalance);
    return true;
  }, []);

  // BUG RISOLTO: Verifica e addebito SINCRONI (zero dipendenza dal batching asincrono di setState)
  const deductMerchantSubscription = useCallback(
    (period: "DAILY" | "WEEKLY" | "MONTHLY" | "DAILY_SCONTO" | "WEEKLY_SCONTO" | "MONTHLY_SCONTO"): boolean => {
      const cost = MERCHANT_SUBSCRIPTION_PI[period];
      const currentStored = getPioneerRewardsState().merchantPiBalance;
      const available = Math.max(merchantBalanceRef.current, currentStored);

      if (available < cost) {
        return false;
      }

      const result = spendMerchantPiBalance(cost, `Abbonamento Esercente (${period})`);
      if (!result.success) {
        return false;
      }

      merchantBalanceRef.current = result.newMerchantBalance;
      setMerchantPiBalance(result.newMerchantBalance);
      return true;
    },
    []
  );

  const getRemainingDaily = useCallback(
    (isExerciser: boolean): number => {
      if (!isExerciser) return Infinity;
      return Math.max(0, H2W_LIMITS.DAILY - h2wDaily);
    },
    [h2wDaily]
  );

  const getRemainingWeekly = useCallback(
    (isExerciser: boolean): number => {
      if (!isExerciser) return Infinity;
      return Math.max(0, H2W_LIMITS.WEEKLY - h2wWeekly);
    },
    [h2wWeekly]
  );

  const getRemainingMonthly = useCallback(
    (isExerciser: boolean): number => {
      if (!isExerciser) return Infinity;
      return Math.max(0, H2W_LIMITS.MONTHLY - h2wMonthly);
    },
    [h2wMonthly]
  );

  const dailyUsed = h2wDaily;
  const weeklyUsed = h2wWeekly;
  const monthlyUsed = h2wMonthly;

  const value = useMemo(
    () => ({
      h2wPoints,
      h2wDaily,
      h2wWeekly,
      h2wMonthly,
      dailyUsed,
      weeklyUsed,
      monthlyUsed,
      merchantPiBalance,
      addPoints,
      incrementDaily,
      incrementWeekly,
      incrementMonthly,
      canPublish,
      resetDaily,
      resetWeekly,
      resetMonthly,
      getRemainingDaily,
      getRemainingWeekly,
      getRemainingMonthly,
      deductMerchantSubscription,
      addMerchantPiBalance,
      spendMerchantPi,
    }),
    [
      h2wPoints,
      h2wDaily,
      h2wWeekly,
      h2wMonthly,
      dailyUsed,
      weeklyUsed,
      monthlyUsed,
      merchantPiBalance,
      addPoints,
      incrementDaily,
      incrementWeekly,
      incrementMonthly,
      canPublish,
      resetDaily,
      resetWeekly,
      resetMonthly,
      getRemainingDaily,
      getRemainingWeekly,
      getRemainingMonthly,
      deductMerchantSubscription,
      addMerchantPiBalance,
      spendMerchantPi,
    ]
  );

  return <H2WContext.Provider value={value}>{children}</H2WContext.Provider>;
}

export function useH2W() {
  const context = useContext(H2WContext);
  if (!context) {
    throw new Error("useH2W must be used within an H2WProvider");
  }
  return context;
}
