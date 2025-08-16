// Client/src/Pages/Chat.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { listMessages, sendMessage, joinRequest } from '../api.js'
import { listenUser, idToken } from '@/lib/firebase'

export default function Chat() {
  const params = useParams()
  const requestId = params.requestId ?? params.id

  const [user, setUser] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [text, setText] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [needsJoin, setNeedsJoin] = React.useState(false)

  // Keep Firebase auth state in sync
  React.useEffect(() => listenUser(setUser), [])

  async function loadMessages() {
    if (!user) {
      setMessages([])
      setNeedsJoin(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = await idToken()
      const list = await listMessages(requestId, token)
      setMessages(Array.isArray(list) ? list : [])
      setNeedsJoin(false)
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('join required')) {
        setNeedsJoin(true)
      } else {
        setError(e?.message || 'Failed to load chat')
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (user) loadMessages()
    else {
      setMessages([])
      setNeedsJoin(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, requestId])

  async function handleJoin() {
    setError('')
    try {
      const token = await idToken()
      await joinRequest(requestId, token)
      await loadMessages()
    } catch (e) {
      setError(e?.message || 'Failed to join')
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    try {
      const token = await idToken();
      await sendMessage(requestId,user, text, token)
      setText('')
      await loadMessages()
    } catch (e) {
      setError(e?.message || 'Failed to send')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-4">Chat</h2>

      {!user && (
        <div className="p-3 rounded-lg border bg-white text-sm text-gray-600">
          Sign in to view this chat.
        </div>
      )}

      {user && needsJoin && (
        <div className="p-3 rounded-lg border bg-amber-50 text-amber-800 text-sm mb-3">
          You need to{' '}
          <button className="underline" onClick={handleJoin}>
            join this request
          </button>{' '}
          to view messages.
        </div>
      )}

      {error && !needsJoin && (
        <div className="p-3 rounded-lg border bg-rose-50 text-rose-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {user && !needsJoin && (
        <>
          <div className="space-y-2 mb-4">
            {messages.map((m) => {
              const mine = m.uid === user?.uid
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={[
                      'max-w-[80%] rounded-2xl px-3 py-2 border',
                      mine ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200',
                    ].join(' ')}
                  >
                    {/* Name on top of EVERY message */}
                    <div className="text-xs text-gray-500 mb-1">
                      {mine ? (user?.displayName || 'You') : (m.displayName || 'User')}
                    </div>

                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  </div>
                </div>
              )
            })}

            {loading && <div className="text-sm text-gray-500">Loading…</div>}
            {!loading && messages.length === 0 && (
              <div className="text-sm text-gray-500">No messages yet.</div>
            )}
          </div>

          <form className="flex gap-2" onSubmit={handleSend}>
            <input
              className="flex-1 rounded-lg border px-3 py-2"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded-lg border"
              type="submit"
              disabled={!text.trim()}
              title={!text.trim() ? 'Type a message first' : 'Send'}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}
