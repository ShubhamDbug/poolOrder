// src/lib/api.js
import './firebase'; // ensure Firebase app is initialized
import { getAuth } from 'firebase/auth';
import {db} from "./firebase";
/**
 * Base URL of the backend, e.g. https://poolorderbackend1.onrender.com
 * Vite injects env vars with the VITE_ prefix.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
const GEO_CACHE_KEY = 'geo:last';

/** Try browser geolocation, then fall back to a cached last-known location. */
async function getLocationOrCached() {
  // 1) Try the Geolocation API first (HTTPS origin required)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,       // 8s to avoid hanging the UI
          maximumAge: 600000,  // up to 10 minutes 'fresh' is fine
        });
      });
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        source: 'geolocation',
      };
      // cache last known good location (non-blocking)
      try {
        localStorage.setItem(
          GEO_CACHE_KEY,
          JSON.stringify({ lat: coords.lat, lng: coords.lng, ts: Date.now() })
        );
      } catch {}
      return coords;
    } catch {
      // swallow and try cache below
    }
  }

  // 2) Fallback: use cached last-known coordinates if available
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (raw) {
      const { lat, lng } = JSON.parse(raw);
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng, source: 'cache' };
      }
    }
  } catch {}

  // 3) Nothing to use
  const e = new Error('Location unavailable');
  e.code = 'GEO_UNAVAILABLE';
  throw e;
}

/**
 * Low-level request helper.
 * - When `authRequired` is true, ensures a fresh Firebase ID token is attached.
 * - You can also pass an explicit `token` to override (primarily used by ApiContext).
 * - Public endpoints should leave both `authRequired` and `token` unset.
 */
async function request(path, 
  opts = {}) {
  const { method = 'GET', body, token, authRequired = true } = opts;

  const headers = { 'Content-Type': 'application/json' };

  // Resolve a token if needed
  let authToken = token ?? null;
  if (authRequired && !authToken) {
    const auth = getAuth();
    const u = auth.currentUser;
    console.log('[Auth Debug] Current User:', u ? 'exists' : 'null');
    if (u) {
      try {
        // forceRefresh=true to avoid using an expired cached token
        authToken = await u.getIdToken(true);
        console.log('[Auth Debug] Got fresh token:', authToken ? 'yes' : 'no');
      } catch (e) {
        console.error('[Auth Debug] Token Error:', e);
      }
    } else {
      console.log('[Auth Debug] No current user in Firebase Auth');
    }
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    console.log('[Auth Debug] Added token to headers');
    console.log('[Auth Debug] Token preview:', authToken.substring(0, 20) + '...');
  } else {
    console.log('[Auth Debug] No token available for request');
  }

  const url = `${BASE_URL}${path}`;
  console.log('[Auth Debug] Final headers:', headers);
  console.log('[Auth Debug] Request URL:', url);
  
  console.log('[Auth Debug] Making request:', {
    url,
    method,
    hasAuth: !!headers.Authorization,
    authHeader: headers.Authorization ? `${headers.Authorization.substring(0, 20)}...` : 'none'
  });

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'omit', // Changed from 'include' to 'omit'
    mode: 'cors',
  });
 

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message = (isJson && data && (data.error || data.message)) || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.response = data;
    throw err;
  }

  return data;
}

export const api = {
  // Public -------------------------
  /**
   * Nearby requests. If lat/lng are not provided, we will:
   *  - try Geolocation API (fast, with 8s timeout)
   *  - fall back to last cached coordinates (if any)
   * This prevents the UI from being stuck on “Location not available yet”.
   */
  nearby: async (params) => {
    let { lat, lng, radiusKm } = params || {};
    if (lat == null || lng == null) {
      const got = await getLocationOrCached(); // throws only if absolutely unavailable
      lat = lat ?? got.lat;
      lng = lng ?? got.lng;
      // optional: you can log the source without PII
      // console.log('Nearby using location source:', got.source);
    }

    const sp = new URLSearchParams();
    sp.set('lat', String(lat));
    sp.set('lng', String(lng));
    if (radiusKm != null) sp.set('radiusKm', String(radiusKm));

    return request(`/api/requests/nearby?${sp.toString()}`);
  },

  // Protected ----------------------
  createRequest: (body, token) =>
    request('/api/requests', { method: 'POST', body, token, authRequired: true }),

  myRequests: (token) =>
    request('/api/requests/mine', { token, authRequired: true }),

  closeRequest: (id, token) =>
    request(`/api/requests/${id}/close`, { method: 'POST', token, authRequired: true }),

  deleteRequest: (id, token) =>
    request(`/api/requests/${id}`, { method: 'DELETE', token, authRequired: true }),

  getRequest: (id, token) =>
    request(`/api/requests/${id}`, { token, authRequired: true }),

  getMyMembership: (id, token) =>
    request(`/api/requests/${id}/membership`, { token, authRequired: true }),

  joinRequest: (id, token) =>
    request(`/api/requests/${id}/join`, { method: 'POST', token, authRequired: true }),

  leaveRequest: (id, token) =>
    request(`/api/requests/${id}/leave`, { method: 'POST', token, authRequired: true }),

  listMessages: (id, token) =>
    request(`/api/messages/${id}`, { token, authRequired: true }),

  sendMessage: (id, text, token) =>
    request(`/api/messages/${id}`, { method: 'POST', body: { text }, token, authRequired: true }),
};

export default { request, api };
