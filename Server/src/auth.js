// Attaches req.user when Authorization: Bearer <idToken> is present.
// Never blocks public routes; missing/invalid token -> req.user = null.
import { auth as adminAuth } from './firebase-init.js';

export async function verifyAuth(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    const m = header.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      displayName:
        decoded.name ||
        decoded.email ||
        (decoded.uid ? `user_${decoded.uid.slice(0, 6)}` : 'user'),
    };
    return next();
  } catch (err) {
    // Do not hard-fail public endpoints; log and continue as anonymous.
    console.error('verifyAuth error:', err?.message || err);
    req.user = null;
    return next();
  }
}
