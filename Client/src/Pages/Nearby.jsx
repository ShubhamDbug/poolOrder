import React from 'react'
import { Link } from 'react-router-dom'
import RequestCard from '../components/RequestCard.jsx'
import JoinButton from '../components/JoinButton.jsx'
import { nearby } from '../api.js'
import { listenUser, idToken } from '@/lib/firebase'

export default function Nearby() {
  const [user, setUser] = React.useState(null)
  const [radiusKm, setRadiusKm] = React.useState(50)
  const [items, setItems] = React.useState([])
  const [loc, setLoc] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => listenUser(setUser), [])

  function getLocation() {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      )
    })
  }

  async function refresh(useExistingLoc = false) {
    if (!user) {
      setItems([])
      setLoc(null)
      setError('')
      setLoading(false)
      return
    }
    setLoading(true); setError('')
    try {
      const position = useExistingLoc ? loc : await getLocation()
      if (!position) {
        setItems([]); setLoc(null); setLoading(false)
        setError('Location unavailable. Please enable location and try again.')
        return
      }
      setLoc(position)

      const token = await idToken()
      const data = await nearby(position.lat, position.lng, radiusKm, token)

      // Client-side safety: hide my own requests even if server forgets
      const uid = user?.uid
      const filtered = Array.isArray(data) ? data.filter(r => r.uid !== uid) : []
      setItems(filtered)
    } catch (e) {
      setError(e?.message || 'Failed to load nearby')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Initial load only when user becomes available
  React.useEffect(() => {
    if (user) refresh(false)
    else { setItems([]); setLoc(null); setError('') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Radius change
  React.useEffect(() => {
    if (user && loc) refresh(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm])

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Nearby</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm">Radius: {radiusKm} m</label>
          <input
            type="range"
            min="100"
            max="900"
            value={radiusKm}
            onChange={e => setRadiusKm(Number(e.target.value))}
          />
          <button className="px-3 py-1 rounded-lg border" onClick={() => refresh(false)}>
            Refresh
          </button>
        </div>
      </div>

      {!user && (
        <div className="p-4 rounded-xl border bg-white text-sm text-gray-600">
          Please <Link className="underline" to="/">sign in</Link> to see nearby requests.
        </div>
      )}

      {user && (
        <>
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(r => (
              <RequestCard key={r.id} r={r} rightSlot={<JoinButton requestId={r.id} />} />
            ))}
          </div>

          {loading && <p className="text-sm text-gray-500 mt-2">Loading…</p>}
          {!loading && items.length === 0 && !error && (
            <p className="text-sm text-gray-500 mt-2">No requests around you yet.</p>
          )}
        </>
      )}
    </div>
  )
}
