
import './firebase-init.js';
import admin from 'firebase-admin';

export async function verifyAuth(req, _res, next) {
  try {
    const h = req.headers || {};
    const authHeader = (h['authorization'] || h['Authorization'] || '').toString();
    const hasBearer = authHeader.startsWith('Bearer ');

    if (!hasBearer) {
      // Treat as anonymous for public endpoints; protected routes should check req.user later
      req.user = { uid: 'anon' };
      return next();
    }

    const idToken = authHeader.slice('Bearer '.length).trim();
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Prefer name in token; fallback to user record/email prefix; then generic
    let displayName = decoded.name || '';
    if (!displayName && decoded.uid) {
      try {
        const rec = await admin.auth().getUser(decoded.uid);
        displayName = rec.displayName || (rec.email ? rec.email.split('@')[0] : '');
      } catch {
        // ignore
      }
    }

    req.user = {
      uid: decoded.uid,
      displayName: displayName || 'User',
      email: decoded.email || undefined,
    };

    return next();
  } catch (e) {
    // Keep failure non-fatal for public endpoints
    console.warn('verifyAuth failed:', e && e.code ? e.code : e?.message);
    req.user = { uid: 'anon' };
    return next();
  }
}

export function requireAuth(req, res, next) {
  const uid = req.user?.uid;
  if (!uid || uid === 'anon') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return next();
}
