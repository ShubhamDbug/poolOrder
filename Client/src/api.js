const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let err = 'Request failed';
    try {
      const j = await res.json();
      if (j?.error) err = j.error;
    } catch {}
    throw new Error(err);
  }
  return res.json();
}

export async function createRequest(data, token) {
  return req('/api/requests', { method: 'POST', body: data, token });
}

export async function closeRequest(id, token) {
  return req(`/api/requests/${id}/close`, { method: 'POST', token });
}

export async function deleteRequest(id, token) {
  return req(`/api/requests/${id}`, { method: 'DELETE', token });
}

export async function joinRequest(id, token) {
  return req(`/api/requests/${id}/join`, { method: 'POST', token });
}

export async function leaveRequest(id, token) {
  return req(`/api/requests/${id}/leave`, { method: 'POST', token });
}

export async function myRequests(token) {
  return req('/api/requests/mine', { token });
}

export async function nearby(lat, lng, radiusKm, token) {
  const q = new URLSearchParams({ lat, lng, radiusKm });
  return req(`/api/requests/nearby?${q.toString()}`, { token });
}

export async function listMessages(requestId, token) {
  return req(`/api/messages/${requestId}`, { token });
}

export async function sendMessage(requestId,user, text, token) {
  return req(`/api/messages/${requestId}`, {
    method: 'POST',
    body: { text },
    token,
  });
}

