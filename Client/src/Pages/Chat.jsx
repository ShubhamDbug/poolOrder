import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { listMessages, sendMessage, joinRequest } from '../api.js'
import { idToken, listenUser, signInWithGoogle } from '@/lib/firebase' // <- Google-only

export default function Chat() {
  const { id } = useParams()
  const [user, setUser] = React.useState(null)
  const [messages, setMessages] = React.useState([])
  const [text, setText] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [error, setError] = React.useState(null)

  const boxRef = React.useRef(null)
  const pollingRef = React.useRef(null)
  const inFlightRef = React.useRef(false)

  React.useEffect(() => listenUser(setUser), [])

  const load = React.useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const list = await listMessages(id)
      setMessages(list)
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Failed to load messages')
    } finally {
      inFlightRef.current = false
    }
  }, [id])

  React.useEffect(() => {
    load()
    pollingRef.current = setInterval(load, 3000)
    return () => clearInterval(pollingRef.current)
  }, [load])

  React.useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  async function send(e) {
    e.preventDefault()
    setError(null)

    const body = text.trim().slice(0, 400)
    if (!body) return

    try {
      if (!user) await signInWithGoogle()
      setIsSending(true)
      const token = await idToken()
      await sendMessage(id, body, token)
      setText('')
      await load()
    } catch (e) {
      console.error(e)
      const msg = e?.message || 'Failed to send'
      setError(msg)
      // If backend enforces membership, you may get 403 here:
      if (String(msg).includes('403') || String(msg).toLowerCase().includes('member')) {
        setError('Join this request to chat. Use the Join button on the request.')
      }
    } finally {
      setIsSending(false)
    }
  }

  async function quickJoin() {
    try {
      if (!user) await signInWithGoogle()
      const token = await idToken()
      await joinRequest(id, token)
      setError(null)
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Failed to join')
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-4 border rounded-2xl bg-white">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">Group Chat</div>
          <Link className="text-sm text-blue-600" to="/">Back</Link>
        </div>

        <div
          ref={boxRef}
          className="h-[50vh] overflow-auto flex flex-col gap-2 p-2 border rounded-xl bg-gray-50"
        >
          {messages.map(m => (
            <div
              key={m.id}
              className={`max-w-[85%] p-2 rounded-xl ${
                m.uid === user?.uid ? 'self-end bg-blue-100' : 'self-start bg-white border'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">{m.displayName || 'User'}</div>
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">No messages yet.</div>
          )}
        </div>

        <form onSubmit={send} className="mt-3 flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message"
            maxLength={400}
            disabled={isSending}
          />
          <button
            className="px-4 py-2 rounded-lg border bg-black text-white disabled:opacity-60"
            disabled={isSending}
          >
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <strong>Error:</strong> {error}{' '}
            {error.includes('Join this request') && (
              <button
                onClick={quickJoin}
                className="ml-2 px-2 py-0.5 rounded border text-rose-800"
              >
                Join now
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border rounded-2xl bg-white space-y-2">
        <div className="font-semibold">Request</div>
        <p className="text-sm text-gray-500">
          Request details are available in Nearby/Mine. You must join a request to chat.
        </p>
        <button onClick={quickJoin} className="mt-2 px-3 py-1 rounded-lg border">
          Join this request
        </button>
      </div>
    </div>
  )
}
