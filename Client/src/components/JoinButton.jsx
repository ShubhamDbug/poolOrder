// src/components/JoinButton.jsx
import React from 'react'
import { idToken, listenUser, signInWithGoogle } from '@/lib/firebase'
import { joinRequest, leaveRequest, getMyMembership } from '../api.js'

export default function JoinButton({ requestId, membership = false }) {
  const [user, setUser] = React.useState(null)
  const [joined, setJoined] = React.useState(!!membership)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState(null)

  // keep user in sync
  React.useEffect(() => listenUser(setUser), [])

  // honor initial prop (e.g., SSR/parent guess); will be overwritten by server truth
  React.useEffect(() => setJoined(!!membership), [membership])

  // whenever auth user changes, fetch real membership from server so it survives logout/login & reloads
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user) { setJoined(false); return }        // signed out → show "Join"
      try {
        const token = await idToken()
        if (!token) return
        const { joined: isJoined } = await getMyMembership(requestId, token)
        if (!cancelled) setJoined(!!isJoined)
      } catch (e) {
        // ignore; the button can still toggle optimistically
        console.warn('membership check failed', e)
      }
    })()
    return () => { cancelled = true }
  }, [user, requestId])

  async function toggle() {
    if (pending) return
    setError(null)

    try {
      if (!user) {
        const u = await signInWithGoogle()
        setUser(u)
      }
      setPending(true)

      const token = await idToken()
      if (!token) throw new Error('No ID token')

      if (joined) {
        await leaveRequest(requestId, token)
      } else {
        await joinRequest(requestId, token)
      }

      // revalidate from server so UI matches DB
      try {
        const { joined: isJoined } = await getMyMembership(requestId, token)
        setJoined(!!isJoined)
      } catch {
        // fall back to optimistic flip if check fails
        setJoined((prev) => !prev)
      }
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Failed to update membership')
    } finally {
      setPending(false)
    }
  }

  const label = pending ? (joined ? 'Leaving…' : 'Joining…') : (joined ? 'Leave' : 'Join')
  const title = joined ? 'Leave this request' : 'Join this request'

  return (
    <div className="flex items-center gap-2">
      <button
        className="px-3 py-1 rounded-lg border disabled:opacity-60"
        onClick={toggle}
        disabled={pending}
        aria-busy={pending ? 'true' : 'false'}
        title={title}
      >
        {label}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  )
}
