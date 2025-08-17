// src/contexts/AuthContext.jsx
import React from 'react';
import { listenUser, idToken as getTokenOnce, signInWithGoogle, signOutNow } from '@/lib/firebase';

export const AuthContext = React.createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Subscribe to auth state
    const unsub = listenUser((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const getIdToken = React.useCallback(async (forceRefresh = true) => {
    // Use the helper which waits for initial auth ready; force refresh by default
    return await getTokenOnce(!!forceRefresh);
  }, []);

  const value = React.useMemo(() => ({
    user,
    loading,
    signIn: async () => { await signInWithGoogle(); },
    signOut: async () => { await signOutNow(); },
    getIdToken,
  }), [user, loading, getIdToken]);

  // Minimal debug (does not log full token)
  React.useEffect(() => {
    if (!user) return;
    (async () => {
      const t = await getIdToken();
      console.log('AuthContext token:', t ? `${t.slice(0, 20)}...` : null);
    })();
  }, [user, getIdToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
