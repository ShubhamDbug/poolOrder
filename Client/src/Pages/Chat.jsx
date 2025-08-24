// src/Pages/Chat.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/** ---- helpers: keep message shape consistent & sorted without changing your API contracts ---- */
function toMillis(v) {
  if (!v) return 0
  if (typeof v?.toMillis === 'function') return v.toMillis()               // Firestore Timestamp
  if (typeof v === 'object' && v.seconds != null)                          // {seconds,nanoseconds}
    return (v.seconds * 1000) + Math.floor((v.nanoseconds || 0) / 1e6)
  if (typeof v === 'number') return v                                       // epoch ms
  if (typeof v === 'string') {                                              // ISO string
    const t = Date.parse(v)
    return Number.isNaN(t) ? 0 : t
  }
  return 0
}

function normalizeMsg(m) {
  const created = m.createdAt ?? m.timestamp ?? m.ts ?? m.time ?? null
  return {
    id: m.id || m._id || `${m.uid || 'msg'}-${toMillis(created)}`,
    uid: m.uid ?? m.userId ?? m.authorId ?? null,
    displayName: m.displayName ?? m.name ?? m.authorName ?? 'User',
    text: m.text ?? m.message ?? '',
    createdAt: created,
    _sort: toMillis(created),
  }
}

function sortAsc(a, b) {
  return a._sort - b._sort || String(a.id).localeCompare(String(b.id))
}

export default function Chat() {
  const params = useParams()
  const requestId = params.requestId ?? params.id

  const { user, signIn } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const [messages, setMessages] = React.useState([])
  const [text, setText] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  const pollTimerRef = React.useRef(null)
  const aliveRef = React.useRef(true)

  // --- sticky-to-bottom refs/state ---
  const listRef = React.useRef(null)
  const atBottomRef = React.useRef(true)
  const firstLoadRef = React.useRef(true)

  React.useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false }
  }, [])

  // reset sticky flags when request changes
  React.useEffect(() => {
    firstLoadRef.current = true
    atBottomRef.current = true
  }, [requestId])

  function handleScroll() {
    const el = listRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    atBottomRef.current = distance < 40 // within 40px counts as "at bottom"
  }

  function scrollToBottom() {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  // auto-scroll on new messages if first load OR currently near bottom
  React.useLayoutEffect(() => {
    if (firstLoadRef.current || atBottomRef.current) {
      scrollToBottom()
      firstLoadRef.current = false
    }
  }, [messages])

  React.useEffect(() => {
    function stopPolling() {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    async function fetchOnce() {
      try {
        const data = await api.listMessages(requestId) // <== unchanged call shape
        const list = Array.isArray(data) ? data : []
        const normalized = list.map(normalizeMsg).sort(sortAsc).map(({ _sort, ...rest }) => rest)
        if (!aliveRef.current) return
        setMessages(normalized)
        setLoading(false)
      } catch {
        // keep spinner until first success; avoid toast spam
      }
    }

    function startPolling() {
      if (pollTimerRef.current) return
      fetchOnce() // immediate
      pollTimerRef.current = setInterval(fetchOnce, 3000)
    }

    // reset on request switch
    setLoading(true)
    stopPolling()

    if (!requestId) {
      setMessages([])
      setLoading(false)
      return () => stopPolling()
    }

    // Firestore realtime (prefer this if rules allow)
    const messagesRef = collection(db, 'requests', String(requestId), 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(1000)) // higher cap for long threads

    const unsub = onSnapshot(
      q,
      (snap) => {
        stopPolling() // got realtime; stop polling
        const list = snap.docs
          .map((d) => normalizeMsg({ id: d.id, ...d.data() }))
          .sort(sortAsc)
          .map(({ _sort, ...rest }) => rest)

        if (!aliveRef.current) return
        setMessages(list)
        setLoading(false)
      },
      // If permission denied / offline, fall back to backend polling
      () => {
        startPolling()
      }
    )

    // kick polling too so spinner clears even if snapshot lags
    startPolling()

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
    try {
      await api.sendMessage(requestId, t) // <== unchanged call shape
      setText('') // realtime or poller will reflect it
      // if user was reading history (scrolled up), don't force-scroll
      // they'll return to bottom naturally; if they were at bottom, effect will stick it
    } catch (e) {
      push({ type: 'error', message: String(e?.message || 'Send failed') })
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
          {/* Scrollable message list that sticks to bottom */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="space-y-2 overflow-y-auto pr-1 border rounded p-2"
            style={{
              // sensible default height if parent isn't flexing:
              maxHeight: '65vh',
              // if your page shell is flex and should fill, you can swap to: flex: 1
            }}
          >
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-2 rounded border">
                  <div className="text-xs text-gray-500">
                    {m.displayName || 'User'}
                  </div>
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
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded-lg border"
              type="submit"
              disabled={!text.trim()}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}
