import express from 'express';
import {
  createRequest,
  closeRequest,
  listMine,
  ensureMembership,
  removeMembership,
  deleteRequest,
  hasMembership,  
  listNearby
} from '../store-firestore.js';
import { haversineMeters } from '../utils/distance.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

/** POST /api/requests */
router.post('/', requireAuth, async (req, res) => {

  try {
    const user = req.user;
    const { item, platform, latitude, longitude, expiresInMinutes } = req.body || {};
    if (!item || !platform || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
      return res.status(400).json({ error: 'item, platform, latitude, longitude are required' });
    }
    const r = await createRequest({ item, platform, latitude, longitude, expiresInMinutes }, user);
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to create request' });
  }
});

/** POST /api/requests/:id/close */
router.post('/:id/close', async (req, res) => {

  try {
    const r = await closeRequest(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, request: r });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to close request' });
  }
});

/** DELETE /api/requests/:id */
router.delete('/:id', requireAuth, async (req, res) => {

  try {
    const result = await deleteRequest(req.params.id, req.user?.uid || null);
    if (!result.found) return res.status(404).json({ error: 'Not found' });
    if (result.permitted === false) return res.status(403).json({ error: 'Only owner can delete' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to delete request' });
  }
});

/** POST /api/requests/:id/join */
router.post('/:id/join', requireAuth, async (req, res) => {

  try {
    await ensureMembership(req.params.id, req.user?.uid || 'anon');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to join' });
  }
});

/** POST /api/requests/:id/leave */
router.post('/:id/leave', requireAuth, async (req, res) => {

  try {
    await removeMembership(req.params.id, req.user?.uid || 'anon');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to leave' });
  }
});
router.get('/:id/membership', async (req, res) => {

  try {
    const uid = req.user?.uid || null;      // if not signed in → false
    if (!uid) return res.json({ joined: false });

    const joined = await hasMembership(req.params.id, uid);
    res.json({ joined });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to check membership' });
  }
});

/** GET /api/requests/:id/memberships/self
 *  Fallback endpoint for older clients; same response shape.
 */
router.get('/:id/memberships/self', async (req, res) => {

  try {
    const uid = req.user?.uid || null;
    if (!uid) return res.json({ joined: false });

    const joined = await hasMembership(req.params.id, uid);
    res.json({ joined });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to check membership' });
  }
});
/** GET /api/requests/mine */
router.get('/mine', requireAuth, async (req, res) => {

  try {
    const uid = req.user?.uid;
    const list = await listMine(uid);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch mine' });
  }
});

/** GET /api/requests/nearby?lat&lng&radiusKm */
router.get('/nearby', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm || 1);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'lat and lng are required numeric values' });
    }
    const list = await listNearby(lat, lng, radiusKm, req.user?.uid || null, haversineMeters);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch nearby' });
  }
});

export default router;
