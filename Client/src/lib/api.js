// src/lib/api.js
import './firebase'; // ensure Firebase app is initialized
import { getAuth } from 'firebase/auth';

/**
 * Base URL of the backend, e.g. https://poolorderbackend1.onrender.com
 * Vite injects env vars with the VITE_ prefix.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

/**
 * Low-level request helper.
 * - When `authRequired` is true, ensures a fresh Firebase ID token is attached.
 * - You can also pass an explicit `token` to override (primarily used by ApiContext).
 * - Public endpoints should leave both `authRequired` and `token` unset.
 */
async function request(path, opts = {}) {
  const { method = 'GET', body, token, authRequired = false } = opts;

  const headers = { 'Content-Type': 'application/json' };

  // Resolve a token if needed
  let authToken = token ?? null;
  if (authRequired && !authToken) {
    const u = getAuth().currentUser;
    if (u) {
      // forceRefresh=true to avoid using an expired cached token
      authToken = await u.getIdToken(true);
    }
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    // If you ever send cookies, keep credentials. Not required for pure bearer tokens.
    credentials: 'omit',
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
  nearby: (params) => {
    const sp = new URLSearchParams();
    if (params && typeof params === 'object') {
      if (params.lat != null) sp.set('lat', String(params.lat));
      if (params.lng != null) sp.set('lng', String(params.lng));
      if (params.radiusKm != null) sp.set('radiusKm', String(params.radiusKm));
    }
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
