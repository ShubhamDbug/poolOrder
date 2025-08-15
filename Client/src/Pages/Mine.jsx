import React from 'react'
import { myRequests, closeRequest } from '../api.js'
import { idToken, listenUser } from '@/lib/firebase'
import { Link } from 'react-router-dom'

export default function Mine() {
  const [user, setUser] = React.useState(null)
  const [list, setList] = React.useState([])
  React.useEffect(()=> listenUser(setUser), [])
  React.useEffect(() => { (async () => {
    if (!user) return setList([])
    const token = await idToken()
    const data = await myRequests(token)
    setList(data)
  })() }, [user])

  async function close(id) {
    const token = await idToken()
    await closeRequest(id, token)
    setList(prev => prev.map(x => x.id===id ? { ...x, status:'closed' } : x))
  }

  if (!user) return <div className="p-4 rounded-xl border bg-white">Please sign in to view your requests.</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">My Requests</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(r => (
          <div key={r.id} className="p-4 rounded-2xl border bg-white shadow-sm space-y-2">
            <div className="font-semibold">🛒 {r.item}</div>
            <div className="text-sm text-gray-500">Platform: {r.platform}</div>
            <div className="text-sm">Status: {r.status}</div>
            <div className="flex gap-2">
              <Link to={`/chat/${r.id}`} className="px-3 py-1 rounded-lg border">Open Chat</Link>
              {r.status!=='closed' && <button className="px-3 py-1 rounded-lg border" onClick={()=>close(r.id)}>Close</button>}
            </div>
          </div>
        ))}
      </div>
      {list.length===0 && <p className="text-sm text-gray-500">You have no requests yet.</p>}
    </div>
  )
}
