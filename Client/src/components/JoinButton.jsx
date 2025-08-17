// src/components/JoinButton.jsx
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'

export default function JoinButton({ requestId, membership = false }) {
  const { user, signIn } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const storageKey = requestId ? `joined:${requestId}` : null
  const [loading, setLoading] = React.useState(true)  // Added loading state
  const initialFromStorage = () => {
    if (!storageKey) return !!membership
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw === 'true') return true
      if (raw === 'false') return false
    } catch {}
    return !!membership
  }

  const [joined, setJoined] = React.useState(initialFromStorage)
  const [pending, setPending] = React.useState(false)


  // Fetch server state immediately on mount if user is present
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!requestId || !user) {
        if (mounted) setLoading(false)
        return
      }
      try {
        const m = await api.getMyMembership(requestId)
        if (mounted) {
          setJoined(!!m?.joined)
          // Update localStorage with authoritative server state
          if (storageKey) {
            localStorage.setItem(storageKey, m?.joined ? 'true' : 'false')
          }
        }
      } catch (e) {
        console.warn('Failed to fetch membership:', e?.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [requestId, user, api, storageKey])

  async function toggle() {
    if (!user) {
      try {
        await signIn()
      } catch {
        return
      }
  // continue after sign-in, ensure user present
  if (!window) return
  // wait briefly for auth state to propagate and then refresh membership
  await new Promise(r => setTimeout(r, 250))
  try { const m = await api.getMyMembership(requestId); setJoined(!!m?.active) } catch {}
    }
    setPending(true)
    try {
      if (joined) {
        await api.leaveRequest(requestId);
        setJoined(false);
        if (storageKey) localStorage.setItem(storageKey, 'false')
      } else {
        await api.joinRequest(requestId);
        setJoined(true);
        if (storageKey) localStorage.setItem(storageKey, 'true')
      }
    } catch (e) {
      push({ type:'error', message: e?.message || 'Action failed' })
      // On error, refresh from server to ensure UI is correct
      try {
        const m = await api.getMyMembership(requestId)
        setJoined(!!m?.joined)
        if (storageKey) localStorage.setItem(storageKey, m?.joined ? 'true' : 'false')
      } catch {}
    } finally {
      setPending(false)
    }
  }

  const label = joined ? 'Leave' : 'Join'
  const title = joined ? 'You have joined; click to leave' : 'Join this request'

  return (
    <div className="flex items-center gap-2">
      <button
        className={`px-3 py-1 rounded-lg border ${loading ? 'opacity-50' : ''} disabled:opacity-60`}
        onClick={toggle}
        disabled={loading || pending}
        aria-busy={pending ? 'true' : 'false'}
        title={title}
      >
        {loading ? '...' : label}
      </button>
    </div>
  )
}
