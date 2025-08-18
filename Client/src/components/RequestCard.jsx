// src/components/RequestCard.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function RequestCard({ r, rightSlot }) {
  return (
    <div className="p-3 rounded-lg border flex items-center justify-between gap-3">
      <div>
        <div className="font-medium">{r.item} {r.platform ? <span className="text-xs text-gray-500">({r.platform})</span> : null}</div>
        {r.distanceKm != null && <div className="text-xs text-gray-500">~{r.distanceKm.toFixed(1)} m away</div>}
        <span  className="text-sm ">by {r.displayName}</span>
      </div>
      {rightSlot || null}
    </div>
  )
}
