import { Router } from 'express';
import { db, Timestamp, FieldValue } from '../config/firebase.js';
import { geobounds, geohashFor, distanceM } from '../services/geo.js';
import { createRequestSchema, nearbySchema } from '../utils/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Create a request (auth required) */
router.post('/', requireAuth, async (req, res) => {
  const { error, value } = createRequestSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { item, platform, latitude, longitude, expiresInMinutes } = value;
  const geohash = geohashFor(latitude, longitude);
  const now = Timestamp.now();
  const deleteAt = Timestamp.fromDate(new Date(Date.now() + expiresInMinutes * 60 * 1000));

  const payload = {
    uid: req.user.uid,
    displayName: req.user.name || 'User',
    item, platform, latitude, longitude, geohash,
    createdAt: now,
    deleteAt,
    status: 'open'
  };

  const ref = await db.collection('requests').add(payload);
  res.json({ id: ref.id, ...payload });
});

/** Close a request (owner only) */
router.post('/:id/close', requireAuth, async (req, res) => {
  const ref = db.collection('requests').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  if (doc.data().uid !== req.user.uid) return res.status(403).json({ error: 'Not owner' });

  await ref.update({ status: 'closed', closedAt: Timestamp.now() });
  res.json({ ok: true });
});

/** Join/Leave using UID-keyed docs */
router.post('/:id/join', requireAuth, async (req, res) => {
  const reqRef = db.collection('requests').doc(req.params.id);
  const snap = await reqRef.get();
  if (!snap.exists) return res.status(404).json({ error: 'Not found' });
  if (snap.data().status === 'closed') return res.status(400).json({ error: 'Closed' });

  const memberRef = reqRef.collection('joinedUsers').doc(req.user.uid);
  await memberRef.set({
    displayName: req.user.name || 'User',
    photoURL: req.user.picture || '',
    joinedAt: Timestamp.now()
  }, { merge: true });

  res.json({ ok: true });
});

router.post('/:id/leave', requireAuth, async (req, res) => {
  const memberRef = db.collection('requests').doc(req.params.id).collection('joinedUsers').doc(req.user.uid);
  await memberRef.delete();
  res.json({ ok: true });
});

/** Get my requests (auth required) */
router.get('/mine', requireAuth, async (req, res) => {
  const snap = await db.collection('requests')
    .where('uid', '==', req.user.uid)
    .orderBy('createdAt', 'desc')
    .get();

  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json(list);
});

/** Nearby search (no auth required) */
router.get('/nearby', async (req, res) => {
  const { error, value } = nearbySchema.validate(req.query, { convert: true });
  if (error) return res.status(400).json({ error: error.message });
  const { lat, lng, radiusKm } = value;
  const radiusM = radiusKm * 1000;

  const bounds = geobounds(lat, lng, radiusM);
  const queries = bounds.map(([start, end]) =>
    db.collection('requests').orderBy('geohash').startAt(start).endAt(end).get()
  );
  const snaps = await Promise.all(queries);

  const collected = [];
  for (const s of snaps) {
    for (const d of s.docs) {
      const data = d.data();
      if (data.status === 'closed') continue;
      const dist = distanceM(lat, lng, data.latitude, data.longitude);
      if (dist <= radiusM) collected.push({ id: d.id, ...data, distanceInM: dist });
    }
  }
  collected.sort((a, b) => (a.distanceInM - b.distanceInM) || ((b.createdAt?.toMillis()||0) - (a.createdAt?.toMillis()||0)));
  res.json(collected);
});

export default router;
