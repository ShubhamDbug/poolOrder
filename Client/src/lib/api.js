// src/lib/api.js
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function request(path, opts = {}) {
  const { method = 'GET', body, token, authRequired = false } = opts;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (authRequired && !token) throw new Error('Auth required');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let err = `Request failed (${res.status})`;
    try { /* parse server error if available */ } catch {}
    throw new Error(err);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // ✅ add optional excludeUid param (server may ignore; client still filters)
  nearby: (q) => {
    const params = new URLSearchParams({
      lat: String(q.lat),
      lng: String(q.lng),
      radiusKm: String(q.radiusKm),
    });
    if (q?.excludeUid) params.set('excludeUid', q.excludeUid);
    return request(`/api/requests/nearby?${params.toString()}`);
  },

  createRequest: (body, token) =>
    request(`/api/requests`, { method: 'POST', body, token, authRequired: true }),

  myRequests: (token) =>
    request(`/api/requests/mine`, { token, authRequired: true }),

  closeRequest: (id, token) =>
    request(`/api/requests/${id}/close`, { method: 'POST', token, authRequired: true }),

  deleteRequest: (id, token) =>
    request(`/api/requests/${id}`, { method: 'DELETE', token, authRequired: true }),

  getRequest: (id, token) =>
    request(`/api/requests/${id}`, { token }),

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
