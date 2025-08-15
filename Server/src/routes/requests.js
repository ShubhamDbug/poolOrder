import express from 'express';
import {
  createRequest,
  closeRequest,
  listMine,
  ensureMembership,
  removeMembership
} from '../store.js';
import { haversineMeters } from '../utils/distance.js';
import { db } from '../store.js';

const router = express.Router();

// POST /api/requests — create a request
router.post('/', (req, res) => {
  const user = req.user;
  const { item, platform, latitude, longitude, expiresInMinutes } = req.body || {};
  if (!item || !platform || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
    return res.status(400).json({ error: 'item, platform, latitude, longitude are required' });
  }
  const r = createRequest({ item, platform, latitude, longitude, expiresInMinutes }, user);
  res.json(r);
});

// POST /api/requests/:id/close — mark as expired now
router.post('/:id/close', (req, res) => {
  const r = closeRequest(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true, request: r });
});

// POST /api/requests/:id/join — simple membership flag
router.post('/:id/join', (req, res) => {
  ensureMembership(req.params.id, req.user?.uid || 'anon');
  res.json({ ok: true });
});

// POST /api/requests/:id/leave — remove membership
router.post('/:id/leave', (req, res) => {
  removeMembership(req.params.id, req.user?.uid || 'anon');
  res.json({ ok: true });
});

// GET /api/requests/mine — requests created by current user
router.get('/mine', (req, res) => {
  const uid = req.user?.uid || 'anon';
  res.json(listMine(uid));
});

// GET /api/requests/nearby?lat=..&lng=..&radiusKm=..
router.get('/nearby', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radiusKm || 1);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'lat and lng are required numeric values' });
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const list = [];
  for (const r of db.requests) {
    if (r.deleteAt?._seconds <= nowSec) continue; // expired
    const d = haversineMeters(lat, lng, r.lat, r.lng);
    if (d <= radiusKm * 1000) {
      list.push({ ...r, distanceInM: Math.round(d) });
    }
  }
  list.sort((a, b) => (a.distanceInM || 0) - (b.distanceInM || 0));
  res.json(list);
});

export default router;
