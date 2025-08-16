import React from 'react'
import { createRequest } from '../api.js'
import { idToken, listenUser, login } from '@/lib/firebase'
import { useNavigate, Link } from 'react-router-dom'

export default function Create() {
  const [user, setUser] = React.useState(null)
  React.useEffect(()=> listenUser(setUser), [])
  const navigate = useNavigate()
  const [item, setItem] = React.useState('')
  const [platform, setPlatform] = React.useState('Swiggy')
  const [minutes, setMinutes] = React.useState(60)
  const [loc, setLoc] = React.useState({ lat:'', lng:'' })
  const [saving, setSaving] = React.useState(false)
  const [err, setErr] = React.useState('')

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => {
        setLoc({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) })
      })
    }
  }, [])

  if (!user) return <div className="p-4 rounded-xl border bg-white">
    Please <button className="underline" onClick={login}>sign in</button> to create a request.
  </div>

  async function submit(e) {
    e.preventDefault(); setErr(''); setSaving(true)
    try {
      const token = await idToken()
      const payload = {
        item, platform,
        latitude: Number(loc.lat), longitude: Number(loc.lng),
        expiresInMinutes: Number(minutes)
      }
      const created = await createRequest(payload, token,)
      navigate(`/chat/${created.id}`)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Create a Pool Request</h2>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm mb-1">Item</label>
          <input className="w-full border rounded-lg px-3 py-2" value={item} onChange={e=>setItem(e.target.value)} placeholder="e.g. Paneer Butter Masala" />
        </div>
        <div>
          <label className="block text-sm mb-1">Platform</label>
          <select className="w-full border rounded-lg px-3 py-2" value={platform} onChange={e=>setPlatform(e.target.value)}>
            <option>Swiggy</option><option>Zomato</option><option>Blinkit</option><option>Zepto</option><option>Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Latitude</label>
            <input className="w-full border rounded-lg px-3 py-2" value={loc.lat} onChange={e=>setLoc(v=>({...v, lat:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Longitude</label>
            <input className="w-full border rounded-lg px-3 py-2" value={loc.lng} onChange={e=>setLoc(v=>({...v, lng:e.target.value}))} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Expires In (minutes)</label>
          <input type="number" min="5" max="240" className="w-full border rounded-lg px-3 py-2" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/>
        </div>
        {err && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{err}</div>}
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border bg-black text-white" disabled={saving}>{saving?'Creating…':'Create'}</button>
          <Link to="/" className="px-4 py-2 rounded-lg border">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
