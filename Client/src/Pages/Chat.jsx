// src/Pages/Chat.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function Chat() {
  // Hooks — always called, in the same order
  const params = useParams()
  const requestId = params.requestId ?? params.id

  const { user, signIn } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const [messages, setMessages] = React.useState([])
  const [text, setText] = React.useState('')
  const [loading, setLoading] = React.useState(true) // start with spinner

  // Polling fallback state (no useCallback)
  const pollTimerRef = React.useRef(null)
  const retryCountRef = React.useRef(0)

  React.useEffect(() => {
    // Cleanup helpers live inside the effect to avoid extra hooks
    function stopPolling() {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    async function fetchOnce() {
      try {
        const data = await api.listMessages(requestId)
        setMessages(Array.isArray(data) ? data : [])
        setLoading(false)
      } catch (e) {
        // keep spinner until first success; avoid toast spam
        // console.warn('[chat:poll] listMessages failed:', e?.message || e)
      }
    }

    function startPolling() {
      if (pollTimerRef.current) return
      // immediate fetch, then poll
      fetchOnce()
      pollTimerRef.current = setInterval(fetchOnce, 3000) // 3s cadence
    }

    // Begin: reset loading and any existing poller
    setLoading(true)
    stopPolling()
    retryCountRef.current = 0

    // Guard: if no requestId, just clear and stop
    if (!requestId) {
      setMessages([])
      setLoading(false)
      return () => {
        stopPolling()
      }
    }

    // Realtime Firestore subscription
    const messagesRef = collection(db, 'requests', String(requestId), 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200))

    const unsub = onSnapshot(
      q,
      (snap) => {
        stopPolling()
        retryCountRef.current = 0
        const list = snap.docs.map((d) => {
          const data = d.data() || {}
          return {
            id: d.id,
            uid: data.uid,
            displayName: data.displayName,
            text: data.text,
          }
        })
        setMessages(list)
        setLoading(false)
      },
      (err) => {
        // If rules reject (permission-denied), or other transient errors:
        // fall back to backend polling; keep spinner until first successful fetch
        // console.error('[chat:onSnapshot]', err?.code || err?.message || err)
        startPolling()
      }
    )

    // Cleanup on unmount/request switch
    return () => {
      unsub()
      stopPolling()
    }
  }, [requestId, api]) // deps kept minimal and stable in most setups

  async function send(e) {
    e.preventDefault()
    if (!user) { await signIn(); return }
    const t = text.trim()
    if (!t) return
    try {
      await api.sendMessage(requestId, t)
      setText('') // realtime or poller will pick it up
    } catch (e) {
      push({ type:'error', message: String(e?.message || 'Send failed') })
    }
  }

  // No early returns above — hooks already ran.
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Chat</h1>

      {!user && (
        <p className="text-sm text-gray-500">Sign in to participate.</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading messages…</p>
      ) : (
        <>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet</p>
            ) : (
              messages.map(m => (
                <div key={m.id} className="p-2 rounded border">
                  <div className="text-xs text-gray-500">{m.displayName || 'User'}</div>
                  <div>{m.text}</div>
                </div>
              ))
            )}
          </div>

          <form className="flex items-center gap-2" onSubmit={send}>
            <input
              className="flex-1 px-3 py-2 rounded border"
              placeholder="Type your message…"
              value={text}
              onChange={e=>setText(e.target.value)}
            />
            <button className="px-3 py-2 rounded-lg border" type="submit" disabled={!text.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}
