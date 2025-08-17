// src/contexts/AuthContext.jsx
import React from 'react'
import {  listenUser, idToken, signInWithGoogle, signOutNow } from '@/lib/firebase'

export const AuthContext = React.createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
})

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const unsub = listenUser((u) => { setUser(u); setLoading(false) })
    return () => unsub && unsub()
  }, [])

  const value = React.useMemo(() => ({
    user,
    loading,
    signIn: () => signInWithGoogle(),
    signOut: () => signOutNow(),
    getIdToken: () => idToken(),
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
