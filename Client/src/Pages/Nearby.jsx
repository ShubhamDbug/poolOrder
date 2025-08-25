// src/Pages/Nearby.jsx
import React from 'react'
import RequestCard from '@/components/RequestCard.jsx'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { approxMeters, formatMetres } from '@/utils/distance'
import { useNavigate } from 'react-router-dom'

export default function Nearby() {
  const { user } = useAuth()
  const api = useApi()
  const { push } = useToast()
  const navigate = useNavigate()

  // Radius tracked in METRES for UI; converted to km for API
  const [radiusM, setRadiusM] = React.useState(800)

  const [items, setItems] = React.useState([])
  const [loc, setLoc] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  // Popup states for location permission
  const [showLocModal, setShowLocModal] = React.useState(false)
  const [locError, setLocError] = React.useState('')

  const requestLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLoc(null)
      setLocError('Geolocation is not supported by this browser.')
      setShowLocModal(true)
      push({ type: 'error', message: 'Geolocation unsupported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocError('')
        setShowLocModal(false)
      },
      (err) => {
        setLoc(null)
        // Common codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
        const msg =
          err?.code === 1
            ? 'Location permission denied. Please allow access and try again.'
            : (err?.message || 'Unable to fetch location. Please try again.')
        setLocError(msg)
        setShowLocModal(true)
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 600000, // up to 10 min cached is OK
      }
    )
  }, [push])

  // Ask for location on mount
  React.useEffect(() => {
    requestLocation()
  }, [requestLocation])

  // Fetch nearby items when we have a location and radius + auto-refresh every 7s
  React.useEffect(() => {
    if (!loc) return
    let cancelled = false

    const fetchNearby = async () => {
      setLoading(true)
      try {
        const radiusKm = radiusM / 1000
        const list = await api.nearby({
          lat: loc.lat,
          lng: loc.lng,
          radiusKm,
          excludeUid: user?.uid,
        })
        if (!cancelled) setItems(list ?? [])
      } catch (e) {
        if (!cancelled) push({ type: 'error', message: 'Failed to load nearby requests' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // initial load
    fetchNearby()

    // refresh every 7 seconds
    const id = setInterval(fetchNearby, 5000)

    return () => { cancelled = true; clearInterval(id) }
  }, [loc, radiusM, user?.uid, api, push])

  // Compute distance (in metres) from user location to each request; memoized for performance
  // First filter OUT own requests, then compute distances
  const itemsWithDistance = React.useMemo(() => {
    if (!Array.isArray(items)) return []
    const base = (user?.uid ? items.filter(r => r?.uid !== user.uid) : items)

    if (!loc || typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') {
      return base.map(r => ({ ...r, __distance: null }))
    }
    const { lat: uLat, lng: uLng } = loc
    return base
      .map(r => {
        const hasCoords = typeof r?.lat === 'number' && typeof r?.lng === 'number'
        const m = hasCoords ? approxMeters(uLat, uLng, r.lat, r.lng) : null
        return { ...r, __distance: m }
      })
      // Optional: sort by nearest first
      .sort((a, b) => {
        if (a.__distance == null && b.__distance == null) return 0
        if (a.__distance == null) return 1
        if (b.__distance == null) return -1
        return a.__distance - b.__distance
      })
  }, [items, loc, user?.uid])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm">Radius (metres):</label>
        <select
          className="select select-bordered select-sm"
          value={radiusM}
          onChange={(e) => setRadiusM(Number(e.target.value))}
        >
          <option value={500}>500 m</option>
          <option value={600}>600 m</option>
          <option value={700}>700 m</option>
          <option value={800}>800 m</option>
          <option value={1000}>1000 m</option>
          <option value={50000}>50 km(test)</option>
        </select>
      </div>

      <div className="space-y-3">
        {itemsWithDistance.map(r => (
          <RequestCard
            key={r.id}
            r={r}
            rightSlot={
              <div className="flex flex-col sm:flex-row sm:items-center items-end gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="text-xs text-gray-500 order-2 sm:order-1">
                  {loc && typeof r.__distance === 'number'
                    ? formatMetres(r.__distance)
                    : (loc ? '—' : 'Location unavailable')}
                </span>
                <button
                  className="px-3 py-1 rounded border order-1 sm:order-2 w-full sm:w-auto"
                  onClick={() => navigate(`/chat/${r.id}`)}
                >
                  Chat
                </button>
              </div>
            }
          />
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500 mt-2">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">No requests around you yet.</p>
      )}

      {/* Simple modal for location permission */}
      {showLocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Location needed</h2>
            <p className="text-sm text-gray-600">
              We use your location to show nearby requests.
              {locError ? <> <br />{locError}</> : null}
            </p>
            <div className="mt-4 flex items-center gap-2 justify-end">
              <button
                className="px-3 py-2 rounded border"
                onClick={() => setShowLocModal(false)}
              >
                Close
              </button>
              <button
                className="px-3 py-2 rounded border"
                onClick={requestLocation}
              >
                Enable location
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Tip: If you previously blocked location, open your browser’s site settings to allow it.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
