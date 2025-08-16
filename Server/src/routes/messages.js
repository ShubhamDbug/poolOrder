import express from 'express';
import {
  hasMembership,
  isOwner,
  listMessages,
  addMessage,
  isRequestActive,
  cleanupExpiredRequests
} from '../store-firestore.js';

const router = express.Router({ mergeParams: true });

/** GET /api/messages/:requestId */
router.get('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const uid = req.user?.uid || 'anon';

    // 🔒 reject if request expired or missing
    const status = await isRequestActive(requestId);
    if (!status.exists) return res.status(404).json({ error: 'Request not found' });
    if (!status.active) {
      // opportunistic cleanup; non-blocking if you prefer
      await cleanupExpiredRequests(100);
      return res.status(410).json({ error: 'Request expired' });
    }

    // ✅ owner OR member can read
    const owner = await isOwner(requestId, uid);
    if (!owner && !(await hasMembership(requestId, uid))) {
      return res.status(403).json({ error: 'Join required to view messages' });
    }

    const list = await listMessages(requestId);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load messages' });
  }
});

/** POST /api/messages/:requestId */
router.post('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const uid = req.user?.uid || 'anon';
    const text = String(req.body?.text || '').trim();

    // 🔒 reject if request expired or missing
    const status = await isRequestActive(requestId);
    if (!status.exists) return res.status(404).json({ error: 'Request not found' });
    if (!status.active) {
      await cleanupExpiredRequests(100);
      return res.status(410).json({ error: 'Request expired' });
    }

    // ✅ owner OR member can send
    const owner = await isOwner(requestId, uid);
    if (!owner && !(await hasMembership(requestId, uid))) {
      return res.status(403).json({ error: 'Join required to send messages' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const m = await addMessage(requestId, {
      uid,
      displayName: req.user?.displayName || "User",
      text
    });
    console.log(m) ;
    res.json(m);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to send message' });
  }
});

export default router;
