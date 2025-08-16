import React from 'react'
import { Link } from 'react-router-dom'
import { listenUser, signInWithGoogle, signOutNow } from '@/lib/firebase' // from your firebase.ts

export default function Shell({ children }) {
  const [user, setUser] = React.useState(null)
  const [err, setErr] = React.useState(null)

  React.useEffect(() => listenUser(setUser), [])

  async function handleSignIn() {
    setErr(null)
    try { await signInWithGoogle() } catch (e) {
      console.error(e); setErr(`${e.code ?? e.name}: ${e.message}`)
    }
  }
  async function handleSignOut() {
    setErr(null)
    try { await signOutNow() } catch (e) {
      console.error(e); setErr(`${e.code ?? e.name}: ${e.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-xl font-semibold">PoolOrder</Link>
          <nav className="ml-auto flex items-center gap-4">
            <Link to="/" className="hover:underline">Nearby</Link>
            <Link to="/create" className="hover:underline">Create</Link>
            <Link to="/mine" className="hover:underline">My Requests</Link>
            {user ? (
              <>
                <button className="px-3 py-1 rounded-lg border" onClick={handleSignOut}>Sign out</button>
                {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />}
                <span className="text-sm">{user.displayName || user.email}</span>
              </>
            ) : (
              <button className="px-3 py-1 rounded-lg border" onClick={handleSignIn}>Sign in with Google</button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>

      {err && (
        <div className="max-w-5xl mx-auto px-4">
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <strong>Error:</strong> {err}
          </div>
        </div>
      )}

      <footer className="border-t py-6 text-center text-sm text-gray-500">
        React + Tailwind v4 + Firebase (Google OAuth)
      </footer>
    </div>
  )
}
