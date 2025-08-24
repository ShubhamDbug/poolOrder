// src/Pages/Chat.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function Chat() {
  const params = useParams()
  // Keep exactly your original param logic
  const requestId = params.requestId ?? params.id

  const { user, signIn } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const [messages, setMessages] = React.useState([])
  const [text, setText] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  const pollTimerRef = React.useRef(null)

  // --- Sticky-to-bottom refs/state ---
  const listRef = React.useRef(null)
  const atBottomRef = React.useRef(true)
  const firstLoadRef = React.useRef(true)

  // --- Duplicate/Double-click guards ---
  const sendingRef = React.useRef(false)       // synchronous guard during the same tick
  const [sending, setSending] = React.useState(false) // UI disabled state
  const lastSentRef = React.useRef({ text: '', ts: 0 }) // naive dedupe window

  function handleScroll() {
    const el = listRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    atBottomRef.current = distance < 40 // near-bottom counts as bottom
  }

  function scrollToBottom() {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  // Auto-stick on first load and when already near bottom
  React.useLayoutEffect(() => {
    if (firstLoadRef.current || atBottomRef.current) {
      scrollToBottom()
      firstLoadRef.current = false
    }
  }, [messages])

  React.useEffect(() => {
    // Reset sticky flags when request changes
    firstLoadRef.current = true
    atBottomRef.current = true
  }, [requestId])

  React.useEffect(() => {
    function stopPolling() {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    async function fetchOnce() {
      // EXTRA GUARD so we never hit /api/messages without an id
      if (!requestId) return
      try {
        const data = await api.listMessages(requestId)
        setMessages(Array.isArray(data) ? data : [])
        setLoading(false)
      } catch {
        // keep spinner until first success
      }
    }

    function startPolling() {
      if (pollTimerRef.current) return
      fetchOnce() // immediate fetch, then poll
      pollTimerRef.current = setInterval(fetchOnce, 3000) // 3s cadence
    }

    // Begin: reset loading and any existing poller
    setLoading(true)
    stopPolling()

    // Guard: if no requestId, just clear and stop
    if (!requestId) {
      setMessages([])
      setLoading(false)
      return () => { stopPolling() }
    }

    // Realtime Firestore subscription
    const messagesRef = collection(db, 'requests', String(requestId), 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200))

    const unsub = onSnapshot(
      q,
      (snap) => {
        // Got realtime — ensure we are NOT polling
        stopPolling()
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
      // If rules reject / transient error: fall back to backend polling
      () => {
        startPolling()
      }
    )

    // Cleanup on unmount/request switch
    return () => {
      unsub()
      stopPolling()
    }
  }, [requestId, api])

  async function send(e) {
    e.preventDefault()
    if (!user) { await signIn(); return }

    const t = text.trim()
    if (!t) return

    // 1) Prevent concurrent sends (click spam / Enter repeat)
    if (sendingRef.current) return

    // 2) Quick duplicate guard: same text within 2s → ignore
    const now = Date.now()
    const { text: lastText, ts: lastTs } = lastSentRef.current
    if (t === lastText && (now - lastTs) < 2000) {
      return
    }

    try {
      sendingRef.current = true
      setSending(true)

      await api.sendMessage(requestId, t) // unchanged call shape
      lastSentRef.current = { text: t, ts: now }
      setText('') // realtime or poller will pick it up
    } catch (e) {
      push({ type: 'error', message: String(e?.message || 'Send failed') })
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <h1 className="text-2xl font-semibold">Chat</h1>

      {!user && (
        <p className="text-sm text-gray-500">Sign in to participate.</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading messages…</p>
      ) : (
        <>
          {/* Scrollable list that sticks to bottom unless the user scrolls up */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="space-y-2 overflow-y-auto pr-1 border rounded p-2"
            style={{ maxHeight: '65vh' }}
          >
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
              placeholder={sending ? 'Sending…' : 'Type your message…'}
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e => {
                // If a send is in-flight, block Enter from re-submitting
                if (sending && e.key === 'Enter') e.preventDefault()
              }}
              disabled={sending}
            />
            <button
              className="px-3 py-2 rounded-lg border"
              type="submit"
              disabled={sending || !text.trim()}
              aria-busy={sending ? 'true' : 'false'}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
