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
<header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
<div className="container-padded h-16 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="size-8 rounded-xl bg-indigo-600"></div>
<span className="font-semibold tracking-tight">PoolOrder</span>
</div>


<nav className="flex items-center gap-2">
<NavLink to="/" end className={({isActive}) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
<Home className="size-4" /> Nearby
</NavLink>
<NavLink to="/create" className={({isActive}) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
<Plus className="size-4" /> Create
</NavLink>
<NavLink to="/mine" className={({isActive}) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
<User className="size-4" /> Mine
</NavLink>
</nav>


<div className="flex items-center gap-2">
{loading ? (
<div className="animate-pulse h-9 w-24 rounded-xl bg-gray-200" />
) : user ? (
<>
<span className="hidden sm:inline text-sm text-gray-600">Hi, {user.displayName || 'user'}</span>
<button onClick={handleSignOut}>Sign out</button>
</>
) : (
<button onClick={handleSignIn}>Sign in</button>
)}
</div>
</div>
</header>


{/* Page content */}
<main className="container-padded py-6 flex-1 w-full">{children}</main>


<footer className="border-t py-8">
<div className="container-padded text-center text-sm text-gray-500">
React • Tailwind v4 • Firebase
</div>
</footer>
</div>
)
}