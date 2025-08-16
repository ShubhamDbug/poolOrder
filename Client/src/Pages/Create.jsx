// src/Pages/Create.jsx
import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'

export default function Create() {
  const { user, signIn } = useAuth()
  const api = useApi()
  const { push } = useToast()
  const navigate = useNavigate()

  const [item, setItem] = React.useState('')
  const [platform, setPlatform] = React.useState('Swiggy')
  const [minutes, setMinutes] = React.useState(60)
  const [loc, setLoc] = React.useState(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    )
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!user) { await signIn(); return }
    if (!item.trim()) { push({ type:'error', message:'Item is required' }); return }
    if (!loc) { push({ type:'error', message:'Location not available yet' }); return }
    setSaving(true)
    try {
      await api.createRequest({ item, platform, latitude: loc.lat, longitude: loc.lng, expiresInMinutes: minutes })
      navigate('/mine')
    } catch (e) {
      push({ type:'error', message: e?.message || 'Failed to create' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Create a Request</h1>
      {!user && <p className="text-sm text-gray-500">Sign in to create a request.</p>}

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm mb-1">Item</label>
          <input className="w-full px-3 py-2 rounded border" placeholder="e.g., Chicken Biryani" value={item} onChange={e=>setItem(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Platform</label>
          <select className="w-full px-3 py-2 rounded border" value={platform} onChange={e=>setPlatform(e.target.value)}>
            <option>Swiggy</option>
            <option>Zomato</option>
            <option>Uber Eats</option>
            <option>Dunzo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Expires In (minutes)</label>
          <input type="number" min="5" max="240" className="w-32 px-3 py-2 rounded border" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border bg-black text-white disabled:opacity-50" disabled={saving}>{saving?'Creating…':'Create'}</button>
          <Link to="/" className="px-4 py-2 rounded-lg border">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
