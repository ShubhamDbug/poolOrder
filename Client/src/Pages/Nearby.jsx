import React from 'react'
import RequestCard from '../components/RequestCard.jsx'
import { nearby } from '../api.js'
import JoinButton from '../components/JoinButton.jsx'

export default function Nearby() {
  const [radiusKm, setRadiusKm] = React.useState(1)
  const [items, setItems] = React.useState([])
  const [loc, setLoc] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => { refresh() }, [])
  React.useEffect(() => { if (loc) refresh(true) }, [radiusKm])

  function getLocation() {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        _ => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  async function refresh(skipLoc) {
    setLoading(true)
    const here = skipLoc ? loc : (await getLocation())
    setLoc(here)
    if (here) {
      const list = await nearby(here.lat, here.lng, radiusKm)
      setItems(list)
    } else {
      setItems([])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Nearby Requests</h2>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">Radius: {radiusKm} km</label>
          <input type="range" min="1" max="5" value={radiusKm} onChange={e=>setRadiusKm(Number(e.target.value))}/>
          <button className="px-3 py-1 rounded-lg border" onClick={()=>refresh(false)}>Refresh</button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(r => (
          <RequestCard key={r.id} r={r} rightSlot={<JoinButton requestId={r.id} />} />
        ))}
      </div>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && items.length===0 && <p className="text-sm text-gray-500">No requests around you yet.</p>}
    </div>
  )
}
