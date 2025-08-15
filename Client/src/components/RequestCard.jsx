import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function RequestCard({ r, rightSlot }) {
  const navigate = useNavigate()
  const ms = (r.deleteAt?._seconds ? (r.deleteAt._seconds*1000 - Date.now()) : 0)
  const expired = ms <= 0
  const mins = Math.max(0, Math.floor(ms/60000))
  const secs = Math.max(0, Math.floor((ms%60000)/1000))
  return (
    <div className="p-4 rounded-2xl border bg-white shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">🛒 {r.item}</div>
          <div className="text-sm text-gray-500">Platform: {r.platform}</div>
        </div>
        <div className="text-right">
          {'distanceInM' in r && <div className="text-sm">{(r.distanceInM/1000).toFixed(2)} km</div>}
          <div className={`text-xs ${expired?'text-red-600':'text-gray-500'}`}>⏳ {expired ? 'expired' : `${mins}m ${secs}s`}</div>
        </div>
      </div>
      <div className="text-sm text-gray-600">By {r.displayName || 'User'}</div>
      <div className="flex gap-2 mt-auto">
        <button className="px-3 py-1 rounded-lg border" onClick={()=>navigate(`/chat/${r.id}`)}>Open Chat</button>
        {rightSlot}
      </div>
    </div>
  )
}
