// src/components/Shell.jsx
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function Shell({ children }) {
  const { user, loading, signIn, signOut } = useAuth()
  const { push } = useToast()

  async function handleSignIn() {
    try { await signIn() } catch (e) { push({ type:'error', message: e?.message || 'Sign-in failed' }) }
  }
  async function handleSignOut() {
    try { await signOut() } catch (e) { push({ type:'error', message: e?.message || 'Sign-out failed' }) }
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
                <span className="text-sm text-gray-600">Hi, {user.displayName || 'User'}</span>
                <button className="px-3 py-1 rounded-lg border" onClick={handleSignOut}>Sign out</button>
              </>
            ) : (
              <button className="px-3 py-1 rounded-lg border" onClick={handleSignIn} disabled={loading}>
                {loading ? '...' : 'Sign in with Google'}
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

      <footer className="border-t py-6 text-center text-sm text-gray-500">
        React + Tailwind v4 + Firebase (Google OAuth)
      </footer>
    </div>
  )
}
