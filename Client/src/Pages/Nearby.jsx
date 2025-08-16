// src/Pages/Nearby.jsx
import React from 'react'
import RequestCard from '@/components/RequestCard.jsx'
import JoinButton from '@/components/JoinButton.jsx'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { approxMeters, formatMetres } from '@/utils/distance'

export default function Nearby() {
  const { user } = useAuth()
  const api = useApi()
  const { push } = useToast()

  const [radiusKm, setRadiusKm] = React.useState(50)
  const [items, setItems] = React.useState([])
  const [loc, setLoc] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!navigator.geolocation) { push({ type: 'error', message: 'Geolocation unsupported' }); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLoc(null)
        push({ type: 'warning', message: 'Location denied' })
      }
    )
  }, [push])

  React.useEffect(() => {
    // fetch nearby items when we have a location and radius
    if (!loc) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        // ✅ optional server-side hint; server may ignore it. Client-side guard still applied below.
        const list = await api.nearby({  lat: loc.lat, lng: loc.lng, radiusKm, excludeUid: user?.uid })
        if (!cancelled) setItems(list ?? [])
      } catch (e) {
        if (!cancelled) push({ type: 'error', message: 'Failed to load nearby requests' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [loc, radiusKm, api, push])

  // Compute distance (in metres) from user location to each request; memoized for performance
  // ✅ IMPORTANT: first filter OUT own requests, then compute distances (and any ordering you may add later)
  const itemsWithDistance = React.useMemo(() => {
    if (!Array.isArray(items)) return []
    // Filter out own requests first (client-side guard)
    const base = (user?.uid ? items.filter(r => r?.uid !== user.uid) : items)

    if (!loc || typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') {
      // Location unavailable or not ready: carry items with no distances
      return base.map(r => ({ ...r, __distance: null }))
    }
    const { lat: uLat, lng: uLng } = loc
    return base.map(r => {
      const hasCoords = typeof r?.lat === 'number' && typeof r?.lng === 'number'
      const m = hasCoords ? approxMeters(uLat, uLng, r.lat, r.lng) : null
      return { ...r, __distance: m }
    })
  }, [items, loc, user?.uid])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm">Radius:</label>
        <select
          className="select select-bordered select-sm"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
        >
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={25}>25 km</option>
          <option value={50}>50 km</option>
          <option value={100}>100 km</option>
        </select>
      </div>

      <div className="space-y-3">
        {itemsWithDistance.map(r => (
          <RequestCard
            key={r.id}
            r={r}
            rightSlot={
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500">
                  {loc && typeof r.__distance === 'number'
                    ? formatMetres(r.__distance)
                    : (loc ? '—' : 'Location unavailable')}
                </span>
                <JoinButton requestId={r.id} />
              </div>
            }
          />
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500 mt-2">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">No requests around you yet.</p>
      )}
    </div>
  )
}
