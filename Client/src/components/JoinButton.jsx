// src/components/JoinButton.jsx
import React from 'react'
import { idToken, listenUser, signInWithGoogle } from '@/lib/firebase'
import { joinRequest, leaveRequest } from '../api.js'

export default function JoinButton({ requestId, membership = false }) {
  const [user, setUser] = React.useState(null)
  const [joined, setJoined] = React.useState(!!membership)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState(null)

  React.useEffect(() => listenUser(setUser), [])
  React.useEffect(() => setJoined(!!membership), [membership])

  async function toggle() {
    if (pending) return
    setError(null)

    try {
      if (!user) await signInWithGoogle()
      setPending(true)

      const token = await idToken()
      if (!token) throw new Error('No ID token')

      if (joined) {
        await leaveRequest(requestId, token)
        setJoined(false)
      } else {
        await joinRequest(requestId, token)
        setJoined(true)
      }
    } catch (e) {
      console.error(e)
      // If your api.js surfaces status, you can branch on e.status === 401/403
      setError(e?.message || 'Failed to update membership')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="px-3 py-1 rounded-lg border disabled:opacity-60"
        onClick={toggle}
        disabled={pending}
        aria-busy={pending ? 'true' : 'false'}
        title={joined ? 'Leave this request' : 'Join this request'}
      >
        {pending ? (joined ? 'Leaving…' : 'Joining…') : (joined ? 'Leave' : 'Join')}
      </button>
      {error && (
        <span className="text-xs text-rose-600">{error}</span>
      )}
    </div>
  )
}
