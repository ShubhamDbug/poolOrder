import { Router } from 'express';
import { db, Timestamp } from '../config/firebase.js';
import { requireAuth } from '../middleware/auth.js';
import { chatMessageSchema } from '../utils/validate.js';

const router = Router();

/** List last 100 messages for a request */
// messages.js (secure)
router.get('/:requestId', requireAuth, async (req, res) => {
  const reqRef = db.collection('requests').doc(req.params.requestId);
  const doc = await reqRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });

  const isOwner = doc.data().uid === req.user.uid;
  const joined = await reqRef.collection('joinedUsers').doc(req.user.uid).get();
  if (!isOwner && !joined.exists) return res.status(403).json({ error: 'Not a member' });

  const snap = await reqRef.collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
  res.json(list);
});

/** Post a message (must be owner or joined member) */
router.post('/:requestId', requireAuth, async (req, res) => {
  const { error, value } = chatMessageSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const reqRef = db.collection('requests').doc(req.params.requestId);
  const doc = await reqRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });

  const isOwner = doc.data().uid === req.user.uid;
  const joined = await reqRef.collection('joinedUsers').doc(req.user.uid).get();
  if (!isOwner && !joined.exists) return res.status(403).json({ error: 'Not a member' });

  const payload = {
    uid: req.user.uid,
    displayName: req.user.name || 'User',
    text: value.text,
    timestamp: Timestamp.now()
  };
  const msgRef = await reqRef.collection('messages').add(payload);
  res.json({ id: msgRef.id, ...payload });
});

export default router;
