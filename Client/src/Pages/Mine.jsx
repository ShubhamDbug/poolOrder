// src/Pages/Mine.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Mine() {
  const { user } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const [list, setList] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await api.myRequests()
        if (!cancelled) setList(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) push({ type: 'error', message: 'Failed to load your requests' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [api, push])

  async function closeReq(id) {
    try {
      await api.closeRequest(id)
      setList(prev => prev.map(r => r.id === id ? { ...r, closed: true, status: 'closed' } : r))
      push({ type: 'success', message: 'Request closed' })
    } catch {
      push({ type: 'error', message: 'Failed to close request' })
    }
  }

  async function delReq(id) {
    try {
      setDeletingId(id)
      await api.deleteRequest(id)
      setList(prev => prev.filter(r => r.id !== id))
      push({ type: 'success', message: 'Request deleted' })
    } catch {
      push({ type: 'error', message: 'Failed to delete request' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">My Requests</h2>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="space-y-3">
        {list.map(r => (
          <div key={r.id} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.item} <span className="text-xs text-gray-500">({r.platform})</span></div>
                <div className="text-xs text-gray-500">Status: {r.status || (r.closed ? 'closed' : 'open')}</div>
                {/* ✅ Chat entry per item */}
                <Link to={`/chat/${r.id}`} className="text-sm underline">Chat</Link>
              </div>
              <div className="flex items-center gap-2">
                {!r.closed && <button className="px-3 py-1 rounded border" onClick={()=>closeReq(r.id)}>Close</button>}
                <button className="px-3 py-1 rounded border" onClick={()=>delReq(r.id)} disabled={deletingId===r.id}>
                  {deletingId===r.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && list.length === 0 && (
        <p className="text-sm text-gray-500">You have no requests yet.</p>
      )}
    </div>
  )
}
