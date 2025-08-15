import express from 'express';
import { hasMembership, listMessages, addMessage } from '../store.js';

const router = express.Router({ mergeParams: true });

// GET /api/messages/:requestId — list messages
router.get('/:requestId', (req, res) => {
  const { requestId } = req.params;
  // Match the UI: require join before viewing chat
  if (!hasMembership(requestId, req.user?.uid || 'anon')) {
    return res.status(403).json({ error: 'Join required to view messages' });
  }
  res.json(listMessages(requestId));
});

// POST /api/messages/:requestId — send message
router.post('/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
  if (!hasMembership(requestId, req.user?.uid || 'anon')) {
    return res.status(403).json({ error: 'Join required to chat' });
  }
  const m = addMessage(requestId, {
    uid: req.user?.uid || 'anon',
    displayName: req.user?.displayName || 'User',
    text
  });
  res.json(m);
});

export default router;
