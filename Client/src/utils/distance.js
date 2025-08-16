// src/utils/distance.js
// Simple, fast equirectangular / flat-earth approximation for short distances.
// 1° latitude ≈ 111,320 m
// 1° longitude ≈ 111,320 * cos(latitude_in_radians) m (use user's latitude for cosine)

/**
 * Returns integer metres between (lat1, lon1) and (lat2, lon2).
 * Uses a flat-earth/equirectangular approximation for speed.
 * Safe and accurate enough for city-scale distances.
 */
export function approxMeters(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number'
  ) return null;

  const DEG_TO_M_LAT = 111_320; // metres per 1° latitude
  const latRad = (lat1 * Math.PI) / 180; // use user's latitude for longitude scaling

  const dLatM = (lat2 - lat1) * DEG_TO_M_LAT;
  const metresPerDegLon = DEG_TO_M_LAT * Math.cos(latRad);
  const dLonM = (lon2 - lon1) * metresPerDegLon;

  const dist = Math.sqrt(dLatM * dLatM + dLonM * dLonM);
  return Math.round(dist);
}

/**
 * Formats a metres integer like "842 m" or "1,230 m".
 */
export function formatMetres(m) {
  if (m == null || Number.isNaN(m)) return '—';
  try {
    return `${Number(m).toLocaleString()} m`;
  } catch {
    // fallback
    return `${m} m`;
  }
}

export default { approxMeters, formatMetres };
