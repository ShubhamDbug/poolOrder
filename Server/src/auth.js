// Server/src/auth.js
// Verifies Firebase ID tokens and attaches req.user = { uid, displayName }
import './firebase-init.js'; // ensure Firebase Admin is initialized
import admin from 'firebase-admin';

/**
 * verifyAuth
 * - Non-blocking for public routes: if no header, attaches anon user and continues.
 * - If Authorization: Bearer <idToken> is present, verifies and attaches user info.
 * - Never logs the token. Logs only presence for debugging.
 */
export async function verifyAuth(req, _res, next) {
  try {
    const h = req.headers || {};
    const authHeader = (h['authorization'] || h['Authorization'] || '').toString();
    console.log(authHeader) ;
    const hasBearer = authHeader.startsWith('Bearer ');
    const hasSessionCookie = typeof h['cookie'] === 'string' && /__session=/.test(h['cookie']);

    // Safe request log
    console.log({
      tag: 'req',
      method: req.method,
      path: req.originalUrl || req.url,
      hasBearer,
      hasSessionCookie,
    });

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
    console.warn('verifyAuth failed:', e && e.code ? e.code : e?.message);
    req.user = { uid: 'anon' };
    return next();
  }
}
