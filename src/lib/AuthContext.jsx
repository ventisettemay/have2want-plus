import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getPioneerRewardsState,
  subscribeRewardsState,
  setActiveWalletUser,
  setAdStreamEnabledPreference,
  pointsToPi,
} from './communityRewardsService';
import {
  clearPiSession,
  exchangePiTokenForFirebaseSession,
  getCurrentPiAccessToken,
} from './piSdkService';

const DEFAULT_USER_BASE = {
  id: 'user_pioneer_001',
  name: 'Pioniere Solidale',
  email: 'pioneer@have2want.local',
  username: '@pioniere_001',
  category: 'CITADINO_PRIVATO',
  trust_rating: 4.9,
  ad_abbuoni_disponibili: 2,
  ad_interrupt_count: 0,
  pi_circuit_suspended_until: null,
  specialist_municipality_cap_verified: true,
};

function buildSyncedUser(baseUser, rewardsState) {
  if (!baseUser) return null;
  const pointsBalance = rewardsState?.pointsBalance ?? 0;
  return {
    ...baseUser,
    username: rewardsState?.pioneerUsername || baseUser.username,
    points_balance: pointsBalance,
    credit_balance: pointsToPi(pointsBalance),
    ad_completed_streak: rewardsState?.adCompletedStreak ?? 0,
    ad_stream_enabled: rewardsState?.adStreamEnabled ?? true,
  };
}

/** @type {React.Context<{ user: any; login: (userData?: Record<string, any>) => void; logout: () => void; updateUser: (updates?: Record<string, any>) => void }>} */
const AuthContext = createContext({
  user: buildSyncedUser(DEFAULT_USER_BASE, getPioneerRewardsState()),
  login: (_userData) => {},
  logout: () => {},
  updateUser: (_updates) => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    buildSyncedUser(DEFAULT_USER_BASE, getPioneerRewardsState())
  );

  // Sincronizza in tempo reale il profilo utente con la fonte unica di verità (communityRewardsService + Firestore)
  useEffect(() => {
    const initial = getPioneerRewardsState();
    setActiveWalletUser(DEFAULT_USER_BASE.id, DEFAULT_USER_BASE.username).catch(() => {});
    setUser((prev) => buildSyncedUser(prev, initial));

    return subscribeRewardsState((state) => {
      setUser((prev) => buildSyncedUser(prev, state));
    });
  }, []);

  const login = (userData) => {
    const rewards = getPioneerRewardsState();
    const merged = buildSyncedUser({ ...DEFAULT_USER_BASE, ...userData }, rewards);
    setUser(merged);
    if (merged) {
      const piToken = userData?.accessToken || getCurrentPiAccessToken();
      if (piToken) {
        exchangePiTokenForFirebaseSession(piToken)
          .catch(() => {})
          .finally(() => {
            setActiveWalletUser(merged.uid || merged.id, merged.username).catch(() => {});
          });
      } else {
        setActiveWalletUser(merged.uid || merged.id, merged.username).catch(() => {});
      }
    }
  };

  const logout = () => {
    setUser(null);
    clearPiSession().catch(() => {});
  };

  const updateUser = (updates) => {
    if (typeof updates?.ad_stream_enabled === 'boolean') {
      setAdStreamEnabledPreference(updates.ad_stream_enabled);
    }
    setUser((prev) => {
      if (!prev) return prev;
      return buildSyncedUser({ ...prev, ...updates }, getPioneerRewardsState());
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** @returns {{ user: any; login: (userData?: Record<string, any>) => void; logout: () => void; updateUser: (updates?: Record<string, any>) => void }} */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: buildSyncedUser(DEFAULT_USER_BASE, getPioneerRewardsState()),
      login: (_userData) => {},
      logout: () => {},
      updateUser: (_updates) => {},
    };
  }
  return context;
}

export default AuthContext;
