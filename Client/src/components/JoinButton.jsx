// src/components/JoinButton.jsx
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'

export default function JoinButton({ requestId, membership = false }) {
  const { user, signIn } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const [joined, setJoined] = React.useState(!!membership)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => setJoined(!!membership), [membership])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!requestId || !user) return
      try {
        const m = await api.getMyMembership(requestId)
        if (mounted) setJoined(!!m?.active)
      } catch {}
    })()
    return () => { mounted = false }
  }, [requestId, user, api])

  async function toggle() {
    if (!user) {
      await signIn().catch(()=>{})
      return
    }
    setPending(true)
    try {
      if (joined) { await api.leaveRequest(requestId); setJoined(false) }
      else { await api.joinRequest(requestId); setJoined(true) }
    } catch (e) {
      push({ type:'error', message: e?.message || 'Action failed' })
    } finally {
      setPending(false)
    }
  }

  const label = joined ? 'Leave' : 'Join'
  const title = joined ? 'You have joined; click to leave' : 'Join this request'

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
    </div>
  )
}
