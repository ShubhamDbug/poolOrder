// src/components/Shell.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
// Optional icons (remove if you didn’t install lucide-react)
import { Home, Plus, User } from 'lucide-react'


export default function Shell({ children }) {
const { user, loading, signIn, signOut } = useAuth()
const { push } = useToast()


async function handleSignIn() {
try { await signIn() } catch (e) { push({ type:'error', message: e?.message || 'Sign-in failed' }) }
}
async function handleSignOut() {
try { await signOut() } catch (e) { push({ type:'error', message: e?.message || 'Sign-out failed' }) }
}


const linkBase = 'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium';
const linkActive = 'bg-gray-900 text-white shadow-sm';
const linkIdle = 'text-gray-700 hover:bg-gray-100';


return (
<div className="min-h-dvh flex flex-col">
{/* Top bar */}
<header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-[env(safe-area-inset-top)] w-full">
  <div className="w-full px-3 sm:px-4">
    {/* top bar */}
    <div className="flex items-center justify-between gap-2 py-2 sm:h-16 sm:py-0">
      <div className="flex items-center gap-3">
        <span className="font-semibold tracking-tight">PoolOrder</span>
      </div>

      <div className="flex items-center gap-2">
        {loading ? (
          <div className="animate-pulse h-9 w-24 rounded-xl bg-gray-200" />
        ) : user ? (
          <>
            <span className="hidden sm:inline text-sm text-gray-600">
              Hi, {user.displayName || 'user'}
            </span>
            <button onClick={handleSignOut} className="rounded-xl px-3 py-2 text-sm font-medium">
              Sign out
            </button>
          </>
        ) : (
          <button onClick={handleSignIn} className="rounded-xl px-3 py-2 text-sm font-medium">
            Sign in
          </button>
        )}
      </div>
    </div>

    {/* full-width nav: equal tabs; icon-only on mobile, icon+text on sm+ */}
    <nav className="grid grid-cols-3 gap-2 pb-2 sm:pb-3 w-full">
      <NavLink
        to="/"
        end
        aria-label="Nearby"
        className={({ isActive }) =>
          `w-full h-10 sm:h-11 flex items-center justify-center gap-0 sm:gap-2 rounded-xl text-xs sm:text-sm ${linkBase} ${
            isActive ? linkActive : linkIdle
          }`
        }
      >
        <Home className="size-5 sm:size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Nearby</span>
      </NavLink>

      <NavLink
        to="/create"
        aria-label="Create"
        className={({ isActive }) =>
          `w-full h-10 sm:h-11 flex items-center justify-center gap-0 sm:gap-2 rounded-xl text-xs sm:text-sm ${linkBase} ${
            isActive ? linkActive : linkIdle
          }`
        }
      >
        <Plus className="size-5 sm:size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Create</span>
      </NavLink>

      <NavLink
        to="/mine"
        aria-label="Mine"
        className={({ isActive }) =>
          `w-full h-10 sm:h-11 flex items-center justify-center gap-0 sm:gap-2 rounded-xl text-xs sm:text-sm ${linkBase} ${
            isActive ? linkActive : linkIdle
          }`
        }
      >
        <User className="size-5 sm:size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Mine</span>
      </NavLink>
    </nav>
  </div>
</header>


{/* Page content */}
<main className="container-padded py-6 flex-1 w-full">{children}</main>


<footer className="border-t py-8 pb-[env(safe-area-inset-bottom)]">
<div className="container-padded text-center text-sm text-gray-500">
React • Tailwind v4 • Firebase
</div>
</footer>
</div>
)
}