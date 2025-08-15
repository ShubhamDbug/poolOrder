import { auth } from '../config/firebase.js';

export async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    // accept both 'Bearer <token>' and the raw token
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : (hdr || req.query?.token || req.headers['x-access-token']);
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded; // { uid, name, picture, ... }
    next();
  } catch (e) {
    console.error('Auth verify failed:', e && e.message ? e.message : e);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
