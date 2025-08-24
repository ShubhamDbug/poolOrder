// src/components/RequestCard.jsx
import React from 'react'
import { Link } from 'react-router-dom'


export default function RequestCard({ r, rightSlot }) {
return (
<div className="card p-4 flex items-center justify-between gap-4 hover:shadow-md transition">
<div className="min-w-0">
<div className="flex items-center gap-2 flex-wrap">
<div className="font-medium truncate">{r.item}</div>
{r.platform ? (
<span className="chip">{r.platform}</span>
) : null}
</div>
<div className="mt-1 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
{r.displayName && <span>by {r.displayName}</span>}
{r.id && (
<Link to={`/chat/${r.id}`} className="text-indigo-600 hover:text-indigo-700">Open chat →</Link>
)}
</div>
</div>
{rightSlot || null}
</div>
)
}