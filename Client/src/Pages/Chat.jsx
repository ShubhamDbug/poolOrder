// src/Pages/Chat.jsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function Chat() {
  const params = useParams()
  const requestId = params.requestId ?? params.id

  const { user, signIn } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const [messages, setMessages] = React.useState([])
  const [text, setText] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [needsJoin, setNeedsJoin] = React.useState(false)

  async function load() {
    if (!requestId) return
    setLoading(true)
    try {
      const data = await api.listMessages(requestId)
      setMessages(data || [])
    } catch (e) {
      const msg = String(e?.message || 'Error')
      if (/Join required/i.test(msg) || /401|403/.test(msg)) setNeedsJoin(true)
      else push({ type:'error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [requestId])

  async function send(e) {
    e.preventDefault()
    if (!user) { await signIn(); return }
    const t = text.trim()
    if (!t) return
    try {
      await api.sendMessage(requestId, t)
      setText('')
      await load()
    } catch (e) {
      const msg = String(e?.message || 'Send failed')
      if (/Join required/i.test(msg)) setNeedsJoin(true)
      else push({ type:'error', message: msg })
    }
  }

  async function join() {
    if (!user) { await signIn(); return }
    try { await api.joinRequest(requestId); setNeedsJoin(false); await load() }
    catch (e) { push({ type:'error', message: e?.message || 'Join failed' }) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Chat</h1>

      {!user && (
        <p className="text-sm text-gray-500">Sign in to participate.</p>
      )}

      {needsJoin ? (
        <div className="p-3 rounded-lg border">
          <p className="text-sm mb-2">You need to join this request to view and send messages.</p>
          <button className="px-3 py-1 rounded border" onClick={join}>Join request</button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {messages.map(m => (
              <div key={m.id} className="p-2 rounded border">
                <div className="text-xs text-gray-500">{m.displayName || 'User'}</div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>

          <form className="flex items-center gap-2" onSubmit={send}>
            <input className="flex-1 px-3 py-2 rounded border" placeholder="Type your message…" value={text} onChange={e=>setText(e.target.value)} />
            <button className="px-3 py-2 rounded-lg border" type="submit" disabled={!text.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}
