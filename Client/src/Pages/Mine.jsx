import React from 'react'
import { Link } from 'react-router-dom'
import { myRequests, closeRequest, deleteRequest } from '../api.js'
import { idToken, listenUser } from '@/lib/firebase'

export default function Mine() {
  const [user, setUser] = React.useState(null)
  const [list, setList] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [deletingId, setDeletingId] = React.useState(null)

  React.useEffect(() => listenUser(setUser), [])

  React.useEffect(() => {
    (async () => {
      setError('')
      if (!user) {
        setList([])
        return
      }
      try {
        setLoading(true)
        const token = await idToken()
        const data = await myRequests(token)
        setList(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e?.message || 'Failed to load your requests')
        setList([])
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  async function handleClose(id) {
    try {
      const token = await idToken()
      await closeRequest(id, token)
      // Optimistically mark closed so the button hides immediately
      setList(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, deleteAt: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 } }
            : r
        )
      )
    } catch (e) {
      setError(e?.message || 'Failed to close request')
    }
  }

  async function handleDelete(id) {
    try {
      setDeletingId(id)
      const token = await idToken()
      await deleteRequest(id, token)
      // Remove from UI list
      setList(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      setError(e?.message || 'Failed to delete request')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Requests</h2>
        <Link to="/create" className="px-3 py-1 rounded-lg border">New</Link>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(r => {
          const isClosed = ((r.deleteAt?._seconds ?? 0) * 1000) <= Date.now()
          return (
            <div key={r.id} className="p-4 rounded-2xl border bg-white shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">🛒 {r.item}</div>
                  <div className="text-sm text-gray-500">Platform: {r.platform}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    Status: {isClosed ? 'closed' : 'open'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">By {r.displayName || 'User'}</div>
              <div className="flex gap-2 mt-auto">
                <Link className="px-3 py-1 rounded-lg border" to={`/chat/${r.id}`}>Open Chat</Link>
                {!isClosed && (
                  <button className="px-3 py-1 rounded-lg border" onClick={() => handleClose(r.id)}>
                    Close
                  </button>
                )}
                {isClosed && (
                  <button
                    className="px-3 py-1 rounded-lg border text-rose-600 border-rose-300"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    title="Deletes this closed request permanently"
                  >
                    {deletingId === r.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!loading && list.length === 0 && (
        <p className="text-sm text-gray-500">You have no requests yet.</p>
      )}
    </div>
  )
}
